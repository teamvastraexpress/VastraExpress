/*
  Warnings:

  - A unique constraint covering the columns `[facility_code]` on the table `facilities` will be added. If there are existing duplicate values, this will fail.
  - A unique constraint covering the columns `[employee_id]` on the table `staff` will be added. If there are existing duplicate values, this will fail.
  - A unique constraint covering the columns `[customer_id]` on the table `users` will be added. If there are existing duplicate values, this will fail.
  - Added the required column `facility_code` to the `facilities` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE `facilities` ADD COLUMN `facility_code` VARCHAR(50) NOT NULL;

-- AlterTable
ALTER TABLE `staff` ADD COLUMN `employee_id` VARCHAR(20) NULL;

-- AlterTable
ALTER TABLE `users` ADD COLUMN `customer_id` VARCHAR(20) NULL;

-- CreateIndex
CREATE UNIQUE INDEX `facilities_facility_code_key` ON `facilities`(`facility_code`);

-- CreateIndex
CREATE UNIQUE INDEX `staff_employee_id_key` ON `staff`(`employee_id`);

-- CreateIndex
CREATE UNIQUE INDEX `users_customer_id_key` ON `users`(`customer_id`);
