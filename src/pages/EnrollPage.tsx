import { useEffect, useState } from "react";
import { useSearchParams, useNavigate, Link } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import {
  Check, CreditCard, Loader2, ArrowLeft, ArrowRight,
  Sparkles, GraduationCap, User, Calendar, Clock, Mail, ShieldCheck,
} from "lucide-react";

interface Course {
  id: string;
  title: string;
  description: string;
  price: number;
  discount_price: number | null;
  duration: string;
  features: string[] | null;
  image_url: string | null;
}

interface AvailableSlot {
  id: string;
  date: string;
  start_time: string;
  end_time: string;
  trainer_id: string;
  trainer_name: string;
}

const STEPS = ["Course", "Details", "Slot", "Account", "Pay"];

const EnrollPage = () => {
  const { user, profile, sendOtp, verifyOtp } = useAuth();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { toast } = useToast();

  const [step, setStep] = useState(0);
  const [courses, setCourses] = useState<Course[]>([]);
  const [selectedCourse, setSelectedCourse] = useState<Course | null>(null);

  // Student details
  const [childName, setChildName] = useState("");
  const [childAge, setChildAge] = useState("");
  const [childClass, setChildClass] = useState("");
  const [childSchool, setChildSchool] = useState("");

  // Parent info
  const [parentName, setParentName] = useState("");
  const [parentPhone, setParentPhone] = useState("");

  // Slot booking
  const [availableSlots, setAvailableSlots] = useState<AvailableSlot[]>([]);
  const [selectedSlot, setSelectedSlot] = useState<AvailableSlot | null>(null);
  const [slotsLoading, setSlotsLoading] = useState(false);

  // Auth (step 3) - Phone OTP
  const [authPhone, setAuthPhone] = useState("");
  const [authOtp, setAuthOtp] = useState("");
  const [authOtpSent, setAuthOtpSent] = useState(false);
  const [authIsDummy, setAuthIsDummy] = useState(false);
  const [authLoading, setAuthLoading] = useState(false);

  // Payment
  const [paying, setPaying] = useState(false);
  const [paymentDone, setPaymentDone] = useState(false);

  const [loading, setLoading] = useState(false);

  // Fetch courses
  useEffect(() => {
    const fetchCourses = async () => {
      setLoading(true);
      const { data } = await supabase
        .from("courses")
        .select("id, title, description, price, discount_price, duration, features, image_url")
        .eq("is_active", true)
        .order("created_at");
      if (data) {
        setCourses(data);
        const preselect = searchParams.get("course");
        if (preselect) {
          const found = data.find((c) => c.id === preselect);
          if (found) { setSelectedCourse(found); setStep(1); }
        }
      }
      setLoading(false);
    };
    fetchCourses();
  }, [searchParams]);

  // Fetch slots when reaching step 2
  useEffect(() => {
    if (step === 2) fetchSlots();
  }, [step]);

  // If already logged in, skip auth step
  useEffect(() => {
    if (user && profile) {
      if (!parentName) setParentName(profile.full_name || "");
      if (!parentPhone && profile.phone) setParentPhone(profile.phone);
    }
  }, [user, profile]);

  const fetchSlots = async () => {
    setSlotsLoading(true);
    const { data: availData } = await supabase
      .from("trainer_availability")
      .select("id, date, start_time, end_time, trainer_id")
      .eq("is_booked", false)
      .gte("date", new Date().toISOString().split("T")[0])
      .order("date");

    if (availData && availData.length > 0) {
      const trainerIds = [...new Set(availData.map((s) => s.trainer_id))];
      const { data: profiles } = await supabase
        .from("profiles")
        .select("user_id, full_name")
        .in("user_id", trainerIds);
      const profileMap = new Map(profiles?.map((p) => [p.user_id, p.full_name]) || []);
      setAvailableSlots(availData.map((s) => ({ ...s, trainer_name: profileMap.get(s.trainer_id) || "Trainer" })));
    } else {
      setAvailableSlots([]);
    }
    setSlotsLoading(false);
  };

  const effectivePrice = selectedCourse ? selectedCourse.discount_price ?? selectedCourse.price : 0;

  const canProceedStep2 =
    childName.trim().length >= 2 &&
    Number(childAge) >= 4 && Number(childAge) <= 18 &&
    childClass.trim().length >= 1 &&
    childSchool.trim().length >= 2 &&
    parentName.trim().length >= 2 &&
    parentPhone.trim().replace(/\D/g, "").length >= 10;

  // After slot step, decide: if logged in skip to pay, else go to auth
  const handleAfterSlot = () => {
    if (user) {
      setStep(4); // skip auth, go to pay
    } else {
      setStep(3); // go to auth
    }
  };

  const handleSendAuthOtp = async () => {
    const formattedPhone = authPhone.startsWith("+") ? authPhone : `+91${authPhone}`;
    if (!/^\+\d{10,15}$/.test(formattedPhone)) {
      toast({ title: "Invalid phone", description: "Enter a valid phone number with country code", variant: "destructive" });
      return;
    }
    setAuthLoading(true);
    try {
      const result = await sendOtp(formattedPhone);
      setAuthIsDummy(!!result.dummy);
      setAuthOtpSent(true);
      toast({ title: "OTP Sent! 📱", description: result.dummy ? "Use dummy code: 123456" : "Check your phone" });
    } catch (error: any) {
      toast({ title: "Failed to send OTP", description: error.message, variant: "destructive" });
    } finally {
      setAuthLoading(false);
    }
  };

  const handleVerifyAuthOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    if (authOtp.length !== 6) {
      toast({ title: "Invalid OTP", description: "Enter the 6-digit code", variant: "destructive" });
      return;
    }
    const formattedPhone = authPhone.startsWith("+") ? authPhone : `+91${authPhone}`;
    setAuthLoading(true);
    try {
      await verifyOtp(formattedPhone, authOtp, parentName, "parent");
      toast({ title: "Verified! 🎉" });
      // Update phone on profile
      const { data: { session } } = await supabase.auth.getSession();
      if (session?.user && parentPhone) {
        await supabase.from("profiles").update({ phone: parentPhone.trim() }).eq("user_id", session.user.id);
      }
      setStep(4);
    } catch (error: any) {
      toast({ title: "Verification failed", description: error.message, variant: "destructive" });
    } finally {
      setAuthLoading(false);
    }
  };

  const handleDummyPayment = async () => {
    const { data: { session } } = await supabase.auth.getSession();
    if (!session?.user) {
      toast({ title: "Not authenticated", description: "Please login first.", variant: "destructive" });
      setStep(3);
      return;
    }
    if (!selectedCourse) return;

    setPaying(true);
    try {
      // Create child record
      const { data: existingChild } = await supabase
        .from("children")
        .select("id")
        .eq("parent_id", session.user.id)
        .eq("name", childName.trim())
        .maybeSingle();

      let childId = existingChild?.id;
      if (!childId) {
        const { data: newChild, error: childErr } = await supabase
          .from("children")
          .insert({
            parent_id: session.user.id,
            name: childName.trim(),
            age: Number(childAge),
            class: childClass.trim(),
            school: childSchool.trim(),
          })
          .select("id")
          .single();
        if (childErr) throw childErr;
        childId = newChild.id;
      }

      // Create enrollment
      const { error: enrollErr } = await supabase
        .from("enrollments")
        .insert({
          parent_id: session.user.id,
          child_id: childId,
          course_id: selectedCourse.id,
          payment_status: "completed",
          payment_id: `DEMO_${Date.now()}`,
          order_id: `DEMO_ORDER_${Date.now()}`,
        });
      if (enrollErr) throw enrollErr;

      // Book slot if selected
      if (selectedSlot) {
        await supabase.from("sessions").insert({
          parent_id: session.user.id,
          trainer_id: selectedSlot.trainer_id,
          child_id: childId,
          course_id: selectedCourse.id,
          availability_id: selectedSlot.id,
          date: selectedSlot.date,
          start_time: selectedSlot.start_time,
          end_time: selectedSlot.end_time,
          status: "pending",
        });
        await supabase
          .from("trainer_availability")
          .update({ is_booked: true })
          .eq("id", selectedSlot.id);
      }

      setPaymentDone(true);
      toast({ title: "Enrollment successful! 🎉", description: `${childName} is enrolled in ${selectedCourse.title}.` });

      setTimeout(() => navigate("/dashboard"), 2000);
    } catch (err: any) {
      toast({ title: "Enrollment failed", description: err.message, variant: "destructive" });
    } finally {
      setPaying(false);
    }
  };

  const slotsByDate = availableSlots.reduce<Record<string, AvailableSlot[]>>((acc, slot) => {
    if (!acc[slot.date]) acc[slot.date] = [];
    acc[slot.date].push(slot);
    return acc;
  }, {});

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-primary/5 to-secondary/5">
      {/* Header */}
      <div className="border-b border-border/50 bg-card/80 backdrop-blur-sm sticky top-0 z-10">
        <div className="max-w-4xl mx-auto px-4 py-4 flex items-center justify-between">
          <Link to="/" className="flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors">
            <ArrowLeft className="w-4 h-4" /> Back to Home
          </Link>
          <h1 className="text-lg font-bold font-display flex items-center gap-2">
            <GraduationCap className="w-5 h-5 text-primary" /> Enroll Now
          </h1>
          <div className="w-20" />
        </div>
      </div>

      {/* Stepper */}
      <div className="max-w-4xl mx-auto px-4 pt-8 pb-4">
        <div className="flex items-center justify-center gap-1 sm:gap-2 mb-8">
          {STEPS.map((label, i) => {
            // If logged in, show step 3 as completed automatically
            const isCompleted = i < step || (i === 3 && !!user && step >= 3);
            const isCurrent = i === step && !(i === 3 && !!user && step > 3);
            return (
              <div key={label} className="flex items-center gap-1 sm:gap-2">
                <div className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold transition-all ${
                  isCompleted ? "bg-primary text-primary-foreground"
                    : isCurrent ? "bg-primary text-primary-foreground shadow-lg shadow-primary/30"
                    : "bg-muted text-muted-foreground"
                }`}>
                  {isCompleted ? <Check className="w-4 h-4" /> : i + 1}
                </div>
                <span className={`text-xs font-medium hidden sm:block ${isCurrent ? "text-foreground" : "text-muted-foreground"}`}>{label}</span>
                {i < STEPS.length - 1 && <div className="w-6 sm:w-12 h-px bg-border" />}
              </div>
            );
          })}
        </div>
      </div>

      <div className="max-w-4xl mx-auto px-4 pb-16">

        {/* Step 0: Select Course */}
        {step === 0 && (
          <div>
            <h2 className="text-2xl font-bold font-display mb-2 text-center">Choose a Course</h2>
            <p className="text-sm text-muted-foreground text-center mb-8">Pick the perfect AI bootcamp for your child</p>
            {loading ? (
              <div className="flex justify-center py-16"><Loader2 className="w-8 h-8 animate-spin text-primary" /></div>
            ) : courses.length === 0 ? (
              <div className="bg-card rounded-2xl border border-border/50 p-12 text-center shadow-card">
                <p className="text-muted-foreground">No courses available right now.</p>
              </div>
            ) : (
              <div className="grid sm:grid-cols-2 gap-4">
                {courses.map((course) => {
                  const price = course.discount_price ?? course.price;
                  const isSelected = selectedCourse?.id === course.id;
                  return (
                    <button key={course.id} onClick={() => setSelectedCourse(course)}
                      className={`text-left bg-card rounded-2xl border-2 p-6 shadow-card transition-all hover:shadow-elevated ${
                        isSelected ? "border-primary ring-2 ring-primary/20" : "border-border/50 hover:border-primary/30"
                      }`}>
                      <div className="flex items-start justify-between mb-3">
                        <h3 className="font-bold font-display text-lg">{course.title}</h3>
                        {isSelected && <div className="w-6 h-6 rounded-full bg-primary flex items-center justify-center"><Check className="w-3.5 h-3.5 text-primary-foreground" /></div>}
                      </div>
                      <p className="text-sm text-muted-foreground mb-3 line-clamp-2">{course.description}</p>
                      <div className="flex items-center gap-3">
                        <span className="text-xl font-bold text-primary">₹{price}</span>
                        {course.discount_price && <span className="text-sm text-muted-foreground line-through">₹{course.price}</span>}
                        <Badge variant="outline" className="ml-auto text-xs">{course.duration}</Badge>
                      </div>
                      {course.features && course.features.length > 0 && (
                        <div className="mt-3 flex flex-wrap gap-1.5">
                          {course.features.slice(0, 3).map((f, i) => (
                            <Badge key={i} variant="secondary" className="text-xs font-normal">{f}</Badge>
                          ))}
                        </div>
                      )}
                    </button>
                  );
                })}
              </div>
            )}
            <div className="flex justify-end mt-8">
              <Button variant="hero" onClick={() => setStep(1)} disabled={!selectedCourse} className="px-8">
                Next <ArrowRight className="w-4 h-4 ml-1" />
              </Button>
            </div>
          </div>
        )}

        {/* Step 1: Student & Parent Details */}
        {step === 1 && (
          <div className="max-w-md mx-auto">
            <h2 className="text-2xl font-bold font-display mb-2 text-center">Student & Parent Details</h2>
            <p className="text-sm text-muted-foreground text-center mb-8">Fill in complete information</p>
            <div className="bg-card rounded-2xl border border-border/50 p-8 shadow-card space-y-5">
              <div className="w-16 h-16 mx-auto rounded-2xl bg-primary/10 flex items-center justify-center mb-2">
                <User className="w-8 h-8 text-primary" />
              </div>
              <h3 className="text-sm font-bold text-muted-foreground uppercase tracking-wider">Student Info</h3>
              <div>
                <Label htmlFor="childName" className="text-sm font-semibold">Student Full Name *</Label>
                <Input id="childName" value={childName} onChange={(e) => setChildName(e.target.value)}
                  placeholder="e.g. Aarav Sharma" className="mt-1.5 rounded-xl" maxLength={100} />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="childAge" className="text-sm font-semibold">Age *</Label>
                  <Input id="childAge" type="number" min={4} max={18} value={childAge}
                    onChange={(e) => setChildAge(e.target.value)} placeholder="e.g. 10" className="mt-1.5 rounded-xl" />
                </div>
                <div>
                  <Label htmlFor="childClass" className="text-sm font-semibold">Class / Grade *</Label>
                  <Input id="childClass" value={childClass} onChange={(e) => setChildClass(e.target.value)}
                    placeholder="e.g. 5th" className="mt-1.5 rounded-xl" maxLength={20} />
                </div>
              </div>
              <div>
                <Label htmlFor="childSchool" className="text-sm font-semibold">School Name *</Label>
                <Input id="childSchool" value={childSchool} onChange={(e) => setChildSchool(e.target.value)}
                  placeholder="e.g. Delhi Public School" className="mt-1.5 rounded-xl" maxLength={150} />
              </div>
              <div className="border-t border-border/50 pt-5">
                <h3 className="text-sm font-bold text-muted-foreground uppercase tracking-wider mb-4">Parent Info</h3>
                <div className="space-y-4">
                  <div>
                    <Label htmlFor="parentName" className="text-sm font-semibold">Parent Full Name *</Label>
                    <Input id="parentName" value={parentName} onChange={(e) => setParentName(e.target.value)}
                      placeholder="e.g. Rajesh Sharma" className="mt-1.5 rounded-xl" maxLength={100} disabled={!!user} />
                  </div>
                  <div>
                    <Label htmlFor="parentPhone" className="text-sm font-semibold">Phone Number *</Label>
                    <Input id="parentPhone" value={parentPhone} onChange={(e) => setParentPhone(e.target.value)}
                      placeholder="e.g. 9876543210" className="mt-1.5 rounded-xl" maxLength={15}
                      disabled={!!user && !!profile?.phone} />
                  </div>
                </div>
              </div>
            </div>
            <div className="flex justify-between mt-8">
              <Button variant="outline" onClick={() => setStep(0)}><ArrowLeft className="w-4 h-4 mr-1" /> Back</Button>
              <Button variant="hero" onClick={() => setStep(2)} disabled={!canProceedStep2} className="px-8">
                Book a Slot <ArrowRight className="w-4 h-4 ml-1" />
              </Button>
            </div>
          </div>
        )}

        {/* Step 2: Book Slot */}
        {step === 2 && (
          <div className="max-w-lg mx-auto">
            <h2 className="text-2xl font-bold font-display mb-2 text-center">Book a Time Slot</h2>
            <p className="text-sm text-muted-foreground text-center mb-8">Choose when your child will attend the first session</p>
            {slotsLoading ? (
              <div className="flex justify-center py-16"><Loader2 className="w-8 h-8 animate-spin text-primary" /></div>
            ) : availableSlots.length === 0 ? (
              <div className="bg-card rounded-2xl border border-border/50 p-8 text-center shadow-card">
                <Calendar className="w-10 h-10 text-muted-foreground mx-auto mb-3" />
                <p className="text-muted-foreground mb-2">No slots available right now.</p>
                <p className="text-xs text-muted-foreground">You can skip and book later from your dashboard.</p>
              </div>
            ) : (
              <div className="space-y-6">
                {Object.entries(slotsByDate).map(([date, slots]) => (
                  <div key={date}>
                    <h3 className="text-sm font-bold mb-2 flex items-center gap-2">
                      <Calendar className="w-4 h-4 text-primary" />
                      {new Date(date + "T00:00:00").toLocaleDateString("en-IN", { weekday: "long", year: "numeric", month: "long", day: "numeric" })}
                    </h3>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                      {slots.map((slot) => {
                        const isSelected = selectedSlot?.id === slot.id;
                        return (
                          <button key={slot.id} onClick={() => setSelectedSlot(isSelected ? null : slot)}
                            className={`bg-card rounded-xl border-2 p-4 text-left transition-all ${
                              isSelected ? "border-primary ring-2 ring-primary/20" : "border-border/50 hover:border-primary/30"
                            }`}>
                            <div className="flex items-center justify-between">
                              <div>
                                <p className="text-sm font-semibold flex items-center gap-1.5">
                                  <Clock className="w-3.5 h-3.5 text-muted-foreground" />
                                  {slot.start_time} – {slot.end_time}
                                </p>
                                <p className="text-xs text-muted-foreground mt-0.5">with {slot.trainer_name}</p>
                              </div>
                              {isSelected && <div className="w-6 h-6 rounded-full bg-primary flex items-center justify-center"><Check className="w-3.5 h-3.5 text-primary-foreground" /></div>}
                            </div>
                          </button>
                        );
                      })}
                    </div>
                  </div>
                ))}
              </div>
            )}
            <div className="flex justify-between mt-8">
              <Button variant="outline" onClick={() => setStep(1)}><ArrowLeft className="w-4 h-4 mr-1" /> Back</Button>
              <Button variant="hero" onClick={handleAfterSlot} className="px-8">
                {selectedSlot ? "Continue" : "Skip Slot"} <ArrowRight className="w-4 h-4 ml-1" />
              </Button>
            </div>
          </div>
        )}

        {/* Step 3: Phone OTP Auth */}
        {step === 3 && (
          <div className="max-w-md mx-auto">
            <h2 className="text-2xl font-bold font-display mb-2 text-center">
              {authOtpSent ? "Enter Verification Code" : "Verify Your Phone"}
            </h2>
            <p className="text-sm text-muted-foreground text-center mb-8">
              {authOtpSent ? "Enter the OTP sent to your phone" : "We'll send a verification code to your mobile"}
            </p>

            <div className="bg-card rounded-2xl border border-border/50 p-8 shadow-card">
              <div className="w-16 h-16 mx-auto rounded-2xl bg-primary/10 flex items-center justify-center mb-6">
                <ShieldCheck className="w-8 h-8 text-primary" />
              </div>

              {!authOtpSent ? (
                <div className="space-y-4">
                  <div>
                    <Label htmlFor="authPhone">Mobile Number</Label>
                    <Input
                      id="authPhone"
                      type="tel"
                      value={authPhone}
                      onChange={(e) => setAuthPhone(e.target.value.replace(/[^\d+]/g, ""))}
                      placeholder="+919876543210"
                      required
                      className="mt-1.5 rounded-xl h-11"
                    />
                    <p className="text-xs text-muted-foreground mt-1">Dummy: +919999999999</p>
                  </div>
                  <Button variant="hero" size="lg" className="w-full" onClick={handleSendAuthOtp} disabled={authLoading}>
                    {authLoading ? <><Loader2 className="w-4 h-4 animate-spin" /> Sending...</> : "Send OTP"}
                  </Button>
                </div>
              ) : (
                <form onSubmit={handleVerifyAuthOtp} className="space-y-4">
                  <div>
                    <Label>Verification Code</Label>
                    <Input
                      type="text"
                      maxLength={6}
                      value={authOtp}
                      onChange={(e) => setAuthOtp(e.target.value.replace(/\D/g, ""))}
                      placeholder="Enter 6-digit OTP"
                      className="mt-1.5 rounded-xl h-11 text-center text-lg tracking-widest"
                    />
                    {authIsDummy && (
                      <p className="text-xs text-center text-primary mt-2 font-medium">Dummy OTP: 123456</p>
                    )}
                  </div>
                  <Button variant="hero" size="lg" className="w-full" type="submit" disabled={authLoading}>
                    {authLoading ? <><Loader2 className="w-4 h-4 animate-spin" /> Verifying...</> : "Verify & Continue"}
                  </Button>
                  <button type="button" onClick={() => { setAuthOtpSent(false); setAuthOtp(""); }}
                    className="w-full text-sm text-muted-foreground hover:text-foreground transition-colors">
                    Change phone number
                  </button>
                </form>
              )}
            </div>

            <div className="flex justify-start mt-8">
              <Button variant="outline" onClick={() => setStep(2)}><ArrowLeft className="w-4 h-4 mr-1" /> Back</Button>
            </div>
          </div>
        )}

        {/* Step 4: Dummy Payment */}
        {step === 4 && selectedCourse && (
          <div className="max-w-md mx-auto">
            <h2 className="text-2xl font-bold font-display mb-2 text-center">Review & Pay</h2>
            <p className="text-sm text-muted-foreground text-center mb-8">Confirm details and complete payment</p>

            {paymentDone ? (
              <div className="bg-card rounded-2xl border border-border/50 p-12 shadow-card text-center space-y-4">
                <div className="w-20 h-20 mx-auto rounded-full bg-primary/10 flex items-center justify-center">
                  <Check className="w-10 h-10 text-primary" />
                </div>
                <h3 className="text-xl font-bold font-display">Payment Successful!</h3>
                <p className="text-sm text-muted-foreground">Redirecting to your dashboard...</p>
                <Loader2 className="w-5 h-5 animate-spin text-primary mx-auto" />
              </div>
            ) : (
              <div className="bg-card rounded-2xl border border-border/50 p-8 shadow-card space-y-5">
                {/* Course */}
                <div className="bg-primary/5 rounded-xl p-4">
                  <div className="flex items-start gap-3">
                    <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center flex-shrink-0">
                      <Sparkles className="w-5 h-5 text-primary" />
                    </div>
                    <div>
                      <h3 className="font-bold">{selectedCourse.title}</h3>
                      <p className="text-xs text-muted-foreground">{selectedCourse.duration}</p>
                    </div>
                  </div>
                </div>

                {/* Student */}
                <div className="bg-secondary/5 rounded-xl p-4">
                  <div className="flex items-start gap-3">
                    <div className="w-10 h-10 rounded-xl bg-secondary/10 flex items-center justify-center flex-shrink-0">
                      <User className="w-5 h-5 text-secondary" />
                    </div>
                    <div>
                      <h3 className="font-bold">{childName}</h3>
                      <p className="text-xs text-muted-foreground">Age {childAge} · Class {childClass} · {childSchool}</p>
                    </div>
                  </div>
                </div>

                {/* Slot */}
                {selectedSlot && (
                  <div className="bg-accent/5 rounded-xl p-4">
                    <div className="flex items-start gap-3">
                      <div className="w-10 h-10 rounded-xl bg-accent/10 flex items-center justify-center flex-shrink-0">
                        <Calendar className="w-5 h-5 text-accent" />
                      </div>
                      <div>
                        <h3 className="font-bold">
                          {new Date(selectedSlot.date + "T00:00:00").toLocaleDateString("en-IN", { weekday: "short", month: "short", day: "numeric" })}
                        </h3>
                        <p className="text-xs text-muted-foreground">{selectedSlot.start_time} – {selectedSlot.end_time} · with {selectedSlot.trainer_name}</p>
                      </div>
                    </div>
                  </div>
                )}

                {/* Price */}
                <div className="border-t border-border/50 pt-4">
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-muted-foreground">Total</span>
                    <div className="text-right">
                      <span className="text-2xl font-bold text-primary">₹{effectivePrice}</span>
                      {selectedCourse.discount_price && (
                        <span className="text-sm text-muted-foreground line-through ml-2">₹{selectedCourse.price}</span>
                      )}
                    </div>
                  </div>
                </div>

                <Button variant="hero" className="w-full h-12 text-base" onClick={handleDummyPayment} disabled={paying}>
                  {paying ? <><Loader2 className="w-5 h-5 animate-spin" /> Processing...</> : <><CreditCard className="w-5 h-5" /> Pay ₹{effectivePrice} (Demo)</>}
                </Button>

                <p className="text-xs text-center text-muted-foreground">
                  🔒 This is a demo payment — no real charges will be made
                </p>
              </div>
            )}

            {!paymentDone && (
              <div className="flex justify-start mt-8">
                <Button variant="outline" onClick={() => setStep(user ? 2 : 3)}><ArrowLeft className="w-4 h-4 mr-1" /> Back</Button>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default EnrollPage;
