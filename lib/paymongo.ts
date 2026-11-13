export type PayMongoCheckoutInput = {
  amount: number;
  description: string;
  customerEmail?: string;
  successUrl: string;
  cancelUrl: string;
  metadata?: Record<string, string | number | boolean | null>;
  referenceNumber?: string;
};

export type PayMongoRefundReason =
  | 'duplicate'
  | 'fraudulent'
  | 'requested_by_customer'
  | 'others';

export type PayMongoRefundInput = {
  paymentId: string;
  amountCentavos: number;
  reason?: PayMongoRefundReason;
  notes?: string;
  metadata?: Record<string, string | number | boolean | null>;
};

export function getPayMongoConfig() {
  const secretKey = process.env.PAYMONGO_SECRET_KEY;
  const successUrl = process.env.PAYMONGO_SUCCESS_URL;
  const cancelUrl = process.env.PAYMONGO_CANCEL_URL;
  const webhookSecret = process.env.PAYMONGO_WEBHOOK_SECRET;

  if (!secretKey) {
    throw new Error('Missing PAYMONGO_SECRET_KEY in environment variables.');
  }

  return {
    secretKey,
    successUrl: successUrl ?? '',
    cancelUrl: cancelUrl ?? '',
    webhookSecret: webhookSecret ?? null,
  };
}

export function extractPayMongoPaymentIdFromSession(sessionResource: any): string | null {
  const attrs = sessionResource?.attributes ?? sessionResource?.data?.attributes ?? {};
  const payments: any[] = Array.isArray(attrs?.payments) ? attrs.payments : [];

  const paidPayment = payments.find(
    (p) => typeof p?.id === 'string' && p.id.startsWith('pay_') && p?.attributes?.status === 'paid'
  );
  if (paidPayment?.id) return paidPayment.id;

  const anyPayment = payments.find((p) => typeof p?.id === 'string' && p.id.startsWith('pay_'));
  if (anyPayment?.id) return anyPayment.id;

  const intentPayments: any[] = Array.isArray(attrs?.payment_intent?.attributes?.payments)
    ? attrs.payment_intent.attributes.payments
    : [];
  const intentPaid = intentPayments.find(
    (p) => typeof p?.id === 'string' && p.id.startsWith('pay_')
  );
  if (intentPaid?.id) return intentPaid.id;

  return null;
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

  if (!successUrl) {
    throw new Error('Missing PAYMONGO_SUCCESS_URL in environment variables.');
  }
  if (!cancelUrl) {
    throw new Error('Missing PAYMONGO_CANCEL_URL in environment variables.');
  }

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

export async function retrievePayMongoCheckoutSession(sessionId: string) {
  const { secretKey } = getPayMongoConfig();

  const response = await fetch(
    `https://api.paymongo.com/v1/checkout_sessions/${encodeURIComponent(sessionId)}`,
    {
      headers: {
        Authorization: `Basic ${Buffer.from(`${secretKey}:`).toString('base64')}`,
        Accept: 'application/json',
      },
      cache: 'no-store',
    }
  );

  const text = await response.text();
  if (!response.ok) {
    throw new Error(`PayMongo retrieve failed (${response.status}): ${text}`);
  }

  const data = JSON.parse(text);
  const attrs = data?.data?.attributes;
  const payments: any[] = Array.isArray(attrs?.payments) ? attrs.payments : [];

  const isPaid =
    payments.some((p) => p?.attributes?.status === 'paid') ||
    attrs?.payment_intent?.attributes?.status === 'succeeded';

  const paymentId = extractPayMongoPaymentIdFromSession(data);

  return { isPaid, paymentId, raw: data };
}

export async function resolvePayMongoPaymentId(params: {
  providerPaymentId?: string | null;
  providerReference?: string | null;
}): Promise<string> {
  const storedPaymentId = (params.providerPaymentId ?? '').trim();
  if (storedPaymentId.startsWith('pay_')) {
    return storedPaymentId;
  }

  const reference = (params.providerReference ?? '').trim();
  if (reference.startsWith('pay_')) {
    return reference;
  }

  if (!reference.startsWith('cs_')) {
    throw new Error(
      'No valid PayMongo checkout session (cs_...) or payment ID (pay_...) is recorded for this payment.'
    );
  }

  const session = await retrievePayMongoCheckoutSession(reference);
  if (!session.paymentId) {
    throw new Error(
      `PayMongo checkout session ${reference} does not have an associated paid payment ID (pay_...).`
    );
  }

  return session.paymentId;
}

export async function createPayMongoRefund({
  paymentId,
  amountCentavos,
  reason = 'requested_by_customer',
  notes,
  metadata,
}: PayMongoRefundInput) {
  const { secretKey } = getPayMongoConfig();

  if (!paymentId.startsWith('pay_')) {
    throw new Error(`Invalid PayMongo payment_id "${paymentId}". Expected a pay_ identifier.`);
  }
  if (!Number.isInteger(amountCentavos) || amountCentavos <= 0) {
    throw new Error(`Invalid refund amount in centavos: ${amountCentavos}`);
  }

  const payload = {
    data: {
      attributes: {
        amount: amountCentavos,
        payment_id: paymentId,
        reason,
        notes: notes ? notes.slice(0, 255) : undefined,
        metadata,
      },
    },
  };

  const response = await fetch('https://api.paymongo.com/v1/refunds', {
    method: 'POST',
    headers: {
      Authorization: `Basic ${Buffer.from(`${secretKey}:`).toString('base64')}`,
      'Content-Type': 'application/json',
      Accept: 'application/json',
    },
    body: JSON.stringify(payload),
    cache: 'no-store',
  });

  const text = await response.text();
  let parsed: any = null;
  try {
    parsed = JSON.parse(text);
  } catch {
    // non-JSON response
  }

  if (!response.ok) {
    const apiDetail =
      parsed?.errors?.[0]?.detail ||
      parsed?.errors?.[0]?.code ||
      text ||
      `HTTP ${response.status}`;
    throw new Error(`PayMongo refund failed (${response.status}): ${apiDetail}`);
  }

  const refundData = parsed?.data;
  const refundId: string | null = refundData?.id ?? null;
  const status: string = refundData?.attributes?.status ?? 'pending';

  return {
    id: refundId,
    status,
    amountCentavos: refundData?.attributes?.amount ?? amountCentavos,
    raw: parsed,
  };
}

export async function retrievePayMongoRefund(refundId: string) {
  const { secretKey } = getPayMongoConfig();

  const response = await fetch(
    `https://api.paymongo.com/v1/refunds/${encodeURIComponent(refundId)}`,
    {
      headers: {
        Authorization: `Basic ${Buffer.from(`${secretKey}:`).toString('base64')}`,
        Accept: 'application/json',
      },
      cache: 'no-store',
    }
  );

  const text = await response.text();
  if (!response.ok) {
    throw new Error(`PayMongo refund retrieve failed (${response.status}): ${text}`);
  }

  const data = JSON.parse(text);
  const attrs = data?.data?.attributes ?? {};

  return {
    id: data?.data?.id ?? refundId,
    status: (attrs.status ?? 'pending') as string,
    amountCentavos: attrs.amount ?? null,
    raw: data,
  };
}