import Permission from "./permission";

interface Role {
  id: number;
  roleName: string;
  description: string | null;
  createdAt: Date;
  permissions: Permission[];
}

export default Role;
