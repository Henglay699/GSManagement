import type { Permission } from "./permission";

export interface Role {
  id: number;
  roleName: string;
  description: string | null;
  createdAt: string;
  permissions: Permission[];
}

export interface RoleFormData {
  roleName: string;
  description: string;
  permissionIds: number[];
}
