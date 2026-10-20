// lib/didit.ts
export async function createDiditSession(userId: string) {
  const response = await fetch("https://verification.didit.me/v3/session/", {
    method: "POST",
    headers: {
      "x-api-key": process.env.DIDIT_API_KEY!,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      workflow_id: process.env.DIDIT_WORKFLOW_ID,
      callback: `${process.env.NEXT_PUBLIC_APP_URL}/renter/verification/callback`,
      vendor_data: userId, // lets you match the webhook back to this user
    }),
  });

  if (!response.ok) {
    throw new Error(`Didit session creation failed: ${response.status}`);
  }

  return response.json(); // { session_id, url, status, ... }
}