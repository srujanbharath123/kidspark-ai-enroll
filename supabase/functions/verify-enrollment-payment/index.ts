import { createClient } from "https://esm.sh/@supabase/supabase-js@2.49.1";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    const {
      razorpay_order_id,
      razorpay_payment_id,
      razorpay_signature,
      course_id,
      child_name,
      child_age,
      child_class,
      child_school,
      slot_id,
      trainer_id,
      slot_date,
      slot_start_time,
      slot_end_time,
    } = await req.json();

    if (!razorpay_order_id || !razorpay_payment_id || !razorpay_signature || !course_id || !child_name || !child_age) {
      return new Response(
        JSON.stringify({ error: "Missing required fields" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const razorpayKeySecret = Deno.env.get("RAZORPAY_KEY_SECRET");
    if (!razorpayKeySecret) {
      return new Response(
        JSON.stringify({ error: "Razorpay secret not configured" }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Verify signature
    const encoder = new TextEncoder();
    const key = await crypto.subtle.importKey(
      "raw",
      encoder.encode(razorpayKeySecret),
      { name: "HMAC", hash: "SHA-256" },
      false,
      ["sign"]
    );

    const message = `${razorpay_order_id}|${razorpay_payment_id}`;
    const signature = await crypto.subtle.sign("HMAC", key, encoder.encode(message));
    const expectedSignature = Array.from(new Uint8Array(signature))
      .map((b) => b.toString(16).padStart(2, "0"))
      .join("");

    if (expectedSignature !== razorpay_signature) {
      return new Response(
        JSON.stringify({ error: "Payment verification failed - invalid signature" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Get user from JWT
    const authHeader = req.headers.get("Authorization");
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    const anonClient = createClient(supabaseUrl, Deno.env.get("SUPABASE_PUBLISHABLE_KEY")!);
    const token = authHeader?.replace("Bearer ", "");
    const { data: { user }, error: userError } = await anonClient.auth.getUser(token);

    if (userError || !user) {
      return new Response(
        JSON.stringify({ error: "Unauthorized" }),
        { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Create or find child
    const { data: existingChild } = await supabase
      .from("children")
      .select("id")
      .eq("parent_id", user.id)
      .eq("name", child_name)
      .maybeSingle();

    let childId = existingChild?.id;

    if (!childId) {
      const { data: newChild, error: childError } = await supabase
        .from("children")
        .insert({
          parent_id: user.id,
          name: child_name,
          age: child_age,
          class: child_class || "",
          school: child_school || "",
        })
        .select("id")
        .single();

      if (childError) {
        console.error("Child creation error:", childError);
        return new Response(
          JSON.stringify({ error: "Failed to create child record" }),
          { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }
      childId = newChild.id;
    }

    // Create enrollment
    const { error: enrollError } = await supabase.from("enrollments").insert({
      parent_id: user.id,
      child_id: childId,
      course_id,
      payment_status: "completed",
      payment_id: razorpay_payment_id,
      order_id: razorpay_order_id,
    });

    if (enrollError) {
      console.error("Enrollment creation error:", enrollError);
      return new Response(
        JSON.stringify({ error: "Payment verified but enrollment creation failed" }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // If a slot was selected, create session and mark slot as booked
    if (slot_id && trainer_id && slot_date && slot_start_time && slot_end_time) {
      const { error: sessionError } = await supabase.from("sessions").insert({
        parent_id: user.id,
        trainer_id,
        child_id: childId,
        course_id,
        availability_id: slot_id,
        date: slot_date,
        start_time: slot_start_time,
        end_time: slot_end_time,
        notes: `Payment: ${razorpay_payment_id}`,
      });

      if (sessionError) {
        console.error("Session creation error:", sessionError);
        // Don't fail the whole thing — enrollment is already created
      } else {
        await supabase.from("trainer_availability").update({ is_booked: true }).eq("id", slot_id);
      }
    }

    return new Response(
      JSON.stringify({ success: true, payment_id: razorpay_payment_id }),
      { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error) {
    console.error("Error:", error);
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
