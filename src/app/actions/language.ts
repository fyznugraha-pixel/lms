"use server";
import { cookies } from "next/headers";

export async function setLanguage(lang: string) {
  const cookieStore = await cookies();
  cookieStore.set("lang", lang, {
    path: "/",
    maxAge: 60 * 60 * 24 * 365, // 1 year
  });
}
