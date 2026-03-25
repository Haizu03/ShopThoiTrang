const express = require('express');
const router = express.Router();
const { sql, getPool } = require('../config/database');

router.get('/', async (req, res) => {
    try {
        const thang = req.query.thang || new Date().getMonth() + 1;
        const nam = req.query.nam || new Date().getFullYear();
        const pool = await getPool();

        const doanhThuThang = await pool.request()
            .input('nam', sql.Int, nam)
            .query(`SELECT MONTH(ngay_dat) as thang, SUM(thanh_toan) as doanh_thu, COUNT(*) as so_don
                    FROM don_hang WHERE trang_thai = 'da_giao' AND YEAR(ngay_dat) = @nam
                    GROUP BY MONTH(ngay_dat) ORDER BY thang`);

        const dtThangNay = await pool.request()
            .input('thang', sql.Int, thang)
            .input('nam', sql.Int, nam)
            .query(`SELECT COALESCE(SUM(thanh_toan), 0) as tong FROM don_hang
                    WHERE trang_thai = 'da_giao' AND MONTH(ngay_dat) = @thang AND YEAR(ngay_dat) = @nam`);

        const spBanChay = await pool.request()
            .input('thang', sql.Int, thang)
            .input('nam', sql.Int, nam)
            .query(`SELECT TOP 10 sp.ma_sp, sp.ten_sp, sp.gia_ban, SUM(ct.so_luong) as tong_ban, SUM(ct.thanh_tien) as tong_doanh_thu
                    FROM chi_tiet_don_hang ct
                    JOIN san_pham sp ON ct.san_pham_id = sp.id
                    JOIN don_hang dh ON ct.don_hang_id = dh.id
                    WHERE dh.trang_thai = 'da_giao' AND MONTH(dh.ngay_dat) = @thang AND YEAR(dh.ngay_dat) = @nam
                    GROUP BY sp.id, sp.ma_sp, sp.ten_sp, sp.gia_ban ORDER BY tong_ban DESC`);

        const doanhThuDanhMuc = await pool.request()
            .input('nam', sql.Int, nam)
            .query(`SELECT dm.ten_danh_muc, SUM(ct.thanh_tien) as doanh_thu
                    FROM chi_tiet_don_hang ct
                    JOIN san_pham sp ON ct.san_pham_id = sp.id
                    JOIN danh_muc dm ON sp.danh_muc_id = dm.id
                    JOIN don_hang dh ON ct.don_hang_id = dh.id
                    WHERE dh.trang_thai = 'da_giao' AND YEAR(dh.ngay_dat) = @nam
                    GROUP BY dm.id, dm.ten_danh_muc ORDER BY doanh_thu DESC`);

        const tonKho = await pool.request().query(`
            SELECT TOP 20 sp.ma_sp, sp.ten_sp, sp.so_luong, sp.gia_nhap, sp.gia_ban,
                   (sp.so_luong * sp.gia_nhap) as gia_tri_ton,
                   dm.ten_danh_muc
            FROM san_pham sp
            LEFT JOIN danh_muc dm ON sp.danh_muc_id = dm.id
            WHERE sp.trang_thai = 1
            ORDER BY sp.so_luong ASC
        `);

        const topKhachHang = await pool.request().query(`
            SELECT TOP 10 kh.ho_ten, kh.so_dien_thoai, COUNT(dh.id) as so_don, SUM(dh.thanh_toan) as tong_chi
            FROM khach_hang kh
            JOIN don_hang dh ON kh.id = dh.khach_hang_id AND dh.trang_thai = 'da_giao'
            GROUP BY kh.id, kh.ho_ten, kh.so_dien_thoai ORDER BY tong_chi DESC
        `);

        res.render('thong-ke/index', {
            layout: 'layouts/main',
            user: req.session.user,
            currentPage: 'thong-ke',
            pageTitle: 'Thong ke & Bao cao',
            messages: req.flash(),
            thang: parseInt(thang),
            nam: parseInt(nam),
            doanhThuThang: doanhThuThang.recordset,
            dtThangNay: dtThangNay.recordset[0].tong,
            spBanChay: spBanChay.recordset,
            doanhThuDanhMuc: doanhThuDanhMuc.recordset,
            tonKho: tonKho.recordset,
            topKhachHang: topKhachHang.recordset
        });
    } catch (error) {
        console.error('Loi:', error);
        req.flash('error', 'Co loi xay ra');
        res.redirect('/dashboard');
    }
});

module.exports = router;
