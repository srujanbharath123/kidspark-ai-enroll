import { Link, useNavigate, useLocation } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";
import {
  Sparkles, LayoutDashboard, BookOpen, Users, Calendar,
  CreditCard, Settings, LogOut, Menu, X, UserPlus, BarChart3
} from "lucide-react";
import { useState } from "react";

const DashboardLayout = ({ children }: { children: React.ReactNode }) => {
  const { profile, role, signOut } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [sidebarOpen, setSidebarOpen] = useState(false);

  const handleSignOut = async () => {
    await signOut();
    navigate("/");
  };

  const parentLinks = [
    { href: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
    { href: "/dashboard/children", label: "My Children", icon: Users },
    { href: "/dashboard/courses", label: "Courses", icon: BookOpen },
    { href: "/dashboard/enrollments", label: "Enrollments", icon: CreditCard },
    { href: "/dashboard/sessions", label: "Sessions", icon: Calendar },
  ];

  const trainerLinks = [
    { href: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
    { href: "/dashboard/availability", label: "Availability", icon: Calendar },
    { href: "/dashboard/sessions", label: "Sessions", icon: Calendar },
  ];

  const adminLinks = [
    { href: "/dashboard", label: "Dashboard", icon: BarChart3 },
    { href: "/dashboard/manage-courses", label: "Courses", icon: BookOpen },
    { href: "/dashboard/enrollments", label: "Enrollments", icon: CreditCard },
    { href: "/dashboard/users", label: "Users", icon: Users },
    { href: "/dashboard/sessions", label: "Sessions", icon: Calendar },
  ];

  const links = role === "admin" ? adminLinks : role === "trainer" ? trainerLinks : parentLinks;

  const NavContent = () => (
    <div className="flex flex-col h-full">
      <div className="p-4 border-b border-border/50">
        <Link to="/" className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-lg gradient-primary flex items-center justify-center">
            <Sparkles className="w-4 h-4 text-primary-foreground" />
          </div>
          <span className="font-display text-lg font-bold">TechWindows</span>
        </Link>
      </div>

      <nav className="flex-1 p-3 space-y-1">
        {links.map((link) => {
          const isActive = location.pathname === link.href;
          return (
            <Link
              key={link.href}
              to={link.href}
              onClick={() => setSidebarOpen(false)}
              className={`flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all ${
                isActive
                  ? "bg-primary/10 text-primary"
                  : "text-muted-foreground hover:bg-muted hover:text-foreground"
              }`}
            >
              <link.icon className="w-4 h-4" />
              {link.label}
            </Link>
          );
        })}
      </nav>

      <div className="p-3 border-t border-border/50">
        <div className="px-3 py-2 mb-2">
          <p className="text-sm font-semibold truncate">{profile?.full_name || "User"}</p>
          <p className="text-xs text-muted-foreground capitalize">{role}</p>
        </div>
        <button
          onClick={handleSignOut}
          className="flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium text-muted-foreground hover:bg-destructive/10 hover:text-destructive transition-all w-full"
        >
          <LogOut className="w-4 h-4" /> Sign Out
        </button>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-muted/30">
      {/* Mobile header */}
      <div className="lg:hidden fixed top-0 left-0 right-0 z-50 bg-card border-b border-border/50 h-14 flex items-center px-4">
        <button onClick={() => setSidebarOpen(!sidebarOpen)} className="text-foreground">
          {sidebarOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
        </button>
        <span className="font-display text-lg font-bold ml-3">TechWindows</span>
      </div>

      {/* Sidebar */}
      <aside className={`fixed top-0 left-0 z-40 h-full w-64 bg-card border-r border-border/50 transition-transform duration-300 ${
        sidebarOpen ? "translate-x-0" : "-translate-x-full"
      } lg:translate-x-0`}>
        <NavContent />
      </aside>

      {/* Overlay */}
      {sidebarOpen && (
        <div className="fixed inset-0 z-30 bg-foreground/20 lg:hidden" onClick={() => setSidebarOpen(false)} />
      )}

      {/* Main content */}
      <main className="lg:ml-64 pt-14 lg:pt-0 min-h-screen">
        <div className="p-6 lg:p-8">{children}</div>
      </main>
    </div>
  );
};

export default DashboardLayout;
