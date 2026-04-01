require('dotenv').config();
const sql = require('mssql');
const express = require('express');
const cors = require('cors');

const app = express();
app.use(cors()); // Bật CORS cho mọi nguồn
app.use(express.json());

const dbConfig = {
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    server: process.env.DB_SERVER,
    database: process.env.DB_NAME,
    options: { encrypt: true, trustServerCertificate: true },
    port: 1433
};

async function getPool() {
    return await sql.connect(dbConfig);
}

// ==========================================
// HÀM HELPER: CHẠY QUERY CHUNG
// ==========================================
async function executeQuery(res, query, inputs = []) {
    try {
        const pool = await getPool();
        const request = pool.request();
        inputs.forEach(input => request.input(input.name, input.value));
        const result = await request.query(query);
        res.json(result.recordset || { success: true });
    } catch (e) {
        res.status(500).json({ error: e.message });
    }
}

// ==========================================
// HÀM HELPER: TỰ ĐỘNG SINH MÃ (AUTO-GENERATE ID)
// ==========================================

// 1. Sinh mã cho danh mục (VD: SP001, KH001)
async function generateId(tableName, idColumn, prefix) {
    const pool = await getPool();
    // Lấy mã lớn nhất hiện tại (có chứa tiền tố)
    const result = await pool.request().query(`
        SELECT TOP 1 ${idColumn} AS maxId 
        FROM ${tableName} 
        WHERE ${idColumn} LIKE '${prefix}%' 
        ORDER BY ${idColumn} DESC
    `);

    if (result.recordset.length === 0) {
        return prefix + '001'; // Nếu chưa có record nào thì trả về 001
    }

    const lastId = result.recordset[0].maxId;
    const numberPart = lastId.replace(prefix, ''); // Cắt bỏ tiền tố để lấy số
    const nextNumber = parseInt(numberPart, 10) + 1; // Cộng thêm 1
    
    // Format lại thành 3 chữ số (VD: 2 -> 002)
    return prefix + String(nextNumber).padStart(3, '0');
}

// 2. Sinh mã cho đơn hàng theo ngày (VD: DH260401-001)
async function generateOrderId() {
    const date = new Date();
    const yy = String(date.getFullYear()).slice(-2);
    const mm = String(date.getMonth() + 1).padStart(2, '0');
    const dd = String(date.getDate()).padStart(2, '0');
    const prefix = `DH${yy}${mm}${dd}-`;

    const pool = await getPool();
    const result = await pool.request().query(`
        SELECT TOP 1 MaDonHang AS maxId 
        FROM DON_HANG 
        WHERE MaDonHang LIKE '${prefix}%' 
        ORDER BY MaDonHang DESC
    `);

    if (result.recordset.length === 0) {
        return prefix + '001';
    }

    const lastId = result.recordset[0].maxId;
    const numberPart = lastId.split('-')[1]; // Lấy phần sau dấu '-'
    const nextNumber = parseInt(numberPart, 10) + 1;
    
    return prefix + String(nextNumber).padStart(3, '0');
}

// ==========================================
// API ENDPOINTS
// ==========================================

// 1. LOẠI SẢN PHẨM
app.get('/api/loaisp', (req, res) => executeQuery(res, 'SELECT * FROM LOAI_SAN_PHAM'));
app.post('/api/loaisp', async (req, res) => {
    try {
        const newId = await generateId('LOAI_SAN_PHAM', 'MaLoai', 'LSP');
        await executeQuery(res, 'INSERT INTO LOAI_SAN_PHAM(MaLoai, TenLoai) VALUES(@id, @ten)', [
            { name: 'id', value: newId }, { name: 'ten', value: req.body.TenLoai }
        ]);
    } catch(e) { res.status(500).json({ error: e.message }); }
});
app.put('/api/loaisp/:id', (req, res) => executeQuery(res, 'UPDATE LOAI_SAN_PHAM SET TenLoai=@ten WHERE MaLoai=@id', [{ name: 'id', value: req.params.id }, { name: 'ten', value: req.body.TenLoai }]));
app.delete('/api/loaisp/:id', (req, res) => executeQuery(res, 'DELETE FROM LOAI_SAN_PHAM WHERE MaLoai=@id', [{ name: 'id', value: req.params.id }]));

