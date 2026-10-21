import { api } from "../lib/api";
import type { PagedResult } from "../types/common";
import type { Role, RoleFormData } from "../types/role";

export const fetchRoles = async (
  pageNumber: number,
  pageSize: number,
  searchTerm: string,
): Promise<PagedResult<Role>> => {
  const response = await api.get<PagedResult<Role>>("/role", {
    params: { pageNumber, pageSize, searchTerm },
  });
  return response.data;
};

export const fetchRoleById = async (id: number): Promise<Role> => {
  const response = await api.get<Role>(`/role/${id}`);
  return response.data;
};

export const createRole = async (data: RoleFormData): Promise<Role> => {
  const response = await api.post<Role>("/role", data);
  return response.data;
};

export const updateRole = async (
  id: number,
  data: RoleFormData,
): Promise<Role> => {
  const response = await api.put<Role>(`/role/${id}`, { id, ...data });
  return response.data;
};

export const deleteRole = async (id: number): Promise<void> => {
  await api.delete(`/role/${id}`);
};
