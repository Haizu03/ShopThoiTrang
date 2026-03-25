const fs = require('fs');
const {
    Document, Packer, Paragraph, TextRun, Table, TableRow, TableCell,
    AlignmentType, HeadingLevel, BorderStyle, WidthType, PageBreak,
    ShadingType, VerticalAlign, TableLayoutType, convertInchesToTwip,
    LevelFormat, UnderlineType, PageNumber, Footer, Header
} = require('docx');

// ===== HELPER FUNCTIONS =====
function heading(text, level = HeadingLevel.HEADING_1, opts = {}) {
    return new Paragraph({
        heading: level,
        alignment: opts.center ? AlignmentType.CENTER : AlignmentType.LEFT,
        spacing: { before: opts.before || 200, after: opts.after || 120 },
        children: [new TextRun({ text, bold: true, font: 'Times New Roman', size: level === HeadingLevel.HEADING_1 ? 32 : level === HeadingLevel.HEADING_2 ? 28 : 26 })]
    });
}

function para(text, opts = {}) {
    return new Paragraph({
        alignment: opts.center ? AlignmentType.CENTER : AlignmentType.JUSTIFIED,
        indent: opts.noIndent ? {} : { firstLine: convertInchesToTwip(0.5) },
        spacing: { after: opts.after || 80, before: opts.before || 0 },
        children: Array.isArray(text) ? text : [new TextRun({ text, font: 'Times New Roman', size: 26, bold: !!opts.bold, italics: !!opts.italic })]
    });
}

function bullet(text, opts = {}) {
    return new Paragraph({
        alignment: AlignmentType.JUSTIFIED,
        spacing: { after: 40 },
        indent: { left: convertInchesToTwip(0.7), hanging: convertInchesToTwip(0.25) },
        children: [new TextRun({ text: '• ' + text, font: 'Times New Roman', size: 26, bold: !!opts.bold })]
    });
}

function numberedItem(num, text) {
    return new Paragraph({
        alignment: AlignmentType.JUSTIFIED,
        spacing: { after: 40 },
        indent: { left: convertInchesToTwip(0.7), hanging: convertInchesToTwip(0.25) },
        children: [new TextRun({ text: `${num}. ${text}`, font: 'Times New Roman', size: 26 })]
    });
}

function emptyLine(count = 1) {
    const lines = [];
    for (let i = 0; i < count; i++) {
        lines.push(new Paragraph({ spacing: { after: 0 }, children: [new TextRun({ text: '', font: 'Times New Roman', size: 26 })] }));
    }
    return lines;
}

function dotLine() {
    return para('....................................................................................................................................................................................................................................', { noIndent: true });
}

const noBorder = { style: BorderStyle.NONE, size: 0, color: 'FFFFFF' };
const thinBorder = { style: BorderStyle.SINGLE, size: 1, color: '000000' };
const borders = { top: thinBorder, bottom: thinBorder, left: thinBorder, right: thinBorder };

function cell(text, opts = {}) {
    return new TableCell({
        width: opts.width ? { size: opts.width, type: WidthType.PERCENTAGE } : undefined,
        shading: opts.header ? { type: ShadingType.SOLID, color: 'D9E2F3' } : undefined,
        verticalAlign: VerticalAlign.CENTER,
        borders,
        children: [new Paragraph({
            alignment: opts.header ? AlignmentType.CENTER : (opts.center ? AlignmentType.CENTER : AlignmentType.LEFT),
            spacing: { before: 20, after: 20 },
            children: [new TextRun({ text: String(text), font: 'Times New Roman', size: 22, bold: !!opts.header || !!opts.bold })]
        })]
    });
}

function headerRow(cells) {
    return new TableRow({ children: cells.map(c => cell(c, { header: true })) });
}

function dataRow(cells) {
    return new TableRow({ children: cells.map(c => cell(c)) });
}

function makeTable(headerCells, dataRows) {
    return new Table({
        width: { size: 100, type: WidthType.PERCENTAGE },
        layout: TableLayoutType.FIXED,
        rows: [
            headerRow(headerCells),
            ...dataRows.map(r => dataRow(r))
        ]
    });
}

function pageBreak() {
    return new Paragraph({ children: [new PageBreak()] });
}

// ===== BUILD DOCUMENT =====

// ----- COVER PAGE -----
const coverSection = [
    ...emptyLine(1),
    para('TRƯỜNG ĐẠI HỌC NAM CẦN THƠ', { center: true, bold: true, noIndent: true }),
    para('KHOA CÔNG NGHỆ THÔNG TIN', { center: true, bold: true, noIndent: true }),
    new Paragraph({
        alignment: AlignmentType.CENTER, spacing: { before: 100, after: 100 },
        children: [new TextRun({ text: '───────────', font: 'Times New Roman', size: 26 })]
    }),
    ...emptyLine(2),
    para([new TextRun({ text: 'Sinh viên: ', font: 'Times New Roman', size: 28, bold: true }), new TextRun({ text: '..................................', font: 'Times New Roman', size: 28 })], { noIndent: true }),
    para([new TextRun({ text: 'MSSV: ', font: 'Times New Roman', size: 28, bold: true }), new TextRun({ text: '..................................', font: 'Times New Roman', size: 28 })], { noIndent: true }),
    para([new TextRun({ text: 'Lớp: ', font: 'Times New Roman', size: 28, bold: true }), new TextRun({ text: '..................................', font: 'Times New Roman', size: 28 })], { noIndent: true }),
    ...emptyLine(3),
    new Paragraph({
        alignment: AlignmentType.CENTER, spacing: { before: 200 },
        children: [new TextRun({ text: 'ĐỒ ÁN CƠ SỞ', font: 'Times New Roman', size: 36, bold: true })]
    }),
    ...emptyLine(1),
    new Paragraph({
        alignment: AlignmentType.CENTER,
        children: [new TextRun({ text: 'TÊN ĐỀ TÀI', font: 'Times New Roman', size: 32, bold: true })]
    }),
    new Paragraph({
        alignment: AlignmentType.CENTER, spacing: { before: 200 },
        children: [new TextRun({ text: 'XÂY DỰNG WEBSITE', font: 'Times New Roman', size: 40, bold: true })]
    }),
    new Paragraph({
        alignment: AlignmentType.CENTER,
        children: [new TextRun({ text: 'QUẢN LÝ SHOP THỜI TRANG', font: 'Times New Roman', size: 40, bold: true })]
    }),
    ...emptyLine(3),
    para('Ngành: Công Nghệ Thông Tin', { center: true, noIndent: true }),
    para('Mã số ngành: 7480201', { center: true, noIndent: true }),
    ...emptyLine(2),
    new Paragraph({
        alignment: AlignmentType.CENTER,
        children: [new TextRun({ text: 'CÁN BỘ HƯỚNG DẪN', font: 'Times New Roman', size: 28, bold: true })]
    }),
    para('..................................', { center: true, noIndent: true }),
    ...emptyLine(5),
    para('Cần Thơ, Tháng 3/2026', { center: true, noIndent: true }),
];

// ----- LỜI CẢM TẠ -----
const camTa = [
    pageBreak(),
    heading('LỜI CẢM TẠ', HeadingLevel.HEADING_1, { center: true }),
    para('Trong quá trình thực hiện đồ án cơ sở "Xây dựng Website Quản Lý Shop Thời Trang", em đã nhận được rất nhiều sự hỗ trợ và giúp đỡ từ nhiều phía.'),
    para('Trước hết, em xin gửi lời cảm ơn chân thành nhất đến quý Thầy/Cô trong Khoa Công nghệ Thông tin, Trường Đại học Nam Cần Thơ đã tận tình giảng dạy, truyền đạt kiến thức nền tảng về lập trình web, cơ sở dữ liệu và phân tích thiết kế hệ thống trong suốt thời gian qua.'),
    para('Đặc biệt, em xin cảm ơn Thầy/Cô hướng dẫn đã dành thời gian quý báu để hướng dẫn, góp ý và định hướng cho em trong suốt quá trình thực hiện đồ án này.'),
    para('Mặc dù đã cố gắng hết sức, nhưng do kiến thức và kinh nghiệm còn hạn chế, đồ án không thể tránh khỏi những thiếu sót. Em rất mong nhận được sự góp ý từ quý Thầy/Cô để đồ án được hoàn thiện hơn.'),
    para('Xin trân trọng cảm ơn!'),
    ...emptyLine(3),
    para('Cần Thơ, ngày ... tháng 3 năm 2026', { noIndent: true, italic: true }),
    para('Người thực hiện', { noIndent: true, bold: true, center: true }),
    ...emptyLine(3),
    para('(Ký tên)', { center: true, noIndent: true }),
];

