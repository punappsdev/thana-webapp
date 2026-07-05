import Link from "next/link";
import Image from "next/image";
import { Globe, Mail, Phone, Clock, MapPin } from "lucide-react";

export function Footer() {
  return (
    <footer className="bg-white border-t border-border/80 py-12">
      <div className="max-w-[1280px] mx-auto px-4 md:px-10 flex flex-col md:flex-row justify-between gap-10">
        {/* Footer Brand Info */}
        <div className="flex flex-col gap-6 md:max-w-sm">
          <Image
            src="/main-logo-tp.png"
            alt="Thana Glass Logo"
            width={160}
            height={48}
            className="h-12 w-fit object-contain"
          />
          <p className="text-muted-foreground text-sm">
            บริษัท ธนา กลาส แอนด์ อลูมิเนียม จำกัด มุ่งเน้นการผลิตและจำหน่ายสินค้าที่มีคุณภาพ เพื่อความพึงพอใจสูงสุดของลูกค้า
          </p>
          <div className="flex gap-4">
            <Link href="#" className="p-2 bg-accent rounded-full hover:bg-primary hover:text-white transition-all text-muted-foreground hover:scale-105 active:scale-95">
              <Globe className="h-5 w-5" />
            </Link>
            <a href="mailto:info@thana-glass.com" className="p-2 bg-accent rounded-full hover:bg-primary hover:text-white transition-all text-muted-foreground hover:scale-105 active:scale-95">
              <Mail className="h-5 w-5" />
            </a>
            <a href="tel:076-381444" className="p-2 bg-accent rounded-full hover:bg-primary hover:text-white transition-all text-muted-foreground hover:scale-105 active:scale-95">
              <Phone className="h-5 w-5" />
            </a>
          </div>
        </div>

        {/* Footer Links & Contact Info */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8 flex-1">
          <div>
            <h4 className="font-heading font-semibold text-primary mb-6">หมวดหมู่สินค้า</h4>
            <ul className="flex flex-col gap-4 text-muted-foreground text-sm">
              <li><Link href="#" className="hover:text-primary transition-all hover:underline">อลูมิเนียมเส้น</Link></li>
              <li><Link href="#" className="hover:text-primary transition-all hover:underline">กระจกแผ่น</Link></li>
              <li><Link href="#" className="hover:text-primary transition-all hover:underline">งานฝ้าเพดาน</Link></li>
              <li><Link href="#" className="hover:text-primary transition-all hover:underline">อุปกรณ์ฮาร์ดแวร์</Link></li>
            </ul>
          </div>

          <div>
            <h4 className="font-heading font-semibold text-primary mb-6">บริษัทในเครือ</h4>
            <ul className="flex flex-col gap-4 text-muted-foreground text-sm">
              <li><Link href="#" className="hover:text-primary transition-all hover:underline">บริษัทธนา กลาส อลูมินั่ม จำกัด</Link></li>
              <li><Link href="#" className="hover:text-primary transition-all hover:underline">บริษัทธนา กลาส ถลาง จำกัด</Link></li>
            </ul>
          </div>

          <div className="col-span-1 sm:col-span-2 lg:col-span-1">
            <h4 className="font-heading font-semibold text-primary mb-6">ติดต่อเรา</h4>
            <ul className="flex flex-col gap-4 text-muted-foreground text-sm">
              <li className="flex gap-2">
                <MapPin className="h-5 w-5 shrink-0 text-primary" />
                <span>46/9 ม.6 ต.ฉลอง อ.เมืองภูเก็ต จ.ภูเก็ต 83130</span>
              </li>
              <li className="flex gap-2">
                <Mail className="h-5 w-5 shrink-0 text-primary" />
                <span className="break-all">info@thana-glass.com</span>
              </li>
              <li className="flex gap-2">
                <Phone className="h-5 w-5 shrink-0 text-primary" />
                <span>076-381444, 076-381356-7, 088-7652642</span>
              </li>
              <li className="flex gap-2">
                <Clock className="h-5 w-5 shrink-0 text-primary" />
                <span>เปิดทุกวัน: 8:00 - 17:00</span>
              </li>
            </ul>
          </div>
        </div>
      </div>

      {/* Copyright Bar */}
      <div className="max-w-[1280px] mx-auto px-4 md:px-10 mt-12 pt-8 border-t border-border/40 flex flex-col md:flex-row justify-between items-center gap-4">
        <p className="text-xs text-muted-foreground">© 2024 Thana Glass Aluminum. All Rights Reserved.</p>
        <div className="flex gap-6 text-xs text-muted-foreground">
          <Link href="#" className="hover:text-primary transition-all">Privacy Policy</Link>
          <Link href="#" className="hover:text-primary transition-all">Terms of Service</Link>
        </div>
      </div>
    </footer>
  );
}
