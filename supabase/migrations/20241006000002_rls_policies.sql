-- Enable RLS and remove the legacy SaaS policies while migrations run.
-- The final on-prem security migration installs the reviewed tenant policies.
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

-- Remove legacy tenant policies.
DROP POLICY IF EXISTS "Admins can view all tenants" ON tenants;
DROP POLICY IF EXISTS "Users can view their own tenant" ON tenants;
DROP POLICY IF EXISTS "Admins can insert tenants" ON tenants;
DROP POLICY IF EXISTS "Admins can update tenants" ON tenants;
DROP POLICY IF EXISTS "Admins can delete tenants" ON tenants;
DROP POLICY IF EXISTS "Permitir leitura pública de domínios ativos" ON tenants;

-- Remove old profile policies before dropping arbitrary-user helper RPCs.
DROP POLICY IF EXISTS "Users can view their own profile" ON profiles;
DROP POLICY IF EXISTS "Users can view profiles in their tenant" ON profiles;
DROP POLICY IF EXISTS "Admins can view all profiles" ON profiles;
DROP POLICY IF EXISTS "Users can update their own profile" ON profiles;
DROP POLICY IF EXISTS "Admins can manage all profiles" ON profiles;
DROP POLICY IF EXISTS "profiles_select_own" ON profiles;
DROP POLICY IF EXISTS "profiles_select_admin_all" ON profiles;
DROP POLICY IF EXISTS "profiles_select_tenant" ON profiles;
DROP POLICY IF EXISTS "profiles_self_read" ON profiles;
DROP POLICY IF EXISTS "profiles_admin_read_all" ON profiles;
DROP POLICY IF EXISTS "profiles_tenant_read" ON profiles;
DROP POLICY IF EXISTS "profiles_self_update" ON profiles;
DROP POLICY IF EXISTS "profiles_admin_manage_all" ON profiles;
DROP POLICY IF EXISTS "profiles_select_self" ON profiles;
DROP POLICY IF EXISTS "profiles_select_by_admin" ON profiles;
DROP POLICY IF EXISTS "profiles_select_same_tenant" ON profiles;
DROP POLICY IF EXISTS "profiles_update_self" ON profiles;
DROP POLICY IF EXISTS "profiles_manage_by_admin" ON profiles;

-- Raw property, image and lead access stays server-side.
DROP POLICY IF EXISTS "Anyone can view available properties" ON properties;
DROP POLICY IF EXISTS "Tenant users can view their own properties" ON properties;
DROP POLICY IF EXISTS "Admins can view all properties" ON properties;
DROP POLICY IF EXISTS "Tenant users can insert properties" ON properties;
DROP POLICY IF EXISTS "Tenant users can update their properties" ON properties;
DROP POLICY IF EXISTS "Tenant users can delete their properties" ON properties;
DROP POLICY IF EXISTS "Anyone can view images of available properties" ON property_images;
DROP POLICY IF EXISTS "Tenant users can manage images of their properties" ON property_images;
DROP POLICY IF EXISTS "Tenant users can view their leads" ON leads;
DROP POLICY IF EXISTS "Admins can view all leads" ON leads;
DROP POLICY IF EXISTS "Anyone can insert leads" ON leads;
DROP POLICY IF EXISTS "Tenant users can update their leads" ON leads;
DROP POLICY IF EXISTS "Admins can manage all licenses" ON licenses;
DROP POLICY IF EXISTS "Tenant users can view their licenses" ON licenses;
DROP POLICY IF EXISTS "Tenant users can manage their channels" ON channels;
DROP POLICY IF EXISTS "Admins can view all channels" ON channels;
DROP POLICY IF EXISTS "Tenant users can view their conversations" ON conversations;
DROP POLICY IF EXISTS "Tenant users can update their conversations" ON conversations;
DROP POLICY IF EXISTS "System can insert conversations (webhooks)" ON conversations;
DROP POLICY IF EXISTS "Admins can view all conversations" ON conversations;
DROP POLICY IF EXISTS "Tenant users can view messages in their conversations" ON messages;
DROP POLICY IF EXISTS "Tenant users can insert messages in their conversations" ON messages;
DROP POLICY IF EXISTS "System can insert messages (webhooks)" ON messages;
DROP POLICY IF EXISTS "Admins can view all messages" ON messages;
DROP POLICY IF EXISTS "Tenant users can manage their training data" ON ai_training_data;
DROP POLICY IF EXISTS "Admins can view all training data" ON ai_training_data;

DROP FUNCTION IF EXISTS public.get_user_role(UUID);
DROP FUNCTION IF EXISTS public.get_user_tenant(UUID);
