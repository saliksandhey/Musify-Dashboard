import { useRouteError, useNavigate } from "react-router-dom";
import { AlertTriangle, RotateCcw } from "lucide-react";

export default function ErrorBoundary() {
  const error = useRouteError() as Error;
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-surface-0 flex items-center justify-center p-6 text-center">
      <div className="glass-card p-8 max-w-md w-full space-y-4 border border-red-500/20 shadow-2xl">
        <div className="w-14 h-14 rounded-2xl bg-red-500/10 text-red-400 flex items-center justify-center mx-auto mb-2">
          <AlertTriangle size={28} />
        </div>
        <h2 className="text-xl font-bold text-foreground">Something went wrong</h2>
        <p className="text-xs text-muted-foreground font-mono bg-black/40 p-3 rounded-xl break-all">
          {error?.message || "An unexpected application error occurred."}
        </p>
        <button
          onClick={() => {
            window.location.reload();
          }}
          className="flex items-center justify-center gap-2 w-full py-2.5 bg-purple-gradient text-white font-semibold rounded-xl text-sm shadow-glow-purple-sm hover:shadow-glow-purple transition"
        >
          <RotateCcw size={16} />
          Reload Application
        </button>
      </div>
    </div>
  );
}
