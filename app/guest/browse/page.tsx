import { ListingsBrowser } from '@/components/booking/ListingsBrowser';
import Footer from '@/components/layout/footer';
import Navbar from '@/components/layout/navbar';

export default function BrowsePage() {
  return (
    <>
      <Navbar />
      <main className="min-h-screen bg-slate-50">
        <ListingsBrowser />
      </main>
      <Footer />
    </>
  );
}
