import { api } from "../lib/api";
import type { Permission } from "../types/permission";

export const fetchPermissions = async (): Promise<Permission[]> => {
  const response = await api.get<Permission[]>("/permissions");
  return response.data;
};

export const fetchPermissionById = async (id: number): Promise<Permission> => {
  const response = await api.get<Permission>(`/permission/${id}`);
  return response.data;
};
