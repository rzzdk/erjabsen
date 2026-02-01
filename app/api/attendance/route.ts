import { NextRequest, NextResponse } from 'next/server'
import { 
  getTodayAttendance, 
  checkIn, 
  checkOut, 
  getUserAttendanceHistory,
  getAllAttendanceByDate,
  getAttendanceStats,
  getAttendanceByDateRange,
} from '@/lib/db'
import { isWithinOfficeRadius } from '@/lib/config'
import type { ApiResponse, Attendance } from '@/lib/types'

// GET - Get attendance data
export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams
    const userId = searchParams.get('userId')
    const date = searchParams.get('date')
    const type = searchParams.get('type')
    const startDate = searchParams.get('startDate')
    const endDate = searchParams.get('endDate')

    // Get stats for a specific date
    if (type === 'stats' && date) {
      const stats = getAttendanceStats(date)
      return NextResponse.json<ApiResponse<typeof stats>>({
        success: true,
        data: stats,
      })
    }

    // Get attendance by date range (for reports)
    if (type === 'range' && startDate && endDate) {
      const attendances = getAttendanceByDateRange(startDate, endDate)
      return NextResponse.json<ApiResponse<typeof attendances>>({
        success: true,
        data: attendances,
      })
    }

    // Get all attendance for a specific date (admin view)
    if (type === 'all' && date) {
      const attendances = getAllAttendanceByDate(date)
      return NextResponse.json<ApiResponse<typeof attendances>>({
        success: true,
        data: attendances,
      })
    }

    // Get today's attendance for a specific user
    if (userId && type === 'today') {
      const attendance = getTodayAttendance(userId)
      return NextResponse.json<ApiResponse<Attendance | null>>({
        success: true,
        data: attendance || null,
      })
    }

    // Get attendance history for a specific user
    if (userId) {
      const history = getUserAttendanceHistory(userId)
      return NextResponse.json<ApiResponse<Attendance[]>>({
        success: true,
        data: history,
      })
    }

    return NextResponse.json<ApiResponse<null>>({
      success: false,
      error: 'Parameter tidak valid',
    }, { status: 400 })
  } catch (error) {
    console.error('Get attendance error:', error)
    return NextResponse.json<ApiResponse<null>>({
      success: false,
      error: 'Terjadi kesalahan server',
    }, { status: 500 })
  }
}

// POST - Check in or Check out
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { userId, type, foto, lokasi } = body

    if (!userId || !type || !foto || !lokasi) {
      return NextResponse.json<ApiResponse<null>>({
        success: false,
        error: 'Data tidak lengkap',
      }, { status: 400 })
    }

    // Validate location
    if (!isWithinOfficeRadius(lokasi.latitude, lokasi.longitude)) {
      return NextResponse.json<ApiResponse<null>>({
        success: false,
        error: 'Anda berada di luar jangkauan lokasi kantor. Pastikan Anda berada dalam radius 100 meter dari kantor.',
      }, { status: 400 })
    }

    if (type === 'checkin') {
      // Check if already checked in today
      const existing = getTodayAttendance(userId)
      if (existing) {
        return NextResponse.json<ApiResponse<null>>({
          success: false,
          error: 'Anda sudah melakukan check-in hari ini',
        }, { status: 400 })
      }

      const attendance = checkIn(userId, foto, lokasi)
      return NextResponse.json<ApiResponse<Attendance>>({
        success: true,
        data: attendance,
        message: attendance.status === 'telat' 
          ? 'Check-in berhasil, namun Anda tercatat terlambat' 
          : 'Check-in berhasil',
      })
    }

    if (type === 'checkout') {
      const existing = getTodayAttendance(userId)
      if (!existing) {
        return NextResponse.json<ApiResponse<null>>({
          success: false,
          error: 'Anda belum melakukan check-in hari ini',
        }, { status: 400 })
      }

      if (existing.waktu_keluar) {
        return NextResponse.json<ApiResponse<null>>({
          success: false,
          error: 'Anda sudah melakukan check-out hari ini',
        }, { status: 400 })
      }

      const attendance = checkOut(userId, foto, lokasi)
      return NextResponse.json<ApiResponse<Attendance | null>>({
        success: true,
        data: attendance,
        message: 'Check-out berhasil',
      })
    }

    return NextResponse.json<ApiResponse<null>>({
      success: false,
      error: 'Tipe tidak valid',
    }, { status: 400 })
  } catch (error) {
    console.error('Attendance error:', error)
    return NextResponse.json<ApiResponse<null>>({
      success: false,
      error: 'Terjadi kesalahan server',
    }, { status: 500 })
  }
}
