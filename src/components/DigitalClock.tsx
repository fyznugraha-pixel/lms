"use client";

import { useState, useEffect } from "react";
import { useLocale } from "@/hooks/useDictionary";

export default function DigitalClock({ label }: { label: string }) {
  const [currentTime, setCurrentTime] = useState(new Date());
  const locale = useLocale();

  useEffect(() => {
    const timer = setInterval(() => setCurrentTime(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  return (
    <div className="mt-4 md:mt-0 text-center md:text-right">
      <div className="text-4xl font-black text-blue-600 tracking-tight">
        {new Intl.DateTimeFormat(locale, { hour: '2-digit', minute: '2-digit', second: '2-digit' }).format(currentTime)}
      </div>
      <p className="text-sm text-gray-400 font-medium uppercase tracking-widest mt-1">{label}</p>
    </div>
  );
}
