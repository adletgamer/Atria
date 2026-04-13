// Auth and Role Types

export type UserRole = 
  | 'export_manager'
  | 'compliance_lead'
  | 'auditor'
  | 'external_reviewer'
  | 'system_admin';

export interface UserProfile {
  id: string;
  email: string;
  full_name?: string;
  role: UserRole;
  organization_id?: string;
  organization_name?: string;
  created_at: string;
  updated_at: string;
}

export interface RolePermissions {
  canCreateConsignment: boolean;
  canUploadEvidence: boolean;
  canRequestAttestation: boolean;
  canResolveException: boolean;
  canGeneratePack: boolean;
  canAnchorPack: boolean;
  canDeleteConsignment: boolean;
  canViewAuditTrail: boolean;
  canManageUsers: boolean;
}

export const ROLE_PERMISSIONS: Record<UserRole, RolePermissions> = {
  export_manager: {
    canCreateConsignment: true,
    canUploadEvidence: true,
    canRequestAttestation: true,
    canResolveException: false,
    canGeneratePack: false,
    canAnchorPack: false,
    canDeleteConsignment: false,
    canViewAuditTrail: true,
    canManageUsers: false,
  },
  compliance_lead: {
    canCreateConsignment: true,
    canUploadEvidence: true,
    canRequestAttestation: true,
    canResolveException: true,
    canGeneratePack: true,
    canAnchorPack: true,
    canDeleteConsignment: false,
    canViewAuditTrail: true,
    canManageUsers: false,
  },
  auditor: {
    canCreateConsignment: false,
    canUploadEvidence: false,
    canRequestAttestation: false,
    canResolveException: false,
    canGeneratePack: false,
    canAnchorPack: false,
    canDeleteConsignment: false,
    canViewAuditTrail: true,
    canManageUsers: false,
  },
  external_reviewer: {
    canCreateConsignment: false,
    canUploadEvidence: false,
    canRequestAttestation: false,
    canResolveException: false,
    canGeneratePack: false,
    canAnchorPack: false,
    canDeleteConsignment: false,
    canViewAuditTrail: false,
    canManageUsers: false,
  },
  system_admin: {
    canCreateConsignment: true,
    canUploadEvidence: true,
    canRequestAttestation: true,
    canResolveException: true,
    canGeneratePack: true,
    canAnchorPack: true,
    canDeleteConsignment: true,
    canViewAuditTrail: true,
    canManageUsers: true,
  },
};

export const ROLE_LABELS: Record<UserRole, string> = {
  export_manager: 'Export Manager',
  compliance_lead: 'Compliance Lead',
  auditor: 'Auditor',
  external_reviewer: 'External Reviewer',
  system_admin: 'System Admin',
};

export const ROLE_DESCRIPTIONS: Record<UserRole, string> = {
  export_manager: 'Create consignments, upload evidence, request attestations',
  compliance_lead: 'All export manager permissions + resolve exceptions, generate packs',
  auditor: 'Read-only access to all consignments and audit trails',
  external_reviewer: 'View shared evidence packs only',
  system_admin: 'Full system access and user management',
};
