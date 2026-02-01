// User Types
export type UserRole = 'admin' | 'karyawan'

export interface User {
  id: string
  username: string
  password?: string
  nama_lengkap: string
  email: string
  jabatan: string
  departemen: string
  role: UserRole
  foto_profil?: string
  created_at: string
  updated_at: string
}

export interface UserSession {
  id: string
  username: string
  nama_lengkap: string
  role: UserRole
  jabatan: string
  departemen: string
}

// Attendance Types
export type AttendanceStatus = 'hadir' | 'telat' | 'izin' | 'sakit' | 'alpha'

export interface Attendance {
  id: string
  user_id: string
  tanggal: string
  waktu_masuk?: string
  waktu_keluar?: string
  foto_masuk?: string
  foto_keluar?: string
  lokasi_masuk?: {
    latitude: number
    longitude: number
  }
  lokasi_keluar?: {
    latitude: number
    longitude: number
  }
  status: AttendanceStatus
  keterangan?: string
  created_at: string
  updated_at: string
}

export interface AttendanceWithUser extends Attendance {
  user?: User
}

// API Response Types
export interface ApiResponse<T> {
  success: boolean
  data?: T
  message?: string
  error?: string
}

// Dashboard Stats
export interface DashboardStats {
  total_karyawan: number
  hadir_hari_ini: number
  telat_hari_ini: number
  tidak_hadir: number
}

// Location Types
export interface Location {
  latitude: number
  longitude: number
}

// Config Types
export interface AppConfig {
  company_name: string
  office_location: Location
  office_radius_meters: number
  work_start_time: string
  work_end_time: string
  late_tolerance_minutes: number
}
