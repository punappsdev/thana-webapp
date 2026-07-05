"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";
import { Header } from "@/components/layout/header";
import { Footer } from "@/components/layout/footer";
import { ContactFab } from "@/components/ui/contact-fab";
import { Phone, Mail, MapPin, Map } from "lucide-react";
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

  const branchLogos = [
    "/main-logo.png",
    "/sub-logo-1.png",
    "/sub-logo-2.png",
  ];

  const branchMapLinks = [
    "https://www.google.com/maps?cid=4933196602655605409&g_mp=CiVnb29nbGUubWFwcy5wbGFjZXMudjEuUGxhY2VzLkdldFBsYWNlEAMYASAF&hl=th&gl=TH&source=embed",
    "https://www.google.com/maps?cid=18211558462240548800&g_mp=CiVnb29nbGUubWFwcy5wbGFjZXMudjEuUGxhY2VzLkdldFBsYWNlEAMYASAF&hl=th&gl=TH&source=embed",
    "https://www.google.com/maps?cid=9677844337688656532&g_mp=CiVnb29nbGUubWFwcy5wbGFjZXMudjEuUGxhY2VzLkdldFBsYWNlEAMYASAF&hl=th&gl=TH&source=embed",
  ];

  return (
    <div className="flex flex-col min-h-screen bg-background text-foreground">
      <Header />

      <main className="flex-1 pt-[72px] md:pt-[80px]">
        {/* Page Hero Header */}
        <section className="relative overflow-hidden bg-linear-to-br from-primary to-primary-container text-white">
          {/* Decorative dot grid */}
          <div
            className="absolute inset-0 opacity-10 pointer-events-none"
            style={{
              backgroundImage: "radial-gradient(circle at 2px 2px, white 1px, transparent 0)",
              backgroundSize: "32px 32px",
            }}
          />
          {/* Soft light wash */}
          <div className="absolute -top-24 -right-24 w-96 h-96 rounded-full bg-white/5 blur-3xl pointer-events-none" />

          <div className="max-w-[1280px] mx-auto px-4 md:px-10 py-12 md:py-20 relative z-10 animate-fade-in">
            <span className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/10 border border-white/20 font-label-sm font-medium tracking-wide backdrop-blur-md">
              <Phone className="h-3.5 w-3.5" />
              {t("eyebrow")}
            </span>
            <h1 className="font-headline-lg-mobile md:font-display-md mt-5 mb-4 max-w-3xl">
              {t("title")}
            </h1>
            <p className="font-body-md md:font-body-lg max-w-4xl text-white/85 leading-relaxed">
              {t("subtitle")}
            </p>
          </div>
        </section>

        {/* Contact Branch selector & Map section */}
        <section className="py-12 md:py-16 bg-[#faf8ff]">
          <div className="max-w-[1280px] mx-auto px-4 md:px-10">
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:items-stretch items-start">
              
              {/* Left Column: Branch selector cards */}
              <div className="lg:col-span-5 flex flex-col gap-4">
                {branches.map((branch, idx) => {
                  const isActive = activeIdx === idx;
                  return (
                    <div
                      key={idx}
                      onClick={() => setActiveIdx(idx)}
                      aria-pressed={isActive}
                      className={`group cursor-pointer rounded-2xl bg-card border transition-all duration-300 relative overflow-hidden ${
                        isActive
                          ? "border-primary shadow-blue-md"
                          : "border-[#c4e2f5] shadow-blue-sm hover:shadow-blue-md hover:border-primary/40"
                      }`}
                    >
                      {/* Active accent bar */}
                      <span
                        className={`absolute left-0 top-0 h-full w-1.5 bg-linear-to-b from-[#078ee4] to-primary transition-opacity duration-300 ${
                          isActive ? "opacity-100" : "opacity-0 group-hover:opacity-40"
                        }`}
                      />

                      <div className="flex gap-4 p-5">
                        {/* Logo container */}
                        <div className="w-20 h-20 md:w-24 md:h-24 bg-white rounded-xl flex items-center justify-center shrink-0 border border-[#c4e2f5]/60 transition-transform duration-300 group-hover:scale-105 p-2.5 shadow-sm">
                          <Image
                            src={branchLogos[idx]}
                            alt="Thana Logo"
                            width={96}
                            height={96}
                            className="w-full h-full object-contain"
                            priority
                          />
                        </div>

                        {/* Branch detail */}
                        <div className="flex-1 min-w-0 flex flex-col">
                          <h3 className={`font-headline-sm mb-2 ${isActive ? "text-primary" : "text-foreground group-hover:text-primary"}`}>
                            {branch.name}
                          </h3>
                          <p className="font-body-sm text-muted-foreground mb-3 flex items-start gap-1.5">
                            <MapPin className="h-4 w-4 shrink-0 mt-0.5 text-primary" />
                            <span>{branch.address}</span>
                          </p>

                          {/* Quick contact buttons */}
                          <div className="flex flex-wrap gap-2 mb-3">
                            {/* LINE */}
                            <a
                              href={`https://line.me/R/ti/p/~${branch.line}`}
                              target="_blank"
                              rel="noopener noreferrer"
                              onClick={(e) => e.stopPropagation()}
                              className="h-8 w-8 rounded-full bg-white text-primary flex items-center justify-center border border-[#c4e2f5] shadow-blue-sm hover:scale-110 hover:shadow-blue-md active:scale-95 transition-all"
                              title="LINE"
                            >
                              <svg viewBox="0 0 24 24" fill="currentColor" className="h-4 w-4">
                                <path d="M22 10.364c0-4.577-4.486-8.364-10-8.364s-10 3.787-10 8.364c0 4.1 3.568 7.525 8.389 8.217l-1.602 3.19c-.09.18.016.398.21.332l4.802-1.644c5.093-.244 8.201-3.647 8.201-8.455" />
                              </svg>
                            </a>

                            {/* Telephone */}
                            <a
                              href={`tel:${branch.phone.split(",")[0].trim()}`}
                              onClick={(e) => e.stopPropagation()}
                              className="h-8 w-8 rounded-full bg-white text-primary flex items-center justify-center border border-[#c4e2f5] shadow-blue-sm hover:scale-110 hover:shadow-blue-md active:scale-95 transition-all"
                              title="Phone"
                            >
                              <Phone className="h-4 w-4" />
                            </a>

                            {/* Email */}
                            <a
                              href={`mailto:${branch.email}`}
                              onClick={(e) => e.stopPropagation()}
                              className="h-8 w-8 rounded-full bg-white text-primary flex items-center justify-center border border-[#c4e2f5] shadow-blue-sm hover:scale-110 hover:shadow-blue-md active:scale-95 transition-all"
                              title="Email"
                            >
                              <Mail className="h-4 w-4" />
                            </a>


                            {/* View map inline button */}
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                setActiveIdx(idx);
                                const mapElement = document.getElementById("map-container");
                                if (mapElement) {
                                  mapElement.scrollIntoView({ behavior: "smooth" });
                                }
                              }}
                              className="h-8 inline-flex items-center gap-1.5 px-3 rounded-full bg-primary hover:bg-primary-container text-white font-label-sm font-semibold shadow-blue-sm hover:shadow-blue-md active:scale-95 transition-all"
                            >
                              <Map className="h-3.5 w-3.5" />
                              {t("viewMap")}
                            </button>
                          </div>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>

              {/* Right Column: Google Maps Interactive Box (Set to match Left Column height on Desktop) */}
              <div id="map-container" className="lg:col-span-7 lg:sticky lg:top-24 lg:h-full scroll-mt-24">
                <div className="bg-white rounded-2xl border border-[#c4e2f5] shadow-blue-lg lg:h-full flex flex-col overflow-hidden">
                  {/* Header */}
                  <div className="flex items-center justify-between gap-3 px-5 py-4 border-b border-[#c4e2f5]/60">
                    <div className="flex items-center gap-2.5 min-w-0">
                      <span className="w-8 h-8 rounded-full bg-primary/10 text-primary flex items-center justify-center shrink-0">
                        <Map className="h-4 w-4" />
                      </span>
                      <div className="min-w-0">
                        <h4 className="font-label-md font-semibold text-foreground truncate">
                          {activeBranch.name}
                        </h4>
                        <p className="font-label-sm text-muted-foreground uppercase tracking-wider truncate">
                          {t("locationLabel")}
                        </p>
                      </div>
                    </div>
                    <a
                      href={branchMapLinks[activeIdx]}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="shrink-0 inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-primary hover:bg-primary-container text-white font-label-sm font-semibold shadow-blue-sm hover:shadow-blue-md active:scale-95 transition-all"
                    >
                      <MapPin className="h-3.5 w-3.5" />
                      {t("openInMaps")}
                    </a>
                  </div>

                  {/* Map */}
                  <div className="relative flex-1 w-full min-h-[350px] lg:min-h-0">
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

                  {/* Address footer */}
                  <div className="px-5 py-3 border-t border-[#c4e2f5]/60 bg-background/40">
                    <p className="font-body-sm text-muted-foreground flex items-start gap-1.5">
                      <MapPin className="h-4 w-4 shrink-0 mt-0.5 text-primary" />
                      <span>{activeBranch.address}</span>
                    </p>
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
