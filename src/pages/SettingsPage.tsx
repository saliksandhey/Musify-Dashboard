import { useState } from "react";
import { Sliders, Moon, Bell, Info, ShieldCheck, Check } from "lucide-react";
import { toast } from "sonner";
import PageWrapper, { PageHeader } from "@/components/ui/PageWrapper";

export default function SettingsPage() {
  const [activeTab, setActiveTab] = useState<"general" | "appearance" | "notifications" | "info">("general");
  const [siteName, setSiteName] = useState("Musify Streaming Platform");
  const [contactEmail, setContactEmail] = useState("support@musify.io");
  const [emailNotifs, setEmailNotifs] = useState(true);
  const [uploadAlerts, setUploadAlerts] = useState(true);

  const handleSave = () => {
    toast.success("Settings saved successfully");
  };

  return (
    <PageWrapper>
      <PageHeader title="Settings" description="Configure global system preferences, notifications, and application information." />

      <div className="flex flex-col md:flex-row gap-6">
        {/* Navigation Tabs */}
        <div className="w-full md:w-64 glass-card p-2 flex flex-row md:flex-col gap-1 h-fit">
          {[
            { id: "general", label: "General", icon: Sliders },
            { id: "appearance", label: "Appearance", icon: Moon },
            { id: "notifications", label: "Notifications", icon: Bell },
            { id: "info", label: "Application Info", icon: Info },
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as any)}
              className={`flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-semibold transition w-full ${
                activeTab === tab.id
                  ? "bg-purple-600/20 text-purple-300 border border-purple-600/30"
                  : "text-muted-foreground hover:text-foreground hover:bg-white/5"
              }`}
            >
              <tab.icon size={18} />
              {tab.label}
            </button>
          ))}
        </div>

        {/* Tab Content */}
        <div className="flex-1 glass-card p-6 md:p-8 space-y-6">
          {activeTab === "general" && (
            <div className="space-y-6">
              <h3 className="text-lg font-bold text-foreground border-b border-white/8 pb-3">General Platform Settings</h3>
              <div className="space-y-4 max-w-lg">
                <div className="space-y-1.5">
                  <label className="text-xs font-medium text-muted-foreground">Platform Name</label>
                  <input
                    type="text"
                    value={siteName}
                    onChange={(e) => setSiteName(e.target.value)}
                    className="w-full px-4 py-2.5 bg-surface-3 border border-white/8 rounded-xl text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-purple-600/40"
                  />
                </div>
                <div className="space-y-1.5">
                  <label className="text-xs font-medium text-muted-foreground">System Contact Email</label>
                  <input
                    type="email"
                    value={contactEmail}
                    onChange={(e) => setContactEmail(e.target.value)}
                    className="w-full px-4 py-2.5 bg-surface-3 border border-white/8 rounded-xl text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-purple-600/40"
                  />
                </div>
              </div>
            </div>
          )}

          {activeTab === "appearance" && (
            <div className="space-y-6">
              <h3 className="text-lg font-bold text-foreground border-b border-white/8 pb-3">Appearance & Theme</h3>
              <div className="grid grid-cols-2 gap-4 max-w-md">
                <div className="p-4 rounded-2xl border-2 border-purple-600 bg-surface-3 cursor-pointer">
                  <div className="w-full h-12 rounded-lg bg-black mb-2 flex items-center justify-center border border-white/10">
                    <span className="w-3 h-3 rounded-full bg-purple-500" />
                  </div>
                  <p className="text-sm font-bold text-foreground text-center">Midnight Purple (Dark)</p>
                  <p className="text-[10px] text-purple-400 text-center mt-1 font-semibold flex items-center justify-center gap-1">
                    <Check size={12} /> Active Theme
                  </p>
                </div>
              </div>
            </div>
          )}

          {activeTab === "notifications" && (
            <div className="space-y-6">
              <h3 className="text-lg font-bold text-foreground border-b border-white/8 pb-3">Admin Alert Preferences</h3>
              <div className="space-y-4 max-w-lg">
                <label className="flex items-center justify-between p-4 bg-surface-3 rounded-2xl border border-white/5 cursor-pointer">
                  <div>
                    <p className="text-sm font-bold text-foreground">System Email Notifications</p>
                    <p className="text-xs text-muted-foreground">Receive weekly analytics digests and security reports</p>
                  </div>
                  <input
                    type="checkbox"
                    checked={emailNotifs}
                    onChange={(e) => setEmailNotifs(e.target.checked)}
                    className="rounded border-white/20 bg-surface-4 text-purple-600 focus:ring-purple-500 w-5 h-5 cursor-pointer"
                  />
                </label>
                <label className="flex items-center justify-between p-4 bg-surface-3 rounded-2xl border border-white/5 cursor-pointer">
                  <div>
                    <p className="text-sm font-bold text-foreground">Song Upload Alerts</p>
                    <p className="text-xs text-muted-foreground">Get notified whenever artists publish new tracks</p>
                  </div>
                  <input
                    type="checkbox"
                    checked={uploadAlerts}
                    onChange={(e) => setUploadAlerts(e.target.checked)}
                    className="rounded border-white/20 bg-surface-4 text-purple-600 focus:ring-purple-500 w-5 h-5 cursor-pointer"
                  />
                </label>
              </div>
            </div>
          )}

          {activeTab === "info" && (
            <div className="space-y-6">
              <h3 className="text-lg font-bold text-foreground border-b border-white/8 pb-3">Application Specification</h3>
              <div className="space-y-3 max-w-md text-sm">
                <div className="flex justify-between py-2 border-b border-white/5">
                  <span className="text-muted-foreground">Admin Frontend Version</span>
                  <span className="font-mono text-purple-400 font-bold">v2.4.0-production</span>
                </div>
                <div className="flex justify-between py-2 border-b border-white/5">
                  <span className="text-muted-foreground">Framework Stack</span>
                  <span className="font-semibold text-foreground">React 19 + TypeScript + Vite</span>
                </div>
                <div className="flex justify-between py-2 border-b border-white/5">
                  <span className="text-muted-foreground">Styling Engine</span>
                  <span className="font-semibold text-foreground">Tailwind CSS + Glassmorphic UI</span>
                </div>
                <div className="flex justify-between py-2 border-b border-white/5">
                  <span className="text-muted-foreground">Build Environment</span>
                  <span className="font-semibold text-emerald-400 flex items-center gap-1">
                    <ShieldCheck size={16} /> Production Ready (Pure Frontend Mock)
                  </span>
                </div>
              </div>
            </div>
          )}

          <div className="pt-6 border-t border-white/8 flex justify-end">
            <button
              onClick={handleSave}
              className="px-6 py-2.5 bg-purple-gradient text-white rounded-xl font-semibold text-sm shadow-glow-purple-sm hover:shadow-glow-purple transition"
            >
              Save Preferences
            </button>
          </div>
        </div>
      </div>
    </PageWrapper>
  );
}
