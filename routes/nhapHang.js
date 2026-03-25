const express = require('express');
const router = express.Router();
const { sql, getPool } = require('../config/database');

// Danh sach phieu nhap
router.get('/', async (req, res) => {
    try {
        const pool = await getPool();
        const search = req.query.search || '';
        const page = parseInt(req.query.page) || 1;
        const limit = 10;
        const offset = (page - 1) * limit;

        let whereClause = 'WHERE 1=1';
        const countReq = pool.request();
        const listReq = pool.request();

        if (search) {
            whereClause += ' AND (pn.ma_phieu LIKE @search1 OR pn.nha_cung_cap LIKE @search2)';
            const searchVal = '%' + search + '%';
            countReq.input('search1', sql.NVarChar, searchVal);
            countReq.input('search2', sql.NVarChar, searchVal);
            listReq.input('search1', sql.NVarChar, searchVal);
            listReq.input('search2', sql.NVarChar, searchVal);
        }

        const countResult = await countReq.query(`SELECT COUNT(*) as total FROM phieu_nhap pn ${whereClause}`);
        const total = countResult.recordset[0].total;

        listReq.input('offset', sql.Int, offset);
        listReq.input('limit', sql.Int, limit);
        const result = await listReq.query(`
            SELECT pn.*, nv.ho_ten as ten_nv,
                (SELECT COUNT(*) FROM chi_tiet_phieu_nhap WHERE phieu_nhap_id = pn.id) as so_san_pham
            FROM phieu_nhap pn
            LEFT JOIN nhan_vien nv ON pn.nhan_vien_id = nv.id
            ${whereClause}
            ORDER BY pn.ngay_tao DESC
            OFFSET @offset ROWS FETCH NEXT @limit ROWS ONLY
        `);

        // Thong ke tong quan
        const statsResult = await pool.request().query(`
            SELECT COUNT(*) as tong_phieu,
                ISNULL(SUM(tong_tien), 0) as tong_gia_tri,
                (SELECT COUNT(*) FROM phieu_nhap WHERE MONTH(ngay_nhap) = MONTH(GETDATE()) AND YEAR(ngay_nhap) = YEAR(GETDATE())) as phieu_thang_nay
            FROM phieu_nhap
        `);

        res.render('nhap-hang/index', {
            layout: 'layouts/main',
            user: req.session.user,
            currentPage: 'nhap-hang',
            pageTitle: 'Quan ly nhap hang',
            messages: req.flash(),
            phieuNhaps: result.recordset,
            stats: statsResult.recordset[0],
            totalPages: Math.ceil(total / limit),
            currentPageNum: page,
            search
        });
    } catch (error) {
        console.error('Loi:', error);
        req.flash('error', 'Co loi xay ra');
        res.redirect('/dashboard');
    }
});

// Form tao phieu nhap
router.get('/tao', async (req, res) => {
    try {
        const pool = await getPool();
        const sanPhams = await pool.request().query('SELECT id, ma_sp, ten_sp, gia_nhap, gia_ban, so_luong FROM san_pham WHERE trang_thai = 1 ORDER BY ten_sp');
        const nhanViens = await pool.request().query('SELECT * FROM nhan_vien WHERE trang_thai = 1');
        const maxIdResult = await pool.request().query('SELECT ISNULL(MAX(id), 0) as maxId FROM phieu_nhap');
        const maPhieu = 'PN' + String(maxIdResult.recordset[0].maxId + 1).padStart(3, '0');

        res.render('nhap-hang/form', {
            layout: 'layouts/main',
            user: req.session.user,
            currentPage: 'nhap-hang',
            pageTitle: 'Tao phieu nhap hang',
            messages: req.flash(),
            sanPhams: sanPhams.recordset,
            nhanViens: nhanViens.recordset,
            maPhieu
        });
    } catch (error) {
        console.error('Loi:', error);
        req.flash('error', 'Co loi xay ra');
        res.redirect('/nhap-hang');
    }
});

