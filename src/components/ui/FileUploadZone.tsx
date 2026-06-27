import { useCallback, useState } from "react";
import { useDropzone } from "react-dropzone";
import { motion, AnimatePresence } from "framer-motion";
import { Upload, X, ImageIcon, Music, CheckCircle2 } from "lucide-react";
import { cn } from "@/utils";
import { toast } from "sonner";

interface FileUploadZoneProps {
  accept: "image" | "audio";
  value?: File | null;
  onChange: (file: File | null) => void;
  label?: string;
  className?: string;
}

export default function FileUploadZone({
  accept,
  value,
  onChange,
  label,
  className,
}: FileUploadZoneProps) {
  const [preview, setPreview] = useState<string | null>(null);
  const [progress, setProgress] = useState(0);
  const [uploading, setUploading] = useState(false);

  const acceptMap = {
    image: { "image/*": [".png", ".jpg", ".jpeg", ".webp", ".gif"] },
    audio: { "audio/*": [".mp3", ".wav", ".flac", ".aac", ".ogg"] },
  };

  const onDrop = useCallback(
    (files: File[]) => {
      const file = files[0];
      if (!file) return;

      onChange(file);
      setUploading(true);
      setProgress(0);

      const interval = setInterval(() => {
        setProgress((p) => {
          if (p >= 100) {
            clearInterval(interval);
            setUploading(false);
            toast.success(`${accept === "image" ? "Image" : "Audio"} ready`);
            return 100;
          }
          return p + 20;
        });
      }, 100);

      if (accept === "image") {
        const reader = new FileReader();
        reader.onload = (e) => setPreview(e.target?.result as string);
        reader.readAsDataURL(file);
      } else {
        setPreview(URL.createObjectURL(file));
      }
    },
    [accept, onChange]
  );

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: acceptMap[accept],
    maxFiles: 1,
    maxSize: accept === "audio" ? 50_000_000 : 5_000_000,
    onDropRejected: () => toast.error("File rejected. Check format and size."),
  });

  const clear = (e: React.MouseEvent) => {
    e.stopPropagation();
    onChange(null);
    setPreview(null);
    setProgress(0);
    setUploading(false);
  };

  return (
    <div className={cn("space-y-1.5", className)}>
      {label && <p className="text-xs font-semibold text-foreground">{label}</p>}

      <div
        {...getRootProps()}
        className={cn(
          "relative border-2 border-dashed rounded-xl transition-all duration-200 cursor-pointer overflow-hidden",
          isDragActive
            ? "border-purple-500 bg-purple-500/10"
            : value
            ? "border-purple-600/40 bg-surface-3"
            : "border-white/10 bg-surface-3 hover:border-purple-600/40 hover:bg-surface-4"
        )}
      >
        <input {...getInputProps()} />

        <AnimatePresence mode="wait">
          {value && accept === "image" && preview ? (
            <motion.div
              key="image-preview"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="relative p-2"
            >
              <img
                src={preview}
                alt="Preview"
                className="w-full h-28 object-cover rounded-lg"
              />
              <button
                onClick={clear}
                type="button"
                className="absolute top-4 right-4 p-1 bg-black/70 rounded-full text-white hover:bg-black/90 transition"
              >
                <X size={12} />
              </button>
              {progress === 100 && (
                <div className="absolute bottom-4 right-4">
                  <CheckCircle2 size={16} className="text-emerald-400" />
                </div>
              )}
            </motion.div>
          ) : value && accept === "audio" ? (
            <motion.div
              key="audio-preview"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="p-3"
            >
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-lg bg-purple-600/20 flex items-center justify-center flex-shrink-0">
                  <Music size={16} className="text-purple-400" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-xs font-semibold text-foreground truncate">{value.name}</p>
                  <p className="text-[10px] text-muted-foreground">
                    {(value.size / 1_000_000).toFixed(1)} MB
                  </p>
                </div>
                <button onClick={clear} type="button" className="p-1 text-muted-foreground hover:text-foreground">
                  <X size={14} />
                </button>
              </div>
            </motion.div>
          ) : (
            <motion.div
              key="empty"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="flex flex-col items-center justify-center py-5 px-3 text-center"
            >
              <div className="w-9 h-9 rounded-xl bg-white/5 flex items-center justify-center mb-1.5">
                {accept === "image" ? (
                  <ImageIcon size={18} className="text-purple-400" />
                ) : (
                  <Music size={18} className="text-purple-400" />
                )}
              </div>
              <p className="text-xs font-semibold text-foreground">
                {isDragActive ? "Drop file here" : "Drag & drop or click to upload"}
              </p>
              <p className="text-[10px] text-muted-foreground mt-0.5">
                {accept === "image" ? "PNG, JPG, WEBP up to 5MB" : "MP3, WAV up to 50MB"}
              </p>
            </motion.div>
          )}
        </AnimatePresence>

        {uploading && (
          <div className="absolute bottom-0 left-0 right-0 h-1 bg-surface-4 overflow-hidden">
            <motion.div
              className="h-full bg-purple-gradient"
              initial={{ width: 0 }}
              animate={{ width: `${progress}%` }}
            />
          </div>
        )}
      </div>
    </div>
  );
}
