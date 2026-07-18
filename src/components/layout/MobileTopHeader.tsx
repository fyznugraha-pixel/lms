"use client";

import LanguageToggle from "@/components/LanguageToggle";

export default function MobileTopHeader({ langCookie }: { langCookie: string }) {
  return (
    <div className="md:hidden flex items-center justify-between p-4 bg-white border-b border-gray-200 sticky top-0 z-40">
      <div className="flex items-center gap-2">
        <img src="/logo/LOGO%20TACTLINK.png" alt="TactLink Logo" className="h-8 w-auto object-contain" />
        <span className="font-bold text-gray-900 text-lg">TactLink</span>
      </div>
      <LanguageToggle currentLang={langCookie} compact={true} />
    </div>
  );
}