// ----- LỜI CAM KẾT -----
const camKet = [
    pageBreak(),
    heading('LỜI CAM KẾT', HeadingLevel.HEADING_1, { center: true }),
    para('Tôi xin cam kết đồ án "Xây dựng Website Quản Lý Shop Thời Trang" này là kết quả nghiên cứu, thiết kế và lập trình do chính tôi thực hiện, dựa trên nền tảng kiến thức được học cùng với quá trình tự tìm hiểu, nghiên cứu thêm từ các tài liệu và nguồn thông tin hợp pháp.'),
    para('Tất cả nội dung, ý tưởng, mã nguồn, hình ảnh và dữ liệu trong đồ án đều được tôi tự phát triển hoặc sử dụng từ các nguồn có dẫn chứng, trích dẫn rõ ràng theo đúng quy định về bản quyền và sở hữu trí tuệ.'),
    para('Toàn bộ kết quả trong báo cáo và sản phẩm phần mềm đính kèm phản ánh trung thực quá trình làm việc, không có sự can thiệp, chỉnh sửa hoặc thay đổi với mục đích gian lận.'),
    para('Tôi chịu hoàn toàn trách nhiệm trước pháp luật và quy chế đào tạo của Trường Đại học Nam Cần Thơ về mọi nội dung đã trình bày.'),
    ...emptyLine(3),
    para('Cần Thơ, ngày ... tháng 3 năm 2026', { noIndent: true, italic: true }),
    para('Người thực hiện', { noIndent: true, bold: true, center: true }),
    ...emptyLine(3),
    para('(Ký tên)', { center: true, noIndent: true }),
];

// ----- NHẬN XÉT -----
const nhanXet = [
    pageBreak(),
    heading('NHẬN XÉT ĐÁNH GIÁ CỦA GIÁO VIÊN HƯỚNG DẪN', HeadingLevel.HEADING_1, { center: true }),
    ...emptyLine(2),
    dotLine(), dotLine(), dotLine(), dotLine(), dotLine(),
    dotLine(), dotLine(), dotLine(), dotLine(), dotLine(),
    ...emptyLine(2),
    para('Cần Thơ, ngày .... tháng .... năm 2026', { noIndent: true, italic: true }),

    pageBreak(),
    heading('NHẬN XÉT ĐÁNH GIÁ CỦA GIÁO VIÊN PHẢN BIỆN', HeadingLevel.HEADING_1, { center: true }),
    ...emptyLine(2),
    dotLine(), dotLine(), dotLine(), dotLine(), dotLine(),
    dotLine(), dotLine(), dotLine(), dotLine(), dotLine(),
    ...emptyLine(2),
    para('Cần Thơ, ngày .... tháng .... năm 2026', { noIndent: true, italic: true }),
];

// ----- MỤC LỤC -----
const mucLuc = [
    pageBreak(),
    heading('MỤC LỤC', HeadingLevel.HEADING_1, { center: true }),
    para('CHƯƠNG I: GIỚI THIỆU', { bold: true, noIndent: true }),
    para('    1.1 Đặt vấn đề nghiên cứu', { noIndent: true }),
    para('    1.2 Mục tiêu nghiên cứu', { noIndent: true }),
    para('    1.3 Phạm vi nghiên cứu', { noIndent: true }),
    para('    1.4 Đối tượng nghiên cứu', { noIndent: true }),
    para('CHƯƠNG II: CƠ SỞ LÝ THUYẾT', { bold: true, noIndent: true, before: 100 }),
    para('    2.1 Tổng quan về Node.js và Express.js', { noIndent: true }),
    para('    2.2 Hệ quản trị CSDL Microsoft SQL Server', { noIndent: true }),
    para('    2.3 Template Engine EJS', { noIndent: true }),
    para('    2.4 Bootstrap 5 và Font Awesome', { noIndent: true }),
    para('    2.5 Mô hình MVC', { noIndent: true }),
    para('CHƯƠNG III: PHÂN TÍCH VÀ THIẾT KẾ HỆ THỐNG', { bold: true, noIndent: true, before: 100 }),
    para('    3.1 Mô hình phân rã chức năng (BFD)', { noIndent: true }),
    para('    3.2 Biểu đồ luồng dữ liệu (DFD)', { noIndent: true }),
    para('    3.3 Sơ đồ Use Case', { noIndent: true }),
    para('    3.4 Mô hình thực thể kết hợp (ERD)', { noIndent: true }),
    para('    3.5 Thiết kế cơ sở dữ liệu', { noIndent: true }),
    para('CHƯƠNG IV: CHƯƠNG TRÌNH ỨNG DỤNG', { bold: true, noIndent: true, before: 100 }),
    para('    4.1 Giao diện người dùng', { noIndent: true }),
    para('    4.2 Giao diện quản trị (Admin)', { noIndent: true }),
    para('CHƯƠNG V: THỬ NGHIỆM VÀ ĐÁNH GIÁ', { bold: true, noIndent: true, before: 100 }),
    para('    5.1 Ưu điểm', { noIndent: true }),
    para('    5.2 Nhược điểm', { noIndent: true }),
    para('CHƯƠNG VI: KẾT LUẬN', { bold: true, noIndent: true, before: 100 }),
    para('    6.1 Kết quả đạt được', { noIndent: true }),
    para('    6.2 Hướng phát triển trong tương lai', { noIndent: true }),
    para('    6.3 Kết luận', { noIndent: true }),
    para('TÀI LIỆU THAM KHẢO', { bold: true, noIndent: true, before: 100 }),
];

// ----- CHƯƠNG I -----
const chuong1 = [
    pageBreak(),
    heading('CHƯƠNG I: GIỚI THIỆU', HeadingLevel.HEADING_1, { center: true }),

    heading('1.1 Đặt vấn đề nghiên cứu', HeadingLevel.HEADING_2),
    para('Trong bối cảnh thương mại điện tử phát triển mạnh mẽ tại Việt Nam, ngành thời trang là một trong những lĩnh vực có tốc độ tăng trưởng nhanh nhất trên các nền tảng trực tuyến. Theo thống kê, thị trường thời trang trực tuyến Việt Nam liên tục tăng trưởng với tốc độ trên 20% mỗi năm, cho thấy nhu cầu mua sắm thời trang qua Internet ngày càng lớn.'),
    para('Tuy nhiên, nhiều cửa hàng thời trang vừa và nhỏ vẫn đang quản lý bằng phương pháp thủ công: ghi chép sổ sách, quản lý tồn kho bằng Excel, không có hệ thống theo dõi đơn hàng hay thống kê doanh thu tự động. Điều này dẫn đến nhiều sai sót trong quản lý, mất thời gian và khó mở rộng kinh doanh.'),
    para('Bên cạnh đó, việc tích hợp các tính năng hiện đại như chatbot tư vấn thời trang thông minh, gợi ý kích thước dựa trên số đo cơ thể, hệ thống mã giảm giá... giúp nâng cao trải nghiệm khách hàng và tăng khả năng cạnh tranh.'),
    para([
        new TextRun({ text: 'Xuất phát từ nhu cầu thực tế đó, em đã chọn đề tài ', font: 'Times New Roman', size: 26 }),
        new TextRun({ text: '"Xây dựng Website Quản Lý Shop Thời Trang"', font: 'Times New Roman', size: 26, bold: true }),
        new TextRun({ text: ' nhằm xây dựng một hệ thống web hoàn chỉnh, đáp ứng nhu cầu quản lý của chủ cửa hàng và mua sắm của khách hàng.', font: 'Times New Roman', size: 26 }),
    ]),

    heading('1.2 Mục tiêu nghiên cứu', HeadingLevel.HEADING_2),
    heading('1.2.1 Mục tiêu chung', HeadingLevel.HEADING_3),
    para('Xây dựng một website quản lý shop thời trang hoàn chỉnh với hai phân hệ: quản trị (admin) và người dùng (khách hàng), sử dụng công nghệ Node.js, Express.js kết hợp hệ quản trị cơ sở dữ liệu Microsoft SQL Server 2022.'),
    heading('1.2.2 Mục tiêu cụ thể', HeadingLevel.HEADING_3),
    bullet('Xây dựng hệ thống xác thực và phân quyền với 3 vai trò: Admin, Nhân viên, Người dùng.'),
    bullet('Xây dựng trang quản trị với đầy đủ chức năng CRUD cho: sản phẩm, danh mục, khách hàng, nhân viên, đơn hàng, phiếu nhập hàng, mã giảm giá, liên hệ.'),
    bullet('Xây dựng trang Dashboard tổng quan với biểu đồ doanh thu, thống kê thời gian thực.'),
    bullet('Xây dựng module thống kê và báo cáo: doanh thu theo tháng, sản phẩm bán chạy, tồn kho, khách hàng thân thiết.'),
    bullet('Xây dựng trang người dùng: trang chủ, cửa hàng, giỏ hàng, đặt hàng, theo dõi đơn hàng, hồ sơ cá nhân.'),
    bullet('Tích hợp AI Chatbot tư vấn thời trang: gợi ý size, xu hướng thời trang, tư vấn theo dáng người.'),
    bullet('Xây dựng hệ thống tìm kiếm toàn hệ thống (9 bảng dữ liệu).'),

    heading('1.3 Phạm vi nghiên cứu', HeadingLevel.HEADING_2),
    heading('1.3.1 Không gian', HeadingLevel.HEADING_3),
    para('Hệ thống được xây dựng và triển khai trên môi trường localhost, phục vụ cho mô hình cửa hàng thời trang vừa và nhỏ tại Việt Nam.'),
    heading('1.3.2 Phạm vi thời gian', HeadingLevel.HEADING_3),
    para('Đồ án được thực hiện trong khuôn khổ học kỳ Đồ án Cơ sở, năm học 2025 – 2026.'),

    heading('1.4 Đối tượng nghiên cứu', HeadingLevel.HEADING_2),
    bullet('Quy trình quản lý cửa hàng thời trang: sản phẩm, đơn hàng, kho hàng, khách hàng, nhân viên.'),
    bullet('Công nghệ phát triển web server-side: Node.js, Express.js, EJS, SQL Server.'),
    bullet('Chatbot tư vấn thời trang dựa trên quy tắc (Rule-based AI).'),
    bullet('Giao diện người dùng responsive với Bootstrap 5.'),
];

