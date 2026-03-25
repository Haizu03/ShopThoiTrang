const express = require('express');
const router = express.Router();
const { sql, getPool } = require('../config/database');

// Danh sach danh muc
router.get('/', async (req, res) => {
    try {
        const pool = await getPool();
        const result = await pool.request().query(`
            SELECT dm.*, COUNT(sp.id) as so_san_pham
            FROM danh_muc dm
            LEFT JOIN san_pham sp ON dm.id = sp.danh_muc_id AND sp.trang_thai = 1
            WHERE dm.trang_thai = 1
            GROUP BY dm.id, dm.ten_danh_muc, dm.mo_ta, dm.trang_thai, dm.ngay_tao
            ORDER BY dm.ngay_tao DESC
        `);

        res.render('danh-muc/index', {
            layout: 'layouts/main',
            user: req.session.user,
            currentPage: 'danh-muc',
            pageTitle: 'Quan ly danh muc',
            messages: req.flash(),
            danhMucs: result.recordset
        });
    } catch (error) {
        console.error('Loi:', error);
        req.flash('error', 'Co loi xay ra');
        res.redirect('/dashboard');
    }
});

// Them danh muc
router.post('/them', async (req, res) => {
    try {
        const { ten_danh_muc, mo_ta } = req.body;
        const pool = await getPool();
        await pool.request()
            .input('ten_danh_muc', sql.NVarChar, ten_danh_muc)
            .input('mo_ta', sql.NVarChar, mo_ta)
            .query('INSERT INTO danh_muc (ten_danh_muc, mo_ta) VALUES (@ten_danh_muc, @mo_ta)');
        req.flash('success', 'Them danh muc thanh cong');
    } catch (error) {
        console.error('Loi:', error);
        req.flash('error', 'Co loi xay ra khi them danh muc');
    }
    res.redirect('/danh-muc');
});

// Sua danh muc
router.post('/sua/:id', async (req, res) => {
    try {
        const { ten_danh_muc, mo_ta } = req.body;
        const pool = await getPool();
        await pool.request()
            .input('ten_danh_muc', sql.NVarChar, ten_danh_muc)
            .input('mo_ta', sql.NVarChar, mo_ta)
            .input('id', sql.Int, req.params.id)
            .query('UPDATE danh_muc SET ten_danh_muc = @ten_danh_muc, mo_ta = @mo_ta WHERE id = @id');
        req.flash('success', 'Cap nhat danh muc thanh cong');
    } catch (error) {
        console.error('Loi:', error);
        req.flash('error', 'Co loi xay ra khi cap nhat');
    }
    res.redirect('/danh-muc');
});

// Xoa danh muc
router.get('/xoa/:id', async (req, res) => {
    try {
        const pool = await getPool();
        await pool.request()
            .input('id', sql.Int, req.params.id)
            .query('UPDATE danh_muc SET trang_thai = 0 WHERE id = @id');
        req.flash('success', 'Xoa danh muc thanh cong');
    } catch (error) {
        console.error('Loi:', error);
        req.flash('error', 'Co loi xay ra khi xoa');
    }
    res.redirect('/danh-muc');
});

module.exports = router;
