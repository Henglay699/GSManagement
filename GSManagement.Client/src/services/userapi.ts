import axios from "axios";
import { User } from "../models/user";


// Get All Users API Call
export const fetchUsers = async () => {
  const response = await axios.get<User[]>("http://192.168.8.89:5174/api/user");
  return response.data;
};



// Delete User By Id
export const deleteUser = async (id: number) => {
    try {
      await axios.delete(`http://192.168.8.89:5174/api/User/${id}`);
    } catch (error) {
      console.error("Failed to delete user:", error);
    }
  };

