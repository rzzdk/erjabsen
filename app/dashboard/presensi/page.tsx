'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { 
  Clock, LogIn, LogOut, MapPin, Camera, CheckCircle2, 
  Loader2, ArrowLeft, AlertCircle 
} from 'lucide-react'
import { CameraCapture } from '@/components/camera-capture'
import { LocationChecker } from '@/components/location-checker'
import { getSession } from '@/lib/auth'
import { formatDate, formatTime, APP_CONFIG } from '@/lib/config'
import { useToast } from '@/hooks/use-toast'
import type { Attendance, UserSession } from '@/lib/types'

type AttendanceStep = 'info' | 'location' | 'camera' | 'processing' | 'success'

export default function PresensiPage() {
  const router = useRouter()
  const { toast } = useToast()
  const [user, setUser] = useState<UserSession | null>(null)
  const [todayAttendance, setTodayAttendance] = useState<Attendance | null>(null)
  const [currentTime, setCurrentTime] = useState(new Date())
  const [isLoading, setIsLoading] = useState(true)
  const [step, setStep] = useState<AttendanceStep>('info')
  const [location, setLocation] = useState<{ latitude: number; longitude: number } | null>(null)
  const [attendanceType, setAttendanceType] = useState<'checkin' | 'checkout' | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [resultAttendance, setResultAttendance] = useState<Attendance | null>(null)

  useEffect(() => {
    const session = getSession()
    setUser(session)

    if (session) {
      fetchTodayAttendance(session.id)
    }

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

  const handleStartAttendance = (type: 'checkin' | 'checkout') => {
    setAttendanceType(type)
    setStep('location')
    setError(null)
  }

  const handleLocationVerified = (loc: { latitude: number; longitude: number }) => {
    setLocation(loc)
    setStep('camera')
  }

  const handlePhotoCapture = async (imageData: string) => {
    if (!user || !location || !attendanceType) return

    setStep('processing')
    setError(null)

    try {
      const response = await fetch('/api/attendance', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId: user.id,
          type: attendanceType,
          foto: imageData,
          lokasi: location,
        }),
      })

      const data = await response.json()

      if (!data.success) {
        setError(data.error || 'Terjadi kesalahan')
        setStep('info')
        return
      }

      setResultAttendance(data.data)
      setStep('success')
      
      toast({
        title: attendanceType === 'checkin' ? 'Check-in Berhasil' : 'Check-out Berhasil',
        description: data.message,
      })

      // Refresh attendance data
      fetchTodayAttendance(user.id)
    } catch (err) {
      setError('Terjadi kesalahan saat memproses presensi')
      setStep('info')
    }
  }

  const handleCancel = () => {
    setStep('info')
    setAttendanceType(null)
    setLocation(null)
    setError(null)
  }

  const renderStepContent = () => {
    switch (step) {
      case 'location':
        return (
          <div className="space-y-4">
            <div className="flex items-center gap-2 mb-4">
              <Button variant="ghost" size="sm" onClick={handleCancel}>
                <ArrowLeft className="h-4 w-4 mr-2" />
                Kembali
              </Button>
            </div>
            
            <div className="text-center mb-4">
              <h3 className="font-medium">Langkah 1: Verifikasi Lokasi</h3>
              <p className="text-sm text-muted-foreground mt-1">
                Pastikan Anda berada di area kantor
              </p>
            </div>
            
            <LocationChecker onLocationVerified={handleLocationVerified} />
          </div>
        )

      case 'camera':
        return (
          <div className="space-y-4">
            <div className="flex items-center gap-2 mb-4">
              <Button variant="ghost" size="sm" onClick={() => setStep('location')}>
                <ArrowLeft className="h-4 w-4 mr-2" />
                Kembali
              </Button>
            </div>
            
            <div className="text-center mb-4">
              <h3 className="font-medium">Langkah 2: Ambil Foto Selfie</h3>
              <p className="text-sm text-muted-foreground mt-1">
                Posisikan wajah Anda di dalam lingkaran
              </p>
            </div>
            
            <CameraCapture 
              onCapture={handlePhotoCapture}
              onCancel={handleCancel}
            />
          </div>
        )

      case 'processing':
        return (
          <div className="flex flex-col items-center justify-center py-12">
            <Loader2 className="h-12 w-12 animate-spin text-primary mb-4" />
            <p className="font-medium">Memproses {attendanceType === 'checkin' ? 'Check-in' : 'Check-out'}...</p>
            <p className="text-sm text-muted-foreground mt-1">Mohon tunggu sebentar</p>
          </div>
        )

      case 'success':
        return (
          <div className="flex flex-col items-center justify-center py-8">
            <div className="w-16 h-16 rounded-full bg-success/10 flex items-center justify-center mb-4">
              <CheckCircle2 className="h-8 w-8 text-success" />
            </div>
            
            <h3 className="font-semibold text-lg">
              {attendanceType === 'checkin' ? 'Check-in' : 'Check-out'} Berhasil!
            </h3>
            
            {resultAttendance && (
              <div className="mt-4 text-center">
                <p className="text-2xl font-bold text-primary">
                  {attendanceType === 'checkin' 
                    ? resultAttendance.waktu_masuk 
                    : resultAttendance.waktu_keluar}
                </p>
                <p className="text-sm text-muted-foreground mt-1">
                  {formatDate(new Date())}
                </p>
                
                {resultAttendance.status === 'telat' && attendanceType === 'checkin' && (
                  <Badge className="mt-2 bg-warning text-warning-foreground">
                    Tercatat Terlambat
                  </Badge>
                )}
              </div>
            )}
            
            <Button className="mt-6" onClick={() => setStep('info')}>
              Selesai
            </Button>
          </div>
        )

      default:
        return null
    }
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    )
  }

  const canCheckIn = !todayAttendance
  const canCheckOut = todayAttendance && !todayAttendance.waktu_keluar

  return (
    <div className="space-y-6 max-w-lg mx-auto">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-foreground">Presensi</h1>
        <p className="text-muted-foreground mt-1">
          {formatDate(currentTime)}
        </p>
      </div>

      {/* Current Time */}
      <Card className="bg-primary text-primary-foreground">
        <CardContent className="py-6">
          <div className="text-center">
            <p className="text-primary-foreground/80 text-sm">Waktu Saat Ini</p>
            <p className="text-4xl font-bold tracking-tight mt-1">
              {currentTime.toLocaleTimeString('id-ID', { 
                hour: '2-digit', 
                minute: '2-digit',
                second: '2-digit',
                hour12: false 
              })}
            </p>
          </div>
        </CardContent>
      </Card>

      {/* Error Alert */}
      {error && (
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      {/* Main Content */}
      {step === 'info' ? (
        <>
          {/* Today's Status */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Status Hari Ini</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="p-4 bg-muted rounded-lg">
                  <div className="flex items-center gap-2 text-muted-foreground mb-1">
                    <LogIn className="h-4 w-4" />
                    <span className="text-sm">Check-in</span>
                  </div>
                  <p className="text-xl font-bold">
                    {todayAttendance?.waktu_masuk || '-'}
                  </p>
                  {todayAttendance?.status === 'telat' && (
                    <Badge variant="outline" className="mt-1 text-warning border-warning">
                      Terlambat
                    </Badge>
                  )}
                </div>
                
                <div className="p-4 bg-muted rounded-lg">
                  <div className="flex items-center gap-2 text-muted-foreground mb-1">
                    <LogOut className="h-4 w-4" />
                    <span className="text-sm">Check-out</span>
                  </div>
                  <p className="text-xl font-bold">
                    {todayAttendance?.waktu_keluar || '-'}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Action Buttons */}
          <div className="space-y-3">
            {canCheckIn && (
              <Button 
                size="lg" 
                className="w-full h-14 text-lg"
                onClick={() => handleStartAttendance('checkin')}
              >
                <LogIn className="mr-2 h-5 w-5" />
                Check-in Sekarang
              </Button>
            )}
            
            {canCheckOut && (
              <Button 
                size="lg" 
                className="w-full h-14 text-lg"
                onClick={() => handleStartAttendance('checkout')}
              >
                <LogOut className="mr-2 h-5 w-5" />
                Check-out Sekarang
              </Button>
            )}
            
            {!canCheckIn && !canCheckOut && (
              <div className="text-center py-8">
                <CheckCircle2 className="h-12 w-12 text-success mx-auto mb-3" />
                <p className="font-medium">Presensi Hari Ini Selesai</p>
                <p className="text-sm text-muted-foreground mt-1">
                  Anda sudah melakukan check-in dan check-out hari ini.
                </p>
              </div>
            )}
          </div>

          {/* Info Card */}
          <Card>
            <CardContent className="p-4">
              <div className="flex items-start gap-3">
                <MapPin className="h-5 w-5 text-primary mt-0.5" />
                <div>
                  <p className="font-medium text-sm">Informasi Presensi</p>
                  <ul className="text-sm text-muted-foreground mt-2 space-y-1">
                    <li>- Jam kerja: {APP_CONFIG.work_start_time} - {APP_CONFIG.work_end_time}</li>
                    <li>- Toleransi keterlambatan: {APP_CONFIG.late_tolerance_minutes} menit</li>
                    <li>- Radius lokasi: {APP_CONFIG.office_radius_meters} meter dari kantor</li>
                    <li>- Wajib mengaktifkan GPS dan kamera</li>
                  </ul>
                </div>
              </div>
            </CardContent>
          </Card>
        </>
      ) : (
        <Card>
          <CardContent className="p-6">
            {renderStepContent()}
          </CardContent>
        </Card>
      )}
    </div>
  )
}
