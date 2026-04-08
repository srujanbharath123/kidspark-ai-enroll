import { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useAuth } from "@/contexts/AuthContext";
import { Sparkles, ArrowLeft, Loader2, Phone } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { InputOTP, InputOTPGroup, InputOTPSlot } from "@/components/ui/input-otp";

type UserRole = "parent" | "trainer";

const Signup = () => {
  const [fullName, setFullName] = useState("");
  const [phone, setPhone] = useState("");
  const [role, setRole] = useState<UserRole>("parent");
  const [otp, setOtp] = useState("");
  const [step, setStep] = useState<"details" | "otp">("details");
  const [isLoading, setIsLoading] = useState(false);
  const [isDummy, setIsDummy] = useState(false);
  const { sendOtp, verifyOtp } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();

  const formatPhone = (value: string) => value.replace(/[^\d+]/g, "");

  const handleSendOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!fullName.trim()) {
      toast({ title: "Name required", description: "Please enter your full name", variant: "destructive" });
      return;
    }
    const formattedPhone = phone.startsWith("+") ? phone : `+91${phone}`;
    if (!/^\+\d{10,15}$/.test(formattedPhone)) {
      toast({ title: "Invalid phone", description: "Enter a valid phone number with country code", variant: "destructive" });
      return;
    }
    setIsLoading(true);
    try {
      const result = await sendOtp(formattedPhone);
      setIsDummy(!!result.dummy);
      setStep("otp");
      toast({
        title: "OTP Sent! 📱",
        description: result.dummy ? "Use dummy code: 123456" : "Check your phone for the verification code",
      });
    } catch (error: any) {
      toast({ title: "Failed to send OTP", description: error.message, variant: "destructive" });
    } finally {
      setIsLoading(false);
    }
  };

  const handleVerifyOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    if (otp.length !== 6) {
      toast({ title: "Invalid OTP", description: "Enter the 6-digit code", variant: "destructive" });
      return;
    }
    const formattedPhone = phone.startsWith("+") ? phone : `+91${phone}`;
    setIsLoading(true);
    try {
      await verifyOtp(formattedPhone, otp, fullName, role);
      toast({ title: "Account created! 🎉", description: "Welcome to TechWindows!" });
      navigate("/dashboard");
    } catch (error: any) {
      toast({ title: "Verification failed", description: error.message, variant: "destructive" });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen gradient-hero flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        <Link to="/" className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground mb-8 transition-colors">
          <ArrowLeft className="w-4 h-4" /> Back to home
        </Link>

        <div className="bg-card rounded-3xl border border-border/50 shadow-elevated p-8">
          <div className="flex items-center gap-2 mb-2">
            <div className="w-9 h-9 rounded-xl gradient-primary flex items-center justify-center">
              <Sparkles className="w-5 h-5 text-primary-foreground" />
            </div>
            <span className="font-display text-xl font-bold">TechWindows</span>
          </div>
          <h1 className="text-2xl font-bold font-display mt-4 mb-1">Create your account</h1>
          <p className="text-sm text-muted-foreground mb-6">
            {step === "details" ? "Join TechWindows AI Bootcamp" : "Enter the OTP sent to your phone"}
          </p>

          {step === "details" ? (
            <form onSubmit={handleSendOtp} className="space-y-4">
              <div>
                <Label>I am a</Label>
                <div className="grid grid-cols-2 gap-3 mt-1.5">
                  {(["parent", "trainer"] as UserRole[]).map((r) => (
                    <button
                      key={r}
                      type="button"
                      onClick={() => setRole(r)}
                      className={`py-3 rounded-xl text-sm font-semibold border-2 transition-all ${
                        role === r
                          ? "border-primary bg-primary/10 text-primary"
                          : "border-border bg-background text-muted-foreground hover:border-primary/30"
                      }`}
                    >
                      {r === "parent" ? "👨‍👩‍👧 Parent" : "🎓 Trainer"}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <Label htmlFor="fullName">Full Name</Label>
                <Input
                  id="fullName"
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  placeholder="Your full name"
                  required
                  className="mt-1.5 rounded-xl h-11"
                />
              </div>

              <div>
                <Label htmlFor="phone">Mobile Number</Label>
                <div className="relative mt-1.5">
                  <Phone className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                  <Input
                    id="phone"
                    type="tel"
                    value={phone}
                    onChange={(e) => setPhone(formatPhone(e.target.value))}
                    placeholder="+919876543210"
                    required
                    className="rounded-xl h-11 pl-10"
                  />
                </div>
                <p className="text-xs text-muted-foreground mt-1">
                  Include country code. Dummy: +919999999999
                </p>
              </div>

              <Button variant="hero" size="lg" className="w-full" type="submit" disabled={isLoading}>
                {isLoading ? <><Loader2 className="w-4 h-4 animate-spin" /> Sending OTP...</> : "Send OTP"}
              </Button>
            </form>
          ) : (
            <form onSubmit={handleVerifyOtp} className="space-y-4">
              <div>
                <Label>Verification Code</Label>
                <div className="flex justify-center mt-3">
                  <InputOTP maxLength={6} value={otp} onChange={setOtp}>
                    <InputOTPGroup>
                      <InputOTPSlot index={0} />
                      <InputOTPSlot index={1} />
                      <InputOTPSlot index={2} />
                      <InputOTPSlot index={3} />
                      <InputOTPSlot index={4} />
                      <InputOTPSlot index={5} />
                    </InputOTPGroup>
                  </InputOTP>
                </div>
                {isDummy && (
                  <p className="text-xs text-center text-primary mt-2 font-medium">
                    Dummy OTP: 123456
                  </p>
                )}
              </div>
              <Button variant="hero" size="lg" className="w-full" type="submit" disabled={isLoading}>
                {isLoading ? <><Loader2 className="w-4 h-4 animate-spin" /> Verifying...</> : "Verify & Create Account"}
              </Button>
              <button
                type="button"
                onClick={() => { setStep("details"); setOtp(""); }}
                className="w-full text-sm text-muted-foreground hover:text-foreground transition-colors"
              >
                Back to details
              </button>
            </form>
          )}

          <p className="text-center text-sm text-muted-foreground mt-6">
            Already have an account?{" "}
            <Link to="/login" className="text-primary font-semibold hover:underline">Sign in</Link>
          </p>
        </div>
      </div>
    </div>
  );
};

export default Signup;
