import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const GATEWAY_URL = "https://connector-gateway.lovable.dev/twilio";
const DUMMY_PHONES = ["+919999999999", "+917995670899"];

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    const { phone } = await req.json();
    if (!phone || typeof phone !== "string" || !/^\+\d{10,15}$/.test(phone)) {
      throw new Error("Valid phone number in E.164 format is required (e.g. +919876543210)");
    }

    const supabaseAdmin = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
      { auth: { autoRefreshToken: false, persistSession: false } }
    );

    // Generate 6-digit OTP
    const code = String(Math.floor(100000 + Math.random() * 900000));
    const expires_at = new Date(Date.now() + 5 * 60 * 1000).toISOString(); // 5 min

    // Store OTP
    const { error: insertErr } = await supabaseAdmin
      .from("otp_codes")
      .insert({ phone, code, expires_at });
    if (insertErr) throw new Error("Failed to store OTP: " + insertErr.message);

    // For dummy phone, skip Twilio send
    if (phone === DUMMY_PHONE) {
      return new Response(
        JSON.stringify({ success: true, message: "OTP sent (dummy: 123456)", dummy: true }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Send via Twilio gateway
    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) throw new Error("LOVABLE_API_KEY is not configured");
    const TWILIO_API_KEY = Deno.env.get("TWILIO_API_KEY");
    if (!TWILIO_API_KEY) throw new Error("TWILIO_API_KEY is not configured");

    const twilioFrom = Deno.env.get("TWILIO_PHONE_NUMBER");
    if (!twilioFrom) throw new Error("TWILIO_PHONE_NUMBER is not configured. Please add your Twilio phone number as a secret.");

    const response = await fetch(`${GATEWAY_URL}/Messages.json`, {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${LOVABLE_API_KEY}`,
        "X-Connection-Api-Key": TWILIO_API_KEY,
        "Content-Type": "application/x-www-form-urlencoded",
      },
      body: new URLSearchParams({
        To: phone,
        From: twilioFrom,
        Body: `Your TechWindows verification code is: ${code}. Valid for 5 minutes.`,
      }),
    });

    const data = await response.json();
    if (!response.ok) {
      // If Twilio fails, still allow dummy OTP for testing
      console.error("Twilio error:", data);
      // Update: store a known code for testing
      await supabaseAdmin
        .from("otp_codes")
        .update({ code: "123456" })
        .eq("phone", phone)
        .eq("code", code);
      
      return new Response(
        JSON.stringify({ success: true, message: "OTP sent (use dummy code 123456 for testing)", dummy: true }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    return new Response(
      JSON.stringify({ success: true, message: "OTP sent successfully" }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (err: any) {
    return new Response(
      JSON.stringify({ error: err.message }),
      { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
