// const API_BASE = process.env.NEXT_PUBLIC_API_BASE || "https://hotelos-gateway.azurewebsites.net";
const API_BASE = "https://hotelos-gateway.azurewebsites.net";

function getToken(): string | null {
  if (typeof window === "undefined") return null;
  return localStorage.getItem("hotelos_token");
}

async function request<T>(
  path: string,
  options: RequestInit = {}
): Promise<T> {
  const token = getToken();
  const headers: HeadersInit = {
    "Content-Type": "application/json",
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
    ...(options.headers ?? {}),
  };

  const res = await fetch(`${API_BASE}${path}`, { ...options, headers });

  if (!res.ok) {
    let msg = `HTTP ${res.status}`;
    try {
      const body = await res.json();
      msg = body.message ?? msg;
    } catch {
      // ignore parse error
    }
    throw new Error(msg);
  }

  if (res.status === 204) return undefined as T;
  return res.json() as Promise<T>;
}

export const api = {
  get: <T>(path: string) => request<T>(path, { method: "GET" }),

  post: <T>(path: string, body?: unknown) =>
    request<T>(path, {
      method: "POST",
      body: body !== undefined ? JSON.stringify(body) : undefined,
    }),

  patch: <T>(path: string, body?: unknown) =>
    request<T>(path, {
      method: "PATCH",
      body: body !== undefined ? JSON.stringify(body) : undefined,
    }),

  put: <T>(path: string, body?: unknown) =>
    request<T>(path, {
      method: "PUT",
      body: body !== undefined ? JSON.stringify(body) : undefined,
    }),

  delete: <T>(path: string) => request<T>(path, { method: "DELETE" }),
};

// ── Auth ──────────────────────────────────────────────────────────────────────
import type {
  AuthUser,
  LoginRequest,
  CreateClientRequest,
  CreateStaffRequest,
  StaffProfileDto,
  UserAccount,
} from "@/types";

export const authApi = {
  login: (body: LoginRequest) =>
    api.post<AuthUser>("/api/auth/login", body),

  registerClient: (body: CreateClientRequest) =>
    api.post<{ id: string; email: string; role: string }>("/api/users/client", body),

  createStaff: (body: CreateStaffRequest) =>
    api.post<{ id: string; email: string; role: string }>("/api/users/staff", body),

  getAllUsers: (role?: string) => {
    const params = role ? `?role=${role}` : "";
    return api.get<UserAccount[]>(`/api/users${params}`);
  },

  getUserById: (id: string) =>
    api.get<{ accountId: string; email: string; role: string; firstName: string | null; lastName: string | null; profile: unknown }>(`/api/users/${id}`),

  updateProfile: (id: string, profile: StaffProfileDto) =>
    api.put<void>(`/api/users/${id}/profile`, profile),

  changePassword: (id: string, currentPassword: string, newPassword: string) =>
    api.post<{ message: string }>(`/api/users/${id}/change-password`, {
      currentPassword,
      newPassword,
    }),

  deactivateUser: (id: string) => api.delete<void>(`/api/users/${id}`),

  suspendAccount: (id: string) =>
    api.patch<{ status: string }>(`/api/users/${id}/suspendAction`),
};

// ── Rooms ─────────────────────────────────────────────────────────────────────
import type { RoomResponse, CreateRoomRequest, RoomStyle, RoomStatus } from "@/types";

export const roomsApi = {
  search: (checkIn: string, checkOut: string, style?: RoomStyle) => {
    const params = new URLSearchParams({ checkIn, checkOut });
    if (style) params.set("style", style);
    return api.get<RoomResponse[]>(`/api/rooms/search?${params}`);
  },

  getAll: (status?: RoomStatus) => {
    const params = status ? `?status=${status}` : "";
    return api.get<RoomResponse[]>(`/api/rooms${params}`);
  },

  getById: (id: string) => api.get<RoomResponse>(`/api/rooms/${id}`),

  create: (body: CreateRoomRequest) =>
    api.post<{ id: string; roomNumber: string; status: string }>("/api/rooms", body),

  updateStatus: (id: string, status: string) =>
    api.patch<void>(`/api/rooms/${id}/status`, { status }),

  updateBuffer: (id: string, body: { cleaningBufferMins: number; maintenanceBufferMins: number; bufferType: string }) =>
    api.patch<{ roomId: string; cleaningBufferMins: number; maintenanceBufferMins: number; bufferType: string; updatedAt: string }>(`/api/rooms/${id}/buffer`, body),

  archive: (id: string) => api.delete<void>(`/api/rooms/${id}`),

  restore: (id: string) => api.patch<void>(`/api/rooms/${id}/restore`),
};

// ── Bookings ──────────────────────────────────────────────────────────────────
import type {
  BookingResponse,
  BookingStatus,
  CreateBookingRequest,
  WalkInBookingRequest,
} from "@/types";

