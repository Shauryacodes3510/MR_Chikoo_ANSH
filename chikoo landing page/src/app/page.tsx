import Navbar from "@/components/Navbar";
import Hero from "@/components/Hero";
import Features from "@/components/Features";
import SocialProof from "@/components/SocialProof";
import BottomCTA from "@/components/BottomCTA";
import Footer from "@/components/Footer";

export default function Home() {
  return (
    <main className="flex min-h-screen flex-col bg-background selection:bg-chikoo-blue/20">
      <Navbar />
      <Hero />
      <Features />
      <SocialProof />
      <BottomCTA />
      <Footer />
    </main>
  );
}
