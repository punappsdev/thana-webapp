import Image from "next/image";
import { Button } from "@/components/ui/button";

export default function Home() {
  return (
    <div className="flex flex-col flex-1 items-center justify-center bg-background min-h-screen p-4 sm:p-8">
      {/* Crystalline Glassmorphic Card */}
      <main className="w-full max-w-4xl backdrop-blur-md bg-white/75 border border-border shadow-blue-lg rounded-xl p-8 sm:p-12 md:p-16 flex flex-col gap-8 transition-all hover:shadow-blue-xl">
        <div className="flex justify-between items-center border-b border-border/60 pb-6">
          <div className="flex flex-col">
            <span className="text-xs font-semibold uppercase tracking-wider text-secondary">Thana Glass Group</span>
            <h2 className="text-xl font-bold text-primary font-heading">ธนา กลาส กรุ๊ป</h2>
          </div>
          <div className="relative w-12 h-12 flex items-center justify-center rounded-full bg-primary/5 text-primary">
            <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="lucide lucide-layout">
              <rect width="18" height="18" rx="2" ry="2" x="3" y="3" />
              <line x1="3" x2="21" y1="9" y2="9" />
              <line x1="9" x2="9" y1="21" y2="9" />
            </svg>
          </div>
        </div>

        <div className="flex flex-col gap-4">
          <h1 className="text-4xl sm:text-5xl font-semibold leading-tight tracking-tight text-primary font-heading">
            โครงสร้างกระจกและอะลูมิเนียมระดับพรีเมียม
          </h1>
          <p className="max-w-2xl text-lg text-muted-foreground leading-relaxed">
            สัมผัสความโปร่งใส ความประณีต และความแข็งแกร่งทางสถาปัตยกรรม 
            เราออกแบบและติดตั้งกระจกอลูมิเนียมสำหรับอาคารพาณิชย์และที่พักอาศัยระดับไฮเอนด์ 
            ด้วยวัสดุคุณภาพสูงและการควบคุมงานโดยช่างผู้เชี่ยวชาญ
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4 my-4">
          <div className="p-5 rounded-lg bg-card border border-border/50 shadow-blue-sm">
            <h3 className="font-semibold text-primary mb-2 text-base">authoritative</h3>
            <p className="text-sm text-muted-foreground">โครงสร้างแข็งแรง มั่นใจได้ในความปลอดภัยระดับมาตรฐานสากล</p>
          </div>
          <div className="p-5 rounded-lg bg-card border border-border/50 shadow-blue-sm">
            <h3 className="font-semibold text-primary mb-2 text-base">architectural</h3>
            <p className="text-sm text-muted-foreground">ดีไซน์ที่สอดรับกับสถาปัตยกรรมสมัยใหม่ เสริมความสง่างามให้อาคาร</p>
          </div>
          <div className="p-5 rounded-lg bg-card border border-border/50 shadow-blue-sm">
            <h3 className="font-semibold text-primary mb-2 text-base">crystalline</h3>
            <p className="text-sm text-muted-foreground">ความใสสะอาดของกระจกเกรดพรีเมียม สะท้อนแสงธรรมชาติอย่างสวยงาม</p>
          </div>
        </div>

        <div className="flex flex-wrap gap-4 border-t border-border/60 pt-8">
          {/* Primary button with metallic blue gradient */}
          <Button className="h-11 px-6 text-sm font-semibold rounded-md shadow-blue-sm bg-gradient-to-b from-[#078ee4] to-[#0040ad] hover:from-[#0040ad] hover:to-[#002c7d] text-white transition-all duration-300">
            ดูผลงานติดตั้ง
          </Button>

          {/* Secondary outline button */}
          <Button variant="outline" className="h-11 px-6 text-sm font-semibold rounded-md border-[#0040ad] text-[#0040ad] hover:bg-primary/5 transition-all">
            ติดต่อสอบถาม
          </Button>
        </div>
      </main>
    </div>
  );
}
