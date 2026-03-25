-- ============================================
-- CO SO DU LIEU QUAN LY SHOP THOI TRANG
-- SQL Server 2022
-- ============================================

IF NOT EXISTS (SELECT name FROM sys.databases WHERE name = N'shop_thoi_trang')
BEGIN
    CREATE DATABASE shop_thoi_trang COLLATE Vietnamese_CI_AS;
END
GO

USE shop_thoi_trang;
GO

-- ============================================
-- BANG TAI KHOAN
-- ============================================
IF NOT EXISTS (SELECT * FROM sysobjects WHERE name='tai_khoan' AND xtype='U')
CREATE TABLE tai_khoan (
    id INT IDENTITY(1,1) PRIMARY KEY,
    ten_dang_nhap NVARCHAR(50) NOT NULL UNIQUE,
    mat_khau NVARCHAR(255) NOT NULL,
    ho_ten NVARCHAR(100) NOT NULL,
    email NVARCHAR(100),
    so_dien_thoai NVARCHAR(15),
    dia_chi NVARCHAR(255),
    ngay_sinh DATE,
    gioi_tinh NVARCHAR(10),
    chieu_cao DECIMAL(5,1),
    can_nang DECIMAL(5,1),
    vong_1 DECIMAL(5,1),
    vong_2 DECIMAL(5,1),
    vong_3 DECIMAL(5,1),
    hinh_dai_dien NVARCHAR(255),
    vai_tro NVARCHAR(20) DEFAULT 'nhanvien' CHECK (vai_tro IN ('admin', 'nhanvien', 'nguoidung')),
    trang_thai BIT DEFAULT 1,
    ngay_tao DATETIME DEFAULT GETDATE()
);
GO

-- ============================================
-- BANG DANH MUC SAN PHAM
-- ============================================
IF NOT EXISTS (SELECT * FROM sysobjects WHERE name='danh_muc' AND xtype='U')
CREATE TABLE danh_muc (
    id INT IDENTITY(1,1) PRIMARY KEY,
    ten_danh_muc NVARCHAR(100) NOT NULL,
    mo_ta NVARCHAR(255),
    trang_thai BIT DEFAULT 1,
    ngay_tao DATETIME DEFAULT GETDATE()
);
GO

-- ============================================
-- BANG SAN PHAM
-- ============================================
IF NOT EXISTS (SELECT * FROM sysobjects WHERE name='san_pham' AND xtype='U')
CREATE TABLE san_pham (
    id INT IDENTITY(1,1) PRIMARY KEY,
    ma_sp NVARCHAR(20) NOT NULL UNIQUE,
    ten_sp NVARCHAR(200) NOT NULL,
    danh_muc_id INT NULL,
    gia_nhap DECIMAL(15,2) DEFAULT 0,
    gia_ban DECIMAL(15,2) DEFAULT 0,
    so_luong INT DEFAULT 0,
    kich_thuoc NVARCHAR(10),
    mau_sac NVARCHAR(50),
    chat_lieu NVARCHAR(100),
    hinh_anh NVARCHAR(255),
    mo_ta NVARCHAR(MAX),
    gioi_tinh NVARCHAR(20) DEFAULT N'Unisex',
    trang_thai BIT DEFAULT 1,
    ngay_tao DATETIME DEFAULT GETDATE(),
    FOREIGN KEY (danh_muc_id) REFERENCES danh_muc(id) ON DELETE SET NULL
);
GO

-- ============================================
-- BANG KHACH HANG
-- ============================================
IF NOT EXISTS (SELECT * FROM sysobjects WHERE name='khach_hang' AND xtype='U')
CREATE TABLE khach_hang (
    id INT IDENTITY(1,1) PRIMARY KEY,
    ho_ten NVARCHAR(100) NOT NULL,
    so_dien_thoai NVARCHAR(15),
    email NVARCHAR(100),
    dia_chi NVARCHAR(255),
    gioi_tinh NVARCHAR(10) DEFAULT N'Khac' CHECK (gioi_tinh IN (N'Nam', N'Nu', N'Khac')),
    ngay_tao DATETIME DEFAULT GETDATE()
);
GO

