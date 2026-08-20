"use client";

import { useState } from 'react';
import { Camera, CarFront, Smartphone, ChevronLeft, ChevronRight, Menu, X, LucideIcon, UserCheck, LayoutGrid, Lock, Facebook, Instagram, Music2, Mail, Phone, MapPin } from 'lucide-react';

// 1. Types
type Category = {
  name: string;
  id: string;
  detail: string;
  icon: LucideIcon;
  images: string[];
};

// Removed the price from the Equipment type
type Equipment = {
  id: number;
  name: string;
  image: string;
  href: string;
};

// 2. Data
const categories: Category[] = [
  { 
    name: 'Cameras',
    id: 'cameras', 
    detail: 'For your everyday needs', 
    icon: Camera,
    images: [
      '/Pics/cameras/sony.jpg',
      '/Pics/cameras/canun.png'
    ]
  },
  { 
    name: 'Phones',
    id: 'phones',
    detail: 'Stay connected wherever you go', 
    icon: Smartphone,
    images: [
      '/Pics/phones/Apple-iPhone-14-Pro-Gold-1.png',
      '/Pics/phones/Ipad.jpg'
    ]
  },
  { 
    name: 'Vehicles',
    id: 'vehicles',
    detail: 'Go to your dream destination!', 
    icon: CarFront,
    images: [
      '/Pics/vehicles/Vios.jpg',
      '/Pics/vehicles/For%20Ranger.jpg'
    ]
  },
];

// Mock equipment data 
const equipmentData: Record<string, Equipment[]> = {
  cameras: [
    { id: 1, name: 'Sony A7 III', image: '/Pics/cameras/sony.jpg', href: '/Pics/cameras/sony.jpg' },
    { id: 2, name: 'Canon EOS R5', image: '/Pics/cameras/canun.png', href: '/Pics/cameras/canun.png' },
    { id: 3, name: 'DJI Ronin RS2', image: '/Pics/cameras/Dji.jpg', href: '/Pics/cameras/Dji.jpg' },
    { id: 4, name: 'GoPro Hero 11', image: '/Pics/cameras/gopru.jpg', href: '/Pics/cameras/gopru.jpg' },
  ],
  phones: [
    { id: 5, name: 'iPhone 14 Pro', image: '/Pics/phones/Apple-iPhone-14-Pro-Gold-1.png', href: '/Pics/phones/Apple-iPhone-14-Pro-Gold-1.png' },
    { id: 6, name: 'Samsung S23 Ultra', image: '/Pics/phones/Sams.jpg', href: '/Pics/phones/Sams.jpg' },
    { id: 7, name: 'Google Pixel 7', image: '/Pics/phones/Gogil.jpg', href: '/Pics/phones/Gogil.jpg' },
    { id: 8, name: 'iPad Pro 12.9"', image: '/Pics/phones/Ipad.jpg', href: '/Pics/phones/Ipad.jpg' },
  ],
  vehicles: [
    { id: 9, name: 'Toyota Vios 2023', image: '/Pics/vehicles/Vios.jpg', href: '/Pics/vehicles/Vios.jpg' },
    { id: 10, name: 'Ford Ranger XLT', image: '/Pics/vehicles/For%20Ranger.jpg', href: '/Pics/vehicles/For%20Ranger.jpg' },
    { id: 11, name: 'Honda Click 125i', image: '/Pics/vehicles/Honda%20Click.jpg', href: '/Pics/vehicles/Honda%20Click.jpg' },
    { id: 12, name: 'Yamaha NMAX', image: '/Pics/vehicles/BMAX.jpg', href: '/Pics/vehicles/BMAX.jpg' },
  ]
};

// 3. Slideshow Component
interface ImageSlideshowProps {
  images: string[];
}

const ImageSlideshow = ({ images }: ImageSlideshowProps) => {
  const [currentIndex, setCurrentIndex] = useState<number>(0);

  const prevSlide = () => {
    const isFirstSlide = currentIndex === 0;
    const newIndex = isFirstSlide ? images.length - 1 : currentIndex - 1;
    setCurrentIndex(newIndex);
  };

  const nextSlide = () => {
    const isLastSlide = currentIndex === images.length - 1;
    const newIndex = isLastSlide ? 0 : currentIndex + 1;
    setCurrentIndex(newIndex);
  };

  if (!images || images.length === 0) {
    return <div className="w-full h-full bg-neutral-200" />;
  }



  return (
    <div className="relative w-full h-full group overflow-hidden">
      <img 
        src={images[currentIndex]} 
        alt={`Slide ${currentIndex}`} 
        className="w-full h-full object-cover transition-all duration-500"
      />
      
      <div className="absolute inset-0 flex items-center justify-between p-4 opacity-0 group-hover:opacity-100 transition-opacity duration-300">
        <button 
          onClick={prevSlide} 
          className="bg-white/70 text-[#132a2b] hover:bg-white rounded-full p-1.5 shadow-sm transition"
        >
          <ChevronLeft size={20} strokeWidth={2.5} />
        </button>
        <button 
          onClick={nextSlide} 
          className="bg-white/70 text-[#132a2b] hover:bg-white rounded-full p-1.5 shadow-sm transition"
        >
          <ChevronRight size={20} strokeWidth={2.5} />
        </button>
      </div>

      <div className="absolute bottom-4 left-0 right-0 flex justify-center gap-2">
        {images.map((_, slideIndex) => (
          <button 
            key={slideIndex} 
            onClick={() => setCurrentIndex(slideIndex)}
            className={`h-2 w-2 rounded-full transition-all ${
              currentIndex === slideIndex ? 'bg-white w-4' : 'bg-white/50'
            }`}
          />
        ))}
      </div>
    </div>
  );
};

