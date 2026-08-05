import Header from "@/components/Header";
import Hero from "@/components/Hero";
import Stats from "@/components/Stats";
import Products from "@/components/Products";
import FactoryTechnology from "@/components/FactoryTechnology";
import GlassConfigurator from "@/components/GlassConfigurator";
import Applications from "@/components/Applications";
import BlogSection from "@/components/BlogSection";
import ContactSection from "@/components/ContactSection";
import Footer from "@/components/Footer";

export default function Home() {
  return (
    <>
      {/* Sticky Header */}
      <Header />

      {/* Main Sections */}
      <main>
        {/* Hero Section */}
        <Hero />

        {/* Key Metrics Stats */}
        <Stats />

        {/* Product Cards Grid */}
        <Products />

        {/* Manufacturing Processes */}
        <FactoryTechnology />

        {/* Interactive Configuration Calculator */}
        <GlassConfigurator />

        {/* Architectural Applications Grid */}
        <Applications />


        {/* Industrial Blog Updates */}
        <BlogSection />

        {/* Consultation Contact Form */}
        <ContactSection />
      </main>

      {/* Structural Footer */}
      <Footer />
    </>
  );
}
