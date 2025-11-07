import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { verifySession } from "@/app/_helper/session";

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL;
const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY) {
  // We don't throw here to avoid breaking builds; requests will be rejected at runtime.
  console.warn("Supabase admin client not fully configured (missing env vars)");
}

const supabaseAdmin = createClient(SUPABASE_URL ?? "", SUPABASE_SERVICE_ROLE_KEY ?? "");

export const POST = async (req: NextRequest) => {
  try {
    const userId = await verifySession();
    if (!userId) {
      return NextResponse.json({ error: "ログインしてください" }, { status: 401 });
    }

    const body = await req.json();
    const { bucket, paths } = body as { bucket?: string; paths?: string[] };

    if (!bucket || !paths || !Array.isArray(paths) || paths.length === 0) {
      return NextResponse.json({ error: "bucket と paths を指定してください" }, { status: 400 });
    }

    const { error, data } = await supabaseAdmin.storage.from(bucket).remove(paths);
    if (error) {
      console.error("supabase remove error:", error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ success: true, data }, { status: 200 });
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    return NextResponse.json({ error: `サーバーエラー: ${msg}` }, { status: 500 });
  }
};
