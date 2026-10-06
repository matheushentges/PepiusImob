-- Enable Row Level Security on all tables
ALTER TABLE tenants ENABLE ROW LEVEL SECURITY;
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE properties ENABLE ROW LEVEL SECURITY;
ALTER TABLE property_images ENABLE ROW LEVEL SECURITY;
ALTER TABLE leads ENABLE ROW LEVEL SECURITY;
ALTER TABLE licenses ENABLE ROW LEVEL SECURITY;
ALTER TABLE channels ENABLE ROW LEVEL SECURITY;
ALTER TABLE conversations ENABLE ROW LEVEL SECURITY;
ALTER TABLE messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE ai_training_data ENABLE ROW LEVEL SECURITY;

-- Helper function to get user's tenant_id
CREATE OR REPLACE FUNCTION auth.user_tenant_id()
RETURNS UUID AS $$
  SELECT tenant_id FROM profiles WHERE id = auth.uid()
$$ LANGUAGE sql SECURITY DEFINER;

-- Helper function to check if user is admin
CREATE OR REPLACE FUNCTION auth.is_admin()
RETURNS BOOLEAN AS $$
  SELECT EXISTS(
    SELECT 1 FROM profiles
    WHERE id = auth.uid() AND role = 'admin'
  )
$$ LANGUAGE sql SECURITY DEFINER;

-- Policies for tenants table
CREATE POLICY "Admins can view all tenants"
  ON tenants FOR SELECT
  TO authenticated
  USING (auth.is_admin());

CREATE POLICY "Users can view their own tenant"
  ON tenants FOR SELECT
  TO authenticated
  USING (id = auth.user_tenant_id());

CREATE POLICY "Admins can insert tenants"
  ON tenants FOR INSERT
  TO authenticated
  WITH CHECK (auth.is_admin());

CREATE POLICY "Admins can update tenants"
  ON tenants FOR UPDATE
  TO authenticated
  USING (auth.is_admin());

CREATE POLICY "Admins can delete tenants"
  ON tenants FOR DELETE
  TO authenticated
  USING (auth.is_admin());

-- Policies for profiles table
CREATE POLICY "Users can view their own profile"
  ON profiles FOR SELECT
  TO authenticated
  USING (id = auth.uid());

CREATE POLICY "Users can view profiles in their tenant"
  ON profiles FOR SELECT
  TO authenticated
  USING (tenant_id = auth.user_tenant_id());

CREATE POLICY "Admins can view all profiles"
  ON profiles FOR SELECT
  TO authenticated
  USING (auth.is_admin());

CREATE POLICY "Users can update their own profile"
  ON profiles FOR UPDATE
  TO authenticated
  USING (id = auth.uid());

CREATE POLICY "Admins can manage all profiles"
  ON profiles FOR ALL
  TO authenticated
  USING (auth.is_admin());

-- Policies for properties table
CREATE POLICY "Anyone can view available properties"
  ON properties FOR SELECT
  TO authenticated, anon
  USING (status = 'disponivel' AND EXISTS(
    SELECT 1 FROM tenants WHERE tenants.id = properties.tenant_id AND tenants.active = true
  ));

CREATE POLICY "Tenant users can view their own properties"
  ON properties FOR SELECT
  TO authenticated
  USING (tenant_id = auth.user_tenant_id());

CREATE POLICY "Admins can view all properties"
  ON properties FOR SELECT
  TO authenticated
  USING (auth.is_admin());

CREATE POLICY "Tenant users can insert properties"
  ON properties FOR INSERT
  TO authenticated
  WITH CHECK (tenant_id = auth.user_tenant_id());

CREATE POLICY "Tenant users can update their properties"
  ON properties FOR UPDATE
  TO authenticated
  USING (tenant_id = auth.user_tenant_id());

CREATE POLICY "Tenant users can delete their properties"
  ON properties FOR DELETE
  TO authenticated
  USING (tenant_id = auth.user_tenant_id());