export const bookingsApi = {
  create: (body: CreateBookingRequest) =>
    api.post<BookingResponse>("/api/bookings", body),

  getAll: (status?: BookingStatus) => {
    const params = status ? `?status=${status}` : "";
    return api.get<BookingResponse[]>(`/api/bookings${params}`);
  },

  getById: (id: string) => api.get<BookingResponse>(`/api/bookings/${id}`),

  getByGuest: (guestId: string) =>
    api.get<BookingResponse[]>(`/api/bookings/guest/${guestId}`),

  confirm: (id: string) => api.post<BookingResponse>(`/api/bookings/${id}/confirm`),

  cancel: (id: string) => api.post<BookingResponse>(`/api/bookings/${id}/cancel`),

  checkIn: (id: string) => api.post<BookingResponse>(`/api/bookings/${id}/checkin`),

  checkOut: (id: string) => api.post<BookingResponse>(`/api/bookings/${id}/checkout`),

  walkIn: (body: WalkInBookingRequest) =>
    api.post<BookingResponse>("/api/bookings/walkin", body),

  reassign: (id: string, newRoomId: string) =>
    api.patch<void>(`/api/bookings/${id}/reassign`, { newRoomId }),
};

// ── Payments ──────────────────────────────────────────────────────────────────
import type { PaymentResponse, InitiatePaymentRequest } from "@/types";

export const paymentsApi = {
  initiate: (body: InitiatePaymentRequest) =>
    api.post<PaymentResponse>("/api/payments/initiate", body),

  getAll: () => api.get<PaymentResponse[]>("/api/payments"),

  getByBooking: (bookingId: string) =>
    api.get<PaymentResponse>(`/api/payments/booking/${bookingId}`),

  confirmManual: (id: string) =>
    api.post<PaymentResponse>(`/api/payments/${id}/confirm-manual`),

  refund: (bookingId: string) =>
    api.post<{ message: string; id: string }>(`/api/payments/refund/${bookingId}`),
};

// ── Housekeeping ──────────────────────────────────────────────────────────────
import type { CleaningLogResponse } from "@/types";

export const cleaningApi = {
  assign: (roomId: string, staffId: string) =>
    api.post<CleaningLogResponse>("/api/cleaning/assign", { roomId, staffId }),

  start: (id: string) => api.post<CleaningLogResponse>(`/api/cleaning/${id}/start`),

  complete: (id: string) => api.post<CleaningLogResponse>(`/api/cleaning/${id}/complete`),

  getActive: () => api.get<CleaningLogResponse[]>("/api/cleaning/active"),

  getById: (id: string) => api.get<CleaningLogResponse>(`/api/cleaning/${id}`),

  getByRoom: (roomId: string) =>
    api.get<CleaningLogResponse[]>(`/api/cleaning/room/${roomId}`),
};

// ── Maintenance ───────────────────────────────────────────────────────────────
import type { TicketResponse, CreateTicketRequest } from "@/types";

export const ticketsApi = {
  create: (body: CreateTicketRequest) =>
    api.post<TicketResponse>("/api/tickets", body),

  assign: (id: string, staffId: string) =>
    api.post<TicketResponse>(`/api/tickets/${id}/assign`, { staffId }),

  resolve: (id: string) => api.post<TicketResponse>(`/api/tickets/${id}/resolve`),

  getActive: () => api.get<TicketResponse[]>("/api/tickets/active"),

  getById: (id: string) => api.get<TicketResponse>(`/api/tickets/${id}`),

  getByRoom: (roomId: string) =>
    api.get<TicketResponse[]>(`/api/tickets/room/${roomId}`),
};

// ── Orders / Kitchen ──────────────────────────────────────────────────────────
import type { OrderResponse, MenuItemResponse, CreateOrderRequest, OrderStatus } from "@/types";

export const ordersApi = {
  create: (body: CreateOrderRequest) =>
    api.post<OrderResponse>("/api/orders", body),

  getById: (id: string) => api.get<OrderResponse>(`/api/orders/${id}`),

  getActive: () => api.get<OrderResponse[]>("/api/orders/active"),

  getByBooking: (bookingId: string) =>
    api.get<OrderResponse[]>(`/api/orders/booking/${bookingId}`),

  updateStatus: (id: string, status: OrderStatus) =>
    api.patch<OrderResponse>(`/api/orders/${id}/status`, { status }),
};

export const menuApi = {
  getAll: () => api.get<MenuItemResponse[]>("/api/menu"),

  getById: (id: string) => api.get<MenuItemResponse>(`/api/menu/${id}`),

  addItem: (body: {
    name: string;
    description: string;
    price: number;
    category: string;
  }) => api.post<MenuItemResponse>("/api/menu", body),

  update: (id: string, body: {
    name: string;
    description: string;
    price: number;
    category: string;
  }) => api.put<MenuItemResponse>(`/api/menu/${id}`, body),

  toggle: (id: string) => api.patch<MenuItemResponse>(`/api/menu/${id}/toggle`),
};
