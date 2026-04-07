import { useEffect, useState } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import DashboardLayout from "@/components/DashboardLayout";
import { Button } from "@/components/ui/button";
import { Clock, Check, ArrowRight, Zap, BookOpen } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { useNavigate } from "react-router-dom";

interface Course {
  id: string;
  title: string;
  description: string;
  duration: string;
  price: number;
  discount_price: number | null;
  features: string[] | null;
}

interface Child {
  id: string;
  name: string;
  age: number;
}

const CoursesPage = () => {
  const { user, role } = useAuth();
  const [courses, setCourses] = useState<Course[]>([]);
  const [children, setChildren] = useState<Child[]>([]);
  const [enrolling, setEnrolling] = useState<string | null>(null);
  const [selectedChild, setSelectedChild] = useState<string>("");
  const { toast } = useToast();
  const navigate = useNavigate();

  useEffect(() => {
    const fetchData = async () => {
      const { data: coursesData } = await supabase.from("courses").select("*").eq("is_active", true);
      if (coursesData) setCourses(coursesData);

      if (user && role === "parent") {
        const { data: childrenData } = await supabase.from("children").select("*").eq("parent_id", user.id);
        if (childrenData) setChildren(childrenData);
      }
    };
    fetchData();
  }, [user, role]);

  const handleEnroll = async (courseId: string) => {
    if (!user || !selectedChild) return;
    try {
      const { error } = await supabase.from("enrollments").insert({
        parent_id: user.id,
        child_id: selectedChild,
        course_id: courseId,
        payment_status: "pending",
      });
      if (error) throw error;
      toast({ title: "Enrolled successfully! 🎉", description: "Proceed to payment to confirm." });
      setEnrolling(null);
      setSelectedChild("");
    } catch (error: any) {
      toast({ title: "Enrollment failed", description: error.message, variant: "destructive" });
    }
  };

  const icons: Record<string, React.ReactNode> = {
    "3-Day AI Crash Course": <Zap className="w-6 h-6" />,
    "1-Month AI Program": <BookOpen className="w-6 h-6" />,
  };

  return (
    <DashboardLayout>
      <div>
        <h1 className="text-2xl font-bold font-display mb-2">Available Courses</h1>
        <p className="text-sm text-muted-foreground mb-8">Browse and enroll in our AI bootcamp programs</p>

        <div className="grid md:grid-cols-2 gap-6 max-w-4xl">
          {courses.map((course) => (
            <div key={course.id} className="bg-card rounded-2xl border border-border/50 p-6 shadow-card hover:shadow-elevated transition-all">
              <div className="w-12 h-12 rounded-2xl bg-primary/10 flex items-center justify-center mb-4 text-primary">
                {icons[course.title] || <BookOpen className="w-6 h-6" />}
              </div>
              <h3 className="text-xl font-bold font-display mb-1">{course.title}</h3>
              <div className="flex items-center gap-2 text-sm text-muted-foreground mb-3">
                <Clock className="w-4 h-4" /> {course.duration}
              </div>
              <p className="text-sm text-muted-foreground mb-4">{course.description}</p>

              <div className="flex items-baseline gap-2 mb-4">
                <span className="text-3xl font-bold font-display">₹{(course.discount_price || course.price).toLocaleString()}</span>
                {course.discount_price && (
                  <span className="text-sm text-muted-foreground line-through">₹{course.price.toLocaleString()}</span>
                )}
              </div>

              {course.features && (
                <ul className="space-y-2 mb-6">
                  {course.features.map((f) => (
                    <li key={f} className="flex items-start gap-2 text-sm">
                      <Check className="w-4 h-4 text-success mt-0.5 shrink-0" />
                      <span className="text-muted-foreground">{f}</span>
                    </li>
                  ))}
                </ul>
              )}

              {role === "parent" && (
                <>
                  {enrolling === course.id ? (
                    <div className="space-y-3">
                      {children.length === 0 ? (
                        <div>
                          <p className="text-sm text-muted-foreground mb-2">Please add a child first</p>
                          <Button variant="outline" size="sm" onClick={() => navigate("/dashboard/children")}>
                            Add Child
                          </Button>
                        </div>
                      ) : (
                        <>
                          <select
                            value={selectedChild}
                            onChange={(e) => setSelectedChild(e.target.value)}
                            className="w-full rounded-xl border border-border bg-background px-3 py-2.5 text-sm"
                          >
                            <option value="">Select a child</option>
                            {children.map((child) => (
                              <option key={child.id} value={child.id}>{child.name} (age {child.age})</option>
                            ))}
                          </select>
                          <div className="flex gap-2">
                            <Button variant="hero" size="sm" onClick={() => handleEnroll(course.id)} disabled={!selectedChild} className="flex-1">
                              Confirm Enrollment
                            </Button>
                            <Button variant="outline" size="sm" onClick={() => setEnrolling(null)}>Cancel</Button>
                          </div>
                        </>
                      )}
                    </div>
                  ) : (
                    <Button variant="hero" className="w-full" onClick={() => setEnrolling(course.id)}>
                      Enroll Now <ArrowRight className="w-4 h-4" />
                    </Button>
                  )}
                </>
              )}
            </div>
          ))}
        </div>
      </div>
    </DashboardLayout>
  );
};

export default CoursesPage;
