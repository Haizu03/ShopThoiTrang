const express = require('express');
const router = express.Router();
const { sql, getPool } = require('../config/database');
const multer = require('multer');
const path = require('path');

const storage = multer.diskStorage({
    destination: (req, file, cb) => cb(null, 'public/uploads/'),
    filename: (req, file, cb) => {
        const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
        cb(null, uniqueSuffix + path.extname(file.originalname));
    }
});

const fileFilter = (req, file, cb) => {
    const allowedTypes = /jpeg|jpg|png|gif|webp/;
    const extname = allowedTypes.test(path.extname(file.originalname).toLowerCase());
    const mimetype = allowedTypes.test(file.mimetype);
    if (extname && mimetype) {
        cb(null, true);
    } else {
        cb(new Error('Chi chap nhan file anh (jpg, png, gif, webp)'));
    }
};

const upload = multer({ storage, fileFilter, limits: { fileSize: 5 * 1024 * 1024 } });

// Danh sach san pham
router.get('/', async (req, res) => {
    try {
        const page = parseInt(req.query.page) || 1;
        const limit = 10;
        const offset = (page - 1) * limit;
        const search = req.query.search || '';
        const danhMucId = req.query.danh_muc || '';

        const pool = await getPool();

        let whereClause = 'WHERE sp.trang_thai = 1';
        const countReq = pool.request();
        const listReq = pool.request();
        let paramIdx = 0;

        if (search) {
            whereClause += ' AND (sp.ten_sp LIKE @search1 OR sp.ma_sp LIKE @search2)';
            const searchVal = '%' + search + '%';
            countReq.input('search1', sql.NVarChar, searchVal);
            countReq.input('search2', sql.NVarChar, searchVal);
            listReq.input('search1', sql.NVarChar, searchVal);
            listReq.input('search2', sql.NVarChar, searchVal);
        }
        if (danhMucId) {
            whereClause += ' AND sp.danh_muc_id = @danhMucId';
            countReq.input('danhMucId', sql.Int, parseInt(danhMucId));
            listReq.input('danhMucId', sql.Int, parseInt(danhMucId));
        }

        const countResult = await countReq.query(`SELECT COUNT(*) as total FROM san_pham sp ${whereClause}`);
        const total = countResult.recordset[0].total;

        listReq.input('offset', sql.Int, offset);
        listReq.input('limit', sql.Int, limit);
        const listResult = await listReq.query(`
            SELECT sp.*, dm.ten_danh_muc
            FROM san_pham sp
            LEFT JOIN danh_muc dm ON sp.danh_muc_id = dm.id
            ${whereClause}
            ORDER BY sp.ngay_tao DESC
            OFFSET @offset ROWS FETCH NEXT @limit ROWS ONLY
        `);

        const dmResult = await pool.request().query('SELECT * FROM danh_muc WHERE trang_thai = 1');

        res.render('san-pham/index', {
            layout: 'layouts/main',
            user: req.session.user,
            currentPage: 'san-pham',
            pageTitle: 'Quan ly san pham',
            messages: req.flash(),
            sanPhams: listResult.recordset,
            danhMucs: dmResult.recordset,
            totalPages: Math.ceil(total / limit),
            currentPageNum: page,
            queryString: `&search=${search}&danh_muc=${danhMucId}`,
            search,
            danhMucId
        });
    } catch (error) {
        console.error('Loi danh sach SP:', error);
        req.flash('error', 'Co loi xay ra');
        res.redirect('/dashboard');
    }
});

// Form them san pham
router.get('/them', async (req, res) => {
    try {
        const pool = await getPool();
        const dmResult = await pool.request().query('SELECT * FROM danh_muc WHERE trang_thai = 1');
        res.render('san-pham/form', {
            layout: 'layouts/main',
            user: req.session.user,
            currentPage: 'san-pham',
            pageTitle: 'Them san pham',
            messages: req.flash(),
            sanPham: null,
            danhMucs: dmResult.recordset
        });
    } catch (error) {
        console.error('Loi:', error);
        req.flash('error', 'Co loi xay ra');
        res.redirect('/san-pham');
    }
});

// Xu ly them san pham
router.post('/them', upload.single('hinh_anh'), async (req, res) => {
    try {
        const { ma_sp, ten_sp, danh_muc_id, gia_nhap, gia_ban, so_luong, kich_thuoc, mau_sac, chat_lieu, mo_ta, gioi_tinh } = req.body;
        const hinh_anh = req.file ? '/uploads/' + req.file.filename : null;

        const pool = await getPool();
        await pool.request()
            .input('ma_sp', sql.NVarChar, ma_sp)
            .input('ten_sp', sql.NVarChar, ten_sp)
            .input('danh_muc_id', sql.Int, danh_muc_id || null)
            .input('gia_nhap', sql.Decimal(15,2), gia_nhap || 0)
            .input('gia_ban', sql.Decimal(15,2), gia_ban || 0)
            .input('so_luong', sql.Int, so_luong || 0)
            .input('kich_thuoc', sql.NVarChar, kich_thuoc)
            .input('mau_sac', sql.NVarChar, mau_sac)
            .input('chat_lieu', sql.NVarChar, chat_lieu)
            .input('hinh_anh', sql.NVarChar, hinh_anh)
            .input('mo_ta', sql.NVarChar(sql.MAX), mo_ta)
            .input('gioi_tinh', sql.NVarChar, gioi_tinh || 'Unisex')
            .query(`INSERT INTO san_pham (ma_sp, ten_sp, danh_muc_id, gia_nhap, gia_ban, so_luong, kich_thuoc, mau_sac, chat_lieu, hinh_anh, mo_ta, gioi_tinh)
                    VALUES (@ma_sp, @ten_sp, @danh_muc_id, @gia_nhap, @gia_ban, @so_luong, @kich_thuoc, @mau_sac, @chat_lieu, @hinh_anh, @mo_ta, @gioi_tinh)`);

        req.flash('success', 'Them san pham thanh cong');
        res.redirect('/san-pham');
    } catch (error) {
        console.error('Loi them SP:', error);
        if (error.number === 2627 || error.number === 2601) {
            req.flash('error', 'Ma san pham da ton tai');
        } else {
            req.flash('error', 'Co loi xay ra khi them san pham');
        }
        res.redirect('/san-pham/them');
    }
});

