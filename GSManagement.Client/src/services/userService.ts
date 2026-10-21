import { api } from "../lib/api";
import type { PagedResult } from "../types/common";
import type { User, UserFormData, UserOption } from "../types/user";

export const fetchUsers = async (
  pageNumber: number,
  pageSize: number,
  searchTerm: string,
): Promise<PagedResult<User>> => {
  const response = await api.get<PagedResult<User>>("/user", {
    params: { pageNumber, pageSize, searchTerm },
  });
  return response.data;
};

export const fetchUserById = async (id: number): Promise<User> => {
  const response = await api.get<User>(`/user/${id}`);
  return response.data;
};

// All users in a lightweight shape, for employee pickers.
export const fetchUserOptions = async (): Promise<UserOption[]> => {
  const response = await api.get<UserOption[]>("/user/select-options");
  return response.data;
};

export const createUser = async (data: UserFormData): Promise<User> => {
  const response = await api.post<User>("/user", data);
  return response.data;
};

export const updateUser = async (
  id: number,
  data: UserFormData,
): Promise<User> => {
  // The update endpoint calls it NewPassword (blank = keep the current one);
  // only create uses Password.
  const { password, ...rest } = data;
  const response = await api.put<User>(`/user/${id}`, {
    ...rest,
    newPassword: password,
  });
  return response.data;
};

export const deleteUser = async (id: number): Promise<void> => {
  await api.delete(`/user/${id}`);
};

// Uploads a new photo, replacing the current one. Returns the new image URL.
export const uploadUserPhoto = async (
  id: number,
  file: File,
): Promise<string> => {
  const formData = new FormData();
  formData.append("file", file);
  // Axios sets the multipart Content-Type (with boundary) for FormData itself.
  const response = await api.put<{ imageUrl: string }>(
    `/user/${id}/photo`,
    formData,
  );
  return response.data.imageUrl;
};

export const removeUserPhoto = async (id: number): Promise<void> => {
  await api.delete(`/user/${id}/photo`);
};
