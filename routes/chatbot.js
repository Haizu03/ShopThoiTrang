const express = require('express');
const router = express.Router();
const { sql, getPool } = require('../config/database');

// ============================================
// AI CHATBOX - TƯ VẤN THỜI TRANG
// ============================================

// Bảng size theo số đo
const SIZE_CHART = {
    ao: [
        { size: 'XS', nguc: [76, 82], eo: [58, 64], canNang: [40, 48], chieuCao: [150, 158] },
        { size: 'S', nguc: [82, 88], eo: [64, 70], canNang: [48, 55], chieuCao: [155, 163] },
        { size: 'M', nguc: [88, 94], eo: [70, 76], canNang: [55, 63], chieuCao: [160, 170] },
        { size: 'L', nguc: [94, 100], eo: [76, 82], canNang: [63, 72], chieuCao: [165, 175] },
        { size: 'XL', nguc: [100, 106], eo: [82, 88], canNang: [72, 82], chieuCao: [170, 180] },
        { size: 'XXL', nguc: [106, 114], eo: [88, 96], canNang: [82, 95], chieuCao: [175, 185] }
    ],
    quan: [
        { size: 'XS', eo: [58, 64], mong: [82, 88], canNang: [40, 48], chieuCao: [150, 158] },
        { size: 'S', eo: [64, 70], mong: [88, 94], canNang: [48, 55], chieuCao: [155, 163] },
        { size: 'M', eo: [70, 76], mong: [94, 100], canNang: [55, 63], chieuCao: [160, 170] },
        { size: 'L', eo: [76, 82], mong: [100, 106], canNang: [63, 72], chieuCao: [165, 175] },
        { size: 'XL', eo: [82, 88], mong: [106, 112], canNang: [72, 82], chieuCao: [170, 180] },
        { size: 'XXL', eo: [88, 96], mong: [112, 120], canNang: [82, 95], chieuCao: [175, 185] }
    ]
};

// Xu hướng thời trang 2026
const FASHION_TRENDS = [
    {
        name: 'Minimalist Chic',
        desc: 'Phong cách tối giản nhưng tinh tế. Sử dụng tông màu trung tính (beige, trắng, đen, xám) với form dáng sạch sẽ. Ưu tiên chất liệu tốt hơn là chi tiết phức tạp.',
        keywords: ['tối giản', 'minimalist', 'đơn giản', 'basic']
    },
    {
        name: 'Streetwear & Y2K',
        desc: 'Phong cách đường phố kết hợp retro Y2K đang quay trở lại mạnh mẽ. Áo thun oversize, quần cargo, bomber jacket, giày chunky sneaker, phụ kiện nổi bật.',
        keywords: ['streetwear', 'đường phố', 'y2k', 'oversize', 'cargo']
    },
    {
        name: 'Smart Casual',
        desc: 'Kết hợp giữa lịch sự và thoải mái. Áo sơ mi + quần kaki/jean, blazer + áo thun. Phù hợp đi làm, đi chơi, hẹn hò.',
        keywords: ['smart casual', 'công sở', 'lịch sự', 'hẹn hò']
    },
    {
        name: 'Athleisure',
        desc: 'Thể thao kết hợp thời trang. Jogger, áo hoodie, sneaker, legging phối cùng áo khoác thể thao. Thoải mái nhưng vẫn thời thượng.',
        keywords: ['thể thao', 'athleisure', 'sporty', 'gym', 'jogger', 'hoodie']
    },
    {
        name: 'Cottagecore & Soft Girl',
        desc: 'Phong cách nữ tính, nhẹ nhàng. Váy hoa, đầm midi, chất liệu cotton, ren. Tông pastel, phụ kiện vintage.',
        keywords: ['nữ tính', 'vintage', 'hoa', 'pastel', 'cottagecore', 'nhẹ nhàng']
    },
    {
        name: 'Dark Academia',
        desc: 'Lấy cảm hứng từ học thuật cổ điển. Blazer, áo len, quần tây, giày Oxford. Tông nâu, be, xanh rêu. Phong cách tri thức, thanh lịch.',
        keywords: ['dark academia', 'cổ điển', 'vintage', 'blazer', 'oxford']
    },
    {
        name: 'Đồ denim-on-denim',
        desc: 'Xu hướng phối jean toàn bộ outfit. Áo jean + quần jean tone-sur-tone hoặc mix nhiều wash khác nhau. Kết hợp với boots hoặc sneaker.',
        keywords: ['denim', 'jean', 'jeans']
    },
    {
        name: 'Phối màu color block',
        desc: 'Phối 2-3 màu tương phản rõ giữa các items. Ví dụ: áo cam + quần xanh navy, hoặc áo vàng + quần tím. Nổi bật và tự tin.',
        keywords: ['color block', 'phối màu', 'màu sắc', 'nổi bật']
    }
];

