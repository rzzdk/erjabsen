'use client'

import { useEffect, useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Badge } from '@/components/ui/badge'
import { 
  RefreshCw, CheckCircle2, AlertCircle, ExternalLink, 
  Loader2, FileSpreadsheet, Settings
} from 'lucide-react'
import { useToast } from '@/hooks/use-toast'
import { APP_CONFIG } from '@/lib/config'

export default function PengaturanPage() {
  const { toast } = useToast()
  const [isSyncing, setIsSyncing] = useState(false)
  const [sheetsConfig, setSheetsConfig] = useState<{
    configured: boolean
    spreadsheetId?: string
  } | null>(null)
  const [lastSync, setLastSync] = useState<string | null>(null)

  useEffect(() => {
    checkSheetsConfig()
  }, [])

  const checkSheetsConfig = async () => {
    try {
      const response = await fetch('/api/sync-sheets')
      const data = await response.json()
      if (data.success) {
        setSheetsConfig(data.data)
      }
    } catch (error) {
      console.error('Error checking sheets config:', error)
    }
  }

  const handleSyncToSheets = async () => {
    setIsSyncing(true)
    
    try {
      const response = await fetch('/api/sync-sheets', {
        method: 'POST',
      })
      const data = await response.json()
      
      if (data.success) {
        toast({
          title: 'Sinkronisasi Berhasil',
          description: `${data.data.rowsUpdated} baris data telah disinkronkan ke Google Sheets`,
        })
        setLastSync(new Date().toLocaleString('id-ID'))
      } else {
        toast({
          title: 'Sinkronisasi Gagal',
          description: data.error,
          variant: 'destructive',
        })
      }
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Terjadi kesalahan saat sinkronisasi',
        variant: 'destructive',
      })
    } finally {
      setIsSyncing(false)
    }
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-foreground">Pengaturan</h1>
        <p className="text-muted-foreground mt-1">
          Kelola konfigurasi aplikasi dan integrasi
        </p>
      </div>

      {/* Company Info */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg flex items-center gap-2">
            <Settings className="h-5 w-5" />
            Informasi Perusahaan
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid gap-4 md:grid-cols-2">
            <div>
              <p className="text-sm text-muted-foreground">Nama Perusahaan</p>
              <p className="font-medium">{APP_CONFIG.company_name}</p>
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Jam Kerja</p>
              <p className="font-medium">{APP_CONFIG.work_start_time} - {APP_CONFIG.work_end_time}</p>
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Toleransi Keterlambatan</p>
              <p className="font-medium">{APP_CONFIG.late_tolerance_minutes} menit</p>
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Radius Lokasi Kantor</p>
              <p className="font-medium">{APP_CONFIG.office_radius_meters} meter</p>
            </div>
          </div>
          
          <div>
            <p className="text-sm text-muted-foreground">Koordinat Kantor</p>
            <p className="font-medium">
              {APP_CONFIG.office_location.latitude}, {APP_CONFIG.office_location.longitude}
            </p>
            <a 
              href={`https://www.google.com/maps?q=${APP_CONFIG.office_location.latitude},${APP_CONFIG.office_location.longitude}`}
              target="_blank"
              rel="noopener noreferrer"
              className="text-sm text-primary hover:underline inline-flex items-center gap-1 mt-1"
            >
              Lihat di Google Maps
              <ExternalLink className="h-3 w-3" />
            </a>
          </div>
        </CardContent>
      </Card>

      {/* Google Sheets Integration */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg flex items-center gap-2">
            <FileSpreadsheet className="h-5 w-5" />
            Integrasi Google Sheets
          </CardTitle>
          <CardDescription>
            Sinkronkan data presensi secara live ke Google Spreadsheet
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Status */}
          <div className="flex items-center gap-2">
            <span className="text-sm text-muted-foreground">Status:</span>
            {sheetsConfig?.configured ? (
              <Badge className="bg-success text-success-foreground">
                <CheckCircle2 className="h-3 w-3 mr-1" />
                Terkonfigurasi
              </Badge>
            ) : (
              <Badge variant="secondary">
                <AlertCircle className="h-3 w-3 mr-1" />
                Belum Dikonfigurasi
              </Badge>
            )}
          </div>

          {sheetsConfig?.configured ? (
            <>
              {/* Spreadsheet Link */}
              {sheetsConfig.spreadsheetId && (
                <div>
                  <a 
                    href={`https://docs.google.com/spreadsheets/d/${sheetsConfig.spreadsheetId}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-sm text-primary hover:underline inline-flex items-center gap-1"
                  >
                    Buka Google Spreadsheet
                    <ExternalLink className="h-3 w-3" />
                  </a>
                </div>
              )}

              {/* Last Sync */}
              {lastSync && (
                <p className="text-sm text-muted-foreground">
                  Terakhir disinkronkan: {lastSync}
                </p>
              )}

              {/* Sync Button */}
              <Button onClick={handleSyncToSheets} disabled={isSyncing}>
                {isSyncing ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    Menyinkronkan...
                  </>
                ) : (
                  <>
                    <RefreshCw className="h-4 w-4 mr-2" />
                    Sinkronkan Sekarang
                  </>
                )}
              </Button>
            </>
          ) : (
            <Alert>
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>
                <p className="font-medium mb-2">Cara mengkonfigurasi Google Sheets:</p>
                <ol className="list-decimal list-inside space-y-1 text-sm">
                  <li>Buat project di Google Cloud Console</li>
                  <li>Aktifkan Google Sheets API</li>
                  <li>Buat Service Account dan download credentials</li>
                  <li>Share spreadsheet Anda ke email service account</li>
                  <li>Set environment variables berikut:</li>
                </ol>
                <ul className="list-disc list-inside ml-4 mt-2 text-sm font-mono">
                  <li>GOOGLE_SHEETS_SPREADSHEET_ID</li>
                  <li>GOOGLE_SHEETS_CLIENT_EMAIL</li>
                  <li>GOOGLE_SHEETS_PRIVATE_KEY</li>
                </ul>
              </AlertDescription>
            </Alert>
          )}
        </CardContent>
      </Card>

      {/* Database Info */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Informasi Database</CardTitle>
          <CardDescription>
            Konfigurasi database untuk deployment
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Alert>
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>
              <p className="font-medium mb-2">Catatan untuk Deployment:</p>
              <p className="text-sm mb-2">
                Aplikasi ini menggunakan mock database untuk demo. Untuk production, 
                Anda perlu mengkonfigurasi MySQL/MariaDB dengan schema yang tersedia di:
              </p>
              <code className="text-sm bg-muted px-2 py-1 rounded">/scripts/schema.sql</code>
              <p className="text-sm mt-2">
                Pastikan juga untuk mengupdate konfigurasi koneksi database dan 
                mengimplementasikan password hashing dengan bcrypt.
              </p>
            </AlertDescription>
          </Alert>
        </CardContent>
      </Card>
    </div>
  )
}
