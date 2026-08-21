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

      {/* WHY CHOOSE RENTSPOTPH */}
      <section className="max-w-5xl mx-auto px-6 py-12 md:py-16">
        <h2 className="text-2xl md:text-3xl font-black mb-8 md:mb-12 text-center">Why Choose RentSpotPH?</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 md:gap-8">
          <div className="p-6 md:p-8 bg-white border border-[#132a2b]/10 shadow-sm rounded-2xl text-center flex flex-col items-center">
            {/* Added UserCheck Icon */}
            <div className="bg-[#fbe8e8] text-[#ef765d] p-4 rounded-full mb-5">
              <UserCheck size={32} strokeWidth={2} />
            </div>
            <h3 className="font-bold text-lg mb-2 md:mb-3">Verified Owners</h3>
            <p className="text-sm text-[#132a2b]/70 leading-relaxed">Rent securely from our community of trusted and verified item owners.</p>
          </div>
          <div className="p-6 md:p-8 bg-white border border-[#132a2b]/10 shadow-sm rounded-2xl text-center flex flex-col items-center">
            {/* Added LayoutGrid Icon */}
            <div className="bg-[#fbe8e8] text-[#ef765d] p-4 rounded-full mb-5">
              <LayoutGrid size={32} strokeWidth={2} />
            </div>
            <h3 className="font-bold text-lg mb-2 md:mb-3">Wide Selection</h3>
            <p className="text-sm text-[#132a2b]/70 leading-relaxed">Find everything from high-end camera gear to daily commute vehicles.</p>
          </div>
          <div className="p-6 md:p-8 bg-white border border-[#132a2b]/10 shadow-sm rounded-2xl text-center flex flex-col items-center">
            {/* Added Lock Icon */}
            <div className="bg-[#fbe8e8] text-[#ef765d] p-4 rounded-full mb-5">
              <Lock size={32} strokeWidth={2} />
            </div>
            <h3 className="font-bold text-lg mb-2 md:mb-3">Secure Payments</h3>
            <p className="text-sm text-[#132a2b]/70 leading-relaxed">Your transactions are protected by our secure and encrypted payment gateway.</p>
          </div>
        </div>
      </section>

    
    {/* FAQ SECTION */}