// 2. SẢN PHẨM
app.get('/api/sanpham', (req, res) => executeQuery(res, 'SELECT * FROM SAN_PHAM'));
app.post('/api/sanpham', async (req, res) => {
    try {
        const newId = await generateId('SAN_PHAM', 'MaSP', 'SP');
        await executeQuery(res, 'INSERT INTO SAN_PHAM(MaSP, MoTa, DonGia, Ten, MaLoai) VALUES(@MaSP, @MoTa, @DonGia, @Ten, @MaLoai)', [
            { name: 'MaSP', value: newId }, { name: 'MoTa', value: req.body.MoTa }, { name: 'DonGia', value: req.body.DonGia }, { name: 'Ten', value: req.body.Ten }, { name: 'MaLoai', value: req.body.MaLoai }
        ]);
    } catch(e) { res.status(500).json({ error: e.message }); }
});
app.put('/api/sanpham/:id', (req, res) => executeQuery(res, 'UPDATE SAN_PHAM SET MoTa=@MoTa, DonGia=@DonGia, Ten=@Ten, MaLoai=@MaLoai WHERE MaSP=@id', [
    { name: 'id', value: req.params.id }, { name: 'MoTa', value: req.body.MoTa }, { name: 'DonGia', value: req.body.DonGia }, { name: 'Ten', value: req.body.Ten }, { name: 'MaLoai', value: req.body.MaLoai }
]));
app.delete('/api/sanpham/:id', (req, res) => executeQuery(res, 'DELETE FROM SAN_PHAM WHERE MaSP=@id', [{ name: 'id', value: req.params.id }]));

// 3. ĐƠN VỊ CUNG CẤP
app.get('/api/donvicungcap', (req, res) => executeQuery(res, 'SELECT * FROM DON_VI_CUNG_CAP'));
app.post('/api/donvicungcap', async (req, res) => {
    try {
        const newId = await generateId('DON_VI_CUNG_CAP', 'MaDV', 'NCC');
        await executeQuery(res, 'INSERT INTO DON_VI_CUNG_CAP(MaDV, Ten, DiaChi) VALUES(@id, @ten, @diachi)', [
            { name: 'id', value: newId }, { name: 'ten', value: req.body.Ten }, { name: 'diachi', value: req.body.DiaChi }
        ]);
    } catch(e) { res.status(500).json({ error: e.message }); }
});
app.put('/api/donvicungcap/:id', (req, res) => executeQuery(res, 'UPDATE DON_VI_CUNG_CAP SET Ten=@ten, DiaChi=@diachi WHERE MaDV=@id', [{ name: 'id', value: req.params.id }, { name: 'ten', value: req.body.Ten }, { name: 'diachi', value: req.body.DiaChi }]));
app.delete('/api/donvicungcap/:id', (req, res) => executeQuery(res, 'DELETE FROM DON_VI_CUNG_CAP WHERE MaDV=@id', [{ name: 'id', value: req.params.id }]));

// 4. KHO HÀNG
app.get('/api/khohang', (req, res) => executeQuery(res, 'SELECT * FROM KHO_HANG'));
app.post('/api/khohang', async (req, res) => {
    try {
        const newId = await generateId('KHO_HANG', 'MaKho', 'KHO');
        await executeQuery(res, 'INSERT INTO KHO_HANG(MaKho, DiaChi) VALUES(@id, @diachi)', [
            { name: 'id', value: newId }, { name: 'diachi', value: req.body.DiaChi }
        ]);
    } catch(e) { res.status(500).json({ error: e.message }); }
});
app.put('/api/khohang/:id', (req, res) => executeQuery(res, 'UPDATE KHO_HANG SET DiaChi=@diachi WHERE MaKho=@id', [{ name: 'id', value: req.params.id }, { name: 'diachi', value: req.body.DiaChi }]));
app.delete('/api/khohang/:id', (req, res) => executeQuery(res, 'DELETE FROM KHO_HANG WHERE MaKho=@id', [{ name: 'id', value: req.params.id }]));

