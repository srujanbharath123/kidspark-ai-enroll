import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import DashboardLayout from "@/components/DashboardLayout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Plus, Edit2, Trash2, X, Check, Loader2 } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/contexts/AuthContext";

interface Course {
  id: string;
  title: string;
  description: string;
  duration: string;
  price: number;
  discount_price: number | null;
  features: string[] | null;
  is_active: boolean;
}

const emptyForm = { title: "", description: "", duration: "", price: "", discount_price: "", features: "", is_active: true };

const AdminCoursesPage = () => {
  const { role } = useAuth();
  const [courses, setCourses] = useState<Course[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState(emptyForm);
  const [saving, setSaving] = useState(false);
  const { toast } = useToast();

  const fetchCourses = async () => {
    const { data } = await supabase.from("courses").select("*").order("created_at");
    if (data) setCourses(data);
    setLoading(false);
  };

  useEffect(() => { fetchCourses(); }, []);

  const handleSave = async () => {
    if (!form.title.trim() || !form.duration.trim()) {
      toast({ title: "Missing fields", description: "Title and duration are required", variant: "destructive" });
      return;
    }
    setSaving(true);
    const payload = {
      title: form.title.trim(),
      description: form.description.trim(),
      duration: form.duration.trim(),
      price: parseFloat(form.price) || 0,
      discount_price: form.discount_price ? parseFloat(form.discount_price) : null,
      features: form.features ? form.features.split("\n").map((f) => f.trim()).filter(Boolean) : [],
      is_active: form.is_active,
    };

    try {
      if (editingId) {
        const { error } = await supabase.from("courses").update(payload).eq("id", editingId);
        if (error) throw error;
        toast({ title: "Course updated! ✅" });
      } else {
        const { error } = await supabase.from("courses").insert(payload);
        if (error) throw error;
        toast({ title: "Course created! 🎉" });
      }
      resetForm();
      fetchCourses();
    } catch (error: any) {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    } finally {
      setSaving(false);
    }
  };

  const handleEdit = (course: Course) => {
    setForm({
      title: course.title,
      description: course.description,
      duration: course.duration,
      price: String(course.price),
      discount_price: course.discount_price ? String(course.discount_price) : "",
      features: course.features?.join("\n") || "",
      is_active: course.is_active,
    });
    setEditingId(course.id);
    setShowForm(true);
  };

  const handleDelete = async (id: string) => {
    const { error } = await supabase.from("courses").delete().eq("id", id);
    if (error) {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    } else {
      toast({ title: "Course deleted" });
      fetchCourses();
    }
  };

  const resetForm = () => {
    setForm(emptyForm);
    setEditingId(null);
    setShowForm(false);
  };

  // Non-admin parents just see courses (redirect handled by ProtectedRoute)
  if (role !== "admin") return null;

  return (
    <DashboardLayout>
      <div className="max-w-3xl">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-2xl font-bold font-display">Manage Courses</h1>
            <p className="text-sm text-muted-foreground">Create, edit, and manage bootcamp courses</p>
          </div>
          <Button variant="hero" size="sm" onClick={() => { resetForm(); setShowForm(true); }}>
            <Plus className="w-4 h-4" /> New Course
          </Button>
        </div>

        {showForm && (
          <div className="bg-card rounded-2xl border border-border/50 p-6 shadow-card mb-6">
            <h3 className="font-display font-semibold mb-4">{editingId ? "Edit Course" : "New Course"}</h3>
            <div className="space-y-4">
              <div className="grid sm:grid-cols-2 gap-4">
                <div>
                  <Label>Title *</Label>
                  <Input value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} placeholder="Course title" className="mt-1.5 rounded-xl" />
                </div>
                <div>
                  <Label>Duration *</Label>
                  <Input value={form.duration} onChange={(e) => setForm({ ...form, duration: e.target.value })} placeholder="e.g. 3 Days, 4 Weeks" className="mt-1.5 rounded-xl" />
                </div>
              </div>
              <div>
                <Label>Description</Label>
                <Textarea value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} placeholder="Course description" className="mt-1.5 rounded-xl" rows={3} />
              </div>
              <div className="grid sm:grid-cols-2 gap-4">
                <div>
                  <Label>Price (₹)</Label>
                  <Input type="number" value={form.price} onChange={(e) => setForm({ ...form, price: e.target.value })} placeholder="10000" className="mt-1.5 rounded-xl" />
                </div>
                <div>
                  <Label>Discount Price (₹)</Label>
                  <Input type="number" value={form.discount_price} onChange={(e) => setForm({ ...form, discount_price: e.target.value })} placeholder="2500" className="mt-1.5 rounded-xl" />
                </div>
              </div>
              <div>
                <Label>Features (one per line)</Label>
                <Textarea value={form.features} onChange={(e) => setForm({ ...form, features: e.target.value })} placeholder={"Introduction to AI\nBuild real projects\nCertificate"} className="mt-1.5 rounded-xl" rows={4} />
              </div>
              <div className="flex items-center gap-3">
                <Switch checked={form.is_active} onCheckedChange={(checked) => setForm({ ...form, is_active: checked })} />
                <Label>Active (visible to parents)</Label>
              </div>
              <div className="flex gap-2">
                <Button variant="hero" size="sm" onClick={handleSave} disabled={saving}>
                  {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Check className="w-4 h-4" />}
                  {editingId ? "Update" : "Create"}
                </Button>
                <Button variant="outline" size="sm" onClick={resetForm}>
                  <X className="w-4 h-4" /> Cancel
                </Button>
              </div>
            </div>
          </div>
        )}

        {loading ? (
          <div className="flex justify-center py-12"><Loader2 className="w-8 h-8 animate-spin text-primary" /></div>
        ) : courses.length === 0 ? (
          <div className="bg-card rounded-2xl border border-border/50 p-8 text-center shadow-card">
            <p className="text-muted-foreground">No courses yet. Create your first course!</p>
          </div>
        ) : (
          <div className="space-y-3">
            {courses.map((course) => (
              <div key={course.id} className="bg-card rounded-2xl border border-border/50 p-5 shadow-card flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div className="flex-1">
                  <div className="flex items-center gap-2">
                    <p className="font-semibold">{course.title}</p>
                    {!course.is_active && (
                      <span className="text-xs bg-muted text-muted-foreground px-2 py-0.5 rounded-full">Inactive</span>
                    )}
                  </div>
                  <p className="text-sm text-muted-foreground">
                    {course.duration} · ₹{(course.discount_price || course.price).toLocaleString()}
                    {course.discount_price && <span className="line-through ml-1">₹{course.price.toLocaleString()}</span>}
                  </p>
                </div>
                <div className="flex gap-2">
                  <Button variant="ghost" size="icon" onClick={() => handleEdit(course)}><Edit2 className="w-4 h-4" /></Button>
                  <Button variant="ghost" size="icon" onClick={() => handleDelete(course.id)} className="text-destructive hover:text-destructive"><Trash2 className="w-4 h-4" /></Button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </DashboardLayout>
  );
};

export default AdminCoursesPage;