<section id="about" className="mx-auto max-w-5xl scroll-mt-24 px-6 py-12 md:py-16 font-sans">
  <div className="mx-auto max-w-3xl font-sans">
    <p className="text-center text-sm font-bold uppercase tracking-[0.18em] text-[#2459b8]">Need help?</p>
    <h2 className="mt-2 text-center text-2xl font-black md:text-3xl">Frequently Asked Questions</h2>

    {/* HORIZONTAL TAB BAR */}
    <div className="mt-8 flex flex-wrap justify-center gap-2 border-b border-[#2459b8]/15 pb-2">
      {faqCategories.map((cat) => (
        <button
          key={cat.id}
          onClick={() => setActiveFaqTab(cat.id)}
          className={`rounded-full px-4 py-2 text-sm font-bold transition ${
            activeFaqTab === cat.id
              ? "bg-[#2459b8] text-white"
              : "bg-[#2459b8]/5 text-[#132a2b]/70 hover:bg-[#2459b8]/10"
          }`}
        >
          {cat.label}
        </button>
      ))}
    </div>

    {/* ===== HOW TO RENT ===== */}
    {activeFaqTab === "how-to-rent" && (
      <div className="mt-6 divide-y divide-[#2459b8]/15 border-y border-[#2459b8]/15">

        <details className="group py-5">
          <summary className="flex cursor-pointer list-none items-center justify-between gap-4 text-base font-bold marker:hidden">
            How to Rent a Smartphone
            <span className="text-2xl font-normal text-[#2459b8] transition group-open:rotate-45">+</span>
          </summary>
          <div className="mt-4 max-h-[500px] space-y-4 overflow-y-auto pr-2">
            <p className="max-w-2xl text-sm leading-relaxed text-[#132a2b]/70">
              <strong>1. BROWSE SMARTPHONES</strong><br />
              Browse available smartphones and check their specifications, rental rates, availability, and other details. You can browse even without an account.
            </p>
            <p className="max-w-2xl text-sm leading-relaxed text-[#132a2b]/70">
              <strong>2. CHOOSE A SMARTPHONE</strong><br />
              Select the phone you want and review its rental details and available rental dates.
            </p>
            <p className="max-w-2xl text-sm leading-relaxed text-[#132a2b]/70">
              <strong>3. SIGN IN OR CREATE AN ACCOUNT IF NEEDED</strong><br />
              If you're logged out, you'll be asked to sign in or create a RentSpotPH account before continuing. If you're already logged in, you can proceed directly.
            </p>
            <p className="max-w-2xl text-sm leading-relaxed text-[#132a2b]/70">
              <strong>4. VERIFY YOUR IDENTITY</strong><br />
              If your account is still unverified, you'll need to upload a valid ID and take a selfie before you can continue with the rental process.
            </p>
            <p className="max-w-2xl text-sm leading-relaxed text-[#132a2b]/70">
              <strong>WHY DO I NEED TO VERIFY MY IDENTITY?</strong><br />
              Verification helps keep RentSpotPH safe by confirming that you're a real renter before you can request a booking. This helps protect both renters and rental providers.
            </p>
            <p className="max-w-2xl text-sm leading-relaxed text-[#132a2b]/70">
              <strong>5. WAIT FOR VERIFICATION</strong><br />
              Your submitted ID and selfie will be checked. Verification time may vary depending on the review process. We'll notify you once your account has been verified.
            </p>
            <p className="max-w-2xl text-sm leading-relaxed text-[#132a2b]/70">
              <strong>6. SELECT YOUR RENTAL DETAILS</strong><br />
              Choose your preferred rental dates and provide the required booking information.
            </p>
            <p className="max-w-2xl text-sm leading-relaxed text-[#132a2b]/70">
              <strong>7. COMPLETE YOUR PAYMENT</strong><br />
              Before your booking can be submitted for admin approval, you'll need to complete the required payment.
            </p>
            <p className="max-w-2xl text-sm leading-relaxed text-[#132a2b]/70">
              <strong>8. SIGN THE RENTAL AGREEMENT</strong><br />
              Review and sign the applicable smartphone rental agreement.
            </p>
            <p className="max-w-2xl text-sm leading-relaxed text-[#132a2b]/70">
              <strong>9. SUBMIT YOUR BOOKING REQUEST</strong><br />
              Once your payment is completed and the agreement is signed, your booking request will be submitted for admin review.
            </p>
            <p className="max-w-2xl text-sm leading-relaxed text-[#132a2b]/70">
              <strong>10. WAIT FOR APPROVAL</strong><br />
              The admin will review your request. Once approved, you'll receive your booking confirmation and pickup details.
            </p>
            <p className="max-w-2xl text-sm leading-relaxed text-[#132a2b]/70">
              <strong>11. PICK UP AND RETURN THE SMARTPHONE</strong><br />
              Follow the provided pickup instructions, use the smartphone during your approved rental period, and return it on the agreed date and in the required condition.
            </p>
          </div>
        </details>

        <details className="group py-5">
          <summary className="flex cursor-pointer list-none items-center justify-between gap-4 text-base font-bold marker:hidden">
            How to Rent a Camera
            <span className="text-2xl font-normal text-[#2459b8] transition group-open:rotate-45">+</span>
          </summary>
          <div className="mt-4 max-h-[500px] space-y-4 overflow-y-auto pr-2">
            <p className="max-w-2xl text-sm leading-relaxed text-[#132a2b]/70">
              <strong>1. BROWSE CAMERAS</strong><br />
              Browse available cameras and check their details, rental rates, and availability. You can browse even without an account.
            </p>
            <p className="max-w-2xl text-sm leading-relaxed text-[#132a2b]/70">
              <strong>2. CHOOSE A CAMERA</strong><br />
              Select the camera you want and review its rental details and available dates.
            </p>
            <p className="max-w-2xl text-sm leading-relaxed text-[#132a2b]/70">
              <strong>3. SIGN IN OR CREATE AN ACCOUNT IF NEEDED</strong><br />
              If you're logged out, you'll be asked to sign in or create a RentSpotPH account before continuing. If you're already logged in, you can proceed directly.
            </p>
            <p className="max-w-2xl text-sm leading-relaxed text-[#132a2b]/70">
              <strong>4. VERIFY YOUR IDENTITY</strong><br />
              If your account is still unverified, you'll need to upload a valid ID and take a selfie before you can continue with the rental process.
            </p>
            <p className="max-w-2xl text-sm leading-relaxed text-[#132a2b]/70">
              <strong>WHY DO I NEED TO VERIFY MY IDENTITY?</strong><br />
              Verification helps keep RentSpotPH safe by confirming that you're a real renter before you can request a booking. This helps protect both renters and rental providers.
            </p>
            <p className="max-w-2xl text-sm leading-relaxed text-[#132a2b]/70">
              <strong>5. WAIT FOR VERIFICATION</strong><br />
              Your submitted ID and selfie will be checked. Verification time may vary depending on the review process. We'll notify you once your account has been verified.
            </p>
            <p className="max-w-2xl text-sm leading-relaxed text-[#132a2b]/70">
              <strong>6. SELECT YOUR RENTAL DETAILS</strong><br />
              Choose your preferred rental dates and provide the required booking information.
            </p>
            <p className="max-w-2xl text-sm leading-relaxed text-[#132a2b]/70">
              <strong>7. COMPLETE YOUR PAYMENT</strong><br />
              Before your booking can be submitted for approval, you'll need to complete the required payment.
            </p>
            <p className="max-w-2xl text-sm leading-relaxed text-[#132a2b]/70">
              <strong>8. SIGN THE RENTAL AGREEMENT</strong><br />
              Review and sign the applicable rental agreement.
            </p>
            <p className="max-w-2xl text-sm leading-relaxed text-[#132a2b]/70">
              <strong>9. SUBMIT YOUR BOOKING REQUEST</strong><br />
              Once your payment is completed and the agreement has been signed, your booking request will be submitted for admin review.
            </p>
            <p className="max-w-2xl text-sm leading-relaxed text-[#132a2b]/70">
              <strong>10. WAIT FOR APPROVAL</strong><br />
              The admin will review your booking request. Once approved, you'll receive your booking confirmation and pickup details.
            </p>
            <p className="max-w-2xl text-sm leading-relaxed text-[#132a2b]/70">
              <strong>11. PICK UP AND RETURN THE CAMERA</strong><br />
              Follow the provided pickup instructions, enjoy your rental, and return the camera on the agreed date.
            </p>
          </div>
        </details>

        <details className="group py-5">
          <summary className="flex cursor-pointer list-none items-center justify-between gap-4 text-base font-bold marker:hidden">
            How to Rent a Vehicle
            <span className="text-2xl font-normal text-[#2459b8] transition group-open:rotate-45">+</span>
          </summary>
          <div className="mt-4 max-h-[500px] space-y-4 overflow-y-auto pr-2">
            <p className="max-w-2xl text-sm leading-relaxed text-[#132a2b]/70">
              <strong>1. BROWSE VEHICLES</strong><br />
              Browse available vehicles and check their details, rental rates, availability, and rental requirements. You can browse even without an account.
            </p>
            <p className="max-w-2xl text-sm leading-relaxed text-[#132a2b]/70">
              <strong>2. CHOOSE A VEHICLE</strong><br />
              Select the vehicle you want and review its rental details and available rental dates.
            </p>
            <p className="max-w-2xl text-sm leading-relaxed text-[#132a2b]/70">
              <strong>3. SIGN IN OR CREATE AN ACCOUNT IF NEEDED</strong><br />
              If you're logged out, you'll be asked to sign in or create a RentSpotPH account before continuing. If you're already logged in, you can proceed directly.
            </p>
            <p className="max-w-2xl text-sm leading-relaxed text-[#132a2b]/70">
              <strong>4. VERIFY YOUR IDENTITY</strong><br />
              If your account is still unverified, you'll need to upload a valid driver's license and take a selfie before you can continue with the vehicle rental process.
            </p>
            <p className="max-w-2xl text-sm leading-relaxed text-[#132a2b]/70">
              <strong>WHY DO I NEED TO VERIFY MY IDENTITY?</strong><br />
              Verification helps keep RentSpotPH safe by confirming that you're a real renter before you can request a booking. This helps protect both renters and rental providers.
            </p>
            <p className="max-w-2xl text-sm leading-relaxed text-[#132a2b]/70">
              <strong>5. WAIT FOR VERIFICATION</strong><br />
              Your submitted ID and selfie will be checked. Verification time may vary depending on the review process. We'll notify you once your account has been verified.
            </p>
            <p className="max-w-2xl text-sm leading-relaxed text-[#132a2b]/70">
              <strong>6. SELECT YOUR RENTAL DETAILS</strong><br />
              Choose your preferred rental dates and provide the required vehicle rental information.
            </p>
            <p className="max-w-2xl text-sm leading-relaxed text-[#132a2b]/70">
              <strong>7. COMPLETE YOUR PAYMENT</strong><br />
              Before your booking can be submitted for admin approval, you'll need to complete the required payment.
            </p>
            <p className="max-w-2xl text-sm leading-relaxed text-[#132a2b]/70">
              <strong>8. SIGN THE VEHICLE RENTAL AGREEMENT</strong><br />
              Review and sign the separate vehicle rental agreement before continuing with your booking.
            </p>
            <p className="max-w-2xl text-sm leading-relaxed text-[#132a2b]/70">
              <strong>9. SUBMIT YOUR BOOKING REQUEST</strong><br />
              Once your payment is completed and the vehicle rental agreement is signed, your booking request will be submitted for admin review.
            </p>
            <p className="max-w-2xl text-sm leading-relaxed text-[#132a2b]/70">
              <strong>10. WAIT FOR APPROVAL</strong><br />
              The admin will review your vehicle booking request. Once approved, you'll receive your booking confirmation and pickup details.
            </p>
            <p className="max-w-2xl text-sm leading-relaxed text-[#132a2b]/70">
              <strong>11. PICK UP AND RETURN THE VEHICLE</strong><br />
              Follow the provided pickup instructions, use the vehicle during your approved rental period, and return it according to the agreed date, time, location, and rental conditions.
            </p>
          </div>
        </details>

      </div>
    )}

    {/* ===== ABOUT PAYMENT ===== */}
    {activeFaqTab === "payment" && (
      <div className="mt-6 divide-y divide-[#2459b8]/15 border-y border-[#2459b8]/15">

        <details className="group py-5">
          <summary className="flex cursor-pointer list-none items-center justify-between gap-4 text-base font-bold marker:hidden">
            When do I need to pay?
            <span className="text-2xl font-normal text-[#2459b8] transition group-open:rotate-45">+</span>
          </summary>
          <div className="mt-4 space-y-4">
            <p className="max-w-2xl text-sm leading-relaxed text-[#132a2b]/70">
              Payment is required after you've selected your rental dates and before your booking request is submitted for admin approval. You won't be able to sign the rental agreement or submit your request until payment is completed.
            </p>
          </div>
        </details>

        <details className="group py-5">
          <summary className="flex cursor-pointer list-none items-center justify-between gap-4 text-base font-bold marker:hidden">
            Why do I need to pay before my booking is submitted?
            <span className="text-2xl font-normal text-[#2459b8] transition group-open:rotate-45">+</span>
          </summary>
          <div className="mt-4 space-y-4">
            <p className="max-w-2xl text-sm leading-relaxed text-[#132a2b]/70">
              Requiring payment upfront confirms that your booking request is genuine before it's sent for admin review. This protects rental providers from unpaid or unconfirmed bookings and helps keep the item reserved for you while your request is processed.
            </p>
          </div>
        </details>

        <details className="group py-5">
          <summary className="flex cursor-pointer list-none items-center justify-between gap-4 text-base font-bold marker:hidden">
            What payment methods are accepted?
            <span className="text-2xl font-normal text-[#2459b8] transition group-open:rotate-45">+</span>
          </summary>
          <div className="mt-4 space-y-4">
            <p className="max-w-2xl text-sm leading-relaxed text-[#132a2b]/70">
              RentSpotPH accepts major e-wallets and online banking options available at checkout. Accepted methods are displayed on the payment page when you complete your booking.
            </p>
          </div>
        </details>

        <details className="group py-5">
          <summary className="flex cursor-pointer list-none items-center justify-between gap-4 text-base font-bold marker:hidden">
            Can I get a refund?
            <span className="text-2xl font-normal text-[#2459b8] transition group-open:rotate-45">+</span>
          </summary>
          <div className="mt-4 space-y-4">
            <p className="max-w-2xl text-sm leading-relaxed text-[#132a2b]/70">
              Refund eligibility depends on the circumstances of your booking, such as cancellations before approval or issues with the rental item. Contact our support team through the details in the footer, and we'll review your request.
            </p>
          </div>
        </details>

      </div>
    )}

    {/* ===== RENTAL AGREEMENTS ===== */}
    {activeFaqTab === "agreements" && (
      <div className="mt-6 divide-y divide-[#2459b8]/15 border-y border-[#2459b8]/15">

        <details className="group py-5">
          <summary className="flex cursor-pointer list-none items-center justify-between gap-4 text-base font-bold marker:hidden">
            Why do I need to sign a rental agreement?
            <span className="text-2xl font-normal text-[#2459b8] transition group-open:rotate-45">+</span>
          </summary>
          <div className="mt-4 space-y-4">
            <p className="max-w-2xl text-sm leading-relaxed text-[#132a2b]/70">
              The rental agreement outlines the terms of your booking, including your responsibilities as a renter and the condition the item must be returned in. Signing it protects both you and the rental provider.
            </p>
          </div>
        </details>

        <details className="group py-5">
          <summary className="flex cursor-pointer list-none items-center justify-between gap-4 text-base font-bold marker:hidden">
            When do I sign the rental agreement?
            <span className="text-2xl font-normal text-[#2459b8] transition group-open:rotate-45">+</span>
          </summary>
          <div className="mt-4 space-y-4">
            <p className="max-w-2xl text-sm leading-relaxed text-[#132a2b]/70">
              You'll sign the agreement after completing your payment and before your booking request is submitted for admin approval.
            </p>
          </div>
        </details>

        <details className="group py-5">
          <summary className="flex cursor-pointer list-none items-center justify-between gap-4 text-base font-bold marker:hidden">
            What does the rental agreement contain?
            <span className="text-2xl font-normal text-[#2459b8] transition group-open:rotate-45">+</span>
          </summary>
          <div className="mt-4 space-y-4">
            <p className="max-w-2xl text-sm leading-relaxed text-[#132a2b]/70">
              It includes your rental period, item condition on pickup, your responsibilities during the rental, late return terms, and the process for handling damage or loss.
            </p>
          </div>
        </details>

        <details className="group py-5">
          <summary className="flex cursor-pointer list-none items-center justify-between gap-4 text-base font-bold marker:hidden">
            Do cameras and smartphones use the same rental agreement?
            <span className="text-2xl font-normal text-[#2459b8] transition group-open:rotate-45">+</span>
          </summary>
          <div className="mt-4 space-y-4">
            <p className="max-w-2xl text-sm leading-relaxed text-[#132a2b]/70">
              Cameras and smartphones use a similar general rental agreement format, though terms may vary slightly depending on the specific item and provider.
            </p>
          </div>
        </details>

        <details className="group py-5">
          <summary className="flex cursor-pointer list-none items-center justify-between gap-4 text-base font-bold marker:hidden">
            Does vehicle rental have a separate agreement?
            <span className="text-2xl font-normal text-[#2459b8] transition group-open:rotate-45">+</span>
          </summary>
          <div className="mt-4 space-y-4">
            <p className="max-w-2xl text-sm leading-relaxed text-[#132a2b]/70">
              Yes. Vehicle rentals use a separate rental agreement that covers requirements specific to driving, such as licensing, fuel, and vehicle condition terms.
            </p>
          </div>
        </details>

        <details className="group py-5">
          <summary className="flex cursor-pointer list-none items-center justify-between gap-4 text-base font-bold marker:hidden">
            What happens if I don't sign the agreement?
            <span className="text-2xl font-normal text-[#2459b8] transition group-open:rotate-45">+</span>
          </summary>
          <div className="mt-4 space-y-4">
            <p className="max-w-2xl text-sm leading-relaxed text-[#132a2b]/70">
              Your booking request cannot be submitted for admin approval until the agreement is signed. Without a signed agreement, the rental process cannot continue.
            </p>
          </div>
        </details>

      </div>
    )}

    {/* ===== PICKUP & RETURN ===== */}
    {activeFaqTab === "pickup" && (
      <div className="mt-6 divide-y divide-[#2459b8]/15 border-y border-[#2459b8]/15">

        <details className="group py-5">
          <summary className="flex cursor-pointer list-none items-center justify-between gap-4 text-base font-bold marker:hidden">
            Where do I pick up my rental?
            <span className="text-2xl font-normal text-[#2459b8] transition group-open:rotate-45">+</span>
          </summary>
          <div className="mt-4 space-y-4">
            <p className="max-w-2xl text-sm leading-relaxed text-[#132a2b]/70">
              Pickup location details are provided in your booking confirmation once your request is approved. Locations may vary depending on the item and provider.
            </p>
          </div>
        </details>

        <details className="group py-5">
          <summary className="flex cursor-pointer list-none items-center justify-between gap-4 text-base font-bold marker:hidden">
            When can I pick up my rental?
            <span className="text-2xl font-normal text-[#2459b8] transition group-open:rotate-45">+</span>
          </summary>
          <div className="mt-4 space-y-4">
            <p className="max-w-2xl text-sm leading-relaxed text-[#132a2b]/70">
              Pickup time is based on the rental start date you selected during booking. Your exact pickup schedule will be included in your confirmation details.
            </p>
          </div>
        </details>

        <details className="group py-5">
          <summary className="flex cursor-pointer list-none items-center justify-between gap-4 text-base font-bold marker:hidden">
            What should I bring when picking up my rental?
            <span className="text-2xl font-normal text-[#2459b8] transition group-open:rotate-45">+</span>
          </summary>
          <div className="mt-4 space-y-4">
            <p className="max-w-2xl text-sm leading-relaxed text-[#132a2b]/70">
              Bring a valid government-issued ID matching your verified account, and your booking confirmation. Vehicle rentals may also require a valid driver's license.
            </p>
          </div>
        </details>

        <details className="group py-5">
          <summary className="flex cursor-pointer list-none items-center justify-between gap-4 text-base font-bold marker:hidden">
            How do I return my rental?
            <span className="text-2xl font-normal text-[#2459b8] transition group-open:rotate-45">+</span>
          </summary>
          <div className="mt-4 space-y-4">
            <p className="max-w-2xl text-sm leading-relaxed text-[#132a2b]/70">
              Return the item to the agreed location by the date and time stated in your rental agreement, in the same condition it was received.
            </p>
          </div>
        </details>

        <details className="group py-5">
          <summary className="flex cursor-pointer list-none items-center justify-between gap-4 text-base font-bold marker:hidden">
            What happens if I return the item late?
            <span className="text-2xl font-normal text-[#2459b8] transition group-open:rotate-45">+</span>
          </summary>
          <div className="mt-4 space-y-4">
            <p className="max-w-2xl text-sm leading-relaxed text-[#132a2b]/70">
              Late returns may incur additional fees as outlined in your signed rental agreement. Please contact the provider as soon as possible if you expect a delay.
            </p>
          </div>
        </details>

        <details className="group py-5">
          <summary className="flex cursor-pointer list-none items-center justify-between gap-4 text-base font-bold marker:hidden">
            What happens if the rental is damaged or lost?
            <span className="text-2xl font-normal text-[#2459b8] transition group-open:rotate-45">+</span>
          </summary>
          <div className="mt-4 space-y-4">
            <p className="max-w-2xl text-sm leading-relaxed text-[#132a2b]/70">
              Damage or loss is handled according to the terms in your signed rental agreement, which may include repair costs, replacement fees, or other charges.
            </p>
          </div>
        </details>

        <details className="group py-5">
          <summary className="flex cursor-pointer list-none items-center justify-between gap-4 text-base font-bold marker:hidden">
            Can someone else pick up my rental for me?
            <span className="text-2xl font-normal text-[#2459b8] transition group-open:rotate-45">+</span>
          </summary>
          <div className="mt-4 space-y-4">
            <p className="max-w-2xl text-sm leading-relaxed text-[#132a2b]/70">
              Rentals are generally tied to the verified account that made the booking. If someone else needs to pick up on your behalf, contact support in advance to check what's allowed for your booking.
            </p>
          </div>
        </details>

      </div>
    )}

  </div>
