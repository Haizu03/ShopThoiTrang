const express = require('express');
const router = express.Router();
const { sql, getPool } = require('../config/database');
const multer = require('multer');
const path = require('path');
const fs = require('fs');

// Multer cho avatar
const avatarStorage = multer.diskStorage({
    destination: (req, file, cb) => cb(null, 'public/uploads/'),
    filename: (req, file, cb) => {
        cb(null, 'avatar-' + req.session.user.id + '-' + Date.now() + path.extname(file.originalname));
    }
});
const avatarFilter = (req, file, cb) => {
    const allowedTypes = /jpeg|jpg|png|gif|webp/;
    cb(null, allowedTypes.test(path.extname(file.originalname).toLowerCase()) && allowedTypes.test(file.mimetype));
};
const uploadAvatar = multer({ storage: avatarStorage, fileFilter: avatarFilter, limits: { fileSize: 5 * 1024 * 1024 } });

// Helper: lay cai dat
async function getSettings(pool) {
    const result = await pool.request().query('SELECT khoa, gia_tri FROM cai_dat');
    const settings = {};
    result.recordset.forEach(r => { settings[r.khoa] = r.gia_tri; });
    return settings;
}

// Trang chu nguoi dung
router.get('/trang-chu', async (req, res) => {
    try {
        const pool = await getPool();

        // Lay danh muc
        const danhMuc = await pool.request()
            .query('SELECT * FROM danh_muc WHERE trang_thai = 1 ORDER BY ten_danh_muc');

        // Lay san pham moi nhat
        const sanPhamMoi = await pool.request()
            .query(`SELECT TOP 8 sp.*, dm.ten_danh_muc
                FROM san_pham sp
                LEFT JOIN danh_muc dm ON sp.danh_muc_id = dm.id
                WHERE sp.trang_thai = 1 AND sp.so_luong > 0
                ORDER BY sp.ngay_tao DESC`);

        res.render('user/home', {
            layout: 'layouts/user',
            user: req.session.user,
            currentPage: 'trang-chu',
            pageTitle: 'Trang chủ',
            messages: req.flash(),
            danhMuc: danhMuc.recordset,
            sanPhamMoi: sanPhamMoi.recordset
        });
    } catch (error) {
        console.error('Loi trang chu:', error);
        req.flash('error', 'Co loi xay ra');
        res.redirect('/dang-nhap');
    }
});

// Xem san pham theo danh muc
router.get('/cua-hang', async (req, res) => {
    try {
        const pool = await getPool();
        const danhMucId = req.query.danh_muc || '';
        const timKiem = req.query.q || '';
        const gioiTinh = req.query.gioi_tinh || '';
        const page = parseInt(req.query.page) || 1;
        const limit = 12;
        const offset = (page - 1) * limit;

        // Lay danh muc
        const danhMuc = await pool.request()
            .query('SELECT * FROM danh_muc WHERE trang_thai = 1 ORDER BY ten_danh_muc');

        // Lay san pham
        let queryStr = `SELECT sp.*, dm.ten_danh_muc
            FROM san_pham sp
            LEFT JOIN danh_muc dm ON sp.danh_muc_id = dm.id
            WHERE sp.trang_thai = 1 AND sp.so_luong > 0`;
        let countStr = `SELECT COUNT(*) as total FROM san_pham sp WHERE sp.trang_thai = 1 AND sp.so_luong > 0`;

        const request = pool.request();
        const countReq = pool.request();

        if (danhMucId) {
            queryStr += ' AND sp.danh_muc_id = @danh_muc_id';
            countStr += ' AND sp.danh_muc_id = @danh_muc_id';
            request.input('danh_muc_id', sql.Int, danhMucId);
            countReq.input('danh_muc_id', sql.Int, danhMucId);
        }

        if (gioiTinh) {
            queryStr += ' AND sp.gioi_tinh = @gioi_tinh';
            countStr += ' AND sp.gioi_tinh = @gioi_tinh';
            request.input('gioi_tinh', sql.NVarChar, gioiTinh);
            countReq.input('gioi_tinh', sql.NVarChar, gioiTinh);
        }

        if (timKiem) {
            queryStr += ' AND (sp.ten_sp LIKE @tim_kiem OR sp.ma_sp LIKE @tim_kiem)';
            countStr += ' AND (sp.ten_sp LIKE @tim_kiem OR sp.ma_sp LIKE @tim_kiem)';
            request.input('tim_kiem', sql.NVarChar, `%${timKiem}%`);
            countReq.input('tim_kiem', sql.NVarChar, `%${timKiem}%`);
        }

        const countResult = await countReq.query(countStr);
        const totalItems = countResult.recordset[0].total;
        const totalPages = Math.ceil(totalItems / limit);

        queryStr += ' ORDER BY sp.ngay_tao DESC OFFSET @offset ROWS FETCH NEXT @limit ROWS ONLY';
        request.input('offset', sql.Int, offset);
        request.input('limit', sql.Int, limit);

        const sanPham = await request.query(queryStr);

        res.render('user/shop', {
            layout: 'layouts/user',
            user: req.session.user,
            currentPage: 'cua-hang',
            pageTitle: 'Cửa hàng',
            messages: req.flash(),
            danhMuc: danhMuc.recordset,
            sanPham: sanPham.recordset,
            selectedDanhMuc: danhMucId,
            selectedGioiTinh: gioiTinh,
            timKiem: timKiem,
            pagination: { page, totalPages, totalItems }
        });
    } catch (error) {
        console.error('Loi cua hang:', error);
        req.flash('error', 'Co loi xay ra');
        res.redirect('/trang-chu');
    }
});

