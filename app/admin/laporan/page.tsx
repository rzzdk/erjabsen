'use client'

import { useEffect, useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Badge } from '@/components/ui/badge'
import { 
  Download, FileSpreadsheet, Calendar, Loader2, 
  CheckCircle2, AlertCircle, XCircle 
} from 'lucide-react'
import { useToast } from '@/hooks/use-toast'
import { APP_CONFIG } from '@/lib/config'
import type { AttendanceWithUser } from '@/lib/types'

export default function LaporanPage() {
  const { toast } = useToast()
  const [startDate, setStartDate] = useState(() => {
    const date = new Date()
    date.setDate(1) // First day of current month
    return date.toISOString().split('T')[0]
  })
  const [endDate, setEndDate] = useState(() => {
    return new Date().toISOString().split('T')[0]
  })
  const [attendances, setAttendances] = useState<AttendanceWithUser[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const [isExporting, setIsExporting] = useState(false)

  const fetchReport = async () => {
    setIsLoading(true)
    try {
      const response = await fetch(
        `/api/attendance?type=range&startDate=${startDate}&endDate=${endDate}`
      )
      const data = await response.json()
      if (data.success) {
        setAttendances(data.data || [])
      }
    } catch (error) {
      console.error('Error fetching report:', error)
      toast({ title: 'Error', description: 'Gagal memuat data', variant: 'destructive' })
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => {
    fetchReport()
  }, [startDate, endDate])

  const exportToCSV = () => {
    if (attendances.length === 0) {
      toast({ title: 'Info', description: 'Tidak ada data untuk diexport' })
      return
    }

    setIsExporting(true)

    try {
      // Prepare CSV data
      const headers = ['Tanggal', 'Nama', 'Jabatan', 'Departemen', 'Waktu Masuk', 'Waktu Keluar', 'Status']
      const rows = attendances.map(a => [
        a.tanggal,
        a.user?.nama_lengkap || '',
        a.user?.jabatan || '',
        a.user?.departemen || '',
        a.waktu_masuk || '-',
        a.waktu_keluar || '-',
        a.status.toUpperCase(),
      ])

      // Add BOM for Excel UTF-8 compatibility
      const BOM = '\uFEFF'
      const csvContent = BOM + [
        headers.join(','),
        ...rows.map(row => row.map(cell => `"${cell}"`).join(','))
      ].join('\n')

      // Create blob and download
      const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' })
      const url = URL.createObjectURL(blob)
      const link = document.createElement('a')
      link.href = url
      link.download = `Laporan_Presensi_${startDate}_${endDate}.csv`
      document.body.appendChild(link)
      link.click()
      document.body.removeChild(link)
      URL.revokeObjectURL(url)

      toast({ title: 'Berhasil', description: 'Laporan berhasil diunduh' })
    } catch (error) {
      toast({ title: 'Error', description: 'Gagal mengexport data', variant: 'destructive' })
    } finally {
      setIsExporting(false)
    }
  }

  const exportToExcel = () => {
    if (attendances.length === 0) {
      toast({ title: 'Info', description: 'Tidak ada data untuk diexport' })
      return
    }

    setIsExporting(true)

    try {
      // Create Excel-compatible XML
      const xmlHeader = `<?xml version="1.0" encoding="UTF-8"?>
<?mso-application progid="Excel.Sheet"?>
<Workbook xmlns="urn:schemas-microsoft-com:office:spreadsheet"
  xmlns:ss="urn:schemas-microsoft-com:office:spreadsheet">
  <Styles>
    <Style ss:ID="Header">
      <Font ss:Bold="1"/>
      <Interior ss:Color="#2d6a4f" ss:Pattern="Solid"/>
      <Font ss:Color="#FFFFFF"/>
    </Style>
    <Style ss:ID="Status_Hadir">
      <Interior ss:Color="#d8f3dc" ss:Pattern="Solid"/>
    </Style>
    <Style ss:ID="Status_Telat">
      <Interior ss:Color="#ffedd5" ss:Pattern="Solid"/>
    </Style>
  </Styles>
  <Worksheet ss:Name="Laporan Presensi">
    <Table>
      <Column ss:Width="80"/>
      <Column ss:Width="150"/>
      <Column ss:Width="120"/>
      <Column ss:Width="100"/>
      <Column ss:Width="80"/>
      <Column ss:Width="80"/>
      <Column ss:Width="80"/>
      <Row ss:StyleID="Header">
        <Cell><Data ss:Type="String">Tanggal</Data></Cell>
        <Cell><Data ss:Type="String">Nama</Data></Cell>
        <Cell><Data ss:Type="String">Jabatan</Data></Cell>
        <Cell><Data ss:Type="String">Departemen</Data></Cell>
        <Cell><Data ss:Type="String">Waktu Masuk</Data></Cell>
        <Cell><Data ss:Type="String">Waktu Keluar</Data></Cell>
        <Cell><Data ss:Type="String">Status</Data></Cell>
      </Row>`

      const rows = attendances.map(a => {
        const styleId = a.status === 'hadir' ? 'Status_Hadir' : a.status === 'telat' ? 'Status_Telat' : ''
        return `
      <Row${styleId ? ` ss:StyleID="${styleId}"` : ''}>
        <Cell><Data ss:Type="String">${a.tanggal}</Data></Cell>
        <Cell><Data ss:Type="String">${a.user?.nama_lengkap || ''}</Data></Cell>
        <Cell><Data ss:Type="String">${a.user?.jabatan || ''}</Data></Cell>
        <Cell><Data ss:Type="String">${a.user?.departemen || ''}</Data></Cell>
        <Cell><Data ss:Type="String">${a.waktu_masuk || '-'}</Data></Cell>
        <Cell><Data ss:Type="String">${a.waktu_keluar || '-'}</Data></Cell>
        <Cell><Data ss:Type="String">${a.status.toUpperCase()}</Data></Cell>
      </Row>`
      }).join('')

      const xmlFooter = `
    </Table>
  </Worksheet>
</Workbook>`

      const content = xmlHeader + rows + xmlFooter
      const blob = new Blob([content], { type: 'application/vnd.ms-excel' })
      const url = URL.createObjectURL(blob)
      const link = document.createElement('a')
      link.href = url
      link.download = `Laporan_Presensi_${startDate}_${endDate}.xls`
      document.body.appendChild(link)
      link.click()
      document.body.removeChild(link)
      URL.revokeObjectURL(url)

      toast({ title: 'Berhasil', description: 'Laporan Excel berhasil diunduh' })
    } catch (error) {
      toast({ title: 'Error', description: 'Gagal mengexport data', variant: 'destructive' })
    } finally {
      setIsExporting(false)
    }
  }

  // Calculate summary stats
  const summaryStats = {
    totalRecords: attendances.length,
    hadir: attendances.filter(a => a.status === 'hadir').length,
    telat: attendances.filter(a => a.status === 'telat').length,
    alpha: attendances.filter(a => a.status === 'alpha').length,
  }

  // Group by user for summary
  const userSummary = attendances.reduce((acc, a) => {
    const userId = a.user_id
    if (!acc[userId]) {
      acc[userId] = {
        user: a.user,
        hadir: 0,
        telat: 0,
        alpha: 0,
        total: 0,
      }
    }
    acc[userId].total++
    if (a.status === 'hadir') acc[userId].hadir++
    if (a.status === 'telat') acc[userId].telat++
    if (a.status === 'alpha') acc[userId].alpha++
    return acc
  }, {} as Record<string, { user: any; hadir: number; telat: number; alpha: number; total: number }>)

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-foreground">Laporan Presensi</h1>
        <p className="text-muted-foreground mt-1">
          Generate dan unduh laporan presensi karyawan
        </p>
      </div>

      {/* Date Range Selection */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Pilih Periode</CardTitle>
          <CardDescription>Tentukan rentang tanggal untuk laporan</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="flex-1 space-y-2">
              <Label htmlFor="startDate">Tanggal Mulai</Label>
              <Input
                id="startDate"
                type="date"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
              />
            </div>
            <div className="flex-1 space-y-2">
              <Label htmlFor="endDate">Tanggal Selesai</Label>
              <Input
                id="endDate"
                type="date"
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
              />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Summary Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Total Record</p>
                <p className="text-2xl font-bold">{summaryStats.totalRecords}</p>
              </div>
              <Calendar className="h-8 w-8 text-muted-foreground" />
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Hadir</p>
                <p className="text-2xl font-bold text-success">{summaryStats.hadir}</p>
              </div>
              <CheckCircle2 className="h-8 w-8 text-success" />
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Terlambat</p>
                <p className="text-2xl font-bold text-warning">{summaryStats.telat}</p>
              </div>
              <AlertCircle className="h-8 w-8 text-warning" />
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Alpha</p>
                <p className="text-2xl font-bold text-destructive">{summaryStats.alpha}</p>
              </div>
              <XCircle className="h-8 w-8 text-destructive" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Export Buttons */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Unduh Laporan</CardTitle>
          <CardDescription>Export data dalam format CSV atau Excel</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col sm:flex-row gap-4">
            <Button 
              onClick={exportToCSV} 
              disabled={isExporting || isLoading || attendances.length === 0}
              variant="outline"
              className="flex-1 bg-transparent"
            >
              {isExporting ? (
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
              ) : (
                <Download className="h-4 w-4 mr-2" />
              )}
              Download CSV
            </Button>
            <Button 
              onClick={exportToExcel} 
              disabled={isExporting || isLoading || attendances.length === 0}
              className="flex-1"
            >
              {isExporting ? (
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
              ) : (
                <FileSpreadsheet className="h-4 w-4 mr-2" />
              )}
              Download Excel
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Per-User Summary */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Ringkasan per Karyawan</CardTitle>
          <CardDescription>
            Periode: {new Date(startDate).toLocaleDateString('id-ID')} - {new Date(endDate).toLocaleDateString('id-ID')}
          </CardDescription>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="flex items-center justify-center py-8">
              <Loader2 className="h-8 w-8 animate-spin text-primary" />
            </div>
          ) : Object.keys(userSummary).length === 0 ? (
            <div className="text-center py-8">
              <FileSpreadsheet className="h-12 w-12 text-muted-foreground mx-auto mb-3" />
              <p className="text-muted-foreground">Tidak ada data untuk periode ini</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b bg-muted/50">
                    <th className="text-left p-3 font-medium">Karyawan</th>
                    <th className="text-center p-3 font-medium">Total Hari</th>
                    <th className="text-center p-3 font-medium">Hadir</th>
                    <th className="text-center p-3 font-medium">Terlambat</th>
                    <th className="text-center p-3 font-medium">Alpha</th>
                  </tr>
                </thead>
                <tbody>
                  {Object.values(userSummary).map((summary, idx) => (
                    <tr key={idx} className="border-b last:border-b-0">
                      <td className="p-3">
                        <div>
                          <p className="font-medium">{summary.user?.nama_lengkap}</p>
                          <p className="text-sm text-muted-foreground">{summary.user?.departemen}</p>
                        </div>
                      </td>
                      <td className="p-3 text-center font-medium">{summary.total}</td>
                      <td className="p-3 text-center">
                        <Badge className="bg-success text-success-foreground">{summary.hadir}</Badge>
                      </td>
                      <td className="p-3 text-center">
                        <Badge className="bg-warning text-warning-foreground">{summary.telat}</Badge>
                      </td>
                      <td className="p-3 text-center">
                        <Badge variant="destructive">{summary.alpha}</Badge>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
