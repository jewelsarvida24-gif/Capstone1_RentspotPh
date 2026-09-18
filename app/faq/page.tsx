import Link from 'next/link';
import { ArrowRight, CalendarDays, Car, CircleHelp, Globe2, MapPin, MessageCircle, ShieldCheck, Truck } from 'lucide-react';
import Navbar from '@/components/layout/navbar';
import Footer from '@/components/layout/footer';

const cameraPhoneFaqs = [
  {
    number: '01',
    icon: MapPin,
    question: 'Where are you located?',
    answer: "We're located in Lipa, Batangas. We do not have a physical store yet and operate through meet-ups.",
    detail: 'Meet-up location: Jollibee Banay Banay, Lipa, Batangas.',
  },
  {
    number: '02',
    icon: Truck,
    question: 'Do you deliver?',
    answer: 'For cameras, personal pickup is recommended whenever possible. Courier delivery may be arranged when available, with delivery fees covered by the renter.',
    detail: 'For phone rentals, pickup only at the designated meet-up location. Delivery is not available.',
  },
  {
    number: '03',
    icon: CalendarDays,
    question: 'What is your rental period policy?',
    answer: 'Rental periods are based on 24-hour periods. Pickups and returns must be scheduled between 8:00 AM and 8:00 PM.',
    detail: 'A unit returned beyond the agreed time may incur late fees.',
  },
  {
    number: '04',
    icon: CircleHelp,
    question: 'Can we check the sample photos?',
    answer: 'For cameras, check the album section on our Facebook page. For phones, check the highlights on our Instagram account.',
  },
  {
    number: '05',
    icon: ShieldCheck,
    question: 'Can we cancel our booking?',
    answer: 'The reservation or security fee is non-refundable when a booking is cancelled.',
    detail: 'Cancellations made 1–3 days before rental may also have a late cancellation fee.',
  },
  {
    number: '06',
    icon: CalendarDays,
    question: 'Can we reschedule?',
    answer: 'One reschedule is allowed as long as the new date is still available.',
  },
  {
    number: '07',
    icon: ShieldCheck,
    question: 'What if we damage the rented unit?',
    answer: 'The renter is responsible for the unit and accessories from the moment they take possession.',
    detail: 'The renter must cover repair costs, the equivalent unit value, or a replacement of the same type.',
  },
  {
    number: '08',
    icon: ArrowRight,
    question: 'How do we transfer photos and videos?',
    answer: 'Phones can use AirDrop, ShareIt, Google Drive, or Telegram. Cameras can use an SD card. DJI and Insta360 units can transfer files through their apps.',
  },
  {
    number: '09',
    icon: ShieldCheck,
    question: 'Do you offer discounts for longer rentals?',
    answer: 'Yes. Rentals of 7 days or more receive a 20% discount on the total rental fee.',
  },
  {
    number: '10',
    icon: Globe2,
    question: 'Can I take the camera or phone overseas?',
    answer: 'Yes, as long as you return the unit on time and handle it with extra care during travel.',
  },
];

const carFaqs = [
  ['Self-drive or with driver?', 'We mainly offer self-drive. A driver may be requested for an additional fee, subject to availability and destination.'],
  ['Do you offer long-term rental discounts?', 'Yes. One-week rentals receive 20% off the total rental fee. Monthly rates are available by custom quotation.'],
  ['Is the unit automatic or manual?', 'All car rental units have automatic transmission for a smooth and easy drive.'],
  ['Can I rent without a driver’s license?', 'No. A valid driver’s license is required if you will drive the car.'],
  ['Is there a mileage limit?', 'There is no mileage limit. Please return the unit at the scheduled time.'],
];

export default function FAQPage() {
  return (
    <>
      <Navbar />
      <main className="bg-neutral-50 text-neutral-900">
        <section className="border-b border-neutral-200 bg-white px-4 py-14 sm:px-6 lg:px-8">
          <div className="mx-auto max-w-4xl text-center">
            <p className="text-sm font-semibold uppercase tracking-[0.2em] text-blue-600">RentSpotPH help center</p>
            <h1 className="mt-3 text-4xl font-bold tracking-tight sm:text-5xl">Frequently asked questions</h1>
            <p className="mx-auto mt-4 max-w-2xl text-base leading-7 text-neutral-600">Clear answers for camera, phone, and car rentals before you reserve your dates.</p>
          </div>
        </section>

        <section className="mx-auto max-w-6xl px-4 py-10 sm:px-6 lg:px-8">
          <div className="mb-6 flex items-center gap-3">
            <div className="rounded-xl bg-blue-100 p-2 text-blue-700"><CameraIcon /></div>
            <div><h2 className="text-2xl font-bold">Camera and phone rentals</h2><p className="text-sm text-neutral-600">The details renters ask about most.</p></div>
          </div>
          <div className="grid gap-4 md:grid-cols-2">
            {cameraPhoneFaqs.map(({ number, icon: Icon, question, answer, detail }) => (
              <article key={number} className="rounded-2xl border border-neutral-200 bg-white p-5 shadow-sm">
                <div className="flex gap-4"><span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-blue-600 text-sm font-bold text-white">{number}</span><div className="min-w-0"><div className="flex items-start gap-2"><Icon className="mt-0.5 h-5 w-5 shrink-0 text-blue-600" /><h3 className="font-semibold text-neutral-900">{question}</h3></div><p className="mt-3 text-sm leading-6 text-neutral-600">{answer}</p>{detail ? <p className="mt-2 text-sm font-medium leading-6 text-neutral-800">{detail}</p> : null}</div></div>
              </article>
            ))}
          </div>
        </section>

        <section className="border-y border-neutral-200 bg-white px-4 py-10 sm:px-6 lg:px-8">
          <div className="mx-auto max-w-6xl">
            <div className="mb-6 flex items-center gap-3"><div className="rounded-xl bg-blue-100 p-2 text-blue-700"><Car className="h-5 w-5" /></div><div><h2 className="text-2xl font-bold">Car rentals</h2><p className="text-sm text-neutral-600">Important details for driving and vehicle use.</p></div></div>
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">{carFaqs.map(([question, answer], index) => <article key={question} className="rounded-2xl border border-neutral-200 bg-neutral-50 p-5"><span className="text-sm font-bold text-blue-600">0{index + 1}</span><h3 className="mt-3 font-semibold">{question}</h3><p className="mt-2 text-sm leading-6 text-neutral-600">{answer}</p></article>)}</div>
          </div>
        </section>

        <section className="mx-auto max-w-4xl px-4 py-12 text-center sm:px-6"><MessageCircle className="mx-auto h-8 w-8 text-blue-600" /><h2 className="mt-3 text-2xl font-bold">Ready to rent?</h2><p className="mt-2 text-neutral-600">Browse available units or read the rental requirements before sending your request.</p><div className="mt-6 flex flex-wrap justify-center gap-3"><Link href="/guest/browse" className="inline-flex items-center gap-2 rounded-xl bg-blue-600 px-5 py-3 text-sm font-semibold text-white hover:bg-blue-700">Browse rentals <ArrowRight className="h-4 w-4" /></Link><Link href="/rental-guide" className="rounded-xl border border-neutral-300 bg-white px-5 py-3 text-sm font-semibold text-neutral-700 hover:bg-neutral-100">View rental guide</Link></div></section>
      </main>
      <Footer />
    </>
  );
}

function CameraIcon() {
  return <span className="text-sm font-bold">CAM</span>;
}
