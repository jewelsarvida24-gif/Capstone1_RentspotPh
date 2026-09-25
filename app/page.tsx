"use client";

import { useEffect, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import {
  ArrowRight,
  Camera,
  Smartphone,
  Car,
  ChevronLeft,
  ChevronRight,
} from "lucide-react";

import Navbar from "../components/layout/navbar";
import Footer from "../components/layout/footer";
import FAQSection from "../components/home/faq-section";

const featuredUnits = [
  {
    id: 1,
    title: "Professional Camera",
    category: "Camera",
    description: "Capture your best moments with professional equipment.",
    icon: Camera,
  },
  {
    id: 2,
    title: "Latest Smartphone",
    category: "Smartphone",
    description: "Stay connected with a powerful and reliable smartphone.",
    icon: Smartphone,
  },
  {
    id: 3,
    title: "Reliable Vehicle",
    category: "Vehicle",
    description: "Get where you need to go with a dependable rental vehicle.",
    icon: Car,
  },
  {
    id: 4,
    title: "Mirrorless Camera",
    category: "Camera",
    description: "Lightweight and versatile for your next adventure.",
    icon: Camera,
  },
  {
    id: 5,
    title: "Premium Smartphone",
    category: "Smartphone",
    description: "Experience premium performance without the commitment.",
    icon: Smartphone,
  },
  {
    id: 6,
    title: "Family Vehicle",
    category: "Vehicle",
    description: "Comfortable transportation for trips and everyday needs.",
    icon: Car,
  },
];

const heroImages = [
  {
    src: "/images/hero-1.jpg",
    alt: "Camera available for rent",
  },
  {
    src: "/images/hero-2.jpg",
    alt: "Smartphone available for rent",
  },
  {
    src: "/images/hero-3.jpg",
    alt: "Vehicle available for rent",
  },
];

const heroGridBackground = {
  backgroundImage: `
    linear-gradient(#dbeafe 1px, transparent 1px),
    linear-gradient(90deg, #dbeafe 1px, transparent 1px)
  `,
  backgroundSize: "48px 48px",
};

const featuredGridBackground = {
  backgroundImage: `
    linear-gradient(#dbeafe 1px, transparent 1px),
    linear-gradient(90deg, #dbeafe 1px, transparent 1px)
  `,
  backgroundSize: "48px 48px",
};

export default function HomePage() {
  const [current, setCurrent] = useState(0);

  useEffect(() => {
    const interval = setInterval(() => {
      setCurrent((previous) => (previous + 1) % heroImages.length);
    }, 5000);

    return () => clearInterval(interval);
  }, []);

  const previousSlide = () => {
    setCurrent((previous) =>
      previous === 0 ? heroImages.length - 1 : previous - 1
    );
  };

  const nextSlide = () => {
    setCurrent((previous) => (previous + 1) % heroImages.length);
  };

  return (
    <div className="min-h-screen bg-white text-slate-900">
      <Navbar />

      <main>
        {/* =========================================================
            HERO SECTION
        ========================================================= */}
        <section
          id="home"
          className="relative min-h-[calc(100vh-72px)] overflow-hidden bg-[#f8fbff]"
        >
          {/* Grid background */}
          <div
            className="pointer-events-none absolute inset-0 opacity-70"
            style={heroGridBackground}
          />

          {/* Soft background glows */}
          <div className="pointer-events-none absolute -right-40 -top-40 h-[500px] w-[500px] rounded-full bg-blue-200/40 blur-3xl" />

          <div className="pointer-events-none absolute -bottom-40 -left-40 h-[500px] w-[500px] rounded-full bg-indigo-200/30 blur-3xl" />

          {/* HERO CONTENT */}
          <div className="relative mx-auto flex min-h-[calc(100vh-72px)] max-w-7xl items-center px-6 py-14 lg:px-8">
            <div className="grid w-full items-center gap-14 lg:grid-cols-2">
              {/* LEFT SIDE */}
              <div className="flex flex-col justify-center">
                <h1 className="max-w-3xl text-5xl font-black leading-[1.05] tracking-tight text-slate-900 sm:text-6xl lg:text-7xl">
                  Renting made simple.
                  <br />

                  <span className="relative inline-block">
                    <span className="relative z-10">Browse</span>
                    <span className="absolute bottom-1 left-0 -z-0 h-3 w-full rounded-full bg-[#ffe066]" />
                  </span>
                  ,{" "}

                  <span className="relative inline-block">
                    <span className="relative z-10">Book</span>
                    <span className="absolute bottom-1 left-0 -z-0 h-3 w-full rounded-full bg-[#baf05c]" />
                  </span>
                  ,{" "}

                  <span className="relative inline-block">
                    <span className="relative z-10">Enjoy.</span>
                    <span className="absolute bottom-1 left-0 -z-0 h-3 w-full rounded-full bg-[#ff8fd6]" />
                  </span>
                </h1>

                {/* CTA BUTTONS */}
                <div className="mt-9 flex flex-wrap gap-4">
                  <Link
                    href="/#browse"
                    className="group inline-flex items-center gap-2 rounded-full bg-blue-600 px-6 py-3.5 text-sm font-bold text-white shadow-lg shadow-blue-200 transition hover:bg-blue-700 hover:shadow-xl"
                  >
                    Browse Units

                    <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
                  </Link>

                  <Link
                    href="/#faqs"
                    className="inline-flex items-center rounded-full border border-slate-200 bg-white/80 px-6 py-3.5 text-sm font-bold text-slate-700 shadow-sm backdrop-blur transition hover:border-blue-200 hover:bg-white hover:text-blue-600"
                  >
                    How It Works
                  </Link>
                </div>
              </div>

              {/* RIGHT SIDE — HERO IMAGE */}
              <div className="relative mx-auto w-full max-w-xl">
                <div className="relative aspect-[4/3.8] overflow-hidden rounded-[2rem] border border-white/70 bg-white/60 p-3 shadow-2xl shadow-blue-100 backdrop-blur">
                  <div className="relative h-full w-full overflow-hidden rounded-[1.5rem]">
                    {heroImages.map((image, index) => (
                      <Image
                        key={image.src}
                        src={image.src}
                        alt={image.alt}
                        fill
                        priority={index === 0}
                        className={`object-cover transition-opacity duration-700 ${
                          index === current
                            ? "opacity-100"
                            : "pointer-events-none absolute opacity-0"
                        }`}
                      />
                    ))}

                    {/* Image overlay */}
                    <div className="absolute inset-0 bg-gradient-to-t from-slate-950/30 via-transparent to-transparent" />

                    {/* Previous */}
                    <button
                      type="button"
                      onClick={previousSlide}
                      aria-label="Previous image"
                      className="absolute left-4 top-1/2 flex h-10 w-10 -translate-y-1/2 items-center justify-center rounded-full bg-white/80 text-slate-800 shadow-lg backdrop-blur transition hover:bg-white"
                    >
                      <ChevronLeft className="h-5 w-5" />
                    </button>

                    {/* Next */}
                    <button
                      type="button"
                      onClick={nextSlide}
                      aria-label="Next image"
                      className="absolute right-4 top-1/2 flex h-10 w-10 -translate-y-1/2 items-center justify-center rounded-full bg-white/80 text-slate-800 shadow-lg backdrop-blur transition hover:bg-white"
                    >
                      <ChevronRight className="h-5 w-5" />
                    </button>

                    {/* Dots */}
                    <div className="absolute bottom-5 left-1/2 flex -translate-x-1/2 gap-2">
                      {heroImages.map((image, index) => (
                        <button
                          key={image.src}
                          type="button"
                          onClick={() => setCurrent(index)}
                          aria-label={`Go to slide ${index + 1}`}
                          className={`h-2 rounded-full transition-all ${
                            index === current
                              ? "w-7 bg-white"
                              : "w-2 bg-white/60"
                          }`}
                        />
                      ))}
                    </div>
                  </div>
                </div>

                {/* Floating card */}
                <div className="absolute -bottom-6 -left-5 hidden rounded-2xl border border-white/80 bg-white/90 px-5 py-4 shadow-xl backdrop-blur sm:block">
                  <p className="text-xs font-bold uppercase tracking-wider text-blue-600">
                    Easy rental
                  </p>

                  <p className="mt-1 text-sm font-bold text-slate-800">
                    Browse. Book. Enjoy.
                  </p>
                </div>

                <div className="absolute -right-5 -top-5 hidden rounded-2xl border border-white/80 bg-white/90 px-5 py-4 shadow-xl backdrop-blur sm:block">
                  <p className="text-xs font-bold uppercase tracking-wider text-slate-400">
                    Rent what you need
                  </p>

                  <p className="mt-1 text-sm font-bold text-slate-800">
                    All in one place.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* =========================================================
            FEATURED RENTAL UNITS
        ========================================================= */}
        <section
          id="browse"
          className="relative overflow-hidden bg-[#f8fbff] py-24"
        >
          <div
            className="pointer-events-none absolute inset-0 opacity-60"
            style={featuredGridBackground}
          />

          <div className="pointer-events-none absolute left-1/2 top-0 h-[400px] w-[600px] -translate-x-1/2 rounded-full bg-blue-100/50 blur-3xl" />

          <div className="relative mx-auto max-w-7xl px-6 lg:px-8">
            <div className="flex flex-col justify-between gap-6 md:flex-row md:items-end">
              <div>
                <h2 className="mt-3 text-4xl font-black tracking-tight text-slate-900 sm:text-5xl">
                  Featured Rental Units
                </h2>

                <p className="mt-4 max-w-2xl text-base leading-7 text-slate-600">
                  Discover rental options that fit your needs. Smartphones and
                  cameras to vehicles, we got it all here!
                </p>
              </div>

              <Link
                href="/guest/browse"
                className="group inline-flex w-fit items-center gap-2 rounded-full border border-slate-200 bg-white/80 px-5 py-3 text-sm font-bold text-slate-700 shadow-sm backdrop-blur transition hover:border-blue-200 hover:text-blue-600"
              >
                View All Rentals

                <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
              </Link>
            </div>

            <div className="mt-12 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
              {featuredUnits.map((unit) => {
                const Icon = unit.icon;

                return (
                  <div
                    key={unit.id}
                    className="group overflow-hidden rounded-3xl border border-slate-200 bg-white/90 shadow-sm backdrop-blur transition duration-300 hover:-translate-y-1 hover:border-blue-200 hover:shadow-xl hover:shadow-blue-100/50"
                  >
                    <div className="relative flex aspect-[4/3] items-center justify-center overflow-hidden bg-gradient-to-br from-blue-50 to-slate-100">
                      <div className="absolute inset-0 opacity-50">
                        <div
                          className="h-full w-full"
                          style={{
                            backgroundImage: `
                              linear-gradient(#dbeafe 1px, transparent 1px),
                              linear-gradient(90deg, #dbeafe 1px, transparent 1px)
                            `,
                            backgroundSize: "32px 32px",
                          }}
                        />
                      </div>

                      <div className="relative flex h-20 w-20 items-center justify-center rounded-3xl bg-white text-blue-600 shadow-lg transition duration-300 group-hover:scale-110">
                        <Icon className="h-10 w-10" />
                      </div>

                      <span className="absolute left-5 top-5 rounded-full bg-white/90 px-3 py-1.5 text-xs font-bold text-blue-600 shadow-sm backdrop-blur">
                        {unit.category}
                      </span>
                    </div>

                    <div className="p-6">
                      <h3 className="text-lg font-black text-slate-900">
                        {unit.title}
                      </h3>

                      <p className="mt-2 min-h-[48px] text-sm leading-6 text-slate-500">
                        {unit.description}
                      </p>

                      <Link
                        href="/guest/browse"
                        className="group/button mt-6 inline-flex items-center gap-2 text-sm font-bold text-blue-600"
                      >
                        View Unit

                        <ArrowRight className="h-4 w-4 transition-transform group-hover/button:translate-x-1" />
                      </Link>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </section>

        {/* =========================================================
            FAQ / RENTAL GUIDE
        ========================================================= */}
        <FAQSection />
      </main>

      {/* Footer serves as the Contact Us section */}
      <Footer />
    </div>
  );
}