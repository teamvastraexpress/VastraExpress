-- AlterTable
ALTER TABLE `users` ADD COLUMN `must_change_password` BOOLEAN NOT NULL DEFAULT false;

-- CreateIndex
ALTER TABLE `pickup_slots` ADD UNIQUE INDEX `pickup_slots_facility_id_slot_date_start_time_key`(`facility_id`, `slot_date`, `start_time`);
