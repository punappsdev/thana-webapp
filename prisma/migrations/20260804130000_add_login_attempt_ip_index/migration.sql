-- CreateIndex
CREATE INDEX `AdminLoginAttempt_ipAddress_createdAt_idx` ON `AdminLoginAttempt`(`ipAddress`, `createdAt`);