-- ============================================
-- BANG NHAN VIEN
-- ============================================
IF NOT EXISTS (SELECT * FROM sysobjects WHERE name='nhan_vien' AND xtype='U')
CREATE TABLE nhan_vien (
    id INT IDENTITY(1,1) PRIMARY KEY,
    ma_nv NVARCHAR(20) NOT NULL UNIQUE,
    ho_ten NVARCHAR(100) NOT NULL,
    so_dien_thoai NVARCHAR(15),
    email NVARCHAR(100),
    dia_chi NVARCHAR(255),
    gioi_tinh NVARCHAR(10) DEFAULT N'Khac' CHECK (gioi_tinh IN (N'Nam', N'Nu', N'Khac')),
    chuc_vu NVARCHAR(50),
    luong DECIMAL(15,2) DEFAULT 0,
    ngay_vao_lam DATE,
    trang_thai BIT DEFAULT 1,
    tai_khoan_id INT NULL,
    ngay_tao DATETIME DEFAULT GETDATE(),
    FOREIGN KEY (tai_khoan_id) REFERENCES tai_khoan(id) ON DELETE SET NULL
);
GO

-- ============================================
-- BANG DON HANG
-- ============================================
IF NOT EXISTS (SELECT * FROM sysobjects WHERE name='don_hang' AND xtype='U')
CREATE TABLE don_hang (
    id INT IDENTITY(1,1) PRIMARY KEY,
    ma_dh NVARCHAR(20) NOT NULL UNIQUE,
    khach_hang_id INT NULL,
    nhan_vien_id INT NULL,
    tai_khoan_id INT NULL,
    ma_giam_gia_id INT NULL,
    ngay_dat DATETIME DEFAULT GETDATE(),
    tong_tien DECIMAL(15,2) DEFAULT 0,
    giam_gia DECIMAL(15,2) DEFAULT 0,
    thanh_toan DECIMAL(15,2) DEFAULT 0,
    phuong_thuc_tt NVARCHAR(20) DEFAULT 'tien_mat' CHECK (phuong_thuc_tt IN ('tien_mat', 'chuyen_khoan', 'the')),
    trang_thai NVARCHAR(20) DEFAULT 'cho_xac_nhan' CHECK (trang_thai IN ('cho_xac_nhan', 'da_xac_nhan', 'dang_giao', 'da_giao', 'da_huy')),
    ghi_chu NVARCHAR(MAX),
    ngay_tao DATETIME DEFAULT GETDATE(),
    FOREIGN KEY (khach_hang_id) REFERENCES khach_hang(id) ON DELETE SET NULL,
    FOREIGN KEY (nhan_vien_id) REFERENCES nhan_vien(id) ON DELETE SET NULL,
    FOREIGN KEY (tai_khoan_id) REFERENCES tai_khoan(id) ON DELETE SET NULL
);
GO

-- ============================================
-- BANG CHI TIET DON HANG
-- ============================================
IF NOT EXISTS (SELECT * FROM sysobjects WHERE name='chi_tiet_don_hang' AND xtype='U')
CREATE TABLE chi_tiet_don_hang (
    id INT IDENTITY(1,1) PRIMARY KEY,
    don_hang_id INT NOT NULL,
    san_pham_id INT NOT NULL,
    so_luong INT NOT NULL DEFAULT 1,
    don_gia DECIMAL(15,2) NOT NULL DEFAULT 0,
    thanh_tien DECIMAL(15,2) NOT NULL DEFAULT 0,
    FOREIGN KEY (don_hang_id) REFERENCES don_hang(id) ON DELETE CASCADE,
    FOREIGN KEY (san_pham_id) REFERENCES san_pham(id)
);
GO

-- ============================================
-- BANG PHIEU NHAP HANG
-- ============================================
IF NOT EXISTS (SELECT * FROM sysobjects WHERE name='phieu_nhap' AND xtype='U')
CREATE TABLE phieu_nhap (
    id INT IDENTITY(1,1) PRIMARY KEY,
    ma_phieu NVARCHAR(20) NOT NULL UNIQUE,
    nhan_vien_id INT NULL,
    nha_cung_cap NVARCHAR(200),
    ngay_nhap DATETIME DEFAULT GETDATE(),
    tong_tien DECIMAL(15,2) DEFAULT 0,
    ghi_chu NVARCHAR(MAX),
    ngay_tao DATETIME DEFAULT GETDATE(),
    FOREIGN KEY (nhan_vien_id) REFERENCES nhan_vien(id) ON DELETE SET NULL
);
GO