// Chi tiet san pham
router.get('/san-pham-chi-tiet/:id', async (req, res) => {
    try {
        const pool = await getPool();
        const result = await pool.request()
            .input('id', sql.Int, req.params.id)
            .query(`SELECT sp.*, dm.ten_danh_muc
                FROM san_pham sp
                LEFT JOIN danh_muc dm ON sp.danh_muc_id = dm.id
                WHERE sp.id = @id AND sp.trang_thai = 1`);

        if (result.recordset.length === 0) {
            req.flash('error', 'San pham khong ton tai');
            return res.redirect('/cua-hang');
        }

        // San pham lien quan
        const sp = result.recordset[0];
        const lienQuan = await pool.request()
            .input('danh_muc_id', sql.Int, sp.danh_muc_id)
            .input('id', sql.Int, sp.id)
            .query(`SELECT TOP 4 * FROM san_pham
                WHERE danh_muc_id = @danh_muc_id AND id != @id AND trang_thai = 1 AND so_luong > 0
                ORDER BY ngay_tao DESC`);

        res.render('user/product-detail', {
            layout: 'layouts/user',
            user: req.session.user,
            currentPage: 'cua-hang',
            pageTitle: sp.ten_sp,
            messages: req.flash(),
            sanPham: sp,
            lienQuan: lienQuan.recordset
        });
    } catch (error) {
        console.error('Loi chi tiet san pham:', error);
        req.flash('error', 'Co loi xay ra');
        res.redirect('/cua-hang');
    }
});

// ============================================
// GIO HANG (Session-based)
// ============================================

// Xem gio hang
router.get('/gio-hang', async (req, res) => {
    try {
        const cart = req.session.cart || [];
        let gioHang = [];

        if (cart.length > 0) {
            const pool = await getPool();
            for (const item of cart) {
                const result = await pool.request()
                    .input('id', sql.Int, item.san_pham_id)
                    .query('SELECT id, ten_sp, gia_ban, hinh_anh, kich_thuoc, mau_sac, so_luong FROM san_pham WHERE id = @id AND trang_thai = 1');
                if (result.recordset.length > 0) {
                    const sp = result.recordset[0];
                    gioHang.push({
                        san_pham_id: sp.id,
                        ten_sp: sp.ten_sp,
                        gia_ban: sp.gia_ban,
                        hinh_anh: sp.hinh_anh,
                        kich_thuoc: sp.kich_thuoc,
                        mau_sac: sp.mau_sac,
                        so_luong: Math.min(item.so_luong, sp.so_luong),
                        ton_kho: sp.so_luong
                    });
                }
            }
        }

        res.render('user/cart', {
            layout: 'layouts/user',
            user: req.session.user,
            currentPage: 'gio-hang',
            pageTitle: 'Giỏ hàng',
            messages: req.flash(),
            gioHang
        });
    } catch (error) {
        console.error('Loi gio hang:', error);
        req.flash('error', 'Co loi xay ra');
        res.redirect('/trang-chu');
    }
});

