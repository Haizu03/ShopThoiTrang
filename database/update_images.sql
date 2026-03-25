USE shop_thoi_trang;

-- =============================================
-- CAP NHAT HINH ANH THUC TE + GIOI TINH
-- =============================================

-- === AO NAM (danh_muc_id = 1) ===
UPDATE san_pham SET 
    hinh_anh = 'https://images.unsplash.com/photo-1521572163474-6864f9cf17ab?w=400&q=80',
    gioi_tinh = N'Nam'
WHERE id = 1; -- Ao thun basic cotton

UPDATE san_pham SET 
    hinh_anh = 'https://images.unsplash.com/photo-1596755094514-f87e34085b2c?w=400&q=80',
    gioi_tinh = N'Nam'
WHERE id = 2; -- Ao so mi cong so

UPDATE san_pham SET 
    hinh_anh = 'https://images.unsplash.com/photo-1556821840-3a63f95609a7?w=400&q=80',
    gioi_tinh = N'Unisex'
WHERE id = 9; -- Ao Hoodie Unisex

UPDATE san_pham SET 
    hinh_anh = 'https://images.unsplash.com/photo-1625910513413-5fc421e0fd4f?w=400&q=80',
    gioi_tinh = N'Nam'
WHERE id = 10; -- Ao Polo Classic

UPDATE san_pham SET 
    hinh_anh = 'https://images.unsplash.com/photo-1591047139829-d91aecb6caea?w=400&q=80',
    gioi_tinh = N'Nam',
    danh_muc_id = 8
WHERE id = 11; -- Ao Khoac Bomber -> chuyen sang danh muc Ao khoac

UPDATE san_pham SET 
    hinh_anh = 'https://images.unsplash.com/photo-1583743814966-8936f5b7be1a?w=400&q=80',
    gioi_tinh = N'Unisex'
WHERE id = 12; -- Ao Thun Oversize

UPDATE san_pham SET 
    hinh_anh = 'https://images.unsplash.com/photo-1602810318383-e386cc2a3ccf?w=400&q=80',
    gioi_tinh = N'Nam'
WHERE id = 13; -- Ao So Mi Ke Soc

-- === QUAN NAM (danh_muc_id = 2) ===
UPDATE san_pham SET 
    hinh_anh = 'https://images.unsplash.com/photo-1542272604-787c3835535d?w=400&q=80',
    gioi_tinh = N'Nam'
WHERE id = 3; -- Quan jean slim fit

UPDATE san_pham SET 
    hinh_anh = 'https://images.unsplash.com/photo-1473966968600-fa801b869a1a?w=400&q=80',
    gioi_tinh = N'Nam'
WHERE id = 4; -- Quan kaki nam

UPDATE san_pham SET 
    hinh_anh = 'https://images.unsplash.com/photo-1591195853828-11db59a44f6b?w=400&q=80',
    gioi_tinh = N'Nam'
WHERE id = 14; -- Quan Short The Thao

UPDATE san_pham SET 
    hinh_anh = 'https://images.unsplash.com/photo-1552902865-b72c031ac5ea?w=400&q=80',
    gioi_tinh = N'Nam'
WHERE id = 17; -- Quan Jogger Thun

UPDATE san_pham SET 
    hinh_anh = 'https://images.unsplash.com/photo-1604176354204-9268737828e4?w=400&q=80',
    gioi_tinh = N'Nam'
WHERE id = 19; -- Quan Jean Rach Goi

UPDATE san_pham SET 
    hinh_anh = 'https://images.unsplash.com/photo-1624378439575-d8705ad7ae80?w=400&q=80',
    gioi_tinh = N'Nam'
WHERE id = 20; -- Quan Kaki Ong Rong

UPDATE san_pham SET 
    hinh_anh = 'https://images.unsplash.com/photo-1594938298603-c8148c4dae35?w=400&q=80',
    gioi_tinh = N'Nam'
