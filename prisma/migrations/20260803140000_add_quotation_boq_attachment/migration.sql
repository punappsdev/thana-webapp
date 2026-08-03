-- One optional private BOQ attachment per quotation request.
ALTER TABLE `QuotationRequest`
  ADD COLUMN `boqStoragePath` VARCHAR(512) NULL,
  ADD COLUMN `boqOriginalName` VARCHAR(255) NULL,
  ADD COLUMN `boqMimeType` VARCHAR(100) NULL,
  ADD COLUMN `boqSize` INT NULL,
  ADD COLUMN `boqDownloadToken` VARCHAR(64) NULL;

CREATE UNIQUE INDEX `QuotationRequest_boqDownloadToken_key`
  ON `QuotationRequest`(`boqDownloadToken`);