// ----- CHƯƠNG II -----
const chuong2 = [
    pageBreak(),
    heading('CHƯƠNG II: CƠ SỞ LÝ THUYẾT', HeadingLevel.HEADING_1, { center: true }),

    heading('2.1 Tổng quan về Node.js và Express.js', HeadingLevel.HEADING_2),
    heading('2.1.1 Node.js', HeadingLevel.HEADING_3),
    para('Node.js là một nền tảng phát triển ứng dụng phía server được xây dựng trên engine V8 của Google Chrome. Node.js sử dụng mô hình I/O không đồng bộ (non-blocking I/O), cho phép xử lý nhiều kết nối đồng thời với hiệu suất cao.'),
    para('Ưu điểm:', { bold: true, noIndent: true }),
    bullet('Hiệu suất cao nhờ engine V8 và mô hình event-driven.'),
    bullet('Dùng JavaScript cả frontend và backend, giúp đồng nhất ngôn ngữ lập trình.'),
    bullet('Hệ sinh thái npm đồ sộ với hơn 2 triệu package.'),
    bullet('Phù hợp cho ứng dụng web thời gian thực.'),

    heading('2.1.2 Express.js', HeadingLevel.HEADING_3),
    para('Express.js là framework web phổ biến nhất cho Node.js, cung cấp cơ chế routing, middleware, template engine linh hoạt. Express.js giúp xây dựng ứng dụng web và API một cách nhanh chóng, có cấu trúc rõ ràng.'),
    para('Trong đồ án, Express.js phiên bản 4.18.2 được sử dụng làm framework chính cho toàn bộ hệ thống.'),

    heading('2.2 Hệ quản trị CSDL Microsoft SQL Server 2022', HeadingLevel.HEADING_2),
    para('Microsoft SQL Server 2022 là hệ quản trị cơ sở dữ liệu quan hệ (RDBMS) mạnh mẽ của Microsoft. SQL Server hỗ trợ ngôn ngữ truy vấn T-SQL, stored procedure, transaction, trigger và nhiều tính năng bảo mật nâng cao.'),
    para('Ưu điểm:', { bold: true, noIndent: true }),
    bullet('Hiệu suất truy vấn cao với Query Optimizer thông minh.'),
    bullet('Hỗ trợ Transaction đảm bảo tính toàn vẹn dữ liệu (ACID).'),
    bullet('Bảo mật tốt với Windows Authentication và mã hóa dữ liệu.'),
    bullet('Tích hợp tốt với các ứng dụng trên nền tảng Windows.'),
    para([
        new TextRun({ text: 'Nhược điểm: ', font: 'Times New Roman', size: 26, bold: true }),
        new TextRun({ text: 'Chi phí bản quyền cao cho bản Enterprise; chủ yếu chạy trên Windows.', font: 'Times New Roman', size: 26 }),
    ], { noIndent: true }),
    para([
        new TextRun({ text: 'Trong đồ án, kết nối SQL Server sử dụng driver ', font: 'Times New Roman', size: 26 }),
        new TextRun({ text: 'mssql/msnodesqlv8', font: 'Times New Roman', size: 26, bold: true }),
        new TextRun({ text: ' qua ODBC Driver 18, xác thực bằng Windows Authentication, database tên ', font: 'Times New Roman', size: 26 }),
        new TextRun({ text: 'shop_thoi_trang', font: 'Times New Roman', size: 26, bold: true }),
        new TextRun({ text: ' với collation ', font: 'Times New Roman', size: 26 }),
        new TextRun({ text: 'Vietnamese_CI_AS', font: 'Times New Roman', size: 26, bold: true }),
        new TextRun({ text: '.', font: 'Times New Roman', size: 26 }),
    ]),

    heading('2.3 Template Engine EJS', HeadingLevel.HEADING_2),
    para('EJS (Embedded JavaScript) là template engine cho phép nhúng mã JavaScript trực tiếp vào HTML. EJS sử dụng cú pháp đơn giản với các tag <%= %> để chèn dữ liệu, <% %> để thực thi logic, cho phép render HTML phía server một cách linh hoạt.'),
    para([
        new TextRun({ text: 'Kết hợp với ', font: 'Times New Roman', size: 26 }),
        new TextRun({ text: 'express-ejs-layouts', font: 'Times New Roman', size: 26, bold: true }),
        new TextRun({ text: ', hệ thống có 2 layout chính: layout quản trị (main.ejs) với sidebar menu, và layout người dùng (user.ejs) với navbar trên cùng.', font: 'Times New Roman', size: 26 }),
    ]),

    heading('2.4 Bootstrap 5 và Font Awesome', HeadingLevel.HEADING_2),
    para([
        new TextRun({ text: 'Bootstrap 5.3.2', font: 'Times New Roman', size: 26, bold: true }),
        new TextRun({ text: ' là CSS framework responsive phổ biến nhất, cung cấp hệ thống grid, components (button, card, modal, table...) và utilities giúp xây dựng giao diện nhanh chóng, tương thích đa thiết bị.', font: 'Times New Roman', size: 26 }),
    ]),
    para([
        new TextRun({ text: 'Font Awesome 6.5.0', font: 'Times New Roman', size: 26, bold: true }),
        new TextRun({ text: ' cung cấp bộ icon vector phong phú với hơn 2.000 icon miễn phí, giúp giao diện trực quan và chuyên nghiệp hơn.', font: 'Times New Roman', size: 26 }),
    ]),
    para([
        new TextRun({ text: 'Chart.js 4.4.0', font: 'Times New Roman', size: 26, bold: true }),
        new TextRun({ text: ' là thư viện vẽ biểu đồ JavaScript, được sử dụng để hiển thị biểu đồ doanh thu, biểu đồ tròn danh mục trên trang Dashboard và Thống kê.', font: 'Times New Roman', size: 26 }),
    ]),

    heading('2.5 Mô hình MVC (Model – View – Controller)', HeadingLevel.HEADING_2),
    para('Hệ thống được xây dựng theo mô hình MVC, tách biệt ba thành phần chính:'),
    bullet('Model: Cơ sở dữ liệu SQL Server — lưu trữ và truy xuất dữ liệu qua các câu truy vấn parameterized.'),
    bullet('View: 40 file template EJS tổ chức trong thư mục views/ — hiển thị giao diện cho người dùng.'),
    bullet('Controller: 15 file route trong thư mục routes/ — xử lý logic nghiệp vụ, nhận request và trả response.'),
];