-- Policies for property_images table
CREATE POLICY "Anyone can view images of available properties"
  ON property_images FOR SELECT
  TO authenticated, anon
  USING (EXISTS(
    SELECT 1 FROM properties
    WHERE properties.id = property_images.property_id
    AND properties.status = 'disponivel'
  ));

CREATE POLICY "Tenant users can manage images of their properties"
  ON property_images FOR ALL
  TO authenticated
  USING (EXISTS(
    SELECT 1 FROM properties
    WHERE properties.id = property_images.property_id
    AND properties.tenant_id = auth.user_tenant_id()
  ));

-- Policies for leads table
CREATE POLICY "Tenant users can view their leads"
  ON leads FOR SELECT
  TO authenticated
  USING (tenant_id = auth.user_tenant_id());

CREATE POLICY "Admins can view all leads"
  ON leads FOR SELECT
  TO authenticated
  USING (auth.is_admin());

CREATE POLICY "Anyone can insert leads"
  ON leads FOR INSERT
  TO authenticated, anon
  WITH CHECK (true);

CREATE POLICY "Tenant users can update their leads"
  ON leads FOR UPDATE
  TO authenticated
  USING (tenant_id = auth.user_tenant_id());

-- Policies for licenses table
CREATE POLICY "Admins can manage all licenses"
  ON licenses FOR ALL
  TO authenticated
  USING (auth.is_admin());

CREATE POLICY "Tenant users can view their licenses"
  ON licenses FOR SELECT
  TO authenticated
  USING (tenant_id = auth.user_tenant_id());

-- Policies for channels table
CREATE POLICY "Tenant users can manage their channels"
  ON channels FOR ALL
  TO authenticated
  USING (tenant_id = auth.user_tenant_id());

CREATE POLICY "Admins can view all channels"
  ON channels FOR SELECT
  TO authenticated
  USING (auth.is_admin());

-- Policies for conversations table
CREATE POLICY "Tenant users can view their conversations"
  ON conversations FOR SELECT
  TO authenticated
  USING (tenant_id = auth.user_tenant_id());

CREATE POLICY "Tenant users can update their conversations"
  ON conversations FOR UPDATE
  TO authenticated
  USING (tenant_id = auth.user_tenant_id());

CREATE POLICY "System can insert conversations (webhooks)"
  ON conversations FOR INSERT
  TO authenticated, anon
  WITH CHECK (true);

CREATE POLICY "Admins can view all conversations"
  ON conversations FOR SELECT
  TO authenticated
  USING (auth.is_admin());

-- Policies for messages table
CREATE POLICY "Tenant users can view messages in their conversations"
  ON messages FOR SELECT
  TO authenticated
  USING (EXISTS(
    SELECT 1 FROM conversations
    WHERE conversations.id = messages.conversation_id
    AND conversations.tenant_id = auth.user_tenant_id()
  ));

CREATE POLICY "Tenant users can insert messages in their conversations"
  ON messages FOR INSERT
  TO authenticated
  WITH CHECK (EXISTS(
    SELECT 1 FROM conversations
    WHERE conversations.id = messages.conversation_id
    AND conversations.tenant_id = auth.user_tenant_id()
  ));

CREATE POLICY "System can insert messages (webhooks)"
  ON messages FOR INSERT
  TO authenticated, anon
  WITH CHECK (true);

CREATE POLICY "Admins can view all messages"
  ON messages FOR SELECT
  TO authenticated
  USING (auth.is_admin());

-- Policies for ai_training_data table
CREATE POLICY "Tenant users can manage their training data"
  ON ai_training_data FOR ALL
  TO authenticated
  USING (tenant_id = auth.user_tenant_id());

CREATE POLICY "Admins can view all training data"
  ON ai_training_data FOR SELECT
  TO authenticated
  USING (auth.is_admin());