// Them vao gio hang
router.post('/gio-hang/them', (req, res) => {
    const { san_pham_id, so_luong } = req.body;
    const spId = parseInt(san_pham_id);
    const sl = parseInt(so_luong) || 1;

    if (!spId || sl < 1) {
        req.flash('error', 'Thong tin khong hop le');
        return res.redirect('back');
    }

    if (!req.session.cart) req.session.cart = [];

    const existing = req.session.cart.find(item => item.san_pham_id === spId);
    if (existing) {
        existing.so_luong += sl;
    } else {
        req.session.cart.push({ san_pham_id: spId, so_luong: sl });
    }

    req.flash('success', 'Da them san pham vao gio hang');
    res.redirect('/gio-hang');
});

// Cap nhat so luong
router.post('/gio-hang/cap-nhat', (req, res) => {
    const { san_pham_id, so_luong } = req.body;
    const spId = parseInt(san_pham_id);
    const sl = parseInt(so_luong);

    if (!req.session.cart) return res.redirect('/gio-hang');

    if (sl <= 0) {
        req.session.cart = req.session.cart.filter(item => item.san_pham_id !== spId);
    } else {
        const item = req.session.cart.find(item => item.san_pham_id === spId);
        if (item) item.so_luong = sl;
    }

    res.redirect('/gio-hang');
});

// Xoa khoi gio hang
router.post('/gio-hang/xoa/:id', (req, res) => {
    const spId = parseInt(req.params.id);
    if (req.session.cart) {
        req.session.cart = req.session.cart.filter(item => item.san_pham_id !== spId);
    }
    req.flash('success', 'Da xoa san pham khoi gio hang');
    res.redirect('/gio-hang');
});

// ============================================
// DAT HANG
// ============================================

// Trang dat hang
router.get('/dat-hang', async (req, res) => {
    const cart = req.session.cart || [];
    if (cart.length === 0) {
        req.flash('error', 'Gio hang trong, hay them san pham truoc');
        return res.redirect('/gio-hang');
    }

    try {
        const pool = await getPool();
        let gioHang = [];
        for (const item of cart) {
            const result = await pool.request()
                .input('id', sql.Int, item.san_pham_id)
                .query('SELECT id, ten_sp, gia_ban, hinh_anh FROM san_pham WHERE id = @id AND trang_thai = 1');
            if (result.recordset.length > 0) {
                const sp = result.recordset[0];
                gioHang.push({ san_pham_id: sp.id, ten_sp: sp.ten_sp, gia_ban: sp.gia_ban, hinh_anh: sp.hinh_anh, so_luong: item.so_luong });
            }
        }

        // Lay thong tin profile
        const userProfile = await pool.request()
            .input('id', sql.Int, req.session.user.id)
            .query('SELECT email, so_dien_thoai, dia_chi FROM tai_khoan WHERE id = @id');

        // Lay cai dat
        const settings = await getSettings(pool);

        res.render('user/checkout', {
            layout: 'layouts/user',
            user: req.session.user,
            currentPage: 'gio-hang',
            pageTitle: 'Đặt hàng',
            messages: req.flash(),
            gioHang,
            userProfile: userProfile.recordset[0] || {},
            settings
        });
    } catch (error) {
        console.error('Loi dat hang:', error);
        req.flash('error', 'Co loi xay ra');
        res.redirect('/gio-hang');
    }
});

