"use client";

import React from "react"

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { getSession } from "@/lib/auth";
import { AdminSidebar } from "@/components/admin-sidebar";
import { AdminMobileHeader } from "@/components/admin-mobile-header";
import { SidebarProvider, SidebarInset } from "@/components/ui/sidebar";
import type { UserSession } from "@/lib/types";
import { Loader2 } from "lucide-react";

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const router = useRouter();
  const [user, setUser] = useState<UserSession | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const session = getSession();
    if (!session) {
      router.push("/");
      return;
    }

    if (session.role !== "admin") {
      router.push("/dashboard");
      return;
    }

    setUser(session);
    setIsLoading(false);
  }, [router]);

  if (isLoading || !user) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <SidebarProvider>
      <div className="flex min-h-screen w-full bg-background">
        {/* Desktop Sidebar */}
        <div className="hidden lg:block">
          <AdminSidebar />
        </div>

        {/* Main Content */}
        <SidebarInset className="flex flex-1 flex-col">
          {/* Mobile Header */}
          <AdminMobileHeader user={user} />

          <main className="flex-1 p-4 lg:p-8">{children}</main>
        </SidebarInset>
      </div>
    </SidebarProvider>
  );
}
