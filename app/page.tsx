// app/page.tsx — Public landing page

'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import {
  ArrowRight,
  Camera,
  Smartphone,
  Car,
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
    icon: Car,
  },
];

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
};

export default function HomePage() {
  const [current, setCurrent] = useState(0);

  useEffect(() => {
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
            </div>
          </div>
        </section>

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
                const Icon = unit.icon;

                return (
                  <div
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
                      </Link>
                    </div>
                  </div>
                );
              })}
            </div>

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
    </div>

    {/* Feature Cards */}
    <div className="grid grid-cols-1 gap-6 sm:grid-cols-3">
      {features.map((feature) => {
        const Icon = feature.icon;

        return (
          <div
            key={feature.title}
            className="min-h-[230px] rounded-xl border border-slate-200 bg-white p-8 shadow-sm transition-all duration-200 hover:-translate-y-1 hover:border-blue-200 hover:shadow-md"
          >
            <div className="mb-6 flex h-14 w-14 items-center justify-center rounded-lg bg-blue-50">
              <Icon className="h-7 w-7 text-blue-600" />
            </div>

            <h3 className="text-lg font-semibold text-slate-900">
              {feature.title}
            </h3>

            <p className="mt-3 text-sm leading-6 text-slate-600">
              {feature.description}
            </p>
          </div>
        );
      })}
    </div>

  </div>
</section>

      </main>

      <Footer />
    </>
  );
}