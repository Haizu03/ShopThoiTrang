const express = require('express');
const router = express.Router();
const { sql, getPool } = require('../config/database');

// Danh sach don hang
router.get('/', async (req, res) => {
    try {
        const page = parseInt(req.query.page) || 1;
        const limit = 10;
        const offset = (page - 1) * limit;
        const search = req.query.search || '';
        const trangThai = req.query.trang_thai || '';

        const pool = await getPool();
        let whereClause = 'WHERE 1=1';
        const countReq = pool.request();
        const listReq = pool.request();

        if (search) {
            whereClause += ' AND (dh.ma_dh LIKE @search1 OR kh.ho_ten LIKE @search2)';
            const searchVal = '%' + search + '%';
            countReq.input('search1', sql.NVarChar, searchVal);
            countReq.input('search2', sql.NVarChar, searchVal);
            listReq.input('search1', sql.NVarChar, searchVal);
            listReq.input('search2', sql.NVarChar, searchVal);
        }
        if (trangThai) {
            whereClause += ' AND dh.trang_thai = @trangThai';
            countReq.input('trangThai', sql.NVarChar, trangThai);
            listReq.input('trangThai', sql.NVarChar, trangThai);
        }

        const countResult = await countReq.query(`SELECT COUNT(*) as total FROM don_hang dh LEFT JOIN khach_hang kh ON dh.khach_hang_id = kh.id ${whereClause}`);
        const total = countResult.recordset[0].total;

        listReq.input('offset', sql.Int, offset);
        listReq.input('limit', sql.Int, limit);
        const listResult = await listReq.query(`
            SELECT dh.*, kh.ho_ten as ten_khach, nv.ho_ten as ten_nv
            FROM don_hang dh
            LEFT JOIN khach_hang kh ON dh.khach_hang_id = kh.id
            LEFT JOIN nhan_vien nv ON dh.nhan_vien_id = nv.id
            ${whereClause}
            ORDER BY dh.ngay_tao DESC
            OFFSET @offset ROWS FETCH NEXT @limit ROWS ONLY
        `);

        res.render('don-hang/index', {
            layout: 'layouts/main',
            user: req.session.user,
            currentPage: 'don-hang',
            pageTitle: 'Quan ly don hang',
            messages: req.flash(),
            donHangs: listResult.recordset,
            totalPages: Math.ceil(total / limit),
            currentPageNum: page,
            queryString: `&search=${search}&trang_thai=${trangThai}`,
            search,
            trangThai
        });
    } catch (error) {
        console.error('Loi:', error);
        req.flash('error', 'Co loi xay ra');
        res.redirect('/dashboard');
    }
});

// Form tao don hang
router.get('/tao', async (req, res) => {
    try {
        const pool = await getPool();
        const khachHangs = await pool.request().query('SELECT * FROM khach_hang ORDER BY ho_ten');
        const sanPhams = await pool.request().query('SELECT * FROM san_pham WHERE trang_thai = 1 AND so_luong > 0 ORDER BY ten_sp');
        const nhanViens = await pool.request().query('SELECT * FROM nhan_vien WHERE trang_thai = 1 ORDER BY ho_ten');
        const maxIdResult = await pool.request().query('SELECT ISNULL(MAX(id), 0) as maxId FROM don_hang');
        const maDH = 'DH' + String(maxIdResult.recordset[0].maxId + 1).padStart(3, '0');

        res.render('don-hang/form', {
            layout: 'layouts/main',
            user: req.session.user,
            currentPage: 'don-hang',
            pageTitle: 'Tao don hang moi',
            messages: req.flash(),
            khachHangs: khachHangs.recordset,
            sanPhams: sanPhams.recordset,
            nhanViens: nhanViens.recordset,
            maDH
        });
    } catch (error) {
        console.error('Loi:', error);
        req.flash('error', 'Co loi xay ra');
        res.redirect('/don-hang');
    }
});

