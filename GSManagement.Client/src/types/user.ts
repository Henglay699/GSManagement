import type { Role } from "./role";

export interface User {
  id: number;
  userName: string;
  email: string;
  isActive: boolean;
  imageUrl: string | null;
  roles: Role[];
}

// What the user form wants done with the photo on save:
// undefined = keep the current one, null = remove it, File = upload a new one.
export type PhotoChange = File | null | undefined;

export interface UserFormData {
  userName: string;
  email: string;
  isActive: boolean;
  password?: string;
  roleIds?: number[];
}

// Lightweight shape returned by GET /api/user/select-options.
export interface UserOption {
  id: number;
  userName: string;
  email?: string;
  imageUrl?: string | null;
  roles?: string | null;
}