// ----- CHƯƠNG III -----
const chuong3 = [
    pageBreak(),
    heading('CHƯƠNG III: PHÂN TÍCH VÀ THIẾT KẾ HỆ THỐNG', HeadingLevel.HEADING_1, { center: true }),

    heading('3.1 Mô hình phân rã chức năng (BFD)', HeadingLevel.HEADING_2),
    para('Hệ thống "Website Quản Lý Shop Thời Trang" được chia thành 3 phân hệ chính:'),
    ...emptyLine(1),
    para('PHÂN HỆ XÁC THỰC:', { bold: true, noIndent: true }),
    bullet('Đăng nhập'),
    bullet('Đăng ký'),
    bullet('Đăng xuất'),
    bullet('Đổi mật khẩu'),
    bullet('Phân quyền (3 vai trò: admin, nhanvien, nguoidung)'),
    ...emptyLine(1),
    para('PHÂN HỆ QUẢN TRỊ (ADMIN):', { bold: true, noIndent: true }),
    bullet('Dashboard tổng quan'),
    bullet('Quản lý Sản phẩm (CRUD)'),
    bullet('Quản lý Danh mục'),
    bullet('Quản lý Đơn hàng'),
    bullet('Quản lý Khách hàng'),
    bullet('Quản lý Nhân viên'),
    bullet('Nhập hàng'),
    bullet('Thống kê & Báo cáo'),
    bullet('Tìm kiếm nâng cao'),
    bullet('Cài đặt hệ thống'),
    bullet('Quản lý Mã giảm giá'),
    bullet('Quản lý Liên hệ'),
    ...emptyLine(1),
    para('PHÂN HỆ NGƯỜI DÙNG:', { bold: true, noIndent: true }),
    bullet('Trang chủ'),
    bullet('Cửa hàng (lọc, tìm kiếm)'),
    bullet('Chi tiết sản phẩm'),
    bullet('Giỏ hàng'),
    bullet('Đặt hàng & Thanh toán'),
    bullet('Đơn hàng của tôi'),
    bullet('Hồ sơ cá nhân'),
    bullet('AI Chatbot tư vấn'),
    bullet('Liên hệ'),

    heading('3.2 Biểu đồ luồng dữ liệu (DFD)', HeadingLevel.HEADING_2),
    heading('3.2.1 Biểu đồ ngữ cảnh (Mức 0)', HeadingLevel.HEADING_3),
    para('Hệ thống tương tác với 3 tác nhân bên ngoài:'),
    bullet('Khách hàng (Người dùng): Duyệt sản phẩm → Thêm giỏ hàng → Đặt hàng → Theo dõi đơn hàng → Chat tư vấn.'),
    bullet('Admin: Quản lý sản phẩm, đơn hàng, khách hàng, nhân viên, kho hàng, thống kê.'),
    bullet('Hệ thống CSDL (SQL Server): Lưu trữ tất cả dữ liệu của hệ thống qua 12 bảng.'),

    heading('3.2.2 Biểu đồ luồng dữ liệu mức 1', HeadingLevel.HEADING_3),
    para('Hệ thống được phân rã thành các xử lý chính:'),
    makeTable(
        ['STT', 'Xử lý', 'Mô tả', 'Dữ liệu vào', 'Dữ liệu ra'],
        [
            ['1.0', 'Xác thực', 'Đăng nhập, đăng ký, phân quyền', 'Tên đăng nhập, mật khẩu', 'Session user, chuyển hướng'],
            ['2.0', 'QL Sản phẩm', 'Thêm, sửa, xóa, xem SP', 'Thông tin SP, hình ảnh', 'Danh sách SP, chi tiết SP'],
            ['3.0', 'QL Đơn hàng', 'Tạo, cập nhật trạng thái', 'Giỏ hàng, thông tin KH', 'Đơn hàng, chi tiết đơn'],
            ['4.0', 'Mua hàng', 'Duyệt SP, giỏ hàng, đặt hàng', 'Lọc SP, số lượng, mã giảm giá', 'Giỏ hàng, xác nhận đơn'],
            ['5.0', 'Thống kê', 'Báo cáo doanh thu, tồn kho', 'Tháng, năm lọc', 'Biểu đồ, bảng thống kê'],
            ['6.0', 'Chatbot AI', 'Tư vấn size, xu hướng, tìm SP', 'Tin nhắn người dùng', 'Phản hồi chatbot, SP gợi ý'],
        ]
    ),

    heading('3.3 Sơ đồ Use Case', HeadingLevel.HEADING_2),
    para('Hệ thống có 3 actor chính với các use case sau:'),
    makeTable(
        ['Actor', 'Use Case'],
        [
            ['Khách hàng\n(Người dùng)', 'Đăng ký / Đăng nhập / Đổi mật khẩu\nXem trang chủ / Duyệt cửa hàng / Xem chi tiết SP\nThêm/Sửa/Xóa giỏ hàng\nĐặt hàng (áp mã giảm giá)\nXem/Hủy đơn hàng\nCập nhật hồ sơ (avatar, số đo)\nChat với AI Chatbot\nGửi liên hệ'],
            ['Admin', 'Xem Dashboard tổng quan\nCRUD: Sản phẩm, Danh mục, Khách hàng, Nhân viên\nQuản lý đơn hàng (cập nhật trạng thái)\nTạo phiếu nhập hàng\nXem thống kê & In báo cáo\nTìm kiếm toàn hệ thống\nQuản lý mã giảm giá\nPhản hồi liên hệ\nCài đặt hệ thống'],
            ['AI Chatbot', 'Gợi ý size (dựa trên số đo)\nTư vấn xu hướng thời trang 2026\nTìm kiếm sản phẩm\nGợi ý trang phục theo dáng người'],
        ]
    ),

    heading('3.4 Mô hình thực thể kết hợp (ERD)', HeadingLevel.HEADING_2),
    para('Cơ sở dữ liệu gồm 12 bảng với 11 mối quan hệ khóa ngoại. Sơ đồ quan hệ giữa các bảng:'),
    ...emptyLine(1),
    para('tai_khoan ─1:1─▶ nhan_vien (tai_khoan_id)', { noIndent: true }),
    para('tai_khoan ─1:N─▶ don_hang (tai_khoan_id)', { noIndent: true }),
    para('tai_khoan ─1:N─▶ lien_he (tai_khoan_id)', { noIndent: true }),
    para('khach_hang ─1:N─▶ don_hang (khach_hang_id)', { noIndent: true }),
    para('nhan_vien ─1:N─▶ don_hang (nhan_vien_id)', { noIndent: true }),
    para('nhan_vien ─1:N─▶ phieu_nhap (nhan_vien_id)', { noIndent: true }),
    para('danh_muc ─1:N─▶ san_pham (danh_muc_id)', { noIndent: true }),
    para('don_hang ─1:N─▶ chi_tiet_don_hang (don_hang_id)', { noIndent: true }),
    para('san_pham ─1:N─▶ chi_tiet_don_hang (san_pham_id)', { noIndent: true }),
    para('phieu_nhap ─1:N─▶ chi_tiet_phieu_nhap (phieu_nhap_id)', { noIndent: true }),
    para('san_pham ─1:N─▶ chi_tiet_phieu_nhap (san_pham_id)', { noIndent: true }),

    heading('3.5 Thiết kế cơ sở dữ liệu', HeadingLevel.HEADING_2),
    para('Dưới đây là chi tiết cấu trúc từng bảng trong cơ sở dữ liệu shop_thoi_trang:'),

    // === TABLE: tai_khoan ===
    heading('Bảng 1: tai_khoan (18 cột)', HeadingLevel.HEADING_3),
    makeTable(['Cột', 'Kiểu dữ liệu', 'Ràng buộc', 'Mô tả'], [
        ['id', 'INT', 'PK, Identity', 'Mã tài khoản'],
        ['ten_dang_nhap', 'NVARCHAR(50)', 'UNIQUE, NOT NULL', 'Tên đăng nhập'],
        ['mat_khau', 'NVARCHAR(255)', 'NOT NULL', 'Mật khẩu (bcrypt hash)'],
        ['ho_ten', 'NVARCHAR(100)', 'NOT NULL', 'Họ tên người dùng'],
        ['vai_tro', 'NVARCHAR(20)', 'CHECK', 'admin / nhanvien / nguoidung'],
        ['trang_thai', 'BIT', 'DEFAULT 1', '1: Hoạt động, 0: Khóa'],
        ['email', 'NVARCHAR(100)', 'NULL', 'Email'],
        ['so_dien_thoai', 'NVARCHAR(15)', 'NULL', 'Số điện thoại'],
        ['dia_chi', 'NVARCHAR(255)', 'NULL', 'Địa chỉ'],
        ['hinh_dai_dien', 'NVARCHAR(255)', 'NULL', 'Đường dẫn avatar'],
        ['chieu_cao', 'DECIMAL', 'NULL', 'Chiều cao (cm)'],
        ['can_nang', 'DECIMAL', 'NULL', 'Cân nặng (kg)'],
        ['vong_1/2/3', 'DECIMAL', 'NULL', 'Số đo 3 vòng (cm)'],
        ['ngay_sinh', 'DATE', 'NULL', 'Ngày sinh'],
        ['gioi_tinh', 'NVARCHAR(10)', 'NULL', 'Giới tính'],
        ['ngay_tao', 'DATETIME', 'DEFAULT GETDATE()', 'Ngày tạo tài khoản'],
    ]),

    // === TABLE: danh_muc ===
    heading('Bảng 2: danh_muc (5 cột)', HeadingLevel.HEADING_3),
    makeTable(['Cột', 'Kiểu dữ liệu', 'Ràng buộc', 'Mô tả'], [
        ['id', 'INT', 'PK, Identity', 'Mã danh mục'],
        ['ten_danh_muc', 'NVARCHAR(100)', 'NOT NULL', 'Tên danh mục'],
        ['mo_ta', 'NVARCHAR(255)', 'NULL', 'Mô tả'],
        ['trang_thai', 'BIT', 'DEFAULT 1', '1: Hiện, 0: Ẩn'],
        ['ngay_tao', 'DATETIME', 'DEFAULT GETDATE()', 'Ngày tạo'],
    ]),

    // === TABLE: san_pham ===
    heading('Bảng 3: san_pham (15 cột)', HeadingLevel.HEADING_3),
    makeTable(['Cột', 'Kiểu dữ liệu', 'Ràng buộc', 'Mô tả'], [
        ['id', 'INT', 'PK, Identity', 'Mã sản phẩm (auto)'],
        ['ma_sp', 'NVARCHAR(20)', 'UNIQUE, NOT NULL', 'Mã sản phẩm hiển thị'],
        ['ten_sp', 'NVARCHAR(200)', 'NOT NULL', 'Tên sản phẩm'],
        ['danh_muc_id', 'INT', 'FK → danh_muc', 'Mã danh mục'],
        ['gia_nhap', 'DECIMAL(15,2)', 'DEFAULT 0', 'Giá nhập'],
        ['gia_ban', 'DECIMAL(15,2)', 'DEFAULT 0', 'Giá bán'],
        ['so_luong', 'INT', 'DEFAULT 0', 'Số lượng tồn kho'],
        ['kich_thuoc', 'NVARCHAR(10)', 'NULL', 'Kích thước (S/M/L/XL...)'],
        ['mau_sac', 'NVARCHAR(50)', 'NULL', 'Màu sắc'],
        ['chat_lieu', 'NVARCHAR(100)', 'NULL', 'Chất liệu'],
        ['hinh_anh', 'NVARCHAR(255)', 'NULL', 'Đường dẫn hình ảnh'],
        ['mo_ta', 'NVARCHAR(MAX)', 'NULL', 'Mô tả sản phẩm'],
        ['gioi_tinh', 'NVARCHAR(10)', "DEFAULT 'Unisex'", 'Nam / Nữ / Unisex'],
        ['trang_thai', 'BIT', 'DEFAULT 1', '1: Đang bán, 0: Ngừng'],
        ['ngay_tao', 'DATETIME', 'DEFAULT GETDATE()', 'Ngày thêm SP'],
    ]),

    // === TABLE: khach_hang ===
    heading('Bảng 4: khach_hang (7 cột)', HeadingLevel.HEADING_3),
    makeTable(['Cột', 'Kiểu dữ liệu', 'Ràng buộc', 'Mô tả'], [
        ['id', 'INT', 'PK, Identity', 'Mã khách hàng'],
        ['ho_ten', 'NVARCHAR(100)', 'NOT NULL', 'Họ tên'],
        ['so_dien_thoai', 'NVARCHAR(15)', 'NULL', 'Số điện thoại'],
        ['email', 'NVARCHAR(100)', 'NULL', 'Email'],
        ['dia_chi', 'NVARCHAR(255)', 'NULL', 'Địa chỉ'],
        ['gioi_tinh', 'NVARCHAR(10)', 'CHECK', 'Nam / Nu / Khac'],
        ['ngay_tao', 'DATETIME', 'DEFAULT GETDATE()', 'Ngày tạo'],
    ]),

    // === TABLE: nhan_vien ===
    heading('Bảng 5: nhan_vien (13 cột)', HeadingLevel.HEADING_3),
    makeTable(['Cột', 'Kiểu dữ liệu', 'Ràng buộc', 'Mô tả'], [
        ['id', 'INT', 'PK, Identity', 'Mã nhân viên (auto)'],
        ['ma_nv', 'NVARCHAR(20)', 'UNIQUE, NOT NULL', 'Mã nhân viên'],
        ['ho_ten', 'NVARCHAR(100)', 'NOT NULL', 'Họ tên'],
        ['so_dien_thoai', 'NVARCHAR(15)', 'NULL', 'Số điện thoại'],
        ['email', 'NVARCHAR(100)', 'NULL', 'Email'],
        ['dia_chi', 'NVARCHAR(255)', 'NULL', 'Địa chỉ'],
        ['gioi_tinh', 'NVARCHAR(10)', 'CHECK', 'Nam / Nu / Khac'],
        ['chuc_vu', 'NVARCHAR(50)', 'NULL', 'Chức vụ'],
        ['luong', 'DECIMAL(15,2)', 'DEFAULT 0', 'Lương'],
        ['ngay_vao_lam', 'DATE', 'NULL', 'Ngày vào làm'],
        ['trang_thai', 'BIT', 'DEFAULT 1', '1: Đang làm, 0: Nghỉ'],
        ['tai_khoan_id', 'INT', 'FK → tai_khoan', 'Tài khoản liên kết'],
        ['ngay_tao', 'DATETIME', 'DEFAULT GETDATE()', 'Ngày tạo'],
    ]),

    // === TABLE: don_hang ===
    heading('Bảng 6: don_hang (13 cột)', HeadingLevel.HEADING_3),
    makeTable(['Cột', 'Kiểu dữ liệu', 'Ràng buộc', 'Mô tả'], [
        ['id', 'INT', 'PK, Identity', 'Mã đơn hàng (auto)'],
        ['ma_dh', 'NVARCHAR(20)', 'UNIQUE, NOT NULL', 'Mã đơn hàng hiển thị'],
        ['khach_hang_id', 'INT', 'FK → khach_hang', 'Khách hàng'],
        ['tai_khoan_id', 'INT', 'FK → tai_khoan', 'Tài khoản đặt online'],
        ['nhan_vien_id', 'INT', 'FK → nhan_vien', 'Nhân viên xử lý'],
        ['ngay_dat', 'DATETIME', 'DEFAULT GETDATE()', 'Ngày đặt hàng'],
        ['tong_tien', 'DECIMAL(15,2)', 'DEFAULT 0', 'Tổng tiền trước giảm'],
        ['giam_gia', 'DECIMAL(15,2)', 'DEFAULT 0', 'Số tiền giảm'],
        ['thanh_toan', 'DECIMAL(15,2)', 'DEFAULT 0', 'Thực thanh toán'],
        ['phuong_thuc_tt', 'NVARCHAR(20)', 'CHECK', 'tien_mat / chuyen_khoan / the'],
        ['trang_thai', 'NVARCHAR(20)', 'CHECK', '5 trạng thái đơn hàng'],
        ['ghi_chu', 'NVARCHAR(MAX)', 'NULL', 'Ghi chú'],
        ['ngay_tao', 'DATETIME', 'DEFAULT GETDATE()', 'Ngày tạo record'],
    ]),

    // === TABLE: chi_tiet_don_hang ===
    heading('Bảng 7: chi_tiet_don_hang (6 cột)', HeadingLevel.HEADING_3),
    makeTable(['Cột', 'Kiểu dữ liệu', 'Ràng buộc', 'Mô tả'], [
        ['id', 'INT', 'PK, Identity', 'Mã chi tiết'],
        ['don_hang_id', 'INT', 'FK → don_hang (CASCADE)', 'Đơn hàng'],
        ['san_pham_id', 'INT', 'FK → san_pham', 'Sản phẩm'],
        ['so_luong', 'INT', 'NOT NULL, DEFAULT 1', 'Số lượng mua'],
        ['don_gia', 'DECIMAL(15,2)', 'NOT NULL', 'Đơn giá tại thời điểm'],
        ['thanh_tien', 'DECIMAL(15,2)', 'NOT NULL', '= số lượng × đơn giá'],
    ]),

    // === TABLE: phieu_nhap ===
    heading('Bảng 8: phieu_nhap (8 cột)', HeadingLevel.HEADING_3),
    makeTable(['Cột', 'Kiểu dữ liệu', 'Ràng buộc', 'Mô tả'], [
        ['id', 'INT', 'PK, Identity', 'Mã phiếu'],
        ['ma_phieu', 'NVARCHAR(20)', 'UNIQUE, NOT NULL', 'Mã phiếu nhập'],
        ['nhan_vien_id', 'INT', 'FK → nhan_vien', 'NV thực hiện'],
        ['nha_cung_cap', 'NVARCHAR(200)', 'NULL', 'Nhà cung cấp'],
        ['ngay_nhap', 'DATETIME', 'DEFAULT GETDATE()', 'Ngày nhập'],
        ['tong_tien', 'DECIMAL(15,2)', 'DEFAULT 0', 'Tổng tiền nhập'],
        ['ghi_chu', 'NVARCHAR(MAX)', 'NULL', 'Ghi chú'],
        ['ngay_tao', 'DATETIME', 'DEFAULT GETDATE()', 'Ngày tạo'],
    ]),

    // === TABLE: chi_tiet_phieu_nhap ===
    heading('Bảng 9: chi_tiet_phieu_nhap (6 cột)', HeadingLevel.HEADING_3),
    makeTable(['Cột', 'Kiểu dữ liệu', 'Ràng buộc', 'Mô tả'], [
        ['id', 'INT', 'PK, Identity', 'Mã chi tiết'],
        ['phieu_nhap_id', 'INT', 'FK → phieu_nhap (CASCADE)', 'Phiếu nhập'],
        ['san_pham_id', 'INT', 'FK → san_pham', 'Sản phẩm'],
        ['so_luong', 'INT', 'NOT NULL, DEFAULT 1', 'Số lượng nhập'],
        ['don_gia', 'DECIMAL(15,2)', 'NOT NULL', 'Đơn giá nhập'],
        ['thanh_tien', 'DECIMAL(15,2)', 'NOT NULL', '= số lượng × đơn giá'],
    ]),

    // === TABLE: ma_giam_gia ===
    heading('Bảng 10: ma_giam_gia (12 cột)', HeadingLevel.HEADING_3),
    makeTable(['Cột', 'Kiểu dữ liệu', 'Ràng buộc', 'Mô tả'], [
        ['id', 'INT', 'PK, Identity', 'Mã giảm giá (auto)'],
        ['ma_code', 'NVARCHAR(50)', 'UNIQUE, NOT NULL', 'Mã code'],
        ['mo_ta', 'NVARCHAR(255)', 'NULL', 'Mô tả'],
        ['loai_giam', 'NVARCHAR(20)', 'NULL', 'phan_tram / tien'],
        ['gia_tri', 'DECIMAL', 'NOT NULL', 'Giá trị giảm'],
        ['don_toi_thieu', 'DECIMAL', 'NULL', 'Đơn hàng tối thiểu'],
        ['so_luong', 'INT', 'NULL', 'Số lượng mã'],
        ['da_su_dung', 'INT', 'NULL', 'Đã sử dụng'],
        ['ngay_bat_dau', 'DATETIME', 'NULL', 'Ngày bắt đầu'],
        ['ngay_ket_thuc', 'DATETIME', 'NULL', 'Ngày kết thúc'],
        ['trang_thai', 'BIT', 'NULL', '1: Hoạt động'],
        ['ngay_tao', 'DATETIME', 'NULL', 'Ngày tạo'],
    ]),

    // === TABLE: lien_he ===
    heading('Bảng 11: lien_he (10 cột)', HeadingLevel.HEADING_3),
    makeTable(['Cột', 'Kiểu dữ liệu', 'Ràng buộc', 'Mô tả'], [
        ['id', 'INT', 'PK, Identity', 'Mã liên hệ'],
        ['tai_khoan_id', 'INT', 'FK → tai_khoan', 'Tài khoản gửi'],
        ['ho_ten', 'NVARCHAR(100)', 'NOT NULL', 'Họ tên'],
        ['email', 'NVARCHAR(100)', 'NULL', 'Email'],
        ['chu_de', 'NVARCHAR(200)', 'NOT NULL', 'Chủ đề'],
        ['noi_dung', 'NVARCHAR(MAX)', 'NOT NULL', 'Nội dung tin nhắn'],
        ['phan_hoi', 'NVARCHAR(MAX)', 'NULL', 'Phản hồi từ admin'],
        ['trang_thai', 'NVARCHAR(20)', 'NULL', 'cho_xu_ly / da_phan_hoi'],
        ['ngay_gui', 'DATETIME', 'NULL', 'Ngày gửi'],
        ['ngay_phan_hoi', 'DATETIME', 'NULL', 'Ngày phản hồi'],
    ]),

    // === TABLE: cai_dat ===
    heading('Bảng 12: cai_dat (4 cột)', HeadingLevel.HEADING_3),
    makeTable(['Cột', 'Kiểu dữ liệu', 'Ràng buộc', 'Mô tả'], [
        ['id', 'INT', 'PK, Identity', 'Mã cài đặt'],
        ['khoa', 'NVARCHAR(100)', 'UNIQUE, NOT NULL', 'Tên khóa (key)'],
        ['gia_tri', 'NVARCHAR(MAX)', 'NULL', 'Giá trị (value)'],
        ['ngay_cap_nhat', 'DATETIME', 'NULL', 'Ngày cập nhật'],
    ]),
];

