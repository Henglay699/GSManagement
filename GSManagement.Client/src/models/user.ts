export interface User {
  id: number;
  userName: string;
  email: string;
  isActive: boolean;
  roles: Role[];
}

interface Role {
  id: number;
  name: string;
}
