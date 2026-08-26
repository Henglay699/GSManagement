import axios from "axios";
import Role from "../models/role";

// Match your backend's PagedResult wrapper structure
interface PagedResult<T> {
  items: T[];
  totalCount: number;
  pageNumber: number;
  pageSize: number;
}

export const fetchRoles = async (
  pageNumber: number,
  pageSize: number,
  searchTerm: string,
): Promise<PagedResult<Role>> => {
  const response = await axios.get<PagedResult<Role>>("/api/role", {params: {pageNumber, pageSize, searchTerm}, });

  // Return the items array directly (fall back to empty array if undefined)
  return response.data;
};
