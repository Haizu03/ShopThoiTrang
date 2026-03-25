const express = require('express');
const router = express.Router();
const { sql, getPool } = require('../config/database');

router.get('/', async (req, res) => {
    try {
        const keyword = req.query.q || '';
        const loai = req.query.loai || 'tat_ca';
        let sanPhams = [], khachHangs = [], donHangs = [], nhanViens = [], danhMucs = [], maGiamGias = [], lienHes = [], taiKhoans = [], phieuNhaps = [];

        if (keyword) {
            const pool = await getPool();
            const searchTerm = '%' + keyword + '%';

            // Sản phẩm
            if (loai === 'tat_ca' || loai === 'san_pham') {
                const result = await pool.request()
                    .input('s', sql.NVarChar, searchTerm)
                    .query(`SELECT TOP 20 sp.*, dm.ten_danh_muc FROM san_pham sp
                            LEFT JOIN danh_muc dm ON sp.danh_muc_id = dm.id
                            WHERE sp.ten_sp LIKE @s OR sp.ma_sp LIKE @s OR sp.mau_sac LIKE @s OR sp.chat_lieu LIKE @s OR sp.mo_ta LIKE @s
                            ORDER BY sp.ten_sp`);
                sanPhams = result.recordset;
            }

            // Đơn hàng
            if (loai === 'tat_ca' || loai === 'don_hang') {
                const result = await pool.request()
                    .input('s', sql.NVarChar, searchTerm)
                    .query(`SELECT TOP 20 dh.*, 
                            COALESCE(kh.ho_ten, tk.ho_ten) as ten_khach
                            FROM don_hang dh
                            LEFT JOIN khach_hang kh ON dh.khach_hang_id = kh.id
                            LEFT JOIN tai_khoan tk ON dh.tai_khoan_id = tk.id
                            WHERE dh.ma_dh LIKE @s OR kh.ho_ten LIKE @s OR tk.ho_ten LIKE @s OR dh.ghi_chu LIKE @s
                            ORDER BY dh.ngay_tao DESC`);
                donHangs = result.recordset;
            }

            // Khách hàng
            if (loai === 'tat_ca' || loai === 'khach_hang') {
                const result = await pool.request()
                    .input('s', sql.NVarChar, searchTerm)
                    .query(`SELECT TOP 20 * FROM khach_hang 
                            WHERE ho_ten LIKE @s OR so_dien_thoai LIKE @s OR email LIKE @s OR dia_chi LIKE @s 
                            ORDER BY ho_ten`);
                khachHangs = result.recordset;
            }

            // Nhân viên
            if (loai === 'tat_ca' || loai === 'nhan_vien') {
                const result = await pool.request()
                    .input('s', sql.NVarChar, searchTerm)
                    .query(`SELECT TOP 20 * FROM nhan_vien 
                            WHERE ho_ten LIKE @s OR ma_nv LIKE @s OR so_dien_thoai LIKE @s OR email LIKE @s OR chuc_vu LIKE @s
                            ORDER BY ho_ten`);
                nhanViens = result.recordset;
            }

            // Danh mục
            if (loai === 'tat_ca' || loai === 'danh_muc') {
                const result = await pool.request()
                    .input('s', sql.NVarChar, searchTerm)
                    .query(`SELECT TOP 20 * FROM danh_muc WHERE ten_danh_muc LIKE @s OR mo_ta LIKE @s ORDER BY ten_danh_muc`);
                danhMucs = result.recordset;
            }

            // Tài khoản
            if (loai === 'tat_ca' || loai === 'tai_khoan') {
                const result = await pool.request()
                    .input('s', sql.NVarChar, searchTerm)
                    .query(`SELECT TOP 20 id, ten_dang_nhap, ho_ten, vai_tro, trang_thai, email, so_dien_thoai, ngay_tao 
                            FROM tai_khoan 
                            WHERE ho_ten LIKE @s OR ten_dang_nhap LIKE @s OR email LIKE @s OR so_dien_thoai LIKE @s
                            ORDER BY ho_ten`);
                taiKhoans = result.recordset;
            }

            // Mã giảm giá
            if (loai === 'tat_ca' || loai === 'ma_giam_gia') {
                const result = await pool.request()
                    .input('s', sql.NVarChar, searchTerm)
                    .query(`SELECT TOP 20 * FROM ma_giam_gia WHERE ma_code LIKE @s OR mo_ta LIKE @s ORDER BY ngay_tao DESC`);
                maGiamGias = result.recordset;
            }

            // Liên hệ
            if (loai === 'tat_ca' || loai === 'lien_he') {
                const result = await pool.request()
                    .input('s', sql.NVarChar, searchTerm)
                    .query(`SELECT TOP 20 * FROM lien_he WHERE ho_ten LIKE @s OR email LIKE @s OR chu_de LIKE @s OR noi_dung LIKE @s ORDER BY ngay_gui DESC`);
                lienHes = result.recordset;
            }

            // Phiếu nhập
            if (loai === 'tat_ca' || loai === 'phieu_nhap') {
                const result = await pool.request()
                    .input('s', sql.NVarChar, searchTerm)
                    .query(`SELECT TOP 20 pn.*, nv.ho_ten as ten_nhan_vien FROM phieu_nhap pn
                            LEFT JOIN nhan_vien nv ON pn.nhan_vien_id = nv.id
                            WHERE pn.ma_phieu LIKE @s OR pn.nha_cung_cap LIKE @s OR nv.ho_ten LIKE @s
                            ORDER BY pn.ngay_tao DESC`);
                phieuNhaps = result.recordset;
            }
        }

        res.render('tim-kiem/index', {
            layout: 'layouts/main',
            user: req.session.user,
            currentPage: 'tim-kiem',
            pageTitle: 'Tìm kiếm',
            messages: req.flash(),
            keyword,
            loai,
            sanPhams,
            khachHangs,
            donHangs,
            nhanViens,
            danhMucs,
            taiKhoans,
            maGiamGias,
            lienHes,
            phieuNhaps
        });
    } catch (error) {
        console.error('Loi tim kiem:', error);
        req.flash('error', 'Có lỗi xảy ra khi tìm kiếm');
        res.redirect('/dashboard');
    }
});

module.exports = router;
