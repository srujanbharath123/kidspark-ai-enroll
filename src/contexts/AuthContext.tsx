import { createContext, useContext, useEffect, useState, ReactNode } from "react";
import { Session, User } from "@supabase/supabase-js";
import { supabase } from "@/integrations/supabase/client";

type UserRole = "parent" | "trainer" | "admin";

interface Profile {
  id: string;
  user_id: string;
  full_name: string;
  phone: string | null;
  avatar_url: string | null;
}

interface AuthContextType {
  session: Session | null;
  user: User | null;
  profile: Profile | null;
  role: UserRole | null;
  loading: boolean;
  sendOtp: (phone: string) => Promise<{ dummy?: boolean }>;
  verifyOtp: (phone: string, code: string, fullName?: string, role?: UserRole, email?: string) => Promise<void>;
  signOut: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [session, setSession] = useState<Session | null>(null);
  const [user, setUser] = useState<User | null>(null);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [role, setRole] = useState<UserRole | null>(null);
  const [loading, setLoading] = useState(true);

  const fetchUserData = async (userId: string) => {
    const [profileRes, roleRes] = await Promise.all([
      supabase.from("profiles").select("*").eq("user_id", userId).single(),
      supabase.rpc("has_role", { _user_id: userId, _role: "admin" as UserRole }),
    ]);

    if (profileRes.data) setProfile(profileRes.data as Profile);

    if (roleRes.data) {
      setRole("admin");
    } else {
      const trainerRes = await supabase.rpc("has_role", { _user_id: userId, _role: "trainer" as UserRole });
      if (trainerRes.data) {
        setRole("trainer");
      } else {
        setRole("parent");
      }
    }
  };

  useEffect(() => {
    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (_event, session) => {
      setSession(session);
      setUser(session?.user ?? null);

      if (session?.user) {
        setTimeout(() => fetchUserData(session.user.id), 0);
      } else {
        setProfile(null);
        setRole(null);
      }
      setLoading(false);
    });

    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      setUser(session?.user ?? null);
      if (session?.user) {
        fetchUserData(session.user.id);
      }
      setLoading(false);
    });

    return () => subscription.unsubscribe();
  }, []);

  const sendOtp = async (phone: string) => {
    const { data, error } = await supabase.functions.invoke("send-otp", {
      body: { phone },
    });
    if (error) throw new Error(error.message || "Failed to send OTP");
    if (data?.error) throw new Error(data.error);
    return { dummy: data?.dummy };
  };

  const verifyOtp = async (phone: string, code: string, fullName?: string, role?: UserRole, email?: string) => {
    const { data, error } = await supabase.functions.invoke("verify-otp", {
      body: { phone, code, full_name: fullName, role, email },
    });
    if (error) throw new Error(error.message || "OTP verification failed");
    if (data?.error) throw new Error(data.error);

    // Use the magic link token to sign in
    if (data?.token_hash) {
      const { error: verifyErr } = await supabase.auth.verifyOtp({
        token_hash: data.token_hash,
        type: "magiclink",
      });
      if (verifyErr) throw new Error("Sign-in failed: " + verifyErr.message);
    } else {
      throw new Error("No authentication token received");
    }
  };

  const signOut = async () => {
    const { error } = await supabase.auth.signOut();
    if (error) throw error;
  };

  return (
    <AuthContext.Provider value={{ session, user, profile, role, loading, sendOtp, verifyOtp, signOut }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) throw new Error("useAuth must be used within AuthProvider");
  return context;
};
