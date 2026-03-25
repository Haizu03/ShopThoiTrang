const express = require('express');
const router = express.Router();
const { sql, getPool } = require('../config/database');

// Danh sach ma giam gia
router.get('/', async (req, res) => {
    try {
        const pool = await getPool();
        const result = await pool.request()
            .query('SELECT * FROM ma_giam_gia ORDER BY ngay_tao DESC');

        res.render('ma-giam-gia/index', {
            layout: 'layouts/main',
            user: req.session.user,
            currentPage: 'ma-giam-gia',
            pageTitle: 'Mã giảm giá',
            messages: req.flash(),
            danhSach: result.recordset
        });
    } catch (error) {
        console.error('Loi ma giam gia:', error);
        req.flash('error', 'Có lỗi xảy ra');
        res.redirect('/dashboard');
    }
});

// Tao moi - form
router.get('/tao', (req, res) => {
    res.render('ma-giam-gia/form', {
        layout: 'layouts/main',
        user: req.session.user,
        currentPage: 'ma-giam-gia',
        pageTitle: 'Tạo mã giảm giá',
        messages: req.flash(),
        maGiamGia: null
    });
});

// Tao moi - xu ly
router.post('/tao', async (req, res) => {
    try {
        const { ma_code, mo_ta, loai_giam, gia_tri, don_toi_thieu, so_luong, ngay_bat_dau, ngay_ket_thuc } = req.body;
        const pool = await getPool();

        // Kiem tra ma da ton tai
        const check = await pool.request()
            .input('ma_code', sql.NVarChar, ma_code.toUpperCase().trim())
            .query('SELECT id FROM ma_giam_gia WHERE ma_code = @ma_code');
        if (check.recordset.length > 0) {
            req.flash('error', 'Mã giảm giá đã tồn tại');
            return res.redirect('/ma-giam-gia/tao');
        }

        await pool.request()
            .input('ma_code', sql.NVarChar, ma_code.toUpperCase().trim())
            .input('mo_ta', sql.NVarChar, mo_ta || null)
            .input('loai_giam', sql.NVarChar, loai_giam)
            .input('gia_tri', sql.Decimal(15,2), parseFloat(gia_tri))
            .input('don_toi_thieu', sql.Decimal(15,2), parseFloat(don_toi_thieu) || 0)
            .input('so_luong', sql.Int, parseInt(so_luong) || 1)
            .input('ngay_bat_dau', sql.DateTime, ngay_bat_dau || new Date())
            .input('ngay_ket_thuc', sql.DateTime, ngay_ket_thuc || null)
            .query(`INSERT INTO ma_giam_gia (ma_code, mo_ta, loai_giam, gia_tri, don_toi_thieu, so_luong, ngay_bat_dau, ngay_ket_thuc)
                VALUES (@ma_code, @mo_ta, @loai_giam, @gia_tri, @don_toi_thieu, @so_luong, @ngay_bat_dau, @ngay_ket_thuc)`);

        req.flash('success', 'Tạo mã giảm giá thành công');
        res.redirect('/ma-giam-gia');
    } catch (error) {
        console.error('Loi tao ma giam gia:', error);
        req.flash('error', 'Có lỗi xảy ra');
        res.redirect('/ma-giam-gia/tao');
    }
});

// Sua - form
router.get('/sua/:id', async (req, res) => {
    try {
        const pool = await getPool();
        const result = await pool.request()
            .input('id', sql.Int, req.params.id)
            .query('SELECT * FROM ma_giam_gia WHERE id = @id');

        if (result.recordset.length === 0) {
            req.flash('error', 'Không tìm thấy mã giảm giá');
            return res.redirect('/ma-giam-gia');
        }

        res.render('ma-giam-gia/form', {
            layout: 'layouts/main',
            user: req.session.user,
            currentPage: 'ma-giam-gia',
            pageTitle: 'Sửa mã giảm giá',
            messages: req.flash(),
            maGiamGia: result.recordset[0]
        });
    } catch (error) {
        console.error('Loi sua ma giam gia:', error);
        req.flash('error', 'Có lỗi xảy ra');
        res.redirect('/ma-giam-gia');
    }
});

// Sua - xu ly
router.post('/sua/:id', async (req, res) => {
    try {
        const { ma_code, mo_ta, loai_giam, gia_tri, don_toi_thieu, so_luong, ngay_bat_dau, ngay_ket_thuc, trang_thai } = req.body;
        const pool = await getPool();

        await pool.request()
            .input('id', sql.Int, req.params.id)
            .input('ma_code', sql.NVarChar, ma_code.toUpperCase().trim())
            .input('mo_ta', sql.NVarChar, mo_ta || null)
            .input('loai_giam', sql.NVarChar, loai_giam)
            .input('gia_tri', sql.Decimal(15,2), parseFloat(gia_tri))
            .input('don_toi_thieu', sql.Decimal(15,2), parseFloat(don_toi_thieu) || 0)
            .input('so_luong', sql.Int, parseInt(so_luong) || 1)
            .input('ngay_bat_dau', sql.DateTime, ngay_bat_dau || new Date())
            .input('ngay_ket_thuc', sql.DateTime, ngay_ket_thuc || null)
            .input('trang_thai', sql.Bit, trang_thai === 'on' || trang_thai === '1' ? 1 : 0)
            .query(`UPDATE ma_giam_gia SET ma_code = @ma_code, mo_ta = @mo_ta, loai_giam = @loai_giam, gia_tri = @gia_tri,
                don_toi_thieu = @don_toi_thieu, so_luong = @so_luong, ngay_bat_dau = @ngay_bat_dau, ngay_ket_thuc = @ngay_ket_thuc,
                trang_thai = @trang_thai WHERE id = @id`);

        req.flash('success', 'Cập nhật mã giảm giá thành công');
        res.redirect('/ma-giam-gia');
    } catch (error) {
        console.error('Loi cap nhat ma giam gia:', error);
        req.flash('error', 'Có lỗi xảy ra');
        res.redirect('/ma-giam-gia/sua/' + req.params.id);
    }
});

// Xoa
router.get('/xoa/:id', async (req, res) => {
    try {
        const pool = await getPool();
        await pool.request()
            .input('id', sql.Int, req.params.id)
            .query('DELETE FROM ma_giam_gia WHERE id = @id');
        req.flash('success', 'Đã xóa mã giảm giá');
    } catch (error) {
        console.error('Loi xoa ma giam gia:', error);
        req.flash('error', 'Có lỗi xảy ra');
    }
    res.redirect('/ma-giam-gia');
});

module.exports = router;
