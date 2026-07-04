import { NavLink, useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import {
  LayoutDashboard,
  Mic2,
  Disc3,
  Music,
  ListMusic,
  Settings,
  LogOut,
  ChevronLeft,
  Music2,
  Users,
  Bell,
  X,
} from "lucide-react";
import { cn } from "@/utils";
import { toast } from "sonner";

const navItems = [
  { to: "/dashboard", icon: LayoutDashboard, label: "Dashboard" },
  { to: "/artists", icon: Mic2, label: "Artists" },
  { to: "/albums", icon: Disc3, label: "Albums" },
  { to: "/songs", icon: Music, label: "Songs" },
  { to: "/playlists", icon: ListMusic, label: "Playlists" },
  { to: "/browse", icon: Music2, label: "Browse" },
  { to: "/users", icon: Users, label: "Users" },
  { to: "/notifications", icon: Bell, label: "Notifications" },
  { to: "/settings", icon: Settings, label: "Settings" },
];

interface SidebarProps {
  collapsed: boolean;
  onToggle: () => void;
  mobileOpen?: boolean;
  onMobileClose?: () => void;
}

export default function Sidebar({ collapsed, onToggle, mobileOpen = false, onMobileClose }: SidebarProps) {
  const navigate = useNavigate();

  const handleLogout = () => {
    toast.success("Logged out successfully");
    if (onMobileClose) onMobileClose();
    setTimeout(() => navigate("/login"), 500);
  };

  const sidebarContent = (
    <div className="h-full flex flex-col bg-surface-1 border-r border-white/8">
      {/* Logo */}
      <div className="flex items-center gap-3 px-4 h-16 border-b border-white/8 flex-shrink-0">
        <div className="w-9 h-9 rounded-xl bg-purple-gradient flex items-center justify-center flex-shrink-0 shadow-glow-purple-sm">
          <Music2 size={18} className="text-white" />
        </div>
        <div className="overflow-hidden whitespace-nowrap flex-1">
          <span className="text-base font-bold text-gradient">Musify</span>
          <span className="text-xs text-muted-foreground block -mt-0.5">Admin Panel</span>
        </div>

        {/* Desktop Collapse Toggle */}
        <button
          onClick={onToggle}
          className={cn(
            "hidden md:flex p-1.5 rounded-lg text-muted-foreground hover:text-foreground hover:bg-white/8 transition flex-shrink-0",
            collapsed && "mx-auto"
          )}
        >
          <motion.div animate={{ rotate: collapsed ? 180 : 0 }} transition={{ duration: 0.25 }}>
            <ChevronLeft size={16} />
          </motion.div>
        </button>

        {/* Mobile Close Button */}
        {onMobileClose && (
          <button
            onClick={onMobileClose}
            className="md:hidden p-1.5 rounded-lg text-muted-foreground hover:text-foreground hover:bg-white/8 transition"
          >
            <X size={18} />
          </button>
        )}
      </div>

      {/* Navigation */}
      <nav className="flex-1 overflow-y-auto overflow-x-hidden py-4 px-3 space-y-1.5">
        {navItems.map(({ to, icon: Icon, label }) => (
          <NavLink
            key={to}
            to={to}
            onClick={() => {
              if (onMobileClose) onMobileClose();
            }}
            className={({ isActive }) =>
              cn(
                "nav-item relative group flex items-center gap-3 px-3 py-3 rounded-xl text-sm font-medium transition-all duration-200",
                isActive ? "text-foreground bg-purple-600/20 text-purple-300" : "text-muted-foreground hover:text-foreground hover:bg-white/5",
                collapsed && "md:justify-center md:px-0"
              )
            }
          >
            {({ isActive }) => (
              <>
                <Icon
                  size={18}
                  className={cn(
                    "flex-shrink-0 relative z-10 transition-colors",
                    isActive ? "text-purple-400" : "text-muted-foreground group-hover:text-foreground"
                  )}
                />
                <span className={cn("relative z-10 whitespace-nowrap text-sm font-semibold", collapsed && "md:hidden")}>
                  {label}
                </span>
              </>
            )}
          </NavLink>
        ))}
      </nav>

      {/* Logout */}
      <div className="p-3 border-t border-white/8 flex-shrink-0">
        <button
          onClick={handleLogout}
          className={cn(
            "w-full flex items-center gap-3 px-3 py-3 rounded-xl text-sm font-semibold text-muted-foreground hover:text-red-400 hover:bg-red-500/8 transition-all duration-200",
            collapsed && "md:justify-center md:px-0"
          )}
        >
          <LogOut size={18} className="flex-shrink-0" />
          <span className={cn("whitespace-nowrap", collapsed && "md:hidden")}>Logout</span>
        </button>
      </div>
    </div>
  );

  return (
    <>
      {/* Desktop Sidebar */}
      <motion.aside
        animate={{ width: collapsed ? 72 : 240 }}
        transition={{ duration: 0.25, ease: "easeInOut" }}
        className="hidden md:block flex-shrink-0 h-screen sticky top-0 z-30"
      >
        {sidebarContent}
      </motion.aside>

      {/* Mobile Drawer */}
      <AnimatePresence>
        {mobileOpen && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={onMobileClose}
              className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm md:hidden"
            />
            <motion.aside
              initial={{ x: "-100%" }}
              animate={{ x: 0 }}
              exit={{ x: "-100%" }}
              transition={{ type: "spring", damping: 25, stiffness: 250 }}
              className="fixed left-0 top-0 bottom-0 z-50 w-72 md:hidden"
            >
              {sidebarContent}
            </motion.aside>
          </>
        )}
      </AnimatePresence>
    </>
  );
}
