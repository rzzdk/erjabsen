import type { User, Attendance, AttendanceStatus } from './types'
import { isLateCheckIn } from './config'

// Mock database for demo - Replace with MySQL connection in production
// SQL Schema is provided in /scripts/schema.sql

let users: User[] = [
  {
    id: '1',
    username: 'admin',
    password: 'admin123',
    nama_lengkap: 'Administrator HR',
    email: 'admin@lestari.co.id',
    jabatan: 'HR Manager',
    departemen: 'Human Resources',
    role: 'admin',
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  },
  {
    id: '2',
    username: 'budi.santoso',
    password: 'budi123',
    nama_lengkap: 'Budi Santoso',
    email: 'budi@lestari.co.id',
    jabatan: 'Software Engineer',
    departemen: 'IT',
    role: 'karyawan',
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  },
  {
    id: '3',
    username: 'siti.rahayu',
    password: 'siti123',
    nama_lengkap: 'Siti Rahayu',
    email: 'siti@lestari.co.id',
    jabatan: 'Marketing Executive',
    departemen: 'Marketing',
    role: 'karyawan',
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  },
  {
    id: '4',
    username: 'ahmad.wijaya',
    password: 'ahmad123',
    nama_lengkap: 'Ahmad Wijaya',
    email: 'ahmad@lestari.co.id',
    jabatan: 'Finance Officer',
    departemen: 'Finance',
    role: 'karyawan',
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  },
]

let attendances: Attendance[] = []

// Generate some sample attendance data
function generateSampleAttendance() {
  const today = new Date()
  const sampleData: Attendance[] = []
  
  // Generate attendance for the last 7 days
  for (let i = 0; i < 7; i++) {
    const date = new Date(today)
    date.setDate(date.getDate() - i)
    const dateStr = date.toISOString().split('T')[0]
    
    // Skip weekends
    if (date.getDay() === 0 || date.getDay() === 6) continue
    
    users.filter(u => u.role === 'karyawan').forEach((user, idx) => {
      // Random attendance patterns
      const rand = Math.random()
      let status: AttendanceStatus = 'hadir'
      let waktuMasuk = '08:45'
      
      if (rand < 0.1) {
        status = 'alpha'
        waktuMasuk = ''
      } else if (rand < 0.25) {
        status = 'telat'
        waktuMasuk = `09:${String(15 + Math.floor(Math.random() * 45)).padStart(2, '0')}`
      }
      
      if (status !== 'alpha') {
        sampleData.push({
          id: `${dateStr}-${user.id}`,
          user_id: user.id,
          tanggal: dateStr,
          waktu_masuk: waktuMasuk,
          waktu_keluar: i === 0 ? undefined : '18:00',
          status,
          lokasi_masuk: { latitude: -7.740165, longitude: 110.358284 },
          lokasi_keluar: i === 0 ? undefined : { latitude: -7.740165, longitude: 110.358284 },
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        })
      }
    })
  }
  
  return sampleData
}

attendances = generateSampleAttendance()

// User Functions
export function findUserByUsername(username: string): User | undefined {
  return users.find((u) => u.username === username)
}

export function findUserById(id: string): User | undefined {
  return users.find((u) => u.id === id)
}

export function getAllUsers(): User[] {
  return users.map(({ password, ...user }) => user as User)
}

export function getAllKaryawan(): User[] {
  return users.filter(u => u.role === 'karyawan').map(({ password, ...user }) => user as User)
}

export function createUser(userData: Omit<User, 'id' | 'created_at' | 'updated_at'>): User {
  const newUser: User = {
    ...userData,
    id: String(users.length + 1),
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  }
  users.push(newUser)
  return { ...newUser, password: undefined }
}

export function updateUser(id: string, userData: Partial<User>): User | null {
  const index = users.findIndex((u) => u.id === id)
  if (index === -1) return null

  users[index] = {
    ...users[index],
    ...userData,
    updated_at: new Date().toISOString(),
  }
  
  const { password, ...userWithoutPassword } = users[index]
  return userWithoutPassword as User
}

export function deleteUser(id: string): boolean {
  const index = users.findIndex((u) => u.id === id)
  if (index === -1) return false
  users.splice(index, 1)
  return true
}

// Attendance Functions
export function getTodayAttendance(userId: string): Attendance | undefined {
  const today = new Date().toISOString().split('T')[0]
  return attendances.find((a) => a.user_id === userId && a.tanggal === today)
}