WHERE id = 21; -- Quan Tay Cong So

-- === VAY/DAM (danh_muc_id = 3) ===
UPDATE san_pham SET 
    hinh_anh = 'https://images.unsplash.com/photo-1595777457583-95e059d581b8?w=400&q=80',
    gioi_tinh = N'Nữ'
WHERE id = 5; -- Vay lien cong so

UPDATE san_pham SET 
    hinh_anh = 'https://images.unsplash.com/photo-1566174053879-31528523f8ae?w=400&q=80',
    gioi_tinh = N'Nữ'
WHERE id = 6; -- Dam du tiec

UPDATE san_pham SET 
    hinh_anh = 'https://images.unsplash.com/photo-1583496661160-fb5886a0aaaa?w=400&q=80',
    gioi_tinh = N'Nữ'
WHERE id = 22; -- Chan Vay Xep Ly

UPDATE san_pham SET 
    hinh_anh = 'https://images.unsplash.com/photo-1572804013309-59a88b7e92f1?w=400&q=80',
    gioi_tinh = N'Nữ'
WHERE id = 23; -- Dam Maxi Hoa Nhi

UPDATE san_pham SET 
    hinh_anh = 'https://images.unsplash.com/photo-1585487000160-6ebcfceb0d44?w=400&q=80',
    gioi_tinh = N'Nữ'
WHERE id = 24; -- Vay Lien Cong So A-Line

UPDATE san_pham SET 
    hinh_anh = 'https://images.unsplash.com/photo-1518622358385-8ea7d0794bf6?w=400&q=80',
    gioi_tinh = N'Nữ'
WHERE id = 25; -- Dam Cocktail Sequin

-- === GIAY DEP (danh_muc_id = 4) ===
UPDATE san_pham SET 
    hinh_anh = 'https://images.unsplash.com/photo-1542291026-7eec264c27ff?w=400&q=80',
    gioi_tinh = N'Unisex'
WHERE id = 7; -- Giay sneaker

UPDATE san_pham SET 
    hinh_anh = 'https://images.unsplash.com/photo-1608256246200-53e635b5b65f?w=400&q=80',
    gioi_tinh = N'Nam'
WHERE id = 26; -- Giay Boot Co Cao

UPDATE san_pham SET 
    hinh_anh = 'https://images.unsplash.com/photo-1543163521-1bf539c55dd2?w=400&q=80',
    gioi_tinh = N'Nữ'
WHERE id = 27; -- Giay Cao Got Mui Nhon

UPDATE san_pham SET 
    hinh_anh = 'https://images.unsplash.com/photo-1600185365926-3a2ce3cdb9eb?w=400&q=80',
    gioi_tinh = N'Unisex'
WHERE id = 28; -- Sneaker The Thao

UPDATE san_pham SET 
    hinh_anh = 'https://images.unsplash.com/photo-1460353581641-37baddab0fa2?w=400&q=80',
    gioi_tinh = N'Unisex'
WHERE id = 29; -- Giay Sneaker Trang

UPDATE san_pham SET 
    hinh_anh = 'https://images.unsplash.com/photo-1603487742131-4160ec999306?w=400&q=80',
    gioi_tinh = N'Nữ'
WHERE id = 30; -- Dep Sandal Nu

-- === PHU KIEN (danh_muc_id = 5) ===
UPDATE san_pham SET 
    hinh_anh = 'https://images.unsplash.com/photo-1584917865442-de89df76afd3?w=400&q=80',
    gioi_tinh = N'Nữ'
WHERE id = 8; -- Tui xach nu

UPDATE san_pham SET 
    hinh_anh = 'https://images.unsplash.com/photo-1553062407-98eeb64c6a62?w=400&q=80',
    gioi_tinh = N'Unisex'
WHERE id = 31; -- Balo Thoi Trang

