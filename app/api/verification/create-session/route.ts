// app/api/kyc/create-session/route.ts
import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase_server";
import { createDiditSession } from "@/lib/didit";

export async function POST() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const session = await createDiditSession(user.id);

  await supabase.from("tbl_kyc_submissions").insert({
    user_id: user.id,
    session_id: session.session_id,
    status: session.status, // "Not Started"
  });

  return NextResponse.json({ url: session.url });
}