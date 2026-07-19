import { redirect } from "next/navigation";
import { ShieldCheck } from "lucide-react";
import { getAdminSession } from "@/lib/admin/auth";
import { LoginForm } from "@/components/admin/login-form";

export default async function AdminLoginPage() {
  if (await getAdminSession()) redirect("/admin");

  return (
    <main className="relative flex min-h-screen items-center justify-center overflow-hidden px-4 py-12">
      <div className="absolute inset-0 bg-linear-to-br from-primary via-primary-container to-secondary" />
      <div className="absolute inset-0 opacity-10 [background-image:radial-gradient(circle_at_2px_2px,white_1px,transparent_0)] [background-size:28px_28px]" />
      <section className="relative z-10 w-full max-w-md rounded-lg border border-white/30 bg-white/90 p-6 shadow-blue-lg backdrop-blur-xl md:p-8">
        <div className="mb-8 flex items-center gap-4">
          <div className="flex size-12 items-center justify-center rounded-md bg-primary text-primary-foreground shadow-blue-md">
            <ShieldCheck className="size-6" aria-hidden="true" />
          </div>
          <div>
            <p className="font-headline-sm font-semibold text-primary">THANA ADMIN</p>
            <p className="font-body-sm text-muted-foreground">ระบบจัดการเนื้อหาเว็บไซต์</p>
          </div>
        </div>
        <h1 className="font-headline-md font-semibold">เข้าสู่ระบบผู้ดูแล</h1>
        <p className="mt-2 font-body-sm text-muted-foreground">กรอกอีเมลและรหัสผ่านสำหรับผู้ดูแลระบบ</p>
        <LoginForm />
      </section>
    </main>
  );
}
