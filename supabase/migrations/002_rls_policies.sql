-- ============================================================
-- ROW LEVEL SECURITY (RLS)
-- ============================================================

ALTER TABLE families ENABLE ROW LEVEL SECURITY;
ALTER TABLE members ENABLE ROW LEVEL SECURITY;
ALTER TABLE events ENABLE ROW LEVEL SECURITY;
ALTER TABLE tasks ENABLE ROW LEVEL SECURITY;
ALTER TABLE invitations ENABLE ROW LEVEL SECURITY;
ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE push_subscriptions ENABLE ROW LEVEL SECURITY;

CREATE OR REPLACE FUNCTION get_user_family_ids()
RETURNS SETOF UUID AS $$
  SELECT family_id FROM members WHERE user_id = auth.uid()
$$ LANGUAGE sql SECURITY DEFINER STABLE;

CREATE OR REPLACE FUNCTION get_user_member_ids()
RETURNS SETOF UUID AS $$
  SELECT id FROM members WHERE user_id = auth.uid()
$$ LANGUAGE sql SECURITY DEFINER STABLE;

-- FAMILIES
CREATE POLICY "Users can view their families" ON families FOR SELECT USING (id IN (SELECT get_user_family_ids()));
CREATE POLICY "Users can create families" ON families FOR INSERT WITH CHECK (created_by = auth.uid());
CREATE POLICY "Admins can update their family" ON families FOR UPDATE USING (id IN (SELECT family_id FROM members WHERE user_id = auth.uid() AND role = 'admin'));

-- MEMBERS
CREATE POLICY "Users can view family members" ON members FOR SELECT USING (family_id IN (SELECT get_user_family_ids()));
CREATE POLICY "Admins can insert members" ON members FOR INSERT WITH CHECK (family_id IN (SELECT family_id FROM members WHERE user_id = auth.uid() AND role = 'admin'));
CREATE POLICY "Admins can update members" ON members FOR UPDATE USING (family_id IN (SELECT family_id FROM members WHERE user_id = auth.uid() AND role = 'admin')) WITH CHECK (family_id IN (SELECT family_id FROM members WHERE user_id = auth.uid() AND role = 'admin'));
CREATE POLICY "Users can update own profile" ON members FOR UPDATE USING (user_id = auth.uid());
CREATE POLICY "Admins can delete members" ON members FOR DELETE USING (family_id IN (SELECT family_id FROM members WHERE user_id = auth.uid() AND role = 'admin'));

-- EVENTS
CREATE POLICY "Users can view family events" ON events FOR SELECT USING (family_id IN (SELECT get_user_family_ids()));
CREATE POLICY "Users can create events in their family" ON events FOR INSERT WITH CHECK (family_id IN (SELECT get_user_family_ids()));
CREATE POLICY "Users can update family events" ON events FOR UPDATE USING (family_id IN (SELECT get_user_family_ids()));
CREATE POLICY "Users can delete family events" ON events FOR DELETE USING (family_id IN (SELECT get_user_family_ids()));

-- TASKS
CREATE POLICY "Users can view family tasks" ON tasks FOR SELECT USING (family_id IN (SELECT get_user_family_ids()));
CREATE POLICY "Users can create tasks" ON tasks FOR INSERT WITH CHECK (family_id IN (SELECT get_user_family_ids()));
CREATE POLICY "Users can update family tasks" ON tasks FOR UPDATE USING (family_id IN (SELECT get_user_family_ids()));
CREATE POLICY "Users can delete family tasks" ON tasks FOR DELETE USING (family_id IN (SELECT get_user_family_ids()));

-- INVITATIONS
CREATE POLICY "Admins can view invitations" ON invitations FOR SELECT USING (family_id IN (SELECT family_id FROM members WHERE user_id = auth.uid() AND role = 'admin'));
CREATE POLICY "Admins can create invitations" ON invitations FOR INSERT WITH CHECK (family_id IN (SELECT family_id FROM members WHERE user_id = auth.uid() AND role = 'admin'));
CREATE POLICY "Anyone can view invitation by token" ON invitations FOR SELECT USING (true);

-- NOTIFICATIONS
CREATE POLICY "Users can view own notifications" ON notifications FOR SELECT USING (member_id IN (SELECT get_user_member_ids()));
CREATE POLICY "Users can update own notifications (mark read)" ON notifications FOR UPDATE USING (member_id IN (SELECT get_user_member_ids()));

-- PUSH SUBSCRIPTIONS
CREATE POLICY "Users can manage own push subscriptions" ON push_subscriptions FOR ALL USING (member_id IN (SELECT get_user_member_ids()));
