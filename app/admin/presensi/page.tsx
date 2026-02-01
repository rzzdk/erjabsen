'use client'

import { useEffect, useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { Calendar, Loader2, LogIn, LogOut, Search, Clock } from 'lucide-react'
import type { AttendanceWithUser } from '@/lib/types'

export default function AdminPresensiPage() {
  const [attendances, setAttendances] = useState<AttendanceWithUser[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0])
  const [searchQuery, setSearchQuery] = useState('')

  useEffect(() => {
    fetchAttendances()
  }, [selectedDate])

  const fetchAttendances = async () => {
    setIsLoading(true)
    try {
      const response = await fetch(`/api/attendance?type=all&date=${selectedDate}`)
      const data = await response.json()
      if (data.success) {
        setAttendances(data.data || [])
      }
    } catch (error) {
      console.error('Error fetching attendances:', error)
    } finally {
      setIsLoading(false)
    }
  }

  const getStatusBadge = (attendance: AttendanceWithUser) => {
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

  const filteredAttendances = attendances.filter(attendance =>
    attendance.user?.nama_lengkap?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    attendance.user?.departemen?.toLowerCase().includes(searchQuery.toLowerCase())
  )

  // Stats
  const stats = {
    total: attendances.length,
    hadir: attendances.filter(a => a.status === 'hadir').length,
    telat: attendances.filter(a => a.status === 'telat').length,
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-foreground">Data Presensi</h1>
        <p className="text-muted-foreground mt-1">
          Lihat data presensi semua karyawan
        </p>
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-4">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Cari karyawan..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10"
          />
        </div>
        
        <div className="flex items-center gap-2">
          <Calendar className="h-4 w-4 text-muted-foreground" />
          <Input
            type="date"
            value={selectedDate}
            onChange={(e) => setSelectedDate(e.target.value)}
            className="w-auto"
          />
        </div>
      </div>

      {/* Date Display */}
      <Card>
        <CardContent className="py-4">
          <p className="text-center font-medium">{formatDateIndo(selectedDate)}</p>
        </CardContent>
      </Card>

      {/* Stats */}
      <div className="grid grid-cols-3 gap-4">
        <Card>
          <CardContent className="p-4 text-center">
            <p className="text-sm text-muted-foreground">Total</p>
            <p className="text-2xl font-bold">{stats.total}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 text-center">
            <p className="text-sm text-muted-foreground">Hadir</p>
            <p className="text-2xl font-bold text-success">{stats.hadir}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 text-center">
            <p className="text-sm text-muted-foreground">Terlambat</p>
            <p className="text-2xl font-bold text-warning">{stats.telat}</p>
          </CardContent>
        </Card>
      </div>

      {/* Attendance List */}
      {isLoading ? (
        <div className="flex items-center justify-center py-12">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      ) : filteredAttendances.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12">
            <Clock className="h-12 w-12 text-muted-foreground mb-4" />
            <p className="font-medium">Tidak Ada Data</p>
            <p className="text-sm text-muted-foreground mt-1">
              {searchQuery 
                ? 'Tidak ada presensi yang sesuai dengan pencarian' 
                : 'Belum ada data presensi untuk tanggal ini'}
            </p>
          </CardContent>
        </Card>
      ) : (
        <Card>
          <CardContent className="p-0">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b bg-muted/50">
                    <th className="text-left p-4 font-medium">Karyawan</th>
                    <th className="text-left p-4 font-medium">Departemen</th>
                    <th className="text-center p-4 font-medium">Check-in</th>
                    <th className="text-center p-4 font-medium">Check-out</th>
                    <th className="text-center p-4 font-medium">Status</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredAttendances.map((attendance) => (
                    <tr key={attendance.id} className="border-b last:border-b-0">
                      <td className="p-4">
                        <div className="flex items-center gap-3">
                          <div className="flex items-center justify-center w-10 h-10 rounded-full bg-primary/10 text-primary font-medium text-sm">
                            {attendance.user?.nama_lengkap?.split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase()}
                          </div>
                          <div>
                            <p className="font-medium">{attendance.user?.nama_lengkap}</p>
                            <p className="text-sm text-muted-foreground">{attendance.user?.jabatan}</p>
                          </div>
                        </div>
                      </td>
                      <td className="p-4 text-muted-foreground">
                        {attendance.user?.departemen}
                      </td>
                      <td className="p-4 text-center">
                        <div className="flex items-center justify-center gap-1">
                          <LogIn className="h-4 w-4 text-muted-foreground" />
                          <span>{attendance.waktu_masuk || '-'}</span>
                        </div>
                      </td>
                      <td className="p-4 text-center">
                        <div className="flex items-center justify-center gap-1">
                          <LogOut className="h-4 w-4 text-muted-foreground" />
                          <span>{attendance.waktu_keluar || '-'}</span>
                        </div>
                      </td>
                      <td className="p-4 text-center">
                        {getStatusBadge(attendance)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  )
}
