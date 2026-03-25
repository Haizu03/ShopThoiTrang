# 📚 HƯỚNG DẪN CHI TIẾT - CODE, API & KẾT NỐI SQL

> **Tài liệu này giải thích cấu trúc code, cách hoạt động của API, và kết nối SQL Server trong dự án Shop Thời Trang.**

---

## 📋 MỤC LỤC

1. [Kiến trúc dự án](#1-kiến-trúc-dự-án)
2. [Kết nối SQL Server](#2-kết-nối-sql-server)
3. [Các API Endpoints](#3-các-api-endpoints)
4. [Luồng xử lý request](#4-luồng-xử-lý-request)
5. [Các file quan trọng](#5-các-file-quan-trọng)
6. [Ví dụ thực tế](#6-ví-dụ-thực-tế)

---

## 1. KIẾN TRÚC DỰ ÁN

### 1.1. Cấu trúc thư mục

```
ShopThoiTrang/
├── app.js                    # 📌 Entry point chính
├── package.json              # Dependencies & scripts
├── config/
│   └── database.js          # ⚙️ Cấu hình kết nối SQL
├── database/
│   └── schema.sql           # 📊 Script tạo database
├── routes/                   # 🌐 API endpoints
│   ├── auth.js              # Đăng nhập, đăng ký
│   ├── dashboard.js         # Thống kê
│   ├── sanPham.js           # Sản phẩm (CRUD)
│   ├── danhMuc.js           # Danh mục (CRUD)
│   ├── khachHang.js         # Khách hàng (CRUD)
│   ├── donHang.js           # Đơn hàng (CRUD)
│   ├── nhanVien.js          # Nhân viên (CRUD)
│   ├── nhapHang.js          # Nhập hàng (CRUD)
│   ├── thongKe.js           # Báo cáo thống kê
│   ├── timKiem.js           # Tìm kiếm toàn bộ
│   ├── caiDat.js            # Cài đặt hệ thống
│   ├── maGiamGia.js         # Mã giảm giá
│   ├── lienHe.js            # Liên hệ (Admin)
│   ├── user.js              # Người dùng (trang chủ, giỏ hàng, đặt hàng)
│   └── chatbot.js           # AI Chatbot
├── views/                    # 🎨 Giao diện (EJS templates)
│   ├── layouts/             # Layout chính & user
│   ├── auth/                # Login, Register
│   ├── dashboard/           # Trang admin
│   ├── san-pham/            # Quản lý sản phẩm
│   ├── user/                # Trang khách hàng
│   └── partials/            # Component tái sử dụng
├── public/                   # 🖼️ Static files
│   ├── css/                 # CSS styles
│   ├── js/                  # JavaScript client-side
│   ├── uploads/             # Ảnh sản phẩm
│   └── *.html               # Report files
└── README.md                # Hướng dẫn chạy
```

### 1.2. Công nghệ stack

```
┌─────────────────────────────────────────┐
│         SHOP THỜI TRANG STACK           │
├─────────────────────────────────────────┤
│ Frontend:   EJS + Bootstrap 5 + Font Awesome
│ Backend:    Node.js + Express.js
│ Database:   SQL Server 2022 / LocalDB
│ Auth:       bcryptjs + express-session
│ File Upload: Multer
│ API Type:   RESTful
└─────────────────────────────────────────┘
```

---

## 2. KẾT NỐI SQL SERVER

### 2.1. File cấu hình: `config/database.js`

```javascript
const sql = require('mssql/msnodesqlv8');

const config = {
    connectionString: 'Driver={ODBC Driver 18 for SQL Server};Server=(localdb)\\MSSQLLocalDB;Database=shop_thoi_trang;Trusted_Connection=yes;TrustServerCertificate=yes;'
};

let pool;

async function getPool() {
    if (!pool) {
        pool = await new sql.ConnectionPool(config).connect();
        console.log('Ket noi SQL Server thanh cong!');
    }
    return pool;
}

module.exports = { sql, getPool };
```

**Giải thích:**
- `Driver`: ODBC Driver 18 cho phép kết nối SQL Server từ Node.js
- `Server`: Địa chỉ SQL Server (`(localdb)\MSSQLLocalDB` = LocalDB)
- `Database`: Tên database (`shop_thoi_trang`)
- `Trusted_Connection=yes`: Dùng Windows Authentication
- `TrustServerCertificate=yes`: Bỏ qua SSL certificate validation
- `pool`: Lưu trữ connection pool để tái sử dụng

### 2.2. Cách kết nối và thực thi query

```javascript
const { sql, getPool } = require('../config/database');

// Bước 1: Lấy pool kết nối
const pool = await getPool();

// Bước 2: Tạo request mới
const request = pool.request();

// Bước 3: Thêm parameters (ngăn SQL Injection)
request.input('ten_dang_nhap', sql.NVarChar, username);
request.input('mat_khau', sql.NVarChar, password);

// Bước 4: Thực thi query
const result = await request.query(
    'SELECT * FROM tai_khoan WHERE ten_dang_nhap = @ten_dang_nhap'
);

// Bước 5: Lấy dữ liệu
if (result.recordset.length > 0) {
    const user = result.recordset[0];
    console.log(user); // { id: 1, ten_dang_nhap: 'admin', ... }
}
```

### 2.3. Các kiểu dữ liệu SQL

```javascript
sql.Int                      // INT (số nguyên)
sql.NVarChar                 // NVARCHAR(MAX) (chuỗi Unicode)
sql.NVarChar(50)             // NVARCHAR(50) (chuỗi có độ dài max 50)
sql.Decimal(15, 2)           // DECIMAL(15,2) (số thập phân)
sql.Bit                      // BIT (0 hoặc 1)
sql.DateTime                 // DATETIME (ngày giờ)
sql.Date                     // DATE (chỉ ngày)
```

### 2.4. Các loại query phổ biến

#### ✅ SELECT - Truy vấn dữ liệu
```javascript
const result = await pool.request()
    .input('id', sql.Int, 1)
    .query('SELECT * FROM tai_khoan WHERE id = @id');

console.log(result.recordset); // Mảng các hàng dữ liệu
```

#### ✅ INSERT - Thêm dữ liệu
```javascript
const result = await pool.request()
    .input('ten_sp', sql.NVarChar, 'Áo thun cotton')
    .input('gia_ban', sql.Decimal(15,2), 150000)
    .output('id')  // Trả về ID vừa insert
    .query(`INSERT INTO san_pham (ten_sp, gia_ban) 
            OUTPUT INSERTED.id VALUES (@ten_sp, @gia_ban)`);

console.log(result.recordset[0].id); // ID mới
```

#### ✅ UPDATE - Cập nhật dữ liệu
```javascript
await pool.request()
    .input('id', sql.Int, 1)
    .input('gia_ban', sql.Decimal(15,2), 200000)
    .query('UPDATE san_pham SET gia_ban = @gia_ban WHERE id = @id');
```

#### ✅ DELETE - Xóa dữ liệu
```javascript
await pool.request()
    .input('id', sql.Int, 1)
    .query('DELETE FROM san_pham WHERE id = @id');
```

#### ✅ JOIN - Kết hợp bảng
```javascript
const result = await pool.request()
    .query(`SELECT sp.ten_sp, dm.ten_danh_muc
            FROM san_pham sp
            LEFT JOIN danh_muc dm ON sp.danh_muc_id = dm.id
            WHERE sp.trang_thai = 1`);
```

---

## 3. CÁC API ENDPOINTS

### 3.1. Chung (Không cần đăng nhập)

| Method | Endpoint | Mô tả |
|--------|----------|-------|
| GET | `/` | Redirect đến dashboard/trang chủ |
| GET | `/dang-nhap` | Form đăng nhập |
| POST | `/dang-nhap` | Xử lý đăng nhập |
| GET | `/dang-ky` | Form đăng ký |
| POST | `/dang-ky` | Xử lý đăng ký |
| GET | `/dang-xuat` | Đăng xuất |

### 3.2. Admin Routes (Cần đăng nhập + quyền admin)

#### 📊 Dashboard & Thống kê
```
GET  /dashboard              → Trang chính admin
GET  /thong-ke               → Báo cáo chi tiết
```

#### 🛍️ Quản lý Sản phẩm (`/san-pham`)
```
GET    /san-pham             → Danh sách sản phẩm
GET    /san-pham/tao         → Form thêm sản phẩm
POST   /san-pham/tao         → Lưu sản phẩm mới
GET    /san-pham/sua/:id     → Form sửa sản phẩm
POST   /san-pham/sua/:id     → Lưu sửa sản phẩm
GET    /san-pham/xoa/:id     → Xóa sản phẩm
GET    /san-pham/:id         → Chi tiết sản phẩm
```

#### 📂 Quản lý Danh mục (`/danh-muc`)
```
GET    /danh-muc             → Danh sách danh mục
GET    /danh-muc/tao         → Form thêm danh mục
POST   /danh-muc/tao         → Lưu danh mục mới
GET    /danh-muc/sua/:id     → Form sửa danh mục
POST   /danh-muc/sua/:id     → Lưu sửa danh mục
GET    /danh-muc/xoa/:id     → Xóa danh mục
```

#### 👥 Quản lý Khách hàng (`/khach-hang`)
```
GET    /khach-hang           → Danh sách khách hàng
GET    /khach-hang/tao       → Form thêm khách hàng
POST   /khach-hang/tao       → Lưu khách hàng mới
GET    /khach-hang/sua/:id   → Form sửa khách hàng
POST   /khach-hang/sua/:id   → Lưu sửa khách hàng
GET    /khach-hang/xoa/:id   → Xóa khách hàng
```

#### 📦 Quản lý Đơn hàng (`/don-hang`)
```
GET    /don-hang             → Danh sách đơn hàng
GET    /don-hang/:id         → Chi tiết đơn hàng
POST   /don-hang/sua/:id     → Cập nhật trạng thái
GET    /don-hang/xoa/:id     → Hủy đơn hàng
```

#### 👔 Quản lý Nhân viên (`/nhan-vien`)
```
GET    /nhan-vien            → Danh sách nhân viên
GET    /nhan-vien/tao        → Form thêm nhân viên
POST   /nhan-vien/tao        → Lưu nhân viên mới
GET    /nhan-vien/sua/:id    → Form sửa nhân viên
POST   /nhan-vien/sua/:id    → Lưu sửa nhân viên
GET    /nhan-vien/xoa/:id    → Xóa nhân viên
```

#### 📥 Quản lý Nhập hàng (`/nhap-hang`)
```
GET    /nhap-hang            → Danh sách phiếu nhập
GET    /nhap-hang/tao        → Form thêm phiếu nhập
POST   /nhap-hang/tao        → Lưu phiếu nhập mới
GET    /nhap-hang/:id        → Chi tiết phiếu nhập
GET    /nhap-hang/xoa/:id    → Xóa phiếu nhập
```

#### 🏷️ Quản lý Mã giảm giá (`/ma-giam-gia`)
```
GET    /ma-giam-gia          → Danh sách mã
GET    /ma-giam-gia/tao      → Form thêm mã
POST   /ma-giam-gia/tao      → Lưu mã mới
GET    /ma-giam-gia/sua/:id  → Form sửa mã
POST   /ma-giam-gia/sua/:id  → Lưu sửa mã
GET    /ma-giam-gia/xoa/:id  → Xóa mã
```

#### 📞 Quản lý Liên hệ (`/lien-he`)
```
GET    /lien-he              → Danh sách liên hệ
GET    /lien-he/:id          → Chi tiết + form phản hồi
POST   /lien-he/phan-hoi/:id → Gửi phản hồi
GET    /lien-he/xoa/:id      → Xóa liên hệ
```

#### ⚙️ Cài đặt (`/cai-dat`)
```
GET    /cai-dat              → Trang cài đặt
POST   /cai-dat/don-hang     → Lưu cài đặt đơn hàng
```

#### 🔍 Tìm kiếm (`/tim-kiem`)
```
GET    /tim-kiem?q=...&loai=...  → Tìm kiếm toàn bộ
```

### 3.3. User Routes (Khách hàng - Cần đăng nhập)

#### 🏠 Trang chủ & Shop
```
GET    /trang-chu            → Trang chủ người dùng
GET    /shop                 → Cửa hàng
GET    /product/:id          → Chi tiết sản phẩm
```

#### 🛒 Giỏ hàng
```
GET    /cart                 → Xem giỏ hàng
POST   /cart/add             → Thêm vào giỏ
POST   /cart/remove/:id      → Xóa khỏi giỏ
POST   /cart/update/:id      → Cập nhật số lượng
```

#### 📝 Đặt hàng
```
GET    /dat-hang             → Form đặt hàng
POST   /dat-hang             → Xử lý đặt hàng
GET    /don-hang-cua-toi     → Lịch sử đơn hàng
GET    /don-hang-cua-toi/:id → Chi tiết đơn hàng
POST   /don-hang-cua-toi/huy/:id → Hủy đơn hàng
```

#### 👤 Thông tin cá nhân
```
GET    /thong-tin            → Form thông tin
POST   /thong-tin            → Cập nhật thông tin
POST   /doi-mat-khau         → Đổi mật khẩu
```

#### 📞 Liên hệ
```
GET    /lien-he-user         → Form liên hệ
POST   /lien-he              → Gửi liên hệ
```

#### 🤖 Chatbot
```
POST   /chatbot/message      → Gửi tin nhắn AI
```

---

## 4. LUỒNG XỬ LÝ REQUEST

### 4.1. Luồng Đăng nhập

```
┌─────────────────────────────────────────┐
│  User nhập ten_dang_nhap & mat_khau    │
└──────────────┬──────────────────────────┘
               │ POST /dang-nhap
               ▼
┌─────────────────────────────────────────┐
│  routes/auth.js                         │
│  Kiểm tra input không rỗng             │
└──────────────┬──────────────────────────┘
               │
               ▼
┌─────────────────────────────────────────┐
│  Truy vấn DB:                           │
│  SELECT * FROM tai_khoan                │
│  WHERE ten_dang_nhap = @ten_dang_nhap  │
└──────────────┬──────────────────────────┘
               │
         ┌─────┴─────┐
         │           │
       ✅ Tìm thấy  ❌ Không tìm
         │           │
         ▼           ▼
   So sánh   Báo lỗi "Sai
   bcrypt    tên đăng nhập"
         │           
         │    ┌──────────────┐
         │    │ Quay lại    │
         │    │ /dang-nhap  │
         │    └──────────────┘
         │
    ┌────┴────┐
    │          │
  ✅ Đúng   ❌ Sai
    │          │
    ▼          ▼
  Lưu   Báo lỗi "Sai
  session  mật khẩu"
    │
    ▼
  ✅ Thành công
  req.session.user = { id, ten_dang_nhap, vai_tro }
  Redirect /dashboard (admin) hoặc /trang-chu (user)
```

### 4.2. Luồng Thêm Sản phẩm

```
┌──────────────────────────────────────────┐
│ Admin điền form (ten_sp, gia_ban, ...)  │
└─────────────────┬────────────────────────┘
                  │ POST /san-pham/tao
                  ▼
┌──────────────────────────────────────────┐
│ routes/sanPham.js                        │
│ Validate dữ liệu (kiểm tra bắt buộc)    │
└─────────────────┬────────────────────────┘
                  │
    ┌─────────────┴─────────────┐
    │                           │
  ✅ OK                      ❌ Lỗi
    │                           │
    ▼                           ▼
  Xử lý upload    Báo lỗi + quay lại
  (Multer)       form
    │
    ▼
  INSERT INTO san_pham
  VALUES (ten_sp, gia_ban, ...)
    │
    ├─ ✅ Thành công
    │   Báo cáo "Thêm thành công"
    │   Redirect /san-pham
    │
    └─ ❌ Lỗi (trùng ma_sp, ...)
        Báo cáo "Lỗi thêm"
        Quay lại form
```

---

## 5. CÁC FILE QUAN TRỌNG

### 5.1. `app.js` - Entry Point

```javascript
const express = require('express');
const session = require('express-session');
const app = express();

// Middleware
app.use(express.urlencoded({ extended: true }));  // Parse form
app.use(session({ secret: '...', ... }));         // Session quản lý
app.use(flash());                                   // Flash message

// View engine
app.set('view engine', 'ejs');

// Routes
app.use('/', authRouter);                           // Auth
app.use('/san-pham', sanPhamRouter);               // Sản phẩm
// ... routes khác

// Start server
app.listen(3000, () => console.log('Server chạy tại http://localhost:3000'));
```

### 5.2. Route File - Cấu trúc chuẩn

```javascript
const express = require('express');
const router = express.Router();
const { sql, getPool } = require('../config/database');

// GET - Danh sách
router.get('/', async (req, res) => {
    const pool = await getPool();
    const result = await pool.request()
        .query('SELECT * FROM san_pham ORDER BY ngay_tao DESC');
    
    res.render('san-pham/index', {
        layout: 'layouts/main',
        user: req.session.user,
        danhSach: result.recordset
    });
});

// POST - Thêm
router.post('/tao', async (req, res) => {
    const { ten_sp, gia_ban } = req.body;
    
    if (!ten_sp || !gia_ban) {
        req.flash('error', 'Vui lòng nhập đầy đủ');
        return res.redirect('/san-pham/tao');
    }
    
    const pool = await getPool();
    await pool.request()
        .input('ten_sp', sql.NVarChar, ten_sp)
        .input('gia_ban', sql.Decimal(15,2), parseFloat(gia_ban))
        .query('INSERT INTO san_pham (ten_sp, gia_ban) VALUES (@ten_sp, @gia_ban)');
    
    req.flash('success', 'Thêm thành công');
    res.redirect('/san-pham');
});

module.exports = router;
```

### 5.3. EJS Template - Hiển thị dữ liệu

```ejs
<!-- views/san-pham/index.ejs -->
<h1>Danh sách sản phẩm</h1>

<% if (danhSach.length > 0) { %>
    <table class="table">
        <thead>
            <tr>
                <th>Tên SP</th>
                <th>Giá bán</th>
                <th>Hành động</th>
            </tr>
        </thead>
        <tbody>
            <% danhSach.forEach(sp => { %>
                <tr>
                    <td><%= sp.ten_sp %></td>
                    <td><%= sp.gia_ban.toLocaleString('vi-VN') %> đ</td>
                    <td>
                        <a href="/san-pham/sua/<%= sp.id %>">Sửa</a>
                        <a href="/san-pham/xoa/<%= sp.id %>">Xóa</a>
                    </td>
                </tr>
            <% }); %>
        </tbody>
    </table>
<% } else { %>
    <p>Không có sản phẩm nào</p>
<% } %>
```

---

## 6. VÍ DỤ THỰC TẾ

### 6.1. Ví dụ: Thêm sản phẩm

**Frontend (Form)**
```html
<form method="POST" action="/san-pham/tao" enctype="multipart/form-data">
    <input type="text" name="ten_sp" placeholder="Tên sản phẩm" required>
    <input type="number" name="gia_ban" placeholder="Giá bán" required>
    <input type="number" name="so_luong" placeholder="Số lượng" required>
    <input type="file" name="hinh_anh">
    <button type="submit">Thêm</button>
</form>
```

**Backend (routes/sanPham.js)**
```javascript
router.post('/tao', upload.single('hinh_anh'), async (req, res) => {
    const { ten_sp, gia_ban, so_luong } = req.body;
    const hinh_anh = req.file ? '/uploads/' + req.file.filename : null;
    
    // Validate
    if (!ten_sp || !gia_ban) {
        req.flash('error', 'Vui lòng nhập đầy đủ');
        return res.redirect('/san-pham/tao');
    }
    
    // Lưu vào DB
    const pool = await getPool();
    await pool.request()
        .input('ten_sp', sql.NVarChar, ten_sp)
        .input('gia_ban', sql.Decimal(15,2), parseFloat(gia_ban))
        .input('so_luong', sql.Int, parseInt(so_luong))
        .input('hinh_anh', sql.NVarChar, hinh_anh)
        .query(`INSERT INTO san_pham (ten_sp, gia_ban, so_luong, hinh_anh)
                VALUES (@ten_sp, @gia_ban, @so_luong, @hinh_anh)`);
    
    req.flash('success', 'Thêm sản phẩm thành công');
    res.redirect('/san-pham');
});
```

**SQL Query thực tế**
```sql
INSERT INTO san_pham (ten_sp, gia_ban, so_luong, hinh_anh, ngay_tao)
VALUES (N'Áo thun cotton', 150000, 50, '/uploads/img123.jpg', GETDATE())
```

### 6.2. Ví dụ: Truy vấn JOIN (Danh sách đơn hàng chi tiết)

```javascript
const result = await pool.request()
    .query(`
        SELECT 
            dh.id,
            dh.ma_dh,
            dh.ngay_dat,
            dh.tong_tien,
            dh.trang_thai,
            kh.ho_ten AS khach_hang,
            nv.ho_ten AS nhan_vien
        FROM don_hang dh
        LEFT JOIN khach_hang kh ON dh.khach_hang_id = kh.id
        LEFT JOIN nhan_vien nv ON dh.nhan_vien_id = nv.id
        WHERE dh.trang_thai != 'da_huy'
        ORDER BY dh.ngay_dat DESC
    `);

// Kết quả
console.log(result.recordset);
// [
//   { id: 1, ma_dh: 'DH001', ngay_dat: '2026-03-19T...', 
//     tong_tien: 500000, trang_thai: 'da_giao',
//     khach_hang: 'Nguyen Van A', nhan_vien: 'Quan Tri Vien' },
//   ...
// ]
```

### 6.3. Ví dụ: Transaction (Giao dịch an toàn)

```javascript
// Đặt hàng: trừ tồn kho + tạo đơn hàng (phải thành công hoặc thất bại cả 2)
const pool = await getPool();
const transaction = new sql.Transaction(pool);

try {
    await transaction.begin();
    
    // Bước 1: Tạo đơn hàng
    const insertDH = await new sql.Request(transaction)
        .input('ma_dh', sql.NVarChar, 'DH001')
        .input('tong_tien', sql.Decimal(15,2), 500000)
        .query(`INSERT INTO don_hang (ma_dh, tong_tien)
                OUTPUT INSERTED.id VALUES (@ma_dh, @tong_tien)`);
    
    const donHangId = insertDH.recordset[0].id;
    
    // Bước 2: Trừ tồn kho (nếu lỗi thì rollback)
    await new sql.Request(transaction)
        .input('so_luong', sql.Int, 5)
        .input('san_pham_id', sql.Int, 1)
        .query('UPDATE san_pham SET so_luong = so_luong - @so_luong WHERE id = @san_pham_id');
    
    // Commit nếu thành công
    await transaction.commit();
    console.log('✅ Đặt hàng thành công');
    
} catch (error) {
    // Rollback nếu lỗi
    await transaction.rollback();
    console.log('❌ Lỗi, hoàn tác toàn bộ');
}
```

---

## 📌 LƯU Ý QUAN TRỌNG

### ⚠️ Bảo mật SQL
```javascript
// ❌ KHÔNG - SQL Injection
const query = `SELECT * FROM tai_khoan WHERE username = '${username}'`;

// ✅ CÓ - Parameterized query (An toàn)
const result = await pool.request()
    .input('username', sql.NVarChar, username)
    .query('SELECT * FROM tai_khoan WHERE ten_dang_nhap = @username');
```

### ⚠️ Xác thực & Phân quyền
```javascript
// Middleware kiểm tra đăng nhập
function isAuthenticated(req, res, next) {
    if (req.session && req.session.user) {
        return next();
    }
    res.redirect('/dang-nhap');
}

// Middleware kiểm tra admin
function isAdmin(req, res, next) {
    if (req.session && req.session.user && req.session.user.vai_tro === 'admin') {
        return next();
    }
    res.redirect('/trang-chu');
}

// Sử dụng
app.use('/san-pham', isAuthenticated, isAdmin, sanPhamRouter);
```

### ⚠️ Xử lý lỗi
```javascript
try {
    const pool = await getPool();
    const result = await pool.request().query('SELECT 1');
    res.json({ success: true, data: result.recordset });
} catch (error) {
    console.error('Lỗi:', error.message);
    res.status(500).json({ success: false, message: 'Có lỗi xảy ra' });
}
```

---

## 🔗 LIÊN KẾT HỮU ÍCH

- [mssql npm](https://www.npmjs.com/package/mssql) - SQL Server driver
- [Express.js](https://expressjs.com/) - Web framework
- [EJS](https://ejs.co/) - Template engine
- [bcryptjs](https://www.npmjs.com/package/bcryptjs) - Mã hóa mật khẩu