// Xu ly dat hang
router.post('/dat-hang', async (req, res) => {
    const cart = req.session.cart || [];
    if (cart.length === 0) {
        req.flash('error', 'Gio hang trong');
        return res.redirect('/gio-hang');
    }

    const pool = await getPool();
    const transaction = new sql.Transaction(pool);
    try {
        await transaction.begin();
        const { ho_ten, so_dien_thoai, email, dia_chi, ghi_chu, phuong_thuc_tt, ma_giam_gia_id, giam_gia_value } = req.body;

        // Tao ma don hang
        const maxIdResult = await new sql.Request(transaction).query('SELECT ISNULL(MAX(id), 0) as maxId FROM don_hang');
        const maDH = 'DH' + String(maxIdResult.recordset[0].maxId + 1).padStart(3, '0');

        // Tim hoac tao khach hang
        let khachHangId = null;
        if (so_dien_thoai) {
            const existKH = await new sql.Request(transaction)
                .input('sdt', sql.NVarChar, so_dien_thoai)
                .query('SELECT id FROM khach_hang WHERE so_dien_thoai = @sdt');
            if (existKH.recordset.length > 0) {
                khachHangId = existKH.recordset[0].id;
                // Cap nhat thong tin
                await new sql.Request(transaction)
                    .input('id', sql.Int, khachHangId)
                    .input('ho_ten', sql.NVarChar, ho_ten)
                    .input('email', sql.NVarChar, email || null)
                    .input('dia_chi', sql.NVarChar, dia_chi)
                    .query('UPDATE khach_hang SET ho_ten = @ho_ten, email = @email, dia_chi = @dia_chi WHERE id = @id');
            } else {
                const insertKH = await new sql.Request(transaction)
                    .input('ho_ten', sql.NVarChar, ho_ten)
                    .input('sdt', sql.NVarChar, so_dien_thoai)
                    .input('email', sql.NVarChar, email || null)
                    .input('dia_chi', sql.NVarChar, dia_chi)
                    .query('INSERT INTO khach_hang (ho_ten, so_dien_thoai, email, dia_chi) OUTPUT INSERTED.id VALUES (@ho_ten, @sdt, @email, @dia_chi)');
                khachHangId = insertKH.recordset[0].id;
            }
        }

        // Tinh tong tien va kiem tra ton kho
        let tongTien = 0;
        const chiTietItems = [];
        for (const item of cart) {
            const spResult = await new sql.Request(transaction)
                .input('id', sql.Int, item.san_pham_id)
                .query('SELECT * FROM san_pham WHERE id = @id AND trang_thai = 1');
            if (spResult.recordset.length === 0) continue;
            const sp = spResult.recordset[0];
            const soLuong = Math.min(parseInt(item.so_luong) || 1, sp.so_luong);
            if (soLuong <= 0) {
                await transaction.rollback();
                req.flash('error', 'San pham "' + sp.ten_sp + '" da het hang');
                return res.redirect('/gio-hang');
            }
            if (item.so_luong > sp.so_luong) {
                await transaction.rollback();
                req.flash('error', 'San pham "' + sp.ten_sp + '" chi con ' + sp.so_luong + ' trong kho');
                return res.redirect('/gio-hang');
            }
            const thanhTien = sp.gia_ban * soLuong;
            tongTien += thanhTien;
            chiTietItems.push({ san_pham_id: sp.id, so_luong: soLuong, don_gia: sp.gia_ban, thanh_tien: thanhTien });
        }

        // Tinh giam gia
        let giamGia = 0;
        let maGiamGiaIdParsed = null;
        if (ma_giam_gia_id && parseInt(ma_giam_gia_id) > 0) {
            maGiamGiaIdParsed = parseInt(ma_giam_gia_id);
            const maResult = await new sql.Request(transaction)
                .input('id', sql.Int, maGiamGiaIdParsed)
                .query(`SELECT * FROM ma_giam_gia WHERE id = @id AND trang_thai = 1 AND da_su_dung < so_luong
                    AND (ngay_ket_thuc IS NULL OR ngay_ket_thuc >= GETDATE())`);
            if (maResult.recordset.length > 0) {
                const ma = maResult.recordset[0];
                if (ma.loai_giam === 'phan_tram') {
                    giamGia = Math.round(tongTien * ma.gia_tri / 100);
                } else {
                    giamGia = ma.gia_tri;
                }
                giamGia = Math.min(giamGia, tongTien);
                // Tang so luong da su dung
                await new sql.Request(transaction)
                    .input('id', sql.Int, maGiamGiaIdParsed)
                    .query('UPDATE ma_giam_gia SET da_su_dung = da_su_dung + 1 WHERE id = @id');
            }
        }
        const thanhToan = tongTien - giamGia;

        // Tao don hang
        const insertDH = await new sql.Request(transaction)
            .input('ma_dh', sql.NVarChar, maDH)
            .input('khach_hang_id', sql.Int, khachHangId)
            .input('tai_khoan_id', sql.Int, req.session.user.id)
            .input('tong_tien', sql.Decimal(15,2), tongTien)
            .input('giam_gia', sql.Decimal(15,2), giamGia)
            .input('thanh_toan', sql.Decimal(15,2), thanhToan)
            .input('phuong_thuc_tt', sql.NVarChar, phuong_thuc_tt || 'tien_mat')
            .input('ghi_chu', sql.NVarChar(sql.MAX), ghi_chu || null)
            .input('ma_giam_gia_id', sql.Int, maGiamGiaIdParsed)
            .query(`INSERT INTO don_hang (ma_dh, khach_hang_id, tai_khoan_id, tong_tien, giam_gia, thanh_toan, phuong_thuc_tt, ghi_chu, ma_giam_gia_id)
                OUTPUT INSERTED.id VALUES (@ma_dh, @khach_hang_id, @tai_khoan_id, @tong_tien, @giam_gia, @thanh_toan, @phuong_thuc_tt, @ghi_chu, @ma_giam_gia_id)`);
        const donHangId = insertDH.recordset[0].id;

        // Them chi tiet va cap nhat ton kho
        for (const item of chiTietItems) {
            await new sql.Request(transaction)
                .input('don_hang_id', sql.Int, donHangId)
                .input('san_pham_id', sql.Int, item.san_pham_id)
                .input('so_luong', sql.Int, item.so_luong)
                .input('don_gia', sql.Decimal(15,2), item.don_gia)
                .input('thanh_tien', sql.Decimal(15,2), item.thanh_tien)
                .query('INSERT INTO chi_tiet_don_hang (don_hang_id, san_pham_id, so_luong, don_gia, thanh_tien) VALUES (@don_hang_id, @san_pham_id, @so_luong, @don_gia, @thanh_tien)');
            await new sql.Request(transaction)
                .input('so_luong', sql.Int, item.so_luong)
                .input('id', sql.Int, item.san_pham_id)
                .query('UPDATE san_pham SET so_luong = so_luong - @so_luong WHERE id = @id');
        }

        await transaction.commit();

        // Xoa gio hang
        req.session.cart = [];

        // Cap nhat profile neu chua co
        await pool.request()
            .input('id', sql.Int, req.session.user.id)
            .input('email', sql.NVarChar, email || null)
            .input('sdt', sql.NVarChar, so_dien_thoai || null)
            .input('dia_chi', sql.NVarChar, dia_chi || null)
            .query('UPDATE tai_khoan SET email = COALESCE(@email, email), so_dien_thoai = COALESCE(@sdt, so_dien_thoai), dia_chi = COALESCE(@dia_chi, dia_chi) WHERE id = @id');

        req.flash('success', 'Dat hang thanh cong! Ma don hang: ' + maDH);
        res.redirect('/don-hang-cua-toi/' + donHangId);
    } catch (error) {
        try { await transaction.rollback(); } catch(e) {}
        console.error('Loi dat hang:', error);
        req.flash('error', 'Co loi xay ra khi dat hang');
        res.redirect('/gio-hang');
    }
});

