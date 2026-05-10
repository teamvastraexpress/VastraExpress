// ─── Auth ─────────────────────────────────────────────────────────────────────

export interface AuthUser {
  id: number;
  name: string | null;
  mobileNumber: string;
  email: string | null;
  role: string;
  isActive: boolean;
}

// ─── Address ──────────────────────────────────────────────────────────────────

export interface City {
  id: number;
  name: string;
  state: string;
}

export interface Address {
  id: number;
  houseFlatNo: string;
  street: string;
  landmark: string | null;
  pincode: string;
  latitude: number;
  longitude: number;
  cityId: number;
  city?: City;
  isDefault: boolean;
}

// ─── Facility Allocation ─────────────────────────────────────────────────────

export interface FacilityOptionSlot {
  id: number;
  startTime: string;
  endTime: string;
  availableCapacity: number;
}

export interface FacilityOption {
  facilityId: number;
  name: string;
  distanceKm: number;
  loadRatio: number;
  availableSlots: FacilityOptionSlot[];
}

export interface FacilityOptionsResponse {
  serviceable: boolean;
  message?: string;
  options: FacilityOption[];
}

// ─── Pickup Slot ──────────────────────────────────────────────────────────────

export interface PickupSlot {
  id: number;
  slotDate: string;        // ISO date string
  startTime: string;       // e.g. "09:00"
  endTime: string;         // e.g. "11:00"
  facilityId: number;
  maxCapacity: number;
  currentBookings: number;
  isActive: boolean;
}

// ─── Order ────────────────────────────────────────────────────────────────────

export type ServiceType = 'WASH_FOLD' | 'DRY_CLEAN' | 'IRON_ONLY';

export type OrderStatus =
  | 'ORDER_CREATED'
  | 'ORDER_CONFIRMED'
  | 'PICKUP_SCHEDULED'
  | 'PICKUP_ASSIGNED'
  | 'OUT_FOR_PICKUP'
  | 'PICKUP_ARRIVED'
  | 'PICKED_UP'
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
  | 'CANCELLED'
  | 'PICKUP_FAILED'
  | 'PROCESSING_ISSUE'
  | 'DELIVERY_FAILED';

export interface OrderStatusHistory {
  id: number;
  status: OrderStatus;
  notes: string | null;
  createdAt?: string;
  changedAt?: string;  // alias used by some responses
  changedBy?: { name: string | null; role: string };
}

export interface OrderItem {
  id: number;
  itemName: string;
  quantity: number;
  unitPrice?: number;
  price?: number;      // alias used by some responses
  totalPrice?: number;
}

export interface Order {
  id: number;
  orderNumber: string;
  status: OrderStatus;
  serviceType: ServiceType;
  isExpress: boolean;
  initialWeight: number | null;
  finalWeight: number | null;
  customerNotes: string | null;
  createdAt: string;
  updatedAt: string;
  address: Address;
  pickupSlot: PickupSlot;
  items?: OrderItem[];
}

// ─── Generic ──────────────────────────────────────────────────────────────────

export interface PaginatedResponse<T> {
  data: T[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}
