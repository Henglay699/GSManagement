import axios from "axios";
import Permission from "../models/permission";

export const fetchPermissions = async (): Promise<Permission[]> => {
  const response = await axios.get<Permission[]>("/api/permissions");
  return response.data;
};