// ============================================
// DON HANG CUA TOI
// ============================================

// Danh sach don hang
router.get('/don-hang-cua-toi', async (req, res) => {
    try {
        const pool = await getPool();
        const page = parseInt(req.query.page) || 1;
        const limit = 10;
        const offset = (page - 1) * limit;

        const countResult = await pool.request()
            .input('tai_khoan_id', sql.Int, req.session.user.id)
            .query('SELECT COUNT(*) as total FROM don_hang WHERE tai_khoan_id = @tai_khoan_id');
        const total = countResult.recordset[0].total;

        const listResult = await pool.request()
            .input('tai_khoan_id', sql.Int, req.session.user.id)
            .input('offset', sql.Int, offset)
            .input('limit', sql.Int, limit)
            .query(`SELECT dh.*,
                (SELECT COUNT(*) FROM chi_tiet_don_hang WHERE don_hang_id = dh.id) as so_san_pham,
                (SELECT TOP 1 sp.hinh_anh FROM chi_tiet_don_hang ct JOIN san_pham sp ON ct.san_pham_id = sp.id WHERE ct.don_hang_id = dh.id) as hinh_anh_sp
                FROM don_hang dh
                WHERE dh.tai_khoan_id = @tai_khoan_id
                ORDER BY dh.ngay_tao DESC
                OFFSET @offset ROWS FETCH NEXT @limit ROWS ONLY`);

        res.render('user/orders', {
            layout: 'layouts/user',
            user: req.session.user,
            currentPage: 'don-hang',
            pageTitle: 'Đơn hàng của tôi',
            messages: req.flash(),
            donHangs: listResult.recordset,
            pagination: { page, totalPages: Math.ceil(total / limit) }
        });
    } catch (error) {
        console.error('Loi don hang:', error);
        req.flash('error', 'Co loi xay ra');
        res.redirect('/trang-chu');
    }
});

