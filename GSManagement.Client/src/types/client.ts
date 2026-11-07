// Matches GSManagement.Api/Features/ClientFeature/DTOs/ClientDTOs.cs.

export interface ClientOperator {
  userId: number;
  userName: string;
  imageUrl?: string | null;
  isPrimary: boolean;
}

export interface Client {
  id: number;
  code?: string | null;
  companyName: string;
  companyNameKm?: string | null;
  email?: string | null;
  vat: string;
  businessType?: string | null;
  address?: string | null;
  contactName?: string | null;
  phone?: string | null;
  cdcNo?: string | null;
  cdcValidUntil?: string | null; // "YYYY-MM-DD"
  notes?: string | null;
  isActive: boolean;
  createdAt: string;
  operators: ClientOperator[];
  /** The signed-in user handles this client. */
  isMine: boolean;
}

export interface SaveClientDto {
  code?: string | null;
  companyName: string;
  companyNameKm?: string | null;
  email?: string | null;
  vat: string;
  businessType?: string | null;
  address?: string | null;
  contactName?: string | null;
  phone?: string | null;
  cdcNo?: string | null;
  cdcValidUntil?: string | null;
  notes?: string | null;
  isActive: boolean;
}

export interface OperatorOption {
  id: number;
  userName: string;
  email: string;
  imageUrl?: string | null;
  roles: string;
  primaryCount: number;
  backupCount: number;
}

export interface ClientQuery {
  search?: string;
  scope?: "mine" | "all";
  operatorId?: number;
  unassigned?: boolean;
  includeInactive?: boolean;
  pageNumber?: number;
  pageSize?: number;
}
