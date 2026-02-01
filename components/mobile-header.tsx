'use client'

import { useState } from 'react'
import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import { Building2, Menu, X, LayoutDashboard, Clock, History, Users, FileSpreadsheet, LogOut } from 'lucide-react'
import { cn } from '@/lib/utils'
import { Button } from '@/components/ui/button'
import { Sheet, SheetContent, SheetTrigger } from '@/components/ui/sheet'
import { clearSession } from '@/lib/auth'
import { APP_CONFIG } from '@/lib/config'
import type { UserSession } from '@/lib/types'

interface MobileHeaderProps {
  user: UserSession
}

const karyawanMenuItems = [
  { href: '/dashboard', icon: LayoutDashboard, label: 'Dashboard' },
  { href: '/dashboard/presensi', icon: Clock, label: 'Presensi' },
  { href: '/dashboard/riwayat', icon: History, label: 'Riwayat' },
]

const adminMenuItems = [
  { href: '/admin', icon: LayoutDashboard, label: 'Dashboard' },
  { href: '/admin/karyawan', icon: Users, label: 'Karyawan' },
  { href: '/admin/presensi', icon: Clock, label: 'Data Presensi' },
  { href: '/admin/laporan', icon: FileSpreadsheet, label: 'Laporan' },
]

export function MobileHeader({ user }: MobileHeaderProps) {
  const pathname = usePathname()
  const router = useRouter()
  const [open, setOpen] = useState(false)
  
  const menuItems = user.role === 'admin' ? adminMenuItems : karyawanMenuItems

  const handleLogout = () => {
    clearSession()
    router.push('/')
  }

  return (
    <header className="lg:hidden fixed top-0 left-0 right-0 z-50 bg-sidebar border-b border-sidebar-border">
      <div className="flex items-center justify-between px-4 py-3">
        <div className="flex items-center gap-3">
          <div className="flex items-center justify-center w-8 h-8 rounded-lg bg-sidebar-primary">
            <Building2 className="h-4 w-4 text-sidebar-primary-foreground" />
          </div>
          <span className="text-sm font-semibold text-sidebar-foreground">
            Presensi
          </span>
        </div>

        <Sheet open={open} onOpenChange={setOpen}>
          <SheetTrigger asChild>
            <Button variant="ghost" size="icon" className="text-sidebar-foreground">
              <Menu className="h-5 w-5" />
              <span className="sr-only">Toggle menu</span>
            </Button>
          </SheetTrigger>
          <SheetContent side="right" className="w-72 p-0 bg-sidebar border-sidebar-border">
            <div className="flex h-full flex-col">
              {/* Header */}
              <div className="flex items-center justify-between px-4 py-4 border-b border-sidebar-border">
                <span className="text-sm font-semibold text-sidebar-foreground">Menu</span>
              </div>

              {/* User Info */}
              <div className="px-4 py-4 border-b border-sidebar-border">
                <div className="flex items-center gap-3">
                  <div className="flex items-center justify-center w-10 h-10 rounded-full bg-sidebar-accent text-sidebar-accent-foreground font-medium">
                    {user.nama_lengkap.split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase()}
                  </div>
                  <div className="flex flex-col min-w-0">
                    <span className="text-sm font-medium text-sidebar-foreground truncate">
                      {user.nama_lengkap}
                    </span>
                    <span className="text-xs text-sidebar-foreground/70 truncate">
                      {user.jabatan}
                    </span>
                  </div>
                </div>
              </div>

              {/* Navigation */}
              <nav className="flex-1 px-4 py-4 space-y-1 overflow-y-auto">
                {menuItems.map((item) => {
                  const isActive = pathname === item.href
                  return (
                    <Link
                      key={item.href}
                      href={item.href}
                      onClick={() => setOpen(false)}
                      className={cn(
                        'flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors',
                        isActive
                          ? 'bg-sidebar-accent text-sidebar-accent-foreground'
                          : 'text-sidebar-foreground/70 hover:bg-sidebar-accent/50 hover:text-sidebar-foreground'
                      )}
                    >
                      <item.icon className="h-5 w-5" />
                      {item.label}
                    </Link>
                  )
                })}
              </nav>

              {/* Footer */}
              <div className="px-4 py-4 border-t border-sidebar-border">
                <Button
                  variant="ghost"
                  className="w-full justify-start gap-3 text-sidebar-foreground/70 hover:text-sidebar-foreground hover:bg-sidebar-accent/50"
                  onClick={handleLogout}
                >
                  <LogOut className="h-5 w-5" />
                  Keluar
                </Button>
              </div>
            </div>
          </SheetContent>
        </Sheet>
      </div>
    </header>
  )
}
