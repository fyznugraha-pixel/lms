"use client";

import { useState } from "react";
import Link from "next/link";
import Grainient from "@/components/Grainient";

export default function LupaPasswordPage() {
  const [email, setEmail] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setMessage("");
    setError("");

    try {
      const res = await fetch("/api/auth/forgot-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email }),
      });

      const data = await res.json();

      if (!res.ok || !data.success) {
        setError(data.error?.message || "Gagal memproses permintaan.");
      } else {
        setMessage("Instruksi reset password telah dikirim ke email Anda. Silakan periksa inbox atau folder spam.");
      }
    } catch (err) {
      setError("Terjadi kesalahan jaringan.");
    } finally {
      setIsLoading(false);
    }
  };

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
            <img src="/logo/LOGO%20TACTLINK%20TRANSPARAN.png" alt="TactLink Logo" className="h-24 w-auto object-contain bg-white p-3 rounded-2xl shadow-xl" />
            <div className="flex flex-col">
              <h1 className="text-6xl font-extrabold tracking-tight">TactLink</h1>
              <p className="text-white mt-2 text-xl font-light">Integrated Attendance & Management System</p>
            </div>
          </div>
        </div>
        
        <div className="relative z-10 bg-white/10 p-8 rounded-3xl backdrop-blur-md border border-white/20 shadow-2xl">
          <h2 className="text-3xl font-bold mb-3 text-[#EFC94B]">Lupa Password?</h2>
          <p className="text-blue-50 text-lg mb-1">Jangan Khawatir!</p>
          <p className="text-blue-100/80 text-sm">
            Masukkan email terdaftar Anda, dan kami akan mengirimkan instruksi untuk mengatur ulang password Anda.
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
          
          <div className="text-center mb-8 lg:hidden">
            <h2 className="text-2xl font-bold text-gray-900">Lupa Password?</h2>
            <p className="text-sm text-gray-500 mt-2">Masukkan email Anda di bawah ini</p>
          </div>

          {error && (
            <div className="mb-6 p-4 bg-red-50 border border-red-100 rounded-lg flex items-start">
              <div className="ml-3">
                <p className="text-sm font-medium text-red-800">{error}</p>
              </div>
            </div>
          )}

          {message && (
            <div className="mb-6 p-4 bg-green-50 border border-green-100 rounded-lg flex items-start">
              <div className="ml-3">
                <p className="text-sm font-medium text-green-800">{message}</p>
              </div>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-5">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Email Anda</label>
              <input
                type="email"
                required
                className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 focus:bg-white outline-none transition-all text-gray-900"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="Masukkan email yang terdaftar"
              />
            </div>

            <button
              type="submit"
              disabled={isLoading}
              className="w-full py-3 px-4 mt-6 bg-[#394887] hover:bg-[#2D3A6E] active:scale-[0.98] hover:-translate-y-0.5 text-white font-semibold rounded-lg shadow-md hover:shadow-lg transition-all duration-200 disabled:opacity-70 disabled:cursor-not-allowed disabled:transform-none flex justify-center items-center"
            >
              {isLoading ? "Mengirim..." : "Kirim Link Reset"}
            </button>
          </form>

          <div className="mt-8 text-center">
            <Link href="/login" className="text-sm font-medium text-blue-600 hover:text-blue-800 transition-colors">
              &larr; Kembali ke halaman Login
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
