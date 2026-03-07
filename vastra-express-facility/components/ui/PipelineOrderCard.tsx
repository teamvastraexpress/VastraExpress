'use client';

import { useState, useRef, useCallback } from 'react';
import { getStatusColor, statusLabel, formatDate } from '@/lib/utils';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import {
  UserPlus,
  Scale,
  ListOrdered,
  ArrowRightCircle,
  CalendarClock,
  MessageSquare,
  MapPin,
  CheckCircle,
} from 'lucide-react';
import type { Order, OrderStatus } from '@/types';

// Single next-status quick advance (no modal needed)
const QUICK_NEXT: Partial<Record<string, OrderStatus>> = {
  PICKED_UP:            'RECEIVED_AT_FACILITY',
  RECEIVED_AT_FACILITY: 'SORTING',
  SORTING:              'WASHING',
  WASHING:              'IRONING',
  IRONING:              'PACKING',
  BILL_GENERATED:       'READY_FOR_DISPATCH',
};

// Statuses whose next step requires a choice (opens a modal)
const HAS_MULTI_NEXT = new Set(['PACKING']);

interface Props {
  order: Order;
  onAssignDriver: (order: Order, type: 'PICKUP' | 'DELIVERY') => void;
  /** Direct status jump – no modal */
  onQuickStatus: (order: Order, toStatus: OrderStatus) => void;
  /** Opens status-choice modal (PACKING → multiple options) */
  onAdvanceStatus: (order: Order) => void;
  onSetWeight: (order: Order) => void;
  onManageItems: (order: Order) => void;
}

