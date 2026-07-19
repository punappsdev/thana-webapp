"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  Activity,
  BookOpen,
  Boxes,
  BriefcaseBusiness,
  FileText,
  ImageIcon,
  LayoutDashboard,
  LogOut,
  Menu,
  Newspaper,
  Package,
  Settings,
  Tags,
  UserRound,
} from "lucide-react";
import { logoutAction } from "@/app/admin/login/actions";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from "@/components/ui/sheet";
import { cn } from "@/lib/utils";

const navigation = [
  { label: "ภาพรวม", href: "/admin", icon: LayoutDashboard },
  { label: "สินค้า", href: "/admin/products", icon: Package },
  { label: "ข้อมูลสินค้า", href: "/admin/catalog", icon: Boxes },
  { label: "ผลงาน", href: "/admin/content/works", icon: BriefcaseBusiness },
  { label: "บทความ", href: "/admin/content/articles", icon: BookOpen },
  { label: "ข่าว", href: "/admin/content/news", icon: Newspaper },
  { label: "โปรโมชั่น", href: "/admin/content/promotions", icon: Tags },
  { label: "คลังไฟล์", href: "/admin/media", icon: ImageIcon },
  { label: "บันทึกกิจกรรม", href: "/admin/activity", icon: Activity },
];

function NavContent({ pathname }: { pathname: string }) {
  return (
    <>
      <div className="px-5 py-6">
        <div className="flex items-center gap-3">
          <div className="flex size-10 items-center justify-center rounded-md bg-primary text-primary-foreground">
            <FileText className="size-5" />
          </div>
          <div>
            <p className="font-headline-sm font-semibold">THANA</p>
            <p className="font-label-sm text-muted-foreground">ADMIN PANEL</p>
          </div>
        </div>
      </div>
      <Separator />
      <nav className="flex-1 space-y-1 overflow-y-auto p-3" aria-label="เมนูผู้ดูแล">
        {navigation.map((item) => {
          const active = item.href === "/admin" ? pathname === item.href : pathname.startsWith(item.href);
          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                "flex items-center gap-3 rounded-md px-3 py-2.5 font-label-md transition-colors",
                active ? "bg-primary text-primary-foreground shadow-blue-sm" : "text-sidebar-foreground hover:bg-sidebar-accent",
              )}
            >
              <item.icon className="size-4" aria-hidden="true" />
              {item.label}
            </Link>
          );
        })}
      </nav>
      <div className="border-t p-3">
        <Link href="/admin/profile" className="flex items-center gap-3 rounded-md px-3 py-2 font-label-md hover:bg-sidebar-accent">
          <Settings className="size-4" /> ตั้งค่าบัญชี
        </Link>
        <form action={logoutAction}>
          <Button type="submit" variant="ghost" className="mt-1 w-full justify-start font-label-md">
            <LogOut className="size-4" /> ออกจากระบบ
          </Button>
        </form>
      </div>
    </>
  );
}

export function AdminShell({ user, children }: { user: { name: string; email: string }; children: React.ReactNode }) {
  const pathname = usePathname();
  return (
    <div className="min-h-screen bg-muted/40">
      <aside className="fixed inset-y-0 left-0 z-40 hidden w-64 flex-col border-r bg-sidebar lg:flex">
        <NavContent pathname={pathname} />
      </aside>
      <div className="lg:pl-64">
        <header className="sticky top-0 z-30 flex h-16 items-center justify-between border-b bg-background/85 px-4 backdrop-blur-xl md:px-6">
          <div className="flex items-center gap-3">
            <Sheet>
              <SheetTrigger asChild>
                <Button variant="outline" size="icon" className="lg:hidden" aria-label="เปิดเมนู">
                  <Menu className="size-5" />
                </Button>
              </SheetTrigger>
              <SheetContent side="left" className="w-72 gap-0 bg-sidebar p-0">
                <SheetHeader className="sr-only"><SheetTitle>เมนูผู้ดูแล</SheetTitle></SheetHeader>
                <NavContent pathname={pathname} />
              </SheetContent>
            </Sheet>
            <div>
              <p className="font-label-md font-semibold">ระบบจัดการเนื้อหา</p>
              <p className="hidden font-label-sm text-muted-foreground sm:block">Thana Glass Group</p>
            </div>
          </div>
          <div className="flex items-center gap-2.5 px-1 py-1">
            <div className="flex size-8 items-center justify-center rounded-full bg-gradient-to-br from-primary to-primary-container text-primary-foreground shadow-sm">
              <UserRound className="size-4" />
            </div>
            <div className="hidden text-left sm:block">
              <p className="font-label-sm font-semibold leading-none">{user.name}</p>
              <p className="mt-1 font-label-sm text-muted-foreground leading-none">{user.email}</p>
            </div>
          </div>
        </header>
        <main className="p-4 md:p-6 lg:p-8">{children}</main>
      </div>
    </div>
  );
}
