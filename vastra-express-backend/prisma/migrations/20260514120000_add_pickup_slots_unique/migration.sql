-- Cleanup duplicate pickup slots before adding unique constraint

-- 1) Move any orders to the canonical slot (min id per facility/date/start)
UPDATE orders o
JOIN pickup_slots ps ON ps.id = o.pickup_slot_id
JOIN (
  SELECT facility_id, slot_date, start_time, MIN(id) AS keep_id
  FROM pickup_slots
  GROUP BY facility_id, slot_date, start_time
) k ON k.facility_id = ps.facility_id AND k.slot_date = ps.slot_date AND k.start_time = ps.start_time
SET o.pickup_slot_id = k.keep_id
WHERE o.pickup_slot_id <> k.keep_id;

-- 2) Recompute current_bookings from orders
UPDATE pickup_slots ps
LEFT JOIN (
  SELECT pickup_slot_id, COUNT(*) AS cnt
  FROM orders
  GROUP BY pickup_slot_id
) o ON o.pickup_slot_id = ps.id
SET ps.current_bookings = COALESCE(o.cnt, 0);

-- 3) Delete duplicate pickup slots, keep smallest id per facility/date/start
DELETE ps
FROM pickup_slots ps
JOIN (
  SELECT facility_id, slot_date, start_time, MIN(id) AS keep_id, COUNT(*) AS dup_count
  FROM pickup_slots
  GROUP BY facility_id, slot_date, start_time
  HAVING dup_count > 1
) d ON d.facility_id = ps.facility_id AND d.slot_date = ps.slot_date AND d.start_time = ps.start_time
WHERE ps.id <> d.keep_id;

-- 4) Enforce uniqueness for automatic generation
CREATE UNIQUE INDEX pickup_slots_facility_id_slot_date_start_time_key
  ON pickup_slots (facility_id, slot_date, start_time);
