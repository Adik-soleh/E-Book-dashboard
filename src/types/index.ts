export interface EbookSummary {
  id: string;
  title: string;
  author: string;
  description: string;
  price: number;
  isPublished: boolean;
  coverUrl: string;
  tags: string[];
  createdAt: string;
  hasPurchased: boolean;
  canDownload: boolean;
}

export interface EbookDetail extends EbookSummary {}

export interface Paginated<T> {
  items: T[];
  meta: {
    page: number;
    limit: number;
    total: number;
  };
}

export interface Tag {
  id: string;
  name: string;
}

export interface OrderSummary {
  orderId: string;
  status: OrderStatus;
  invoiceUrl: string | null;
}

export type OrderStatus = 'PENDING' | 'PAID' | 'FAILED';

export interface Order {
  id: string;
  userId: string;
  ebookId: string;
  amount: number;
  status: OrderStatus;
  paymentProvider: string;
  paymentReference: string;
  createdAt: string;
  updatedAt: string;
  ebook: {
    id: string;
    title: string;
    author: string;
    price: number;
    coverUrl: string | null;
  } | null;
}

export interface AdminOrder extends Order {
  user: {
    id: string;
    name: string;
    email: string;
  };
}

export interface ReadingProgress {
  ebookId: string;
  lastPage: number;
}

export interface AuthUser {
  id: string;
  name: string;
  email: string;
  role: string;
}

export interface AuthPayload {
  user: AuthUser;
  accessToken: string;
  refreshToken: string;
}
