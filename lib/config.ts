import type { AppConfig } from './types'

export const APP_CONFIG: AppConfig = {
  company_name: 'PT Lestari Bumi Persada',
  office_location: {
    latitude: -7.740165594931652,
    longitude: 110.35828466491625,
  },
  office_radius_meters: 100,
  work_start_time: '09:00',
  work_end_time: '18:00',
  late_tolerance_minutes: 15,
}

// Helper function to calculate distance between two coordinates (Haversine formula)
export function calculateDistance(
  lat1: number,
  lon1: number,
  lat2: number,
  lon2: number
): number {
  const R = 6371e3 // Earth's radius in meters
  const phi1 = (lat1 * Math.PI) / 180
  const phi2 = (lat2 * Math.PI) / 180
  const deltaPhi = ((lat2 - lat1) * Math.PI) / 180
  const deltaLambda = ((lon2 - lon1) * Math.PI) / 180

  const a =
    Math.sin(deltaPhi / 2) * Math.sin(deltaPhi / 2) +
    Math.cos(phi1) * Math.cos(phi2) * Math.sin(deltaLambda / 2) * Math.sin(deltaLambda / 2)
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a))

  return R * c // Distance in meters
}

// Check if user is within office radius
export function isWithinOfficeRadius(userLat: number, userLon: number): boolean {
  const distance = calculateDistance(
    userLat,
    userLon,
    APP_CONFIG.office_location.latitude,
    APP_CONFIG.office_location.longitude
  )
  return distance <= APP_CONFIG.office_radius_meters
}

// Check if check-in time is late
export function isLateCheckIn(checkInTime: Date): boolean {
  const [hours, minutes] = APP_CONFIG.work_start_time.split(':').map(Number)
  const workStartTime = new Date(checkInTime)
  workStartTime.setHours(hours, minutes + APP_CONFIG.late_tolerance_minutes, 0, 0)
  return checkInTime > workStartTime
}

// Format time to HH:mm
export function formatTime(date: Date): string {
  return date.toLocaleTimeString('id-ID', {
    hour: '2-digit',
    minute: '2-digit',
    hour12: false,
  })
}

// Format date to Indonesian format
export function formatDate(date: Date): string {
  return date.toLocaleDateString('id-ID', {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  })
}

// Format date for database (YYYY-MM-DD)
export function formatDateForDB(date: Date): string {
  return date.toISOString().split('T')[0]
}