export function checkIn(
  userId: string,
  foto: string,
  lokasi: { latitude: number; longitude: number }
): Attendance {
  const now = new Date()
  const today = now.toISOString().split('T')[0]
  const waktuMasuk = now.toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit', hour12: false })
  
  const status: AttendanceStatus = isLateCheckIn(now) ? 'telat' : 'hadir'
  
  const attendance: Attendance = {
    id: `${today}-${userId}`,
    user_id: userId,
    tanggal: today,
    waktu_masuk: waktuMasuk,
    foto_masuk: foto,
    lokasi_masuk: lokasi,
    status,
    created_at: now.toISOString(),
    updated_at: now.toISOString(),
  }
  
  attendances.push(attendance)
  return attendance
}

export function checkOut(
  userId: string,
  foto: string,
  lokasi: { latitude: number; longitude: number }
): Attendance | null {
  const today = new Date().toISOString().split('T')[0]
  const index = attendances.findIndex((a) => a.user_id === userId && a.tanggal === today)
  
  if (index === -1) return null
  
  const now = new Date()
  attendances[index] = {
    ...attendances[index],
    waktu_keluar: now.toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit', hour12: false }),
    foto_keluar: foto,
    lokasi_keluar: lokasi,
    updated_at: now.toISOString(),
  }
  
  return attendances[index]
}

export function getUserAttendanceHistory(userId: string, limit = 30): Attendance[] {
  return attendances
    .filter((a) => a.user_id === userId)
    .sort((a, b) => new Date(b.tanggal).getTime() - new Date(a.tanggal).getTime())
    .slice(0, limit)
}

export function getAllAttendanceByDate(date: string): (Attendance & { user?: User })[] {
  const dateAttendances = attendances.filter((a) => a.tanggal === date)
  
  return dateAttendances.map((a) => {
    const user = findUserById(a.user_id)
    const { password, ...userWithoutPassword } = user || {}
    return {
      ...a,
      user: userWithoutPassword as User,
    }
  })
}

export function getAttendanceStats(date: string): {
  total_karyawan: number
  hadir_hari_ini: number
  telat_hari_ini: number
  tidak_hadir: number
} {
  const karyawanCount = users.filter(u => u.role === 'karyawan').length
  const dateAttendances = attendances.filter((a) => a.tanggal === date)
  
  const hadirCount = dateAttendances.filter((a) => a.status === 'hadir').length
  const telatCount = dateAttendances.filter((a) => a.status === 'telat').length
  
  return {
    total_karyawan: karyawanCount,
    hadir_hari_ini: hadirCount,
    telat_hari_ini: telatCount,
    tidak_hadir: karyawanCount - hadirCount - telatCount,
  }
}

export function getAllAttendance(): Attendance[] {
  return attendances.sort((a, b) => new Date(b.tanggal).getTime() - new Date(a.tanggal).getTime())
}

export function getAttendanceByDateRange(startDate: string, endDate: string): (Attendance & { user?: User })[] {
  return attendances
    .filter((a) => a.tanggal >= startDate && a.tanggal <= endDate)
    .map((a) => {
      const user = findUserById(a.user_id)
      const { password, ...userWithoutPassword } = user || {}
      return {
        ...a,
        user: userWithoutPassword as User,
      }
    })
    .sort((a, b) => new Date(b.tanggal).getTime() - new Date(a.tanggal).getTime())
}

// Export db object for compatibility with API routes
export const db = {
  // User methods
  findUserByUsername,
  findUserById,
  getUserById: (id: string) => {
    const user = findUserById(id)
    if (!user) return null
    return {
      id: user.id,
      fullName: user.nama_lengkap,
      position: user.jabatan,
      department: user.departemen,
      role: user.role,
    }
  },
  getAllUsers,
  getAllKaryawan,
  createUser,
  updateUser,
  deleteUser,

  // Attendance methods
  getTodayAttendance,
  checkIn,
  checkOut,
  getUserAttendanceHistory,
  getAllAttendanceByDate,
  getAttendanceStats,
  getAllAttendance,
  getAttendanceByDateRange,
  getAttendanceRecords: () => {
    return attendances.map((a) => ({
      id: a.id,
      userId: a.user_id,
      date: a.tanggal,
      checkInTime: a.waktu_masuk || null,
      checkOutTime: a.waktu_keluar || null,
      status: a.status === 'hadir' ? 'present' : a.status === 'telat' ? 'late' : 'absent',
      checkInLocation: a.lokasi_masuk ? { lat: a.lokasi_masuk.latitude, lng: a.lokasi_masuk.longitude } : null,
      checkOutLocation: a.lokasi_keluar ? { lat: a.lokasi_keluar.latitude, lng: a.lokasi_keluar.longitude } : null,
    }))
  },
}
