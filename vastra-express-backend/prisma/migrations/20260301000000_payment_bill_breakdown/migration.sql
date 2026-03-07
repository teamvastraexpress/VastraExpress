-- AlterTable: payments
-- 1. Make payment_method nullable (was NOT NULL) — null until customer selects a method
-- 2. Add express_charge column for storing the express service surcharge separately
-- 3. Add wallet_discount column for the subscription wallet pre-deduction amount

ALTER TABLE `payments`
  MODIFY COLUMN `payment_method` VARCHAR(50) NULL,
  ADD COLUMN `express_charge` DECIMAL(10, 2) NOT NULL DEFAULT 0.00 AFTER `amount`,
  ADD COLUMN `wallet_discount` DECIMAL(10, 2) NOT NULL DEFAULT 0.00 AFTER `express_charge`;