-- ============================================
-- BANG CHI TIET PHIEU NHAP
-- ============================================
IF NOT EXISTS (SELECT * FROM sysobjects WHERE name='chi_tiet_phieu_nhap' AND xtype='U')
CREATE TABLE chi_tiet_phieu_nhap (
    id INT IDENTITY(1,1) PRIMARY KEY,
    phieu_nhap_id INT NOT NULL,
    san_pham_id INT NOT NULL,
    so_luong INT NOT NULL DEFAULT 1,
    don_gia DECIMAL(15,2) NOT NULL DEFAULT 0,
    thanh_tien DECIMAL(15,2) NOT NULL DEFAULT 0,
    FOREIGN KEY (phieu_nhap_id) REFERENCES phieu_nhap(id) ON DELETE CASCADE,
    FOREIGN KEY (san_pham_id) REFERENCES san_pham(id)
);
GO

-- ============================================
-- BANG MA GIAM GIA
-- ============================================
IF NOT EXISTS (SELECT * FROM sysobjects WHERE name='ma_giam_gia' AND xtype='U')
CREATE TABLE ma_giam_gia (
    id INT IDENTITY(1,1) PRIMARY KEY,
    ma_code NVARCHAR(50) NOT NULL UNIQUE,
    mo_ta NVARCHAR(255),
    loai_giam NVARCHAR(20) DEFAULT 'phan_tram' CHECK (loai_giam IN ('phan_tram', 'tien')),
    gia_tri DECIMAL(15,2) DEFAULT 0,
    don_toi_thieu DECIMAL(15,2) DEFAULT 0,
    so_luong INT DEFAULT 1,
    da_su_dung INT DEFAULT 0,
    ngay_bat_dau DATETIME DEFAULT GETDATE(),
    ngay_ket_thuc DATETIME NULL,
    trang_thai BIT DEFAULT 1,
    ngay_tao DATETIME DEFAULT GETDATE()
);
GO

-- ============================================
-- BANG CAI DAT HE THONG
-- ============================================
IF NOT EXISTS (SELECT * FROM sysobjects WHERE name='cai_dat' AND xtype='U')
CREATE TABLE cai_dat (
    id INT IDENTITY(1,1) PRIMARY KEY,
    khoa NVARCHAR(100) NOT NULL UNIQUE,
    gia_tri NVARCHAR(MAX),
    ngay_cap_nhat DATETIME DEFAULT GETDATE()
);
GO

-- ============================================
-- BANG LIEN HE
-- ============================================
IF NOT EXISTS (SELECT * FROM sysobjects WHERE name='lien_he' AND xtype='U')
CREATE TABLE lien_he (
    id INT IDENTITY(1,1) PRIMARY KEY,
    tai_khoan_id INT NULL,
    ho_ten NVARCHAR(100) NOT NULL,
    email NVARCHAR(100),
    chu_de NVARCHAR(200),
    noi_dung NVARCHAR(MAX),
    trang_thai NVARCHAR(20) DEFAULT 'chua_doc' CHECK (trang_thai IN ('chua_doc', 'da_doc', 'da_phan_hoi')),
    phan_hoi NVARCHAR(MAX),
    ngay_gui DATETIME DEFAULT GETDATE(),
    ngay_phan_hoi DATETIME NULL,
    FOREIGN KEY (tai_khoan_id) REFERENCES tai_khoan(id) ON DELETE SET NULL
);
GO

-- ============================================
-- DU LIEU MAU
-- ============================================

-- Tai khoan admin (mat khau: Lan123)
SET IDENTITY_INSERT tai_khoan ON;
INSERT INTO tai_khoan (id, ten_dang_nhap, mat_khau, ho_ten, vai_tro) VALUES
(1, N'Lan123', N'$2a$10$K/0mSDBlawZeM6inb0KDueXhYKLCl2gTi6leBLMtrdatDisjyFVqq', N'Quan Tri Vien', N'admin');
SET IDENTITY_INSERT tai_khoan OFF;
GO