// Lời khuyên phối đồ theo dáng người
const BODY_TYPE_ADVICE = {
    thin: {
        label: 'Người gầy / thanh mảnh',
        tips: [
            'Nên chọn áo có phần vai rộng để tạo dáng cân đối',
            'Quần có đường kẻ dọc giúp tạo chiều sâu',
            'Áo layer nhiều lớp tạo cảm giác đầy đặn hơn',
            'Tránh quần áo quá rộng (bơi), chọn form slim fit hoặc regular fit',
            'Màu sáng và họa tiết ngang giúp tạo cảm giác đầy đặn'
        ]
    },
    normal: {
        label: 'Người cân đối',
        tips: [
            'Bạn có lợi thế mặc được hầu hết phong cách!',
            'Thử nghiệm với nhiều form dáng: slim, regular, oversize',
            'Phối layer để tạo điểm nhấn',
            'Đầu tư vào chất liệu tốt vì form dáng không phải vấn đề',
            'Chú ý phụ kiện để nâng cấp outfit'
        ]
    },
    overweight: {
        label: 'Người đầy đặn',
        tips: [
            'Chọn quần áo form regular fit hoặc hơi rộng, tránh quá bó',
            'Tông màu tối (đen, navy, xám đậm) tạo cảm giác thon gọn',
            'Đường kẻ dọc rất tốt cho visual thon dài',
            'Áo một màu đơn sắc tạo sự liền mạch',
            'V-neck dài hơn tạo cảm giác cổ thon, mặt gầy',
            'Chất liệu rũ, mềm tốt hơn chất liệu cứng'
        ]
    }
};

// Hàm xác định dáng người từ BMI
function getBodyType(bmi) {
    if (bmi < 18.5) return 'thin';
    if (bmi < 25) return 'normal';
    return 'overweight';
}

// Hàm gợi ý size áo
function suggestTopSize(profile) {
    const scores = {};
    SIZE_CHART.ao.forEach(s => {
        let score = 0;
        if (profile.vong_1 && profile.vong_1 >= s.nguc[0] && profile.vong_1 <= s.nguc[1]) score += 3;
        if (profile.vong_2 && profile.vong_2 >= s.eo[0] && profile.vong_2 <= s.eo[1]) score += 2;
        if (profile.can_nang && profile.can_nang >= s.canNang[0] && profile.can_nang <= s.canNang[1]) score += 2;
        if (profile.chieu_cao && profile.chieu_cao >= s.chieuCao[0] && profile.chieu_cao <= s.chieuCao[1]) score += 1;
        if (score > 0) scores[s.size] = score;
    });
    const sorted = Object.entries(scores).sort((a, b) => b[1] - a[1]);
    return sorted.length > 0 ? sorted[0][0] : null;
}

