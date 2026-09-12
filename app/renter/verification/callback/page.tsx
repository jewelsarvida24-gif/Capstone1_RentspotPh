import { redirect } from "next/navigation";

export default async function VerificationCallbackPage({
  searchParams,
}: {
  searchParams: Promise<{ verificationSessionId?: string; status?: string }>;
}) {
  await searchParams;

  redirect("/renter/profile");
}