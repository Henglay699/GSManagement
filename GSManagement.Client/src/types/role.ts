import type { Permission } from "./permission";

export interface Role {
  id: number;
  roleName: string;
  description: string | null;
  createdAt: string;
  permissions: Permission[];
}

// Pick-list entry from GET /role/options (needs AssignRole).
export interface RoleOption {
  id: number;
  roleName: string;
}

export interface RoleFormData {
  roleName: string;
  description: string;
  permissionIds: number[];
}
