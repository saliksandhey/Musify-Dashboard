import { useState, useEffect, useRef } from "react";
import { motion } from "framer-motion";
import { Lock, KeyRound, ArrowRight } from "lucide-react";
import { toast } from "sonner";

const REQUIRED_PIN = "2010";

interface PinGateProps {
  children: React.ReactNode;
}

export default function PinGate({ children }: PinGateProps) {
  const [unlocked, setUnlocked] = useState<boolean>(false);
  const [pin, setPin] = useState<string[]>(["", "", "", ""]);
  const [error, setError] = useState<boolean>(false);
  const inputRefs = [
    useRef<HTMLInputElement>(null),
    useRef<HTMLInputElement>(null),
    useRef<HTMLInputElement>(null),
    useRef<HTMLInputElement>(null),
  ];

  useEffect(() => {
    const isUnlocked = sessionStorage.getItem("musify_admin_unlocked") === "true";
    if (isUnlocked) {
      setUnlocked(true);
    }
  }, []);

  const handleDigitChange = (index: number, value: string) => {
    if (value.length > 1) {
      value = value[value.length - 1];
    }

    const newPin = [...pin];
    newPin[index] = value;
    setPin(newPin);
    setError(false);

    if (value && index < 3) {
      inputRefs[index + 1].current?.focus();
    }

    if (newPin.every((d) => d !== "") && index === 3) {
      verifyPin(newPin.join(""));
    }
  };

  const handleKeyDown = (index: number, e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Backspace" && !pin[index] && index > 0) {
      inputRefs[index - 1].current?.focus();
    }
  };

  const verifyPin = (enteredPin: string) => {
    if (enteredPin === REQUIRED_PIN) {
      toast.success("Security PIN verified!");
      sessionStorage.setItem("musify_admin_unlocked", "true");
      setUnlocked(true);
    } else {
      setError(true);
      toast.error("Incorrect Security PIN!");
      setPin(["", "", "", ""]);
      setTimeout(() => inputRefs[0].current?.focus(), 100);
    }
  };

  const handleFormSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    verifyPin(pin.join(""));
  };

  if (unlocked) {
    return <>{children}</>;
  }

  return (
    <div className="fixed inset-0 z-50 bg-surface-0 flex items-center justify-center p-4 overflow-hidden">
      <div className="absolute inset-0 pointer-events-none">
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-purple-600/10 rounded-full blur-[140px]" />
      </div>

      <motion.div
        initial={{ opacity: 0, scale: 0.9, y: 20 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        className="relative z-10 w-full max-w-sm glass-card p-8 border border-white/10 shadow-2xl text-center"
      >
        <div className="w-14 h-14 rounded-2xl bg-purple-gradient flex items-center justify-center mx-auto mb-5 shadow-glow-purple-sm">
          <Lock size={28} className="text-white" />
        </div>

        <h2 className="text-2xl font-bold text-foreground">Security Gate</h2>
        <p className="text-xs text-muted-foreground mt-1 mb-6">
          Enter the 4-digit Security PIN to unlock Musify Admin
        </p>

        <form onSubmit={handleFormSubmit} className="space-y-6">
          <motion.div
            animate={error ? { x: [-10, 10, -10, 10, 0] } : {}}
            transition={{ duration: 0.4 }}
            className="flex justify-center gap-3"
          >
            {pin.map((digit, i) => (
              <input
                key={i}
                ref={inputRefs[i]}
                type="password"
                inputMode="numeric"
                maxLength={1}
                value={digit}
                onChange={(e) => handleDigitChange(i, e.target.value)}
                onKeyDown={(e) => handleKeyDown(i, e)}
                className={`w-14 h-16 text-center text-2xl font-bold rounded-2xl bg-surface-3 border transition-all outline-none ${
                  error
                    ? "border-red-500 text-red-400 focus:ring-2 focus:ring-red-500/40"
                    : digit
                    ? "border-purple-500 text-purple-300 bg-purple-600/10 shadow-glow-purple-sm"
                    : "border-white/10 text-foreground focus:border-purple-500 focus:ring-2 focus:ring-purple-600/40"
                }`}
                autoFocus={i === 0}
              />
            ))}
          </motion.div>

          {error && (
            <p className="text-xs font-semibold text-red-400 animate-pulse">
              Invalid PIN code. Access Denied.
            </p>
          )}

          <button
            type="submit"
            className="w-full flex items-center justify-center gap-2 py-3 px-6 bg-purple-gradient text-white font-semibold rounded-xl shadow-glow-purple-sm hover:shadow-glow-purple transition-all"
          >
            Unlock Admin Panel
            <ArrowRight size={16} />
          </button>
        </form>

        <div className="mt-6 pt-5 border-t border-white/8">
          <p className="text-[11px] text-muted-foreground flex items-center justify-center gap-1">
            <KeyRound size={12} className="text-purple-400" />
            Protected System · PIN Required
          </p>
        </div>
      </motion.div>
    </div>
  );
}