// Xu ly tao don hang
router.post('/tao', async (req, res) => {
    const pool = await getPool();
    const transaction = new sql.Transaction(pool);
    try {
        await transaction.begin();
        const { ma_dh, khach_hang_id, nhan_vien_id, phuong_thuc_tt, giam_gia, ghi_chu, san_pham_ids, so_luongs } = req.body;

        if (!san_pham_ids || san_pham_ids.length === 0) {
            req.flash('error', 'Vui long chon it nhat 1 san pham');
            return res.redirect('/don-hang/tao');
        }

        const spIds = Array.isArray(san_pham_ids) ? san_pham_ids : [san_pham_ids];
        const sls = Array.isArray(so_luongs) ? so_luongs : [so_luongs];

        let tongTien = 0;
        const chiTietItems = [];

        for (let i = 0; i < spIds.length; i++) {
            const spResult = await new sql.Request(transaction)
                .input('id', sql.Int, spIds[i])
                .query('SELECT * FROM san_pham WHERE id = @id AND trang_thai = 1');
            if (spResult.recordset.length === 0) continue;

            const sp = spResult.recordset[0];
            const soLuong = parseInt(sls[i]) || 1;
            if (soLuong > sp.so_luong) {
                await transaction.rollback();
                req.flash('error', 'San pham "' + sp.ten_sp + '" chi con ' + sp.so_luong + ' trong kho');
                return res.redirect('/don-hang/tao');
            }

            const thanhTien = sp.gia_ban * soLuong;
            tongTien += thanhTien;
            chiTietItems.push({ san_pham_id: spIds[i], so_luong: soLuong, don_gia: sp.gia_ban, thanh_tien: thanhTien });
        }

        const giamGia = parseFloat(giam_gia) || 0;
        const thanhToan = tongTien - giamGia;

        const insertResult = await new sql.Request(transaction)
            .input('ma_dh', sql.NVarChar, ma_dh)
            .input('khach_hang_id', sql.Int, khach_hang_id || null)
            .input('nhan_vien_id', sql.Int, nhan_vien_id || null)
            .input('tong_tien', sql.Decimal(15,2), tongTien)
            .input('giam_gia', sql.Decimal(15,2), giamGia)
            .input('thanh_toan', sql.Decimal(15,2), thanhToan)
            .input('phuong_thuc_tt', sql.NVarChar, phuong_thuc_tt)
            .input('ghi_chu', sql.NVarChar(sql.MAX), ghi_chu)
            .query(`INSERT INTO don_hang (ma_dh, khach_hang_id, nhan_vien_id, tong_tien, giam_gia, thanh_toan, phuong_thuc_tt, ghi_chu) OUTPUT INSERTED.id VALUES (@ma_dh, @khach_hang_id, @nhan_vien_id, @tong_tien, @giam_gia, @thanh_toan, @phuong_thuc_tt, @ghi_chu)`);

        const donHangId = insertResult.recordset[0].id;

        for (let i = 0; i < chiTietItems.length; i++) {
            const item = chiTietItems[i];
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
        req.flash('success', 'Tao don hang thanh cong');
        res.redirect('/don-hang/' + donHangId);
    } catch (error) {
        try { await transaction.rollback(); } catch(e) {}
        console.error('Loi tao DH:', error);
        if (error.number === 2627 || error.number === 2601) {
            req.flash('error', 'Ma don hang da ton tai');
        } else {
            req.flash('error', 'Co loi xay ra khi tao don hang');
        }
        res.redirect('/don-hang/tao');
    }
});

// Cap nhat trang thai don hang
router.post('/cap-nhat-trang-thai/:id', async (req, res) => {
    try {
        const { trang_thai } = req.body;
        const validStatuses = ['cho_xac_nhan', 'da_xac_nhan', 'dang_giao', 'da_giao', 'da_huy'];
        if (!validStatuses.includes(trang_thai)) {
            req.flash('error', 'Trang thai khong hop le');
            return res.redirect('/don-hang/' + req.params.id);
        }

        const pool = await getPool();

        // Kiem tra trang thai hien tai
        const current = await pool.request()
            .input('id', sql.Int, req.params.id)
            .query('SELECT trang_thai FROM don_hang WHERE id = @id');
        if (current.recordset.length === 0) {
            req.flash('error', 'Khong tim thay don hang');
            return res.redirect('/don-hang');
        }
        const currentStatus = current.recordset[0].trang_thai;

        // Kiem tra luong trang thai hop le
        const validTransitions = {
            'cho_xac_nhan': ['da_xac_nhan', 'da_huy'],
            'da_xac_nhan': ['dang_giao', 'da_huy'],
            'dang_giao': ['da_giao'],
            'da_giao': [],
            'da_huy': []
        };

        if (!validTransitions[currentStatus] || !validTransitions[currentStatus].includes(trang_thai)) {
            req.flash('error', 'Khong the chuyen sang trang thai nay');
            return res.redirect('/don-hang/' + req.params.id);
        }

        // Hoan tra so luong khi huy don
        if (trang_thai === 'da_huy') {
            const chiTiets = await pool.request()
                .input('don_hang_id', sql.Int, req.params.id)
                .query('SELECT * FROM chi_tiet_don_hang WHERE don_hang_id = @don_hang_id');
            for (const ct of chiTiets.recordset) {
                await pool.request()
                    .input('so_luong', sql.Int, ct.so_luong)
                    .input('id', sql.Int, ct.san_pham_id)
                    .query('UPDATE san_pham SET so_luong = so_luong + @so_luong WHERE id = @id');
            }
        }

        await pool.request()
            .input('trang_thai', sql.NVarChar, trang_thai)
            .input('id', sql.Int, req.params.id)
            .query('UPDATE don_hang SET trang_thai = @trang_thai WHERE id = @id');

        const statusNames = {
            'da_xac_nhan': 'Đã xác nhận đơn hàng',
            'dang_giao': 'Đang giao hàng',
            'da_giao': 'Đã giao hàng thành công',
            'da_huy': 'Đã hủy đơn hàng'
        };
        req.flash('success', statusNames[trang_thai] || 'Cap nhat thanh cong');
    } catch (error) {
        console.error('Loi:', error);
        req.flash('error', 'Co loi xay ra');
    }
    res.redirect('/don-hang/' + req.params.id);
});

// Chi tiet don hang
router.get('/:id', async (req, res) => {
    try {
        const pool = await getPool();
        const donHangResult = await pool.request()
            .input('id', sql.Int, req.params.id)
            .query(`SELECT dh.*, kh.ho_ten as ten_khach, kh.so_dien_thoai, kh.dia_chi as dia_chi_kh, nv.ho_ten as ten_nv
                    FROM don_hang dh LEFT JOIN khach_hang kh ON dh.khach_hang_id = kh.id LEFT JOIN nhan_vien nv ON dh.nhan_vien_id = nv.id WHERE dh.id = @id`);

        if (donHangResult.recordset.length === 0) {
            req.flash('error', 'Khong tim thay don hang');
            return res.redirect('/don-hang');
        }

        const chiTiets = await pool.request()
            .input('don_hang_id', sql.Int, req.params.id)
            .query('SELECT ct.*, sp.ten_sp, sp.ma_sp FROM chi_tiet_don_hang ct JOIN san_pham sp ON ct.san_pham_id = sp.id WHERE ct.don_hang_id = @don_hang_id');

        res.render('don-hang/detail', {
            layout: 'layouts/main',
            user: req.session.user,
            currentPage: 'don-hang',
            pageTitle: 'Chi tiet don hang',
            messages: req.flash(),
            donHang: donHangResult.recordset[0],
            chiTiets: chiTiets.recordset
        });
    } catch (error) {
        console.error('Loi:', error);
        req.flash('error', 'Co loi xay ra');
        res.redirect('/don-hang');
    }
});

// Xoa don hang
router.get('/xoa/:id', async (req, res) => {
    const pool = await getPool();
    const transaction = new sql.Transaction(pool);
    try {
        await transaction.begin();

        const chiTiets = await new sql.Request(transaction)
            .input('don_hang_id', sql.Int, req.params.id)
            .query('SELECT * FROM chi_tiet_don_hang WHERE don_hang_id = @don_hang_id');
        for (const ct of chiTiets.recordset) {
            await new sql.Request(transaction)
                .input('so_luong', sql.Int, ct.so_luong)
                .input('id', sql.Int, ct.san_pham_id)
                .query('UPDATE san_pham SET so_luong = so_luong + @so_luong WHERE id = @id');
        }

        await new sql.Request(transaction)
            .input('don_hang_id', sql.Int, req.params.id)
            .query('DELETE FROM chi_tiet_don_hang WHERE don_hang_id = @don_hang_id');
        await new sql.Request(transaction)
            .input('id', sql.Int, req.params.id)
            .query('DELETE FROM don_hang WHERE id = @id');

        await transaction.commit();
        req.flash('success', 'Xoa don hang thanh cong');
    } catch (error) {
        try { await transaction.rollback(); } catch(e) {}
        console.error('Loi:', error);
        req.flash('error', 'Co loi xay ra khi xoa');
    }
    res.redirect('/don-hang');
});

module.exports = router;
