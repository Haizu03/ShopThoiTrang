const express = require('express');
const router = express.Router();
const { sql, getPool } = require('../config/database');
const multer = require('multer');
const path = require('path');
const fs = require('fs');

// Multer cho upload QR
const storage = multer.diskStorage({
    destination: (req, file, cb) => cb(null, 'public/uploads/'),
    filename: (req, file, cb) => {
        const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
        cb(null, 'qr-' + uniqueSuffix + path.extname(file.originalname));
    }
});
const fileFilter = (req, file, cb) => {
    const allowedTypes = /jpeg|jpg|png|gif|webp/;
    const extname = allowedTypes.test(path.extname(file.originalname).toLowerCase());
    const mimetype = allowedTypes.test(file.mimetype);
    cb(null, extname && mimetype);
};
const upload = multer({ storage, fileFilter, limits: { fileSize: 5 * 1024 * 1024 } });

// Helper: lay tat ca cai dat
async function getAllSettings(pool) {
    const result = await pool.request().query('SELECT khoa, gia_tri FROM cai_dat');
    const settings = {};
    result.recordset.forEach(r => { settings[r.khoa] = r.gia_tri; });
    return settings;
}

// Trang cai dat
router.get('/', async (req, res) => {
    try {
        const pool = await getPool();
        const settings = await getAllSettings(pool);

        res.render('cai-dat/index', {
            layout: 'layouts/main',
            user: req.session.user,
            currentPage: 'cai-dat',
            pageTitle: 'Cài đặt hệ thống',
            messages: req.flash(),
            settings
        });
    } catch (error) {
        console.error('Loi cai dat:', error);
        req.flash('error', 'Có lỗi xảy ra');
        res.redirect('/dashboard');
    }
});

// Luu cai dat don hang & van chuyen
router.post('/don-hang', async (req, res) => {
    try {
        const { phi_van_chuyen, phi_hoa_toc, giao_hang_mien_phi_tu, don_hang_tu_dong_huy, thong_bao_don_hang } = req.body;
        const pool = await getPool();

        const updates = [
            { khoa: 'phi_van_chuyen', gia_tri: phi_van_chuyen || '0' },
            { khoa: 'phi_hoa_toc', gia_tri: phi_hoa_toc || '0' },
            { khoa: 'giao_hang_mien_phi_tu', gia_tri: giao_hang_mien_phi_tu || '0' },
            { khoa: 'don_hang_tu_dong_huy', gia_tri: don_hang_tu_dong_huy || '24' },
            { khoa: 'thong_bao_don_hang', gia_tri: thong_bao_don_hang || '' }
        ];

        for (const item of updates) {
            await pool.request()
                .input('khoa', sql.NVarChar, item.khoa)
                .input('gia_tri', sql.NVarChar(sql.MAX), item.gia_tri)
                .query(`UPDATE cai_dat SET gia_tri = @gia_tri, ngay_cap_nhat = GETDATE() WHERE khoa = @khoa;
                        IF @@ROWCOUNT = 0 INSERT INTO cai_dat (khoa, gia_tri) VALUES (@khoa, @gia_tri);`);
        }

        req.flash('success', 'Đã lưu cài đặt đơn hàng');
        res.redirect('/cai-dat');
    } catch (error) {
        console.error('Loi luu cai dat DH:', error);
        req.flash('error', 'Có lỗi xảy ra');
        res.redirect('/cai-dat');
    }
});

// Luu cai dat thanh toan
router.post('/thanh-toan', upload.single('ngan_hang_hinh_qr'), async (req, res) => {
    try {
        const { cho_phep_cod, cho_phep_chuyen_khoan, cho_phep_the,
                ngan_hang_ten, ngan_hang_so_tk, ngan_hang_chu_tk, ngan_hang_chi_nhanh } = req.body;
        const pool = await getPool();

        const updates = [
            { khoa: 'cho_phep_cod', gia_tri: cho_phep_cod ? '1' : '0' },
            { khoa: 'cho_phep_chuyen_khoan', gia_tri: cho_phep_chuyen_khoan ? '1' : '0' },
            { khoa: 'cho_phep_the', gia_tri: cho_phep_the ? '1' : '0' },
            { khoa: 'ngan_hang_ten', gia_tri: ngan_hang_ten || '' },
            { khoa: 'ngan_hang_so_tk', gia_tri: ngan_hang_so_tk || '' },
            { khoa: 'ngan_hang_chu_tk', gia_tri: ngan_hang_chu_tk || '' },
            { khoa: 'ngan_hang_chi_nhanh', gia_tri: ngan_hang_chi_nhanh || '' }
        ];

        // Xu ly upload hinh QR
        if (req.file) {
            const newQrPath = '/uploads/' + req.file.filename;
            // Xoa hinh cu neu co
            const oldResult = await pool.request()
                .input('khoa', sql.NVarChar, 'ngan_hang_hinh_qr')
                .query('SELECT gia_tri FROM cai_dat WHERE khoa = @khoa');
            if (oldResult.recordset.length > 0 && oldResult.recordset[0].gia_tri) {
                const oldPath = path.join(__dirname, '..', 'public', oldResult.recordset[0].gia_tri);
                if (fs.existsSync(oldPath)) {
                    fs.unlinkSync(oldPath);
                }
            }
            updates.push({ khoa: 'ngan_hang_hinh_qr', gia_tri: newQrPath });
        }

        for (const item of updates) {
            await pool.request()
                .input('khoa', sql.NVarChar, item.khoa)
                .input('gia_tri', sql.NVarChar(sql.MAX), item.gia_tri)
                .query(`UPDATE cai_dat SET gia_tri = @gia_tri, ngay_cap_nhat = GETDATE() WHERE khoa = @khoa;
                        IF @@ROWCOUNT = 0 INSERT INTO cai_dat (khoa, gia_tri) VALUES (@khoa, @gia_tri);`);
        }

        req.flash('success', 'Đã lưu cài đặt thanh toán');
        res.redirect('/cai-dat');
    } catch (error) {
        console.error('Loi luu cai dat TT:', error);
        req.flash('error', 'Có lỗi xảy ra');
        res.redirect('/cai-dat');
    }
});

module.exports = router;
module.exports.getAllSettings = getAllSettings;
