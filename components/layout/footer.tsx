import { Music2 } from "lucide-react";

function FacebookIcon() {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true" className="h-4 w-4 fill-current">
      <path d="M13.5 22v-8h2.8l.4-3.2h-3.2V7.2c0-.9.3-1.6 1.7-1.6H17V2.7c-.4-.1-1.5-.2-2.8-.2-2.7 0-4.7 1.6-4.7 4.7v2.6H7V14h2.5v8h4Z" />
    </svg>
  );
}

function InstagramIcon() {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true" className="h-4 w-4 fill-current">
      <path d="M7 2h10a5 5 0 0 1 5 5v10a5 5 0 0 1-5 5H7a5 5 0 0 1-5-5V7a5 5 0 0 1 5-5Zm0 2a3 3 0 0 0-3 3v10a3 3 0 0 0 3 3h10a3 3 0 0 0 3-3V7a3 3 0 0 0-3-3H7Zm5 3.3A4.7 4.7 0 1 1 7.3 12 4.7 4.7 0 0 1 12 7.3Zm0 2A2.7 2.7 0 1 0 14.7 12 2.7 2.7 0 0 0 12 9.3Zm5-3.1a1.1 1.1 0 1 1-1.1 1.1 1.1 1.1 0 0 1 1.1-1.1Z" />
    </svg>
  );
}

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
            href="/guest/browse"
            className="transition-colors hover:text-brand-600"
          >
            Browse
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
            className="flex h-8 w-8 items-center justify-center rounded-full bg-[#1877F2] text-white transition-colors hover:opacity-90"
            aria-label="Facebook"
          >
            <FacebookIcon />
          </a>

          <a
            href="https://www.instagram.com/rentspotph"
            target="_blank"
            rel="noopener noreferrer"
            className="flex h-8 w-8 items-center justify-center rounded-full bg-gradient-to-br from-[#f9ce34] via-[#ee2a7b] to-[#6228d7] text-white transition-colors hover:opacity-90"
            aria-label="Instagram"
          >
            <InstagramIcon />
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