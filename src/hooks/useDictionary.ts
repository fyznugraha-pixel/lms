import { useState, useEffect } from "react";
import { getDictionary } from "@/lib/dictionaries";

export function useDictionary() {
  const [dict, setDict] = useState(getDictionary("en")); // Default to 'en'

  useEffect(() => {
    // Read cookie 'lang'
    const match = document.cookie.match(new RegExp('(^| )lang=([^;]+)'));
    const lang = match ? match[2] : "en";
    setDict(getDictionary(lang));
  }, []);

  return dict;
}

export function useLocale() {
  const [lang, setLang] = useState("en");

  useEffect(() => {
    const match = document.cookie.match(new RegExp('(^| )lang=([^;]+)'));
    setLang(match ? match[2] : "en");
  }, []);

  return lang === "id" ? "id-ID" : "en-US";
}
