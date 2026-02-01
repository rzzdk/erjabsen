import { NextRequest, NextResponse } from 'next/server'
import { findUserByUsername } from '@/lib/db'
import type { ApiResponse, UserSession } from '@/lib/types'

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { username, password } = body

    if (!username || !password) {
      return NextResponse.json<ApiResponse<null>>({
        success: false,
        error: 'Username dan password wajib diisi',
      }, { status: 400 })
    }

    const user = findUserByUsername(username)

    if (!user || user.password !== password) {
      return NextResponse.json<ApiResponse<null>>({
        success: false,
        error: 'Username atau password salah',
      }, { status: 401 })
    }

    const session: UserSession = {
      id: user.id,
      username: user.username,
      nama_lengkap: user.nama_lengkap,
      role: user.role,
      jabatan: user.jabatan,
      departemen: user.departemen,
    }

    return NextResponse.json<ApiResponse<UserSession>>({
      success: true,
      data: session,
      message: 'Login berhasil',
    })
  } catch (error) {
    console.error('Login error:', error)
    return NextResponse.json<ApiResponse<null>>({
      success: false,
      error: 'Terjadi kesalahan server',
    }, { status: 500 })
  }
}
