// Mirrors GSManagement.Api.Shared.Models.PagedResult<T>.
export interface PagedResult<T> {
  items: T[];
  totalCount: number;
  pageNumber: number;
  pageSize: number;
  totalPages: number;
}
