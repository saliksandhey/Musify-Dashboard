import { motion } from "framer-motion";

export default function PageLoader() {
  return (
    <div className="flex items-center justify-center min-h-[400px]">
      <motion.div
        className="flex gap-2"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
      >
        {[0, 1, 2].map((i) => (
          <motion.div
            key={i}
            className="w-2.5 h-2.5 rounded-full bg-purple-500"
            animate={{ y: [-6, 6, -6] }}
            transition={{ duration: 0.8, repeat: Infinity, delay: i * 0.15 }}
          />
        ))}
      </motion.div>
    </div>
  );
}
