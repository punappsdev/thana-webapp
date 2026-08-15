"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";
import { Phone, Mail, MapPin, Map } from "lucide-react";
import Image from "next/image";
import { QUOTE_BRANCH_MAP_URLS } from "@/lib/branches";

interface Branch {
  name: string;
  address: string;
  phone: string;
  mobile: string;
  email: string;
  line: string;
  mapUrl: string;
}

/**
 * The branch selector drives the map from local state, so it stays a client
 * component. It is split out from the page shell so the shell — and the Footer
 * it renders — can stay on the server.
 */
export function ContactMain() {
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
    QUOTE_BRANCH_MAP_URLS.headquarters,
    "https://www.google.com/maps?cid=18211558462240548800&g_mp=CiVnb29nbGUubWFwcy5wbGFjZXMudjEuUGxhY2VzLkdldFBsYWNlEAMYASAF&hl=th&gl=TH&source=embed",
    QUOTE_BRANCH_MAP_URLS.thalang,
  ];

  return (
      <main className="flex-1 main-content-spacer">
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

          <div className="max-w-[1280px] mx-auto px-4 md:px-10 subpage-banner-padding relative z-10 animate-fade-in">
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
                          <h2 className={`font-headline-sm mb-2 ${isActive ? "text-primary" : "text-foreground group-hover:text-primary"}`}>
                            {branch.name}
                          </h2>
                          <p className="font-body-sm text-muted-foreground mb-3 flex items-start gap-1.5">
                            <MapPin className="h-4 w-4 shrink-0 mt-0.5 text-primary" />
                            <span>{branch.address}</span>
                          </p>

                          {/* Quick contact buttons */}
                          <div className="flex flex-wrap gap-2 mb-3">
                            {/* LINE */}
                            <a
                              href="https://lin.ee/P3ZGgWM"
                              target="_blank"
                              rel="noopener noreferrer"
                              onClick={(e) => e.stopPropagation()}
                              className="h-8 w-8 rounded-full bg-white text-primary flex items-center justify-center border border-[#c4e2f5] shadow-blue-sm hover:scale-110 hover:shadow-blue-md active:scale-95 transition-all"
                              title="LINE"
                            >
                              <svg viewBox="0 0 30 30" fill="currentColor" className="h-6 w-6">
                                <path d="M 6 4 C 4.895 4 4 4.895 4 6 L 4 24 C 4 25.105 4.895 26 6 26 L 24 26 C 25.105 26 26 25.105 26 24 L 26 6 C 26 4.895 25.105 4 24 4 L 6 4 z M 15.003906 7.6660156 C 19.720906 7.6660156 23.558594 10.780375 23.558594 14.609375 C 23.558594 16.142375 22.964609 17.523813 21.724609 18.882812 C 19.929609 20.948812 15.916906 23.464609 15.003906 23.849609 C 14.091906 24.233609 14.225719 23.604672 14.261719 23.388672 C 14.283719 23.260672 14.384766 22.65625 14.384766 22.65625 C 14.413766 22.43725 14.442469 22.099812 14.355469 21.882812 C 14.258469 21.645813 13.880563 21.520937 13.601562 21.460938 C 9.4895625 20.916937 6.4472656 18.041375 6.4472656 14.609375 C 6.4472656 10.781375 10.286906 7.6660156 15.003906 7.6660156 z M 12.626953 12.910156 C 12.375953 12.910156 12.171875 13.107656 12.171875 13.347656 L 12.171875 16.652344 C 12.171875 16.894344 12.375953 17.089844 12.626953 17.089844 C 12.877953 17.089844 13.082031 16.893344 13.082031 16.652344 L 13.082031 13.347656 C 13.082031 13.107656 12.877953 12.910156 12.626953 12.910156 z M 14.5625 12.910156 C 14.5175 12.910156 14.470781 12.915641 14.425781 12.931641 C 14.248781 12.991641 14.128906 13.157703 14.128906 13.345703 L 14.128906 16.650391 C 14.128906 16.892391 14.3225 17.089844 14.5625 17.089844 C 14.8025 17.089844 14.996094 16.890391 14.996094 16.650391 L 14.996094 14.605469 L 16.679688 16.914062 C 16.760687 17.024063 16.889391 17.089844 17.025391 17.089844 C 17.072391 17.089844 17.118109 17.082406 17.162109 17.066406 C 17.340109 17.006406 17.460938 16.840344 17.460938 16.652344 L 17.457031 16.652344 L 17.457031 13.347656 C 17.457031 13.107656 17.263391 12.910156 17.025391 12.910156 C 16.787391 12.910156 16.591797 13.107656 16.591797 13.347656 L 16.591797 15.392578 L 14.908203 13.085938 C 14.827203 12.975938 14.6985 12.910156 14.5625 12.910156 z M 18.929688 12.910156 C 18.678688 12.910156 18.474609 13.107656 18.474609 13.347656 L 18.474609 14.998047 L 18.474609 15 L 18.474609 16.650391 C 18.474609 16.892391 18.678687 17.089844 18.929688 17.089844 L 20.654297 17.089844 C 20.906297 17.089844 21.111328 16.892344 21.111328 16.652344 C 21.111328 16.412344 20.905297 16.216797 20.654297 16.216797 L 19.384766 16.216797 L 19.384766 15.435547 L 20.654297 15.435547 C 20.906297 15.435547 21.111328 15.24 21.111328 15 C 21.111328 14.758 20.905297 14.5625 20.654297 14.5625 L 19.384766 14.564453 L 19.384766 13.783203 L 20.654297 13.783203 C 20.906297 13.783203 21.111328 13.588656 21.111328 13.347656 C 21.111328 13.107656 20.905297 12.910156 20.654297 12.910156 L 18.929688 12.910156 z M 9.34375 12.912109 C 9.09275 12.912109 8.8886719 13.106656 8.8886719 13.347656 L 8.8886719 16.652344 C 8.8886719 16.894344 9.09275 17.089844 9.34375 17.089844 L 11.068359 17.089844 C 11.320359 17.089844 11.522438 16.893297 11.523438 16.654297 C 11.523437 16.414297 11.319359 16.21875 11.068359 16.21875 L 9.7988281 16.21875 L 9.7988281 13.347656 C 9.7988281 13.107656 9.59475 12.912109 9.34375 12.912109 z" />
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
                        <h3 className="font-label-md font-semibold text-foreground truncate">
                          {activeBranch.name}
                        </h3>
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
  );
}
