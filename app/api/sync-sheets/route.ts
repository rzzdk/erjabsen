import { NextRequest, NextResponse } from 'next/server'
import { getAllAttendance, getAllKaryawan } from '@/lib/db'
import type { ApiResponse } from '@/lib/types'

// Google Sheets API endpoint
// To use this, you need:
// 1. Create a Google Cloud Project
// 2. Enable Google Sheets API
// 3. Create a Service Account and download credentials JSON
// 4. Share your Google Spreadsheet with the service account email
// 5. Set environment variables:
//    - GOOGLE_SHEETS_SPREADSHEET_ID: Your spreadsheet ID
//    - GOOGLE_SHEETS_CLIENT_EMAIL: Service account email
//    - GOOGLE_SHEETS_PRIVATE_KEY: Service account private key

interface SheetSyncResult {
  message: string
  rowsUpdated: number
  spreadsheetUrl?: string
}

async function getGoogleAuthToken(): Promise<string> {
  const clientEmail = process.env.GOOGLE_SHEETS_CLIENT_EMAIL
  const privateKey = process.env.GOOGLE_SHEETS_PRIVATE_KEY?.replace(/\\n/g, '\n')
  
  if (!clientEmail || !privateKey) {
    throw new Error('Google Sheets credentials not configured')
  }

  // Create JWT
  const header = {
    alg: 'RS256',
    typ: 'JWT',
  }

  const now = Math.floor(Date.now() / 1000)
  const payload = {
    iss: clientEmail,
    scope: 'https://www.googleapis.com/auth/spreadsheets',
    aud: 'https://oauth2.googleapis.com/token',
    exp: now + 3600,
    iat: now,
  }

  // For production, use a proper JWT library
  // This is a simplified version for demo purposes
  const encodedHeader = Buffer.from(JSON.stringify(header)).toString('base64url')
  const encodedPayload = Buffer.from(JSON.stringify(payload)).toString('base64url')
  
  // In production, sign with private key using crypto
  // For now, we'll use a direct approach
  const crypto = await import('crypto')
  const sign = crypto.createSign('RSA-SHA256')
  sign.update(`${encodedHeader}.${encodedPayload}`)
  const signature = sign.sign(privateKey, 'base64url')
  
  const jwt = `${encodedHeader}.${encodedPayload}.${signature}`

  // Exchange JWT for access token
  const tokenResponse = await fetch('https://oauth2.googleapis.com/token', {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({
      grant_type: 'urn:ietf:params:oauth:grant-type:jwt-bearer',
      assertion: jwt,
    }),
  })

  const tokenData = await tokenResponse.json()
  
  if (!tokenData.access_token) {
    throw new Error('Failed to get access token')
  }

  return tokenData.access_token
}

async function updateGoogleSheet(accessToken: string, spreadsheetId: string) {
  const attendances = getAllAttendance()
  const users = getAllKaryawan()

  // Prepare data for the sheet
  const headers = [
    'Tanggal',
    'ID Karyawan',
    'Nama Lengkap',
    'Jabatan',
    'Departemen',
    'Waktu Masuk',
    'Waktu Keluar',
    'Status',
    'Last Updated',
  ]

  const rows = attendances.map(attendance => {
    const user = users.find(u => u.id === attendance.user_id)
    return [
      attendance.tanggal,
      attendance.user_id,
      user?.nama_lengkap || '-',
      user?.jabatan || '-',
      user?.departemen || '-',
      attendance.waktu_masuk || '-',
      attendance.waktu_keluar || '-',
      attendance.status.toUpperCase(),
      new Date().toISOString(),
    ]
  })

  const values = [headers, ...rows]

  // Clear existing data and update
  const range = 'Presensi!A1:I' + (values.length + 1)
  
  // Clear the sheet first
  await fetch(
    `https://sheets.googleapis.com/v4/spreadsheets/${spreadsheetId}/values/Presensi!A:I:clear`,
    {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${accessToken}`,
        'Content-Type': 'application/json',
      },
    }
  )

  // Update with new data
  const updateResponse = await fetch(
    `https://sheets.googleapis.com/v4/spreadsheets/${spreadsheetId}/values/${range}?valueInputOption=USER_ENTERED`,
    {
      method: 'PUT',
      headers: {
        Authorization: `Bearer ${accessToken}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ values }),
    }
  )

  const updateData = await updateResponse.json()
  
  if (!updateResponse.ok) {
    throw new Error(updateData.error?.message || 'Failed to update spreadsheet')
  }

  return {
    rowsUpdated: rows.length,
    spreadsheetUrl: `https://docs.google.com/spreadsheets/d/${spreadsheetId}`,
  }
}

export async function POST(request: NextRequest) {
  try {
    const spreadsheetId = process.env.GOOGLE_SHEETS_SPREADSHEET_ID

    if (!spreadsheetId) {
      return NextResponse.json<ApiResponse<null>>({
        success: false,
        error: 'Google Sheets spreadsheet ID not configured. Please set GOOGLE_SHEETS_SPREADSHEET_ID environment variable.',
      }, { status: 400 })
    }

    // Check if credentials are configured
    if (!process.env.GOOGLE_SHEETS_CLIENT_EMAIL || !process.env.GOOGLE_SHEETS_PRIVATE_KEY) {
      return NextResponse.json<ApiResponse<null>>({
        success: false,
        error: 'Google Sheets credentials not configured. Please set GOOGLE_SHEETS_CLIENT_EMAIL and GOOGLE_SHEETS_PRIVATE_KEY environment variables.',
      }, { status: 400 })
    }

    const accessToken = await getGoogleAuthToken()
    const result = await updateGoogleSheet(accessToken, spreadsheetId)

    return NextResponse.json<ApiResponse<SheetSyncResult>>({
      success: true,
      data: {
        message: 'Data berhasil disinkronkan ke Google Sheets',
        rowsUpdated: result.rowsUpdated,
        spreadsheetUrl: result.spreadsheetUrl,
      },
    })
  } catch (error) {
    console.error('Google Sheets sync error:', error)
    return NextResponse.json<ApiResponse<null>>({
      success: false,
      error: error instanceof Error ? error.message : 'Terjadi kesalahan saat sinkronisasi',
    }, { status: 500 })
  }
}

// GET - Check sync status and configuration
export async function GET() {
  const isConfigured = !!(
    process.env.GOOGLE_SHEETS_SPREADSHEET_ID &&
    process.env.GOOGLE_SHEETS_CLIENT_EMAIL &&
    process.env.GOOGLE_SHEETS_PRIVATE_KEY
  )

  return NextResponse.json<ApiResponse<{ configured: boolean; spreadsheetId?: string }>>({
    success: true,
    data: {
      configured: isConfigured,
      spreadsheetId: isConfigured ? process.env.GOOGLE_SHEETS_SPREADSHEET_ID : undefined,
    },
  })
}
