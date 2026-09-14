import { NextResponse } from 'next/server';
import { createPayMongoCheckoutSession } from '@/lib/paymongo';

export async function POST(request: Request) {
  const body = await request.json().catch(() => ({}));
  const amount = Number(body.amount ?? 0);
  const description = String(body.description ?? 'Rental payment').trim();
  const customerEmail = String(body.customer_email ?? '').trim();
  const bookingId = String(body.booking_id ?? '').trim();

  if (!bookingId) {
    return NextResponse.json({ error: 'booking_id is required.' }, { status: 400 });
  }

  if (!Number.isFinite(amount) || amount <= 0) {
    return NextResponse.json({ error: 'Valid amount is required.' }, { status: 400 });
  }

  const appBaseUrl = process.env.NEXT_PUBLIC_APP_URL ?? 'http://localhost:3000';

  try {
    const checkout = await createPayMongoCheckoutSession({
      amount: Math.round(amount * 100),
      description,
      customerEmail: customerEmail || undefined,
      successUrl: `${appBaseUrl}/renter/booking?booking_id=${bookingId}&status=success`,
      cancelUrl: `${appBaseUrl}/renter/booking?booking_id=${bookingId}&status=cancelled`,
      metadata: {
        booking_id: bookingId,
      },
      referenceNumber: bookingId,
    });

    return NextResponse.json({
      checkout_id: checkout.id,
      checkout_url: checkout.checkout_url,
      status: checkout.status,
    });
  } catch (error) {
    return NextResponse.json(
      {
        error:
          error instanceof Error ? error.message : 'Unable to create PayMongo checkout session.',
      },
      { status: 500 }
    );
  }
}
