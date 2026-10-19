import axios from "axios";
import { User } from "../models/user";

export interface UserFormData {
  userName: string;
  email: string;
  isActive: boolean;
  password?: string;
  roleIds?: number[];
}

export interface PagedResult<T> {
  items: T[];
  totalCount: number;
  pageNumber: number;
  pageSize: number;
  totalPages: number;
}

export const fetchUsers = async (
  pageNumber: number,
  pageSize: number,
  searchTerm: string,
): Promise<PagedResult<User>> => {
  const response = await axios.get<PagedResult<User>>("/api/user", {
    params: { pageNumber, pageSize, searchTerm },
  });
  return response.data;
};

// Get User By ID
export const fetchUsersById = async (id: number): Promise<User> => {
  const response = await axios.get<User>(`/api/user/${id}`);
  return response.data;
};

// Create User
export const createUser = async (data: UserFormData): Promise<User> => {
  const response = await axios.post<User>("/api/user", data);
  return response.data;
};

// Update User
export const updateUser = async (
  id: number,
  data: UserFormData,
): Promise<User> => {
  const response = await axios.put<User>(`/api/user/${id}`, data);
  return response.data;
};

// Delete User By ID
export const deleteUser = async (id: number) => {
  try {
    await axios.delete(`/api/user/${id}`);
  } catch (error) {
    console.error("Failed to delete user:", error);
  }
};
