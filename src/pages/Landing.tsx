import { Background } from "@/components/portfolio/Background";
import { Navbar } from "@/components/portfolio/Navbar";
import { Hero } from "@/components/portfolio/Hero";
import { About } from "@/components/portfolio/About";
import { Skills } from "@/components/portfolio/Skills";
import { Experience } from "@/components/portfolio/Experience";
import { Education } from "@/components/portfolio/Education";
import { Catalog } from "@/components/portfolio/Catalog";
import { Contact } from "@/components/portfolio/Contact";
import { Footer } from "@/components/portfolio/Footer";

export default function Landing() {
  return (
    <div className="relative min-h-screen overflow-x-clip text-foreground flex flex-col lg:flex-row bg-background">
      <Background />
      <Navbar />
      <main className="relative z-10 flex-1 lg:ml-72 w-full">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8 lg:py-12">
          <Hero />
          <About />
          <Skills />
          <Experience />
          <Education />
          <Catalog />
          <Contact />
        </div>
        <Footer />
      </main>
    </div>
  );
}