-- Danh muc
SET IDENTITY_INSERT danh_muc ON;
INSERT INTO danh_muc (id, ten_danh_muc, mo_ta) VALUES (1, N'Ao', N'Cac loai ao thoi trang');
INSERT INTO danh_muc (id, ten_danh_muc, mo_ta) VALUES (2, N'Quan', N'Cac loai quan thoi trang');
INSERT INTO danh_muc (id, ten_danh_muc, mo_ta) VALUES (3, N'Vay/Dam', N'Cac loai vay, dam');
INSERT INTO danh_muc (id, ten_danh_muc, mo_ta) VALUES (4, N'Giay dep', N'Cac loai giay dep thoi trang');
INSERT INTO danh_muc (id, ten_danh_muc, mo_ta) VALUES (5, N'Phu kien', N'Tui xach, mu non, that lung, ...');
SET IDENTITY_INSERT danh_muc OFF;
GO

-- San pham mau
SET IDENTITY_INSERT san_pham ON;
INSERT INTO san_pham (id, ma_sp, ten_sp, danh_muc_id, gia_nhap, gia_ban, so_luong, kich_thuoc, mau_sac, chat_lieu, mo_ta) VALUES (1, N'SP001', N'Ao thun basic cotton', 1, 80000, 150000, 50, N'M', N'Trang', N'Cotton 100%', N'Ao thun co tron basic');
INSERT INTO san_pham (id, ma_sp, ten_sp, danh_muc_id, gia_nhap, gia_ban, so_luong, kich_thuoc, mau_sac, chat_lieu, mo_ta) VALUES (2, N'SP002', N'Ao so mi cong so', 1, 120000, 250000, 30, N'L', N'Xanh nhat', N'Vai kate', N'Ao so mi dai tay cong so');
INSERT INTO san_pham (id, ma_sp, ten_sp, danh_muc_id, gia_nhap, gia_ban, so_luong, kich_thuoc, mau_sac, chat_lieu, mo_ta) VALUES (3, N'SP003', N'Quan jean slim fit', 2, 150000, 350000, 40, N'30', N'Xanh dam', N'Jean co gian', N'Quan jean om vua');
INSERT INTO san_pham (id, ma_sp, ten_sp, danh_muc_id, gia_nhap, gia_ban, so_luong, kich_thuoc, mau_sac, chat_lieu, mo_ta) VALUES (4, N'SP004', N'Quan kaki nam', 2, 100000, 220000, 35, N'31', N'Be', N'Kaki cotton', N'Quan kaki thoi trang nam');
INSERT INTO san_pham (id, ma_sp, ten_sp, danh_muc_id, gia_nhap, gia_ban, so_luong, kich_thuoc, mau_sac, chat_lieu, mo_ta) VALUES (5, N'SP005', N'Vay lien cong so', 3, 180000, 380000, 25, N'S', N'Den', N'Vai chiffon', N'Vay lien than thanh lich');
INSERT INTO san_pham (id, ma_sp, ten_sp, danh_muc_id, gia_nhap, gia_ban, so_luong, kich_thuoc, mau_sac, chat_lieu, mo_ta) VALUES (6, N'SP006', N'Dam du tiec', 3, 250000, 550000, 15, N'M', N'Do', N'Vai lua', N'Dam da hoi sang trong');
INSERT INTO san_pham (id, ma_sp, ten_sp, danh_muc_id, gia_nhap, gia_ban, so_luong, kich_thuoc, mau_sac, chat_lieu, mo_ta) VALUES (7, N'SP007', N'Giay sneaker', 4, 200000, 450000, 20, N'40', N'Trang', N'Da tong hop', N'Giay sneaker the thao');
INSERT INTO san_pham (id, ma_sp, ten_sp, danh_muc_id, gia_nhap, gia_ban, so_luong, kich_thuoc, mau_sac, chat_lieu, mo_ta) VALUES (8, N'SP008', N'Tui xach nu', 5, 150000, 320000, 18, N'Free', N'Nau', N'Da PU', N'Tui xach thoi trang nu');
SET IDENTITY_INSERT san_pham OFF;
GO

