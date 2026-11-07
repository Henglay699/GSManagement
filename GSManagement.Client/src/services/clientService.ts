import { api } from "../lib/api";
import type { PagedResult } from "../types/common";
import type { Client, ClientQuery, OperatorOption, SaveClientDto } from "../types/client";

const BASE = "/clients";

/** Operators get only their own clients; managers (ViewAllClients) can ask for any. */
export const fetchClients = async (query: ClientQuery): Promise<PagedResult<Client>> => {
  const response = await api.get<PagedResult<Client>>(BASE, { params: query });
  return response.data;
};

export const fetchClient = async (id: number): Promise<Client> => {
  const response = await api.get<Client>(`${BASE}/${id}`);
  return response.data;
};

export const createClient = async (data: SaveClientDto): Promise<Client> => {
  const response = await api.post<Client>(BASE, data);
  return response.data;
};

export const updateClient = async (id: number, data: SaveClientDto): Promise<Client> => {
  const response = await api.put<Client>(`${BASE}/${id}`, data);
  return response.data;
};

/** Deactivates the client; its history stays. */
export const deactivateClient = async (id: number): Promise<void> => {
  await api.delete(`${BASE}/${id}`);
};

/** Sets the primary operator and the backups. */
export const assignClientOperators = async (
  id: number,
  primaryUserId: number | null,
  backupUserIds: number[],
): Promise<Client> => {
  const response = await api.put<Client>(`${BASE}/${id}/operators`, { primaryUserId, backupUserIds });
  return response.data;
};

/** Staff who can handle clients, with how many they already have. */
export const fetchClientOperators = async (): Promise<OperatorOption[]> => {
  const response = await api.get<OperatorOption[]>(`${BASE}/operators`);
  return response.data;
};