// Hàm gợi ý size quần
function suggestBottomSize(profile) {
    const scores = {};
    SIZE_CHART.quan.forEach(s => {
        let score = 0;
        if (profile.vong_2 && profile.vong_2 >= s.eo[0] && profile.vong_2 <= s.eo[1]) score += 3;
        if (profile.vong_3 && profile.vong_3 >= s.mong[0] && profile.vong_3 <= s.mong[1]) score += 3;
        if (profile.can_nang && profile.can_nang >= s.canNang[0] && profile.can_nang <= s.canNang[1]) score += 2;
        if (profile.chieu_cao && profile.chieu_cao >= s.chieuCao[0] && profile.chieu_cao <= s.chieuCao[1]) score += 1;
        if (score > 0) scores[s.size] = score;
    });
    const sorted = Object.entries(scores).sort((a, b) => b[1] - a[1]);
    return sorted.length > 0 ? sorted[0][0] : null;
}

// Phân tích ý định người dùng
function analyzeIntent(message) {
    const msg = message.toLowerCase().trim();

    // Chào hỏi
    if (/^(xin chào|chào|hello|hi|hey|alo|chào bạn|xin chao)/.test(msg)) {
        return { intent: 'greeting' };
    }

    // Cảm ơn / tạm biệt
    if (/^(cảm ơn|cam on|thanks|thank|bye|tạm biệt|tam biet)/.test(msg)) {
        return { intent: 'goodbye' };
    }

    // Gợi ý size / tư vấn dáng người
    if (/gợi ý size|goi y size|tư vấn size|tu van size|size (của|cua) (tôi|toi|mình|minh)|size phù hợp|size phu hop|chọn size|chon size|nên mặc size|nen mac size/.test(msg)) {
        return { intent: 'size_recommend' };
    }

    // Gợi ý sản phẩm theo dáng người
    if (/gợi ý (sản phẩm|san pham|đồ|do|quần áo)|phù hợp (với |voi )?(tôi|toi|mình|minh|em)|nên mua gì|nen mua gi|mặc gì|mac gi|hợp (với )?(tôi|mình|em)|tư vấn (sản phẩm|đồ|quần áo)|tu van (san pham|do|quan ao)/.test(msg)) {
        return { intent: 'product_recommend' };
    }

    // Xu hướng thời trang
    if (/xu hướng|xu huong|trend|thời trang|thoi trang|gu|phong cách|phong cach|fashion|hot|mới nhất|moi nhat|phối đồ|phoi do|outfit/.test(msg)) {
        // Tìm trend cụ thể
        for (const trend of FASHION_TRENDS) {
            for (const kw of trend.keywords) {
                if (msg.includes(kw)) {
                    return { intent: 'trend_specific', trend };
                }
            }
        }
        return { intent: 'trend_general' };
    }

    // Tìm sản phẩm cụ thể
    const productKeywords = ['áo', 'ao', 'quần', 'quan', 'váy', 'vay', 'đầm', 'dam', 'giày', 'giay',
        'dép', 'dep', 'túi', 'tui', 'balo', 'mũ', 'mu', 'nón', 'non', 'kính', 'kinh',
        'đồng hồ', 'dong ho', 'thắt lưng', 'that lung', 'phụ kiện', 'phu kien',
        'hoodie', 'bomber', 'polo', 'jean', 'kaki', 'sneaker', 'boot', 'sandal',
        'sơ mi', 'so mi', 'thun', 'jogger', 'short', 'áo khoác', 'ao khoac',
        'thể thao', 'the thao', 'maxi', 'cocktail', 'tote', 'nam', 'nữ', 'nu'];

    for (const kw of productKeywords) {
        if (msg.includes(kw)) {
            return { intent: 'search_product', keyword: msg };
        }
    }

    // Hỏi giá
    if (/giá|gia|bao nhiêu|bao nhieu|rẻ|re|đắt|dat|mắc|mac|tầm giá|tam gia/.test(msg)) {
        return { intent: 'search_product', keyword: msg };
    }

    // Hỏi về shop
    if (/shop|cửa hàng|cua hang|địa chỉ|dia chi|liên hệ|lien he|hotline|số điện thoại|so dien thoai/.test(msg)) {
        return { intent: 'shop_info' };
    }

    // Mặc định - không hiểu rõ
    return { intent: 'unknown' };
}