UPDATE san_pham SET 
    hinh_anh = 'https://images.unsplash.com/photo-1591561954557-26941169b49e?w=400&q=80',
    gioi_tinh = N'Nữ'
WHERE id = 32; -- Tui Xach Tote

UPDATE san_pham SET 
    hinh_anh = 'https://images.unsplash.com/photo-1588850561407-ed78c334e67a?w=400&q=80',
    gioi_tinh = N'Unisex'
WHERE id = 33; -- Mu Bucket Hat

UPDATE san_pham SET 
    hinh_anh = 'https://images.unsplash.com/photo-1624222247344-550fb60583dc?w=400&q=80',
    gioi_tinh = N'Nam'
WHERE id = 34; -- That Lung Da Nam

UPDATE san_pham SET 
    hinh_anh = 'https://images.unsplash.com/photo-1572635196237-14b3f281503f?w=400&q=80',
    gioi_tinh = N'Unisex'
WHERE id = 35; -- Kinh Mat Thoi Trang

UPDATE san_pham SET 
    hinh_anh = 'https://images.unsplash.com/photo-1524592094714-0f0654e20314?w=400&q=80',
    gioi_tinh = N'Unisex'
WHERE id = 36; -- Dong Ho Thoi Trang

UPDATE san_pham SET 
    hinh_anh = 'https://images.unsplash.com/photo-1548036328-c9fa89d128fa?w=400&q=80',
    gioi_tinh = N'Unisex'
WHERE id = 37; -- Tui Deo Cheo Mini

-- =============================================
-- THEM SAN PHAM MOI (AO NU, QUAN NU, DO THE THAO, TUI XACH)
-- =============================================

-- Ao nu (danh_muc_id = 6)
INSERT INTO san_pham (ma_sp, ten_sp, danh_muc_id, gia_nhap, gia_ban, so_luong, kich_thuoc, mau_sac, chat_lieu, hinh_anh, mo_ta, gioi_tinh) VALUES
(N'SP035', N'Áo Blouse Nữ Thanh Lịch', 6, 180000, 290000, 50, N'S,M,L', N'Trắng', N'Voan', 'https://images.unsplash.com/photo-1564257631407-4deb1f99d992?w=400&q=80', N'Áo blouse nữ phong cách thanh lịch', N'Nữ'),
(N'SP036', N'Áo Thun Nữ Crop Top', 6, 80000, 159000, 80, N'S,M,L', N'Đen', N'Cotton', 'https://images.unsplash.com/photo-1503342217505-b0a15ec3261c?w=400&q=80', N'Áo thun crop top năng động', N'Nữ'),
(N'SP037', N'Áo Sơ Mi Nữ Công Sở', 6, 160000, 279000, 40, N'S,M,L,XL', N'Xanh nhạt', N'Lụa', 'https://images.unsplash.com/photo-1598554747436-c9293d6a588f?w=400&q=80', N'Áo sơ mi nữ thanh lịch cho công sở', N'Nữ');

-- Quan nu (danh_muc_id = 7)
INSERT INTO san_pham (ma_sp, ten_sp, danh_muc_id, gia_nhap, gia_ban, so_luong, kich_thuoc, mau_sac, chat_lieu, hinh_anh, mo_ta, gioi_tinh) VALUES
(N'SP038', N'Quần Jean Nữ Ống Rộng', 7, 200000, 350000, 45, N'26,27,28,29,30', N'Xanh nhạt', N'Denim', 'https://images.unsplash.com/photo-1541099649105-f69ad21f3246?w=400&q=80', N'Quần jean nữ ống rộng thời trang', N'Nữ'),
(N'SP039', N'Quần Legging Nữ', 7, 90000, 169000, 100, N'S,M,L,XL', N'Đen', N'Thun co giãn', 'https://images.unsplash.com/photo-1506629082955-511b1aa562c8?w=400&q=80', N'Quần legging co giãn thoải mái', N'Nữ'),
(N'SP040', N'Quần Culottes Nữ', 7, 150000, 259000, 35, N'S,M,L', N'Nâu', N'Linen', 'https://images.unsplash.com/photo-1594633312681-425c7b97ccd1?w=400&q=80', N'Quần culottes ống rộng thanh lịch', N'Nữ');