-- Khach hang mau
SET IDENTITY_INSERT khach_hang ON;
INSERT INTO khach_hang (id, ho_ten, so_dien_thoai, email, dia_chi, gioi_tinh) VALUES (1, N'Nguyen Van An', N'0901234567', N'an.nguyen@email.com', N'123 Nguyen Hue, Q.1, TP.HCM', N'Nam');
INSERT INTO khach_hang (id, ho_ten, so_dien_thoai, email, dia_chi, gioi_tinh) VALUES (2, N'Tran Thi Binh', N'0912345678', N'binh.tran@email.com', N'456 Le Loi, Q.3, TP.HCM', N'Nu');
INSERT INTO khach_hang (id, ho_ten, so_dien_thoai, email, dia_chi, gioi_tinh) VALUES (3, N'Le Hoang Cuong', N'0923456789', N'cuong.le@email.com', N'789 Dien Bien Phu, Q.Binh Thanh, TP.HCM', N'Nam');
INSERT INTO khach_hang (id, ho_ten, so_dien_thoai, email, dia_chi, gioi_tinh) VALUES (4, N'Pham Thi Dung', N'0934567890', N'dung.pham@email.com', N'321 Tran Hung Dao, Q.5, TP.HCM', N'Nu');
INSERT INTO khach_hang (id, ho_ten, so_dien_thoai, email, dia_chi, gioi_tinh) VALUES (5, N'Hoang Minh Duc', N'0945678901', N'duc.hoang@email.com', N'654 Hai Ba Trung, Q.1, TP.HCM', N'Nam');
SET IDENTITY_INSERT khach_hang OFF;
GO

-- Nhan vien mau
SET IDENTITY_INSERT nhan_vien ON;
INSERT INTO nhan_vien (id, ma_nv, ho_ten, so_dien_thoai, email, dia_chi, gioi_tinh, chuc_vu, luong, ngay_vao_lam, tai_khoan_id) VALUES (1, N'NV001', N'Quan Tri Vien', N'0900000000', N'admin@shop.com', N'TP.HCM', N'Nam', N'Quan ly', 15000000, '2024-01-01', 1);
SET IDENTITY_INSERT nhan_vien OFF;
GO

-- Don hang mau
SET IDENTITY_INSERT don_hang ON;
INSERT INTO don_hang (id, ma_dh, khach_hang_id, nhan_vien_id, tong_tien, thanh_toan, trang_thai) VALUES (1, N'DH001', 1, 1, 500000, 500000, N'da_giao');
INSERT INTO don_hang (id, ma_dh, khach_hang_id, nhan_vien_id, tong_tien, thanh_toan, trang_thai) VALUES (2, N'DH002', 2, 1, 930000, 930000, N'da_giao');
INSERT INTO don_hang (id, ma_dh, khach_hang_id, nhan_vien_id, tong_tien, thanh_toan, trang_thai) VALUES (3, N'DH003', 3, 1, 350000, 350000, N'cho_xac_nhan');
SET IDENTITY_INSERT don_hang OFF;
GO

-- Chi tiet don hang mau
INSERT INTO chi_tiet_don_hang (don_hang_id, san_pham_id, so_luong, don_gia, thanh_tien) VALUES (1, 1, 2, 150000, 300000);
INSERT INTO chi_tiet_don_hang (don_hang_id, san_pham_id, so_luong, don_gia, thanh_tien) VALUES (1, 4, 1, 220000, 220000);
INSERT INTO chi_tiet_don_hang (don_hang_id, san_pham_id, so_luong, don_gia, thanh_tien) VALUES (2, 5, 1, 380000, 380000);
INSERT INTO chi_tiet_don_hang (don_hang_id, san_pham_id, so_luong, don_gia, thanh_tien) VALUES (2, 6, 1, 550000, 550000);
INSERT INTO chi_tiet_don_hang (don_hang_id, san_pham_id, so_luong, don_gia, thanh_tien) VALUES (3, 3, 1, 350000, 350000);
GO

-- Cai dat mac dinh
IF NOT EXISTS (SELECT * FROM cai_dat WHERE khoa = 'phi_van_chuyen')
INSERT INTO cai_dat (khoa, gia_tri) VALUES ('phi_van_chuyen', '30000');
IF NOT EXISTS (SELECT * FROM cai_dat WHERE khoa = 'phi_hoa_toc')
INSERT INTO cai_dat (khoa, gia_tri) VALUES ('phi_hoa_toc', '50000');
IF NOT EXISTS (SELECT * FROM cai_dat WHERE khoa = 'giao_hang_mien_phi_tu')
INSERT INTO cai_dat (khoa, gia_tri) VALUES ('giao_hang_mien_phi_tu', '500000');
IF NOT EXISTS (SELECT * FROM cai_dat WHERE khoa = 'don_hang_tu_dong_huy')
INSERT INTO cai_dat (khoa, gia_tri) VALUES ('don_hang_tu_dong_huy', '24');
GO
