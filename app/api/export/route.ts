import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";

export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams;
  const format = searchParams.get("format") || "csv";
  const startDate = searchParams.get("startDate");
  const endDate = searchParams.get("endDate");
  const userId = searchParams.get("userId");

  try {
    let records = db.getAttendanceRecords();

    // Filter by date range
    if (startDate) {
      records = records.filter(
        (r) => new Date(r.date) >= new Date(startDate)
      );
    }
    if (endDate) {
      records = records.filter(
        (r) => new Date(r.date) <= new Date(endDate)
      );
    }

    // Filter by user
    if (userId) {
      records = records.filter((r) => r.userId === userId);
    }

    // Enrich with user data
    const enrichedRecords = records.map((record) => {
      const user = db.getUserById(record.userId);
      return {
        ...record,
        userName: user?.fullName || "Unknown",
        userPosition: user?.position || "-",
        userDepartment: user?.department || "-",
      };
    });

    if (format === "csv") {
      const csv = generateCSV(enrichedRecords);
      return new NextResponse(csv, {
        headers: {
          "Content-Type": "text/csv; charset=utf-8",
          "Content-Disposition": `attachment; filename="laporan-presensi-${new Date().toISOString().split("T")[0]}.csv"`,
        },
      });
    }

    // JSON format
    return NextResponse.json({
      success: true,
      data: enrichedRecords,
    });
  } catch (error) {
    console.error("Export error:", error);
    return NextResponse.json(
      { success: false, error: "Gagal mengekspor data" },
      { status: 500 }
    );
  }
}

function generateCSV(
  records: {
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
): string {
  const headers = [
    "Tanggal",
    "Nama Karyawan",
    "Jabatan",
    "Departemen",
    "Jam Masuk",
    "Jam Pulang",
    "Status",
    "Koordinat Masuk",
    "Koordinat Pulang",
  ];

  const statusMap: Record<string, string> = {
    present: "Hadir",
    late: "Terlambat",
    absent: "Tidak Hadir",
    "half-day": "Setengah Hari",
  };

  const rows = records.map((record) => [
    new Date(record.date).toLocaleDateString("id-ID"),
    record.userName,
    record.userPosition,
    record.userDepartment,
    record.checkInTime || "-",
    record.checkOutTime || "-",
    statusMap[record.status] || record.status,
    record.checkInLocation
      ? `${record.checkInLocation.lat},${record.checkInLocation.lng}`
      : "-",
    record.checkOutLocation
      ? `${record.checkOutLocation.lat},${record.checkOutLocation.lng}`
      : "-",
  ]);

  const csvContent = [
    headers.join(","),
    ...rows.map((row) =>
      row.map((cell) => `"${String(cell).replace(/"/g, '""')}"`).join(",")
    ),
  ].join("\n");

  // Add BOM for Excel UTF-8 compatibility
  return "\uFEFF" + csvContent;
}