// ----- CHƯƠNG IV -----
const chuong4 = [
    pageBreak(),
    heading('CHƯƠNG IV: CHƯƠNG TRÌNH ỨNG DỤNG', HeadingLevel.HEADING_1, { center: true }),

    heading('4.1 Giao diện người dùng', HeadingLevel.HEADING_2),

    heading('4.1.1 Trang chủ', HeadingLevel.HEADING_3),
    para('Trang chủ hiển thị slider banner giới thiệu, danh sách danh mục sản phẩm (10 danh mục: Áo nam, Quần nam, Váy/Đầm, Giày dép, Phụ kiện, Áo nữ, Quần nữ, Áo khoác, Đồ thể thao, Túi xách) và 8 sản phẩm mới nhất với hình ảnh, tên, giá bán.'),
    para('(Chụp screenshot trang chủ tại: http://localhost:3000/trang-chu)', { italic: true, noIndent: true }),

    heading('4.1.2 Trang cửa hàng', HeadingLevel.HEADING_3),
    para('Trang cửa hàng cho phép khách hàng duyệt toàn bộ sản phẩm với các tính năng: lọc theo danh mục, lọc theo giới tính (Nam/Nữ/Unisex), tìm kiếm theo tên, phân trang 12 sản phẩm/trang.'),
    para('(Chụp screenshot tại: http://localhost:3000/cua-hang)', { italic: true, noIndent: true }),

    heading('4.1.3 Trang đăng nhập / Đăng ký', HeadingLevel.HEADING_3),
    para('Giao diện đăng nhập và đăng ký được thiết kế theo phong cách hiện đại với Bootstrap 5. Mật khẩu được mã hóa bằng bcrypt (salt rounds = 10) trước khi lưu vào CSDL. Hệ thống kiểm tra trùng tên đăng nhập và yêu cầu mật khẩu tối thiểu 6 ký tự.'),

    heading('4.1.4 Giỏ hàng', HeadingLevel.HEADING_3),
    para('Giỏ hàng được lưu trữ trong Session (phía server), cho phép thêm sản phẩm, cập nhật số lượng, xóa sản phẩm. Khi thêm sản phẩm đã có trong giỏ, số lượng được cộng dồn tự động. Hệ thống kiểm tra tồn kho trước khi cho phép thêm.'),

    heading('4.1.5 Đặt hàng & Thanh toán', HeadingLevel.HEADING_3),
    para('Quy trình đặt hàng sử dụng SQL Transaction để đảm bảo tính toàn vẹn dữ liệu:'),
    numberedItem(1, 'Hiển thị giỏ hàng + form thông tin giao hàng (họ tên, SĐT, địa chỉ).'),
    numberedItem(2, 'Cho phép nhập mã giảm giá — hệ thống kiểm tra real-time (API) tính hợp lệ, hạn dùng, đơn tối thiểu.'),
    numberedItem(3, 'Chọn phương thức thanh toán: Tiền mặt / Chuyển khoản / Thẻ.'),
    numberedItem(4, 'Xử lý: Tạo/cập nhật khách hàng → Tạo đơn hàng → Tạo chi tiết đơn → Trừ tồn kho → Xóa giỏ hàng.'),

    heading('4.1.6 Đơn hàng của tôi', HeadingLevel.HEADING_3),
    para('Người dùng có thể xem danh sách tất cả đơn hàng đã đặt (phân trang 10 đơn/trang), xem chi tiết từng đơn, và hủy đơn ở trạng thái "Chờ xác nhận" (tự động hoàn lại tồn kho).'),
    para('Đơn hàng có 5 trạng thái: Chờ xác nhận → Đã xác nhận → Đang giao → Đã giao / Đã hủy.'),

    heading('4.1.7 Hồ sơ cá nhân', HeadingLevel.HEADING_3),
    para('Trang thông tin cá nhân cho phép người dùng cập nhật: họ tên, email, số điện thoại, địa chỉ, ngày sinh, giới tính, upload ảnh đại diện (hỗ trợ JPEG/PNG/GIF/WebP, tối đa 5MB). Đặc biệt, người dùng có thể nhập số đo hình thể (chiều cao, cân nặng, 3 vòng) để AI Chatbot tư vấn size chính xác.'),
    para('Trang cũng hiển thị thống kê cá nhân: tổng đơn hàng, đơn hoàn thành, tổng chi tiêu.'),

    heading('4.1.8 AI Chatbot tư vấn thời trang', HeadingLevel.HEADING_3),
    para('Chatbot AI là tính năng nổi bật được tích hợp dưới dạng widget nổi (floating) ở góc phải dưới màn hình. Chatbot hỗ trợ 8 loại ý định (intent):'),
    makeTable(
        ['Tính năng', 'Mô tả'],
        [
            ['Gợi ý size', 'Tính toán từ số đo cơ thể → gợi ý size áo (XS–XXL) và size quần theo bảng size chuẩn. Sử dụng hệ thống chấm điểm (scoring) với trọng số: vòng ngực +3, vòng eo +2, cân nặng +2, chiều cao +1.'],
            ['Gợi ý theo dáng người', 'Tính BMI → phân loại dáng (gầy/cân đối/đầy đặn) → đưa ra 5 mẹo chọn đồ + sản phẩm phù hợp từ DB.'],
            ['Xu hướng thời trang', 'Giới thiệu 8 xu hướng thời trang 2026: Minimalist Chic, Streetwear & Y2K, Smart Casual, Athleisure, Cottagecore, Dark Academia, Denim-on-denim, Color Block.'],
            ['Tìm kiếm sản phẩm', 'Tìm sản phẩm trong CSDL theo keyword + ưu tiên giới tính của user.'],
            ['Thông tin shop', 'Trả lời câu hỏi về shop, giờ mở cửa, liên hệ.'],
        ]
    ),

    heading('4.2 Giao diện quản trị (Admin)', HeadingLevel.HEADING_2),

    heading('4.2.1 Dashboard tổng quan', HeadingLevel.HEADING_3),
    para('Trang Dashboard hiển thị 6 thẻ KPI (tổng sản phẩm, tổng đơn hàng, tổng khách hàng, tổng doanh thu, đơn chờ xử lý, SP hết hàng), biểu đồ doanh thu 7 ngày gần nhất (Chart.js), bảng 5 đơn hàng gần nhất, bảng 5 SP bán chạy nhất.'),

    heading('4.2.2 Quản lý sản phẩm', HeadingLevel.HEADING_3),
    para('Hệ thống CRUD đầy đủ cho sản phẩm thuộc 10 danh mục, phân thành 3 giới tính (Nam, Nữ, Unisex). Hỗ trợ upload hình ảnh qua Multer, tìm kiếm, lọc theo danh mục/giới tính, phân trang.'),

    heading('4.2.3 Quản lý đơn hàng', HeadingLevel.HEADING_3),
    para('Admin có thể xem danh sách đơn hàng, tạo đơn mới, cập nhật trạng thái (5 bước), xem chi tiết đơn hàng và in hóa đơn (window.print).'),

    heading('4.2.4 Quản lý nhập hàng', HeadingLevel.HEADING_3),
    para('Tạo phiếu nhập hàng từ nhà cung cấp, thêm nhiều sản phẩm cùng lúc, tự động cộng tồn kho khi tạo phiếu. Xem chi tiết và xóa phiếu nhập.'),

    heading('4.2.5 Thống kê & Báo cáo', HeadingLevel.HEADING_3),
    para('Module thống kê toàn diện với khả năng lọc theo tháng/năm:'),
    bullet('Biểu đồ cột doanh thu 12 tháng (Chart.js).'),
    bullet('Biểu đồ tròn doanh thu theo danh mục.'),
    bullet('TOP 10 sản phẩm bán chạy trong tháng.'),
    bullet('TOP 10 khách hàng theo chi tiêu.'),
    bullet('Báo cáo tồn kho: 20 SP tồn kho thấp nhất (đánh dấu đỏ: hết hàng, vàng: sắp hết).'),
    bullet('Nút "In báo cáo" — in toàn bộ trang thống kê (window.print + CSS @media print).'),

    heading('4.2.6 Tìm kiếm nâng cao', HeadingLevel.HEADING_3),
    para('Tìm kiếm toàn hệ thống qua 9 bảng dữ liệu: sản phẩm, đơn hàng, khách hàng, tài khoản, nhân viên, danh mục, mã giảm giá, liên hệ, phiếu nhập. Hỗ trợ lọc theo phạm vi (tất cả hoặc từng loại).'),

    heading('4.2.7 Quản lý mã giảm giá', HeadingLevel.HEADING_3),
    para('Tạo, sửa, xóa mã giảm giá với 2 loại: phần trăm và số tiền cố định. Cài đặt: giá trị giảm, đơn tối thiểu, số lượng sử dụng, thời hạn bắt đầu/kết thúc.'),

    heading('4.2.8 Quản lý liên hệ', HeadingLevel.HEADING_3),
    para('Xem danh sách tin nhắn liên hệ từ khách hàng. Admin có thể xem chi tiết và gửi phản hồi. Trạng thái tự động cập nhật: Chờ xử lý → Đã phản hồi.'),

    heading('4.2.9 Cài đặt hệ thống', HeadingLevel.HEADING_3),
    para('Cấu hình: cài đặt đơn hàng và thiết lập thanh toán (upload ảnh QR chuyển khoản). Dữ liệu lưu dạng key-value trong bảng cai_dat.'),
];

