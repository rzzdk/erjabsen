'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Loader2, LogIn, LogOut, Calendar } from 'lucide-react'
import { getSession } from '@/lib/auth'
import type { Attendance, UserSession } from '@/lib/types'

export default function RiwayatPage() {
  const [user, setUser] = useState<UserSession | null>(null)
  const [attendances, setAttendances] = useState<Attendance[]>([])
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    const session = getSession()
    setUser(session)

    if (session) {
      fetchAttendanceHistory(session.id)
    }
  }, [])

  const fetchAttendanceHistory = async (userId: string) => {
    try {
      const response = await fetch(`/api/attendance?userId=${userId}`)
      const data = await response.json()
      if (data.success) {
        setAttendances(data.data || [])
      }
    } catch (error) {
      console.error('Error fetching attendance history:', error)
    } finally {
      setIsLoading(false)
    }
  }

  const getStatusBadge = (attendance: Attendance) => {
    switch (attendance.status) {
      case 'hadir':
        return <Badge className="bg-success text-success-foreground">Hadir</Badge>
      case 'telat':
        return <Badge className="bg-warning text-warning-foreground">Terlambat</Badge>
      case 'izin':
        return <Badge className="bg-primary">Izin</Badge>
      case 'sakit':
        return <Badge variant="secondary">Sakit</Badge>
      case 'alpha':
        return <Badge variant="destructive">Alpha</Badge>
      default:
        return null
    }
  }

  const formatDateIndo = (dateStr: string) => {
    const date = new Date(dateStr)
    return date.toLocaleDateString('id-ID', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    })
  }

  const formatShortDate = (dateStr: string) => {
    const date = new Date(dateStr)
    return date.toLocaleDateString('id-ID', {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
    })
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    )
  }

  // Group attendances by month
  const groupedAttendances = attendances.reduce((groups, attendance) => {
    const date = new Date(attendance.tanggal)
    const monthYear = date.toLocaleDateString('id-ID', { month: 'long', year: 'numeric' })
    
    if (!groups[monthYear]) {
      groups[monthYear] = []
    }
    groups[monthYear].push(attendance)
    return groups
  }, {} as Record<string, Attendance[]>)

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-foreground">Riwayat Presensi</h1>
        <p className="text-muted-foreground mt-1">
          Lihat sejarah kehadiran Anda
        </p>
      </div>

      {/* Stats Summary */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4">
            <p className="text-sm text-muted-foreground">Total Hari</p>
            <p className="text-2xl font-bold">{attendances.length}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <p className="text-sm text-muted-foreground">Hadir</p>
            <p className="text-2xl font-bold text-success">
              {attendances.filter(a => a.status === 'hadir').length}
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <p className="text-sm text-muted-foreground">Terlambat</p>
            <p className="text-2xl font-bold text-warning">
              {attendances.filter(a => a.status === 'telat').length}
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <p className="text-sm text-muted-foreground">Alpha</p>
            <p className="text-2xl font-bold text-destructive">
              {attendances.filter(a => a.status === 'alpha').length}
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Attendance List */}
      {attendances.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12">
            <Calendar className="h-12 w-12 text-muted-foreground mb-4" />
            <p className="font-medium">Belum Ada Riwayat</p>
            <p className="text-sm text-muted-foreground mt-1">
              Riwayat presensi Anda akan muncul di sini
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-6">
          {Object.entries(groupedAttendances).map(([monthYear, monthAttendances]) => (
            <div key={monthYear}>
              <h3 className="font-semibold text-lg mb-3">{monthYear}</h3>
              <div className="space-y-3">
                {monthAttendances.map((attendance) => (
                  <Card key={attendance.id}>
                    <CardContent className="p-4">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-4">
                          <div className="text-center">
                            <p className="text-2xl font-bold">
                              {new Date(attendance.tanggal).getDate()}
                            </p>
                            <p className="text-xs text-muted-foreground">
                              {new Date(attendance.tanggal).toLocaleDateString('id-ID', { weekday: 'short' })}
                            </p>
                          </div>
                          
                          <div className="border-l pl-4">
                            <div className="flex items-center gap-4">
                              <div className="flex items-center gap-1.5">
                                <LogIn className="h-4 w-4 text-muted-foreground" />
                                <span className="text-sm font-medium">
                                  {attendance.waktu_masuk || '-'}
                                </span>
                              </div>
                              <div className="flex items-center gap-1.5">
                                <LogOut className="h-4 w-4 text-muted-foreground" />
                                <span className="text-sm font-medium">
                                  {attendance.waktu_keluar || '-'}
                                </span>
                              </div>
                            </div>
                          </div>
                        </div>
                        
                        {getStatusBadge(attendance)}
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
