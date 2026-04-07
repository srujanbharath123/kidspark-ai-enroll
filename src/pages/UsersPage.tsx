import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import DashboardLayout from "@/components/DashboardLayout";
import { Badge } from "@/components/ui/badge";

interface UserProfile {
  id: string;
  user_id: string;
  full_name: string;
  phone: string | null;
  created_at: string;
}

const UsersPage = () => {
  const [users, setUsers] = useState<UserProfile[]>([]);

  useEffect(() => {
    const fetchUsers = async () => {
      const { data } = await supabase.from("profiles").select("*").order("created_at", { ascending: false });
      if (data) setUsers(data);
    };
    fetchUsers();
  }, []);

  return (
    <DashboardLayout>
      <div>
        <h1 className="text-2xl font-bold font-display mb-2">Users</h1>
        <p className="text-sm text-muted-foreground mb-8">All registered users</p>

        {users.length === 0 ? (
          <div className="bg-card rounded-2xl border border-border/50 p-8 text-center shadow-card">
            <p className="text-muted-foreground">No users yet.</p>
          </div>
        ) : (
          <div className="space-y-3">
            {users.map((u) => (
              <div key={u.id} className="bg-card rounded-2xl border border-border/50 p-4 shadow-card flex items-center justify-between">
                <div>
                  <p className="font-semibold">{u.full_name || "Unnamed"}</p>
                  <p className="text-xs text-muted-foreground">
                    {u.phone || "No phone"} · Joined {new Date(u.created_at).toLocaleDateString()}
                  </p>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </DashboardLayout>
  );
};

export default UsersPage;
