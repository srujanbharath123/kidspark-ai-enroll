import { useEffect, useState } from "react";
import { useSearchParams, useNavigate, Link } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { Check, CreditCard, Loader2, ArrowLeft, ArrowRight, Sparkles, GraduationCap, User, ShieldCheck } from "lucide-react";

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

const STEPS = ["Select Course", "Child Details", "Review & Pay"];

const EnrollPage = () => {
  const { user, profile } = useAuth();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { toast } = useToast();

  const [step, setStep] = useState(0);
  const [courses, setCourses] = useState<Course[]>([]);
  const [selectedCourse, setSelectedCourse] = useState<Course | null>(null);
  const [childName, setChildName] = useState("");
  const [childAge, setChildAge] = useState("");
  const [loading, setLoading] = useState(false);
  const [paying, setPaying] = useState(false);

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
        setStep(user ? 1 : 1);
      }
    }
  }, [searchParams, courses, user]);

  const effectivePrice = selectedCourse
    ? selectedCourse.discount_price ?? selectedCourse.price
    : 0;

  const canProceedStep1 = !!selectedCourse;
  const canProceedStep2 = childName.trim().length >= 2 && Number(childAge) >= 4 && Number(childAge) <= 18;

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
            const { data: verifyData, error: verifyError } = await supabase.functions.invoke("verify-enrollment-payment", {
              body: {
                razorpay_order_id: response.razorpay_order_id,
                razorpay_payment_id: response.razorpay_payment_id,
                razorpay_signature: response.razorpay_signature,
                course_id: selectedCourse.id,
                child_name: childName.trim(),
                child_age: Number(childAge),
              },
            });

            if (verifyError || !verifyData?.success) {
              throw new Error("Payment verification failed");
            }

            toast({ title: "Enrollment successful! 🎉", description: `${childName} is now enrolled in ${selectedCourse.title}.` });
            navigate("/dashboard/enrollments");
          } catch {
            toast({ title: "Payment verified but enrollment failed", description: "Please contact support.", variant: "destructive" });
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

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-primary/5 to-secondary/5">
      {/* Header */}
      <div className="border-b border-border/50 bg-card/80 backdrop-blur-sm">
        <div className="max-w-4xl mx-auto px-4 py-4 flex items-center justify-between">
          <Link to="/" className="flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors">
            <ArrowLeft className="w-4 h-4" />
            Back to Home
          </Link>
          <h1 className="text-lg font-bold font-display flex items-center gap-2">
            <GraduationCap className="w-5 h-5 text-primary" />
            Enroll Now
          </h1>
          <div className="w-20" />
        </div>
      </div>

      {/* Stepper */}
      <div className="max-w-4xl mx-auto px-4 pt-8 pb-4">
        <div className="flex items-center justify-center gap-2 mb-8">
          {STEPS.map((label, i) => (
            <div key={label} className="flex items-center gap-2">
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
              {i < STEPS.length - 1 && <div className="w-8 sm:w-16 h-px bg-border" />}
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
              <div className="flex justify-center py-16">
                <Loader2 className="w-8 h-8 animate-spin text-primary" />
              </div>
            ) : courses.length === 0 ? (
              <div className="bg-card rounded-2xl border border-border/50 p-12 text-center shadow-card">
                <p className="text-muted-foreground">No courses available right now. Check back soon!</p>
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
                        isSelected
                          ? "border-primary ring-2 ring-primary/20"
                          : "border-border/50 hover:border-primary/30"
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
                        {course.discount_price && (
                          <span className="text-sm text-muted-foreground line-through">₹{course.price}</span>
                        )}
                        <Badge variant="outline" className="ml-auto text-xs">{course.duration}</Badge>
                      </div>
                      {course.features && course.features.length > 0 && (
                        <div className="mt-3 flex flex-wrap gap-1.5">
                          {course.features.slice(0, 3).map((f, i) => (
                            <Badge key={i} variant="secondary" className="text-xs font-normal">
                              {f}
                            </Badge>
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

        {/* Step 1: Child Details */}
        {step === 1 && (
          <div className="max-w-md mx-auto">
            <h2 className="text-2xl font-bold font-display mb-2 text-center">Child Details</h2>
            <p className="text-sm text-muted-foreground text-center mb-8">Tell us about the student</p>

            <div className="bg-card rounded-2xl border border-border/50 p-8 shadow-card space-y-6">
              <div className="w-16 h-16 mx-auto rounded-2xl bg-primary/10 flex items-center justify-center mb-2">
                <User className="w-8 h-8 text-primary" />
              </div>

              <div>
                <Label htmlFor="childName" className="text-sm font-semibold">
                  Child's Full Name
                </Label>
                <Input
                  id="childName"
                  value={childName}
                  onChange={(e) => setChildName(e.target.value)}
                  placeholder="e.g. Aarav Sharma"
                  className="mt-1.5 rounded-xl"
                  maxLength={100}
                />
              </div>

              <div>
                <Label htmlFor="childAge" className="text-sm font-semibold">
                  Age
                </Label>
                <Input
                  id="childAge"
                  type="number"
                  min={4}
                  max={18}
                  value={childAge}
                  onChange={(e) => setChildAge(e.target.value)}
                  placeholder="e.g. 10"
                  className="mt-1.5 rounded-xl"
                />
                <p className="text-xs text-muted-foreground mt-1">Ages 4–18 are eligible</p>
              </div>

              {!user && (
                <div className="bg-accent/10 border border-accent/20 rounded-xl p-4 text-sm">
                  <p className="font-semibold text-accent flex items-center gap-1.5">
                    <ShieldCheck className="w-4 h-4" /> Account Required
                  </p>
                  <p className="text-muted-foreground mt-1">
                    You'll need to{" "}
                    <Link to={`/login?redirect=/enroll${selectedCourse ? `?course=${selectedCourse.id}` : ""}`} className="text-primary underline">
                      log in
                    </Link>{" "}
                    or{" "}
                    <Link to={`/signup?redirect=/enroll${selectedCourse ? `?course=${selectedCourse.id}` : ""}`} className="text-primary underline">
                      sign up
                    </Link>{" "}
                    before paying.
                  </p>
                </div>
              )}
            </div>

            <div className="flex justify-between mt-8">
              <Button variant="outline" onClick={() => setStep(0)}>
                <ArrowLeft className="w-4 h-4 mr-1" /> Back
              </Button>
              <Button variant="hero" onClick={() => setStep(2)} disabled={!canProceedStep2} className="px-8">
                Review & Pay <ArrowRight className="w-4 h-4 ml-1" />
              </Button>
            </div>
          </div>
        )}

        {/* Step 2: Review & Pay */}
        {step === 2 && selectedCourse && (
          <div className="max-w-md mx-auto">
            <h2 className="text-2xl font-bold font-display mb-2 text-center">Review & Pay</h2>
            <p className="text-sm text-muted-foreground text-center mb-8">Confirm details and complete payment</p>

            <div className="bg-card rounded-2xl border border-border/50 p-8 shadow-card space-y-6">
              {/* Course summary */}
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

              {/* Child summary */}
              <div className="bg-secondary/5 rounded-xl p-4">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-secondary/10 flex items-center justify-center flex-shrink-0">
                    <User className="w-5 h-5 text-secondary" />
                  </div>
                  <div>
                    <h3 className="font-bold">{childName}</h3>
                    <p className="text-xs text-muted-foreground">Age {childAge}</p>
                  </div>
                </div>
              </div>

              {/* Price */}
              <div className="border-t border-border/50 pt-4">
                <div className="flex items-center justify-between">
                  <span className="text-sm text-muted-foreground">Course Fee</span>
                  <div className="text-right">
                    <span className="text-2xl font-bold text-primary">₹{effectivePrice}</span>
                    {selectedCourse.discount_price && (
                      <span className="text-sm text-muted-foreground line-through ml-2">₹{selectedCourse.price}</span>
                    )}
                  </div>
                </div>
              </div>

              <Button
                variant="hero"
                className="w-full h-12 text-base"
                onClick={handlePayment}
                disabled={paying || !user}
              >
                {paying ? (
                  <><Loader2 className="w-5 h-5 animate-spin" /> Processing Payment...</>
                ) : !user ? (
                  "Log in to Pay"
                ) : (
                  <><CreditCard className="w-5 h-5" /> Pay ₹{effectivePrice}</>
                )}
              </Button>

              {!user && (
                <p className="text-xs text-center text-muted-foreground">
                  <Link to={`/login?redirect=/enroll?course=${selectedCourse.id}`} className="text-primary underline">
                    Log in
                  </Link>{" "}
                  or{" "}
                  <Link to={`/signup?redirect=/enroll?course=${selectedCourse.id}`} className="text-primary underline">
                    create an account
                  </Link>{" "}
                  to complete enrollment.
                </p>
              )}

              <p className="text-xs text-center text-muted-foreground flex items-center justify-center gap-1">
                <ShieldCheck className="w-3 h-3" /> Secured by Razorpay · 100% safe payment
              </p>
            </div>

            <div className="flex justify-between mt-8">
              <Button variant="outline" onClick={() => setStep(1)}>
                <ArrowLeft className="w-4 h-4 mr-1" /> Back
              </Button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default EnrollPage;
