-- ============================================================================
-- P1.4: ROLE-BASED ACCESS CONTROL
-- ============================================================================
-- Creates organizations, user_roles tables and updates RLS policies
-- ============================================================================

-- ============================================================================
-- 1. ORGANIZATIONS TABLE
-- ============================================================================

CREATE TABLE IF NOT EXISTS organizations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  country_code TEXT,
  organization_type TEXT CHECK (organization_type IN ('exporter', 'importer', 'logistics', 'inspector', 'laboratory', 'regulatory', 'financial')),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_organizations_name ON organizations(name);

COMMENT ON TABLE organizations IS 'Organizations that users belong to';

-- ============================================================================
-- 2. USER_ROLES TABLE
-- ============================================================================

CREATE TABLE IF NOT EXISTS user_roles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  role TEXT NOT NULL CHECK (role IN ('export_manager', 'compliance_lead', 'auditor', 'external_reviewer', 'system_admin')),
  organization_id UUID REFERENCES organizations(id) ON DELETE CASCADE,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  created_by TEXT DEFAULT 'system',
  UNIQUE(user_id, organization_id)
);

CREATE INDEX idx_user_roles_user_id ON user_roles(user_id);
CREATE INDEX idx_user_roles_organization_id ON user_roles(organization_id);
CREATE INDEX idx_user_roles_role ON user_roles(role);

COMMENT ON TABLE user_roles IS 'User role assignments per organization';

-- ============================================================================
-- 3. ADD ORGANIZATION_ID TO CONSIGNMENT_CASES
-- ============================================================================

ALTER TABLE consignment_cases 
ADD COLUMN IF NOT EXISTS organization_id UUID REFERENCES organizations(id);

CREATE INDEX IF NOT EXISTS idx_consignment_cases_organization_id 
ON consignment_cases(organization_id);

-- ============================================================================
-- 4. HELPER FUNCTIONS
-- ============================================================================

-- Get user's role
CREATE OR REPLACE FUNCTION get_user_role(p_user_id UUID)
RETURNS TEXT AS $$
  SELECT role 
  FROM user_roles 
  WHERE user_id = p_user_id 
    AND is_active = true
  ORDER BY created_at DESC
  LIMIT 1;
$$ LANGUAGE SQL STABLE;

-- Get user's organization
CREATE OR REPLACE FUNCTION get_user_org(p_user_id UUID)
RETURNS UUID AS $$
  SELECT organization_id 
  FROM user_roles 
  WHERE user_id = p_user_id 
    AND is_active = true
  ORDER BY created_at DESC
  LIMIT 1;
$$ LANGUAGE SQL STABLE;

-- Check if user has role
CREATE OR REPLACE FUNCTION user_has_role(p_user_id UUID, p_role TEXT)
RETURNS BOOLEAN AS $$
  SELECT EXISTS(
    SELECT 1 
    FROM user_roles 
    WHERE user_id = p_user_id 
      AND role = p_role 
      AND is_active = true
  );
$$ LANGUAGE SQL STABLE;

-- Check if user belongs to organization
CREATE OR REPLACE FUNCTION user_in_org(p_user_id UUID, p_org_id UUID)
RETURNS BOOLEAN AS $$
  SELECT EXISTS(
    SELECT 1 
    FROM user_roles 
    WHERE user_id = p_user_id 
      AND organization_id = p_org_id 
      AND is_active = true
  );
$$ LANGUAGE SQL STABLE;

-- ============================================================================
-- 5. ENABLE RLS ON NEW TABLES
-- ============================================================================

ALTER TABLE organizations ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_roles ENABLE ROW LEVEL SECURITY;

-- ============================================================================
-- 6. RLS POLICIES - ORGANIZATIONS
-- ============================================================================

-- Users can view their own organization
CREATE POLICY "Users can view own organization"
ON organizations FOR SELECT
TO authenticated
USING (
  id IN (
    SELECT organization_id 
    FROM user_roles 
    WHERE user_id = auth.uid() 
      AND is_active = true
  )
);

-- System admins can manage all organizations
CREATE POLICY "System admins can manage organizations"
ON organizations FOR ALL
TO authenticated
USING (
  EXISTS(
    SELECT 1 FROM user_roles 
    WHERE user_id = auth.uid() 
      AND role = 'system_admin' 
      AND is_active = true
  )
);

-- ============================================================================
-- 7. RLS POLICIES - USER_ROLES
-- ============================================================================

-- Users can view their own roles
CREATE POLICY "Users can view own roles"
ON user_roles FOR SELECT
TO authenticated
USING (user_id = auth.uid());

-- System admins can manage all roles
CREATE POLICY "System admins can manage roles"
ON user_roles FOR ALL
TO authenticated
USING (
  EXISTS(
    SELECT 1 FROM user_roles 
    WHERE user_id = auth.uid() 
      AND role = 'system_admin' 
      AND is_active = true
  )
);

-- ============================================================================
-- 8. UPDATE RLS POLICIES - CONSIGNMENT_CASES
-- ============================================================================

-- Drop existing overly permissive policies
DROP POLICY IF EXISTS "Users can view all consignments" ON consignment_cases;
DROP POLICY IF EXISTS "Authenticated users can view consignments" ON consignment_cases;

