const express = require('express');
const router = express.Router();
const { sql, getPool } = require('../config/database');

// Admin: Danh sach lien he
router.get('/', async (req, res) => {
    try {
        const pool = await getPool();
        const trangThai = req.query.trang_thai || '';
        let query = 'SELECT * FROM lien_he';
        const request = pool.request();

        if (trangThai) {
            query += ' WHERE trang_thai = @trang_thai';
            request.input('trang_thai', sql.NVarChar, trangThai);
        }
        query += ' ORDER BY ngay_gui DESC';

        const result = await request.query(query);

        // Dem so chua doc
        const countResult = await pool.request()
            .query("SELECT COUNT(*) as chua_doc FROM lien_he WHERE trang_thai = 'chua_doc'");

        res.render('lien-he/index', {
            layout: 'layouts/main',
            user: req.session.user,
            currentPage: 'lien-he',
            pageTitle: 'Liên hệ',
            messages: req.flash(),
            danhSach: result.recordset,
            trangThai,
            chuaDoc: countResult.recordset[0].chua_doc
        });
    } catch (error) {
        console.error('Loi lien he:', error);
        req.flash('error', 'Có lỗi xảy ra');
        res.redirect('/dashboard');
    }
});

// Admin: Chi tiet & phan hoi
router.get('/:id', async (req, res) => {
    try {
        const pool = await getPool();
        const result = await pool.request()
            .input('id', sql.Int, req.params.id)
            .query('SELECT * FROM lien_he WHERE id = @id');

        if (result.recordset.length === 0) {
            req.flash('error', 'Không tìm thấy liên hệ');
            return res.redirect('/lien-he');
        }

        // Danh dau da doc
        if (result.recordset[0].trang_thai === 'chua_doc') {
            await pool.request()
                .input('id', sql.Int, req.params.id)
                .query("UPDATE lien_he SET trang_thai = 'da_doc' WHERE id = @id");
            result.recordset[0].trang_thai = 'da_doc';
        }

        res.render('lien-he/detail', {
            layout: 'layouts/main',
            user: req.session.user,
            currentPage: 'lien-he',
            pageTitle: 'Chi tiết liên hệ',
            messages: req.flash(),
            lienHe: result.recordset[0]
        });
    } catch (error) {
        console.error('Loi chi tiet lien he:', error);
        req.flash('error', 'Có lỗi xảy ra');
        res.redirect('/lien-he');
    }
});

// Admin: Phan hoi
router.post('/phan-hoi/:id', async (req, res) => {
    try {
        const { phan_hoi } = req.body;
        const pool = await getPool();

        await pool.request()
            .input('id', sql.Int, req.params.id)
            .input('phan_hoi', sql.NVarChar(sql.MAX), phan_hoi)
            .query("UPDATE lien_he SET phan_hoi = @phan_hoi, trang_thai = 'da_phan_hoi', ngay_phan_hoi = GETDATE() WHERE id = @id");

        req.flash('success', 'Đã phản hồi thành công');
        res.redirect('/lien-he/' + req.params.id);
    } catch (error) {
        console.error('Loi phan hoi:', error);
        req.flash('error', 'Có lỗi xảy ra');
        res.redirect('/lien-he/' + req.params.id);
    }
});

// Admin: Xoa
router.get('/xoa/:id', async (req, res) => {
    try {
        const pool = await getPool();
        await pool.request()
            .input('id', sql.Int, req.params.id)
            .query('DELETE FROM lien_he WHERE id = @id');
        req.flash('success', 'Đã xóa liên hệ');
    } catch (error) {
        console.error('Loi xoa lien he:', error);
        req.flash('error', 'Có lỗi xảy ra');
    }
    res.redirect('/lien-he');
});

module.exports = router;
