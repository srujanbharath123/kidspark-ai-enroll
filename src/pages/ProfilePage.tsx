import { useEffect, useState, useRef } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import DashboardLayout from "@/components/DashboardLayout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import {
  User, Camera, Download, Edit2, Save, X, FileText, CreditCard, Loader2
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";

interface ChildWithDetails {
  id: string;
  name: string;
  age: number;
  class: string | null;
  school: string | null;
  photo_url: string | null;
}

interface Enrollment {
  id: string;
  course_id: string;
  payment_status: string;
  created_at: string;
  courses: { title: string; duration: string } | null;
}

const ProfilePage = () => {
  const { user, profile } = useAuth();
  const { toast } = useToast();
  const [children, setChildren] = useState<ChildWithDetails[]>([]);
  const [enrollments, setEnrollments] = useState<Record<string, Enrollment[]>>({});
  const [editingChildId, setEditingChildId] = useState<string | null>(null);
  const [editForm, setEditForm] = useState({ name: "", age: "", class_val: "", school: "" });
  const [uploadingPhotoId, setUploadingPhotoId] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [activePhotoChildId, setActivePhotoChildId] = useState<string | null>(null);

  useEffect(() => {
    if (user) fetchData();
  }, [user]);

  const fetchData = async () => {
    if (!user) return;
    setIsLoading(true);
    const { data: childData } = await supabase
      .from("children")
      .select("id, name, age, class, school, photo_url")
      .eq("parent_id", user.id)
      .order("created_at");

    if (childData) {
      setChildren(childData);
      // Fetch enrollments for each child
      const childIds = childData.map((c) => c.id);
      if (childIds.length > 0) {
        const { data: enrollData } = await supabase
          .from("enrollments")
          .select("id, child_id, course_id, payment_status, created_at, courses(title, duration)")
          .eq("parent_id", user.id)
          .in("child_id", childIds);

        if (enrollData) {
          const grouped: Record<string, Enrollment[]> = {};
          (enrollData as unknown as (Enrollment & { child_id: string })[]).forEach((e: any) => {
            if (!grouped[e.child_id]) grouped[e.child_id] = [];
            grouped[e.child_id].push(e);
          });
          setEnrollments(grouped);
        }
      }
    }
    setIsLoading(false);
  };

  const handlePhotoUpload = async (childId: string, file: File) => {
    if (!user) return;
    if (!file.type.startsWith("image/")) {
      toast({ title: "Invalid file", description: "Please upload an image file", variant: "destructive" });
      return;
    }
    if (file.size > 5 * 1024 * 1024) {
      toast({ title: "File too large", description: "Max 5MB allowed", variant: "destructive" });
      return;
    }

    setUploadingPhotoId(childId);
    const ext = file.name.split(".").pop();
    const path = `${user.id}/${childId}.${ext}`;

    const { error: uploadErr } = await supabase.storage
      .from("child-photos")
      .upload(path, file, { upsert: true });

    if (uploadErr) {
      toast({ title: "Upload failed", description: uploadErr.message, variant: "destructive" });
      setUploadingPhotoId(null);
      return;
    }

    const { data: urlData } = supabase.storage.from("child-photos").getPublicUrl(path);
    const photo_url = urlData.publicUrl + "?t=" + Date.now();

    await supabase.from("children").update({ photo_url }).eq("id", childId);
    toast({ title: "Photo uploaded! 📸" });
    setUploadingPhotoId(null);
    fetchData();
  };

  const startEdit = (child: ChildWithDetails) => {
    setEditingChildId(child.id);
    setEditForm({
      name: child.name,
      age: String(child.age),
      class_val: child.class || "",
      school: child.school || "",
    });
  };

  const handleSaveEdit = async () => {
    if (!editingChildId) return;
    const ageNum = parseInt(editForm.age);
    if (isNaN(ageNum) || ageNum < 4 || ageNum > 18) {
      toast({ title: "Invalid age", description: "Age must be between 4 and 18", variant: "destructive" });
      return;
    }
    await supabase.from("children").update({
      name: editForm.name.trim(),
      age: ageNum,
      class: editForm.class_val.trim() || null,
      school: editForm.school.trim() || null,
    }).eq("id", editingChildId);
    toast({ title: "Details updated! ✅" });
    setEditingChildId(null);
    fetchData();
  };

  const generateCertificate = (child: ChildWithDetails, enrollment: Enrollment) => {
    const canvas = document.createElement("canvas");
    canvas.width = 1200;
    canvas.height = 850;
    const ctx = canvas.getContext("2d")!;

    // Background
    const bg = ctx.createLinearGradient(0, 0, 1200, 850);
    bg.addColorStop(0, "#0f172a");
    bg.addColorStop(1, "#1e293b");
    ctx.fillStyle = bg;
    ctx.fillRect(0, 0, 1200, 850);

    // Border
    ctx.strokeStyle = "#f59e0b";
    ctx.lineWidth = 6;
    ctx.strokeRect(30, 30, 1140, 790);
    ctx.strokeStyle = "#f59e0b44";
    ctx.lineWidth = 2;
    ctx.strokeRect(45, 45, 1110, 760);

    // Header
    ctx.fillStyle = "#f59e0b";
    ctx.font = "bold 18px Arial";
    ctx.textAlign = "center";
    ctx.fillText("TECHWINDOWS", 600, 90);

    ctx.fillStyle = "#e2e8f0";
    ctx.font = "bold 42px Georgia";
    ctx.fillText("Certificate of Participation", 600, 150);

    // Decorative line
    ctx.strokeStyle = "#f59e0b";
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(300, 175);
    ctx.lineTo(900, 175);
    ctx.stroke();

    // Body
    ctx.fillStyle = "#94a3b8";
    ctx.font = "18px Arial";
    ctx.fillText("This is to certify that", 600, 240);

    ctx.fillStyle = "#ffffff";
    ctx.font = "bold 36px Georgia";
    ctx.fillText(child.name, 600, 295);

    ctx.fillStyle = "#94a3b8";
    ctx.font = "18px Arial";
    ctx.fillText("has successfully participated in", 600, 350);

    ctx.fillStyle = "#f59e0b";
    ctx.font = "bold 28px Georgia";
    ctx.fillText(enrollment.courses?.title || "AI Course", 600, 400);

    ctx.fillStyle = "#94a3b8";
    ctx.font = "16px Arial";
    ctx.fillText(`Duration: ${enrollment.courses?.duration || "N/A"}`, 600, 445);

    // Details
    ctx.fillStyle = "#64748b";
    ctx.font = "14px Arial";
    ctx.fillText(`Age: ${child.age} | Class: ${child.class || "N/A"} | School: ${child.school || "N/A"}`, 600, 500);

    // Date
    const date = new Date(enrollment.created_at).toLocaleDateString("en-IN", {
      day: "numeric", month: "long", year: "numeric",
    });
    ctx.fillText(`Enrolled on: ${date}`, 600, 540);

    // Signature lines
    ctx.strokeStyle = "#475569";
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(150, 700);
    ctx.lineTo(400, 700);
    ctx.stroke();
    ctx.beginPath();
    ctx.moveTo(800, 700);
    ctx.lineTo(1050, 700);
    ctx.stroke();

    ctx.fillStyle = "#94a3b8";
    ctx.font = "14px Arial";
    ctx.fillText("Program Director", 275, 730);
    ctx.fillText("TechWindows", 925, 730);

    // Footer
    ctx.fillStyle = "#475569";
    ctx.font = "12px Arial";
    ctx.fillText("TechWindows — Empowering Young Minds with AI & Technology", 600, 790);

    // Download
    const link = document.createElement("a");
    link.download = `${child.name}_Certificate.png`;
    link.href = canvas.toDataURL("image/png");
    link.click();
    toast({ title: "Certificate downloaded! 🎓" });
  };

  const generateIDCard = (child: ChildWithDetails) => {
    if (!child.photo_url) {
      toast({ title: "Photo required", description: "Please upload child's photo first", variant: "destructive" });
      return;
    }

    const img = new Image();
    img.crossOrigin = "anonymous";
    img.onload = () => {
      const canvas = document.createElement("canvas");
      canvas.width = 600;
      canvas.height = 380;
      const ctx = canvas.getContext("2d")!;

      // Background
      const bg = ctx.createLinearGradient(0, 0, 600, 380);
      bg.addColorStop(0, "#0f172a");
      bg.addColorStop(1, "#1e293b");
      ctx.fillStyle = bg;
      ctx.fillRect(0, 0, 600, 380);

      // Top accent bar
      const accent = ctx.createLinearGradient(0, 0, 600, 0);
      accent.addColorStop(0, "#f59e0b");
      accent.addColorStop(1, "#ef4444");
      ctx.fillStyle = accent;
      ctx.fillRect(0, 0, 600, 8);

      // Header
      ctx.fillStyle = "#f59e0b";
      ctx.font = "bold 20px Arial";
      ctx.textAlign = "center";
      ctx.fillText("TECHWINDOWS", 300, 45);

      ctx.fillStyle = "#94a3b8";
      ctx.font = "12px Arial";
      ctx.fillText("Student Identity Card", 300, 65);

      // Photo circle
      ctx.save();
      ctx.beginPath();
      ctx.arc(140, 180, 65, 0, Math.PI * 2);
      ctx.clip();
      ctx.drawImage(img, 75, 115, 130, 130);
      ctx.restore();

      // Photo border
      ctx.strokeStyle = "#f59e0b";
      ctx.lineWidth = 3;
      ctx.beginPath();
      ctx.arc(140, 180, 67, 0, Math.PI * 2);
      ctx.stroke();

      // Info
      ctx.textAlign = "left";
      ctx.fillStyle = "#ffffff";
      ctx.font = "bold 22px Arial";
      ctx.fillText(child.name, 240, 140);

      ctx.fillStyle = "#94a3b8";
      ctx.font = "14px Arial";
      ctx.fillText(`Age: ${child.age}`, 240, 170);
      ctx.fillText(`Class: ${child.class || "N/A"}`, 240, 195);
      ctx.fillText(`School: ${child.school || "N/A"}`, 240, 220);

      // Enrollments
      const childEnrollments = enrollments[child.id] || [];
      if (childEnrollments.length > 0) {
        ctx.fillStyle = "#f59e0b";
        ctx.font = "bold 12px Arial";
        ctx.fillText("ENROLLED COURSES:", 240, 255);
        ctx.fillStyle = "#cbd5e1";
        ctx.font = "12px Arial";
        childEnrollments.slice(0, 2).forEach((e, i) => {
          ctx.fillText(`• ${e.courses?.title || "Course"}`, 240, 275 + i * 18);
        });
      }

      // Footer
      ctx.fillStyle = "#1e293b";
      ctx.fillRect(0, 340, 600, 40);
      ctx.fillStyle = "#64748b";
      ctx.font = "11px Arial";
      ctx.textAlign = "center";
      ctx.fillText("TechWindows — Empowering Young Minds with AI & Technology", 300, 363);

      const link = document.createElement("a");
      link.download = `${child.name}_IDCard.png`;
      link.href = canvas.toDataURL("image/png");
      link.click();
      toast({ title: "ID Card downloaded! 🪪" });
    };
    img.onerror = () => {
      toast({ title: "Error", description: "Could not load photo. Please re-upload.", variant: "destructive" });
    };
    img.src = child.photo_url;
  };

  if (isLoading) {
    return (
      <DashboardLayout>
        <div className="flex items-center justify-center py-20">
          <Loader2 className="w-6 h-6 animate-spin text-primary" />
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      <div className="max-w-3xl">
        <div className="mb-6">
          <h1 className="text-2xl font-bold font-display flex items-center gap-2">
            <User className="w-6 h-6 text-primary" /> Profile
          </h1>
          <p className="text-sm text-muted-foreground">Manage children details, download certificates & ID cards</p>
        </div>

        {/* Parent Info */}
        <div className="bg-card rounded-2xl border border-border/50 p-6 shadow-card mb-6">
          <h2 className="font-display font-semibold mb-3">Parent Details</h2>
          <div className="grid sm:grid-cols-2 gap-3 text-sm">
            <div><span className="text-muted-foreground">Name:</span> <span className="font-medium">{profile?.full_name || "—"}</span></div>
            <div><span className="text-muted-foreground">Phone:</span> <span className="font-medium">{profile?.phone || "—"}</span></div>
            <div><span className="text-muted-foreground">Email:</span> <span className="font-medium">{profile?.email || "—"}</span></div>
          </div>
        </div>

        {/* Children */}
        {children.length === 0 ? (
          <div className="bg-card rounded-2xl border border-border/50 p-8 text-center shadow-card">
            <p className="text-muted-foreground">No children added yet. Go to "My Children" to add your child first.</p>
          </div>
        ) : (
          <div className="space-y-6">
            {children.map((child) => (
              <div key={child.id} className="bg-card rounded-2xl border border-border/50 shadow-card overflow-hidden">
                <div className="p-6">
                  <div className="flex items-start gap-4">
                    {/* Photo */}
                    <div className="relative flex-shrink-0">
                      <div className="w-20 h-20 rounded-xl bg-muted flex items-center justify-center overflow-hidden border-2 border-border">
                        {child.photo_url ? (
                          <img src={child.photo_url} alt={child.name} className="w-full h-full object-cover" />
                        ) : (
                          <User className="w-8 h-8 text-muted-foreground" />
                        )}
                      </div>
                      <button
                        onClick={() => {
                          setActivePhotoChildId(child.id);
                          fileInputRef.current?.click();
                        }}
                        disabled={uploadingPhotoId === child.id}
                        className="absolute -bottom-1 -right-1 w-7 h-7 rounded-full bg-primary text-primary-foreground flex items-center justify-center shadow-md hover:scale-110 transition-transform"
                      >
                        {uploadingPhotoId === child.id ? (
                          <Loader2 className="w-3.5 h-3.5 animate-spin" />
                        ) : (
                          <Camera className="w-3.5 h-3.5" />
                        )}
                      </button>
                    </div>

                    {/* Details */}
                    <div className="flex-1 min-w-0">
                      {editingChildId === child.id ? (
                        <div className="space-y-3">
                          <div className="grid sm:grid-cols-2 gap-3">
                            <div>
                              <Label className="text-xs">Name</Label>
                              <Input value={editForm.name} onChange={(e) => setEditForm({ ...editForm, name: e.target.value })} className="mt-1 rounded-xl h-9 text-sm" />
                            </div>
                            <div>
                              <Label className="text-xs">Age</Label>
                              <Input type="number" min={4} max={18} value={editForm.age} onChange={(e) => setEditForm({ ...editForm, age: e.target.value })} className="mt-1 rounded-xl h-9 text-sm" />
                            </div>
                            <div>
                              <Label className="text-xs">Class</Label>
                              <Input value={editForm.class_val} onChange={(e) => setEditForm({ ...editForm, class_val: e.target.value })} placeholder="e.g. 8th" className="mt-1 rounded-xl h-9 text-sm" />
                            </div>
                            <div>
                              <Label className="text-xs">School</Label>
                              <Input value={editForm.school} onChange={(e) => setEditForm({ ...editForm, school: e.target.value })} placeholder="School name" className="mt-1 rounded-xl h-9 text-sm" />
                            </div>
                          </div>
                          <div className="flex gap-2">
                            <Button size="sm" variant="hero" onClick={handleSaveEdit}><Save className="w-3.5 h-3.5" /> Save</Button>
                            <Button size="sm" variant="outline" onClick={() => setEditingChildId(null)}><X className="w-3.5 h-3.5" /> Cancel</Button>
                          </div>
                        </div>
                      ) : (
                        <>
                          <div className="flex items-center gap-2 mb-1">
                            <h3 className="font-display font-bold text-lg">{child.name}</h3>
                            <button onClick={() => startEdit(child)} className="text-muted-foreground hover:text-primary transition-colors">
                              <Edit2 className="w-3.5 h-3.5" />
                            </button>
                          </div>
                          <div className="flex flex-wrap gap-x-4 gap-y-1 text-sm text-muted-foreground">
                            <span>Age: {child.age}</span>
                            <span>Class: {child.class || "—"}</span>
                            <span>School: {child.school || "—"}</span>
                          </div>
                        </>
                      )}
                    </div>
                  </div>

                  {/* Enrollments */}
                  {(enrollments[child.id] || []).length > 0 && (
                    <div className="mt-4 pt-4 border-t border-border/50">
                      <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2">Enrolled Courses</p>
                      <div className="space-y-2">
                        {enrollments[child.id].map((enrollment) => (
                          <div key={enrollment.id} className="flex items-center justify-between bg-muted/50 rounded-xl px-3 py-2">
                            <div>
                              <p className="text-sm font-medium">{enrollment.courses?.title}</p>
                              <p className="text-xs text-muted-foreground">{enrollment.courses?.duration} • Enrolled {new Date(enrollment.created_at).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" })}</p>
                            </div>
                            <div className="flex items-center gap-2">
                              <Badge variant="outline" className={enrollment.payment_status === "completed" ? "bg-green-500/10 text-green-600 border-green-500/20" : "bg-amber-500/10 text-amber-600 border-amber-500/20"}>
                                {enrollment.payment_status}
                              </Badge>
                              <Button
                                size="sm"
                                variant="ghost"
                                className="h-7 text-xs"
                                onClick={() => generateCertificate(child, enrollment)}
                              >
                                <FileText className="w-3.5 h-3.5" /> Certificate
                              </Button>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>

                {/* Actions footer */}
                <div className="bg-muted/30 border-t border-border/50 px-6 py-3 flex gap-2">
                  <Button size="sm" variant="outline" className="text-xs" onClick={() => generateIDCard(child)}>
                    <CreditCard className="w-3.5 h-3.5" /> Download ID Card
                  </Button>
                  {(enrollments[child.id] || []).length > 0 && (
                    <Button
                      size="sm"
                      variant="outline"
                      className="text-xs"
                      onClick={() => generateCertificate(child, enrollments[child.id][0])}
                    >
                      <Download className="w-3.5 h-3.5" /> Download Certificate
                    </Button>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Hidden file input */}
        <input
          ref={fileInputRef}
          type="file"
          accept="image/*"
          className="hidden"
          onChange={(e) => {
            const file = e.target.files?.[0];
            if (file && activePhotoChildId) {
              handlePhotoUpload(activePhotoChildId, file);
            }
            e.target.value = "";
          }}
        />
      </div>
    </DashboardLayout>
  );
};

export default ProfilePage;
