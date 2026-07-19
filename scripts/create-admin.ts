import "dotenv/config";
import { getPrisma } from "../lib/prisma";
import { hashAdminPassword, validateAdminPassword } from "../lib/admin/security";

async function main() {
  const email = process.env.ADMIN_EMAIL?.trim().toLowerCase();
  const password = process.env.ADMIN_PASSWORD ?? "";
  const name = process.env.ADMIN_NAME?.trim() || "ผู้ดูแลระบบ";

  if (!email || !email.includes("@")) throw new Error("ADMIN_EMAIL ไม่ถูกต้อง");
  const passwordValidation = validateAdminPassword(password);
  if (!passwordValidation.ok) throw new Error(passwordValidation.message);

  const prisma = getPrisma();
  const passwordHash = await hashAdminPassword(password);
  await prisma.adminUser.upsert({
    where: { email },
    update: { name, passwordHash, active: true, passwordChangedAt: new Date() },
    create: { email, name, passwordHash },
  });
  await prisma.adminSession.deleteMany({ where: { user: { email } } });
  console.log(`สร้างหรืออัปเดตบัญชีผู้ดูแล ${email} สำเร็จ`);
}

main()
  .catch((error) => {
    console.error(error instanceof Error ? error.message : error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await getPrisma().$disconnect();
  });
