-- AlterTable: add must_change_password flag for first-time staff/driver login
ALTER TABLE `users` ADD COLUMN `must_change_password` BOOLEAN NOT NULL DEFAULT false;
