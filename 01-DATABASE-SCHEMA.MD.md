# Ello - Schema do Banco de Dados (Supabase PostgreSQL)

## Arquivo: `supabase/migrations/001_schema.sql`

```sql
-- ============================================================
-- ELLO - Schema Principal
-- Supabase PostgreSQL com Row Level Security
-- ============================================================

-- Extensões necessárias
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ============================================================
-- ENUMS
-- ============================================================

CREATE TYPE member_role AS ENUM ('admin', 'member', 'child');
CREATE TYPE event_category AS ENUM ('saude', 'lazer', 'escola', 'trabalho', 'outro');
CREATE TYPE task_status AS ENUM ('pending', 'done');
CREATE TYPE invitation_status AS ENUM ('pending', 'accepted', 'expired');
CREATE TYPE subscription_status AS ENUM ('free', 'trial', 'active', 'cancelled', 'past_due');
CREATE TYPE notification_type AS ENUM ('morning_summary', 'event_reminder', 'conflict_alert', 'task_assigned', 'member_joined', 'weekly_report');

-- ============================================================
-- TABELAS
-- ============================================================

-- Família (núcleo principal)
CREATE TABLE families (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT NOT NULL,
  created_by UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  subscription_status subscription_status NOT NULL DEFAULT 'free',
  stripe_customer_id TEXT,
  stripe_subscription_id TEXT,
  trial_ends_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Membros da família
CREATE TABLE members (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  family_id UUID NOT NULL REFERENCES families(id) ON DELETE CASCADE,
  user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL, -- NULL para filhos
  role member_role NOT NULL DEFAULT 'member',
  display_name TEXT NOT NULL,
  color TEXT NOT NULL, -- hex da Synergy Palette
  avatar_url TEXT,
  quiet_hours_start TIME DEFAULT '22:00',
  quiet_hours_end TIME DEFAULT '07:00',
  max_daily_notifications INT DEFAULT 3,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  
  UNIQUE(family_id, user_id),
  UNIQUE(family_id, color)
);

-- Eventos do calendário
CREATE TABLE events (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  family_id UUID NOT NULL REFERENCES families(id) ON DELETE CASCADE,
  member_id UUID NOT NULL REFERENCES members(id) ON DELETE CASCADE,
  created_by UUID NOT NULL REFERENCES members(id),
  title TEXT NOT NULL,
  description TEXT,
  starts_at TIMESTAMPTZ NOT NULL,
  ends_at TIMESTAMPTZ NOT NULL,
  all_day BOOLEAN NOT NULL DEFAULT FALSE,
  category event_category NOT NULL DEFAULT 'outro',
  location TEXT,
  synced_from TEXT, -- 'google_calendar', 'manual', etc.
  external_id TEXT, -- ID no calendário externo
  recurrence_rule TEXT, -- RRULE string (futuro)
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  
  CONSTRAINT valid_time_range CHECK (ends_at > starts_at)
);

-- Tarefas compartilhadas
CREATE TABLE tasks (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  family_id UUID NOT NULL REFERENCES families(id) ON DELETE CASCADE,
  list_name TEXT NOT NULL DEFAULT 'Geral',
  assigned_to UUID REFERENCES members(id) ON DELETE SET NULL,
  created_by UUID NOT NULL REFERENCES members(id),
  title TEXT NOT NULL,
  notes TEXT,
  status task_status NOT NULL DEFAULT 'pending',
  due_date DATE,
  completed_at TIMESTAMPTZ,
  position INT NOT NULL DEFAULT 0, -- para ordenação drag-and-drop
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Convites para família
CREATE TABLE invitations (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  family_id UUID NOT NULL REFERENCES families(id) ON DELETE CASCADE,
  invited_by UUID NOT NULL REFERENCES members(id),
  email TEXT NOT NULL,
  token TEXT NOT NULL UNIQUE DEFAULT encode(gen_random_bytes(32), 'hex'),
  status invitation_status NOT NULL DEFAULT 'pending',
  expires_at TIMESTAMPTZ NOT NULL DEFAULT (NOW() + INTERVAL '7 days'),
  accepted_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Log de notificações
CREATE TABLE notifications (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  member_id UUID NOT NULL REFERENCES members(id) ON DELETE CASCADE,
  family_id UUID NOT NULL REFERENCES families(id) ON DELETE CASCADE,
  type notification_type NOT NULL,
  title TEXT NOT NULL,
  message TEXT NOT NULL,
  data JSONB, -- metadados extras (event_id, task_id, etc.)
  read_at TIMESTAMPTZ,
  sent_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Push subscription (Web Push API)
CREATE TABLE push_subscriptions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  member_id UUID NOT NULL REFERENCES members(id) ON DELETE CASCADE,
  endpoint TEXT NOT NULL,
  p256dh TEXT NOT NULL,
  auth_key TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  
  UNIQUE(member_id, endpoint)
);

-- ============================================================
-- ÍNDICES
-- ============================================================

CREATE INDEX idx_members_family ON members(family_id);
CREATE INDEX idx_members_user ON members(user_id);
CREATE INDEX idx_events_family ON events(family_id);
CREATE INDEX idx_events_member ON events(member_id);
CREATE INDEX idx_events_time ON events(family_id, starts_at, ends_at);
CREATE INDEX idx_events_category ON events(family_id, category);
CREATE INDEX idx_tasks_family ON tasks(family_id);
CREATE INDEX idx_tasks_assigned ON tasks(assigned_to);
CREATE INDEX idx_tasks_status ON tasks(family_id, status);
CREATE INDEX idx_invitations_token ON invitations(token);
CREATE INDEX idx_invitations_email ON invitations(email);
CREATE INDEX idx_notifications_member ON notifications(member_id);
CREATE INDEX idx_notifications_unread ON notifications(member_id, read_at) WHERE read_at IS NULL;
CREATE INDEX idx_notifications_daily ON notifications(member_id, sent_at);

-- ============================================================
-- TRIGGERS
-- ============================================================

-- Auto-update updated_at
CREATE OR REPLACE FUNCTION update_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER families_updated_at BEFORE UPDATE ON families FOR EACH ROW EXECUTE FUNCTION update_updated_at();
CREATE TRIGGER members_updated_at BEFORE UPDATE ON members FOR EACH ROW EXECUTE FUNCTION update_updated_at();
CREATE TRIGGER events_updated_at BEFORE UPDATE ON events FOR EACH ROW EXECUTE FUNCTION update_updated_at();
CREATE TRIGGER tasks_updated_at BEFORE UPDATE ON tasks FOR EACH ROW EXECUTE FUNCTION update_updated_at();

-- Auto-set completed_at quando task muda para done
CREATE OR REPLACE FUNCTION set_task_completed_at()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.status = 'done' AND OLD.status = 'pending' THEN
    NEW.completed_at = NOW();
  ELSIF NEW.status = 'pending' AND OLD.status = 'done' THEN
    NEW.completed_at = NULL;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER task_completed BEFORE UPDATE ON tasks FOR EACH ROW EXECUTE FUNCTION set_task_completed_at();
```

