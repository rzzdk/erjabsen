-- =====================================================
-- Database Schema untuk Aplikasi Presensi Karyawan
-- PT Lestari Bumi Persada
-- =====================================================

-- Buat database
CREATE DATABASE IF NOT EXISTS presensi_db CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
USE presensi_db;

-- =====================================================
-- Tabel Users (Karyawan dan Admin)
-- =====================================================
CREATE TABLE IF NOT EXISTS users (
    id INT AUTO_INCREMENT PRIMARY KEY,
    username VARCHAR(50) NOT NULL UNIQUE,
    password VARCHAR(255) NOT NULL, -- Gunakan bcrypt untuk hashing
    nama_lengkap VARCHAR(100) NOT NULL,
    email VARCHAR(100) NOT NULL UNIQUE,
    jabatan VARCHAR(100) NOT NULL,
    departemen VARCHAR(100) NOT NULL,
    role ENUM('admin', 'karyawan') NOT NULL DEFAULT 'karyawan',
    foto_profil TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    
    INDEX idx_username (username),
    INDEX idx_email (email),
    INDEX idx_role (role)
) ENGINE=InnoDB;

-- =====================================================
-- Tabel Attendance (Presensi)
-- =====================================================
CREATE TABLE IF NOT EXISTS attendance (
    id INT AUTO_INCREMENT PRIMARY KEY,
    user_id INT NOT NULL,
    tanggal DATE NOT NULL,
    waktu_masuk TIME,
    waktu_keluar TIME,
    foto_masuk LONGTEXT, -- Base64 encoded image
    foto_keluar LONGTEXT, -- Base64 encoded image
    lokasi_masuk_lat DECIMAL(10, 8),
    lokasi_masuk_lng DECIMAL(11, 8),
    lokasi_keluar_lat DECIMAL(10, 8),
    lokasi_keluar_lng DECIMAL(11, 8),
    status ENUM('hadir', 'telat', 'izin', 'sakit', 'alpha') NOT NULL DEFAULT 'hadir',
    keterangan TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    UNIQUE KEY unique_user_date (user_id, tanggal),
    INDEX idx_tanggal (tanggal),
    INDEX idx_status (status),
    INDEX idx_user_tanggal (user_id, tanggal)
) ENGINE=InnoDB;

-- =====================================================
-- Tabel Sessions (untuk autentikasi berbasis session)
-- =====================================================
CREATE TABLE IF NOT EXISTS sessions (
    id VARCHAR(128) PRIMARY KEY,
    user_id INT NOT NULL,
    expires_at TIMESTAMP NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    INDEX idx_user_id (user_id),
    INDEX idx_expires (expires_at)
) ENGINE=InnoDB;

-- =====================================================
-- Tabel Config (Pengaturan aplikasi)
-- =====================================================
CREATE TABLE IF NOT EXISTS app_config (
    config_key VARCHAR(100) PRIMARY KEY,
    config_value TEXT NOT NULL,
    description VARCHAR(255),
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
) ENGINE=InnoDB;

-- Insert default config
INSERT INTO app_config (config_key, config_value, description) VALUES
('company_name', 'PT Lestari Bumi Persada', 'Nama perusahaan'),
('office_latitude', '-7.740165594931652', 'Latitude lokasi kantor'),
('office_longitude', '110.35828466491625', 'Longitude lokasi kantor'),
('office_radius', '100', 'Radius lokasi kantor dalam meter'),
('work_start_time', '09:00', 'Jam mulai kerja'),
('work_end_time', '18:00', 'Jam selesai kerja'),
('late_tolerance_minutes', '15', 'Toleransi keterlambatan dalam menit');

-- =====================================================
-- Insert default admin user
-- Password: admin123 (harap ganti setelah instalasi)
-- =====================================================
INSERT INTO users (username, password, nama_lengkap, email, jabatan, departemen, role) VALUES
('admin', '$2b$10$rQZ8K6vJ9K6vJ9K6vJ9K6.HASHED_PASSWORD_REPLACE_THIS', 'Administrator HR', 'admin@lestari.co.id', 'HR Manager', 'Human Resources', 'admin');

-- =====================================================
-- Stored Procedures
-- =====================================================

-- Procedure untuk mendapatkan statistik harian
DELIMITER //
CREATE PROCEDURE GetDailyStats(IN report_date DATE)
BEGIN
    SELECT 
        (SELECT COUNT(*) FROM users WHERE role = 'karyawan') AS total_karyawan,
        (SELECT COUNT(*) FROM attendance WHERE tanggal = report_date AND status = 'hadir') AS hadir,
        (SELECT COUNT(*) FROM attendance WHERE tanggal = report_date AND status = 'telat') AS telat,
        (SELECT COUNT(*) FROM users WHERE role = 'karyawan') - 
        (SELECT COUNT(*) FROM attendance WHERE tanggal = report_date AND status IN ('hadir', 'telat')) AS tidak_hadir;
END //
DELIMITER ;

-- Procedure untuk laporan bulanan
DELIMITER //
CREATE PROCEDURE GetMonthlyReport(IN report_year INT, IN report_month INT)
BEGIN
    SELECT 
        u.id,
        u.nama_lengkap,
        u.jabatan,
        u.departemen,
        COUNT(CASE WHEN a.status = 'hadir' THEN 1 END) AS total_hadir,
        COUNT(CASE WHEN a.status = 'telat' THEN 1 END) AS total_telat,
        COUNT(CASE WHEN a.status = 'izin' THEN 1 END) AS total_izin,
        COUNT(CASE WHEN a.status = 'sakit' THEN 1 END) AS total_sakit,
        COUNT(CASE WHEN a.status = 'alpha' OR a.id IS NULL THEN 1 END) AS total_alpha
    FROM users u
    LEFT JOIN attendance a ON u.id = a.user_id 
        AND YEAR(a.tanggal) = report_year 
        AND MONTH(a.tanggal) = report_month
    WHERE u.role = 'karyawan'
    GROUP BY u.id, u.nama_lengkap, u.jabatan, u.departemen
    ORDER BY u.nama_lengkap;
END //
DELIMITER ;

-- =====================================================
-- Views
-- =====================================================

-- View untuk attendance dengan data user
CREATE VIEW v_attendance_detail AS
SELECT 
    a.*,
    u.username,
    u.nama_lengkap,
    u.jabatan,
    u.departemen
FROM attendance a
JOIN users u ON a.user_id = u.id;

-- View untuk statistik harian
CREATE VIEW v_daily_stats AS
SELECT 
    tanggal,
    COUNT(CASE WHEN status = 'hadir' THEN 1 END) AS hadir,
    COUNT(CASE WHEN status = 'telat' THEN 1 END) AS telat,
    COUNT(CASE WHEN status = 'izin' THEN 1 END) AS izin,
    COUNT(CASE WHEN status = 'sakit' THEN 1 END) AS sakit
FROM attendance
GROUP BY tanggal
ORDER BY tanggal DESC;
