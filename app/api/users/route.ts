import { NextRequest, NextResponse } from 'next/server'
import { getAllUsers, getAllKaryawan, createUser, updateUser, deleteUser, findUserById } from '@/lib/db'
import type { ApiResponse, User } from '@/lib/types'

// GET - Get all users or specific user
export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams
    const id = searchParams.get('id')
    const type = searchParams.get('type')

    if (id) {
      const user = findUserById(id)
      if (!user) {
        return NextResponse.json<ApiResponse<null>>({
          success: false,
          error: 'User tidak ditemukan',
        }, { status: 404 })
      }
      const { password, ...userWithoutPassword } = user
      return NextResponse.json<ApiResponse<User>>({
        success: true,
        data: userWithoutPassword as User,
      })
    }

    if (type === 'karyawan') {
      const users = getAllKaryawan()
      return NextResponse.json<ApiResponse<User[]>>({
        success: true,
        data: users,
      })
    }

    const users = getAllUsers()
    return NextResponse.json<ApiResponse<User[]>>({
      success: true,
      data: users,
    })
  } catch (error) {
    console.error('Get users error:', error)
    return NextResponse.json<ApiResponse<null>>({
      success: false,
      error: 'Terjadi kesalahan server',
    }, { status: 500 })
  }
}

// POST - Create new user
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { username, password, nama_lengkap, email, jabatan, departemen, role } = body

    if (!username || !password || !nama_lengkap || !email || !jabatan || !departemen) {
      return NextResponse.json<ApiResponse<null>>({
        success: false,
        error: 'Data tidak lengkap',
      }, { status: 400 })
    }

    const newUser = createUser({
      username,
      password,
      nama_lengkap,
      email,
      jabatan,
      departemen,
      role: role || 'karyawan',
    })

    return NextResponse.json<ApiResponse<User>>({
      success: true,
      data: newUser,
      message: 'Karyawan berhasil ditambahkan',
    }, { status: 201 })
  } catch (error) {
    console.error('Create user error:', error)
    return NextResponse.json<ApiResponse<null>>({
      success: false,
      error: 'Terjadi kesalahan server',
    }, { status: 500 })
  }
}

// PUT - Update user
export async function PUT(request: NextRequest) {
  try {
    const body = await request.json()
    const { id, ...updateData } = body

    if (!id) {
      return NextResponse.json<ApiResponse<null>>({
        success: false,
        error: 'ID user diperlukan',
      }, { status: 400 })
    }

    const updatedUser = updateUser(id, updateData)

    if (!updatedUser) {
      return NextResponse.json<ApiResponse<null>>({
        success: false,
        error: 'User tidak ditemukan',
      }, { status: 404 })
    }

    return NextResponse.json<ApiResponse<User>>({
      success: true,
      data: updatedUser,
      message: 'Data karyawan berhasil diperbarui',
    })
  } catch (error) {
    console.error('Update user error:', error)
    return NextResponse.json<ApiResponse<null>>({
      success: false,
      error: 'Terjadi kesalahan server',
    }, { status: 500 })
  }
}

// DELETE - Delete user
export async function DELETE(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams
    const id = searchParams.get('id')

    if (!id) {
      return NextResponse.json<ApiResponse<null>>({
        success: false,
        error: 'ID user diperlukan',
      }, { status: 400 })
    }

    const success = deleteUser(id)

    if (!success) {
      return NextResponse.json<ApiResponse<null>>({
        success: false,
        error: 'User tidak ditemukan',
      }, { status: 404 })
    }

    return NextResponse.json<ApiResponse<null>>({
      success: true,
      message: 'Karyawan berhasil dihapus',
    })
  } catch (error) {
    console.error('Delete user error:', error)
    return NextResponse.json<ApiResponse<null>>({
      success: false,
      error: 'Terjadi kesalahan server',
    }, { status: 500 })
  }
}