// Chi tiet don hang
router.get('/don-hang-cua-toi/:id', async (req, res) => {
    try {
        const pool = await getPool();
        const result = await pool.request()
            .input('id', sql.Int, req.params.id)
            .input('tai_khoan_id', sql.Int, req.session.user.id)
            .query('SELECT * FROM don_hang WHERE id = @id AND tai_khoan_id = @tai_khoan_id');

        if (result.recordset.length === 0) {
            req.flash('error', 'Don hang khong ton tai');
            return res.redirect('/don-hang-cua-toi');
        }

        const chiTiet = await pool.request()
            .input('don_hang_id', sql.Int, req.params.id)
            .query(`SELECT ct.*, sp.ten_sp, sp.ma_sp, sp.hinh_anh
                FROM chi_tiet_don_hang ct
                JOIN san_pham sp ON ct.san_pham_id = sp.id
                WHERE ct.don_hang_id = @don_hang_id`);

        res.render('user/order-detail', {
            layout: 'layouts/user',
            user: req.session.user,
            currentPage: 'don-hang',
            pageTitle: 'Chi tiết đơn hàng',
            messages: req.flash(),
            donHang: result.recordset[0],
            chiTiet: chiTiet.recordset
        });
    } catch (error) {
        console.error('Loi chi tiet don hang:', error);
        req.flash('error', 'Co loi xay ra');
        res.redirect('/don-hang-cua-toi');
    }
});

// Huy don hang
router.post('/don-hang-cua-toi/huy/:id', async (req, res) => {
    const pool = await getPool();
    try {
        // Kiem tra don hang thuoc user va dang cho xu ly
        const result = await pool.request()
            .input('id', sql.Int, req.params.id)
            .input('tai_khoan_id', sql.Int, req.session.user.id)
            .query("SELECT * FROM don_hang WHERE id = @id AND tai_khoan_id = @tai_khoan_id AND trang_thai = 'cho_xac_nhan'");

        if (result.recordset.length === 0) {
            req.flash('error', 'Khong the huy don hang nay');
            return res.redirect('/don-hang-cua-toi');
        }

        // Hoan lai ton kho
        const chiTiets = await pool.request()
            .input('don_hang_id', sql.Int, req.params.id)
            .query('SELECT * FROM chi_tiet_don_hang WHERE don_hang_id = @don_hang_id');
        for (const ct of chiTiets.recordset) {
            await pool.request()
                .input('so_luong', sql.Int, ct.so_luong)
                .input('id', sql.Int, ct.san_pham_id)
                .query('UPDATE san_pham SET so_luong = so_luong + @so_luong WHERE id = @id');
        }

        // Cap nhat trang thai
        await pool.request()
            .input('id', sql.Int, req.params.id)
            .query("UPDATE don_hang SET trang_thai = 'da_huy' WHERE id = @id");

        req.flash('success', 'Da huy don hang thanh cong');
        res.redirect('/don-hang-cua-toi');
    } catch (error) {
        console.error('Loi huy don:', error);
        req.flash('error', 'Co loi xay ra');
        res.redirect('/don-hang-cua-toi');
    }
});

// ============================================
// LIEN HE
// ============================================

