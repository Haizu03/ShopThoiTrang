const express = require('express');
const router = express.Router();
const { sql, getPool } = require('../config/database');

// Danh sach khach hang
router.get('/', async (req, res) => {
    try {
        const page = parseInt(req.query.page) || 1;
        const limit = 10;
        const offset = (page - 1) * limit;
        const search = req.query.search || '';

        const pool = await getPool();
        let whereClause = 'WHERE 1=1';
        const countReq = pool.request();
        const listReq = pool.request();

        if (search) {
            whereClause += ' AND (kh.ho_ten LIKE @search1 OR kh.so_dien_thoai LIKE @search2 OR kh.email LIKE @search3)';
            const searchVal = '%' + search + '%';
            countReq.input('search1', sql.NVarChar, searchVal);
            countReq.input('search2', sql.NVarChar, searchVal);
            countReq.input('search3', sql.NVarChar, searchVal);
            listReq.input('search1', sql.NVarChar, searchVal);
            listReq.input('search2', sql.NVarChar, searchVal);
            listReq.input('search3', sql.NVarChar, searchVal);
        }

        const countResult = await countReq.query(`SELECT COUNT(*) as total FROM khach_hang kh ${whereClause}`);
        const total = countResult.recordset[0].total;

        listReq.input('offset', sql.Int, offset);
        listReq.input('limit', sql.Int, limit);
        const listResult = await listReq.query(`
            SELECT kh.*, COUNT(dh.id) as so_don, COALESCE(SUM(dh.thanh_toan), 0) as tong_chi
            FROM khach_hang kh
            LEFT JOIN don_hang dh ON kh.id = dh.khach_hang_id AND dh.trang_thai = 'da_giao'
            ${whereClause}
            GROUP BY kh.id, kh.ho_ten, kh.so_dien_thoai, kh.email, kh.dia_chi, kh.gioi_tinh, kh.ngay_tao
            ORDER BY kh.ngay_tao DESC
            OFFSET @offset ROWS FETCH NEXT @limit ROWS ONLY
        `);

        res.render('khach-hang/index', {
            layout: 'layouts/main',
            user: req.session.user,
            currentPage: 'khach-hang',
            pageTitle: 'Quan ly khach hang',
            messages: req.flash(),
            khachHangs: listResult.recordset,
            totalPages: Math.ceil(total / limit),
            currentPageNum: page,
            queryString: `&search=${search}`,
            search
        });
    } catch (error) {
        console.error('Loi:', error);
        req.flash('error', 'Co loi xay ra');
        res.redirect('/dashboard');
    }
});

// Form them khach hang
router.get('/them', (req, res) => {
    res.render('khach-hang/form', {
        layout: 'layouts/main',
        user: req.session.user,
        currentPage: 'khach-hang',
        pageTitle: 'Them khach hang',
        messages: req.flash(),
        khachHang: null
    });
});

// Xu ly them khach hang
router.post('/them', async (req, res) => {
    try {
        const { ho_ten, so_dien_thoai, email, dia_chi, gioi_tinh } = req.body;
        const pool = await getPool();
        await pool.request()
            .input('ho_ten', sql.NVarChar, ho_ten)
            .input('so_dien_thoai', sql.NVarChar, so_dien_thoai)
            .input('email', sql.NVarChar, email)
            .input('dia_chi', sql.NVarChar, dia_chi)
            .input('gioi_tinh', sql.NVarChar, gioi_tinh)
            .query('INSERT INTO khach_hang (ho_ten, so_dien_thoai, email, dia_chi, gioi_tinh) VALUES (@ho_ten, @so_dien_thoai, @email, @dia_chi, @gioi_tinh)');
        req.flash('success', 'Them khach hang thanh cong');
        res.redirect('/khach-hang');
    } catch (error) {
        console.error('Loi:', error);
        req.flash('error', 'Co loi xay ra');
        res.redirect('/khach-hang/them');
    }
});

// Form sua khach hang
router.get('/sua/:id', async (req, res) => {
    try {
        const pool = await getPool();
        const result = await pool.request()
            .input('id', sql.Int, req.params.id)
            .query('SELECT * FROM khach_hang WHERE id = @id');
        if (result.recordset.length === 0) {
            req.flash('error', 'Khong tim thay khach hang');
            return res.redirect('/khach-hang');
        }
        res.render('khach-hang/form', {
            layout: 'layouts/main',
            user: req.session.user,
            currentPage: 'khach-hang',
            pageTitle: 'Sua khach hang',
            messages: req.flash(),
            khachHang: result.recordset[0]
        });
    } catch (error) {
        console.error('Loi:', error);
        req.flash('error', 'Co loi xay ra');
        res.redirect('/khach-hang');
    }
});

// Xu ly sua khach hang
router.post('/sua/:id', async (req, res) => {
    try {
        const { ho_ten, so_dien_thoai, email, dia_chi, gioi_tinh } = req.body;
        const pool = await getPool();
        await pool.request()
            .input('ho_ten', sql.NVarChar, ho_ten)
            .input('so_dien_thoai', sql.NVarChar, so_dien_thoai)
            .input('email', sql.NVarChar, email)
            .input('dia_chi', sql.NVarChar, dia_chi)
            .input('gioi_tinh', sql.NVarChar, gioi_tinh)
            .input('id', sql.Int, req.params.id)
            .query('UPDATE khach_hang SET ho_ten=@ho_ten, so_dien_thoai=@so_dien_thoai, email=@email, dia_chi=@dia_chi, gioi_tinh=@gioi_tinh WHERE id=@id');
        req.flash('success', 'Cap nhat khach hang thanh cong');
        res.redirect('/khach-hang');
    } catch (error) {
        console.error('Loi:', error);
        req.flash('error', 'Co loi xay ra');
        res.redirect('/khach-hang/sua/' + req.params.id);
    }
});

// Xoa khach hang
router.get('/xoa/:id', async (req, res) => {
    try {
        const pool = await getPool();
        await pool.request()
            .input('id', sql.Int, req.params.id)
            .query('DELETE FROM khach_hang WHERE id = @id');
        req.flash('success', 'Xoa khach hang thanh cong');
    } catch (error) {
        console.error('Loi:', error);
        req.flash('error', 'Khong the xoa khach hang (co don hang lien quan)');
    }
    res.redirect('/khach-hang');
});

module.exports = router;