</section>
    
{/* FOOTER SECTION */}
<footer className="border-t border-[#2459b8]/15 bg-white px-6 py-8 md:px-8 md:py-10">
  <div className="mx-auto grid max-w-5xl gap-4 md:grid-cols-3 md:gap-6">
    
    <div className="flex flex-col space-y-4 md:w-64 md:items-start md:justify-self-start md:text-left">
      <img src="/Pics/logo.jpg" alt="RentSpotPH" className="h-7 w-auto object-contain object-left opacity-100 mix-blend-normal md:h-9" />
      <p className="max-w-sm text-base font-normal leading-relaxed text-[#132a2b]/85">
        Find trusted equipment for your next project, trip, or everyday adventure.
      </p>
      <div className="mt-1 flex w-fit justify-start gap-3">
        <a href="https://www.facebook.com/rentspotphilippines" target="_blank" rel="noopener noreferrer" className="flex h-10 w-10 items-center justify-center rounded-full bg-[#1877f2] text-white transition hover:bg-[#145dbb]" aria-label="Facebook">
          <Facebook size={20} strokeWidth={2.2} />
        </a>
        <a href="https://www.instagram.com/rentspotph?utm_source=ig_web_button_share_sheet&igsh=ZDNlZDc0MzIxNw==" target="_blank" rel="noopener noreferrer" className="flex h-10 w-10 items-center justify-center rounded-full bg-gradient-to-br from-[#f58529] via-[#dd2a7b] to-[#8134af] text-white transition hover:brightness-90" aria-label="Instagram">
          <Instagram size={20} strokeWidth={2.2} />
        </a>
        <a href="https://www.tiktok.com/@rentspotph" target="_blank" rel="noopener noreferrer" className="flex h-10 w-10 items-center justify-center rounded-full bg-black text-white transition hover:bg-[#222222]" aria-label="TikTok">
          <Music2 size={20} strokeWidth={2.2} />
        </a>
      </div>
    </div>

    <div className="flex flex-col space-y-4 md:justify-self-center">
      <h4 className="text-base font-semibold uppercase tracking-wide text-[#2459b8]">Explore</h4>
      <div className="flex flex-col space-y-3 text-base font-normal text-[#132a2b]/90">
        <a href="#" className="transition hover:text-[#2459b8]">Home</a>
        <a href="#browse" className="transition hover:text-[#2459b8]">Browse units</a>
        <a href="#about" className="transition hover:text-[#2459b8]">Why RentSpotPH</a>
        <a href="#about" className="transition hover:text-[#2459b8]">FAQs</a>
        <a href="#contact" className="transition hover:text-[#2459b8]">Contact us</a>
      </div>
    </div>

    <div id="contact" className="flex flex-col space-y-4 md:w-64 md:justify-self-end">
      <h4 className="text-base font-semibold uppercase tracking-wide text-[#2459b8]">Get in touch</h4>
      <div className="flex flex-col space-y-3 text-base font-normal text-[#132a2b]/90">
        <a href="mailto:hello@rentspot.ph" className="flex items-center gap-3 transition hover:text-[#2459b8]">
          <Mail size={19} strokeWidth={2.2} className="text-[#f5bd22]" />business@rentspotph.net
        </a>
        <a href="tel:+639123456789" className="flex items-center gap-3 transition hover:text-[#2459b8]">
          <Phone size={19} strokeWidth={2.2} className="text-[#f5bd22]" />(043) 774 3634
        </a>
        <span className="flex items-start gap-3">
          <MapPin size={19} strokeWidth={2.2} className="mt-0.5 shrink-0 text-[#f5bd22]" />
          Jollibee Banay Banay, Lipa City, Philippines, 4217
        </span>
      </div>
      
    </div>
    
  </div>
  
  <div className="mx-auto mt-8 max-w-6xl border-t border-[#2459b8]/15 pt-6 text-sm text-[#132a2b]/65">
    © 2026 RentSpotPH. Made for finding your place and what you need.
  </div>
</footer>
</main>
  );
}