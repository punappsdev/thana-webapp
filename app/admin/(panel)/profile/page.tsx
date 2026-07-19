import { UserRound } from "lucide-react";
import { ChangePasswordForm } from "@/components/admin/change-password-form";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { requireAdminPage } from "@/lib/admin/auth";

export default async function ProfilePage() {
  const user = await requireAdminPage();
  return <div className="mx-auto max-w-2xl space-y-6"><div><h1 className="font-headline-lg font-semibold">ตั้งค่าบัญชี</h1><p className="font-body-sm text-muted-foreground">จัดการข้อมูลและความปลอดภัยของบัญชีผู้ดูแล</p></div><Card><CardHeader><CardTitle className="flex items-center gap-2 font-headline-sm"><UserRound className="size-5 text-primary" />ข้อมูลบัญชี</CardTitle><CardDescription className="font-body-sm">{user.name} · {user.email}</CardDescription></CardHeader><CardContent><ChangePasswordForm /></CardContent></Card></div>;
}
