-- AlterTable
ALTER TABLE `QuotationRequest` MODIFY `contactBranch` VARCHAR(32) NULL;

-- ล้างค่าที่ไม่เคยเป็นตัวเลือกของลูกค้า: คำขอแบบจัดส่งถูกบันทึกด้วยค่า default
-- ("headquarters") มาตลอด ทั้งที่ฟอร์มไม่ได้ถามสาขาเลย ค่านั้นจึงไม่ใช่ข้อมูลจริง
-- และไม่มีโค้ดส่วนไหนอ่านมันตอน needDelivery เป็น true — ดู migration
-- 20260806100000_add_quotation_responsible_branch สำหรับสาขาที่รับผิดชอบใบจัดส่ง
UPDATE `QuotationRequest` SET `contactBranch` = NULL WHERE `needDelivery` = 1;
