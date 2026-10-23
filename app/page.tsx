// app/page.tsx — Public landing page
<<<<<<< HEAD

'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import Image from 'next/image';
=======
"use client";
import { useEffect, useState } from "react";
import Image from "next/image";
import Link from "next/link";
>>>>>>> origin/sarvida-pr
import {
  ArrowRight,
  Camera,
  Smartphone,
  Car,
<<<<<<< HEAD
  ShieldCheck,
  Clock3,
  Star,
  ChevronLeft,
  ChevronRight,
} from 'lucide-react';
import Navbar from '@/components/layout/navbar';
import Footer from '@/components/layout/footer';

const featuredUnits = [
  {
    title: 'Camera Rental',
    category: 'Camera',
    icon: Camera,
  },
  {
    title: 'Smartphone Rental',
    category: 'Smartphone',
    icon: Smartphone,
  },
  {
    title: 'Vehicle Rental',
    category: 'Vehicle',
    icon: Car,
  },
  {
    title: 'Digital Camera',
    category: 'Camera',
    icon: Camera,
  },
  {
    title: 'Latest Smartphone',
    category: 'Smartphone',
    icon: Smartphone,
  },
  {
    title: 'Car Rental',
    category: 'Vehicle',
=======
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
    image: "/Pics/Cameras/SONY ZV-E10.jpg",
  },
  {
    id: 2,
    title: "Latest Smartphone",
    category: "Smartphone",
    description: "Stay connected with a powerful and reliable smartphone.",
    icon: Smartphone,
    image: "/Pics/Phone/IPHONE 17 PRO MAX COSMIC ORANGE.png",
  },
  {
    id: 3,
    title: "Reliable Vehicle",
    category: "Vehicle",
    description: "Get where you need to go with a dependable rental vehicle.",
    icon: Car,
    image: "/Pics/Cars/HONDA CITY S 2026.png",
  },
  {
    id: 4,
    title: "Mirrorless Camera",
    category: "Camera",
    description: "Lightweight and versatile for your next adventure.",
    icon: Camera,
    image: "/Pics/Cameras/CANON G7X MARK III.jpg",
  },
  {
    id: 5,
    title: "Premium Smartphone",
    category: "Smartphone",
    description: "Experience premium performance without the commitment.",
    icon: Smartphone,
    image: "/Pics/Phone/SAMSUNG S24 ULTRA TITANIUM YELLOW.png",
  },
  {
    id: 6,
    title: "Family Vehicle",
    category: "Vehicle",
    description: "Comfortable transportation for trips and everyday needs.",
>>>>>>> origin/sarvida-pr
    icon: Car,
    image: "/Pics/Cars/MITSUBISHI XPANDER GLS 2025.png",
  },
];

<<<<<<< HEAD
const features = [
  {
    icon: ShieldCheck,
    title: 'Safe & Verified',
    description:
      'Verified renters and secure rental transactions help protect every booking.',
  },
  {
    icon: Clock3,
    title: 'Easy & Convenient',
    description:
      'Find available rental units and book according to your schedule.',
  },
  {
    icon: Star,
    title: 'Trusted Rentals',
    description:
      'Make informed choices with ratings and reviews from verified renters.',
  },
];

const heroImages = [
  {
    id: 1,
    src: '/images/hero-1.jpg',
    alt: 'Professional camera rental equipment',
  },
  {
    id: 2,
    src: '/images/hero-2.jpg',
    alt: 'Latest smartphone rental devices',
  },
  {
    id: 3,
    src: '/images/hero-3.jpg',
    alt: 'Premium vehicle rental options',
=======
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
>>>>>>> origin/sarvida-pr
  },
];

const heroGridBackground = {
  backgroundImage: `
    linear-gradient(to right, #e5e7eb 1px, transparent 1px),
    linear-gradient(to bottom, #e5e7eb 1px, transparent 1px)
  `,
  backgroundSize: '40px 40px',
};

const featuredGridBackground = {
  backgroundImage: `
<<<<<<< HEAD
    linear-gradient(to right, #bfdbfe 1px, transparent 1px),
    linear-gradient(to bottom, #bfdbfe 1px, transparent 1px)
  `,
  backgroundSize: '32px 32px',
};

