import { Music2 } from "lucide-react";

export default function Footer() {
  return (
    <footer
      id="contact"
      className="border-t border-neutral-200 bg-white px-6 py-7"
    >
      <div className="mx-auto flex max-w-7xl flex-col items-center text-center">

        {/* LOGO */}
        <img
          src="/images/rentspot-logo.png"
          alt="RentSpotPH"
          className="h-7 w-auto object-contain"
        />

        {/* TAGLINE */}
        <p className="mt-2 max-w-md text-xs leading-5 text-neutral-500">
          Find trusted equipment for your next project, trip, or everyday
          adventure.
        </p>

        {/* NAVIGATION */}
        <nav className="mt-4 flex flex-wrap justify-center gap-x-6 gap-y-2 text-sm font-medium text-neutral-700">
          <a
            href="#home"
            className="transition-colors hover:text-brand-600"
          >
            Home
          </a>

          <a
            href="#browse"
            className="transition-colors hover:text-brand-600"
          >
            Browse
          </a>

          <a
            href="#why-rentspot"
            className="transition-colors hover:text-brand-600"
          >
            About Us
          </a>

          <a
            href="#contact"
            className="transition-colors hover:text-brand-600"
          >
            Contact
          </a>
        </nav>

        {/* SOCIALS */}
        <div className="mt-4 flex gap-2">
          <a
            href="https://www.facebook.com/rentspotphilippines"
            target="_blank"
            rel="noopener noreferrer"
            className="flex h-8 w-8 items-center justify-center rounded-full bg-brand-500 text-white transition-colors hover:bg-brand-600"
            aria-label="Facebook"
          >
            Facebook
          </a>

          <a
            href="https://www.instagram.com/rentspotph"
            target="_blank"
            rel="noopener noreferrer"
            className="flex h-8 w-8 items-center justify-center rounded-full bg-brand-600 text-white transition-colors hover:bg-brand-700"
            aria-label="Instagram"
          >
            Instagram
          </a>

          <a
            href="https://www.tiktok.com/@rentspotph"
            target="_blank"
            rel="noopener noreferrer"
            className="flex h-8 w-8 items-center justify-center rounded-full bg-neutral-900 text-white transition-colors hover:bg-neutral-800"
            aria-label="TikTok"
          >
            <Music2 size={15} strokeWidth={2.2} />
          </a>
        </div>

        {/* COPYRIGHT */}
        <div className="mt-5 border-t border-neutral-200 pt-4 text-xs text-neutral-400">
          © 2026 RentSpotPH. All rights reserved.
        </div>

      </div>
    </footer>
  );
}