-- Export managers and compliance leads can view own org consignments
CREATE POLICY "Users can view own org consignments"
ON consignment_cases FOR SELECT
TO authenticated
USING (
  organization_id IN (
    SELECT organization_id 
    FROM user_roles 
    WHERE user_id = auth.uid() 
      AND is_active = true
      AND role IN ('export_manager', 'compliance_lead', 'auditor')
  )
  OR
  -- System admins can view all
  EXISTS(
    SELECT 1 FROM user_roles 
    WHERE user_id = auth.uid() 
      AND role = 'system_admin' 
      AND is_active = true
  )
);

-- Export managers can create consignments for their org
CREATE POLICY "Export managers can create consignments"
ON consignment_cases FOR INSERT
TO authenticated
WITH CHECK (
  organization_id IN (
    SELECT organization_id 
    FROM user_roles 
    WHERE user_id = auth.uid() 
      AND is_active = true
      AND role IN ('export_manager', 'compliance_lead', 'system_admin')
  )
);

-- Export managers can update own org consignments (draft only)
CREATE POLICY "Export managers can update draft consignments"
ON consignment_cases FOR UPDATE
TO authenticated
USING (
  organization_id IN (
    SELECT organization_id 
    FROM user_roles 
    WHERE user_id = auth.uid() 
      AND is_active = true
      AND role IN ('export_manager', 'compliance_lead', 'system_admin')
  )
  AND current_state = 'draft'
);

-- Only system admins can delete
CREATE POLICY "System admins can delete consignments"
ON consignment_cases FOR DELETE
TO authenticated
USING (
  EXISTS(
    SELECT 1 FROM user_roles 
    WHERE user_id = auth.uid() 
      AND role = 'system_admin' 
      AND is_active = true
  )
);

-- ============================================================================
-- 9. UPDATE RLS POLICIES - EVIDENCE_OBJECTS
-- ============================================================================

DROP POLICY IF EXISTS "Authenticated users can view evidence" ON evidence_objects;

-- Users can view evidence for consignments they have access to
CREATE POLICY "Users can view evidence for accessible consignments"
ON evidence_objects FOR SELECT
TO authenticated
USING (
  consignment_id IN (
    SELECT id FROM consignment_cases
    WHERE organization_id IN (
      SELECT organization_id 
      FROM user_roles 
      WHERE user_id = auth.uid() 
        AND is_active = true
    )
  )
  OR
  -- System admins can view all
  EXISTS(
    SELECT 1 FROM user_roles 
    WHERE user_id = auth.uid() 
      AND role = 'system_admin' 
      AND is_active = true
  )
);

-- Export managers can upload evidence
CREATE POLICY "Export managers can upload evidence"
ON evidence_objects FOR INSERT
TO authenticated
WITH CHECK (
  consignment_id IN (
    SELECT id FROM consignment_cases
    WHERE organization_id IN (
      SELECT organization_id 
      FROM user_roles 
      WHERE user_id = auth.uid() 
        AND is_active = true
        AND role IN ('export_manager', 'compliance_lead', 'system_admin')
    )
  )
);

-- ============================================================================
-- 10. UPDATE RLS POLICIES - CONSIGNMENT_EXCEPTIONS
-- ============================================================================

DROP POLICY IF EXISTS "Authenticated users can view exceptions" ON consignment_exceptions;

-- Users can view exceptions for accessible consignments
CREATE POLICY "Users can view exceptions for accessible consignments"
ON consignment_exceptions FOR SELECT
TO authenticated
USING (
  consignment_id IN (
    SELECT id FROM consignment_cases
    WHERE organization_id IN (
      SELECT organization_id 
      FROM user_roles 
      WHERE user_id = auth.uid() 
        AND is_active = true
    )
  )
  OR
  EXISTS(
    SELECT 1 FROM user_roles 
    WHERE user_id = auth.uid() 
      AND role = 'system_admin' 
      AND is_active = true
  )
);

-- Compliance leads can resolve exceptions
CREATE POLICY "Compliance leads can update exceptions"
ON consignment_exceptions FOR UPDATE
TO authenticated
USING (
  consignment_id IN (
    SELECT id FROM consignment_cases
    WHERE organization_id IN (
      SELECT organization_id 
      FROM user_roles 
      WHERE user_id = auth.uid() 
        AND is_active = true
        AND role IN ('compliance_lead', 'system_admin')
    )
  )
);

-- ============================================================================
-- 11. SEED DEFAULT ORGANIZATION AND ROLES
-- ============================================================================

-- Create default organization
INSERT INTO organizations (id, name, country_code, organization_type)
VALUES 
  ('00000000-0000-0000-0000-000000000001', 'Mango Export Demo Org', 'PE', 'exporter')
ON CONFLICT (id) DO NOTHING;

-- Update existing consignments to belong to default org
UPDATE consignment_cases 
SET organization_id = '00000000-0000-0000-0000-000000000001'
WHERE organization_id IS NULL;

-- ============================================================================
-- 12. TRIGGERS
-- ============================================================================

-- Auto-update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_organizations_updated_at
BEFORE UPDATE ON organizations
FOR EACH ROW
EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_user_roles_updated_at
BEFORE UPDATE ON user_roles
FOR EACH ROW
EXECUTE FUNCTION update_updated_at_column();

-- ============================================================================
-- VERIFICATION
-- ============================================================================

-- Verify tables exist
DO $$
BEGIN
  ASSERT (SELECT COUNT(*) FROM information_schema.tables WHERE table_name = 'organizations') = 1,
    'organizations table not created';
  ASSERT (SELECT COUNT(*) FROM information_schema.tables WHERE table_name = 'user_roles') = 1,
    'user_roles table not created';
  RAISE NOTICE 'Role-based access migration completed successfully';
END $$;
