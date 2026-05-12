/*
  Warnings:

  - You are about to drop the column `subscription_id` on the `orders` table. All the data in the column will be lost.
  - You are about to drop the `order_items` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `payments` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `pricing_configurations` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `refunds` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `subscription_plans` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `subscriptions` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `wallet_transactions` table. If the table is not empty, all the data it contains will be lost.

*/
-- DropForeignKey
ALTER TABLE `order_items` DROP FOREIGN KEY `order_items_order_id_fkey`;

-- DropForeignKey
ALTER TABLE `orders` DROP FOREIGN KEY `orders_subscription_id_fkey`;

-- DropForeignKey
ALTER TABLE `payments` DROP FOREIGN KEY `payments_order_id_fkey`;

-- DropForeignKey
ALTER TABLE `pricing_configurations` DROP FOREIGN KEY `pricing_configurations_city_id_fkey`;

-- DropForeignKey
ALTER TABLE `refunds` DROP FOREIGN KEY `refunds_order_id_fkey`;

-- DropForeignKey
ALTER TABLE `refunds` DROP FOREIGN KEY `refunds_payment_id_fkey`;

-- DropForeignKey
ALTER TABLE `refunds` DROP FOREIGN KEY `refunds_processed_by_user_id_fkey`;

-- DropForeignKey
ALTER TABLE `subscriptions` DROP FOREIGN KEY `subscriptions_customer_id_fkey`;

-- DropForeignKey
ALTER TABLE `subscriptions` DROP FOREIGN KEY `subscriptions_plan_id_fkey`;

-- DropForeignKey
ALTER TABLE `wallet_transactions` DROP FOREIGN KEY `wallet_transactions_order_id_fkey`;

-- DropForeignKey
ALTER TABLE `wallet_transactions` DROP FOREIGN KEY `wallet_transactions_subscription_id_fkey`;

-- DropIndex
DROP INDEX `orders_subscription_id_fkey` ON `orders`;

-- AlterTable
ALTER TABLE `orders` DROP COLUMN `subscription_id`;

-- DropTable
DROP TABLE `order_items`;

-- DropTable
DROP TABLE `payments`;

-- DropTable
DROP TABLE `pricing_configurations`;

-- DropTable
DROP TABLE `refunds`;

-- DropTable
DROP TABLE `subscription_plans`;

-- DropTable
DROP TABLE `subscriptions`;

-- DropTable
DROP TABLE `wallet_transactions`;
