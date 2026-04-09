import { useEffect, useState } from "react";
import { useSearchParams } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Loader2, CheckCircle2, XCircle, MailX } from "lucide-react";

type Status = "loading" | "valid" | "already" | "invalid" | "success" | "error";

const UnsubscribePage = () => {
  const [searchParams] = useSearchParams();
  const token = searchParams.get("token");
  const [status, setStatus] = useState<Status>("loading");
  const [processing, setProcessing] = useState(false);

  useEffect(() => {
    if (!token) { setStatus("invalid"); return; }
    const validate = async () => {
      try {
        const url = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/handle-email-unsubscribe?token=${token}`;
        const res = await fetch(url, { headers: { apikey: import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY } });
        const data = await res.json();
        if (!res.ok) { setStatus("invalid"); return; }
        if (data.valid === false && data.reason === "already_unsubscribed") { setStatus("already"); return; }
        setStatus("valid");
      } catch { setStatus("invalid"); }
    };
    validate();
  }, [token]);

  const handleUnsubscribe = async () => {
    if (!token) return;
    setProcessing(true);
    try {
      const { data, error } = await supabase.functions.invoke("handle-email-unsubscribe", { body: { token } });
      if (error || (data && data.reason === "already_unsubscribed")) { setStatus("already"); }
      else if (data?.success) { setStatus("success"); }
      else { setStatus("error"); }
    } catch { setStatus("error"); }
    setProcessing(false);
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-background p-6">
      <div className="bg-card rounded-2xl border border-border/50 shadow-card p-8 max-w-md w-full text-center">
        {status === "loading" && (
          <>
            <Loader2 className="w-10 h-10 animate-spin text-primary mx-auto mb-4" />
            <p className="text-muted-foreground">Validating...</p>
          </>
        )}
        {status === "valid" && (
          <>
            <MailX className="w-12 h-12 text-accent mx-auto mb-4" />
            <h1 className="text-xl font-bold font-display mb-2">Unsubscribe</h1>
            <p className="text-sm text-muted-foreground mb-6">Are you sure you want to unsubscribe from email notifications?</p>
            <Button variant="destructive" onClick={handleUnsubscribe} disabled={processing}>
              {processing ? <><Loader2 className="w-4 h-4 animate-spin" /> Processing...</> : "Confirm Unsubscribe"}
            </Button>
          </>
        )}
        {status === "success" && (
          <>
            <CheckCircle2 className="w-12 h-12 text-green-500 mx-auto mb-4" />
            <h1 className="text-xl font-bold font-display mb-2">Unsubscribed</h1>
            <p className="text-sm text-muted-foreground">You've been unsubscribed from email notifications.</p>
          </>
        )}
        {status === "already" && (
          <>
            <CheckCircle2 className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
            <h1 className="text-xl font-bold font-display mb-2">Already Unsubscribed</h1>
            <p className="text-sm text-muted-foreground">You've already unsubscribed from email notifications.</p>
          </>
        )}
        {status === "invalid" && (
          <>
            <XCircle className="w-12 h-12 text-destructive mx-auto mb-4" />
            <h1 className="text-xl font-bold font-display mb-2">Invalid Link</h1>
            <p className="text-sm text-muted-foreground">This unsubscribe link is invalid or expired.</p>
          </>
        )}
        {status === "error" && (
          <>
            <XCircle className="w-12 h-12 text-destructive mx-auto mb-4" />
            <h1 className="text-xl font-bold font-display mb-2">Something Went Wrong</h1>
            <p className="text-sm text-muted-foreground">Please try again later or contact support.</p>
          </>
        )}
      </div>
    </div>
  );
};

export default UnsubscribePage;