// 5. CHI NHÁNH
app.get('/api/chinhanh', (req, res) => executeQuery(res, 'SELECT * FROM CHI_NHANH'));
app.post('/api/chinhanh', async (req, res) => {
    try {
        const newId = await generateId('CHI_NHANH', 'MaCN', 'CN');
        await executeQuery(res, 'INSERT INTO CHI_NHANH(MaCN, Ten, DiaChi) VALUES(@id, @ten, @diachi)', [
            { name: 'id', value: newId }, { name: 'ten', value: req.body.Ten }, { name: 'diachi', value: req.body.DiaChi }
        ]);
    } catch(e) { res.status(500).json({ error: e.message }); }
});
app.put('/api/chinhanh/:id', (req, res) => executeQuery(res, 'UPDATE CHI_NHANH SET Ten=@ten, DiaChi=@diachi WHERE MaCN=@id', [{ name: 'id', value: req.params.id }, { name: 'ten', value: req.body.Ten }, { name: 'diachi', value: req.body.DiaChi }]));
app.delete('/api/chinhanh/:id', (req, res) => executeQuery(res, 'DELETE FROM CHI_NHANH WHERE MaCN=@id', [{ name: 'id', value: req.params.id }]));

// 6. KHÁCH HÀNG
app.get('/api/khachhang', (req, res) => executeQuery(res, 'SELECT * FROM KHACH_HANG'));
app.post('/api/khachhang', async (req, res) => {
    try {
        const newId = await generateId('KHACH_HANG', 'MaKH', 'KH');
        await executeQuery(res, 'INSERT INTO KHACH_HANG(MaKH, Ten, TheTichDiem, Email, SoNha, Phuong, Quan, ThanhPho) VALUES(@MaKH, @Ten, @TheTichDiem, @Email, @SoNha, @Phuong, @Quan, @ThanhPho)', [
            { name: 'MaKH', value: newId }, { name: 'Ten', value: req.body.Ten }, { name: 'TheTichDiem', value: req.body.TheTichDiem }, { name: 'Email', value: req.body.Email }, { name: 'SoNha', value: req.body.SoNha }, { name: 'Phuong', value: req.body.Phuong }, { name: 'Quan', value: req.body.Quan }, { name: 'ThanhPho', value: req.body.ThanhPho }
        ]);
    } catch(e) { res.status(500).json({ error: e.message }); }
});
app.put('/api/khachhang/:id', (req, res) => executeQuery(res, 'UPDATE KHACH_HANG SET Ten=@Ten, TheTichDiem=@TheTichDiem, Email=@Email, SoNha=@SoNha, Phuong=@Phuong, Quan=@Quan, ThanhPho=@ThanhPho WHERE MaKH=@id', [
    { name: 'id', value: req.params.id }, { name: 'Ten', value: req.body.Ten }, { name: 'TheTichDiem', value: req.body.TheTichDiem }, { name: 'Email', value: req.body.Email }, { name: 'SoNha', value: req.body.SoNha }, { name: 'Phuong', value: req.body.Phuong }, { name: 'Quan', value: req.body.Quan }, { name: 'ThanhPho', value: req.body.ThanhPho }
]));
app.delete('/api/khachhang/:id', (req, res) => executeQuery(res, 'DELETE FROM KHACH_HANG WHERE MaKH=@id', [{ name: 'id', value: req.params.id }]));

// 7. VỊ TRÍ
app.get('/api/vitri', (req, res) => executeQuery(res, 'SELECT * FROM VI_TRI'));
app.post('/api/vitri', async (req, res) => {
    try {
        const newId = await generateId('VI_TRI', 'MaViTri', 'VT');
        await executeQuery(res, 'INSERT INTO VI_TRI(MaViTri, LuongTheoGio, TenViTri) VALUES(@id, @luong, @ten)', [
            { name: 'id', value: newId }, { name: 'luong', value: req.body.LuongTheoGio }, { name: 'ten', value: req.body.TenViTri }
        ]);
    } catch(e) { res.status(500).json({ error: e.message }); }
});
app.put('/api/vitri/:id', (req, res) => executeQuery(res, 'UPDATE VI_TRI SET LuongTheoGio=@luong, TenViTri=@ten WHERE MaViTri=@id', [{ name: 'id', value: req.params.id }, { name: 'luong', value: req.body.LuongTheoGio }, { name: 'ten', value: req.body.TenViTri }]));
app.delete('/api/vitri/:id', (req, res) => executeQuery(res, 'DELETE FROM VI_TRI WHERE MaViTri=@id', [{ name: 'id', value: req.params.id }]));

