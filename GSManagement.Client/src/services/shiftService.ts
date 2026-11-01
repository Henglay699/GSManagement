import { api } from "../lib/api";
import type { CreateShiftDto, ShiftAssignment, ShiftDto, UpdateShiftDto } from "../types/shift";

const BASE = "/shifts";

export const fetchShifts = async (): Promise<ShiftDto[]> => {
  const response = await api.get<ShiftDto[]>(BASE);
  return response.data;
};

export const fetchDefaultShift = async (): Promise<ShiftDto> => {
  const response = await api.get<ShiftDto>(`${BASE}/default`);
  return response.data;
};

export const fetchShiftById = async (id: number): Promise<ShiftDto> => {
  const response = await api.get<ShiftDto>(`${BASE}/${id}`);
  return response.data;
};

export const createShift = async (data: CreateShiftDto): Promise<ShiftDto> => {
  const response = await api.post<ShiftDto>(BASE, data);
  return response.data;
};

export const updateShift = async (
  id: number,
  data: UpdateShiftDto,
): Promise<ShiftDto> => {
  const response = await api.put<ShiftDto>(`${BASE}/${id}`, data);
  return response.data;
};

export const deleteShift = async (id: number): Promise<void> => {
  await api.delete(`${BASE}/${id}`);
};

export const fetchShiftAssignments = async (): Promise<ShiftAssignment[]> => {
  const response = await api.get<ShiftAssignment[]>(`${BASE}/assignments`);
  return response.data;
};

/** Sets who works the shift; returns everyone's shift afterwards. */
export const assignShiftEmployees = async (id: number, userIds: number[]): Promise<ShiftAssignment[]> => {
  const response = await api.put<ShiftAssignment[]>(`${BASE}/${id}/employees`, { userIds });
  return response.data;
};
