import { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { InputOTP, InputOTPGroup, InputOTPSlot } from "@/components/ui/input-otp";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { Sparkles, Eye, EyeOff, ArrowLeft, Phone, Mail, Loader2, ShieldCheck } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

type LoginMethod = "email" | "phone";

const Login = () => {
  const [method, setMethod] = useState<LoginMethod>("phone");

  // Email login
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);

  // Phone login
  const [phone, setPhone] = useState("");
  const [otp, setOtp] = useState("");
  const [otpSent, setOtpSent] = useState(false);
  const [sendingOtp, setSendingOtp] = useState(false);
  const [verifyingOtp, setVerifyingOtp] = useState(false);

  const [isLoading, setIsLoading] = useState(false);
  const { signIn } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();

  const handleEmailLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    try {
      await signIn(email, password);
      navigate("/dashboard");
    } catch (error: any) {
      toast({
        title: "Login failed",
        description: error.message || "Invalid email or password",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const formatPhone = (p: string) => {
    const cleaned = p.replace(/\D/g, "");
    if (cleaned.startsWith("91") && cleaned.length > 10) return `+${cleaned}`;
    if (cleaned.length === 10) return `+91${cleaned}`;
    return `+${cleaned}`;
  };

  const handleSendOtp = async () => {
    if (phone.replace(/\D/g, "").length < 10) {
      toast({ title: "Invalid phone", description: "Enter a valid 10-digit phone number", variant: "destructive" });
      return;
    }
    setSendingOtp(true);
    try {
      const formattedPhone = formatPhone(phone);
      const { error } = await supabase.auth.signInWithOtp({ phone: formattedPhone });
      if (error) throw error;
      setOtpSent(true);
      toast({ title: "OTP sent! 📱", description: `Verification code sent to ${formattedPhone}` });
    } catch (err: any) {
      toast({ title: "Failed to send OTP", description: err.message, variant: "destructive" });
    } finally {
      setSendingOtp(false);
    }
  };

  const handleVerifyOtp = async () => {
    setVerifyingOtp(true);
    try {
      const formattedPhone = formatPhone(phone);
      const { error } = await supabase.auth.verifyOtp({
        phone: formattedPhone,
        token: otp,
        type: "sms",
      });
      if (error) throw error;
      toast({ title: "Welcome back! 🎉" });
      navigate("/dashboard");
    } catch (err: any) {
      toast({ title: "Verification failed", description: err.message, variant: "destructive" });
    } finally {
      setVerifyingOtp(false);
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
          <h1 className="text-2xl font-bold font-display mt-4 mb-1">Welcome back!</h1>
          <p className="text-sm text-muted-foreground mb-6">Sign in to your account</p>

          {/* Method toggle */}
          <div className="grid grid-cols-2 gap-2 mb-6">
            <button
              onClick={() => { setMethod("phone"); setOtpSent(false); setOtp(""); }}
              className={`py-2.5 rounded-xl text-sm font-semibold border-2 transition-all flex items-center justify-center gap-2 ${
                method === "phone"
                  ? "border-primary bg-primary/10 text-primary"
                  : "border-border bg-background text-muted-foreground hover:border-primary/30"
              }`}
            >
              <Phone className="w-4 h-4" /> Phone
            </button>
            <button
              onClick={() => setMethod("email")}
              className={`py-2.5 rounded-xl text-sm font-semibold border-2 transition-all flex items-center justify-center gap-2 ${
                method === "email"
                  ? "border-primary bg-primary/10 text-primary"
                  : "border-border bg-background text-muted-foreground hover:border-primary/30"
              }`}
            >
              <Mail className="w-4 h-4" /> Email
            </button>
          </div>

          {method === "email" ? (
            <form onSubmit={handleEmailLogin} className="space-y-4">
              <div>
                <Label htmlFor="email">Email</Label>
                <Input id="email" type="email" value={email} onChange={(e) => setEmail(e.target.value)}
                  placeholder="parent@example.com" required className="mt-1.5 rounded-xl h-11" />
              </div>
              <div>
                <div className="flex items-center justify-between">
                  <Label htmlFor="password">Password</Label>
                  <Link to="/forgot-password" className="text-xs text-primary hover:underline">Forgot password?</Link>
                </div>
                <div className="relative mt-1.5">
                  <Input id="password" type={showPassword ? "text" : "password"} value={password}
                    onChange={(e) => setPassword(e.target.value)} placeholder="••••••••" required className="rounded-xl h-11 pr-10" />
                  <button type="button" onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground">
                    {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>
              <Button variant="hero" size="lg" className="w-full" type="submit" disabled={isLoading}>
                {isLoading ? "Signing in..." : "Sign In"}
              </Button>
            </form>
          ) : (
            <div className="space-y-4">
              {!otpSent ? (
                <>
                  <div>
                    <Label htmlFor="phone">Phone Number</Label>
                    <Input id="phone" type="tel" value={phone} onChange={(e) => setPhone(e.target.value)}
                      placeholder="9876543210" className="mt-1.5 rounded-xl h-11" maxLength={15} />
                    <p className="text-xs text-muted-foreground mt-1">Enter your registered phone number</p>
                  </div>
                  <Button variant="hero" size="lg" className="w-full" onClick={handleSendOtp} disabled={sendingOtp}>
                    {sendingOtp ? <><Loader2 className="w-4 h-4 animate-spin" /> Sending...</> : "Send OTP"}
                  </Button>
                </>
              ) : (
                <>
                  <div className="text-center mb-2">
                    <p className="text-sm text-muted-foreground">
                      Enter the code sent to <span className="font-semibold text-foreground">{formatPhone(phone)}</span>
                    </p>
                  </div>
                  <div className="flex justify-center">
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
                  <Button variant="hero" size="lg" className="w-full" onClick={handleVerifyOtp}
                    disabled={otp.length < 6 || verifyingOtp}>
                    {verifyingOtp ? <><Loader2 className="w-4 h-4 animate-spin" /> Verifying...</> : <><ShieldCheck className="w-4 h-4" /> Verify & Sign In</>}
                  </Button>
                  <button onClick={() => { setOtpSent(false); setOtp(""); }}
                    className="text-xs text-primary hover:underline w-full text-center">
                    Change number / Resend OTP
                  </button>
                </>
              )}
            </div>
          )}

          <p className="text-center text-sm text-muted-foreground mt-6">
            Don't have an account?{" "}
            <Link to="/signup" className="text-primary font-semibold hover:underline">Sign up</Link>
          </p>
        </div>
      </div>
    </div>
  );
};

export default Login;