---

## Arquivo: `supabase/migrations/002_rls_policies.sql`

```sql
-- ============================================================
-- ROW LEVEL SECURITY (RLS)
-- Isolamento total por family_id
-- ============================================================

ALTER TABLE families ENABLE ROW LEVEL SECURITY;
ALTER TABLE members ENABLE ROW LEVEL SECURITY;
ALTER TABLE events ENABLE ROW LEVEL SECURITY;
ALTER TABLE tasks ENABLE ROW LEVEL SECURITY;
ALTER TABLE invitations ENABLE ROW LEVEL SECURITY;
ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE push_subscriptions ENABLE ROW LEVEL SECURITY;

-- Helper: retorna family_ids do usuário autenticado
CREATE OR REPLACE FUNCTION get_user_family_ids()
RETURNS SETOF UUID AS $$
  SELECT family_id FROM members WHERE user_id = auth.uid()
$$ LANGUAGE sql SECURITY DEFINER STABLE;

-- Helper: retorna member_ids do usuário autenticado
CREATE OR REPLACE FUNCTION get_user_member_ids()
RETURNS SETOF UUID AS $$
  SELECT id FROM members WHERE user_id = auth.uid()
$$ LANGUAGE sql SECURITY DEFINER STABLE;

-- ─── FAMILIES ───
CREATE POLICY "Users can view their families"
  ON families FOR SELECT
  USING (id IN (SELECT get_user_family_ids()));

CREATE POLICY "Users can create families"
  ON families FOR INSERT
  WITH CHECK (created_by = auth.uid());

CREATE POLICY "Admins can update their family"
  ON families FOR UPDATE
  USING (id IN (SELECT family_id FROM members WHERE user_id = auth.uid() AND role = 'admin'));

-- ─── MEMBERS ───
CREATE POLICY "Users can view family members"
  ON members FOR SELECT
  USING (family_id IN (SELECT get_user_family_ids()));

CREATE POLICY "Admins can insert members"
  ON members FOR INSERT
  WITH CHECK (family_id IN (SELECT family_id FROM members WHERE user_id = auth.uid() AND role = 'admin'));

CREATE POLICY "Admins can update members"
  ON members FOR UPDATE
  USING (family_id IN (SELECT family_id FROM members WHERE user_id = auth.uid() AND role = 'admin'))
  WITH CHECK (family_id IN (SELECT family_id FROM members WHERE user_id = auth.uid() AND role = 'admin'));

CREATE POLICY "Users can update own profile"
  ON members FOR UPDATE
  USING (user_id = auth.uid());

CREATE POLICY "Admins can delete members"
  ON members FOR DELETE
  USING (family_id IN (SELECT family_id FROM members WHERE user_id = auth.uid() AND role = 'admin'));

-- ─── EVENTS ───
CREATE POLICY "Users can view family events"
  ON events FOR SELECT
  USING (family_id IN (SELECT get_user_family_ids()));

CREATE POLICY "Users can create events in their family"
  ON events FOR INSERT
  WITH CHECK (family_id IN (SELECT get_user_family_ids()));

CREATE POLICY "Users can update family events"
  ON events FOR UPDATE
  USING (family_id IN (SELECT get_user_family_ids()));

CREATE POLICY "Users can delete family events"
  ON events FOR DELETE
  USING (family_id IN (SELECT get_user_family_ids()));

-- ─── TASKS ───
CREATE POLICY "Users can view family tasks"
  ON tasks FOR SELECT
  USING (family_id IN (SELECT get_user_family_ids()));

CREATE POLICY "Users can create tasks"
  ON tasks FOR INSERT
  WITH CHECK (family_id IN (SELECT get_user_family_ids()));

CREATE POLICY "Users can update family tasks"
  ON tasks FOR UPDATE
  USING (family_id IN (SELECT get_user_family_ids()));

CREATE POLICY "Users can delete family tasks"
  ON tasks FOR DELETE
  USING (family_id IN (SELECT get_user_family_ids()));

-- ─── INVITATIONS ───
CREATE POLICY "Admins can view invitations"
  ON invitations FOR SELECT
  USING (family_id IN (SELECT family_id FROM members WHERE user_id = auth.uid() AND role = 'admin'));

CREATE POLICY "Admins can create invitations"
  ON invitations FOR INSERT
  WITH CHECK (family_id IN (SELECT family_id FROM members WHERE user_id = auth.uid() AND role = 'admin'));

CREATE POLICY "Anyone can view invitation by token"
  ON invitations FOR SELECT
  USING (true); -- token lookup precisa ser público; segurança via token único

-- ─── NOTIFICATIONS ───
CREATE POLICY "Users can view own notifications"
  ON notifications FOR SELECT
  USING (member_id IN (SELECT get_user_member_ids()));

CREATE POLICY "Users can update own notifications (mark read)"
  ON notifications FOR UPDATE
  USING (member_id IN (SELECT get_user_member_ids()));

-- ─── PUSH SUBSCRIPTIONS ───
CREATE POLICY "Users can manage own push subscriptions"
  ON push_subscriptions FOR ALL
  USING (member_id IN (SELECT get_user_member_ids()));
```

