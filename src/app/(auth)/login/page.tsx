"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Eye, EyeOff } from "lucide-react";
import Grainient from "@/components/Grainient";

export default function LoginPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
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
        rememberMe,
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
        setError(data.error?.message || "Login failed. Incorrect email or password.");
        return;
      }

      // Redirect berdasarkan role
      const role = data.data.role;
      if (role === "SUPER_ADMIN" || role === "ADMIN_KANTOR") {
        router.push("/admin-kantor");
      } else if (role === "KARYAWAN") {
        router.push("/absen-kantor");
      }
    } catch (err) {
      setError("A network error occurred.");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-[#0F172A] relative overflow-hidden p-4">
      {/* Full Screen Grainient Background */}
      <div className="absolute inset-0 z-0 opacity-80">
        <Grainient 
          color1="#1E3A8A" 
          color2="#EFC94B" 
          color3="#0F172A" 
          className="w-full h-full"
        />
      </div>

      {/* Branding - Top Left (Desktop) */}
      <div className="absolute top-8 left-8 md:top-12 md:left-12 z-10 hidden md:block">
        <div className="flex items-center gap-4">
          <img src="/logo/LOGO%20TACTLINK%20TRANSPARAN.png" alt="TactLink Logo" className="h-12 w-auto object-contain bg-white p-2 rounded-xl shadow-lg" />
          <div className="flex flex-col">
            <h1 className="text-3xl font-extrabold tracking-tight text-white drop-shadow-md">TactLink</h1>
            <p className="text-white/90 mt-0.5 text-sm font-light drop-shadow-md">Integrated Attendance & Management System</p>
          </div>
        </div>
      </div>

      {/* Welcome Message - Bottom Left (Desktop) */}
      <div className="absolute bottom-8 left-8 md:bottom-12 md:left-12 z-10 hidden md:block">
        <div className="bg-white/10 p-6 rounded-3xl backdrop-blur-md border border-white/20 shadow-2xl max-w-sm">
          <h2 className="text-2xl font-bold mb-2 text-[#EFC94B]">Welcome Back!</h2>
          <p className="text-blue-50 text-base mb-1">Sign in to your account</p>
          <p className="text-blue-100/80 text-sm">
            Access the TactLink internal management and attendance portal securely.
          </p>
        </div>
      </div>

      {/* Login Card */}
      <div className="w-full max-w-md bg-white/95 backdrop-blur-2xl rounded-3xl shadow-[0_20px_60px_-15px_rgba(45,58,110,0.5)] p-8 sm:p-10 border border-white/20 relative z-10">
        
        {/* Mobile Header (Hidden on Desktop) */}
        <div className="text-center mb-6 flex flex-col items-center md:hidden">
          <img src="/logo/LOGO%20TACTLINK%20TRANSPARAN.png" alt="TactLink Logo" className="h-16 w-auto object-contain bg-white p-2.5 rounded-2xl shadow-sm mb-5" />
          <h2 className="text-2xl font-extrabold text-gray-900 tracking-tight">TactLink</h2>
          <p className="text-sm text-gray-500 mt-1 font-medium">Integrated Attendance & Management System</p>
        </div>

        <div className="text-center mb-8 hidden md:block">
          <h3 className="text-2xl font-bold text-gray-900">Sign In</h3>
          <p className="text-sm text-gray-500 mt-1">Enter your email and password</p>
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
                placeholder="Enter your email"
              />
            </div>
            
            <div>
              <div className="flex justify-between items-center mb-1">
                <label className="block text-sm font-medium text-gray-700">Password</label>
                <Link href="/lupa-password" className="text-sm font-medium text-blue-600 hover:text-blue-500 transition-colors">
                  Forgot Password?
                </Link>
              </div>
              <div className="relative">
                <input
                  type={showPassword ? "text" : "password"}
                  required
                  className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 focus:bg-white outline-none transition-all text-gray-900 pr-12"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Enter your password"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute inset-y-0 right-0 pr-4 flex items-center text-gray-400 hover:text-gray-600 focus:outline-none"
                >
                  {showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
                </button>
              </div>
            </div>

            <div className="flex items-center">
              <input
                id="remember-me"
                type="checkbox"
                className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                checked={rememberMe}
                onChange={(e) => setRememberMe(e.target.checked)}
              />
              <label htmlFor="remember-me" className="ml-2 block text-sm text-gray-700 cursor-pointer">
                Remember Me
              </label>
            </div>

            <button
              type="submit"
              disabled={isLoading}
              className="w-full py-3 px-4 mt-6 bg-[#394887] hover:bg-[#2D3A6E] active:scale-[0.98] hover:-translate-y-0.5 text-white font-semibold rounded-lg shadow-md hover:shadow-lg transition-all duration-200 disabled:opacity-70 disabled:cursor-not-allowed disabled:transform-none disabled:shadow-none flex justify-center items-center"
            >
              {isLoading ? (
                <>
                  <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                  Signing in...
                </>
              ) : (
                "Sign In"
              )}
            </button>
          </form>
          
        </div>
    </div>
  );
}
