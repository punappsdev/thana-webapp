import { Header } from "@/components/layout/header";
import { Hero } from "@/components/homepage/hero";
import { CategoryGrid } from "@/components/homepage/category-grid";
import { ProductList } from "@/components/homepage/product-list";
import { QuotationSteps } from "@/components/homepage/quotation-steps";
import { AboutUs } from "@/components/homepage/about-us";
import { CtaSection } from "@/components/homepage/cta-section";
import { Footer } from "@/components/layout/footer";
import { ContactFab } from "@/components/ui/contact-fab";

export default function Home() {
  return (
    <div className="flex flex-col min-h-screen bg-background">
      <Header />
      
      {/* Main Content Spacer to adjust for fixed Header height */}
      <main className="flex-1 pt-[72px] md:pt-[80px]">
        <Hero />
        <CategoryGrid />
        <ProductList />
        <QuotationSteps />
        <AboutUs />
        <CtaSection />
      </main>

      <Footer />
      <ContactFab />
    </div>
  );
}
