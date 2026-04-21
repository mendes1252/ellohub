-- ============================================================
-- FUNÇÕES DO BANCO
-- ============================================================

CREATE OR REPLACE FUNCTION detect_conflicts(p_family_id UUID, p_date DATE)
RETURNS TABLE (
  event_a_id UUID, event_a_title TEXT, event_a_member UUID,
  event_b_id UUID, event_b_title TEXT, event_b_member UUID,
  overlap_start TIMESTAMPTZ, overlap_end TIMESTAMPTZ
) AS $$
BEGIN
  RETURN QUERY
  SELECT
    a.id, a.title, a.member_id,
    b.id, b.title, b.member_id,
    GREATEST(a.starts_at, b.starts_at),
    LEAST(a.ends_at, b.ends_at)
  FROM events a
  JOIN events b ON a.family_id = b.family_id
    AND a.id < b.id
    AND tstzrange(a.starts_at, a.ends_at) && tstzrange(b.starts_at, b.ends_at)
  WHERE a.family_id = p_family_id
    AND a.starts_at::date = p_date
    AND a.all_day = FALSE AND b.all_day = FALSE;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE OR REPLACE FUNCTION find_quality_windows(
  p_family_id UUID, p_date DATE, p_min_duration INTERVAL DEFAULT '30 minutes'
)
RETURNS TABLE (window_start TIMESTAMPTZ, window_end TIMESTAMPTZ, duration INTERVAL) AS $$
DECLARE
  day_start TIMESTAMPTZ := p_date::TIMESTAMPTZ + INTERVAL '7 hours';
  day_end TIMESTAMPTZ := p_date::TIMESTAMPTZ + INTERVAL '22 hours';
BEGIN
  RETURN QUERY
  WITH busy_times AS (
    SELECT starts_at, ends_at FROM events
    WHERE family_id = p_family_id AND starts_at::date = p_date AND all_day = FALSE
    ORDER BY starts_at
  ),
  gaps AS (
    SELECT COALESCE(LAG(ends_at) OVER (ORDER BY starts_at), day_start) AS gap_start, starts_at AS gap_end FROM busy_times
    UNION ALL
    SELECT MAX(ends_at), day_end FROM busy_times
  )
  SELECT gap_start, gap_end, gap_end - gap_start
  FROM gaps
  WHERE gap_end > gap_start
    AND (gap_end - gap_start) >= p_min_duration
    AND gap_start >= day_start AND gap_end <= day_end
  ORDER BY gap_start;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE OR REPLACE FUNCTION count_today_notifications(p_member_id UUID)
RETURNS INT AS $$
  SELECT COUNT(*)::INT FROM notifications WHERE member_id = p_member_id AND sent_at::date = CURRENT_DATE;
$$ LANGUAGE sql SECURITY DEFINER STABLE;

CREATE OR REPLACE FUNCTION count_monthly_events(p_family_id UUID)
RETURNS INT AS $$
  SELECT COUNT(*)::INT FROM events
  WHERE family_id = p_family_id
    AND created_at >= date_trunc('month', CURRENT_DATE)
    AND synced_from = 'manual';
$$ LANGUAGE sql SECURITY DEFINER STABLE;

CREATE OR REPLACE FUNCTION accept_invitation(p_token TEXT, p_user_id UUID)
RETURNS UUID AS $$
DECLARE
  v_invitation RECORD;
  v_member_id UUID;
  v_color TEXT;
  v_used_colors TEXT[];
  v_available_colors TEXT[] := ARRAY['#3D405B', '#F49AC2', '#FFC145', '#70D6E3'];
BEGIN
  SELECT * INTO v_invitation FROM invitations
  WHERE token = p_token AND status = 'pending' AND expires_at > NOW();
  IF NOT FOUND THEN RAISE EXCEPTION 'Convite inválido ou expirado'; END IF;

  SELECT ARRAY_AGG(color) INTO v_used_colors FROM members WHERE family_id = v_invitation.family_id;

  SELECT unnest INTO v_color FROM unnest(v_available_colors)
  WHERE unnest != ALL(COALESCE(v_used_colors, ARRAY[]::TEXT[])) LIMIT 1;

  IF v_color IS NULL THEN v_color := '#3D405B'; END IF;

  INSERT INTO members (family_id, user_id, role, display_name, color)
  VALUES (v_invitation.family_id, p_user_id, 'member', split_part(v_invitation.email, '@', 1), v_color)
  RETURNING id INTO v_member_id;

  UPDATE invitations SET status = 'accepted', accepted_at = NOW() WHERE id = v_invitation.id;

  RETURN v_member_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
