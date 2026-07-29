import { Navbar } from "@/components/navbar";
import { Footer } from "@/components/footer";
import { PricingSection } from "@/components/sections/pricing-section";

export default function PricingPage() {
  return (
    <div className="min-h-screen bg-white">
      <Navbar />
      <main>
        <PricingSection />
      </main>
      <Footer />
    </div>
  );
}

