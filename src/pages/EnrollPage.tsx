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
  Sparkles, GraduationCap, User, ShieldCheck, Calendar, Clock,
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

const STEPS = ["Select Course", "Student Details", "Book Slot", "Pay"];

const EnrollPage = () => {
  const { user, profile } = useAuth();
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

  // Slot booking
  const [availableSlots, setAvailableSlots] = useState<AvailableSlot[]>([]);
  const [selectedSlot, setSelectedSlot] = useState<AvailableSlot | null>(null);
  const [slotsLoading, setSlotsLoading] = useState(false);

  const [loading, setLoading] = useState(false);
  const [paying, setPaying] = useState(false);

  // Fetch courses
  useEffect(() => {
    const fetchCourses = async () => {
      setLoading(true);
      const { data } = await supabase
        .from("courses")
        .select("id, title, description, price, discount_price, duration, features, image_url")
        .eq("is_active", true)
        .order("created_at");
      if (data) setCourses(data);
      setLoading(false);
    };
    fetchCourses();
  }, []);

  // Auto-select course from URL param
  useEffect(() => {
    const courseId = searchParams.get("course");
    if (courseId && courses.length > 0) {
      const found = courses.find((c) => c.id === courseId);
      if (found) {
        setSelectedCourse(found);
        setStep(1);
      }
    }
  }, [searchParams, courses]);

  // Fetch available slots when reaching step 2
  useEffect(() => {
    if (step === 2) {
      fetchSlots();
    }
  }, [step]);

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
      setAvailableSlots(
        availData.map((s) => ({
          ...s,
          trainer_name: profileMap.get(s.trainer_id) || "Trainer",
        }))
      );
    } else {
      setAvailableSlots([]);
    }
    setSlotsLoading(false);
  };

  const effectivePrice = selectedCourse
    ? selectedCourse.discount_price ?? selectedCourse.price
    : 0;

  const canProceedStep1 = !!selectedCourse;
  const canProceedStep2 =
    childName.trim().length >= 2 &&
    Number(childAge) >= 4 &&
    Number(childAge) <= 18 &&
    childClass.trim().length >= 1 &&
    childSchool.trim().length >= 2;

  const handlePayment = async () => {
    if (!user) {
      toast({ title: "Please log in first", description: "You need an account to enroll.", variant: "destructive" });
      navigate(`/login?redirect=/enroll${selectedCourse ? `?course=${selectedCourse.id}` : ""}`);
      return;
    }

    if (!selectedCourse || !canProceedStep2) return;

    if (!window.Razorpay) {
      toast({ title: "Payment gateway loading...", description: "Please try again.", variant: "destructive" });
      return;
    }

    setPaying(true);

    try {
      const { data, error } = await supabase.functions.invoke("create-enrollment-order", {
        body: {
          amount: effectivePrice,
          course_id: selectedCourse.id,
          child_name: childName.trim(),
          child_age: Number(childAge),
        },
      });

      if (error || !data?.order_id) {
        throw new Error(error?.message || "Failed to create payment order");
      }

      const options: RazorpayOptions = {
        key: data.key_id,
        amount: data.amount,
        currency: data.currency,
        name: "TechWindows AI Bootcamp",
        description: `Enrollment: ${selectedCourse.title}`,
        order_id: data.order_id,
        handler: async (response) => {
          try {
            const body: Record<string, unknown> = {
              razorpay_order_id: response.razorpay_order_id,
              razorpay_payment_id: response.razorpay_payment_id,
              razorpay_signature: response.razorpay_signature,
              course_id: selectedCourse.id,
              child_name: childName.trim(),
              child_age: Number(childAge),
              child_class: childClass.trim(),
              child_school: childSchool.trim(),
            };

            if (selectedSlot) {
              body.slot_id = selectedSlot.id;
              body.trainer_id = selectedSlot.trainer_id;
              body.slot_date = selectedSlot.date;
              body.slot_start_time = selectedSlot.start_time;
              body.slot_end_time = selectedSlot.end_time;
            }

            const { data: verifyData, error: verifyError } = await supabase.functions.invoke(
              "verify-enrollment-payment",
              { body }
            );

            if (verifyError || !verifyData?.success) {
              throw new Error("Payment verification failed");
            }

            toast({
              title: "Enrollment successful! 🎉",
              description: `${childName} is enrolled in ${selectedCourse.title}.`,
            });
            navigate("/dashboard");
          } catch {
            toast({
              title: "Payment verified but enrollment failed",
              description: "Please contact support.",
              variant: "destructive",
            });
          } finally {
            setPaying(false);
          }
        },
        prefill: {
          name: profile?.full_name || "",
          email: user.email || "",
        },
        theme: { color: "#7c3aed" },
        modal: {
          ondismiss: () => setPaying(false),
        },
      };

      const rzp = new window.Razorpay(options);
      rzp.open();
    } catch (err: any) {
      toast({ title: "Payment failed", description: err.message, variant: "destructive" });
      setPaying(false);
    }
  };

  // Group slots by date
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
          {STEPS.map((label, i) => (
            <div key={label} className="flex items-center gap-1 sm:gap-2">
              <div
                className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold transition-all ${
                  i < step
                    ? "bg-primary text-primary-foreground"
                    : i === step
                    ? "bg-primary text-primary-foreground shadow-lg shadow-primary/30"
                    : "bg-muted text-muted-foreground"
                }`}
              >
                {i < step ? <Check className="w-4 h-4" /> : i + 1}
              </div>
              <span className={`text-xs font-medium hidden sm:block ${i === step ? "text-foreground" : "text-muted-foreground"}`}>
                {label}
              </span>
              {i < STEPS.length - 1 && <div className="w-6 sm:w-12 h-px bg-border" />}
            </div>
          ))}
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
                    <button
                      key={course.id}
                      onClick={() => setSelectedCourse(course)}
                      className={`text-left bg-card rounded-2xl border-2 p-6 shadow-card transition-all hover:shadow-elevated ${
                        isSelected ? "border-primary ring-2 ring-primary/20" : "border-border/50 hover:border-primary/30"
                      }`}
                    >
                      <div className="flex items-start justify-between mb-3">
                        <h3 className="font-bold font-display text-lg">{course.title}</h3>
                        {isSelected && (
                          <div className="w-6 h-6 rounded-full bg-primary flex items-center justify-center">
                            <Check className="w-3.5 h-3.5 text-primary-foreground" />
                          </div>
                        )}
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
              <Button variant="hero" onClick={() => setStep(1)} disabled={!canProceedStep1} className="px-8">
                Next <ArrowRight className="w-4 h-4 ml-1" />
              </Button>
            </div>
          </div>
        )}

        {/* Step 1: Student Details */}
        {step === 1 && (
          <div className="max-w-md mx-auto">
            <h2 className="text-2xl font-bold font-display mb-2 text-center">Student Details</h2>
            <p className="text-sm text-muted-foreground text-center mb-8">Fill in your child's complete information</p>

            <div className="bg-card rounded-2xl border border-border/50 p-8 shadow-card space-y-5">
              <div className="w-16 h-16 mx-auto rounded-2xl bg-primary/10 flex items-center justify-center mb-2">
                <User className="w-8 h-8 text-primary" />
              </div>

              <div>
                <Label htmlFor="childName" className="text-sm font-semibold">Full Name *</Label>
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

              {!user && (
                <div className="bg-accent/10 border border-accent/20 rounded-xl p-4 text-sm">
                  <p className="font-semibold text-accent flex items-center gap-1.5">
                    <ShieldCheck className="w-4 h-4" /> Account Required
                  </p>
                  <p className="text-muted-foreground mt-1">
                    You'll need to{" "}
                    <Link to={`/login?redirect=/enroll${selectedCourse ? `?course=${selectedCourse.id}` : ""}`} className="text-primary underline">log in</Link>
                    {" "}or{" "}
                    <Link to={`/signup?redirect=/enroll${selectedCourse ? `?course=${selectedCourse.id}` : ""}`} className="text-primary underline">sign up</Link>
                    {" "}before paying.
                  </p>
                </div>
              )}
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
                <p className="text-xs text-muted-foreground">You can skip this step and book a session later from your dashboard.</p>
              </div>
            ) : (
              <div className="space-y-6">
                {Object.entries(slotsByDate).map(([date, slots]) => (
                  <div key={date}>
                    <h3 className="text-sm font-bold mb-2 flex items-center gap-2">
                      <Calendar className="w-4 h-4 text-primary" />
                      {new Date(date + "T00:00:00").toLocaleDateString("en-IN", {
                        weekday: "long", year: "numeric", month: "long", day: "numeric",
                      })}
                    </h3>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                      {slots.map((slot) => {
                        const isSelected = selectedSlot?.id === slot.id;
                        return (
                          <button
                            key={slot.id}
                            onClick={() => setSelectedSlot(isSelected ? null : slot)}
                            className={`bg-card rounded-xl border-2 p-4 text-left transition-all ${
                              isSelected
                                ? "border-primary ring-2 ring-primary/20"
                                : "border-border/50 hover:border-primary/30"
                            }`}
                          >
                            <div className="flex items-center justify-between">
                              <div>
                                <p className="text-sm font-semibold flex items-center gap-1.5">
                                  <Clock className="w-3.5 h-3.5 text-muted-foreground" />
                                  {slot.start_time} – {slot.end_time}
                                </p>
                                <p className="text-xs text-muted-foreground mt-0.5">with {slot.trainer_name}</p>
                              </div>
                              {isSelected && (
                                <div className="w-6 h-6 rounded-full bg-primary flex items-center justify-center">
                                  <Check className="w-3.5 h-3.5 text-primary-foreground" />
                                </div>
                              )}
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
              <Button variant="hero" onClick={() => setStep(3)} className="px-8">
                {selectedSlot ? "Review & Pay" : "Skip & Pay"} <ArrowRight className="w-4 h-4 ml-1" />
              </Button>
            </div>
          </div>
        )}

        {/* Step 3: Review & Pay */}
        {step === 3 && selectedCourse && (
          <div className="max-w-md mx-auto">
            <h2 className="text-2xl font-bold font-display mb-2 text-center">Review & Pay</h2>
            <p className="text-sm text-muted-foreground text-center mb-8">Confirm everything and complete payment</p>

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
                    <p className="text-xs text-muted-foreground">
                      Age {childAge} · Class {childClass} · {childSchool}
                    </p>
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
                        {new Date(selectedSlot.date + "T00:00:00").toLocaleDateString("en-IN", {
                          weekday: "short", month: "short", day: "numeric",
                        })}
                      </h3>
                      <p className="text-xs text-muted-foreground">
                        {selectedSlot.start_time} – {selectedSlot.end_time} · with {selectedSlot.trainer_name}
                      </p>
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

              <Button variant="hero" className="w-full h-12 text-base" onClick={handlePayment} disabled={paying || !user}>
                {paying ? (
                  <><Loader2 className="w-5 h-5 animate-spin" /> Processing...</>
                ) : !user ? (
                  "Log in to Pay"
                ) : (
                  <><CreditCard className="w-5 h-5" /> Pay ₹{effectivePrice}</>
                )}
              </Button>

              {!user && (
                <p className="text-xs text-center text-muted-foreground">
                  <Link to={`/login?redirect=/enroll?course=${selectedCourse.id}`} className="text-primary underline">Log in</Link>
                  {" "}or{" "}
                  <Link to={`/signup?redirect=/enroll?course=${selectedCourse.id}`} className="text-primary underline">create an account</Link>
                  {" "}to complete enrollment.
                </p>
              )}

              <p className="text-xs text-center text-muted-foreground flex items-center justify-center gap-1">
                <ShieldCheck className="w-3 h-3" /> Secured by Razorpay · 100% safe payment
              </p>
            </div>

            <div className="flex justify-start mt-8">
              <Button variant="outline" onClick={() => setStep(2)}><ArrowLeft className="w-4 h-4 mr-1" /> Back</Button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default EnrollPage;
