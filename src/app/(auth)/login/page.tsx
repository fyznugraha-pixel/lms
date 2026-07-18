"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

type LoginContext = "mahasiswa" | "karyawan";

export default function LoginPage() {
  const [context, setContext] = useState<LoginContext>("mahasiswa");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [rememberMe, setRememberMe] = useState(false);
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const router = useRouter();

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setIsLoading(true);

    try {
      const payload = {
        email,
        password,
        rememberMe: context === "karyawan" ? rememberMe : false,
      };

      const res = await fetch("/api/auth/login", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(payload),
      });

      const data = await res.json();

      if (!res.ok || !data.success) {
        setError(data.error?.message || "Gagal login. Email atau password salah.");
        return;
      }

      // Redirect berdasarkan role
      const role = data.data.role;
      if (role === "SUPER_ADMIN" || role === "ADMIN_KAMPUS" || role === "ADMIN_KANTOR") {
        router.push("/admin");
      } else if (role === "DOSEN") {
        router.push("/dosen");
      } else if (role === "KARYAWAN" || role === "PENANGGUNG_JAWAB_ABSEN") {
        // Asumsi rute untuk dashboard karyawan adalah /kantor atau /absen
        // Karena prompt bilang "Dashboard utama: tombol Absen Masuk/Pulang" 
        router.push("/absen");
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
    <div className="min-h-screen flex">
      {/* Sisi Kiri: Branding */}
      <div className="hidden lg:flex w-1/2 bg-blue-900 text-white flex-col justify-between p-12">
        <div>
          <h1 className="text-4xl font-extrabold tracking-tight">TactLink</h1>
          <p className="text-blue-200 mt-2 text-lg">Integrated Attendance & Management System</p>
        </div>
        <div>
          <h2 className="text-2xl font-semibold mb-2">Welcome Back</h2>
          <p className="text-blue-200">
            Akses portal absensi dan manajemen internal TactLink dengan aman.
          </p>
        </div>
      </div>

      {/* Sisi Kanan: Form Login */}
      <div className="w-full lg:w-1/2 flex items-center justify-center bg-gray-50 p-8 sm:p-12">
        <div className="w-full max-w-md bg-white rounded-2xl shadow-xl p-8">
          
          <div className="text-center mb-8">
            <h2 className="text-2xl font-bold text-gray-900">Masuk ke Akun Anda</h2>
            <p className="text-sm text-gray-500 mt-2">Silakan pilih jenis akun untuk melanjutkan</p>
          </div>

          {/* Toggle Konteks */}
          <div className="flex bg-gray-100 p-1 rounded-lg mb-6">
            <button
              type="button"
              className={`flex-1 py-2 text-sm font-medium rounded-md transition-all ${
                context === "mahasiswa" ? "bg-white text-gray-900 shadow" : "text-gray-500 hover:text-gray-700"
              }`}
              onClick={() => {
                setContext("mahasiswa");
                setError("");
              }}
            >
              Mahasiswa
            </button>
            <button
              type="button"
              className={`flex-1 py-2 text-sm font-medium rounded-md transition-all ${
                context === "karyawan" ? "bg-white text-gray-900 shadow" : "text-gray-500 hover:text-gray-700"
              }`}
              onClick={() => {
                setContext("karyawan");
                setError("");
              }}
            >
              Karyawan & Admin
            </button>
          </div>

          {error && (
            <div className="mb-6 p-4 bg-red-50 border border-red-100 rounded-lg flex items-start">
              <div className="flex-shrink-0">
                <svg className="h-5 w-5 text-red-400" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                </svg>
              </div>
              <div className="ml-3">
                <p className="text-sm font-medium text-red-800">{error}</p>
              </div>
            </div>
          )}

          <form onSubmit={handleLogin} className="space-y-5">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
              <input
                type="email"
                required
                className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 focus:bg-white outline-none transition-all text-gray-900"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="Masukkan email"
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Password</label>
              <input
                type="password"
                required
                className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 focus:bg-white outline-none transition-all text-gray-900"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Masukkan password"
              />
            </div>

            {context === "karyawan" && (
              <div className="flex items-center">
                <input
                  id="remember-me"
                  type="checkbox"
                  className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                  checked={rememberMe}
                  onChange={(e) => setRememberMe(e.target.checked)}
                />
                <label htmlFor="remember-me" className="ml-2 block text-sm text-gray-700">
                  Ingat saya di device ini selama 30 hari
                </label>
              </div>
            )}

            <button
              type="submit"
              disabled={isLoading}
              className="w-full py-3 px-4 mt-4 bg-blue-600 hover:bg-blue-700 text-white font-semibold rounded-lg shadow-md transition-all disabled:opacity-70 disabled:cursor-not-allowed flex justify-center items-center"
            >
              {isLoading ? (
                <>
                  <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                  Memproses...
                </>
              ) : (
                "Masuk"
              )}
            </button>
          </form>
          
        </div>
      </div>
    </div>
  );
}
