-- Add GPS fields for facilities and addresses
ALTER TABLE `addresses`
  ADD COLUMN `latitude` DECIMAL(10,7) NULL,
  ADD COLUMN `longitude` DECIMAL(10,7) NULL;

ALTER TABLE `facilities`
  ADD COLUMN `latitude` DECIMAL(10,7) NULL,
  ADD COLUMN `longitude` DECIMAL(10,7) NULL;

-- Backfill existing rows with placeholder coordinates (update with real GPS ASAP)
UPDATE `addresses` SET `latitude` = 0.0, `longitude` = 0.0
WHERE `latitude` IS NULL OR `longitude` IS NULL;

UPDATE `facilities` SET `latitude` = 0.0, `longitude` = 0.0
WHERE `latitude` IS NULL OR `longitude` IS NULL;

-- Enforce non-null
ALTER TABLE `addresses`
  MODIFY `latitude` DECIMAL(10,7) NOT NULL,
  MODIFY `longitude` DECIMAL(10,7) NOT NULL;

ALTER TABLE `facilities`
  MODIFY `latitude` DECIMAL(10,7) NOT NULL,
  MODIFY `longitude` DECIMAL(10,7) NOT NULL;

CREATE INDEX `idx_addresses_lat_lng` ON `addresses`(`latitude`, `longitude`);
CREATE INDEX `idx_facilities_lat_lng` ON `facilities`(`latitude`, `longitude`);