export function PipelineOrderCard({
  order,
  onAssignDriver,
  onQuickStatus,
  onAdvanceStatus,
  onSetWeight,
  onManageItems,
}: Props) {
  const [hovered, setHovered] = useState(false);
  const [popoverStyle, setPopoverStyle] = useState<React.CSSProperties>({});
  const cardRef = useRef<HTMLDivElement>(null);
  const hideTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const showPopover = useCallback(() => {
    if (hideTimer.current) clearTimeout(hideTimer.current);
    if (cardRef.current) {
      const rect = cardRef.current.getBoundingClientRect();
      const POPOVER_H = 360;
      const showAbove = rect.top > POPOVER_H + 16;
      setPopoverStyle({
        position: 'fixed',
        left: Math.max(8, Math.min(rect.left, window.innerWidth - 296)),
        ...(showAbove
          ? { top: rect.top - 8, transform: 'translateY(-100%)' }
          : { top: rect.bottom + 8 }),
        zIndex: 9999,
        width: 284,
      });
    }
    setHovered(true);
  }, []);

  const hidePopover = useCallback(() => {
    hideTimer.current = setTimeout(() => setHovered(false), 150);
  }, []);

  const keepOpen = useCallback(() => {
    if (hideTimer.current) clearTimeout(hideTimer.current);
  }, []);

  const close = () => setHovered(false);

  const status = order.currentStatus;

  const isPendingPickup = [
    'ORDER_CREATED', 'ORDER_CONFIRMED', 'PICKUP_SCHEDULED',
    'PICKUP_ASSIGNED', 'OUT_FOR_PICKUP', 'PICKUP_ARRIVED',
  ].includes(status);

  const isPickedUp      = status === 'PICKED_UP';
  const isAtFacility    = ['RECEIVED_AT_FACILITY', 'SORTING', 'WASHING', 'IRONING', 'PACKING'].includes(status);
  const isReady         = status === 'READY_FOR_DISPATCH';
  const canManageItems  = isAtFacility || status === 'BILL_GENERATED';
  const quickNext       = QUICK_NEXT[status];
  const hasMultiNext    = HAS_MULTI_NEXT.has(status);

  const slot = order.pickupSlot;
  const slotText = slot
    ? `${formatDate(slot.slotDate)} · ${slot.startTime}–${slot.endTime}`
    : null;

  return (
    <>
      {/* ── Card ──────────────────────────────────────────────────────────── */}
      <div
        ref={cardRef}
        className="bg-white rounded-lg p-3 border border-gray-200 hover:border-emerald-400 hover:shadow-md transition-all cursor-default"
        onMouseEnter={showPopover}
        onMouseLeave={hidePopover}
      >
        <p className="text-xs font-semibold text-gray-900">#{order.orderNumber}</p>
        <p className="text-xs text-gray-500 mt-0.5 truncate">
          {order.customer?.name ?? 'Customer'}
        </p>
        <div className="flex items-center justify-between mt-2 gap-1 flex-wrap">
          <Badge className={`text-[10px] ${getStatusColor(order.serviceType)}`}>
            {order.serviceType?.replace(/_/g, ' ')}
          </Badge>
          {order.isExpress && (
            <span className="text-[10px] font-semibold text-orange-600 bg-orange-50 px-1.5 py-0.5 rounded-full">
              EXPRESS
            </span>
          )}
        </div>
        <div className="mt-1.5">
          <Badge className={`text-[10px] ${getStatusColor(status)}`}>
            {statusLabel(status)}
          </Badge>
        </div>
      </div>

      {/* ── Popover (fixed-position so it escapes overflow containers) ─────── */}
      {hovered && (
        <div
          style={popoverStyle}
          className="bg-white rounded-xl border border-gray-200 shadow-2xl p-4 text-sm"
          onMouseEnter={keepOpen}
          onMouseLeave={hidePopover}
        >
          {/* Header */}
          <div className="flex items-start justify-between gap-2 mb-3">
            <div>
              <p className="font-bold text-gray-900">#{order.orderNumber}</p>
              <p className="text-xs text-gray-500">{order.customer?.name}</p>
              {order.customer?.mobileNumber && (
                <p className="text-xs text-gray-400">{order.customer.mobileNumber}</p>
              )}
            </div>
            <div className="flex flex-col items-end gap-1 shrink-0">
              <Badge className={`text-[10px] ${getStatusColor(status)}`}>
                {statusLabel(status)}
              </Badge>
              {order.isExpress && (
                <span className="text-[10px] font-semibold text-orange-600 bg-orange-50 px-1.5 py-0.5 rounded-full">
                  EXPRESS
                </span>
              )}
            </div>
          </div>

          {/* Pickup slot */}
          {slotText && (
            <div className="flex items-start gap-2 bg-purple-50 rounded-lg px-2.5 py-2 mb-2">
              <CalendarClock className="w-3.5 h-3.5 text-purple-500 mt-0.5 shrink-0" />
              <div>
                <p className="text-[10px] text-purple-500 font-semibold uppercase tracking-wide">
                  Pickup Slot
                </p>
                <p className="text-xs text-purple-800 font-medium">{slotText}</p>
              </div>
            </div>
          )}

          {/* Customer note */}
          {order.customerNotes && (
            <div className="flex items-start gap-2 bg-amber-50 rounded-lg px-2.5 py-2 mb-2">
              <MessageSquare className="w-3.5 h-3.5 text-amber-500 mt-0.5 shrink-0" />
              <div>
                <p className="text-[10px] text-amber-500 font-semibold uppercase tracking-wide">
                  Customer Note
                </p>
                <p className="text-xs text-amber-800">{order.customerNotes}</p>
              </div>
            </div>
          )}

          {/* Pickup address */}
          {order.address && (isPendingPickup || isPickedUp) && (
            <div className="flex items-start gap-2 bg-gray-50 rounded-lg px-2.5 py-2 mb-2">
              <MapPin className="w-3.5 h-3.5 text-gray-400 mt-0.5 shrink-0" />
              <p className="text-xs text-gray-600">
                {order.address.houseFlatNo}, {order.address.street}
                {order.address.landmark && `, ${order.address.landmark}`}
                {order.address.city && ` · ${order.address.city.name}`}
              </p>
            </div>
          )}

          {/* Weight info */}
          {(order.initialWeight || order.finalWeight) && (
            <div className="flex items-center gap-3 text-xs text-gray-600 mb-2 px-1">
              {order.initialWeight && (
                <span>📦 Pickup: <strong>{order.initialWeight} kg</strong></span>
              )}
              {order.finalWeight && (
                <span>⚖️ Final: <strong>{order.finalWeight} kg</strong></span>
              )}
            </div>
          )}

          <div className="border-t border-gray-100 mb-3" />

          {/* ── Actions ──────────────────────────────────────────────────── */}
          <div className="space-y-2">

            {/* Pending pickup → assign driver */}
            {isPendingPickup && (
              <Button
                size="sm"
                variant="outline"
                leftIcon={<UserPlus className="w-3.5 h-3.5" />}
                onClick={() => { close(); onAssignDriver(order, 'PICKUP'); }}
                className="w-full text-xs"
              >
                Assign Driver (Pickup)
              </Button>
            )}

            {/* Picked up → mark received */}
            {isPickedUp && (
              <Button
                size="sm"
                leftIcon={<CheckCircle className="w-3.5 h-3.5" />}
                onClick={() => { close(); onQuickStatus(order, 'RECEIVED_AT_FACILITY'); }}
                className="w-full text-xs"
              >
                Mark Received at Facility
              </Button>
            )}

            {/* At facility → set weight */}
            {isAtFacility && (
              <Button
                size="sm"
                variant="outline"
                leftIcon={<Scale className="w-3.5 h-3.5" />}
                onClick={() => { close(); onSetWeight(order); }}
                className="w-full text-xs"
              >
                {order.finalWeight ? 'Update Weight' : 'Set Final Weight'}
              </Button>
            )}

            {/* At facility / bill generated → manage items + bill */}
            {canManageItems && (
              <Button
                size="sm"
                variant="outline"
                leftIcon={<ListOrdered className="w-3.5 h-3.5" />}
                onClick={() => { close(); onManageItems(order); }}
                className="w-full text-xs"
              >
                Add Items / Generate Bill
              </Button>
            )}

            {/* Quick single-next advance (not for PICKED_UP — covered above) */}
            {quickNext && !isPickedUp && (
              <Button
                size="sm"
                leftIcon={<ArrowRightCircle className="w-3.5 h-3.5" />}
                onClick={() => { close(); onQuickStatus(order, quickNext); }}
                className="w-full text-xs"
              >
                Move to {statusLabel(quickNext)}
              </Button>
            )}

            {/* Multi-choice advance (PACKING → Bill Generated / Ready) */}
            {hasMultiNext && (
              <Button
                size="sm"
                leftIcon={<ArrowRightCircle className="w-3.5 h-3.5" />}
                onClick={() => { close(); onAdvanceStatus(order); }}
                className="w-full text-xs"
              >
                Advance Status…
              </Button>
            )}

            {/* Ready for dispatch → assign delivery driver */}
            {isReady && (
              <Button
                size="sm"
                variant="outline"
                leftIcon={<UserPlus className="w-3.5 h-3.5" />}
                onClick={() => { close(); onAssignDriver(order, 'DELIVERY'); }}
                className="w-full text-xs"
              >
                Assign Driver (Delivery)
              </Button>
            )}
          </div>
        </div>
      )}
    </>
  );
}
