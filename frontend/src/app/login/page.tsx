"use client";

export const dynamic = "force-dynamic";

import React, { useState, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Lock, Mail, Loader2, AlertCircle, CheckCircle } from "lucide-react";

function LoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    setSuccess(null);

    if (!email || !password) {
      setError("Please fill in all fields.");
      setLoading(false);
      return;
    }

    try {
      const res = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || "Login failed");
      }

      setSuccess("Authentication successful! Redirecting...");

      const fromPath = searchParams?.get("from") || "/";

      setTimeout(() => {
        router.push(fromPath);
        router.refresh();
      }, 1000);
    } catch (err: unknown) {
      const errorMessage = err instanceof Error ? err.message : "Something went wrong. Please try again.";
      setError(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Card className="border-slate-200/80 bg-white rounded-[24px] shadow-lg shadow-slate-100 max-w-md w-full">
      <CardHeader className="space-y-2 pt-2 pb-4">
        <div className="flex justify-center mb-2">
        </div>
        <CardTitle className="text-2xl font-bold text-slate-900 text-center">Sign In</CardTitle>
        <CardDescription className="text-slate-500 text-center text-sm">
          Enter your organizational credentials to manage the Reliance ECA/CCA Directory
        </CardDescription>
      </CardHeader>
      <form onSubmit={handleSubmit}>
        <CardContent className="space-y-4 px-8 pt-4 pb-6">
          {/* Error Message */}
          {error && (
            <div className="flex items-center gap-2 p-3 text-sm text-red-800 bg-red-50 border border-red-200 rounded-xl">
              <AlertCircle className="h-4 w-4 shrink-0 text-red-600" />
              <span className="font-medium">{error}</span>
            </div>
          )}

          {/* Success Message */}
          {success && (
            <div className="flex items-center gap-2 p-3 text-sm text-emerald-800 bg-emerald-50 border border-emerald-200 rounded-xl">
              <CheckCircle className="h-4 w-4 shrink-0 text-emerald-600" />
              <span className="font-medium">{success}</span>
            </div>
          )}

          {/* Email field */}
          <div className="space-y-1.5">
            <Label htmlFor="email" className="text-slate-600 text-sm font-semibold">Email Address</Label>
            <div className="relative">
              <Mail className="absolute left-3.5 top-3.5 h-4.5 w-4.5 text-slate-400" />
              <Input
                id="email"
                type="email"
                placeholder="name@reliance.edu.np"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="pl-11 h-11 bg-slate-50 border-slate-200 text-slate-800 placeholder-slate-400 focus:border-blue-500 rounded-xl"
                disabled={loading}
                required
              />
            </div>
          </div>

          {/* Password field */}
          <div className="space-y-1.5">
            <Label htmlFor="password" className="text-slate-600 text-sm font-semibold">Password</Label>
            <div className="relative">
              <Lock className="absolute left-3.5 top-3.5 h-4.5 w-4.5 text-slate-400" />
              <Input
                id="password"
                type="password"
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="pl-11 h-11 bg-slate-50 border-slate-200 text-slate-800 placeholder-slate-400 focus:border-blue-500 rounded-xl"
                disabled={loading}
                required
              />
            </div>
          </div>
        </CardContent>
        <CardFooter className="px-8 pb-8 flex flex-col space-y-4">
          <Button
            type="submit"
            className="w-full h-11 bg-blue-600 hover:bg-blue-500 text-white font-semibold rounded-xl transition-colors"
            disabled={loading}
          >
            {loading ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Signing in...
              </>
            ) : (
              "Sign In"
            )}
          </Button>
        </CardFooter>
      </form>
    </Card>
  );
}

export default function LoginPage() {
  return (
    <div className="relative min-h-screen flex items-center justify-center bg-slate-50 overflow-hidden font-sans">
      {/* Background soft geometric patterns */}
      <div className="absolute top-0 right-0 w-96 h-96 bg-blue-100/40 rounded-full blur-3xl -mr-20 -mt-20" />
      <div className="absolute bottom-0 left-0 w-96 h-96 bg-indigo-100/30 rounded-full blur-3xl -ml-20 -mb-20" />

      {/* Main card container */}
      <div className="relative z-10 w-full max-w-md px-4 flex flex-col items-center">
        <div className="mb-6 text-center">
          <h1 className="text-3xl font-extrabold tracking-tight text-slate-900 mb-1">
            Reliance Education Network
          </h1>
          <p className="text-slate-500 text-sm font-medium">
            ECA / CCA Management Portal
          </p>
        </div>

        <Suspense fallback={
          <Card className="border-slate-200 bg-white shadow-lg shadow-slate-100 p-8 flex flex-col items-center justify-center min-h-[350px] w-full rounded-[24px]">
            <Loader2 className="h-8 w-8 text-blue-600 animate-spin mb-4" />
            <p className="text-slate-500 text-sm font-medium">Loading login portal...</p>
          </Card>
        }>
          <LoginForm />
        </Suspense>

        <p className="mt-8 text-center text-xs text-slate-400 font-medium">
          &copy; {new Date().getFullYear()} Reliance Education Network. All rights reserved.
        </p>
      </div>
    </div>
  );
}
