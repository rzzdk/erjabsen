// Google Sheets Integration Helper
// This file provides utilities for syncing attendance data to Google Sheets

export interface SheetConfig {
  spreadsheetId: string;
  sheetName: string;
  apiKey?: string;
  serviceAccountEmail?: string;
  privateKey?: string;
}

export interface AttendanceRow {
  tanggal: string;
  nama: string;
  jabatan: string;
  departemen: string;
  jamMasuk: string;
  jamPulang: string;
  status: string;
  lokasiMasuk: string;
  lokasiPulang: string;
}

// Format attendance data for Google Sheets
export function formatAttendanceForSheets(
  attendance: {
    date: string;
    userName: string;
    userPosition: string;
    userDepartment: string;
    checkInTime: string | null;
    checkOutTime: string | null;
    status: string;
    checkInLocation: { lat: number; lng: number } | null;
    checkOutLocation: { lat: number; lng: number } | null;
  }[]
): AttendanceRow[] {
  return attendance.map((record) => ({
    tanggal: new Date(record.date).toLocaleDateString("id-ID", {
      weekday: "long",
      year: "numeric",
      month: "long",
      day: "numeric",
    }),
    nama: record.userName,
    jabatan: record.userPosition,
    departemen: record.userDepartment,
    jamMasuk: record.checkInTime || "-",
    jamPulang: record.checkOutTime || "-",
    status: translateStatus(record.status),
    lokasiMasuk: record.checkInLocation
      ? `${record.checkInLocation.lat}, ${record.checkInLocation.lng}`
      : "-",
    lokasiPulang: record.checkOutLocation
      ? `${record.checkOutLocation.lat}, ${record.checkOutLocation.lng}`
      : "-",
  }));
}

function translateStatus(status: string): string {
  const statusMap: Record<string, string> = {
    present: "Hadir",
    late: "Terlambat",
    absent: "Tidak Hadir",
    "half-day": "Setengah Hari",
  };
  return statusMap[status] || status;
}

// Generate Google Sheets API URL for appending data
export function getAppendUrl(spreadsheetId: string, sheetName: string): string {
  return `https://sheets.googleapis.com/v4/spreadsheets/${spreadsheetId}/values/${encodeURIComponent(sheetName)}:append`;
}

// Generate Google Sheets API URL for reading data
export function getReadUrl(
  spreadsheetId: string,
  sheetName: string,
  range?: string
): string {
  const fullRange = range ? `${sheetName}!${range}` : sheetName;
  return `https://sheets.googleapis.com/v4/spreadsheets/${spreadsheetId}/values/${encodeURIComponent(fullRange)}`;
}

// Convert attendance rows to 2D array for Sheets API
export function rowsToValues(rows: AttendanceRow[]): string[][] {
  return rows.map((row) => [
    row.tanggal,
    row.nama,
    row.jabatan,
    row.departemen,
    row.jamMasuk,
    row.jamPulang,
    row.status,
    row.lokasiMasuk,
    row.lokasiPulang,
  ]);
}

// Get header row for the spreadsheet
export function getHeaderRow(): string[] {
  return [
    "Tanggal",
    "Nama Karyawan",
    "Jabatan",
    "Departemen",
    "Jam Masuk",
    "Jam Pulang",
    "Status",
    "Lokasi Masuk",
    "Lokasi Pulang",
  ];
}