export default function GuestPage() {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  const heroImages: string[] = [
    '/Pics/cameras/sony.jpg',
    '/Pics/phones/Apple-iPhone-14-Pro-Gold-1.png',
    '/Pics/vehicles/Vios.jpg'
  ];

  const [activeFaqTab, setActiveFaqTab] = useState("how-to-rent");

const faqCategories = [
  { id: "how-to-rent", label: "How to Rent" },
  { id: "payment", label: "About Payment" },
  { id: "agreements", label: "Rental Agreements" },
  { id: "pickup", label: "Pickup & Return" },
];

  return (
    <main className="min-h-screen bg-white text-[#132a2b] font-sans scroll-smooth relative">
      
      {/* HEADER / NAVBAR */}
      <nav className="sticky top-0 z-50 border-b border-[#2459b8]/15 bg-white px-6 py-4 shadow-sm md:px-10 md:py-5">
        <div className="mx-auto flex w-full max-w-7xl items-center justify-between">
          <a href="#" className="z-50 shrink-0">
            <img 
              src="/Pics/logo.jpg" 
              alt="RentSpotPH Logo" 
              className="h-8 w-auto object-contain opacity-100 mix-blend-normal md:h-10" 
            />
          </a>
        
          {/* Desktop Links */}
          <div className="hidden items-center gap-8 text-sm font-medium md:flex">
            <a href="#" className="transition-colors hover:text-[#ef765d]">Home</a>
            <a href="#browse" className="transition-colors hover:text-[#ef765d]">Browse</a>
            <a href="#about" className="transition-colors hover:text-[#ef765d]">FAQs</a>
            <a href="#contact" className="transition-colors hover:text-[#ef765d]">Contact Us</a>
          </div>
        
          <div className="hidden items-center gap-3 text-sm font-bold md:flex">
            <a href="/login" className="px-5 py-2 transition-colors hover:text-[#ef765d]">Log in</a>
            <a href="/signup" className="rounded-full bg-[#ef765d] px-5 py-2 text-[#132a2b] transition-colors hover:bg-[#f58f78]">Sign up</a>
          </div>

        {/* Mobile Menu Toggle Button */}
          <button 
            className="z-50 rounded-lg p-2 text-[#132a2b] transition-colors hover:bg-[#132a2b]/5 md:hidden"
            onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
            aria-label="Toggle Menu"
          >
            {isMobileMenuOpen ? <X size={28} /> : <Menu size={28} />}
          </button>
        </div>
      </nav>

      {/* Mobile Dropdown Menu */}
      {isMobileMenuOpen && (
        <div className="md:hidden fixed inset-0 z-40 bg-white pt-24 px-6 flex flex-col gap-6 h-screen overflow-y-auto">
          <a href="#" onClick={() => setIsMobileMenuOpen(false)} className="text-2xl font-bold border-b border-[#132a2b]/10 pb-4">Home</a>
          <a href="#browse" onClick={() => setIsMobileMenuOpen(false)} className="text-2xl font-bold border-b border-[#132a2b]/10 pb-4">Browse</a>
          <a href="#about" onClick={() => setIsMobileMenuOpen(false)} className="text-2xl font-bold border-b border-[#132a2b]/10 pb-4">About Us</a>
          <a href="#contact" onClick={() => setIsMobileMenuOpen(false)} className="text-2xl font-bold border-b border-[#132a2b]/10 pb-4">Contact Us</a>
          
          <div className="flex flex-col gap-4 mt-8">
            <a href="/login" className="w-full text-center py-4 border-2 border-[#132a2b] rounded-xl text-lg font-bold">Log in</a>
            <a href="/signup" className="w-full text-center py-4 bg-[#ef765d] text-[#132a2b] rounded-xl text-lg font-bold shadow-lg shadow-[#ef765d]/20">Sign up</a>
          </div>
        </div>
      )}

      {/* HERO SECTION */}
      <section className="flex flex-col items-center text-center pt-10 md:pt-16 pb-12 px-6">
        <h1 className="text-4xl md:text-6xl font-black mb-6 tracking-tight max-w-4xl leading-tight">
          Rent Equipment Easily and Securely
        </h1>
        <p className="max-w-2xl text-base text-[#132a2b]/80 mb-10">
          Browse hundreds of verified rental units — from digital cameras, smartphones to vehicles — and book with confidence.
        </p>

        <div className="w-full max-w-5xl h-[250px] sm:h-[350px] md:h-[500px] bg-white relative border border-[#132a2b]/20 mb-10 rounded-2xl overflow-hidden shadow-xl">
          <ImageSlideshow images={heroImages} />
        </div>

        <div className="flex flex-col sm:flex-row gap-4 w-full sm:w-auto">
          <a href="#browse" className="w-full sm:w-auto px-8 py-3.5 bg-[#132a2b] text-[#fbe9b9] rounded-full text-sm font-bold hover:bg-[#132a2b]/80 transition text-center">
            Browse Units
          </a>
          <a href="#learn-more" className="w-full sm:w-auto px-8 py-3.5 bg-transparent border-2 border-[#132a2b]/40 rounded-full text-sm font-bold hover:bg-[#132a2b] hover:text-[#fbe9b9] transition text-center">
            Learn More
          </a>
        </div>
      </section>

      {/* FEATURED RENTAL UNITS */}
      <section id="browse" className="max-w-6xl mx-auto px-6 py-14 md:py-20 scroll-mt-20">
        <h2 className="text-3xl md:text-4xl font-black mb-3">Featured Rental Units</h2>
        <p className="text-base md:text-lg text-[#132a2b]/70 mb-10">
          Browse our top categories to find exactly what you need for your next project or adventure.
        </p>

        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-7 md:gap-8">
          {categories.map((category) => (
            <div key={category.name} className="flex min-h-[540px] flex-col group bg-white border border-[#132a2b]/10 rounded-xl overflow-hidden shadow-sm hover:shadow-xl hover:border-[#ef765d] transition-all duration-300">
              <div className="h-64 sm:h-72 md:h-80 relative border-b border-[#132a2b]/10">
                <ImageSlideshow images={category.images} />
                <div className="absolute top-4 left-4 z-10 bg-white/90 p-2.5 rounded-full shadow-sm backdrop-blur-sm">
                  <category.icon size={24} strokeWidth={2} className="text-[#ef765d]" />
                </div>
              </div>
              
              <div className="p-6 md:p-7 flex flex-col flex-grow">
                <h3 className="font-bold text-2xl">{category.name}</h3>
                <p className="text-base text-[#132a2b]/70 mt-3 mb-7 flex-grow">{category.detail}</p>
                
                <a 
                  href={`#${category.id}`}
                  className="w-full text-center py-3.5 border border-[#132a2b]/20 rounded-lg text-base font-bold hover:bg-[#132a2b] hover:text-[#fbe9b9] transition-colors block"
                >
                  View {category.name}
                </a>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* INDIVIDUAL EQUIPMENT LISTINGS */}
      <div className="bg-white/50 border-y border-[#132a2b]/10 py-12 md:py-16">
        <div className="max-w-5xl mx-auto px-6 flex flex-col gap-12 md:gap-16">
          {categories.map((category) => (
            <section 
              key={category.id} 
              id={category.id} 
              className="scroll-mt-24"
            >
              <div className="flex items-center gap-3 mb-6 md:mb-8 border-b border-[#132a2b]/10 pb-4">
                <category.icon size={24} className="text-[#ef765d] md:w-7 md:h-7" />
                <h2 className="text-xl md:text-2xl font-black">{category.name} Available for Rent</h2>
              </div>
              
              <div className="grid grid-cols-2 md:grid-cols-4 gap-3 md:gap-6">
                {equipmentData[category.id]?.map((item) => (
                  <a href={item.href} key={item.id} className="bg-white border border-[#132a2b]/10 rounded-lg overflow-hidden hover:shadow-md transition-shadow group cursor-pointer flex flex-col">
                    <div className="h-44 md:h-56 overflow-hidden bg-neutral-100">
                      <img 
                        src={item.image} 
                        alt={item.name} 
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                      />
                    </div>
                    <div className="p-3 md:p-4 flex flex-col flex-grow justify-center text-center">
                      <h4 className="font-bold text-sm md:text-base leading-tight md:truncate whitespace-normal line-clamp-2 md:line-clamp-none">{item.name}</h4>
                    </div>
                  </a>
                ))}
              </div>
            </section>
          ))}
        </div>
      </div>

        </div>
      </main>
      <Footer />
    </>
  );
}