// Trang lien he
router.get('/lien-he-user', async (req, res) => {
    try {
        const pool = await getPool();
        const userProfile = await pool.request()
            .input('id', sql.Int, req.session.user.id)
            .query('SELECT email FROM tai_khoan WHERE id = @id');

        // Lich su lien he cua user
        const lichSu = await pool.request()
            .input('tai_khoan_id', sql.Int, req.session.user.id)
            .query('SELECT TOP 10 * FROM lien_he WHERE tai_khoan_id = @tai_khoan_id ORDER BY ngay_gui DESC');

        res.render('user/contact', {
            layout: 'layouts/user',
            user: req.session.user,
            currentPage: 'lien-he',
            pageTitle: 'Liên hệ',
            messages: req.flash(),
            userEmail: userProfile.recordset[0] ? userProfile.recordset[0].email : '',
            lichSu: lichSu.recordset
        });
    } catch (error) {
        console.error('Loi lien he:', error);
        req.flash('error', 'Có lỗi xảy ra');
        res.redirect('/trang-chu');
    }
});

// Gui lien he
router.post('/lien-he', async (req, res) => {
    try {
        const { ho_ten, email, chu_de, noi_dung } = req.body;
        if (!ho_ten || !chu_de || !noi_dung) {
            req.flash('error', 'Vui lòng nhập đầy đủ thông tin');
            return res.redirect('/lien-he-user');
        }

        const pool = await getPool();
        await pool.request()
            .input('tai_khoan_id', sql.Int, req.session.user.id)
            .input('ho_ten', sql.NVarChar, ho_ten)
            .input('email', sql.NVarChar, email || null)
            .input('chu_de', sql.NVarChar, chu_de)
            .input('noi_dung', sql.NVarChar(sql.MAX), noi_dung)
            .query('INSERT INTO lien_he (tai_khoan_id, ho_ten, email, chu_de, noi_dung) VALUES (@tai_khoan_id, @ho_ten, @email, @chu_de, @noi_dung)');

        req.flash('success', 'Gửi tin nhắn thành công! Chúng tôi sẽ phản hồi sớm nhất.');
        res.redirect('/lien-he-user');
    } catch (error) {
        console.error('Loi gui lien he:', error);
        req.flash('error', 'Có lỗi xảy ra');
        res.redirect('/lien-he-user');
    }
});

// ============================================
// AP DUNG MA GIAM GIA (API)
// ============================================

router.post('/kiem-tra-ma-giam-gia', async (req, res) => {
    try {
        const { ma_code, tong_tien } = req.body;
        const pool = await getPool();

        const result = await pool.request()
            .input('ma_code', sql.NVarChar, ma_code.toUpperCase().trim())
            .query(`SELECT * FROM ma_giam_gia WHERE ma_code = @ma_code AND trang_thai = 1
                AND da_su_dung < so_luong
                AND (ngay_ket_thuc IS NULL OR ngay_ket_thuc >= GETDATE())
                AND ngay_bat_dau <= GETDATE()`);

        if (result.recordset.length === 0) {
            return res.json({ success: false, message: 'Mã giảm giá không hợp lệ hoặc đã hết hạn' });
        }

        const ma = result.recordset[0];
        const tongTien = parseFloat(tong_tien) || 0;

        if (tongTien < ma.don_toi_thieu) {
            return res.json({ success: false, message: 'Đơn hàng tối thiểu ' + Number(ma.don_toi_thieu).toLocaleString('vi-VN') + 'đ để áp dụng mã này' });
        }

        let giamGia = 0;
        if (ma.loai_giam === 'phan_tram') {
            giamGia = Math.round(tongTien * ma.gia_tri / 100);
        } else {
            giamGia = ma.gia_tri;
        }
        giamGia = Math.min(giamGia, tongTien);

        return res.json({
            success: true,
            id: ma.id,
            ma_code: ma.ma_code,
            loai_giam: ma.loai_giam,
            gia_tri: ma.gia_tri,
            giam_gia: giamGia,
            mo_ta: ma.mo_ta
        });
    } catch (error) {
        console.error('Loi kiem tra ma giam gia:', error);
        return res.json({ success: false, message: 'Có lỗi xảy ra' });
    }
});

// ============================================
// THONG TIN CA NHAN
// ============================================

