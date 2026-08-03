-- เก็บผลการแจ้งเตือนคำขอใบเสนอราคาเข้ากลุ่ม LINE ของสาขา
-- คำขอที่มีอยู่เดิมถือว่ายังไม่เคยแจ้ง (lineNotifiedAt NULL, lineNotifyCount 0)
-- ทีมงานจึงกดส่งซ้ำจากหลังบ้านได้ถ้าต้องการแจ้งย้อนหลัง
ALTER TABLE `QuotationRequest`
  ADD COLUMN `lineNotifiedAt` DATETIME(3) NULL,
  ADD COLUMN `lineNotifyError` VARCHAR(500) NULL,
  ADD COLUMN `lineNotifyCount` INT NOT NULL DEFAULT 0;
