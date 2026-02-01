'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Clock, LogIn, LogOut, MapPin, Calendar, ChevronRight, CheckCircle2, XCircle, AlertCircle } from 'lucide-react'
import { getSession } from '@/lib/auth'
import { formatDate, formatTime, APP_CONFIG } from '@/lib/config'
import type { Attendance, UserSession } from '@/lib/types'

export default function DashboardPage() {
  const [user, setUser] = useState<UserSession | null>(null)
  const [todayAttendance, setTodayAttendance] = useState<Attendance | null>(null)
  const [currentTime, setCurrentTime] = useState(new Date())
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    const session = getSession()
    setUser(session)

    if (session) {
      fetchTodayAttendance(session.id)
    }

    // Update time every second
    const interval = setInterval(() => {
      setCurrentTime(new Date())
    }, 1000)

    return () => clearInterval(interval)
  }, [])

  const fetchTodayAttendance = async (userId: string) => {
    try {
      const response = await fetch(`/api/attendance?userId=${userId}&type=today`)
      const data = await response.json()
      if (data.success) {
        setTodayAttendance(data.data)
      }
    } catch (error) {
      console.error('Error fetching attendance:', error)
    } finally {
      setIsLoading(false)
    }
  }

  const getStatusBadge = () => {
    if (!todayAttendance) {
      return <Badge variant="outline" className="bg-muted">Belum Absen</Badge>
    }
    
    if (todayAttendance.status === 'telat') {
      return <Badge className="bg-warning text-warning-foreground">Terlambat</Badge>
    }
    
    if (todayAttendance.waktu_keluar) {
      return <Badge className="bg-success text-success-foreground">Selesai</Badge>
    }
    
    return <Badge className="bg-primary">Sudah Check-in</Badge>
  }

  const getStatusIcon = () => {
    if (!todayAttendance) {
      return <AlertCircle className="h-12 w-12 text-muted-foreground" />
    }
    
    if (todayAttendance.waktu_keluar) {
      return <CheckCircle2 className="h-12 w-12 text-success" />
    }
    
    return <Clock className="h-12 w-12 text-primary" />
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-foreground">
          Selamat Datang, {user?.nama_lengkap?.split(' ')[0]}!
        </h1>
        <p className="text-muted-foreground mt-1">
          {formatDate(currentTime)}
        </p>
      </div>

      {/* Current Time Card */}
      <Card className="bg-primary text-primary-foreground">
        <CardContent className="pt-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-primary-foreground/80 text-sm">Waktu Saat Ini</p>
              <p className="text-4xl font-bold tracking-tight mt-1">
                {currentTime.toLocaleTimeString('id-ID', { 
                  hour: '2-digit', 
                  minute: '2-digit',
                  second: '2-digit',
                  hour12: false 
                })}
              </p>
              <p className="text-primary-foreground/80 text-sm mt-2">
                Jam Kerja: {APP_CONFIG.work_start_time} - {APP_CONFIG.work_end_time}
              </p>
            </div>
            <Clock className="h-16 w-16 text-primary-foreground/30" />
          </div>
        </CardContent>
      </Card>

      {/* Today's Status */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="text-lg">Status Hari Ini</CardTitle>
            {getStatusBadge()}
          </div>
        </CardHeader>
        <CardContent>
          <div className="flex items-center gap-6">
            {getStatusIcon()}
            <div className="flex-1 space-y-3">
              <div className="flex items-center gap-4">
                <div className="flex items-center gap-2">
                  <LogIn className="h-4 w-4 text-muted-foreground" />
                  <span className="text-sm text-muted-foreground">Check-in:</span>
                  <span className="font-medium">
                    {todayAttendance?.waktu_masuk || '-'}
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  <LogOut className="h-4 w-4 text-muted-foreground" />
                  <span className="text-sm text-muted-foreground">Check-out:</span>
                  <span className="font-medium">
                    {todayAttendance?.waktu_keluar || '-'}
                  </span>
                </div>
              </div>
              
              {!todayAttendance && (
                <p className="text-sm text-muted-foreground">
                  Anda belum melakukan presensi hari ini. Silakan lakukan check-in.
                </p>
              )}
              
              {todayAttendance && !todayAttendance.waktu_keluar && (
                <p className="text-sm text-muted-foreground">
                  Anda sudah check-in. Jangan lupa untuk check-out saat pulang.
                </p>
              )}
              
              {todayAttendance?.waktu_keluar && (
                <p className="text-sm text-muted-foreground">
                  Presensi hari ini sudah lengkap. Terima kasih!
                </p>
              )}
            </div>
          </div>

          {/* Action Button */}
          <div className="mt-6">
            <Link href="/dashboard/presensi">
              <Button className="w-full" size="lg">
                {!todayAttendance ? (
                  <>
                    <LogIn className="mr-2 h-5 w-5" />
                    Lakukan Check-in
                  </>
                ) : !todayAttendance.waktu_keluar ? (
                  <>
                    <LogOut className="mr-2 h-5 w-5" />
                    Lakukan Check-out
                  </>
                ) : (
                  <>
                    <CheckCircle2 className="mr-2 h-5 w-5" />
                    Lihat Detail Presensi
                  </>
                )}
              </Button>
            </Link>
          </div>
        </CardContent>
      </Card>

      {/* Quick Links */}
      <div className="grid gap-4 md:grid-cols-2">
        <Link href="/dashboard/presensi">
          <Card className="hover:bg-muted/50 transition-colors cursor-pointer">
            <CardContent className="flex items-center justify-between p-4">
              <div className="flex items-center gap-3">
                <div className="flex items-center justify-center w-10 h-10 rounded-lg bg-primary/10">
                  <Clock className="h-5 w-5 text-primary" />
                </div>
                <div>
                  <p className="font-medium">Presensi</p>
                  <p className="text-sm text-muted-foreground">Check-in & Check-out</p>
                </div>
              </div>
              <ChevronRight className="h-5 w-5 text-muted-foreground" />
            </CardContent>
          </Card>
        </Link>

        <Link href="/dashboard/riwayat">
          <Card className="hover:bg-muted/50 transition-colors cursor-pointer">
            <CardContent className="flex items-center justify-between p-4">
              <div className="flex items-center gap-3">
                <div className="flex items-center justify-center w-10 h-10 rounded-lg bg-accent/10">
                  <Calendar className="h-5 w-5 text-accent" />
                </div>
                <div>
                  <p className="font-medium">Riwayat Presensi</p>
                  <p className="text-sm text-muted-foreground">Lihat sejarah kehadiran</p>
                </div>
              </div>
              <ChevronRight className="h-5 w-5 text-muted-foreground" />
            </CardContent>
          </Card>
        </Link>
      </div>

      {/* Office Location Info */}
      <Card>
        <CardContent className="flex items-start gap-3 p-4">
          <MapPin className="h-5 w-5 text-primary mt-0.5" />
          <div>
            <p className="font-medium text-sm">Lokasi Kantor</p>
            <p className="text-sm text-muted-foreground mt-1">
              Pastikan Anda berada dalam radius {APP_CONFIG.office_radius_meters} meter dari kantor untuk melakukan presensi.
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