---

## Arquivo: `supabase/migrations/003_functions.sql`

```sql
-- ============================================================
-- FUNÇÕES DO BANCO
-- ============================================================

-- Detectar conflitos de agenda para uma família
CREATE OR REPLACE FUNCTION detect_conflicts(p_family_id UUID, p_date DATE)
RETURNS TABLE (
  event_a_id UUID,
  event_a_title TEXT,
  event_a_member UUID,
  event_b_id UUID,
  event_b_title TEXT,
  event_b_member UUID,
  overlap_start TIMESTAMPTZ,
  overlap_end TIMESTAMPTZ
) AS $$
BEGIN
  RETURN QUERY
  SELECT
    a.id AS event_a_id,
    a.title AS event_a_title,
    a.member_id AS event_a_member,
    b.id AS event_b_id,
    b.title AS event_b_title,
    b.member_id AS event_b_member,
    GREATEST(a.starts_at, b.starts_at) AS overlap_start,
    LEAST(a.ends_at, b.ends_at) AS overlap_end
  FROM events a
  JOIN events b ON a.family_id = b.family_id
    AND a.id < b.id  -- evita duplicatas
    AND tstzrange(a.starts_at, a.ends_at) && tstzrange(b.starts_at, b.ends_at)
  WHERE a.family_id = p_family_id
    AND a.starts_at::date = p_date
    AND a.all_day = FALSE
    AND b.all_day = FALSE;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Encontrar janelas de qualidade (tempo livre em comum)
CREATE OR REPLACE FUNCTION find_quality_windows(
  p_family_id UUID,
  p_date DATE,
  p_min_duration INTERVAL DEFAULT '30 minutes'
)
RETURNS TABLE (
  window_start TIMESTAMPTZ,
  window_end TIMESTAMPTZ,
  duration INTERVAL
) AS $$
DECLARE
  day_start TIMESTAMPTZ := p_date::TIMESTAMPTZ + INTERVAL '7 hours';
  day_end TIMESTAMPTZ := p_date::TIMESTAMPTZ + INTERVAL '22 hours';
BEGIN
  RETURN QUERY
  WITH busy_times AS (
    SELECT starts_at, ends_at
    FROM events
    WHERE family_id = p_family_id
      AND starts_at::date = p_date
      AND all_day = FALSE
    ORDER BY starts_at
  ),
  gaps AS (
    SELECT
      COALESCE(LAG(ends_at) OVER (ORDER BY starts_at), day_start) AS gap_start,
      starts_at AS gap_end
    FROM busy_times
    UNION ALL
    SELECT
      MAX(ends_at),
      day_end
    FROM busy_times
  )
  SELECT
    gap_start AS window_start,
    gap_end AS window_end,
    gap_end - gap_start AS duration
  FROM gaps
  WHERE gap_end > gap_start
    AND (gap_end - gap_start) >= p_min_duration
    AND gap_start >= day_start
    AND gap_end <= day_end
  ORDER BY gap_start;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Contar notificações enviadas hoje para um membro
CREATE OR REPLACE FUNCTION count_today_notifications(p_member_id UUID)
RETURNS INT AS $$
  SELECT COUNT(*)::INT
  FROM notifications
  WHERE member_id = p_member_id
    AND sent_at::date = CURRENT_DATE;
$$ LANGUAGE sql SECURITY DEFINER STABLE;

-- Contar eventos do mês para uma família (para limite do plano grátis)
CREATE OR REPLACE FUNCTION count_monthly_events(p_family_id UUID)
RETURNS INT AS $$
  SELECT COUNT(*)::INT
  FROM events
  WHERE family_id = p_family_id
    AND created_at >= date_trunc('month', CURRENT_DATE)
    AND synced_from = 'manual';
$$ LANGUAGE sql SECURITY DEFINER STABLE;

-- Aceitar convite (transação atômica)
CREATE OR REPLACE FUNCTION accept_invitation(p_token TEXT, p_user_id UUID)
RETURNS UUID AS $$
DECLARE
  v_invitation RECORD;
  v_member_id UUID;
  v_color TEXT;
  v_used_colors TEXT[];
  v_available_colors TEXT[] := ARRAY['#3D405B', '#F49AC2', '#FFC145', '#70D6E3'];
BEGIN
  -- Buscar convite válido
  SELECT * INTO v_invitation
  FROM invitations
  WHERE token = p_token
    AND status = 'pending'
    AND expires_at > NOW();
    
  IF NOT FOUND THEN
    RAISE EXCEPTION 'Convite inválido ou expirado';
  END IF;
  
  -- Buscar cores já usadas
  SELECT ARRAY_AGG(color) INTO v_used_colors
  FROM members
  WHERE family_id = v_invitation.family_id;
  
  -- Pegar primeira cor disponível
  SELECT unnest INTO v_color
  FROM unnest(v_available_colors)
  WHERE unnest != ALL(COALESCE(v_used_colors, ARRAY[]::TEXT[]))
  LIMIT 1;
  
  IF v_color IS NULL THEN
    v_color := '#3D405B'; -- fallback
  END IF;
  
  -- Criar membro
  INSERT INTO members (family_id, user_id, role, display_name, color)
  VALUES (v_invitation.family_id, p_user_id, 'member', split_part(v_invitation.email, '@', 1), v_color)
  RETURNING id INTO v_member_id;
  
  -- Marcar convite como aceito
  UPDATE invitations
  SET status = 'accepted', accepted_at = NOW()
  WHERE id = v_invitation.id;
  
  RETURN v_member_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
```

---

## Arquivo: `supabase/migrations/004_seed.sql`

```sql
-- ============================================================
-- SEED DATA (desenvolvimento)
-- ============================================================

-- Nota: Em produção, os dados são criados via app.
-- Este seed é apenas para desenvolvimento local.

-- Cores disponíveis da Synergy Palette:
-- Pai:    #3D405B (Indigo)
-- Mãe:    #F49AC2 (Rosa)
-- Filho1: #FFC145 (Amarelo)
-- Filho2: #70D6E3 (Turquesa)
```
