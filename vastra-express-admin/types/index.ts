// ─── Auth ─────────────────────────────────────────────────────────────────────
export interface LoginResponse {
  token: string;
  user: User;
}

// ─── User ─────────────────────────────────────────────────────────────────────
export interface User {
  id: number;
  mobileNumber: string;
  customerId?: string | null;   // e.g. C001 — only for CUSTOMER role
  name: string;
  email?: string | null;
  role: Role;
  isActive: boolean;
  /**
   * Only present for FACILITY_STAFF.
   * true  = account created by admin but staff has not logged in / set password yet
   * false = staff has completed first-login setup
   */
  isSetupPending?: boolean;
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
  employeeId?: string | null;   // e.g. FE01 (facility staff), FD01 (driver)   // e.g. E001
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
  staff?: Array<{ userId: number; user: { id: number; name: string; mobileNumber: string } }>;
}

/** Shape returned by GET /facilities/staff */
export interface FacilityStaffOption {
  staffId: number;
  userId: number;
  employeeId: string | null;
  name: string;
  mobileNumber: string;
  isActive: boolean;
  currentFacility: { id: number; name: string; code: string } | null;
}

// ─── Pickup Slot ──────────────────────────────────────────────────────────────
export interface PickupSlot {
  id: number;
  facilityId: number;
  facility?: Facility;
  date: string;
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
  | 'READY_FOR_DISPATCH'
  | 'DELIVERY_ASSIGNED'
  | 'OUT_FOR_DELIVERY'
  | 'DELIVERY_ARRIVED'
  | 'DELIVERED'
  | 'DELIVERY_FAILED'
  | 'CANCELLED'
  | 'PROCESSING_ISSUE';

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
  totalCustomers: number;
  pendingDeliveries: number;
  activeFacilities: number;
  ordersByStatus: { status: string; count: number }[];
  ordersByServiceType: { serviceType: string; count: number }[];
  ordersByDay: { date: string; count: number }[];
  ordersByDayByFacility: { date: string; facilityId: number; facilityName: string; count: number }[];
}

// ─── Pagination ───────────────────────────────────────────────────────────────
export interface PaginatedResponse<T> {
  data: T[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}
