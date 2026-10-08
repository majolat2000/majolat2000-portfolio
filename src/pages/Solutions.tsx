import { Navbar } from "@/components/portfolio/Navbar";
import { Contact } from "@/components/portfolio/Contact";
import { Footer } from "@/components/portfolio/Footer";

export default function Solutions() {
  return (
    <div className="relative min-h-screen overflow-x-clip text-foreground bg-background">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-4 sm:py-8 lg:py-12 flex flex-col lg:flex-row lg:gap-12 lg:items-start">
        <Navbar />
        <main className="relative z-10 flex-1 w-full mt-24 lg:mt-0 flex flex-col items-center">
          <div className="w-full max-w-3xl py-24 text-center">
            <h1 className="font-display text-4xl font-bold tracking-tight text-foreground sm:text-5xl">
              Digital Solutions
            </h1>
            <p className="mt-6 text-lg text-muted-foreground">
              This page is currently empty. Want to be the first to fill it up with a digital solution that works for you? Contact me!
            </p>
          </div>
          
          <div className="w-full">
            <Contact />
          </div>
          <div className="w-full">
            <Footer />
          </div>
        </main>
      </div>
    </div>
  );
}