// Tìm sản phẩm trong DB
async function searchProducts(keyword, gioiTinh, limit = 5) {
    const pool = await getPool();
    let query = `SELECT TOP ${Math.min(limit, 10)} sp.*, dm.ten_danh_muc
        FROM san_pham sp
        LEFT JOIN danh_muc dm ON sp.danh_muc_id = dm.id
        WHERE sp.trang_thai = 1 AND sp.so_luong > 0`;

    const request = pool.request();

    // Xây dựng tìm kiếm thông minh
    const searchTerms = keyword.replace(/tìm|tim|có|co|cho|xem|muốn|muon|mua|cần|can|tôi|toi|mình|minh|em|bạn|ban/gi, '').trim();

    if (searchTerms) {
        query += ` AND (sp.ten_sp LIKE @kw OR sp.mo_ta LIKE @kw OR dm.ten_danh_muc LIKE @kw
            OR sp.mau_sac LIKE @kw OR sp.chat_lieu LIKE @kw)`;
        request.input('kw', sql.NVarChar, `%${searchTerms}%`);
    }

    if (gioiTinh && (gioiTinh === 'Nam' || gioiTinh === 'Nữ')) {
        query += ` AND (sp.gioi_tinh = @gt OR sp.gioi_tinh = N'Unisex')`;
        request.input('gt', sql.NVarChar, gioiTinh);
    }

    query += ' ORDER BY sp.ngay_tao DESC';

    const result = await request.query(query);
    return result.recordset;
}

