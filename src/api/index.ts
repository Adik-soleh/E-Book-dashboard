import { http } from './http';
import type {
  AdminOrder,
  AuthPayload,
  AuthUser,
  EbookDetail,
  EbookSummary,
  Order,
  OrderSummary,
  Paginated,
  ReadingProgress,
  Tag,
} from '../types';

export const authApi = {
  register: (payload: { name: string; email: string; password: string }) => http.post<AuthPayload>('/auth/register', payload),
  login: (payload: { email: string; password: string }) => http.post<AuthPayload>('/auth/login', payload),
  refresh: (payload: { refreshToken: string }) => http.post<{ accessToken: string; refreshToken: string }>('/auth/refresh', payload),
};

export const ebooksApi = {
  list: (params: Record<string, any>) => http.get<Paginated<EbookSummary>>('/ebooks', { params }),
  detail: (id: string) => http.get<EbookDetail>(`/ebooks/${id}`),
  create: (payload: any) => http.post('/ebooks', payload),
  update: (id: string, payload: any) => http.patch(`/ebooks/${id}`, payload),
  publish: (id: string) => http.patch(`/ebooks/${id}/publish`, {}),
  remove: (id: string) => http.delete(`/ebooks/${id}`),
};

export const tagsApi = {
  list: () => http.get<Tag[]>('/tags'),
  create: (payload: { name: string }) => http.post('/tags', payload),
};

export const ordersApi = {
  create: (payload: { ebookId: string; paymentProvider: string }) => http.post<OrderSummary>('/orders/create', payload),
  listMine: () => http.get<Order[]>('/orders/me'),
  listAll: () => http.get<AdminOrder[]>('/orders'),
  detail: (orderId: string) => http.get<Order>(`/orders/${orderId}`),
  refresh: (orderId: string) => http.post<Order>(`/orders/${orderId}/refresh`),
  webhook: (payload: { orderId: string; status: string }) => http.post('/orders/webhook', payload),
};

export const usersApi = {
  me: () => http.get<AuthUser>('/users/me'),
};

export const downloadApi = {
  requestToken: (ebookId: string) => http.post<{ token: string; expiresAt: string }>(`/ebooks/${ebookId}/token`, {}),
};

export const readerApi = {
  updateProgress: (payload: ReadingProgress) => http.patch('/reader/update-progress', payload),
  getProgress: (ebookId: string) => http.get<ReadingProgress | null>(`/reader/${ebookId}`),
};
