"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";
import {
  LayoutDashboard, Droplets, Bell, Bot, Utensils, Fish, Settings, BookOpen,
} from "lucide-react";
import { PondSwitcher } from "./PondSwitcher";

const NAV_ITEMS = [
  { href: "/dashboard", label: "ড্যাশবোর্ড", icon: LayoutDashboard },
  { href: "/feed", label: "খাবার", icon: Utensils },
  { href: "/courses", label: "কোর্স", icon: BookOpen },
  { href: "/tracking", label: "ট্র্যাকিং", icon: Fish },
  { href: "/alerts", label: "সতর্কতা", icon: Bell },
  { href: "/ai", label: "AI সহকারী", icon: Bot },
];

const BOTTOM_NAV_ITEMS = [
  { href: "/dashboard", label: "ড্যাশবোর্ড", icon: LayoutDashboard },
  { href: "/feed", label: "খাবার", icon: Utensils },
  { href: "/courses", label: "কোর্স", icon: BookOpen },
  { href: "/tracking", label: "ট্র্যাকিং", icon: Fish },
  { href: "/alerts", label: "সতর্কতা", icon: Bell },
  { href: "/ai", label: "AI", icon: Bot },
  { href: "/settings", label: "সেটিংস", icon: Settings },
];

export function Navbar() {
  const pathname = usePathname();

  return (
    <>
      {/* Desktop sidebar */}
      <aside className="hidden lg:flex flex-col w-60 min-h-screen bg-white border-r border-gray-100 fixed left-0 top-0">
        <div className="flex items-center gap-3 px-6 py-5 border-b border-gray-100">
          <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-brand-600">
            <Droplets className="h-5 w-5 text-white" />
          </div>
          <div>
            <p className="font-bold text-gray-900 text-sm leading-tight">AquaFarm</p>
            <p className="text-xs text-gray-500">Pond Manager</p>
          </div>
        </div>
        {/* Pond switcher */}
        <div className="px-3 py-2 border-b border-gray-100">
          <PondSwitcher />
        </div>

        <nav className="flex flex-col gap-1 p-3 flex-1">
          {[...NAV_ITEMS, { href: "/settings", label: "Settings", icon: Settings }].map(({ href, label, icon: Icon }) => {
            const active = pathname.startsWith(href);
            return (
              <Link
                key={href}
                href={href}
                className={cn(
                  "flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition-all",
                  active
                    ? "bg-brand-50 text-brand-700"
                    : "text-gray-600 hover:bg-gray-50 hover:text-gray-900"
                )}
              >
                <Icon className={cn("h-4 w-4", active ? "text-brand-600" : "text-gray-400")} />
                {label}
              </Link>
            );
          })}
        </nav>
        <div className="p-4 border-t border-gray-100">
          <p className="text-xs text-gray-400 text-center">AquaFarm v1.0</p>
        </div>
      </aside>

      {/* Mobile bottom nav */}
      <nav className="lg:hidden fixed bottom-0 left-0 right-0 bg-white border-t border-gray-100 z-40 safe-bottom">
        <div className="flex items-center justify-around px-2 py-2">
          {BOTTOM_NAV_ITEMS.map(({ href, label, icon: Icon }) => {
            const active = pathname.startsWith(href);
            return (
              <Link
                key={href}
                href={href}
                className={cn(
                  "flex flex-col items-center gap-1 px-3 py-1.5 rounded-xl transition-all",
                  active ? "text-brand-600" : "text-gray-400"
                )}
              >
                <Icon className="h-5 w-5" />
                <span className="text-[10px] font-medium">{label}</span>
              </Link>
            );
          })}
        </div>
      </nav>
    </>
  );
}
