export type PayMongoCheckoutInput = {
  amount: number;
  description: string;
  customerEmail?: string;
  successUrl: string;
  cancelUrl: string;
  metadata?: Record<string, string | number | boolean | null>;
  referenceNumber?: string;
};

export function getPayMongoConfig() {
  const secretKey = process.env.PAYMONGO_SECRET_KEY;
  const successUrl = process.env.PAYMONGO_SUCCESS_URL;
  const cancelUrl = process.env.PAYMONGO_CANCEL_URL;
  const webhookSecret = process.env.PAYMONGO_WEBHOOK_SECRET;

  if (!secretKey) {
    throw new Error('Missing PAYMONGO_SECRET_KEY in environment variables.');
  }

  if (!successUrl) {
    throw new Error('Missing PAYMONGO_SUCCESS_URL in environment variables.');
  }

  if (!cancelUrl) {
    throw new Error('Missing PAYMONGO_CANCEL_URL in environment variables.');
  }

  return { secretKey, successUrl, cancelUrl, webhookSecret: webhookSecret ?? null };
}

export async function createPayMongoCheckoutSession({
  amount,
  description,
  customerEmail,
  successUrl,
  cancelUrl,
  metadata,
  referenceNumber,
}: PayMongoCheckoutInput) {
  const { secretKey } = getPayMongoConfig();

  const payload = {
    data: {
      attributes: {
        amount,
        description,
        payment_method_types: ['card', 'paymaya', 'gcash'],
        line_items: [
          {
            currency: 'PHP',
            amount,
            description,
            quantity: 1,
          },
        ],
        success_url: successUrl,
        cancel_url: cancelUrl,
        reference_number: referenceNumber ?? undefined,
        customer_email: customerEmail ?? undefined,
        metadata,
      },
    },
  };

  const response = await fetch('https://api.paymongo.com/v1/checkout_sessions', {
    method: 'POST',
    headers: {
      Authorization: `Basic ${Buffer.from(`${secretKey}:`).toString('base64')}`,
      'Content-Type': 'application/json',
      Accept: 'application/json',
    },
    body: JSON.stringify(payload),
  });

  const responseText = await response.text();

  if (!response.ok) {
    throw new Error(
      `PayMongo checkout session creation failed (${response.status}): ${responseText}`
    );
  }

  const data = JSON.parse(responseText);

  return {
    id: data?.data?.id ?? null,
    checkout_url: data?.data?.attributes?.checkout_url ?? null,
    status: data?.data?.attributes?.status ?? 'pending',
    raw: data,
  };
}
