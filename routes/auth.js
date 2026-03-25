const express = require('express');
const router = express.Router();
const bcrypt = require('bcryptjs');
const { sql, getPool } = require('../config/database');

// Middleware kiem tra dang nhap
function isAuthenticated(req, res, next) {
    if (req.session && req.session.user) {
        return next();
    }
    res.redirect('/dang-nhap');
}

// Middleware kiem tra quyen admin
function isAdmin(req, res, next) {
    if (req.session && req.session.user && req.session.user.vai_tro === 'admin') {
        return next();
    }
    res.redirect('/trang-chu');
}

// GET - Trang dang nhap
router.get('/dang-nhap', (req, res) => {
    if (req.session && req.session.user) {
        if (req.session.user.vai_tro === 'admin') return res.redirect('/dashboard');
        return res.redirect('/trang-chu');
    }
    res.render('auth/login', { 
        layout: 'layouts/main',
        messages: req.flash()
    });
});

// POST - Xu ly dang nhap
router.post('/dang-nhap', async (req, res) => {
    try {
        const { ten_dang_nhap, mat_khau } = req.body;
        
        if (!ten_dang_nhap || !mat_khau) {
            req.flash('error', 'Vui long nhap day du thong tin');
            return res.redirect('/dang-nhap');
        }

        const pool = await getPool();
        const result = await pool.request()
            .input('ten_dang_nhap', sql.NVarChar, ten_dang_nhap)
            .query('SELECT * FROM tai_khoan WHERE ten_dang_nhap = @ten_dang_nhap AND trang_thai = 1');

        if (result.recordset.length === 0) {
            req.flash('error', 'Ten dang nhap hoac mat khau khong dung');
            return res.redirect('/dang-nhap');
        }

        const user = result.recordset[0];
        const isMatch = await bcrypt.compare(mat_khau, user.mat_khau);

        if (!isMatch) {
            req.flash('error', 'Ten dang nhap hoac mat khau khong dung');
            return res.redirect('/dang-nhap');
        }

        req.session.user = {
            id: user.id,
            ten_dang_nhap: user.ten_dang_nhap,
            ho_ten: user.ho_ten,
            vai_tro: user.vai_tro
        };

        if (user.vai_tro === 'admin') {
            res.redirect('/dashboard');
        } else {
            res.redirect('/trang-chu');
        }
    } catch (error) {
        console.error('Loi dang nhap:', error);
        req.flash('error', 'Co loi xay ra, vui long thu lai');
        res.redirect('/dang-nhap');
    }
});

// GET - Dang xuat
router.get('/dang-xuat', (req, res) => {
    req.session.destroy();
    res.redirect('/dang-nhap');
});

// GET - Trang dang ky
router.get('/dang-ky', (req, res) => {
    if (req.session && req.session.user) {
        if (req.session.user.vai_tro === 'admin') return res.redirect('/dashboard');
        return res.redirect('/trang-chu');
    }
    res.render('auth/register', {
        layout: 'layouts/main',
        messages: req.flash()
    });
});

// POST - Xu ly dang ky
router.post('/dang-ky', async (req, res) => {
    try {
        const { ho_ten, ten_dang_nhap, mat_khau, xac_nhan } = req.body;

        if (!ho_ten || !ten_dang_nhap || !mat_khau) {
            req.flash('error', 'Vui long nhap day du thong tin');
            return res.redirect('/dang-ky');
        }

        if (mat_khau.length < 6) {
            req.flash('error', 'Mat khau phai co it nhat 6 ky tu');
            return res.redirect('/dang-ky');
        }

        if (mat_khau !== xac_nhan) {
            req.flash('error', 'Mat khau xac nhan khong khop');
            return res.redirect('/dang-ky');
        }

        const pool = await getPool();

        // Kiem tra ten dang nhap da ton tai chua
        const checkResult = await pool.request()
            .input('ten_dang_nhap', sql.NVarChar, ten_dang_nhap)
            .query('SELECT id FROM tai_khoan WHERE ten_dang_nhap = @ten_dang_nhap');

        if (checkResult.recordset.length > 0) {
            req.flash('error', 'Ten dang nhap da ton tai');
            return res.redirect('/dang-ky');
        }

        const hashedPassword = await bcrypt.hash(mat_khau, 10);
        await pool.request()
            .input('ten_dang_nhap', sql.NVarChar, ten_dang_nhap)
            .input('mat_khau', sql.NVarChar, hashedPassword)
            .input('ho_ten', sql.NVarChar, ho_ten)
            .input('vai_tro', sql.NVarChar, 'nguoidung')
            .query('INSERT INTO tai_khoan (ten_dang_nhap, mat_khau, ho_ten, vai_tro) VALUES (@ten_dang_nhap, @mat_khau, @ho_ten, @vai_tro)');

        req.flash('success', 'Dang ky thanh cong! Vui long dang nhap.');
        res.redirect('/dang-nhap');
    } catch (error) {
        console.error('Loi dang ky:', error);
        req.flash('error', 'Co loi xay ra, vui long thu lai');
        res.redirect('/dang-ky');
    }
});

// GET - Doi mat khau
router.get('/doi-mat-khau', isAuthenticated, (req, res) => {
    const layoutName = req.session.user.vai_tro === 'admin' ? 'layouts/main' : 'layouts/user';
    res.render('auth/change-password', {
        layout: layoutName,
        user: req.session.user,
        currentPage: '',
        pageTitle: 'Doi mat khau',
        messages: req.flash()
    });
});

// POST - Xu ly doi mat khau
router.post('/doi-mat-khau', isAuthenticated, async (req, res) => {
    try {
        const { mat_khau_cu, mat_khau_moi, xac_nhan } = req.body;

        if (mat_khau_moi !== xac_nhan) {
            req.flash('error', 'Mat khau moi khong khop');
            return res.redirect('/doi-mat-khau');
        }

        const pool = await getPool();
        const result = await pool.request()
            .input('id', sql.Int, req.session.user.id)
            .query('SELECT * FROM tai_khoan WHERE id = @id');
        const isMatch = await bcrypt.compare(mat_khau_cu, result.recordset[0].mat_khau);

        if (!isMatch) {
            req.flash('error', 'Mat khau cu khong dung');
            return res.redirect('/doi-mat-khau');
        }

        const hashedPassword = await bcrypt.hash(mat_khau_moi, 10);
        await pool.request()
            .input('mat_khau', sql.NVarChar, hashedPassword)
            .input('id', sql.Int, req.session.user.id)
            .query('UPDATE tai_khoan SET mat_khau = @mat_khau WHERE id = @id');

        req.flash('success', 'Doi mat khau thanh cong');
        res.redirect('/doi-mat-khau');
    } catch (error) {
        console.error('Loi doi mat khau:', error);
        req.flash('error', 'Co loi xay ra');
        res.redirect('/doi-mat-khau');
    }
});

module.exports = { router, isAuthenticated, isAdmin };
