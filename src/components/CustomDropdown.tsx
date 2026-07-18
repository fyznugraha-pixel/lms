"use client";

import { useState, useRef, useEffect, ReactNode } from "react";

export type DropdownOption = {
  value: string | number;
  label: ReactNode;
};

type CustomDropdownProps = {
  value: string | number;
  options: DropdownOption[];
  onChange: (value: string | number) => void;
  placeholder?: string;
  className?: string;
};

export default function CustomDropdown({
  value,
  options,
  onChange,
  placeholder = "Select...",
  className = ""
}: CustomDropdownProps) {
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  const selectedOption = options.find((opt) => opt.value === value);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  return (
    <div className={`relative ${className}`} ref={dropdownRef}>
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className="w-full flex items-center justify-between px-4 py-2.5 bg-gray-50 border border-transparent rounded-lg hover:bg-gray-100 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:bg-white transition-all text-sm font-medium text-gray-700 min-w-[140px]"
      >
        <span className="truncate pr-4 capitalize">
          {selectedOption ? selectedOption.label : placeholder}
        </span>
        <svg
          className={`w-4 h-4 text-gray-400 transition-transform duration-200 ${isOpen ? "rotate-180" : ""}`}
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
        </svg>
      </button>

      {isOpen && (
        <div className="absolute z-50 w-full mt-1.5 bg-white border border-gray-100 rounded-xl shadow-lg max-h-60 overflow-y-auto animate-in fade-in slide-in-from-top-2 duration-150">
          <ul className="py-1">
            {options.map((option) => (
              <li key={option.value}>
                <button
                  type="button"
                  onClick={() => {
                    onChange(option.value);
                    setIsOpen(false);
                  }}
                  className={`w-full text-left px-4 py-2.5 text-sm transition-colors capitalize ${
                    option.value === value
                      ? "bg-blue-50 text-blue-700 font-bold"
                      : "text-gray-700 hover:bg-gray-50 hover:text-gray-900 font-medium"
                  }`}
                >
                  {option.label}
                </button>
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}
