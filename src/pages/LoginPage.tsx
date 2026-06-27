import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { Mail, Lock, Eye, EyeOff, Music2, ArrowRight, Loader2 } from "lucide-react";
import { toast } from "sonner";

export default function LoginPage() {
  const navigate = useNavigate();
  const [email, setEmail] = useState("admin@musify.io");
  const [password, setPassword] = useState("password");
  const [showPw, setShowPw] = useState(false);
  const [rememberMe, setRememberMe] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    // Simulate auth delay
    await new Promise((r) => setTimeout(r, 1200));
    toast.success("Welcome back, Admin!");
    navigate("/dashboard");
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 24 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, ease: "easeOut" }}
    >
      {/* Card */}
      <div className="bg-surface-2 border border-white/10 rounded-3xl p-8 shadow-2xl">
        {/* Logo */}
        <div className="flex items-center gap-3 mb-8">
          <div className="w-11 h-11 rounded-2xl bg-purple-gradient flex items-center justify-center shadow-glow-purple-sm">
            <Music2 size={22} className="text-white" />
          </div>
          <div>
            <h1 className="text-xl font-bold text-gradient">Musify</h1>
            <p className="text-xs text-muted-foreground">Admin Panel</p>
          </div>
        </div>

        <div className="mb-8">
          <h2 className="text-2xl font-bold text-foreground">Welcome back</h2>
          <p className="mt-1.5 text-sm text-muted-foreground">
            Sign in to your admin account to continue
          </p>
        </div>

        <form onSubmit={handleLogin} className="space-y-5">
          {/* Email */}
          <div className="space-y-2">
            <label className="text-sm font-medium text-foreground" htmlFor="email">
              Email address
            </label>
            <div className="relative">
              <Mail size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-muted-foreground" />
              <input
                id="email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="admin@musify.io"
                required
                className="w-full pl-10 pr-4 py-3 bg-surface-3 border border-white/8 rounded-xl text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-purple-600/40 focus:border-purple-600/30 transition-all"
              />
            </div>
          </div>

          {/* Password */}
          <div className="space-y-2">
            <label className="text-sm font-medium text-foreground" htmlFor="password">
              Password
            </label>
            <div className="relative">
              <Lock size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-muted-foreground" />
              <input
                id="password"
                type={showPw ? "text" : "password"}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                required
                className="w-full pl-10 pr-12 py-3 bg-surface-3 border border-white/8 rounded-xl text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-purple-600/40 focus:border-purple-600/30 transition-all"
              />
              <button
                type="button"
                onClick={() => setShowPw(!showPw)}
                className="absolute right-3.5 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition"
              >
                {showPw ? <EyeOff size={16} /> : <Eye size={16} />}
              </button>
            </div>
          </div>

          {/* Remember me + Forgot */}
          <div className="flex items-center justify-between">
            <label className="flex items-center gap-2.5 cursor-pointer">
              <div
                onClick={() => setRememberMe(!rememberMe)}
                className={`w-4.5 h-4.5 rounded flex items-center justify-center border transition-all cursor-pointer ${
                  rememberMe
                    ? "bg-purple-600 border-purple-600"
                    : "bg-surface-3 border-white/15"
                }`}
              >
                {rememberMe && (
                  <svg viewBox="0 0 12 12" className="w-3 h-3 text-white fill-none stroke-white stroke-2">
                    <path d="M2 6l3 3 5-5" strokeLinecap="round" strokeLinejoin="round" />
                  </svg>
                )}
              </div>
              <span className="text-sm text-muted-foreground">Remember me</span>
            </label>
            <button
              type="button"
              className="text-sm text-purple-400 hover:text-purple-300 transition font-medium"
            >
              Forgot password?
            </button>
          </div>

          {/* Submit */}
          <motion.button
            type="submit"
            disabled={loading}
            whileHover={{ scale: loading ? 1 : 1.01 }}
            whileTap={{ scale: loading ? 1 : 0.99 }}
            className="w-full flex items-center justify-center gap-2.5 py-3 px-6 bg-purple-gradient text-white font-semibold rounded-xl shadow-glow-purple-sm hover:shadow-glow-purple transition-all duration-200 disabled:opacity-70 disabled:cursor-not-allowed"
          >
            {loading ? (
              <>
                <Loader2 size={18} className="animate-spin" />
                Signing in…
              </>
            ) : (
              <>
                Sign In
                <ArrowRight size={18} />
              </>
            )}
          </motion.button>
        </form>

        {/* Divider */}
        <div className="mt-6 pt-6 border-t border-white/8 text-center">
          <p className="text-xs text-muted-foreground">
            Protected by Musify Security · Admin access only
          </p>
        </div>
      </div>

      {/* Demo credentials notice */}
      <motion.p
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.5 }}
        className="mt-4 text-center text-xs text-muted-foreground"
      >
        Demo credentials pre-filled — click{" "}
        <span className="text-purple-400 font-medium">Sign In</span> to continue
      </motion.p>
    </motion.div>
  );
}
