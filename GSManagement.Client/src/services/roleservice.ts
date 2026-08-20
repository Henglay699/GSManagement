import axios from "axios";
import Role from "../models/role";


export const fetchRoles = async (): Promise<Role[]> => {
  const response = await axios.get<Role[]>("/api/role");
  return response.data;
};