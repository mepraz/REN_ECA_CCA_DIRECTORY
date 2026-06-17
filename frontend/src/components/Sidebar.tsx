"use client";

import React from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard,
  Calendar,
  Image as ImageIcon,
  Building2,
  Users,
  User,
  Settings,
  LogOut,
  Shield,
} from "lucide-react";
import { UserRole } from "@/lib/auth";

interface SidebarProps {
  userEmail?: string;
  userRole?: UserRole;
}

export default function Sidebar({ userEmail, userRole }: SidebarProps) {
  const pathname = usePathname();

  const backend = process.env.NEXT_PUBLIC_BACKEND_URL;
  if (!backend)
    throw new Error("NEXT_PUBLIC_BACKEND_URL is not defined");

  const handleLogout = async () => {
    try {
      const res = await fetch(`${backend}/api/auth/logout`, {
        method: "POST",
      });
      if (res.ok) {
        window.location.href = "/login";
      }
    } catch (error) {
      console.error("Logout error:", error);
    }
  };

  const navItems = [
    { name: "Dashboard", href: "/", icon: LayoutDashboard, role: "ALL" },
    { name: "Events", href: "/events", icon: Calendar, role: "ALL" },
    { name: "Gallery", href: "/gallery", icon: ImageIcon, role: "ALL" },
    {
      name: "Organizations",
      href: "/organizations",
      icon: Building2,
      role: UserRole.MAIN_ADMIN,
    },
    {
      name: "Users",
      href: "/dashboard/users",
      icon: Users,
      role: UserRole.MAIN_ADMIN,
    },
    { name: "Profile", href: "/profile", icon: User, role: "ALL" },
    { name: "Settings", href: "/settings", icon: Settings, role: "ALL" },
  ];

  return (
    <aside className="w-64 bg-white border-r border-slate-200 flex flex-col h-screen sticky top-0 shrink-0">
      {/* Sidebar Header */}
      <div className="h-16 flex items-center px-6 border-b border-slate-200 gap-2 shrink-0">
        <Shield className="h-6 w-6 text-blue-600" />
        <span className="font-bold text-lg text-slate-800 tracking-tight">
          Reliance ECA/CCA
        </span>
      </div>

      {/* Navigation Menu */}
      <nav className="flex-1 px-4 py-6 space-y-1 overflow-y-auto">
        {navItems.map((item) => {
          // Check role restrictions
          if (item.role !== "ALL" && userRole !== item.role) {
            return null;
          }

          const isActive = pathname === item.href;
          const Icon = item.icon;

          return (
            <Link
              key={item.name}
              href={item.href}
              className={`flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium transition-all duration-200 ${isActive
                ? "bg-blue-600 text-white shadow-md shadow-blue-500/20"
                : "text-slate-600 hover:bg-slate-50 hover:text-slate-900"
                }`}
            >
              <Icon className="h-5 w-5 shrink-0" />
              <span>{item.name}</span>
            </Link>
          );
        })}
      </nav>

      {/* Sidebar Footer / User Profile & Logout */}
      <div className="p-4 border-t border-slate-200 shrink-0 bg-slate-50/50">
        {userEmail && (
          <div className="px-3 py-2 mb-2">
            <p className="text-xs text-slate-400 font-medium truncate">Logged in as</p>
            <p className="text-sm text-slate-700 font-semibold truncate" title={userEmail}>
              {userEmail}
            </p>
          </div>
        )}
        <button
          onClick={handleLogout}
          className="w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium text-red-600 hover:bg-red-50 transition-colors"
        >
          <LogOut className="h-5 w-5 shrink-0" />
          <span>Logout</span>
        </button>
      </div>
    </aside>
  );
}