// ----- CHƯƠNG V -----
const chuong5 = [
    pageBreak(),
    heading('CHƯƠNG V: THỬ NGHIỆM VÀ ĐÁNH GIÁ', HeadingLevel.HEADING_1, { center: true }),

    heading('5.1 Ưu điểm', HeadingLevel.HEADING_2),
    bullet('Hệ thống đầy đủ chức năng với 15 module route, 40 file template, hơn 7.300 dòng code.'),
    bullet('Giao diện responsive, tương thích tốt trên máy tính, máy tính bảng và điện thoại nhờ Bootstrap 5.'),
    bullet('Bảo mật tốt: mật khẩu mã hóa bcrypt, parameterized queries chống SQL Injection, phân quyền 3 cấp.'),
    bullet('AI Chatbot tư vấn thời trang thông minh — tính năng nâng cao giúp trải nghiệm người dùng tốt hơn.'),
    bullet('Hệ thống mã giảm giá linh hoạt (phần trăm/cố định, hạn dùng, đơn tối thiểu).'),
    bullet('Dashboard trực quan với biểu đồ Chart.js, thống kê doanh thu đa chiều.'),
    bullet('Đặt hàng sử dụng SQL Transaction đảm bảo tính toàn vẹn dữ liệu.'),
    bullet('Tìm kiếm toàn hệ thống qua 9 bảng dữ liệu.'),
    bullet('Quản lý nhập/xuất kho hoàn chỉnh.'),

    heading('5.2 Nhược điểm', HeadingLevel.HEADING_2),
    bullet('Chatbot hoạt động dạng rule-based, chưa tích hợp AI thực sự (GPT, LLM), nên khả năng hiểu ngữ cảnh còn hạn chế.'),
    bullet('Chưa có tính năng thanh toán trực tuyến (VNPay, MoMo, ZaloPay).'),
    bullet('Chưa có chức năng xuất báo cáo ra file Excel/PDF (chỉ có in qua trình duyệt).'),
    bullet('Giỏ hàng lưu trong Session — mất khi đóng trình duyệt hoặc hết session.'),
    bullet('Chưa có hệ thống đánh giá/bình luận sản phẩm.'),
    bullet('Chưa có tính năng gửi email thông báo (xác nhận đơn hàng, quên mật khẩu).'),
];

