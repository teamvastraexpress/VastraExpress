// ─── Auth ─────────────────────────────────────────────────────────────────────

export interface AuthUser {
  id: string;
  name: string | null;
  mobileNumber: string;
  email: string | null;
  customerId?: string | null;
  role: { id: string; name: string } | string;
  isActive: boolean;
}

// ─── Address ──────────────────────────────────────────────────────────────────

export interface City {
  id: string;
  name: string;
  state: string;
  isActive: boolean;
}

export interface Address {
  id: string;
  userId?: string;
  houseFlatNo: string;
  street: string;
  landmark?: string | null;
  pincode: string;
  latitude: number;
  longitude: number;
  cityId: string;
  city?: City;
  isDefault: boolean;
  createdAt?: string;
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
  id: string;
  slotDate: string;          // ISO date string from backend (e.g. "2025-01-15T00:00:00.000Z")
  date?: string;             // deprecated alias kept for legacy usage
  startTime: string;
  endTime: string;
  facilityId?: string;
  maxCapacity: number;       // backend field name (was maxBookings)
  currentBookings: number;
  availableCapacity?: number;
  isActive: boolean;
}

// ─── Order ────────────────────────────────────────────────────────────────────

export type ServiceType = 'WASH_FOLD' | 'DRY_CLEAN' | 'IRON_ONLY' | 'WASH_IRON' | 'SOFA_CLEANING';

export type OrderStatus =
  | 'PENDING_APPROVAL'
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
  | 'DELIVERY_FAILED'
  | 'DECLINED';

export interface OrderStatusHistory {
  id: string;
  status: OrderStatus;
  notes: string | null;
  changedAt?: string;
  createdAt?: string;
  changedBy?: { name: string | null; role: string };
}

export interface Order {
  id: string;
  orderNumber: string;
  currentStatus: OrderStatus;
  serviceType: ServiceType;
  isExpress: boolean;
  notes?: string | null;
  initialWeight?: number | null;
  finalWeight?: number | null;
  paymentMethod?: string | null;
  createdAt: string;
  updatedAt: string;
  pickupSlotId?: string | null;
  address?: Address;
  pickupSlot?: PickupSlot | null;
  facility?: { id: string; name: string; contactNumber?: string | null } | null;
  statusHistory?: OrderStatusHistory[];
}

// ─── Pagination ───────────────────────────────────────────────────────────────

export interface PaginatedResponse<T> {
  data: T[];
  meta: {
    total: number;
    page: number;
    limit: number;
    totalPages: number;
  };
  total?: number;
}

// ─── Map / Store Locator ──────────────────────────────────────────────────────

export interface MapFacility {
  id: number;
  name: string;
  facilityCode: string;
  address: string;
  latitude: number;   // Decimal from backend, cast to number
  longitude: number;
  contactNumber: string;
  isActive: boolean;
  city: { id: number; name: string; state: string };
}
