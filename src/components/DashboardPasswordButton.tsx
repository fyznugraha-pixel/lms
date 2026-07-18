"use client";

import { useState } from "react";
import { Key } from "lucide-react";
import ChangePasswordModal from "./ChangePasswordModal";

export default function DashboardPasswordButton() {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <>
      <button 
        type="button"
        onClick={() => setIsOpen(true)}
        className="w-full text-left px-4 py-2 flex items-center gap-3 text-gray-700 font-medium hover:bg-gray-50 rounded-lg transition-colors mb-1"
      >
        <Key size={18} className="text-gray-500" />
        <span>Ubah Password</span>
      </button>

      <ChangePasswordModal 
        isOpen={isOpen}
        onClose={() => setIsOpen(false)}
      />
    </>
  );
}
