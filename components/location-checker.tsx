'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { MapPin, Loader2, CheckCircle2, XCircle, RefreshCw } from 'lucide-react'
import { isWithinOfficeRadius, calculateDistance, APP_CONFIG } from '@/lib/config'

interface LocationCheckerProps {
  onLocationVerified: (location: { latitude: number; longitude: number }) => void
}

export function LocationChecker({ onLocationVerified }: LocationCheckerProps) {
  const [location, setLocation] = useState<{ latitude: number; longitude: number } | null>(null)
  const [distance, setDistance] = useState<number | null>(null)
  const [isWithinRange, setIsWithinRange] = useState<boolean | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const getLocation = () => {
    setIsLoading(true)
    setError(null)

    if (!navigator.geolocation) {
      setError('Browser Anda tidak mendukung geolokasi')
      setIsLoading(false)
      return
    }

    navigator.geolocation.getCurrentPosition(
      (position) => {
        const { latitude, longitude } = position.coords
        setLocation({ latitude, longitude })
        
        const dist = calculateDistance(
          latitude,
          longitude,
          APP_CONFIG.office_location.latitude,
          APP_CONFIG.office_location.longitude
        )
        setDistance(Math.round(dist))
        
        const withinRange = isWithinOfficeRadius(latitude, longitude)
        setIsWithinRange(withinRange)
        
        if (withinRange) {
          onLocationVerified({ latitude, longitude })
        }
        
        setIsLoading(false)
      },
      (err) => {
        console.error('Geolocation error:', err)
        let errorMessage = 'Tidak dapat mendapatkan lokasi'
        
        switch (err.code) {
          case err.PERMISSION_DENIED:
            errorMessage = 'Izin lokasi ditolak. Silakan aktifkan izin lokasi di pengaturan browser Anda.'
            break
          case err.POSITION_UNAVAILABLE:
            errorMessage = 'Informasi lokasi tidak tersedia. Pastikan GPS aktif.'
            break
          case err.TIMEOUT:
            errorMessage = 'Waktu permintaan lokasi habis. Silakan coba lagi.'
            break
        }
        
        setError(errorMessage)
        setIsLoading(false)
      },
      {
        enableHighAccuracy: true,
        timeout: 10000,
        maximumAge: 0,
      }
    )
  }

  useEffect(() => {
    getLocation()
  }, [])

  return (
    <Card>
      <CardContent className="p-4">
        <div className="flex items-start gap-3">
          <div className={`flex items-center justify-center w-10 h-10 rounded-full ${
            isLoading ? 'bg-muted' : 
            isWithinRange ? 'bg-success/10' : 
            error || isWithinRange === false ? 'bg-destructive/10' : 'bg-muted'
          }`}>
            {isLoading ? (
              <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
            ) : isWithinRange ? (
              <CheckCircle2 className="h-5 w-5 text-success" />
            ) : (
              <XCircle className="h-5 w-5 text-destructive" />
            )}
          </div>
          
          <div className="flex-1">
            <p className="font-medium text-sm">Verifikasi Lokasi</p>
            
            {isLoading && (
              <p className="text-sm text-muted-foreground mt-1">
                Mendapatkan lokasi Anda...
              </p>
            )}
            
            {error && (
              <div className="mt-2">
                <Alert variant="destructive">
                  <AlertDescription>{error}</AlertDescription>
                </Alert>
                <Button 
                  variant="outline" 
                  size="sm" 
                  className="mt-2 bg-transparent"
                  onClick={getLocation}
                >
                  <RefreshCw className="h-4 w-4 mr-2" />
                  Coba Lagi
                </Button>
              </div>
            )}
            
            {!isLoading && !error && distance !== null && (
              <div className="mt-1">
                <p className="text-sm text-muted-foreground">
                  Jarak dari kantor: <span className="font-medium">{distance} meter</span>
                </p>
                
                {isWithinRange ? (
                  <p className="text-sm text-success mt-1">
                    Anda berada dalam jangkauan kantor
                  </p>
                ) : (
                  <div className="mt-2">
                    <Alert variant="destructive">
                      <AlertDescription>
                        Anda berada di luar jangkauan lokasi kantor ({APP_CONFIG.office_radius_meters}m). 
                        Jarak Anda: {distance}m dari kantor.
                      </AlertDescription>
                    </Alert>
                    <Button 
                      variant="outline" 
                      size="sm" 
                      className="mt-2 bg-transparent"
                      onClick={getLocation}
                    >
                      <RefreshCw className="h-4 w-4 mr-2" />
                      Periksa Ulang
                    </Button>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
