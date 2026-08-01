-- Delivery address requested with a quotation. Existing requests do not need one.

-- AlterTable
ALTER TABLE `QuotationRequest`
    ADD COLUMN `needDelivery` BOOLEAN NOT NULL DEFAULT false,
    ADD COLUMN `deliveryAddressLine` VARCHAR(255) NULL,
    ADD COLUMN `deliverySubDistrict` VARCHAR(120) NULL,
    ADD COLUMN `deliveryDistrict` VARCHAR(120) NULL,
    ADD COLUMN `deliveryProvince` VARCHAR(64) NULL,
    ADD COLUMN `deliveryPostalCode` VARCHAR(10) NULL;