// 8. NHÂN VIÊN
app.get('/api/nhanvien', (req, res) => executeQuery(res, 'SELECT * FROM NHAN_VIEN'));
app.post('/api/nhanvien', async (req, res) => {
    try {
        const newId = await generateId('NHAN_VIEN', 'MaNV', 'NV');
        await executeQuery(res, 'INSERT INTO NHAN_VIEN(MaNV, ThoiGianLamViecTrongNgay, HoVaTen, Email, DiaChi, SoDienThoai, MaCN, MaNguoiQuanLy, MaViTri) VALUES(@MaNV, @ThoiGian, @HoVaTen, @Email, @DiaChi, @SDT, @MaCN, @MaNQL, @MaVT)', [
            { name: 'MaNV', value: newId }, { name: 'ThoiGian', value: req.body.ThoiGianLamViecTrongNgay }, { name: 'HoVaTen', value: req.body.HoVaTen }, { name: 'Email', value: req.body.Email }, { name: 'DiaChi', value: req.body.DiaChi }, { name: 'SDT', value: req.body.SoDienThoai }, { name: 'MaCN', value: req.body.MaCN }, { name: 'MaNQL', value: req.body.MaNguoiQuanLy || null }, { name: 'MaVT', value: req.body.MaViTri }
        ]);
    } catch(e) { res.status(500).json({ error: e.message }); }
});
app.put('/api/nhanvien/:id', (req, res) => executeQuery(res, 'UPDATE NHAN_VIEN SET ThoiGianLamViecTrongNgay=@ThoiGian, HoVaTen=@HoVaTen, Email=@Email, DiaChi=@DiaChi, SoDienThoai=@SDT, MaCN=@MaCN, MaNguoiQuanLy=@MaNQL, MaViTri=@MaVT WHERE MaNV=@id', [
    { name: 'id', value: req.params.id }, { name: 'ThoiGian', value: req.body.ThoiGianLamViecTrongNgay }, { name: 'HoVaTen', value: req.body.HoVaTen }, { name: 'Email', value: req.body.Email }, { name: 'DiaChi', value: req.body.DiaChi }, { name: 'SDT', value: req.body.SoDienThoai }, { name: 'MaCN', value: req.body.MaCN }, { name: 'MaNQL', value: req.body.MaNguoiQuanLy || null }, { name: 'MaVT', value: req.body.MaViTri }
]));
app.delete('/api/nhanvien/:id', (req, res) => executeQuery(res, 'DELETE FROM NHAN_VIEN WHERE MaNV=@id', [{ name: 'id', value: req.params.id }]));


// ==========================================
// 9. QUẢN LÝ ĐƠN HÀNG
// ==========================================
app.get('/api/donhang', (req, res) => executeQuery(res, 'SELECT * FROM DON_HANG'));

app.post('/api/donhang', async (req, res) => {
    const { NgayMua, PhuongThucThanhToan, MaKH, MaNV, ChiTiet } = req.body;
    try {
        const pool = await getPool();
        // Backend tự sinh mã đơn hàng, bỏ qua mã Frontend gửi lên
        const newMaDonHang = await generateOrderId();

        // 1. Chèn vào bảng DON_HANG
        await pool.request()
            .input('id', newMaDonHang)
            .input('ngay', NgayMua)
            .input('pttt', PhuongThucThanhToan)
            .input('makh', MaKH)
            .input('manv', MaNV)
            .query('INSERT INTO DON_HANG VALUES(@id, @ngay, @pttt, @makh, @manv)');

        // 2. Chèn vào bảng BAO_GOM (Chi tiết đơn hàng)
        if (ChiTiet && Array.isArray(ChiTiet)) {
            for (let item of ChiTiet) {
                await pool.request()
                    .input('idDon', newMaDonHang)
                    .input('idSP', item.MaSP)
                    .input('giaVon', item.GiaVonTrungBinh)
                    .input('sl', item.SoLuongMua)
                    .input('giaBan', item.DonGiaBan)
                    .query('INSERT INTO BAO_GOM VALUES(@giaVon, @sl, @giaBan, @idDon, @idSP)');
            }
        }
        res.json({ success: true, message: `Tạo đơn hàng ${newMaDonHang} thành công!` });
    } catch (e) {
        res.status(500).json({ error: e.message });
    }
});

app.delete('/api/donhang/:id', async (req, res) => {
    try {
        const pool = await getPool();
        await pool.request().input('id', req.params.id).query('DELETE FROM BAO_GOM WHERE MaDonHang = @id');
        await pool.request().input('id', req.params.id).query('DELETE FROM DON_HANG WHERE MaDonHang = @id');
        res.json({ success: true, message: "Đã xóa đơn hàng" });
    } catch (e) { res.status(500).json({ error: e.message }); }
});


