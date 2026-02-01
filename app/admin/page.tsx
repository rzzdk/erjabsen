'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { 
  Users, Clock, CheckCircle2, AlertCircle, XCircle, 
  ChevronRight, Calendar, Loader2, LogIn, LogOut 
} from 'lucide-react'
import { getSession } from '@/lib/auth'
import { formatDate } from '@/lib/config'
import type { UserSession, DashboardStats, AttendanceWithUser } from '@/lib/types'

export default function AdminDashboardPage() {
  const [user, setUser] = useState<UserSession | null>(null)
  const [stats, setStats] = useState<DashboardStats | null>(null)
  const [todayAttendances, setTodayAttendances] = useState<AttendanceWithUser[]>([])
  const [currentTime, setCurrentTime] = useState(new Date())
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    const session = getSession()
    setUser(session)
    
    fetchDashboardData()

    const interval = setInterval(() => {
      setCurrentTime(new Date())
    }, 1000)

    return () => clearInterval(interval)
  }, [])

  const fetchDashboardData = async () => {
    const today = new Date().toISOString().split('T')[0]
    
    try {
      const [statsRes, attendancesRes] = await Promise.all([
        fetch(`/api/attendance?type=stats&date=${today}`),
        fetch(`/api/attendance?type=all&date=${today}`),
      ])
      
      const statsData = await statsRes.json()
      const attendancesData = await attendancesRes.json()
      
      if (statsData.success) setStats(statsData.data)
      if (attendancesData.success) setTodayAttendances(attendancesData.data || [])
    } catch (error) {
      console.error('Error fetching dashboard data:', error)
    } finally {
      setIsLoading(false)
    }
  }

  const getStatusBadge = (attendance: AttendanceWithUser) => {
    if (attendance.status === 'telat') {
      return <Badge className="bg-warning text-warning-foreground">Terlambat</Badge>
    }
    if (attendance.waktu_keluar) {
      return <Badge className="bg-success text-success-foreground">Selesai</Badge>
    }
    return <Badge className="bg-primary">Hadir</Badge>
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-foreground">Dashboard Admin</h1>
        <p className="text-muted-foreground mt-1">
          {formatDate(currentTime)}
        </p>
      </div>

      {/* Stats Cards */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Total Karyawan</p>
                <p className="text-3xl font-bold mt-1">{stats?.total_karyawan || 0}</p>
              </div>
              <div className="flex items-center justify-center w-12 h-12 rounded-full bg-primary/10">
                <Users className="h-6 w-6 text-primary" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Hadir Hari Ini</p>
                <p className="text-3xl font-bold mt-1 text-success">{stats?.hadir_hari_ini || 0}</p>
              </div>
              <div className="flex items-center justify-center w-12 h-12 rounded-full bg-success/10">
                <CheckCircle2 className="h-6 w-6 text-success" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Terlambat</p>
                <p className="text-3xl font-bold mt-1 text-warning">{stats?.telat_hari_ini || 0}</p>
              </div>
              <div className="flex items-center justify-center w-12 h-12 rounded-full bg-warning/10">
                <AlertCircle className="h-6 w-6 text-warning" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Tidak Hadir</p>
                <p className="text-3xl font-bold mt-1 text-destructive">{stats?.tidak_hadir || 0}</p>
              </div>
              <div className="flex items-center justify-center w-12 h-12 rounded-full bg-destructive/10">
                <XCircle className="h-6 w-6 text-destructive" />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Quick Actions */}
      <div className="grid gap-4 md:grid-cols-3">
        <Link href="/admin/karyawan">
          <Card className="hover:bg-muted/50 transition-colors cursor-pointer">
            <CardContent className="flex items-center justify-between p-4">
              <div className="flex items-center gap-3">
                <div className="flex items-center justify-center w-10 h-10 rounded-lg bg-primary/10">
                  <Users className="h-5 w-5 text-primary" />
                </div>
                <div>
                  <p className="font-medium">Kelola Karyawan</p>
                  <p className="text-sm text-muted-foreground">Tambah, edit, hapus</p>
                </div>
              </div>
              <ChevronRight className="h-5 w-5 text-muted-foreground" />
            </CardContent>
          </Card>
        </Link>

        <Link href="/admin/presensi">
          <Card className="hover:bg-muted/50 transition-colors cursor-pointer">
            <CardContent className="flex items-center justify-between p-4">
              <div className="flex items-center gap-3">
                <div className="flex items-center justify-center w-10 h-10 rounded-lg bg-accent/10">
                  <Clock className="h-5 w-5 text-accent" />
                </div>
                <div>
                  <p className="font-medium">Data Presensi</p>
                  <p className="text-sm text-muted-foreground">Lihat semua presensi</p>
                </div>
              </div>
              <ChevronRight className="h-5 w-5 text-muted-foreground" />
            </CardContent>
          </Card>
        </Link>

        <Link href="/admin/laporan">
          <Card className="hover:bg-muted/50 transition-colors cursor-pointer">
            <CardContent className="flex items-center justify-between p-4">
              <div className="flex items-center gap-3">
                <div className="flex items-center justify-center w-10 h-10 rounded-lg bg-success/10">
                  <Calendar className="h-5 w-5 text-success" />
                </div>
                <div>
                  <p className="font-medium">Laporan</p>
                  <p className="text-sm text-muted-foreground">Download laporan</p>
                </div>
              </div>
              <ChevronRight className="h-5 w-5 text-muted-foreground" />
            </CardContent>
          </Card>
        </Link>
      </div>

      {/* Today's Attendance */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between pb-2">
          <CardTitle className="text-lg">Presensi Hari Ini</CardTitle>
          <Link href="/admin/presensi" className="text-sm text-primary hover:underline">
            Lihat Semua
          </Link>
        </CardHeader>
        <CardContent>
          {todayAttendances.length === 0 ? (
            <div className="text-center py-8">
              <Clock className="h-12 w-12 text-muted-foreground mx-auto mb-3" />
              <p className="text-muted-foreground">Belum ada data presensi hari ini</p>
            </div>
          ) : (
            <div className="space-y-3">
              {todayAttendances.slice(0, 5).map((attendance) => (
                <div 
                  key={attendance.id}
                  className="flex items-center justify-between p-3 bg-muted/50 rounded-lg"
                >
                  <div className="flex items-center gap-3">
                    <div className="flex items-center justify-center w-10 h-10 rounded-full bg-background font-medium">
                      {attendance.user?.nama_lengkap?.split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase()}
                    </div>
                    <div>
                      <p className="font-medium text-sm">{attendance.user?.nama_lengkap}</p>
                      <p className="text-xs text-muted-foreground">{attendance.user?.jabatan}</p>
                    </div>
                  </div>
                  
                  <div className="flex items-center gap-4">
                    <div className="text-right">
                      <div className="flex items-center gap-2 text-sm">
                        <LogIn className="h-3 w-3 text-muted-foreground" />
                        <span>{attendance.waktu_masuk || '-'}</span>
                      </div>
                      <div className="flex items-center gap-2 text-sm">
                        <LogOut className="h-3 w-3 text-muted-foreground" />
                        <span>{attendance.waktu_keluar || '-'}</span>
                      </div>
                    </div>
                    {getStatusBadge(attendance)}
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
