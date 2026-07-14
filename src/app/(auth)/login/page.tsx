"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

export default function LoginPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const router = useRouter();

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setIsLoading(true);

    try {
      const res = await fetch("/api/auth/login", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ email, password }),
      });

      const data = await res.json();

      if (!res.ok || !data.success) {
        setError(data.error?.message || "Gagal login");
        return;
      }

      // Redirect berdasarkan role
      const role = data.data.role;
      if (role === "SUPER_ADMIN" || role === "ADMIN_KAMPUS") {
        router.push("/admin");
      } else if (role === "DOSEN") {
        router.push("/dosen");
      } else {
        router.push("/absen");
      }
    } catch (err) {
      setError("Terjadi kesalahan jaringan");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 p-4">
      <div className="w-full max-w-md bg-white rounded-xl shadow-lg p-8">
        <h1 className="text-2xl font-bold text-center text-gray-900 mb-6">Sistem Absensi</h1>
        
        {error && (
          <div className="mb-4 p-3 bg-red-100 text-red-700 border border-red-200 rounded-lg text-sm">
            {error}
          </div>
        )}

        <form onSubmit={handleLogin} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
            <input
              type="email"
              required
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 outline-none transition-all text-gray-900"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="Masukkan email anda"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Password</label>
            <input
              type="password"
              required
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 outline-none transition-all text-gray-900"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Masukkan password anda"
            />
          </div>
          <button
            type="submit"
            disabled={isLoading}
            className="w-full py-2.5 px-4 mt-2 bg-blue-600 hover:bg-blue-700 text-white font-medium rounded-lg transition-colors disabled:opacity-70 disabled:cursor-not-allowed"
          >
            {isLoading ? "Memproses..." : "Masuk"}
          </button>
        </form>
      </div>
    </div>
  );
}
