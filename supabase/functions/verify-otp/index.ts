import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const DUMMY_PHONES = ["+919999999999", "+917995670899"];
const DUMMY_CODE = "123456";

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    const { phone, code, full_name, role } = await req.json();
    if (!phone || !/^\+\d{10,15}$/.test(phone)) {
      throw new Error("Valid phone number required");
    }
    if (!code || typeof code !== "string" || code.length !== 6) {
      throw new Error("6-digit OTP code required");
    }

    const supabaseAdmin = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
      { auth: { autoRefreshToken: false, persistSession: false } }
    );

    // For dummy phone, accept dummy code directly
    if (DUMMY_PHONES.includes(phone) && code === DUMMY_CODE) {
      // proceed to auth
    } else {
      // Verify OTP from database
      const { data: otpRecord, error: otpErr } = await supabaseAdmin
        .from("otp_codes")
        .select("*")
        .eq("phone", phone)
        .eq("code", code)
        .eq("verified", false)
        .gte("expires_at", new Date().toISOString())
        .order("created_at", { ascending: false })
        .limit(1)
        .single();

      if (otpErr || !otpRecord) {
        throw new Error("Invalid or expired OTP");
      }

      // Mark as verified
      await supabaseAdmin
        .from("otp_codes")
        .update({ verified: true })
        .eq("id", otpRecord.id);
    }

    // Check if user exists by phone (look in profiles)
    const { data: existingProfile } = await supabaseAdmin
      .from("profiles")
      .select("user_id")
      .eq("phone", phone)
      .limit(1)
      .single();

    let userId: string;

    if (existingProfile) {
      userId = existingProfile.user_id;
    } else {
      // Create new user with phone as email placeholder
      const email = `${phone.replace("+", "")}@phone.techwindows.local`;
      const password = crypto.randomUUID();
      const userRole = role || "parent";
      const userName = full_name || "User";

      const { data: newUser, error: createErr } = await supabaseAdmin.auth.admin.createUser({
        email,
        password,
        email_confirm: true,
        phone,
        phone_confirm: true,
        user_metadata: { full_name: userName, role: userRole, phone },
      });

      if (createErr) throw new Error("Failed to create user: " + createErr.message);
      userId = newUser.user.id;

      // Update profile with phone
      await supabaseAdmin
        .from("profiles")
        .update({ phone })
        .eq("user_id", userId);
    }

    // Generate session token using admin
    const { data: session, error: sessionErr } = await supabaseAdmin.auth.admin.generateLink({
      type: "magiclink",
      email: `${phone.replace("+", "")}@phone.techwindows.local`,
    });

    // Use a different approach - sign in with password
    // Actually, let's generate a custom token approach
    // We'll use signInWithPassword with known credentials - but we used random password
    // Better: use admin to create a session directly

    // Get the user and create a session
    const { data: tokenData, error: tokenErr } = await supabaseAdmin.auth.admin.generateLink({
      type: "magiclink",
      email: `${phone.replace("+", "")}@phone.techwindows.local`,
    });

    if (tokenErr) throw new Error("Failed to generate session: " + tokenErr.message);

    // Extract the token hash and return it for client-side verification
    const tokenHash = tokenData?.properties?.hashed_token;
    const redirectUrl = tokenData?.properties?.action_link;

    return new Response(
      JSON.stringify({
        success: true,
        user_id: userId,
        token_hash: tokenHash,
        redirect_url: redirectUrl,
        is_new_user: !existingProfile,
      }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (err: any) {
    return new Response(
      JSON.stringify({ error: err.message }),
      { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
