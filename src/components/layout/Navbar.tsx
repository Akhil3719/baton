"use client";

import React, { useState } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { DEMO_USERS } from "@/lib/auth/demo-users";
import { DemoUser } from "@/types/handover";
import { 
  Shield, 
  UserCheck, 
  Users, 
  ChevronDown, 
  LogOut, 
  BookOpen, 
  Cpu, 
  CheckSquare, 
  History, 
  Clock, 
  Eye, 
  FileText
} from "lucide-react";

interface NavbarProps {
  currentUser: DemoUser;
}

export function Navbar({ currentUser }: NavbarProps) {
  const pathname = usePathname();
  const router = useRouter();
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const [isSwitching, setIsSwitching] = useState(false);

  const handleRoleSwitch = async (roleKey: string) => {
    setIsSwitching(true);
    try {
      const res = await fetch("/api/auth/demo-switch", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ roleKey }),
      });
      if (res.ok) {
        setDropdownOpen(false);
        router.refresh();
      }
    } finally {
      setIsSwitching(false);
    }
  };

  const getRoleBadge = (role: string) => {
    switch (role) {
      case "owner_reviewer":
        return {
          label: "Owner / Reviewer",
          bg: "bg-purple-100 text-purple-800 border-purple-300 dark:bg-purple-950 dark:text-purple-300",
          icon: <Shield className="w-3.5 h-3.5 mr-1 text-purple-600" />,
        };
      case "incoming_lead":
        return {
          label: "Incoming Lead",
          bg: "bg-blue-100 text-blue-800 border-blue-300 dark:bg-blue-950 dark:text-blue-300",
          icon: <UserCheck className="w-3.5 h-3.5 mr-1 text-blue-600" />,
        };
      case "contributor":
      default:
        return {
          label: "Contributor",
          bg: "bg-emerald-100 text-emerald-800 border-emerald-300 dark:bg-emerald-950 dark:text-emerald-300",
          icon: <Users className="w-3.5 h-3.5 mr-1 text-emerald-600" />,
        };
    }
  };

  const badge = getRoleBadge(currentUser.role);

  // Dynamic navigation items based on role permissions
  const navItems = [
    { label: "Dashboard", href: "/dashboard", icon: BookOpen, show: true },
    { 
      label: "Sources", 
      href: "/dashboard/sources", 
      icon: FileText, 
      show: true 
    },
    { 
      label: "Reconstruct", 
      href: "/dashboard/reconstruct", 
      icon: Cpu, 
      show: currentUser.role === "owner_reviewer" 
    },
    { 
      label: "Review Workspace", 
      href: "/dashboard/review", 
      icon: CheckSquare, 
      show: currentUser.role === "owner_reviewer" 
    },
    { 
      label: "Timeline", 
      href: "/dashboard/timeline", 
      icon: Clock, 
      show: currentUser.role !== "contributor" 
    },
    { 
      label: "Preview", 
      href: "/dashboard/preview", 
      icon: Eye, 
      show: currentUser.role === "owner_reviewer" 
    },
    { 
      label: "Handover", 
      href: "/dashboard/handover", 
      icon: CheckSquare, 
      show: true 
    },
    { 
      label: "Audit Log", 
      href: "/dashboard/audit", 
      icon: History, 
      show: currentUser.role === "owner_reviewer" 
    },
  ];

  return (
    <header className="sticky top-0 z-50 w-full border-b bg-white/95 backdrop-blur supports-[backdrop-filter]:bg-white/60">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex h-16 items-center justify-between">
          {/* Logo & Brand */}
          <div className="flex items-center space-x-6">
            <Link href="/dashboard" className="flex items-center space-x-2">
              <div className="w-8 h-8 rounded-lg bg-indigo-600 flex items-center justify-center text-white font-bold text-lg shadow-sm">
                B
              </div>
              <div className="flex flex-col">
                <span className="font-bold tracking-tight text-slate-900 text-base leading-none">
                  BATON
                </span>
                <span className="text-[10px] text-slate-500 font-medium">
                  Knowledge Handover
                </span>
              </div>
            </Link>

            {/* Navigation Links */}
            <nav className="hidden md:flex items-center space-x-1">
              {navItems
                .filter((item) => item.show)
                .map((item) => {
                  const isActive = pathname === item.href;
                  const Icon = item.icon;
                  return (
                    <Link
                      key={item.href}
                      href={item.href}
                      className={`inline-flex items-center px-3 py-1.5 rounded-md text-xs font-medium transition-colors ${
                        isActive
                          ? "bg-slate-100 text-slate-900 font-semibold"
                          : "text-slate-600 hover:text-slate-900 hover:bg-slate-50"
                      }`}
                    >
                      <Icon className="w-3.5 h-3.5 mr-1.5 opacity-70" />
                      {item.label}
                    </Link>
                  );
                })}
            </nav>
          </div>

          {/* Role Switcher & Persona Indicator */}
          <div className="relative">
            <button
              onClick={() => setDropdownOpen(!dropdownOpen)}
              className="flex items-center space-x-2.5 p-1.5 pr-3 rounded-full border border-slate-200 hover:border-slate-300 bg-white hover:bg-slate-50 transition-all text-left shadow-sm"
            >
              <div className="w-7 h-7 rounded-full bg-slate-100 flex items-center justify-center font-semibold text-xs text-slate-700">
                {currentUser.name.charAt(0)}
              </div>
              <div className="flex flex-col text-left">
                <span className="text-xs font-semibold text-slate-900 leading-tight">
                  {currentUser.name.split(" ")[0]}
                </span>
                <span className={`inline-flex items-center text-[10px] font-medium px-1.5 py-0.2 rounded border ${badge.bg}`}>
                  {badge.icon}
                  {badge.label}
                </span>
              </div>
              <ChevronDown className="w-3.5 h-3.5 text-slate-400" />
            </button>

            {/* Dropdown Menu */}
            {dropdownOpen && (
              <div className="absolute right-0 mt-2 w-80 rounded-xl bg-white shadow-xl border border-slate-200 py-2 z-50 text-slate-900">
                <div className="px-4 py-2 border-b border-slate-100">
                  <p className="text-[11px] font-semibold uppercase tracking-wider text-slate-400">
                    Switch Persona (Judge Testing)
                  </p>
                  <p className="text-xs text-slate-600 mt-0.5">
                    Test RLS boundaries instantly with zero login friction.
                  </p>
                </div>

                <div className="py-1">
                  {Object.entries(DEMO_USERS).map(([key, user]) => {
                    const isCurrent = user.id === currentUser.id;
                    return (
                      <button
                        key={key}
                        onClick={() => handleRoleSwitch(key)}
                        disabled={isSwitching}
                        className={`w-full text-left px-4 py-2.5 flex items-start space-x-3 hover:bg-slate-50 transition-colors ${
                          isCurrent ? "bg-slate-50/80 font-medium" : ""
                        }`}
                      >
                        <div className="mt-0.5">
                          {user.role === "owner_reviewer" && (
                            <Shield className="w-4 h-4 text-purple-600" />
                          )}
                          {user.role === "incoming_lead" && (
                            <UserCheck className="w-4 h-4 text-blue-600" />
                          )}
                          {user.role === "contributor" && (
                            <Users className="w-4 h-4 text-emerald-600" />
                          )}
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center justify-between">
                            <span className="text-xs font-semibold text-slate-900 truncate">
                              {user.name}
                            </span>
                            {isCurrent && (
                              <span className="text-[10px] bg-indigo-50 text-indigo-700 px-1.5 py-0.5 rounded font-semibold">
                                Active
                              </span>
                            )}
                          </div>
                          <p className="text-[11px] text-slate-500 truncate">
                            {user.title}
                          </p>
                          <p className="text-[10px] text-slate-400 line-clamp-1 mt-0.5">
                            {user.description}
                          </p>
                        </div>
                      </button>
                    );
                  })}
                </div>

                <div className="border-t border-slate-100 pt-1 mt-1">
                  <Link
                    href="/login"
                    onClick={() => setDropdownOpen(false)}
                    className="flex items-center px-4 py-2 text-xs text-slate-600 hover:text-slate-900 hover:bg-slate-50"
                  >
                    <LogOut className="w-3.5 h-3.5 mr-2" />
                    Back to Login Page
                  </Link>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </header>
  );
}
