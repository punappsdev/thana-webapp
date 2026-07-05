"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";
import { Header } from "@/components/layout/header";
import { Footer } from "@/components/layout/footer";
import { ContactFab } from "@/components/ui/contact-fab";
import { Phone, Mail, MessageSquare, MapPin, Map } from "lucide-react";
import Image from "next/image";

interface Branch {
  name: string;
  address: string;
  phone: string;
  mobile: string;
  email: string;
  line: string;
  mapUrl: string;
}

export default function ContactPage() {
  const t = useTranslations("ContactPage");
  
  // Retrieve branches raw array from next-intl
  const branches = t.raw("branches") as Branch[];
  const [activeIdx, setActiveIdx] = useState(0);

  const activeBranch = branches[activeIdx];

  // Uniform color matching the user mockup and brand design system
  const cardBgStyle = "from-secondary-fixed/20 to-secondary-fixed-dim/10 bg-[#e0f7fc]/30";

  return (
    <div className="flex flex-col min-h-screen bg-background text-foreground">
      <Header />

      <main className="flex-1 pt-[72px] md:pt-[80px]">
        {/* Page Hero Header */}
        <section className="bg-gradient-to-r from-primary to-[#0040ad] py-12 md:py-16 text-center text-white relative overflow-hidden">
          <div 
            className="absolute inset-0 opacity-10 pointer-events-none" 
            style={{
              backgroundImage: "radial-gradient(circle at 2px 2px, white 1px, transparent 0)",
              backgroundSize: "32px 32px"
            }}
          />
          <div className="max-w-[1280px] mx-auto px-4 md:px-10 relative z-10 animate-fade-in">
            <h1 className="font-heading text-3xl md:text-5xl font-bold mb-4 tracking-tight">
              {t("title")}
            </h1>
            <p className="font-sans text-sm md:text-base max-w-2xl mx-auto opacity-90 font-light leading-relaxed">
              {t("subtitle")}
            </p>
          </div>
        </section>

        {/* Contact Branch selector & Map section */}
        <section className="py-12 md:py-16 bg-[#faf8ff]">
          <div className="max-w-[1280px] mx-auto px-4 md:px-10">
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:items-stretch items-start">
              
              {/* Left Column: Branch selector cards */}
              <div className="lg:col-span-5 flex flex-col gap-6">
                {branches.map((branch, idx) => {
                  const isActive = activeIdx === idx;
                  return (
                    <div
                      key={idx}
                      onClick={() => setActiveIdx(idx)}
                      className={`cursor-pointer rounded-2xl p-6 bg-gradient-to-br ${cardBgStyle} border transition-all duration-300 relative shadow-sm hover:shadow-md ${
                        isActive 
                          ? "border-primary scale-[1.01] ring-2 ring-primary/20 shadow-blue-md" 
                          : "border-outline-variant hover:scale-[1.005]"
                      }`}
                    >
                      <div className="flex gap-4">
                        {/* Logo White Box Container */}
                        <div className="w-24 h-24 bg-white rounded-xl flex items-center justify-center shrink-0 shadow-sm border border-border/40 transition-transform duration-300 hover:scale-105">
                          {/* Fallback clean text layout / Brand logo placeholder */}
                          <Image
                            src="/main-logo-icon-tp.png"
                            alt="Thana Logo"
                            width={56}
                            height={56}
                            className="h-14 w-14 object-contain opacity-80"
                          />
                        </div>

                        {/* Branch detail text */}
                        <div className="flex-1 min-w-0">
                          <h3 className="font-heading text-base md:text-lg font-semibold text-primary mb-2 leading-tight">
                            {branch.name}
                          </h3>
                          <p className="font-sans text-xs md:text-sm text-on-surface-variant/90 mb-4 leading-relaxed flex items-start gap-1.5">
                            <MapPin className="h-4 w-4 shrink-0 mt-0.5 text-primary" />
                            <span>{branch.address}</span>
                          </p>

                          {/* Branch Contact Quick Buttons Row */}
                          <div className="flex flex-wrap gap-2.5 mb-2">
                            {/* LINE */}
                            <a
                              href={`https://line.me/R/ti/p/~${branch.line}`}
                              target="_blank"
                              rel="noopener noreferrer"
                              onClick={(e) => e.stopPropagation()}
                              className="h-8 w-8 rounded-full bg-white text-[#06C755] flex items-center justify-center shadow-sm hover:scale-110 active:scale-95 transition-all"
                              title="LINE"
                            >
                              <svg viewBox="0 0 24 24" fill="currentColor" className="h-4.5 w-4.5">
                                <path d="M22 10.364c0-4.577-4.486-8.364-10-8.364s-10 3.787-10 8.364c0 4.1 3.568 7.525 8.389 8.217l-1.602 3.19c-.09.18.016.398.21.332l4.802-1.644c5.093-.244 8.201-3.647 8.201-8.455" />
                              </svg>
                            </a>

                            {/* Telephone link */}
                            <a
                              href={`tel:${branch.phone.split(",")[0].trim()}`}
                              onClick={(e) => e.stopPropagation()}
                              className="h-8 w-8 rounded-full bg-white text-primary flex items-center justify-center shadow-sm hover:scale-110 active:scale-95 transition-all"
                              title="Phone"
                            >
                              <Phone className="h-4 w-4" />
                            </a>

                            {/* Email link */}
                            <a
                              href={`mailto:${branch.email}`}
                              onClick={(e) => e.stopPropagation()}
                              className="h-8 w-8 rounded-full bg-white text-primary flex items-center justify-center shadow-sm hover:scale-110 active:scale-95 transition-all"
                              title="Email"
                            >
                              <Mail className="h-4 w-4" />
                            </a>

                            {/* Location Pin */}
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                setActiveIdx(idx);
                              }}
                              className="h-8 w-8 rounded-full bg-white text-primary flex items-center justify-center shadow-sm hover:scale-110 active:scale-95 transition-all"
                              title="Pin Location"
                            >
                              <MapPin className="h-4 w-4" />
                            </button>
                          </div>
                        </div>
                      </div>

                      {/* Card Action View Map Button - Adjusted to Darker Brand Color */}
                      <div className="mt-4 flex justify-end">
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            setActiveIdx(idx);
                            const mapElement = document.getElementById("map-container");
                            if (mapElement) {
                              mapElement.scrollIntoView({ behavior: "smooth" });
                            }
                          }}
                          className="bg-primary hover:bg-[#0040ad] active:scale-95 text-white px-5 py-1.5 rounded-full text-xs font-semibold shadow-sm transition-all flex items-center gap-1.5 font-heading cursor-pointer"
                        >
                          <MapPin className="h-3 w-3" />
                          {t("viewMap")}
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>

              {/* Right Column: Google Maps Interactive Box (Set to match Left Column height on Desktop) */}
              <div id="map-container" className="lg:col-span-7 lg:sticky lg:top-24 lg:h-full scroll-mt-24">
                <div className="bg-white rounded-3xl p-4 border border-[#c4e2f5]/80 shadow-blue-lg backdrop-blur-md lg:h-full flex flex-col">
                  <div className="flex items-center gap-2 mb-3 px-2">
                    <Map className="h-4 w-4 text-primary shrink-0" />
                    <h4 className="font-heading text-xs font-semibold text-muted-foreground uppercase tracking-wider truncate">
                      {activeBranch.name}
                    </h4>
                  </div>

                  <div className="relative flex-1 w-full rounded-2xl overflow-hidden border border-border bg-slate-100 shadow-inner min-h-[350px] lg:min-h-0">
                    <iframe
                      src={activeBranch.mapUrl}
                      width="100%"
                      height="100%"
                      style={{ border: 0 }}
                      allowFullScreen={true}
                      loading="lazy"
                      referrerPolicy="no-referrer-when-downgrade"
                      title={activeBranch.name}
                      className="absolute inset-0"
                    />
                  </div>
                </div>
              </div>

            </div>
          </div>
        </section>
      </main>

      <Footer />
      <ContactFab />
    </div>
  );
}
