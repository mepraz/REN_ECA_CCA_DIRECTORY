"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { LogOut, Loader2 } from "lucide-react";

export default function LogoutButton() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const backend = process.env.NEXT_PUBLIC_BACKEND_URL;
  if (!backend)
    throw new Error("NEXT_PUBLIC_BACKEND_URL is not defined");

  const handleLogout = async () => {
    setLoading(true);
    try {
      const res = await fetch(`${backend}/api/auth/logout`, {
        method: "POST",
      });
      if (res.ok) {
        router.push("/login");
        router.refresh();
      }
    } catch (err) {
      console.error("Logout failed:", err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Button
      onClick={handleLogout}
      variant="ghost"
      className="text-slate-400 hover:text-white hover:bg-slate-800 gap-2 text-sm transition-colors"
      disabled={loading}
    >
      {loading ? (
        <Loader2 className="h-4 w-4 animate-spin" />
      ) : (
        <LogOut className="h-4 w-4" />
      )}
      Logout
    </Button>
  );
}