// API chatbox
router.post('/api/chatbox', async (req, res) => {
    try {
        const { message } = req.body;
        if (!message || typeof message !== 'string' || message.trim().length === 0) {
            return res.json({ success: false, reply: 'Vui lòng nhập tin nhắn.' });
        }

        // Giới hạn độ dài tin nhắn
        const userMessage = message.trim().substring(0, 500);
        const userId = req.session.user.id;

        // Lấy thông tin profile
        const pool = await getPool();
        const profileResult = await pool.request()
            .input('id', sql.Int, userId)
            .query('SELECT ho_ten, gioi_tinh, chieu_cao, can_nang, vong_1, vong_2, vong_3 FROM tai_khoan WHERE id = @id');
        const profile = profileResult.recordset[0] || {};

        // Phân tích ý định
        const { intent, keyword, trend } = analyzeIntent(userMessage);
        let reply = '';
        let products = [];

        switch (intent) {
            case 'greeting': {
                const name = profile.ho_ten ? profile.ho_ten.split(' ').pop() : 'bạn';
                reply = `Xin chào ${name}! 👋 Mình là trợ lý thời trang AI của Shop. Mình có thể giúp bạn:\n\n` +
                    `🛍️ **Tư vấn sản phẩm** — hỏi về áo, quần, váy, giày,...\n` +
                    `📏 **Gợi ý size** — dựa trên số đo của bạn\n` +
                    `🔥 **Xu hướng thời trang** — phong cách hot nhất hiện nay\n` +
                    `👗 **Gợi ý phối đồ** — theo dáng người và sở thích\n\n` +
                    `Hãy hỏi mình bất cứ điều gì nhé!`;
                break;
            }

            case 'goodbye': {
                reply = `Cảm ơn bạn đã trò chuyện! 😊 Nếu cần tư vấn thêm, cứ nhắn mình nhé. Chúc bạn mua sắm vui vẻ! 🛍️`;
                break;
            }

            case 'size_recommend': {
                if (!profile.chieu_cao && !profile.can_nang && !profile.vong_1) {
                    reply = `📏 Để gợi ý size chính xác, mình cần biết số đo của bạn.\n\n` +
                        `Hãy cập nhật **số đo hình thể** tại trang [Thông tin cá nhân](/thong-tin) nhé! ` +
                        `Bao gồm: chiều cao, cân nặng, vòng 1-2-3.\n\n` +
                        `Sau khi cập nhật, quay lại hỏi mình nhé! 😊`;
                } else {
                    const topSize = suggestTopSize(profile);
                    const bottomSize = suggestBottomSize(profile);

                    reply = `📏 **Gợi ý size cho bạn:**\n\n`;
                    reply += `📋 **Số đo hiện tại:**\n`;
                    if (profile.chieu_cao) reply += `• Chiều cao: ${profile.chieu_cao} cm\n`;
                    if (profile.can_nang) reply += `• Cân nặng: ${profile.can_nang} kg\n`;
                    if (profile.vong_1) reply += `• Vòng ngực: ${profile.vong_1} cm\n`;
                    if (profile.vong_2) reply += `• Vòng eo: ${profile.vong_2} cm\n`;
                    if (profile.vong_3) reply += `• Vòng mông: ${profile.vong_3} cm\n`;

                    if (profile.chieu_cao && profile.can_nang) {
                        const bmi = (profile.can_nang / ((profile.chieu_cao / 100) ** 2)).toFixed(1);
                        reply += `• BMI: ${bmi}\n`;
                    }

                    reply += `\n👕 **Size áo gợi ý:** ${topSize || 'Chưa đủ dữ liệu'}`;
                    reply += `\n👖 **Size quần gợi ý:** ${bottomSize || 'Chưa đủ dữ liệu'}`;

                    reply += `\n\n💡 *Lưu ý: Đây là gợi ý tham khảo, size thực tế có thể chênh lệch tùy nhãn hiệu và kiểu dáng.*`;

                    if (!profile.vong_1 || !profile.vong_2 || !profile.vong_3) {
                        reply += `\n\n📐 Để chính xác hơn, hãy bổ sung **số đo 3 vòng** tại [Thông tin cá nhân](/thong-tin).`;
                    }
                }
                break;
            }

            case 'product_recommend': {
                const userGender = profile.gioi_tinh || null;

                if (!profile.chieu_cao && !profile.can_nang) {
                    // Gợi ý chung dựa trên giới tính
                    products = await searchProducts('', userGender, 6);
                    reply = `🛍️ **Sản phẩm gợi ý cho bạn:**\n\n`;
                    if (!products.length) {
                        reply += `Hiện tại chưa có sản phẩm phù hợp. Bạn có thể xem tất cả tại [Cửa hàng](/cua-hang).`;
                    } else {
                        reply += `💡 Cập nhật số đo tại [Thông tin cá nhân](/thong-tin) để nhận gợi ý cá nhân hóa hơn nhé!`;
                    }
                } else {
                    // Gợi ý dựa trên dáng người
                    const bmi = profile.can_nang && profile.chieu_cao
                        ? (profile.can_nang / ((profile.chieu_cao / 100) ** 2))
                        : 22;
                    const bodyType = getBodyType(bmi);
                    const advice = BODY_TYPE_ADVICE[bodyType];

                    products = await searchProducts('', userGender, 6);

                    reply = `👤 **Phân tích dáng người:** ${advice.label}\n`;
                    reply += `📊 BMI: ${bmi.toFixed(1)} | Chiều cao: ${profile.chieu_cao}cm | Cân nặng: ${profile.can_nang}kg\n\n`;
                    reply += `💡 **Mẹo chọn đồ cho bạn:**\n`;
                    advice.tips.forEach(tip => {
                        reply += `• ${tip}\n`;
                    });

                    const topSize = suggestTopSize(profile);
                    const bottomSize = suggestBottomSize(profile);
                    if (topSize || bottomSize) {
                        reply += `\n📏 **Size gợi ý:** Áo ${topSize || '?'} | Quần ${bottomSize || '?'}`;
                    }

                    reply += `\n\n🛍️ **Sản phẩm phù hợp:**`;
                }
                break;
            }

            case 'trend_general': {
                reply = `🔥 **Xu hướng thời trang hot nhất 2026:**\n\n`;
                FASHION_TRENDS.forEach((t, i) => {
                    reply += `${i + 1}. **${t.name}**\n   ${t.desc}\n\n`;
                });
                reply += `💬 Hỏi mình về bất kỳ phong cách nào để biết thêm chi tiết nhé!`;
                break;
            }

            case 'trend_specific': {
                reply = `🔥 **${trend.name}**\n\n${trend.desc}\n\n`;

                // Tìm sản phẩm liên quan
                const trendKeyword = trend.keywords[0];
                products = await searchProducts(trendKeyword, profile.gioi_tinh, 4);

                if (!products.length) {
                    // Thử tìm rộng hơn
                    products = await searchProducts('', profile.gioi_tinh, 4);
                }

                if (products.length) {
                    reply += `🛍️ **Sản phẩm phù hợp phong cách này:**`;
                } else {
                    reply += `Xem thêm sản phẩm tại [Cửa hàng](/cua-hang)!`;
                }
                break;
            }

            case 'search_product': {
                products = await searchProducts(keyword, profile.gioi_tinh, 6);

                if (products.length > 0) {
                    reply = `🔍 **Tìm thấy ${products.length} sản phẩm phù hợp:**`;
                } else {
                    reply = `😕 Không tìm thấy sản phẩm phù hợp với "${userMessage}".\n\n` +
                        `💡 **Gợi ý:** Bạn có thể thử:\n` +
                        `• Tìm theo loại: "áo thun", "quần jean", "váy đầm"\n` +
                        `• Tìm theo giới tính: "đồ nam", "đồ nữ"\n` +
                        `• Xem tất cả tại [Cửa hàng](/cua-hang)`;
                }
                break;
            }

            case 'shop_info': {
                reply = `🏪 **Thông tin Shop Thời Trang**\n\n` +
                    `📍 Shop Thời Trang - Đồ án Cơ sở\n` +
                    `🏫 Trường Đại học Nam Cần Thơ\n` +
                    `🌐 Website: http://localhost:3000\n\n` +
                    `🛍️ [Xem Cửa hàng](/cua-hang) | 📞 [Liên hệ](/lien-he-user)\n\n` +
                    `Mình có thể giúp gì thêm cho bạn?`;
                break;
            }

            default: {
                reply = `🤔 Mình chưa hiểu rõ câu hỏi của bạn. Bạn có thể thử:\n\n` +
                    `🛍️ **"Tìm áo thun nam"** — tìm sản phẩm\n` +
                    `📏 **"Gợi ý size"** — tư vấn size theo số đo\n` +
                    `🔥 **"Xu hướng thời trang"** — trend mới nhất\n` +
                    `👗 **"Gợi ý sản phẩm cho tôi"** — tư vấn theo dáng người\n` +
                    `💬 **"Phối đồ streetwear"** — mẹo phối đồ\n\n` +
                    `Hoặc đơn giản hỏi về: áo, quần, váy, giày, phụ kiện,...`;
                break;
            }
        }

        // Trả về kết quả
        const productCards = products.map(p => ({
            id: p.id,
            ten_sp: p.ten_sp,
            gia_ban: p.gia_ban,
            hinh_anh: p.hinh_anh,
            gioi_tinh: p.gioi_tinh,
            ten_danh_muc: p.ten_danh_muc
        }));

        return res.json({
            success: true,
            reply,
            products: productCards
        });

    } catch (error) {
        console.error('Loi chatbox:', error);
        return res.json({
            success: false,
            reply: 'Xin lỗi, có lỗi xảy ra. Vui lòng thử lại sau! 😅'
        });
    }
});

module.exports = router;