// ----- CHƯƠNG VI -----
const chuong6 = [
    pageBreak(),
    heading('CHƯƠNG VI: KẾT LUẬN', HeadingLevel.HEADING_1, { center: true }),

    heading('6.1 Kết quả đạt được', HeadingLevel.HEADING_2),
    para('Sau quá trình nghiên cứu và phát triển, đồ án đã hoàn thành các mục tiêu đề ra:'),
    bullet('Xây dựng thành công website quản lý shop thời trang hoàn chỉnh với 2 phân hệ: quản trị (12 chức năng) và người dùng (9 chức năng).'),
    bullet('Thiết kế cơ sở dữ liệu gồm 12 bảng với 11 mối quan hệ khóa ngoại, đảm bảo tính chuẩn hóa.'),
    bullet('Tích hợp thành công AI Chatbot tư vấn thời trang với 8 loại ý định, gợi ý size dựa trên số đo cơ thể.'),
    bullet('Hệ thống thống kê và báo cáo trực quan với Chart.js.'),
    bullet('Tổng cộng hơn 7.300 dòng code (15 route files, 40 view templates).'),

    heading('6.2 Hướng phát triển trong tương lai', HeadingLevel.HEADING_2),
    bullet('Tích hợp AI nâng cao: Thay thế chatbot rule-based bằng Google Gemini API hoặc OpenAI GPT để hiểu ngữ cảnh tốt hơn.'),
    bullet('Thanh toán trực tuyến: Tích hợp cổng thanh toán VNPay, MoMo, ZaloPay cho trải nghiệm mua sắm tiện lợi hơn.'),
    bullet('Ứng dụng di động: Phát triển ứng dụng mobile (React Native) hoặc PWA cho khách hàng.'),
    bullet('Xuất báo cáo: Tích hợp xuất Excel (exceljs) và PDF (pdfkit) cho module thống kê.'),
    bullet('Hệ thống đánh giá: Cho phép khách hàng đánh giá và bình luận sản phẩm (star rating + review).'),
    bullet('Email notification: Gửi email xác nhận đơn hàng, cập nhật trạng thái, quên mật khẩu (Nodemailer + Gmail).'),
    bullet('Real-time: Tích hợp Socket.IO để thông báo đơn hàng mới cho admin theo thời gian thực.'),
    bullet('Deploy cloud: Triển khai trên Azure/AWS/Railway với database Azure SQL hoặc Neon PostgreSQL.'),

    heading('6.3 Kết luận', HeadingLevel.HEADING_2),
    para('Đồ án "Xây dựng Website Quản Lý Shop Thời Trang" đã hoàn thành đầy đủ các yêu cầu đặt ra, xây dựng một hệ thống web hoàn chỉnh phục vụ cho việc quản lý cửa hàng thời trang và mua sắm trực tuyến. Hệ thống sử dụng công nghệ Node.js, Express.js, EJS và SQL Server 2022 — những công nghệ hiện đại, phổ biến trong ngành phát triển web.'),
    para('Đặc biệt, tính năng AI Chatbot tư vấn thời trang là điểm sáng của đồ án, thể hiện khả năng tích hợp trí tuệ nhân tạo vào ứng dụng thực tế, giúp nâng cao trải nghiệm người dùng và tạo ra giá trị khác biệt cho sản phẩm.'),
    para('Mặc dù vẫn còn một số hạn chế cần khắc phục, đồ án đã đạt được mục tiêu ban đầu và có thể tiếp tục phát triển mở rộng trong tương lai.'),
];

