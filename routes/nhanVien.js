const express = require('express');
const router = express.Router();
const { sql, getPool } = require('../config/database');
const bcrypt = require('bcryptjs');

// Danh sach nhan vien
router.get('/', async (req, res) => {
    try {
        const search = req.query.search || '';
        const pool = await getPool();
        let whereClause = 'WHERE nv.trang_thai = 1';
        const request = pool.request();

        if (search) {
            whereClause += ' AND (nv.ho_ten LIKE @search1 OR nv.ma_nv LIKE @search2 OR nv.so_dien_thoai LIKE @search3)';
            const searchVal = '%' + search + '%';
            request.input('search1', sql.NVarChar, searchVal);
            request.input('search2', sql.NVarChar, searchVal);
            request.input('search3', sql.NVarChar, searchVal);
        }

        const result = await request.query(`
            SELECT nv.*, tk.ten_dang_nhap
            FROM nhan_vien nv
            LEFT JOIN tai_khoan tk ON nv.tai_khoan_id = tk.id
            ${whereClause}
            ORDER BY nv.ngay_tao DESC
        `);

        res.render('nhan-vien/index', {
            layout: 'layouts/main',
            user: req.session.user,
            currentPage: 'nhan-vien',
            pageTitle: 'Quan ly nhan vien',
            messages: req.flash(),
            nhanViens: result.recordset,
            search
        });
    } catch (error) {
        console.error('Loi:', error);
        req.flash('error', 'Co loi xay ra');
        res.redirect('/dashboard');
    }
});

// Form them nhan vien
router.get('/them', (req, res) => {
    res.render('nhan-vien/form', {
        layout: 'layouts/main',
        user: req.session.user,
        currentPage: 'nhan-vien',
        pageTitle: 'Them nhan vien',
        messages: req.flash(),
        nhanVien: null
    });
});

// Xu ly them nhan vien
router.post('/them', async (req, res) => {
    const pool = await getPool();
    const transaction = new sql.Transaction(pool);
    try {
        await transaction.begin();
        const { ma_nv, ho_ten, so_dien_thoai, email, dia_chi, gioi_tinh, chuc_vu, luong, ngay_vao_lam, ten_dang_nhap, mat_khau } = req.body;

        let taiKhoanId = null;

        if (ten_dang_nhap && mat_khau) {
            const hashedPassword = await bcrypt.hash(mat_khau, 10);
            const tkResult = await new sql.Request(transaction)
                .input('ten_dang_nhap', sql.NVarChar, ten_dang_nhap)
                .input('mat_khau', sql.NVarChar, hashedPassword)
                .input('ho_ten', sql.NVarChar, ho_ten)
                .input('vai_tro', sql.NVarChar, 'nhanvien')
                .query('INSERT INTO tai_khoan (ten_dang_nhap, mat_khau, ho_ten, vai_tro) OUTPUT INSERTED.id VALUES (@ten_dang_nhap, @mat_khau, @ho_ten, @vai_tro)');
            taiKhoanId = tkResult.recordset[0].id;
        }

        await new sql.Request(transaction)
            .input('ma_nv', sql.NVarChar, ma_nv)
            .input('ho_ten', sql.NVarChar, ho_ten)
            .input('so_dien_thoai', sql.NVarChar, so_dien_thoai)
            .input('email', sql.NVarChar, email)
            .input('dia_chi', sql.NVarChar, dia_chi)
            .input('gioi_tinh', sql.NVarChar, gioi_tinh)
            .input('chuc_vu', sql.NVarChar, chuc_vu)
            .input('luong', sql.Decimal(15,2), luong || 0)
            .input('ngay_vao_lam', sql.Date, ngay_vao_lam || null)
            .input('tai_khoan_id', sql.Int, taiKhoanId)
            .query('INSERT INTO nhan_vien (ma_nv, ho_ten, so_dien_thoai, email, dia_chi, gioi_tinh, chuc_vu, luong, ngay_vao_lam, tai_khoan_id) VALUES (@ma_nv, @ho_ten, @so_dien_thoai, @email, @dia_chi, @gioi_tinh, @chuc_vu, @luong, @ngay_vao_lam, @tai_khoan_id)');

        await transaction.commit();
        req.flash('success', 'Them nhan vien thanh cong');
        res.redirect('/nhan-vien');
    } catch (error) {
        try { await transaction.rollback(); } catch(e) {}
        console.error('Loi:', error);
        if (error.number === 2627 || error.number === 2601) {
            req.flash('error', 'Ma nhan vien hoac ten dang nhap da ton tai');
        } else {
            req.flash('error', 'Co loi xay ra');
        }
        res.redirect('/nhan-vien/them');
    }
});

// Form sua nhan vien
router.get('/sua/:id', async (req, res) => {
    try {
        const pool = await getPool();
        const result = await pool.request()
            .input('id', sql.Int, req.params.id)
            .query('SELECT * FROM nhan_vien WHERE id = @id');
        if (result.recordset.length === 0) {
            req.flash('error', 'Khong tim thay nhan vien');
            return res.redirect('/nhan-vien');
        }
        res.render('nhan-vien/form', {
            layout: 'layouts/main',
            user: req.session.user,
            currentPage: 'nhan-vien',
            pageTitle: 'Sua nhan vien',
            messages: req.flash(),
            nhanVien: result.recordset[0]
        });
    } catch (error) {
        console.error('Loi:', error);
        req.flash('error', 'Co loi xay ra');
        res.redirect('/nhan-vien');
    }
});

// Xu ly sua nhan vien
router.post('/sua/:id', async (req, res) => {
    try {
        const { ma_nv, ho_ten, so_dien_thoai, email, dia_chi, gioi_tinh, chuc_vu, luong, ngay_vao_lam } = req.body;
        const pool = await getPool();
        await pool.request()
            .input('ma_nv', sql.NVarChar, ma_nv)
            .input('ho_ten', sql.NVarChar, ho_ten)
            .input('so_dien_thoai', sql.NVarChar, so_dien_thoai)
            .input('email', sql.NVarChar, email)
            .input('dia_chi', sql.NVarChar, dia_chi)
            .input('gioi_tinh', sql.NVarChar, gioi_tinh)
            .input('chuc_vu', sql.NVarChar, chuc_vu)
            .input('luong', sql.Decimal(15,2), luong || 0)
            .input('ngay_vao_lam', sql.Date, ngay_vao_lam || null)
            .input('id', sql.Int, req.params.id)
            .query('UPDATE nhan_vien SET ma_nv=@ma_nv, ho_ten=@ho_ten, so_dien_thoai=@so_dien_thoai, email=@email, dia_chi=@dia_chi, gioi_tinh=@gioi_tinh, chuc_vu=@chuc_vu, luong=@luong, ngay_vao_lam=@ngay_vao_lam WHERE id=@id');
        req.flash('success', 'Cap nhat nhan vien thanh cong');
        res.redirect('/nhan-vien');
    } catch (error) {
        console.error('Loi:', error);
        req.flash('error', 'Co loi xay ra');
        res.redirect('/nhan-vien/sua/' + req.params.id);
    }
});

// Xoa nhan vien (soft delete)
router.get('/xoa/:id', async (req, res) => {
    try {
        const pool = await getPool();
        await pool.request()
            .input('id', sql.Int, req.params.id)
            .query('UPDATE nhan_vien SET trang_thai = 0 WHERE id = @id');
        req.flash('success', 'Xoa nhan vien thanh cong');
    } catch (error) {
        console.error('Loi:', error);
        req.flash('error', 'Co loi xay ra');
    }
    res.redirect('/nhan-vien');
});

module.exports = router;
