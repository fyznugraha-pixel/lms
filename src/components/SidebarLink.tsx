"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { ReactNode } from "react";

export default function SidebarLink({ 
  href, 
  children,
  exact = false
}: { 
  href: string; 
  children: ReactNode;
  exact?: boolean;
}) {
  const pathname = usePathname();
  const isActive = exact ? pathname === href : pathname.startsWith(href);

  return (
    <Link 
      href={href} 
      className={`block px-4 py-2.5 font-medium rounded-lg transition-colors ${
        isActive 
          ? "bg-blue-50 text-blue-700 shadow-sm" 
          : "text-gray-700 hover:bg-gray-50 hover:text-gray-900"
      }`}
    >
      {children}
    </Link>
  );
}
