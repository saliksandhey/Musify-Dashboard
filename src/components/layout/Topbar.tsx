import { Bell, Menu, Settings, User } from "lucide-react";
import { useLocation } from "react-router-dom";
import { motion } from "framer-motion";

const routeTitles: Record<string, string> = {
  "/dashboard": "Dashboard",
  "/artists": "Artists",
  "/albums": "Albums",
  "/songs": "Songs",
  "/playlists": "Playlists",
  "/settings": "Settings",
};

interface TopbarProps {
  onMobileMenuOpen?: () => void;
}

export default function Topbar({ onMobileMenuOpen }: TopbarProps) {
  const location = useLocation();
  const title = routeTitles[location.pathname] ?? "Musify Admin";

  return (
    <header className="h-16 border-b border-white/8 bg-surface-1/90 backdrop-blur-xl flex items-center px-4 sm:px-6 gap-3 sticky top-0 z-20">
      {/* Mobile Hamburger Menu Trigger */}
      <button
        onClick={onMobileMenuOpen}
        className="md:hidden p-2 rounded-xl text-muted-foreground hover:text-foreground hover:bg-white/8 transition"
        title="Open menu"
      >
        <Menu size={20} />
      </button>

      <motion.h2
        key={title}
        initial={{ opacity: 0, y: -4 }}
        animate={{ opacity: 1, y: 0 }}
        className="text-base font-bold text-foreground truncate"
      >
        {title}
      </motion.h2>

      <div className="flex-1" />

      {/* Notifications */}
      <button className="relative p-2 rounded-xl text-muted-foreground hover:text-foreground hover:bg-white/8 transition">
        <Bell size={18} />
        <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-purple-500 rounded-full ring-2 ring-surface-1" />
      </button>

      {/* Settings icon */}
      <button className="hidden sm:flex p-2 rounded-xl text-muted-foreground hover:text-foreground hover:bg-white/8 transition">
        <Settings size={18} />
      </button>

      {/* Avatar */}
      <div className="flex items-center gap-2.5 pl-2 border-l border-white/8">
        <div className="w-8 h-8 rounded-full bg-purple-gradient flex items-center justify-center shadow-sm">
          <User size={15} className="text-white" />
        </div>
        <div className="hidden lg:block">
          <p className="text-xs font-bold text-foreground">Admin</p>
          <p className="text-[10px] text-muted-foreground">admin@musify.io</p>
        </div>
      </div>
    </header>
  );
}
