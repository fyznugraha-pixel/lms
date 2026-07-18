"use client";

import { useState, useEffect, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Eye, EyeOff } from "lucide-react";
import Link from "next/link";
import Grainient from "@/components/Grainient";

function ResetPasswordForm() {
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showNew, setShowNew] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);

  const router = useRouter();
  const searchParams = useSearchParams();
  const token = searchParams.get("token");

  useEffect(() => {
    if (!token) {
      setError("Token tidak ditemukan. Silakan request link reset password kembali dari halaman Lupa Password.");
    }
  }, [token]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    if (!token) {
      setError("Token reset tidak valid.");
      return;
    }

    if (newPassword !== confirmPassword) {
      setError("Password baru dan konfirmasi tidak cocok.");
      return;
    }

    if (newPassword.length < 6) {
      setError("Password baru minimal 6 karakter.");
      return;
    }

    setIsLoading(true);

    try {
      const res = await fetch("/api/auth/reset-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ token, newPassword }),
      });

      const data = await res.json();

      if (!res.ok || !data.success) {
        setError(data.error?.message || "Gagal mereset password.");
      } else {
        setSuccess(true);
        setTimeout(() => {
          router.push("/login");
        }, 3000);
      }
    } catch (err) {
      setError("Terjadi kesalahan sistem.");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <>
      <div className="text-center mb-8">
        <h2 className="text-2xl font-bold text-gray-900">Reset Password</h2>
        {!success && <p className="text-sm text-gray-500 mt-2">Buat password baru untuk akun Anda</p>}
      </div>

      {error && (
        <div className="mb-6 p-4 bg-red-50 border border-red-100 rounded-lg flex items-start">
          <div className="ml-3">
            <p className="text-sm font-medium text-red-800">{error}</p>
          </div>
        </div>
      )}

      {success ? (
        <div className="text-center py-6">
          <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <svg className="w-8 h-8 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7"></path>
            </svg>
          </div>
          <h3 className="text-xl font-bold text-gray-900 mb-2">Password Berhasil Diubah!</h3>
          <p className="text-gray-500 mb-6">Anda akan dialihkan ke halaman Login dalam beberapa detik...</p>
          <Link href="/login" className="inline-block py-2.5 px-6 bg-[#394887] text-white font-medium rounded-lg hover:bg-[#2D3A6E] transition-colors">
            Ke Halaman Login Sekarang
          </Link>
        </div>
      ) : (
        <form onSubmit={handleSubmit} className="space-y-5">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Password Baru</label>
            <div className="relative">
              <input
                type={showNew ? "text" : "password"}
                required
                disabled={!token || isLoading}
                className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all text-gray-900 pr-12"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                placeholder="Minimal 6 karakter"
              />
              <button
                type="button"
                onClick={() => setShowNew(!showNew)}
                className="absolute inset-y-0 right-0 pr-4 flex items-center text-gray-400 hover:text-gray-600"
              >
                {showNew ? <EyeOff size={20} /> : <Eye size={20} />}
              </button>
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Konfirmasi Password</label>
            <div className="relative">
              <input
                type={showConfirm ? "text" : "password"}
                required
                disabled={!token || isLoading}
                className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all text-gray-900 pr-12"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                placeholder="Ulangi password baru"
              />
              <button
                type="button"
                onClick={() => setShowConfirm(!showConfirm)}
                className="absolute inset-y-0 right-0 pr-4 flex items-center text-gray-400 hover:text-gray-600"
              >
                {showConfirm ? <EyeOff size={20} /> : <Eye size={20} />}
              </button>
            </div>
          </div>

          <button
            type="submit"
            disabled={isLoading || !token}
            className="w-full py-3 px-4 mt-6 bg-[#394887] hover:bg-[#2D3A6E] active:scale-[0.98] hover:-translate-y-0.5 text-white font-semibold rounded-lg shadow-md hover:shadow-lg transition-all duration-200 disabled:opacity-70 disabled:cursor-not-allowed disabled:transform-none flex justify-center items-center"
          >
            {isLoading ? "Menyimpan..." : "Simpan Password Baru"}
          </button>
        </form>
        )}
    </>
  );
}

export default function ResetPasswordPage() {
  return (
    <div className="min-h-screen flex">
      {/* Sisi Kiri: Branding & Pesan */}
      <div className="hidden lg:flex w-1/2 bg-[#0F172A] text-white flex-col justify-between p-12 relative overflow-hidden">
        {/* Grainient Background */}
        <div className="absolute inset-0 z-0">
          <Grainient 
            color1="#1E3A8A" 
            color2="#EFC94B" 
            color3="#0F172A" 
            className="w-full h-full"
          />
        </div>
        
        <div className="relative z-10">
          <div className="flex items-center gap-6 mb-4">
            <img src="/logo/LOGO%20TACTLINK.png" alt="TactLink Logo" className="h-24 w-auto object-contain bg-white p-3 rounded-2xl shadow-xl" />
            <div className="flex flex-col">
              <h1 className="text-6xl font-extrabold tracking-tight">TactLink</h1>
              <p className="text-white mt-2 text-xl font-light">Integrated Attendance & Management System</p>
            </div>
          </div>
        </div>
        
        <div className="relative z-10 bg-white/10 p-8 rounded-3xl backdrop-blur-md border border-white/20 shadow-2xl">
          <h2 className="text-3xl font-bold mb-3 text-[#EFC94B]">Keamanan Akun</h2>
          <p className="text-blue-50 text-lg mb-1">Pilih Password Baru</p>
          <p className="text-blue-100/80 text-sm">
            Pastikan password Anda kuat dan mudah diingat. Hindari menggunakan password yang sama dengan akun lain.
          </p>
        </div>
      </div>

      {/* Sisi Kanan: Form */}
      <div className="w-full lg:w-1/2 flex items-center justify-center bg-slate-50 p-8 sm:p-12 relative overflow-hidden">
        {/* Right Side Ambient Background */}
        <div className="absolute inset-0 pointer-events-none flex justify-between">
          <div className="w-1/2 h-full bg-gradient-to-r from-blue-50/50 to-transparent" />
          <div className="w-96 h-96 bg-blue-100/40 rounded-full blur-3xl absolute -top-10 -right-10 mix-blend-multiply" />
          <div className="w-96 h-96 bg-yellow-50/60 rounded-full blur-3xl absolute -bottom-10 -left-10 mix-blend-multiply" />
        </div>
        
        <div className="w-full max-w-md bg-white/95 backdrop-blur-xl rounded-3xl shadow-[0_20px_60px_-15px_rgba(45,58,110,0.15)] p-8 sm:p-10 border border-white relative z-10">
          <Suspense fallback={<div className="p-8 text-center">Memuat form...</div>}>
            <ResetPasswordForm />
          </Suspense>
        </div>
      </div>
    </div>
  );
}
