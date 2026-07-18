/**
 * RADIX category definitions — colors, labels, and icons for the 12 skill categories.
 */
export const RADIX_CATEGORIES = {
  COD: { label: "Coding", color: "#6366f1", icon: "💻" },
  DSA: { label: "Data Structures & Algorithms", color: "#8b5cf6", icon: "🌳" },
  OOD: { label: "Object-Oriented Design", color: "#a855f7", icon: "🧩" },
  APTI: { label: "Aptitude", color: "#f59e0b", icon: "🧠" },
  COMM: { label: "Communication", color: "#10b981", icon: "💬" },
  AI: { label: "AI / Machine Learning", color: "#ec4899", icon: "🤖" },
  CLOUD: { label: "Cloud Computing", color: "#3b82f6", icon: "☁️" },
  SQL: { label: "SQL / Databases", color: "#14b8a6", icon: "🗄️" },
  SWE: { label: "Software Engineering", color: "#f97316", icon: "⚙️" },
  SYSD: { label: "System Design", color: "#ef4444", icon: "🏗️" },
  NETW: { label: "Networking", color: "#06b6d4", icon: "🌐" },
  OS: { label: "Operating Systems", color: "#84cc16", icon: "🖥️" },
  OTHER: { label: "Other", color: "#9ca3af", icon: "📋" },
};

export const ALLOWED_FILE_TYPES = [".pdf", ".docx", ".txt"];

export const API_BASE_URL =
  import.meta.env.VITE_API_URL || "http://localhost:8000";