// ----- TÀI LIỆU THAM KHẢO -----
const taiLieu = [
    pageBreak(),
    heading('TÀI LIỆU THAM KHẢO', HeadingLevel.HEADING_1, { center: true }),
    numberedItem(1, 'Express.js Official Documentation. https://expressjs.com/. Truy cập 2026.'),
    numberedItem(2, 'Node.js Official Documentation. https://nodejs.org/docs/. Truy cập 2026.'),
    numberedItem(3, 'Microsoft SQL Server 2022 Documentation. https://learn.microsoft.com/en-us/sql/sql-server/. Truy cập 2026.'),
    numberedItem(4, 'EJS — Embedded JavaScript templating. https://ejs.co/. Truy cập 2026.'),
    numberedItem(5, 'Bootstrap 5 Documentation. https://getbootstrap.com/docs/5.3/. Truy cập 2026.'),
    numberedItem(6, 'Chart.js Documentation. https://www.chartjs.org/docs/. Truy cập 2026.'),
    numberedItem(7, 'bcrypt.js — Optimized bcrypt in JavaScript. https://github.com/dcodeIO/bcrypt.js. Truy cập 2026.'),
    numberedItem(8, 'mssql — Microsoft SQL Server client for Node.js. https://github.com/tediousjs/node-mssql. Truy cập 2026.'),
    numberedItem(9, 'Multer — Node.js middleware for handling multipart/form-data. https://github.com/expressjs/multer. Truy cập 2026.'),
    numberedItem(10, 'Font Awesome 6 Documentation. https://fontawesome.com/docs. Truy cập 2026.'),
];

// ===== ASSEMBLE DOCUMENT =====
const doc = new Document({
    creator: 'Shop Thoi Trang - Do An Co So',
    title: 'Báo cáo Đồ án Cơ sở - Xây dựng Website Quản Lý Shop Thời Trang',
    description: 'Đồ án Cơ sở - Trường Đại học Nam Cần Thơ',
    styles: {
        default: {
            document: {
                run: { font: 'Times New Roman', size: 26 }
            }
        }
    },
    sections: [{
        properties: {
            page: {
                margin: { top: convertInchesToTwip(1), bottom: convertInchesToTwip(0.8), left: convertInchesToTwip(1.2), right: convertInchesToTwip(0.8) },
                size: { width: convertInchesToTwip(8.27), height: convertInchesToTwip(11.69) }
            }
        },
        children: [
            ...coverSection,
            ...camTa,
            ...camKet,
            ...nhanXet,
            ...mucLuc,
            ...chuong1,
            ...chuong2,
            ...chuong3,
            ...chuong4,
            ...chuong5,
            ...chuong6,
            ...taiLieu,
        ]
    }]
});

// ===== SAVE FILE =====
Packer.toBuffer(doc).then(buffer => {
    const outPath = 'BaoCao_DoAn_QuanLyShopThoiTrang.docx';
    fs.writeFileSync(outPath, buffer);
    console.log(`✅ Đã tạo file: ${outPath} (${(buffer.length / 1024).toFixed(1)} KB)`);
}).catch(err => {
    console.error('❌ Lỗi:', err.message);
    process.exit(1);
});
