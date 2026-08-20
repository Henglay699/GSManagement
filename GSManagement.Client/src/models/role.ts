import Permission from "./permision";

interface Role {
  id: number;
  roleName: string;
  permission: Permission[]
}

export default Role