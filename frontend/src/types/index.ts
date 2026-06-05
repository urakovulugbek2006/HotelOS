// ── Auth ──────────────────────────────────────────────────────────────────────

export type Role =
  | "Client"
  | "Receptionist"
  | "CleaningStaff"
  | "MaintenanceStaff"
  | "KitchenStaff"
  | "Server"
  | "Manager";

export interface AuthUser {
  id: string;
  email: string;
  role: Role;
  token: string;
  expiresAt: string;
}

export interface LoginRequest {
  email: string;
  password: string;
}

export interface CreateClientRequest {
  email: string;
  password: string;
  firstName: string;
  lastName: string;
  phone: string;
}

export interface StaffProfileDto {
  firstName: string;
  lastName: string;
  phone: string;
  department: string;
  jobTitle: string;
  hireDate: string;
  emergencyContactName: string;
  emergencyContactPhone: string;
}

export interface CreateStaffRequest {
  email: string;
  password: string;
  role: Role;
  profile: StaffProfileDto;
}

// ── Rooms ─────────────────────────────────────────────────────────────────────

export type RoomStyle = "Standard" | "Deluxe" | "FamilySuite" | "BusinessSuite";
export type RoomStatus = "Available" | "Reserved" | "OOS" | "Cleaning" | "Active" | "Archived";

export interface RoomResponse {
  id: string;
  roomNumber: string;
  floor: number;
  style: RoomStyle;
  status: RoomStatus;
  pricePerNight: number;
  capacity: number;
  isSmokingAllowed: boolean;
  description: string;
  nextAvailableFrom: string;
}

export interface CreateRoomRequest {
  roomNumber: string;
  floor: number;
  style: RoomStyle;
  pricePerNight: number;
  capacity: number;
  isSmokingAllowed: boolean;
  description: string;
}

// ── Bookings ──────────────────────────────────────────────────────────────────

export type BookingStatus =
  | "PendingPayment"
  | "Confirmed"
  | "Active"
  | "Cancelled"
  | "TimedOut"
  | "Completed";

export interface BookingResponse {
  id: string;
  guestId: string;
  roomId: string;
  roomNumber: string;
  checkIn: string;
  checkOut: string;
  effectiveCheckout: string;
  status: BookingStatus;
  totalPrice: number;
  expiresAt: string;
  createdAt: string;
}

export interface CreateBookingRequest {
  roomId: string;
  checkIn: string;
  checkOut: string;
}

export interface WalkInBookingRequest {
  guestId: string;
  roomId: string;
  checkIn: string;
  checkOut: string;
}

// ── Payments ──────────────────────────────────────────────────────────────────

export interface PaymentResponse {
  id: string;
  bookingId: string;
  amount: number;
  currency: string;
  status: string;
  clientSecret: string | null;
  gatewayRef: string | null;
  createdAt: string;
}

export interface InitiatePaymentRequest {
  bookingId: string;
  amount: number;
  currency?: string;
}

// ── Housekeeping ──────────────────────────────────────────────────────────────

export type CleanStatus = "BeingCleaned" | "Clean" | "Completed";

export interface CleaningLogResponse {
  id: string;
  roomId: string;
  staffId: string;
  status: CleanStatus;
  startedAt: string;
  completedAt: string | null;
  durationMins: number;
  notes: string;
}

// ── Maintenance ───────────────────────────────────────────────────────────────

export interface TicketResponse {
  id: string;
  roomId: string;
  reportedBy: string;
  description: string;
  priority: string;
  status: string;
  estimatedMins: number;
  assignedStaffId: string | null;
  createdAt: string;
  resolvedAt: string | null;
}

export interface CreateTicketRequest {
  roomId: string;
  description: string;
  priority?: string;
  estimatedMins?: number;
}

// ── Users ─────────────────────────────────────────────────────────────────────

export interface UserAccount {
  id: string;
  email: string;
  role: string;
  status: string;
  createdAt: string;
  lastLoginAt: string | null;
}

// ── Orders / Kitchen ──────────────────────────────────────────────────────────

export type OrderStatus = "Received" | "Preparing" | "OutForDelivery" | "Delivered";

export interface MenuItemResponse {
  id: string;
  name: string;
  description: string;
  price: number;
  category: string;
  isAvailable: boolean;
}

export interface OrderItemResponse {
  menuItemId: string;
  menuItemName: string;
  quantity: number;
  unitPrice: number;
  subtotal: number;
}

export interface OrderResponse {
  id: string;
  bookingId: string;
  roomId: string;
  guestId: string;
  status: OrderStatus;
  totalPrice: number;
  createdAt: string;
  items: OrderItemResponse[];
}

export interface CreateOrderRequest {
  bookingId: string;
  roomId: string;
  items: { menuItemId: string; quantity: number }[];
}
