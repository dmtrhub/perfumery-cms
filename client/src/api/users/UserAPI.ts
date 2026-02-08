import axios, { AxiosInstance } from "axios";
import { IUserAPI } from "./IUserAPI";
import { UserDTO } from "../../models/users/UserDTO";

export class UserAPI implements IUserAPI {
  private readonly axiosInstance: AxiosInstance;

  constructor() {
    this.axiosInstance = axios.create({
      baseURL: import.meta.env.VITE_GATEWAY_URL,
      headers: {
        "Content-Type": "application/json",
      },
    });
  }

  async getAllUsers(token: string): Promise<UserDTO[]> {
    const res = await this.axiosInstance.get("/users", {
      headers: { Authorization: `Bearer ${token}` },
    });
    return res.data?.data || res.data;
  }

  async getUserById(token: string, id: string): Promise<UserDTO> {
    const res = await this.axiosInstance.get(`/users/${id}`, {
      headers: { Authorization: `Bearer ${token}` },
    });
    return res.data?.data || res.data;
  }
}
