// ─── Auth ─────────────────────────────────────────────────────────────────────

export interface AuthUser {
  id: number;
  name: string | null;
  mobile: string;
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
  cityId: number;
  city?: City;
  isDefault: boolean;
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
  | 'BILL_GENERATED'
  | 'READY_FOR_DISPATCH'
  | 'DELIVERY_ASSIGNED'
  | 'OUT_FOR_DELIVERY'
  | 'DELIVERY_ARRIVED'
  | 'DELIVERED'
  | 'CANCELLED'
  | 'PICKUP_FAILED'
  | 'PROCESSING_ISSUE'
  | 'DELIVERY_FAILED'
  | 'REFUND_INITIATED';

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
  estimatedAmount: number | null;
  finalAmount: number | null;
  customerNotes: string | null;
  createdAt: string;
  updatedAt: string;
  address: Address;
  pickupSlot: PickupSlot;
  items?: OrderItem[];
  payment?: Payment | null;
}

// ─── Payment ──────────────────────────────────────────────────────────────────

export type PaymentStatus = 'PENDING' | 'COMPLETED' | 'PAID' | 'FAILED' | 'REFUNDED';
export type PaymentMethod = 'RAZORPAY_UPI' | 'RAZORPAY_CARD' | 'COD' | 'WALLET';

export interface Payment {
  id: number;
  orderId: number;
  amount: number;           // subtotal (pre-GST)
  gstAmount?: number;
  totalAmount: number;      // amount due after wallet deduction
  method?: PaymentMethod;
  paymentMethod?: PaymentMethod | 'PENDING'; // 'PENDING' = not yet selected by customer
  paymentStatus: PaymentStatus;
  status?: PaymentStatus;   // alias
  razorpayOrderId?: string | null;
  paidAt?: string | null;
  createdAt: string;
}

// ─── Subscription & Wallet ────────────────────────────────────────────────────

export interface SubscriptionPlan {
  id: number;
  name: string;
  description: string | null;
  durationDays?: number;
  validityDays?: number;      // alias used by some responses
  price: number;
  walletCredit?: number;
  walletAmount?: number;      // alias used by some responses
  discountPercent?: number;
  benefits: Record<string, unknown> | null;
  isActive: boolean;
}

export interface MySubscription {
  id: number;
  planId: number;
  plan: SubscriptionPlan;
  walletBalance: number;
  startDate?: string;
  endDate?: string;
  expiresAt?: string;       // alias used by some responses
  isActive?: boolean;
  status?: string;
  autoRenew: boolean;
  lowBalanceAlert?: boolean;
}

export interface WalletTransaction {
  id: number;
  type: 'CREDIT' | 'DEBIT';
  amount: number;
  description: string;
  createdAt: string;
  orderId: number | null;
}

// ─── Generic ──────────────────────────────────────────────────────────────────

export interface PaginatedResponse<T> {
  data: T[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}
