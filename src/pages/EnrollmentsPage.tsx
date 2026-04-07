import { useEffect, useState } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import DashboardLayout from "@/components/DashboardLayout";
import { Badge } from "@/components/ui/badge";

interface Enrollment {
  id: string;
  payment_status: string;
  created_at: string;
  courses: { title: string; duration: string } | null;
  children: { name: string; age: number } | null;
}

const EnrollmentsPage = () => {
  const { user, role } = useAuth();
  const [enrollments, setEnrollments] = useState<Enrollment[]>([]);

  useEffect(() => {
    const fetchEnrollments = async () => {
      let query = supabase
        .from("enrollments")
        .select("id, payment_status, created_at, courses(title, duration), children(name, age)")
        .order("created_at", { ascending: false });

      if (role === "parent" && user) {
        query = query.eq("parent_id", user.id);
      }

      const { data } = await query;
      if (data) setEnrollments(data as unknown as Enrollment[]);
    };
    fetchEnrollments();
  }, [user, role]);

  const statusColors: Record<string, string> = {
    pending: "bg-accent/10 text-accent border-accent/20",
    completed: "bg-success/10 text-success border-success/20",
    failed: "bg-destructive/10 text-destructive border-destructive/20",
  };

  return (
    <DashboardLayout>
      <div>
        <h1 className="text-2xl font-bold font-display mb-2">Enrollments</h1>
        <p className="text-sm text-muted-foreground mb-8">
          {role === "admin" ? "View all enrollments" : "Your course enrollments"}
        </p>

        {enrollments.length === 0 ? (
          <div className="bg-card rounded-2xl border border-border/50 p-8 text-center shadow-card">
            <p className="text-muted-foreground">No enrollments yet.</p>
          </div>
        ) : (
          <div className="space-y-3">
            {enrollments.map((e) => (
              <div key={e.id} className="bg-card rounded-2xl border border-border/50 p-5 shadow-card flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div>
                  <p className="font-semibold">{e.courses?.title || "Course"}</p>
                  <p className="text-sm text-muted-foreground">
                    {e.children?.name} · {e.courses?.duration} · {new Date(e.created_at).toLocaleDateString()}
                  </p>
                </div>
                <Badge variant="outline" className={statusColors[e.payment_status] || ""}>
                  {e.payment_status}
                </Badge>
              </div>
            ))}
          </div>
        )}
      </div>
    </DashboardLayout>
  );
};

export default EnrollmentsPage;
