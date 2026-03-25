const express = require('express');
const router = express.Router();
const { sql, getPool } = require('../config/database');

router.get('/dashboard', async (req, res) => {
    try {
        const pool = await getPool();

        const sanPham = await pool.request().query('SELECT COUNT(*) as total FROM san_pham WHERE trang_thai = 1');
        const donHang = await pool.request().query('SELECT COUNT(*) as total FROM don_hang');
        const khachHang = await pool.request().query('SELECT COUNT(*) as total FROM khach_hang');
        const doanhThu = await pool.request().query("SELECT COALESCE(SUM(thanh_toan), 0) as total FROM don_hang WHERE trang_thai = 'da_giao'");
        const donChoXuLy = await pool.request().query("SELECT COUNT(*) as total FROM don_hang WHERE trang_thai = 'cho_xac_nhan'");
        const spHetHang = await pool.request().query('SELECT COUNT(*) as total FROM san_pham WHERE so_luong <= 0 AND trang_thai = 1');

        const donHangGanDay = await pool.request().query(`
            SELECT TOP 5 dh.*, kh.ho_ten as ten_khach
            FROM don_hang dh
            LEFT JOIN khach_hang kh ON dh.khach_hang_id = kh.id
            ORDER BY dh.ngay_tao DESC
        `);

        const spBanChay = await pool.request().query(`
            SELECT TOP 5 sp.ten_sp, sp.ma_sp, SUM(ct.so_luong) as tong_ban
            FROM chi_tiet_don_hang ct
            JOIN san_pham sp ON ct.san_pham_id = sp.id
            JOIN don_hang dh ON ct.don_hang_id = dh.id
            WHERE dh.trang_thai = 'da_giao'
            GROUP BY sp.id, sp.ten_sp, sp.ma_sp ORDER BY tong_ban DESC
        `);

        const doanhThu7Ngay = await pool.request().query(`
            SELECT CONVERT(date, ngay_dat) as ngay, COALESCE(SUM(thanh_toan), 0) as doanh_thu
            FROM don_hang
            WHERE trang_thai = 'da_giao' AND ngay_dat >= DATEADD(day, -7, GETDATE())
            GROUP BY CONVERT(date, ngay_dat)
            ORDER BY ngay ASC
        `);

        res.render('dashboard/index', {
            layout: 'layouts/main',
            user: req.session.user,
            currentPage: 'dashboard',
            pageTitle: 'Tong quan',
            messages: req.flash(),
            stats: {
                sanPham: sanPham.recordset[0].total,
                donHang: donHang.recordset[0].total,
                khachHang: khachHang.recordset[0].total,
                doanhThu: doanhThu.recordset[0].total,
                donChoXuLy: donChoXuLy.recordset[0].total,
                spHetHang: spHetHang.recordset[0].total
            },
            donHangGanDay: donHangGanDay.recordset,
            spBanChay: spBanChay.recordset,
            doanhThu7Ngay: doanhThu7Ngay.recordset
        });
    } catch (error) {
        console.error('Loi dashboard:', error);
        req.flash('error', 'Co loi xay ra');
        res.redirect('/dang-nhap');
    }
});

module.exports = router;