// Xem thong tin
router.get('/thong-tin', async (req, res) => {
    try {
        const pool = await getPool();
        const result = await pool.request()
            .input('id', sql.Int, req.session.user.id)
            .query('SELECT * FROM tai_khoan WHERE id = @id');

        const stats = await pool.request()
            .input('tai_khoan_id', sql.Int, req.session.user.id)
            .query(`SELECT
                COUNT(*) as tong_don_hang,
                SUM(CASE WHEN trang_thai = 'da_giao' THEN 1 ELSE 0 END) as don_hoan_thanh,
                ISNULL(SUM(CASE WHEN trang_thai = 'da_giao' THEN thanh_toan ELSE 0 END), 0) as tong_chi_tieu
                FROM don_hang WHERE tai_khoan_id = @tai_khoan_id`);

        const s = stats.recordset[0];
        res.render('user/profile', {
            layout: 'layouts/user',
            user: req.session.user,
            currentPage: 'thong-tin',
            pageTitle: 'Thông tin cá nhân',
            messages: req.flash(),
            profile: result.recordset[0],
            tongDonHang: s.tong_don_hang,
            donHoanThanh: s.don_hoan_thanh,
            tongChiTieu: s.tong_chi_tieu
        });
    } catch (error) {
        console.error('Loi thong tin:', error);
        req.flash('error', 'Co loi xay ra');
        res.redirect('/trang-chu');
    }
});

// Cap nhat thong tin
router.post('/thong-tin', uploadAvatar.single('hinh_dai_dien'), async (req, res) => {
    try {
        const { ho_ten, email, so_dien_thoai, dia_chi, ngay_sinh, gioi_tinh, chieu_cao, can_nang, vong_1, vong_2, vong_3 } = req.body;
        const pool = await getPool();

        let avatarPath = null;
        if (req.file) {
            avatarPath = '/uploads/' + req.file.filename;
            // Xoa avatar cu
            const old = await pool.request()
                .input('id', sql.Int, req.session.user.id)
                .query('SELECT hinh_dai_dien FROM tai_khoan WHERE id = @id');
            if (old.recordset[0] && old.recordset[0].hinh_dai_dien) {
                const oldFile = path.join(__dirname, '..', 'public', old.recordset[0].hinh_dai_dien);
                if (fs.existsSync(oldFile)) fs.unlinkSync(oldFile);
            }
        }

        let query = `UPDATE tai_khoan SET ho_ten = @ho_ten, email = @email, so_dien_thoai = @sdt, dia_chi = @dia_chi,
            ngay_sinh = @ngay_sinh, gioi_tinh = @gioi_tinh, chieu_cao = @chieu_cao, can_nang = @can_nang,
            vong_1 = @vong_1, vong_2 = @vong_2, vong_3 = @vong_3`;
        if (avatarPath) query += ', hinh_dai_dien = @hinh_dai_dien';
        query += ' WHERE id = @id';

        const request = pool.request()
            .input('id', sql.Int, req.session.user.id)
            .input('ho_ten', sql.NVarChar, ho_ten)
            .input('email', sql.NVarChar, email || null)
            .input('sdt', sql.NVarChar, so_dien_thoai || null)
            .input('dia_chi', sql.NVarChar, dia_chi || null)
            .input('ngay_sinh', sql.Date, ngay_sinh || null)
            .input('gioi_tinh', sql.NVarChar, gioi_tinh || null)
            .input('chieu_cao', sql.Decimal(5,1), chieu_cao || null)
            .input('can_nang', sql.Decimal(5,1), can_nang || null)
            .input('vong_1', sql.Decimal(5,1), vong_1 || null)
            .input('vong_2', sql.Decimal(5,1), vong_2 || null)
            .input('vong_3', sql.Decimal(5,1), vong_3 || null);
        if (avatarPath) request.input('hinh_dai_dien', sql.NVarChar, avatarPath);

        await request.query(query);

        // Cap nhat session
        req.session.user.ho_ten = ho_ten;

        req.flash('success', 'Cập nhật thông tin thành công');
        res.redirect('/thong-tin');
    } catch (error) {
        console.error('Loi cap nhat:', error);
        req.flash('error', 'Có lỗi xảy ra');
        res.redirect('/thong-tin');
    }
});

module.exports = router;