// Instructions for setting up Google Sheets integration
export const SETUP_INSTRUCTIONS = `
## Cara Setup Integrasi Google Sheets

### Langkah 1: Buat Google Cloud Project
1. Buka https://console.cloud.google.com/
2. Buat project baru atau pilih project yang sudah ada
3. Aktifkan Google Sheets API di Library

### Langkah 2: Buat Service Account
1. Di Google Cloud Console, buka IAM & Admin > Service Accounts
2. Klik "Create Service Account"
3. Beri nama (contoh: "presensi-sync")
4. Klik "Create and Continue"
5. Skip role assignment, klik "Done"
6. Klik service account yang baru dibuat
7. Tab "Keys" > Add Key > Create New Key > JSON
8. Simpan file JSON yang didownload

### Langkah 3: Setup Google Spreadsheet
1. Buat Google Spreadsheet baru
2. Salin Spreadsheet ID dari URL (bagian antara /d/ dan /edit)
3. Share spreadsheet ke email service account (dari file JSON, field "client_email")
4. Beri akses "Editor"

### Langkah 4: Konfigurasi Aplikasi
Tambahkan environment variables berikut:
- GOOGLE_SHEETS_SPREADSHEET_ID: ID 1v1LKZxy0uJ3Qj-6Za8_6szwc8jEOUOdykLUXInMSqoU
- GOOGLE_SHEETS_CLIENT_EMAIL: erjaabsen@erjaabsen.iam.gserviceaccount.com
- GOOGLE_SHEETS_PRIVATE_KEY: -----BEGIN PRIVATE KEY-----\nMIIEvAIBADANBgkqhkiG9w0BAQEFAASCBKYwggSiAgEAAoIBAQCmVfYOAgg8mgPX\nyJpAvpeV4G5UAdJbo7wYQ/mDPQMVxEm5Gm2tKTqE0Yf3TayVkPe2UXzzLhKvUasV\nvYZYJS1EvRVHGtBZOi4lq4oMbkJjdKmEB6SMtRGnxZCDijxWVFWp/jJ88jkaSdaI\nsGMMUHOTZtBqx9tK0XRdVf8pFxpQaYEaCVjLo5Ad9SqJqgvktH+/TUBN0Sbrd1ZB\nBDj2kbtadoyEPLf3Rakt9F4lw6tI3CaHSrWOeK7lK1jHFoQDQ3boWe+DSyzI6L75\nAZssZDlcwF4WwM53bWb/njGiCr0BF/nn9zTI3Rrctr21G5ihzc/PzQkJ/E0Wd+Vy\n/l8hYoGdAgMBAAECggEACIZ5YQhroaeHMOUgOtdJ762cGgQp4vaGanv5aueSo+f2\nm10mZ+yoCiyvGlbJ1LSkbZzJmbEv1fqKmUeofhYRtuc2Evnl2dzohpe/MJnqHyzY\nj2LQ5UFWkVHH8WYBZ69U4Kydq9fCY32LWGAqA3SQJ+rqHb72l2Qa4bnJpTKA78QT\nZKt/O3ER2HUmrQSOWn5btjL/Xrj75o3KoBHRUlXg8Mviyf+dgnBVzqEjKNt1U6b+\nIAOmzseZq0lGcagmutC6qMmhi6rREjT45vjs1TqAHhjM7V+C6LoEBzW7T0rLSE4p\nfmu3bP7i8Z2qqyCxkl68jpyORt5pl6pevdTElJ0awQKBgQDXcTLJI1jyubh421cq\n/B+VjUamJ7uG8wXLcTPf75e0o6Fe9dNHdVhOgB/MmnVav/Oqtw1nnxRHR+z22xpN\nijACwbpmZYEe17sBtER+zCx1TEyFSgOXcErslZLORfhup+ZkWwS+ofEG8XaDQGRR\nG8zhLjSkwyGXvlroA6KJ2ada8QKBgQDFpi3VKyBe7sr5Tvah4F9lxUqxfcdh99t3\nAcajjVNANCPwD6N5piPncopt4HcTGTtEonPPdvG+9pHbQiMNUgUW5x2RGJRElcu4\njCnhwZfEoOH5GdVaX2Uu8i3zBQc2GuTG0OnI8QQDayqP6BM3If0NA4VFTUeodU5E\n1NX4sLNZbQKBgAJrYwafPwB61XeF/xScgD5Nt91l1NVPJWGDg/Gf3zRIIifO2vCS\ngMtg5PqHQYojXbktFRl0z+V9CUw8aa81PhTJ2C4ONcUC5za9r4c9A8LNeI6GpkOt\nHypJA70NTBzyBcRawVLivrI1Q/91WasPhN2Ch1TSXC44FQ1F/S1PJHIBAoGAM0dA\n/tw4gsi7WmE1NZxLw9Ci51e1oeI3SzHnwkkJP1AHvuGfzRDgocyiw40H96mFKfJn\nz3yRjbTU9Ki9BVixP1bo4dsZpI2klBWxTAP5ByeiWQltxAuZ6cslRraYP15M2pQb\nA2ocW3KzUTCpw5UK3RR7wBYjsD32936soN/fOCUCgYAc9T3mOD973aw6cg8CwcHm\nCmDl9sjy+E/Oqj8RnUecQrWEZLz4Jh/pcKo4WcMFCDVlFI0DIDXzulHKjm5pc7EJ\nKJfyOe1/OpOLpsWgCCGUotf58DkbltDCG9zFMz/tkB2rEgTajk1tv1bW7HQOFL2V\n6B9IJHqYoAhMWYoafiz+og==\n-----END PRIVATE KEY-----\n

### Langkah 5: Struktur Spreadsheet
Buat sheet dengan nama "Presensi" dan header berikut di baris pertama:
Tanggal | Nama Karyawan | Jabatan | Departemen | Jam Masuk | Jam Pulang | Status | Lokasi Masuk | Lokasi Pulang
`;
