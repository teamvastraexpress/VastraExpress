// ─── User ─────────────────────────────────────────────────────────────────────
export interface User {
  id: number;
  mobileNumber: string;
  name: string;
  email?: string | null;
  // verifyOtp returns role as a plain string; getProfile returns a Role object
  role: Role | string;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
  staffProfile?: Staff | null;
}

export interface Role {
  id: number;
  name: string; // 'ADMIN' | 'FACILITY_STAFF' | 'DRIVER' | 'CUSTOMER'
}

export interface Staff {
  id: number;
  employeeId?: string | null;   // e.g. FE01 (facility staff), FD01 (driver)
  facilityId: number;
  facility?: Facility;
}

// ─── Address ──────────────────────────────────────────────────────────────────
export interface Address {
  id: number;
  userId: number;
  houseFlatNo: string;
  street: string;
  landmark?: string | null;
  pincode: string;
  cityId: number;
  city?: City;
  isDefault: boolean;
  createdAt: string;
}

export interface City {
  id: number;
  name: string;
  state: string;
  isActive: boolean;
}

// ─── Facility ─────────────────────────────────────────────────────────────────
export interface Facility {
  id: number;
  facilityCode: string;          // e.g. ANDHERI_WEST_01
  name: string;
  cityId: number;
  city?: City;
  address: string;
  contactNumber: string;
  isActive: boolean;
  createdAt: string;
}

// ─── Pickup Slot ──────────────────────────────────────────────────────────────
export interface PickupSlot {
  id: number;
  facilityId: number;
  facility?: Facility;
  slotDate: string;
  startTime: string;
  endTime: string;
  maxCapacity: number;
  currentBookings: number;
  isActive: boolean;
}

// ─── Order ────────────────────────────────────────────────────────────────────
export type OrderStatus =
  | 'ORDER_CREATED'
  | 'ORDER_CONFIRMED'
  | 'PICKUP_SCHEDULED'
  | 'PICKUP_ASSIGNED'
  | 'OUT_FOR_PICKUP'
  | 'PICKUP_ARRIVED'
  | 'PICKED_UP'
  | 'PICKUP_FAILED'
  | 'RECEIVED_AT_FACILITY'
  | 'SORTING'
  | 'WASHING'
  | 'IRONING'
  | 'PACKING'
  | 'BILL_GENERATED'
  | 'READY_FOR_DISPATCH'
  | 'DELIVERY_ASSIGNED'
  | 'OUT_FOR_DELIVERY'
  | 'DELIVERY_ARRIVED'
  | 'DELIVERED'
  | 'DELIVERY_FAILED'
  | 'CANCELLED'
  | 'PROCESSING_ISSUE'
  | 'REFUND_INITIATED';

export type ServiceType = 'WASH_FOLD' | 'DRY_CLEAN' | 'IRON_ONLY';

export interface Order {
  id: number;
  orderNumber: string;
  customerId: number;
  customer?: User;
  addressId: number;
  address?: Address;
  facilityId?: number | null;
  facility?: Facility | null;
  pickupSlotId?: number | null;
  pickupSlot?: PickupSlot | null;
  serviceType: ServiceType;
  currentStatus: OrderStatus;
  isExpress: boolean;
  customerNotes?: string | null;
  initialWeight?: number | null;
  finalWeight?: number | null;
  createdAt: string;
  updatedAt: string;
  payment?: Payment | null;
  items?: OrderItem[];
  statusHistory?: OrderStatusHistory[];
}

export interface OrderItem {
  id: number;
  orderId: number;
  itemName: string;
  quantity: number;
  serviceType: ServiceType;
  pricePerItem: number;
  totalPrice: number;
}

export interface OrderStatusHistory {
  id: number;
  orderId: number;
  status: OrderStatus;
  changedByUser?: User;
  notes?: string | null;
  timestamp: string;
}

// ─── Payment ──────────────────────────────────────────────────────────────────
export type PaymentMethod = 'RAZORPAY_UPI' | 'RAZORPAY_CARD' | 'COD' | 'WALLET';
export type PaymentStatus = 'PENDING' | 'COMPLETED' | 'FAILED' | 'REFUNDED';

export interface Payment {
  id: number;
  orderId: number;
  paymentMethod: PaymentMethod | null;
  paymentStatus: PaymentStatus;
  razorpayOrderId?: string | null;
  razorpayPaymentId?: string | null;
  amount: number;
  gstAmount: number;
  totalAmount: number;
  paidAt?: string | null;
  createdAt: string;
}

// ─── Delivery ─────────────────────────────────────────────────────────────────
export type AssignmentType = 'PICKUP' | 'DELIVERY';
export type AssignmentStatus = 'ASSIGNED' | 'IN_PROGRESS' | 'COMPLETED' | 'FAILED';

export interface DeliveryAssignment {
  id: number;
  orderId: number;
  order?: Order;
  driverId: number;
  driver?: User;
  assignmentType: AssignmentType;
  assignedByUserId: number;
  assignedAt: string;
  status: AssignmentStatus;
  completedAt?: string | null;
  notes?: string | null;
}

// ─── Inventory ────────────────────────────────────────────────────────────────
export type InventoryCategory = 'DETERGENT' | 'PACKAGING' | 'TAG' | 'MACHINERY' | 'MISC';

export interface InventoryItem {
  id: number;
  facilityId: number;
  facility?: Facility;
  itemName: string;
  category: InventoryCategory;
  quantity: number;
  unit: string;
  lowStockThreshold: number;
  createdAt: string;
  updatedAt: string;
  isLowStock?: boolean;
}

export interface InventoryLog {
  id: number;
  inventoryItemId: number;
  inventoryItem?: InventoryItem;
  transactionType: 'ADDITION' | 'CONSUMPTION' | 'ADJUSTMENT';
  quantityChange: number;
  balanceAfter: number;
  notes?: string | null;
  createdByUser?: User;
  createdAt: string;
}

// ─── Reports ──────────────────────────────────────────────────────────────────
export interface DashboardSummary {
  todayOrders: number;
  monthlyRevenue: number;
  activeSubscriptions: number;
  pendingDeliveries: number;
  totalProcessed?: number;
  ordersByStatus: { status: string; count: number }[];
  revenueByDay: { date: string; revenue: number }[];
  ordersByServiceType: { serviceType: string; count: number }[];
}

// ─── OTP Auth (customers / drivers) ──────────────────────────────────────────
export interface SendOtpResponse {
  message: string;
  isNewUser: boolean;
}

export interface VerifyOtpResponse {
  accessToken: string;
  user: User;
}

// ─── Facility Staff Auth ──────────────────────────────────────────────────────

/** Response from POST /auth/staff-check */
export interface StaffCheckResponse {
  /** Whether a FACILITY_STAFF account exists for this mobile */
  exists: boolean;
  /**
   * true  → first login, no password set yet (OTP auto-sent by backend)
   * false → returning login, password already set
   * undefined when exists = false
   */
  isFirstLogin?: boolean;
  /** Staff member's name (undefined when exists = false) */
  name?: string;
  /** Temporary beta-only OTP preview for web notification */
  debugOtp?: string;
}

/** Response from POST /auth/staff-setup and POST /auth/staff-login */
export interface StaffAuthResponse {
  accessToken: string;
  user: {
    id: number;
    mobile: string;
    name: string;
    /** Returned as a plain string e.g. "FACILITY_STAFF" */
    role: string;
  };
}

// ─── Pagination ───────────────────────────────────────────────────────────────
export interface PaginatedResponse<T> {
  data: T[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}
