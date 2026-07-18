import { ReactNode } from "react";

type ConfirmModalProps = {
  isOpen: boolean;
  title: string;
  message: ReactNode;
  confirmText?: string;
  cancelText?: string;
  confirmTheme?: "blue" | "red" | "amber";
  onConfirm: () => void;
  onCancel: () => void;
  showCancel?: boolean;
};

export default function ConfirmModal({
  isOpen,
  title,
  message,
  confirmText = "Oke",
  cancelText = "Batal",
  confirmTheme = "blue",
  onConfirm,
  onCancel,
  showCancel = true,
}: ConfirmModalProps) {
  if (!isOpen) return null;

  const getThemeClass = () => {
    switch (confirmTheme) {
      case "red":
        return "bg-red-600 hover:bg-red-700 focus:ring-red-500";
      case "amber":
        return "bg-amber-500 hover:bg-amber-600 focus:ring-amber-400";
      default:
        return "bg-blue-600 hover:bg-blue-700 focus:ring-blue-500";
    }
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-sm">
      <div className="bg-white rounded-2xl shadow-xl max-w-sm w-full overflow-hidden animate-in fade-in zoom-in-95 duration-200">
        <div className="p-6">
          <h3 className="text-xl font-bold text-gray-900 mb-2">{title}</h3>
          <div className="text-slate-600">{message}</div>
        </div>
        <div className="bg-slate-50 px-6 py-4 flex justify-end gap-3 border-t border-slate-100">
          {showCancel && (
            <button
              onClick={onCancel}
              className="px-4 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-200 rounded-lg transition-colors focus:outline-none focus:ring-2 focus:ring-slate-300"
            >
              {cancelText}
            </button>
          )}
          <button
            onClick={() => {
              onConfirm();
              if (showCancel) onCancel(); // Close automatically if it's a confirmation
            }}
            className={`px-4 py-2 text-sm font-semibold text-white rounded-lg transition-colors shadow-sm focus:outline-none focus:ring-2 focus:ring-offset-2 ${getThemeClass()}`}
          >
            {confirmText}
          </button>
        </div>
      </div>
    </div>
  );
}
