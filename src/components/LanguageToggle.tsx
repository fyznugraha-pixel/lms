"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { setLanguage } from "@/app/actions/language";
import { Globe } from "lucide-react";

interface LanguageToggleProps {
  currentLang: string;
  compact?: boolean;
}

export default function LanguageToggle({ currentLang, compact = false }: LanguageToggleProps) {
  const [isPending, setIsPending] = useState(false);

  const toggleLang = async () => {
    setIsPending(true);
    const newLang = currentLang === "en" ? "id" : "en";
    await setLanguage(newLang);
    window.location.reload();
  };

  return (
    <button
      onClick={toggleLang}
      disabled={isPending}
      className={
        compact
          ? "flex items-center gap-1.5 px-3 py-1.5 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-full transition-colors text-xs font-bold"
          : "w-full text-left px-4 py-2.5 text-gray-700 font-medium hover:bg-gray-50 rounded-lg transition-colors flex items-center gap-3 mb-2"
      }
    >
      <Globe size={compact ? 14 : 18} className={compact ? "text-gray-600" : "text-gray-500"} />
      <span>{compact ? currentLang.toUpperCase() : (currentLang === "en" ? "Indonesian (ID)" : "English (EN)")}</span>
    </button>
  );
}