-- Ao khoac (danh_muc_id = 8)
INSERT INTO san_pham (ma_sp, ten_sp, danh_muc_id, gia_nhap, gia_ban, so_luong, kich_thuoc, mau_sac, chat_lieu, hinh_anh, mo_ta, gioi_tinh) VALUES
(N'SP041', N'Áo Khoác Jean Nữ', 8, 250000, 420000, 30, N'S,M,L', N'Xanh', N'Denim', 'https://images.unsplash.com/photo-1527016021513-b09758b777bd?w=400&q=80', N'Áo khoác jean nữ cá tính', N'Nữ'),
(N'SP042', N'Áo Khoác Blazer Nam', 8, 350000, 590000, 25, N'M,L,XL,XXL', N'Đen', N'Polyester', 'https://images.unsplash.com/photo-1507679799987-c73779587ccf?w=400&q=80', N'Áo blazer nam lịch lãm', N'Nam');

-- Do the thao (danh_muc_id = 9)
INSERT INTO san_pham (ma_sp, ten_sp, danh_muc_id, gia_nhap, gia_ban, so_luong, kich_thuoc, mau_sac, chat_lieu, hinh_anh, mo_ta, gioi_tinh) VALUES
(N'SP043', N'Bộ Đồ Thể Thao Nam', 9, 200000, 350000, 40, N'M,L,XL', N'Đen đỏ', N'Thun thể thao', 'https://images.unsplash.com/photo-1515886657613-9f3515b0c78f?w=400&q=80', N'Bộ đồ thể thao nam năng động', N'Nam'),
(N'SP044', N'Set Đồ Tập Gym Nữ', 9, 180000, 320000, 50, N'S,M,L', N'Hồng', N'Spandex', 'https://images.unsplash.com/photo-1518310383802-640c2de311b2?w=400&q=80', N'Set đồ tập gym nữ co giãn', N'Nữ'),
(N'SP045', N'Áo Tank Top Thể Thao', 9, 80000, 149000, 60, N'S,M,L,XL', N'Xanh lá', N'Dri-fit', 'https://images.unsplash.com/photo-1571019614242-c5c5dee9f50b?w=400&q=80', N'Áo tank top thoáng mát', N'Unisex');

-- Tui xach (danh_muc_id = 10)
INSERT INTO san_pham (ma_sp, ten_sp, danh_muc_id, gia_nhap, gia_ban, so_luong, kich_thuoc, mau_sac, chat_lieu, hinh_anh, mo_ta, gioi_tinh) VALUES
(N'SP046', N'Túi Xách Da Nữ Cao Cấp', 10, 400000, 680000, 20, N'Free size', N'Nâu', N'Da PU', 'https://images.unsplash.com/photo-1548036328-c9fa89d128fa?w=400&q=80', N'Túi xách da nữ thiết kế sang trọng', N'Nữ'),
(N'SP047', N'Túi Đeo Vai Canvas', 10, 120000, 220000, 40, N'Free size', N'Kem', N'Canvas', 'https://images.unsplash.com/photo-1590874103328-eac38a683ce7?w=400&q=80', N'Túi canvas đeo vai phong cách', N'Unisex'),
(N'SP048', N'Clutch Dự Tiệc', 10, 200000, 350000, 25, N'Free size', N'Đen', N'Da bóng', 'https://images.unsplash.com/photo-1566150905458-1bf1fc113f0d?w=400&q=80', N'Clutch dự tiệc thanh lịch', N'Nữ');

PRINT N'Da cap nhat tat ca san pham voi hinh anh thuc te!';
