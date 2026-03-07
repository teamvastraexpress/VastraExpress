// ─── Auth ─────────────────────────────────────────────────────────────────────

export interface AuthUser {
  id: number;
  name: string | null;
  mobileNumber: string;
  email: string | null;
  role: { id: number; name: string } | string;
  isActive: boolean;
  staffProfile?: {
    id: number;
    employeeId: string | null;
    facilityId: number;
    facility?: { id: number; name: string };
  } | null;
}

export interface SendOtpResponse {
  message: string;
  expiresIn: number;
  isNewUser: boolean;
}

export interface VerifyOtpResponse {
  accessToken: string;
  user: AuthUser;
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

export interface OrderAddress {
  id: number;
  houseFlatNo: string;
  street: string;
  landmark?: string | null;
  pincode: string;
  city: { id: number; name: string };
}

export interface OrderCustomer {
  id: number;
  name: string | null;
  mobileNumber: string;
}

export interface PickupSlot {
  id: number;
  slotDate: string;
  startTime: string;
  endTime: string;
}

// ─── Delivery Assignment ──────────────────────────────────────────────────────

export type AssignmentType = 'PICKUP' | 'DELIVERY';
export type AssignmentStatus = 'ASSIGNED' | 'IN_PROGRESS' | 'COMPLETED' | 'FAILED';

export interface DeliveryAssignment {
  id: number;
  orderId: number;
  driverId: number;
  assignmentType: AssignmentType;
  assignedAt: string;
  status: AssignmentStatus;
  completedAt: string | null;
  notes: string | null;
  order: {
    id: number;
    orderNumber: string;
    currentStatus: OrderStatus;
    serviceType: ServiceType;
    isExpress: boolean;
    initialWeight: number | null;
    finalWeight: number | null;
    customer: OrderCustomer;
    address: OrderAddress;
    pickupSlot: PickupSlot | null;
    payment?: {
      id: number;
      paymentMethod: 'COD' | 'RAZORPAY_UPI' | 'RAZORPAY_CARD' | 'WALLET' | null;
      paymentStatus: 'PENDING' | 'COMPLETED' | 'FAILED' | 'REFUNDED';
      amount: number;
      gstAmount: number;
      totalAmount: number;
    } | null;
  };
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
}
