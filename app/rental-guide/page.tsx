import Link from 'next/link';
import { ArrowRight, CheckCircle2, FileCheck2, LockKeyhole, Mail, MessageCircle, Phone, ShieldAlert } from 'lucide-react';
import Navbar from '@/components/layout/navbar';
import Footer from '@/components/layout/footer';

const requirements = [
  'Valid government-issued ID with your current address',
  'A selfie with your valid ID, with your face clearly visible',
  'Proof of billing address, such as a utility or bank document',
  'Signed rental contract',
  'A real, active, and unlocked social media account',
];

export default function RentalGuidePage() {
  return (
    <>
      <Navbar />
      <main className="bg-neutral-50 text-neutral-900">
        <section className="border-b border-neutral-200 bg-white px-4 py-14 sm:px-6 lg:px-8">
          <div className="mx-auto max-w-5xl"><p className="text-sm font-semibold uppercase tracking-[0.2em] text-blue-600">Before you rent</p><h1 className="mt-3 max-w-3xl text-4xl font-bold tracking-tight sm:text-5xl">Rental guide, requirements, and next steps</h1><p className="mt-4 max-w-2xl text-base leading-7 text-neutral-600">Prepare the right documents, understand the rental policies, and contact RentSpotPH when you are ready to reserve.</p></div>
        </section>

        <section id="account-access" className="scroll-mt-24 border-b border-amber-200 bg-amber-50 px-4 py-10 sm:px-6 lg:px-8">
          <div className="mx-auto flex max-w-5xl flex-col gap-5 sm:flex-row sm:items-start"><div className="rounded-2xl bg-amber-100 p-3 text-amber-800"><LockKeyhole className="h-7 w-7" /></div><div><p className="text-sm font-semibold uppercase tracking-[0.18em] text-amber-800">Important account notice</p><h2 className="mt-1 text-2xl font-bold text-amber-950">Please use an active and unlocked account</h2><p className="mt-3 max-w-3xl leading-7 text-amber-900">We do not transact with renters who have locked, dummy, or newly created accounts. Please unlock your profile and let us know so we can continue the rental process.</p><p className="mt-3 font-semibold text-amber-950">Use your real, active, and unlocked account. Thank you.</p></div></div>
        </section>

        <section className="mx-auto grid max-w-5xl gap-8 px-4 py-12 sm:px-6 lg:grid-cols-[1.1fr_0.9fr] lg:px-8">
          <div><div className="flex items-center gap-3"><div className="rounded-xl bg-blue-100 p-2 text-blue-700"><FileCheck2 className="h-5 w-5" /></div><div><h2 className="text-2xl font-bold">Requirements for renters</h2><p className="text-sm text-neutral-600">Prepare these before submitting your request.</p></div></div><ol className="mt-6 space-y-3">{requirements.map((item, index) => <li key={item} className="flex gap-3 rounded-xl border border-neutral-200 bg-white p-4 shadow-sm"><span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-blue-600 text-sm font-bold text-white">{index + 1}</span><span className="text-sm leading-6 text-neutral-700">{item}</span></li>)}</ol></div>
          <div className="rounded-2xl border border-neutral-200 bg-white p-6 shadow-sm"><div className="flex items-center gap-3"><div className="rounded-xl bg-emerald-100 p-2 text-emerald-700"><ShieldAlert className="h-5 w-5" /></div><h2 className="text-xl font-bold">For car rentals</h2></div><p className="mt-4 text-sm leading-6 text-neutral-600">A valid driver&apos;s license and LTO portal copy are required when the renter will drive. A designated driver must provide their own valid driver&apos;s license and LTO portal copy.</p><div className="mt-5 rounded-xl bg-neutral-50 p-4 text-sm leading-6 text-neutral-700">All renters must provide a valid ID with address, signed contract, proof of billing, and an active account.</div></div>
        </section>

        <section className="border-y border-neutral-200 bg-white px-4 py-12 sm:px-6 lg:px-8"><div className="mx-auto max-w-5xl"><h2 className="text-2xl font-bold">Rental policies at a glance</h2><div className="mt-6 grid gap-4 md:grid-cols-3"><Policy title="24-hour periods" text="A one-day rental is 24 hours from pickup. Return the unit at the agreed time to avoid late fees." /><Policy title="Rescheduling" text="One reschedule is allowed when the new requested date is still available." /><Policy title="Longer rentals" text="Rentals of 7 days or more receive a 20% discount on the total rental fee." /></div><div className="mt-6 rounded-2xl border border-red-200 bg-red-50 p-5"><p className="font-semibold text-red-900">Cancellation and responsibility</p><p className="mt-2 text-sm leading-6 text-red-800">Reservation or security fees are non-refundable after cancellation. From pickup until return, the renter is responsible for the unit and all accessories, including damage or loss.</p></div></div></section>

        <section className="mx-auto max-w-5xl px-4 py-12 sm:px-6 lg:px-8"><div className="rounded-3xl bg-blue-700 px-6 py-10 text-white sm:px-10"><div className="max-w-2xl"><p className="text-sm font-semibold uppercase tracking-[0.18em] text-blue-100">Ready to rent?</p><h2 className="mt-2 text-3xl font-bold">Send us a message or browse available units.</h2><p className="mt-3 leading-7 text-blue-100">Units are limited and in demand. Tell us your preferred unit and rental dates so we can confirm availability and the next steps.</p></div><div className="mt-8 grid gap-3 sm:grid-cols-3"><a href="mailto:business@rentspotph.net" className="flex items-center gap-3 rounded-xl bg-white/10 px-4 py-3 text-sm font-semibold hover:bg-white/20"><Mail className="h-5 w-5" /> business@rentspotph.net</a><a href="tel:0437560362" className="flex items-center gap-3 rounded-xl bg-white/10 px-4 py-3 text-sm font-semibold hover:bg-white/20"><Phone className="h-5 w-5" /> 0437 560 362</a><a href="https://www.facebook.com/rentspotphilippines" target="_blank" rel="noopener noreferrer" className="flex items-center gap-3 rounded-xl bg-white/10 px-4 py-3 text-sm font-semibold hover:bg-white/20"><MessageCircle className="h-5 w-5" /> Message us</a></div><Link href="/guest/browse" className="mt-8 inline-flex items-center gap-2 rounded-xl bg-white px-5 py-3 text-sm font-semibold text-blue-700 hover:bg-blue-50">Browse rentals <ArrowRight className="h-4 w-4" /></Link></div></section>

        <section className="mx-auto max-w-5xl px-4 pb-14 text-center sm:px-6 lg:px-8"><p className="text-sm text-neutral-600">Need more answers?</p><Link href="/faq" className="mt-2 inline-flex items-center gap-2 font-semibold text-blue-600 hover:text-blue-700">Read the complete FAQ <ArrowRight className="h-4 w-4" /></Link></section>
      </main>
      <Footer />
    </>
  );
}

function Policy({ title, text }: { title: string; text: string }) {
  return <article className="rounded-2xl border border-neutral-200 bg-neutral-50 p-5"><CheckCircle2 className="h-5 w-5 text-emerald-600" /><h3 className="mt-3 font-semibold">{title}</h3><p className="mt-2 text-sm leading-6 text-neutral-600">{text}</p></article>;
}
