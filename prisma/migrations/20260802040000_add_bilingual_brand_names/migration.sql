-- Rename the existing brand name to the Thai field, then add and backfill the
-- English field before making it required. This preserves all Brand row ids,
-- slugs, relations, logos, and website URLs.
ALTER TABLE `Brand` CHANGE COLUMN `name` `nameTh` VARCHAR(191) NOT NULL;

ALTER TABLE `Brand` ADD COLUMN `nameEn` VARCHAR(191) NULL;

UPDATE `Brand` SET `nameEn` = `nameTh` WHERE `nameEn` IS NULL;

ALTER TABLE `Brand` MODIFY COLUMN `nameEn` VARCHAR(191) NOT NULL;
