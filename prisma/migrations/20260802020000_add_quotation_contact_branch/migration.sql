-- Store the branch selected by the customer so the quotation can be routed to
-- the right team. Existing requests use the headquarters as a safe default.
ALTER TABLE `QuotationRequest`
  ADD COLUMN `contactBranch` VARCHAR(32) NOT NULL DEFAULT 'headquarters';