// ==========================================
// 10. QUẢN LÝ TỒN KHO
// ==========================================
// Tồn kho KHÔNG CẦN auto-generate ID vì khóa chính là sự kết hợp của (MaKho, MaSP)
app.get('/api/tonkho', (req, res) => executeQuery(res, 'SELECT * FROM TON_KHO'));
app.get('/api/tonkho/:maSP', (req, res) => {
    executeQuery(res, 'SELECT * FROM TON_KHO WHERE MaSP = @maSP', [{ name: 'maSP', value: req.params.maSP }]);
});
app.post('/api/tonkho', (req, res) => {
    executeQuery(res, 
        'INSERT INTO TON_KHO(MaKho, MaSP, SoLuong, ViTriHang, ViTriKhu) VALUES(@kho, @sp, @sl, @vt, @khu)', 
        [
            { name: 'kho', value: req.body.MaKho }, { name: 'sp', value: req.body.MaSP },
            { name: 'sl', value: req.body.SoLuong }, { name: 'vt', value: req.body.ViTriHang }, { name: 'khu', value: req.body.ViTriKhu }
        ]
    );
});
app.put('/api/tonkho/:id', (req, res) => {
    executeQuery(res, 
        'UPDATE TON_KHO SET SoLuong=@sl, ViTriHang=@vt, ViTriKhu=@khu WHERE MaSP=@sp AND MaKho=@kho', 
        [
            { name: 'sl', value: req.body.SoLuong }, { name: 'vt', value: req.body.ViTriHang },
            { name: 'khu', value: req.body.ViTriKhu }, { name: 'sp', value: req.params.id }, { name: 'kho', value: req.body.MaKho }
        ]
    );
});
app.delete('/api/tonkho/:id', (req, res) => {
    executeQuery(res, 'DELETE FROM TON_KHO WHERE MaSP=@id', [{ name: 'id', value: req.params.id }]);
});
// ==========================================
// 11. THỐNG KÊ (DASHBOARD)
// ==========================================
app.get('/api/thongke', async (req, res) => {
    try {
        const pool = await getPool();

        // 1. Tổng doanh thu & Tổng số đơn hàng đã bán
        const q1 = await pool.request().query(`
            SELECT 
                ISNULL(SUM(SoLuongMua * DonGiaBan), 0) AS TongDoanhThu,
                COUNT(DISTINCT MaDonHang) AS TongDonHang
            FROM BAO_GOM
        `);

        // 2. Top 5 chi nhánh có doanh thu cao nhất
        const q2 = await pool.request().query(`
            SELECT TOP 5 
                CN.Ten AS ChiNhanh, 
                ISNULL(SUM(BG.SoLuongMua * BG.DonGiaBan), 0) AS DoanhThu
            FROM BAO_GOM BG
            JOIN DON_HANG DH ON BG.MaDonHang = DH.MaDonHang
            JOIN NHAN_VIEN NV ON DH.MaNV = NV.MaNV
            JOIN CHI_NHANH CN ON NV.MaCN = CN.MaCN
            GROUP BY CN.Ten
            ORDER BY DoanhThu DESC
        `);

        // 3. Top 5 thành phố khách hàng mua nhiều nhất
        const q3 = await pool.request().query(`
            SELECT TOP 5 
                KH.ThanhPho, 
                ISNULL(SUM(BG.SoLuongMua * BG.DonGiaBan), 0) AS DoanhThu, 
                COUNT(DISTINCT DH.MaDonHang) AS SoDon
            FROM BAO_GOM BG
            JOIN DON_HANG DH ON BG.MaDonHang = DH.MaDonHang
            JOIN KHACH_HANG KH ON DH.MaKH = KH.MaKH
            GROUP BY KH.ThanhPho
            ORDER BY DoanhThu DESC
        `);

        res.json({
            tongDoanhThu: q1.recordset[0].TongDoanhThu,
            tongDonHang: q1.recordset[0].TongDonHang,
            chiNhanh: q2.recordset,
            thanhPho: q3.recordset
        });
    } catch (e) {
        res.status(500).json({ error: e.message });
    }
});
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`🚀 Server đang chạy tại port ${PORT}`));