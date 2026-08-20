import Role from "./role";

export interface User {
  id: number;
  userName: string;
  email: string;
  isActive: boolean;
  roles: Role[];
}