// Form sua san pham
router.get('/sua/:id', async (req, res) => {
    try {
        const pool = await getPool();
        const result = await pool.request()
            .input('id', sql.Int, req.params.id)
            .query('SELECT * FROM san_pham WHERE id = @id');
        if (result.recordset.length === 0) {
            req.flash('error', 'Khong tim thay san pham');
            return res.redirect('/san-pham');
        }
        const dmResult = await pool.request().query('SELECT * FROM danh_muc WHERE trang_thai = 1');

        res.render('san-pham/form', {
            layout: 'layouts/main',
            user: req.session.user,
            currentPage: 'san-pham',
            pageTitle: 'Sua san pham',
            messages: req.flash(),
            sanPham: result.recordset[0],
            danhMucs: dmResult.recordset
        });
    } catch (error) {
        console.error('Loi:', error);
        req.flash('error', 'Co loi xay ra');
        res.redirect('/san-pham');
    }
});

// Xu ly sua san pham
router.post('/sua/:id', upload.single('hinh_anh'), async (req, res) => {
    try {
        const { ma_sp, ten_sp, danh_muc_id, gia_nhap, gia_ban, so_luong, kich_thuoc, mau_sac, chat_lieu, mo_ta, gioi_tinh } = req.body;
        const pool = await getPool();
        const request = pool.request()
            .input('ma_sp', sql.NVarChar, ma_sp)
            .input('ten_sp', sql.NVarChar, ten_sp)
            .input('danh_muc_id', sql.Int, danh_muc_id || null)
            .input('gia_nhap', sql.Decimal(15,2), gia_nhap || 0)
            .input('gia_ban', sql.Decimal(15,2), gia_ban || 0)
            .input('so_luong', sql.Int, so_luong || 0)
            .input('kich_thuoc', sql.NVarChar, kich_thuoc)
            .input('mau_sac', sql.NVarChar, mau_sac)
            .input('chat_lieu', sql.NVarChar, chat_lieu)
            .input('mo_ta', sql.NVarChar(sql.MAX), mo_ta)
            .input('gioi_tinh', sql.NVarChar, gioi_tinh || 'Unisex')
            .input('id', sql.Int, req.params.id);

        let updateSql = 'UPDATE san_pham SET ma_sp=@ma_sp, ten_sp=@ten_sp, danh_muc_id=@danh_muc_id, gia_nhap=@gia_nhap, gia_ban=@gia_ban, so_luong=@so_luong, kich_thuoc=@kich_thuoc, mau_sac=@mau_sac, chat_lieu=@chat_lieu, mo_ta=@mo_ta, gioi_tinh=@gioi_tinh';

        if (req.file) {
            request.input('hinh_anh', sql.NVarChar, '/uploads/' + req.file.filename);
            updateSql += ', hinh_anh=@hinh_anh';
        }

        updateSql += ' WHERE id = @id';
        await request.query(updateSql);

        req.flash('success', 'Cap nhat san pham thanh cong');
        res.redirect('/san-pham');
    } catch (error) {
        console.error('Loi sua SP:', error);
        req.flash('error', 'Co loi xay ra khi cap nhat');
        res.redirect('/san-pham/sua/' + req.params.id);
    }
});

// Xoa san pham (soft delete)
router.get('/xoa/:id', async (req, res) => {
    try {
        const pool = await getPool();
        await pool.request()
            .input('id', sql.Int, req.params.id)
            .query('UPDATE san_pham SET trang_thai = 0 WHERE id = @id');
        req.flash('success', 'Xoa san pham thanh cong');
    } catch (error) {
        console.error('Loi xoa SP:', error);
        req.flash('error', 'Co loi xay ra khi xoa');
    }
    res.redirect('/san-pham');
});

// Chi tiet san pham
router.get('/:id', async (req, res) => {
    try {
        const pool = await getPool();
        const result = await pool.request()
            .input('id', sql.Int, req.params.id)
            .query(`SELECT sp.*, dm.ten_danh_muc FROM san_pham sp LEFT JOIN danh_muc dm ON sp.danh_muc_id = dm.id WHERE sp.id = @id`);

        if (result.recordset.length === 0) {
            req.flash('error', 'Khong tim thay san pham');
            return res.redirect('/san-pham');
        }

        res.render('san-pham/detail', {
            layout: 'layouts/main',
            user: req.session.user,
            currentPage: 'san-pham',
            pageTitle: 'Chi tiet san pham',
            messages: req.flash(),
            sanPham: result.recordset[0]
        });
    } catch (error) {
        console.error('Loi:', error);
        req.flash('error', 'Co loi xay ra');
        res.redirect('/san-pham');
    }
});

module.exports = router;
