"use client";

import { useState } from "react";
import { signIn } from "next-auth/react";
import { toast } from "sonner";
import { useRouter } from "next/navigation";

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);

    try {
      const result = await signIn("credentials", {
        email,
        password,
        redirect: false, // Prevent NextAuth default redirect behavior to handle errors nicely
      });

      if (result?.error) {
        toast.error("Invalid credentials. Try using one of the test logins below.");
      } else {
        toast.success("Successfully logged in!");
        router.push("/dashboard");
        router.refresh();
      }
    } catch {
      toast.error("An error occurred during sign in.");
    } finally {
      setLoading(false);
    }
  }

  function handleQuickLogin(roleEmail: string) {
    setEmail(roleEmail);
    setPassword("password123");
    toast.info(`Test credentials filled for ${roleEmail}`);
  }

  return (
    <div className="min-h-screen bg-slate-900 text-slate-100 flex items-center justify-center p-6 relative">
      {/* Glow effects */}
      <div className="absolute top-1/4 left-1/2 -translate-x-1/2 w-[350px] h-[350px] bg-blue-500/10 rounded-full blur-[100px] pointer-events-none"></div>

      <div className="w-full max-w-md bg-slate-950/60 border border-slate-800/80 p-8 rounded-2xl shadow-xl backdrop-blur-md relative z-10 flex flex-col gap-6">
        <div className="text-center">
          <h1 className="text-3xl font-black bg-clip-text text-transparent bg-gradient-to-r from-blue-400 to-indigo-400 tracking-wide">
            AasaMedChem
          </h1>
          <p className="text-sm text-slate-400 mt-2 font-light">
            Sign in to access your chemical marketplace portal
          </p>
        </div>

        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          <div className="flex flex-col gap-1">
            <label className="text-xs font-semibold text-slate-400 uppercase tracking-wider">
              Email Address
            </label>
            <input
              type="email"
              required
              placeholder="name@domain.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="border border-slate-800 rounded-lg px-3 py-2.5 bg-slate-900 focus:outline-hidden focus:ring-2 focus:ring-blue-500/30 focus:border-blue-500 outline-hidden text-sm text-white"
            />
          </div>

          <div className="flex flex-col gap-1">
            <label className="text-xs font-semibold text-slate-400 uppercase tracking-wider">
              Password
            </label>
            <input
              type="password"
              required
              placeholder="••••••••"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="border border-slate-800 rounded-lg px-3 py-2.5 bg-slate-900 focus:outline-hidden focus:ring-2 focus:ring-blue-500/30 focus:border-blue-500 outline-hidden text-sm text-white"
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className="mt-2 w-full bg-blue-600 hover:bg-blue-500 text-white font-bold py-3 rounded-lg text-sm shadow-md shadow-blue-500/10 hover:shadow-blue-500/20 transition-all disabled:opacity-50"
          >
            {loading ? "Signing in..." : "Login"}
          </button>
        </form>

        {/* Quick Logins for Evaluator */}
        <div className="border-t border-slate-800 pt-6">
          <p className="text-xs font-semibold text-slate-400 text-center uppercase tracking-wider mb-3">
            Quick Test Accounts (Click to Fill)
          </p>
          <div className="grid grid-cols-3 gap-2.5">
            <button
              onClick={() => handleQuickLogin("admin@aasa.com")}
              className="px-2 py-2 bg-slate-900 border border-slate-800 rounded-lg text-xs font-medium text-blue-450 hover:bg-slate-800/80 transition-colors text-center"
            >
              Admin
            </button>
            <button
              onClick={() => handleQuickLogin("seller@aasa.com")}
              className="px-2 py-2 bg-slate-900 border border-slate-800 rounded-lg text-xs font-medium text-emerald-450 hover:bg-slate-800/80 transition-colors text-center"
            >
              Seller
            </button>
            <button
              onClick={() => handleQuickLogin("buyer@aasa.com")}
              className="px-2 py-2 bg-slate-900 border border-slate-800 rounded-lg text-xs font-medium text-indigo-405 hover:bg-slate-800/80 transition-colors text-center"
            >
              Buyer
            </button>
          </div>
          <p className="text-[10px] text-slate-500 text-center mt-3 font-mono">
            Default password for all test accounts is <strong className="text-slate-400">password123</strong>
          </p>
        </div>
      </div>
    </div>
  );
}