const whyGridBackground = {
  backgroundImage: `
    linear-gradient(to right, #d1d5db 1px, transparent 1px),
    linear-gradient(to bottom, #d1d5db 1px, transparent 1px)
  `,
  backgroundSize: '40px 40px',
=======
    linear-gradient(#dbeafe 1px, transparent 1px),
    linear-gradient(90deg, #dbeafe 1px, transparent 1px)
  `,
  backgroundSize: "48px 48px",
>>>>>>> origin/sarvida-pr
};

export default function HomePage() {
  const [current, setCurrent] = useState(0);

  useEffect(() => {
<<<<<<< HEAD
    const timer = setInterval(() => {
      setCurrent((prev: number) => (prev + 1) % heroImages.length);
    }, 5000);

    return () => clearInterval(timer);
  }, []);

  const previous = () => {
    setCurrent(
      (prev: number) =>
        (prev - 1 + heroImages.length) % heroImages.length
    );
  };

  const next = () => {
    setCurrent((prev: number) => (prev + 1) % heroImages.length);
  };

  const goToSlide = (index: number) => {
    setCurrent(index);
  };

  return (
    <>
      <Navbar />

      <main className="bg-white text-[#111827]">

        {/* =========================
            HERO
        ========================= */}
        <section className="relative overflow-hidden border-b border-neutral-200">
          {/* Subtle grid background */}
          <div
            className="pointer-events-none absolute inset-0 opacity-30"
            style={heroGridBackground}
          />

          <div
  id="home"
  className="relative mx-auto max-w-7xl scroll-mt-24 px-6 pt-10 lg:px-10"
>

            {/* Hero Heading */}
            <div className="max-w-3xl">
              <h1 className="text-3xl font-bold leading-[1.05] tracking-tight whitespace-nowrap sm:text-5xl lg:text-6xl">
  Renting made simple — browse, book, done.
</h1>
            </div>

            {/* Hero Image Slideshow */}
            <div className="relative mt-8 h-[280px] overflow-hidden rounded-xl border border-neutral-300 bg-neutral-200 shadow-sm sm:h-[360px] lg:h-[420px]">

              {/* Slides */}
              <div className="relative h-full w-full">
                {heroImages.map((image, index) => {
                  const isActive = index === current;

                  return (
                    <div
                      key={image.id}
                      className={`absolute inset-0 transition-opacity duration-1000 ease-in-out ${
                        isActive ? 'opacity-100' : 'opacity-0'
                      }`}
                    >
                      <Image
                        src={image.src}
                        alt={image.alt}
                        fill
                        className="object-cover"
                        priority={index === 0}
                      />
                    </div>
                  );
                })}
              </div>

              {/* Previous */}
              <button
                onClick={previous}
                className="absolute left-4 top-1/2 z-10 -translate-y-1/2 rounded-full bg-black/50 p-2 text-white transition hover:scale-110 hover:bg-black/70"
                aria-label="Previous image"
              >
                <ChevronLeft className="h-5 w-5" />
              </button>

              {/* Next */}
              <button
                onClick={next}
                className="absolute right-4 top-1/2 z-10 -translate-y-1/2 rounded-full bg-black/50 p-2 text-white transition hover:scale-110 hover:bg-black/70"
                aria-label="Next image"
              >
                <ChevronRight className="h-5 w-5" />
              </button>

              {/* Dot Indicators */}
              <div className="absolute bottom-4 left-1/2 z-10 flex -translate-x-1/2 gap-2">
                {heroImages.map((_, index) => (
                  <button
                    key={index}
                    onClick={() => goToSlide(index)}
                    className={`rounded-full transition-all duration-300 ${
                      current === index
                        ? 'h-3 w-3 bg-white'
                        : 'h-2 w-2 bg-white/50 hover:bg-white/75'
                    }`}
                    aria-label={`Go to image ${index + 1}`}
                  />
                ))}
              </div>
            </div>

            {/* Hero Buttons */}
            <div className="flex justify-center gap-3 py-7">
              <Link
                href="/guest/browse"
                className="inline-flex items-center gap-2 rounded-md bg-blue-600 px-6 py-3 text-sm font-semibold text-white transition hover:bg-blue-700"
              >
                Browse Units
                <ArrowRight className="h-4 w-4" />
              </Link>

              <Link
                href="#why-rentspot"
                className="inline-flex items-center justify-center rounded-md border border-neutral-300 px-6 py-3 text-sm font-semibold text-neutral-700 transition hover:border-blue-600 hover:bg-blue-50 hover:text-blue-600"
              >
                Learn More
              </Link>
=======
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
                    href="/guest/browse"
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
>>>>>>> origin/sarvida-pr
            </div>
          </div>
        </section>

<<<<<<< HEAD
        {/* =========================
            FEATURED RENTAL UNITS
        ========================= */}
        <section
          id="browse"
          className="relative scroll-mt-[72px] overflow-hidden border-b border-blue-100 bg-blue-50 py-14 sm:py-16"
        >
          {/* Baby blue grid */}
          <div
            className="pointer-events-none absolute inset-0 opacity-25"
            style={featuredGridBackground}
          />

          <div className="relative mx-auto max-w-7xl px-6 lg:px-10">

            {/* Heading */}
            <div className="mb-8">
              <h2 className="text-2xl font-bold sm:text-3xl">
                Featured Rental Units
              </h2>

              <p className="mt-2 text-sm text-neutral-500">
                Lorem ipsum dolor sit amet, consectetur adipiscing elit.
                Quisque ornare, condimentum libero vitae.
              </p>
            </div>

            {/* Rental Cards */}
            <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3">
              {featuredUnits.map((unit, index) => {
=======
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
>>>>>>> origin/sarvida-pr
                const Icon = unit.icon;

                return (
                  <div
<<<<<<< HEAD
                    key={`${unit.title}-${index}`}
                    className="rounded-xl border border-neutral-200 bg-white p-3 shadow-sm transition-all duration-200 hover:-translate-y-1 hover:shadow-lg"
                  >
                    {/* Unit Image */}
                    <div className="flex h-52 items-center justify-center overflow-hidden rounded-lg bg-neutral-100">
                      <Icon className="h-12 w-12 text-neutral-400" />
                    </div>

                    {/* Unit Information */}
                    <div className="pt-4">
                      <p className="text-xs text-neutral-500">
                        {unit.category}
                      </p>

                      <h3 className="mt-1 text-base font-semibold">
                        {unit.title}
                      </h3>

                      {/* View Unit */}
                      <Link
                        href="/guest/browse"
                        className="mt-4 block w-full rounded-md border border-neutral-300 py-2 text-center text-sm font-semibold text-neutral-700 transition-all duration-200 hover:border-blue-600 hover:bg-blue-600 hover:text-white hover:shadow-md"
                      >
                        View Unit
=======
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

                      <Image
                        src={unit.image}
                        alt={unit.title}
                        fill
                        className="object-cover transition duration-300 group-hover:scale-105"
                        unoptimized
                      />

                      <span className="absolute left-5 top-5 z-10 rounded-full bg-white/90 px-3 py-1.5 text-xs font-bold text-blue-600 shadow-sm backdrop-blur">
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
>>>>>>> origin/sarvida-pr
                      </Link>
                    </div>
                  </div>
                );
              })}
            </div>
<<<<<<< HEAD

            {/* View All */}
            <div className="mt-8 flex justify-center">
              <Link
                href="/guest/browse"
                className="inline-flex items-center gap-2 text-sm font-semibold text-blue-600 transition-colors hover:text-blue-700"
              >
                View All Rentals
                <ArrowRight className="h-4 w-4" />
              </Link>
            </div>

          </div>
        </section>

        {/* =========================
    WHY CHOOSE RENTSPOT
========================= */}
<section
  id="why-rentspot"
  className="relative scroll-mt-[72px] overflow-hidden border-b border-slate-200 bg-[#F3F6FA] py-18 sm:py-20"
>
  {/* Soft Navy Grid */}
  <div
  className="pointer-events-none absolute inset-0 opacity-20"
  style={{
    backgroundImage: `
      linear-gradient(to right, #cbd5e1 1px, transparent 1px),
      linear-gradient(to bottom, #cbd5e1 1px, transparent 1px)
    `,
    backgroundSize: '40px 40px',
  }}
/>

  <div className="relative mx-auto max-w-7xl px-6 lg:px-10">

    {/* Heading */}
    <div className="mb-10">
      <h2 className="text-2xl font-bold text-slate-900 sm:text-3xl">
        Why Choose RentSpotPH?
      </h2>
=======
          </div>
        </section>

        {/* =========================================================
            FAQ / RENTAL GUIDE
        ========================================================= */}
        <FAQSection />
      </main>

      {/* Footer serves as the Contact Us section */}
      <Footer />
>>>>>>> origin/sarvida-pr
    </div>
  );
}