// Xu ly tao phieu nhap
router.post('/tao', async (req, res) => {
    const pool = await getPool();
    const transaction = new sql.Transaction(pool);
    try {
        await transaction.begin();
        const { ma_phieu, nhan_vien_id, nha_cung_cap, ghi_chu, san_pham_ids, so_luongs, don_gias, gia_bans } = req.body;

        if (!san_pham_ids || san_pham_ids.length === 0) {
            req.flash('error', 'Vui long chon it nhat 1 san pham');
            return res.redirect('/nhap-hang/tao');
        }

        const spIds = Array.isArray(san_pham_ids) ? san_pham_ids : [san_pham_ids];
        const sls = Array.isArray(so_luongs) ? so_luongs : [so_luongs];
        const gias = Array.isArray(don_gias) ? don_gias : [don_gias];
        const giaBanArr = Array.isArray(gia_bans) ? gia_bans : [gia_bans];

        let tongTien = 0;
        const items = [];
        for (let i = 0; i < spIds.length; i++) {
            const sl = parseInt(sls[i]) || 0;
            const gia = parseFloat(gias[i]) || 0;
            const giaBan = parseFloat(giaBanArr[i]) || 0;
            const tt = sl * gia;
            tongTien += tt;
            items.push({ san_pham_id: spIds[i], so_luong: sl, don_gia: gia, gia_ban: giaBan, thanh_tien: tt });
        }

        const insertResult = await new sql.Request(transaction)
            .input('ma_phieu', sql.NVarChar, ma_phieu)
            .input('nhan_vien_id', sql.Int, nhan_vien_id || null)
            .input('nha_cung_cap', sql.NVarChar, nha_cung_cap)
            .input('tong_tien', sql.Decimal(15,2), tongTien)
            .input('ghi_chu', sql.NVarChar(sql.MAX), ghi_chu)
            .query('INSERT INTO phieu_nhap (ma_phieu, nhan_vien_id, nha_cung_cap, tong_tien, ghi_chu) OUTPUT INSERTED.id VALUES (@ma_phieu, @nhan_vien_id, @nha_cung_cap, @tong_tien, @ghi_chu)');

        const phieuNhapId = insertResult.recordset[0].id;

        for (let i = 0; i < items.length; i++) {
            const item = items[i];
            await new sql.Request(transaction)
                .input('phieu_nhap_id', sql.Int, phieuNhapId)
                .input('san_pham_id', sql.Int, item.san_pham_id)
                .input('so_luong', sql.Int, item.so_luong)
                .input('don_gia', sql.Decimal(15,2), item.don_gia)
                .input('thanh_tien', sql.Decimal(15,2), item.thanh_tien)
                .query('INSERT INTO chi_tiet_phieu_nhap (phieu_nhap_id, san_pham_id, so_luong, don_gia, thanh_tien) VALUES (@phieu_nhap_id, @san_pham_id, @so_luong, @don_gia, @thanh_tien)');

            let updateQuery = 'UPDATE san_pham SET so_luong = so_luong + @so_luong, gia_nhap = @don_gia';
            const updateReq = new sql.Request(transaction)
                .input('so_luong', sql.Int, item.so_luong)
                .input('don_gia', sql.Decimal(15,2), item.don_gia)
                .input('id', sql.Int, item.san_pham_id);
            if (item.gia_ban > 0) {
                updateQuery += ', gia_ban = @gia_ban';
                updateReq.input('gia_ban', sql.Decimal(15,2), item.gia_ban);
            }
            updateQuery += ' WHERE id = @id';
            await updateReq.query(updateQuery);
        }

        await transaction.commit();
        req.flash('success', 'Tao phieu nhap thanh cong. Da cap nhat ton kho va gia.');
        res.redirect('/nhap-hang');
    } catch (error) {
        try { await transaction.rollback(); } catch(e) {}
        console.error('Loi:', error);
        req.flash('error', 'Co loi xay ra');
        res.redirect('/nhap-hang/tao');
    }
});

// Chi tiet phieu nhap
router.get('/:id', async (req, res) => {
    try {
        const pool = await getPool();
        const phieuResult = await pool.request()
            .input('id', sql.Int, req.params.id)
            .query('SELECT pn.*, nv.ho_ten as ten_nv FROM phieu_nhap pn LEFT JOIN nhan_vien nv ON pn.nhan_vien_id = nv.id WHERE pn.id = @id');

        if (phieuResult.recordset.length === 0) {
            req.flash('error', 'Khong tim thay phieu nhap');
            return res.redirect('/nhap-hang');
        }

        const chiTiets = await pool.request()
            .input('phieu_nhap_id', sql.Int, req.params.id)
            .query('SELECT ct.*, sp.ten_sp, sp.ma_sp FROM chi_tiet_phieu_nhap ct JOIN san_pham sp ON ct.san_pham_id = sp.id WHERE ct.phieu_nhap_id = @phieu_nhap_id');

        res.render('nhap-hang/detail', {
            layout: 'layouts/main',
            user: req.session.user,
            currentPage: 'nhap-hang',
            pageTitle: 'Chi tiet phieu nhap',
            messages: req.flash(),
            phieu: phieuResult.recordset[0],
            chiTiets: chiTiets.recordset
        });
    } catch (error) {
        console.error('Loi:', error);
        req.flash('error', 'Co loi xay ra');
        res.redirect('/nhap-hang');
    }
});

// Xoa phieu nhap (hoan tra so luong)
router.get('/xoa/:id', async (req, res) => {
    const pool = await getPool();
    const transaction = new sql.Transaction(pool);
    try {
        await transaction.begin();

        const chiTiets = await new sql.Request(transaction)
            .input('phieu_nhap_id', sql.Int, req.params.id)
            .query('SELECT * FROM chi_tiet_phieu_nhap WHERE phieu_nhap_id = @phieu_nhap_id');

        for (const ct of chiTiets.recordset) {
            await new sql.Request(transaction)
                .input('so_luong', sql.Int, ct.so_luong)
                .input('id', sql.Int, ct.san_pham_id)
                .query('UPDATE san_pham SET so_luong = CASE WHEN so_luong >= @so_luong THEN so_luong - @so_luong ELSE 0 END WHERE id = @id');
        }

        await new sql.Request(transaction)
            .input('phieu_nhap_id', sql.Int, req.params.id)
            .query('DELETE FROM chi_tiet_phieu_nhap WHERE phieu_nhap_id = @phieu_nhap_id');
        await new sql.Request(transaction)
            .input('id', sql.Int, req.params.id)
            .query('DELETE FROM phieu_nhap WHERE id = @id');

        await transaction.commit();
        req.flash('success', 'Xoa phieu nhap thanh cong. Da hoan tra so luong ton kho.');
    } catch (error) {
        try { await transaction.rollback(); } catch(e) {}
        console.error('Loi:', error);
        req.flash('error', 'Co loi xay ra khi xoa');
    }
    res.redirect('/nhap-hang');
});

module.exports = router;
