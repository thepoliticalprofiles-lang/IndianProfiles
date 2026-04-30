import { Link, useLocation, useNavigate } from "react-router-dom";
import { 
  LayoutDashboard, 
  MapPin, 
  Users, 
  FileText, 
  MessageSquare, 
  UserPlus, 
  Calendar,
  LogOut,
  Menu,
  X,
  ChevronRight,
  Vote,
  Share2,
  Upload,
  Shield
} from "lucide-react";
import { useState } from "react";
import { useAuth } from "../../App";

const brandLogo = "/logo/indian-profiles-logo.png";

const navItems = [
  { path: "/admin", icon: LayoutDashboard, label: "Dashboard" },
  { path: "/admin/voter-analytics", icon: Vote, label: "Voter Analytics", permission: "voter" },
  { path: "/admin/social-hub", icon: Share2, label: "Social Media Hub", permission: "social" },
  { path: "/admin/geography", icon: MapPin, label: "Geography Manager" },
  { path: "/admin/leaders", icon: Users, label: "Profile Manager" },
  { path: "/admin/articles", icon: FileText, label: "Article Editor" },
  { path: "/admin/grievances", icon: MessageSquare, label: "Grievance Desk" },
  { path: "/admin/volunteers", icon: UserPlus, label: "Volunteers" },
  { path: "/admin/events", icon: Calendar, label: "Events" },
  { path: "/admin/data-ingestion", icon: Upload, label: "Data Ingestion", superAdmin: true },
  { path: "/admin/user-management", icon: Shield, label: "User Management", superAdmin: true },
];

const AdminSidebar = () => {
  const [isOpen, setIsOpen] = useState(false);
  const location = useLocation();
  const navigate = useNavigate();
  const { user, logout } = useAuth();

  const handleLogout = async () => {
    await logout();
    navigate("/admin/login");
  };

  return (
    <>
      {/* Mobile toggle button */}
      <button
        className="lg:hidden fixed top-4 left-4 z-50 p-2 bg-white rounded-lg shadow-md"
        onClick={() => setIsOpen(!isOpen)}
        data-testid="sidebar-toggle"
      >
        {isOpen ? <X className="w-6 h-6 text-stone-700" /> : <Menu className="w-6 h-6 text-stone-700" />}
      </button>

      {/* Overlay */}
      {isOpen && (
        <div 
          className="lg:hidden fixed inset-0 bg-black/50 z-40"
          onClick={() => setIsOpen(false)}
        />
      )}

      {/* Sidebar */}
      <aside 
        className={`admin-sidebar fixed lg:fixed top-0 left-0 bg-white border-r border-stone-200 flex flex-col z-40 transition-transform lg:translate-x-0 ${isOpen ? 'translate-x-0' : '-translate-x-full'}`}
        data-testid="admin-sidebar"
      >
        {/* Logo */}
        <div className="p-6 border-b border-stone-200">
          <Link to="/admin" className="flex items-center gap-3" data-testid="admin-logo">
            <img src={brandLogo} alt="Indian Profiles" className="h-10 w-auto object-contain" />
            <div className="leading-tight">
              <div className="text-[9px] font-semibold uppercase tracking-[0.18em] text-brand-orange">The</div>
              <div>
                <span className="text-base font-extrabold text-brand-navy">Indian</span>
                <span className="text-base font-extrabold text-brand-magenta ml-1">Profiles</span>
              </div>
              <p className="text-[10px] text-stone-500 uppercase tracking-wider">Dashboard</p>
            </div>
          </Link>
        </div>

        {/* Navigation */}
        <nav className="flex-1 p-4 space-y-1 overflow-y-auto">
          {navItems.map((item) => {
            const isActive = location.pathname === item.path || 
              (item.path !== "/admin" && location.pathname.startsWith(item.path));
            
            return (
              <Link
                key={item.path}
                to={item.path}
                onClick={() => setIsOpen(false)}
                className={`flex items-center gap-3 px-4 py-3 rounded-lg font-medium transition-all ${
                  isActive 
                    ? 'bg-brand-navy/10 text-brand-navy border-l-4 border-brand-orange' 
                    : 'text-stone-600 hover:bg-stone-50 hover:text-stone-900'
                }`}
                data-testid={`nav-${item.label.toLowerCase().replace(/\s+/g, '-')}`}
              >
                <item.icon className="w-5 h-5" />
                <span>{item.label}</span>
                {isActive && <ChevronRight className="w-4 h-4 ml-auto" />}
              </Link>
            );
          })}
        </nav>

        {/* User section */}
        <div className="p-4 border-t border-stone-200">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-10 h-10 bg-brand-orange/15 rounded-full flex items-center justify-center">
              <span className="text-brand-orange font-semibold">{user?.name?.charAt(0) || 'A'}</span>
            </div>
            <div>
              <p className="font-medium text-stone-900">{user?.name || 'Admin'}</p>
              <p className="text-xs text-stone-500">{user?.role || 'Administrator'}</p>
            </div>
          </div>
          <button
            onClick={handleLogout}
            className="flex items-center gap-3 w-full px-4 py-3 text-stone-600 hover:bg-red-50 hover:text-red-600 rounded-lg transition-all"
            data-testid="logout-button"
          >
            <LogOut className="w-5 h-5" />
            <span>Logout</span>
          </button>
        </div>
      </aside>
    </>
  );
};

export default AdminSidebar;
