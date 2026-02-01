"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import {
  Building2,
  Menu,
  X,
  LayoutDashboard,
  Users,
  ClipboardList,
  FileSpreadsheet,
  Settings,
  LogOut,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import type { UserSession } from "@/lib/types";

const menuItems = [
  {
    title: "Dashboard",
    url: "/admin",
    icon: LayoutDashboard,
  },
  {
    title: "Data Karyawan",
    url: "/admin/karyawan",
    icon: Users,
  },
  {
    title: "Data Presensi",
    url: "/admin/presensi",
    icon: ClipboardList,
  },
  {
    title: "Laporan",
    url: "/admin/laporan",
    icon: FileSpreadsheet,
  },
  {
    title: "Pengaturan",
    url: "/admin/pengaturan",
    icon: Settings,
  },
];

interface AdminMobileHeaderProps {
  user: UserSession;
}

export function AdminMobileHeader({ user }: AdminMobileHeaderProps) {
  const [open, setOpen] = useState(false);
  const pathname = usePathname();
  const router = useRouter();

  const handleLogout = () => {
    document.cookie = "session=; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT";
    router.push("/");
  };

  return (
    <header className="sticky top-0 z-50 flex h-14 items-center justify-between border-b border-border bg-card px-4 lg:hidden">
      <Link href="/admin" className="flex items-center gap-2">
        <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary text-primary-foreground">
          <Building2 className="h-5 w-5" />
        </div>
        <span className="text-sm font-bold text-foreground">Admin Panel</span>
      </Link>

      <Sheet open={open} onOpenChange={setOpen}>
        <SheetTrigger asChild>
          <Button variant="ghost" size="icon" className="text-foreground">
            <Menu className="h-5 w-5" />
            <span className="sr-only">Toggle menu</span>
          </Button>
        </SheetTrigger>
        <SheetContent side="right" className="w-72 bg-card p-0">
          <div className="flex h-14 items-center justify-between border-b border-border px-4">
            <span className="text-sm font-semibold text-foreground">Menu</span>
            <Button
              variant="ghost"
              size="icon"
              onClick={() => setOpen(false)}
              className="text-foreground"
            >
              <X className="h-5 w-5" />
            </Button>
          </div>

          <div className="p-4">
            <div className="mb-4 rounded-lg bg-muted p-3">
              <p className="text-sm font-medium text-foreground">
                {user.fullName}
              </p>
              <p className="text-xs text-muted-foreground">Administrator</p>
            </div>

            <nav className="space-y-1">
              {menuItems.map((item) => (
                <Link
                  key={item.title}
                  href={item.url}
                  onClick={() => setOpen(false)}
                  className={`flex items-center gap-3 rounded-lg px-3 py-2 text-sm transition-colors ${
                    pathname === item.url
                      ? "bg-primary text-primary-foreground"
                      : "text-foreground hover:bg-muted"
                  }`}
                >
                  <item.icon className="h-4 w-4" />
                  {item.title}
                </Link>
              ))}
            </nav>

            <div className="mt-6 border-t border-border pt-4">
              <Button
                variant="ghost"
                className="w-full justify-start text-destructive hover:bg-destructive/10 hover:text-destructive"
                onClick={handleLogout}
              >
                <LogOut className="mr-2 h-4 w-4" />
                Keluar
              </Button>
            </div>
          </div>
        </SheetContent>
      </Sheet>
    </header>
  );
}
