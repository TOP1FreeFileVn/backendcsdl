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
// HÀM HELPER CHUNG ĐỂ RÚT GỌN CODE BACKEND
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

// 1. LOẠI SẢN PHẨM
app.get('/api/loaisp', (req, res) => executeQuery(res, 'SELECT * FROM LOAI_SAN_PHAM'));
app.post('/api/loaisp', (req, res) => executeQuery(res, 'INSERT INTO LOAI_SAN_PHAM(MaLoai, TenLoai) VALUES(@id, @ten)', [{ name: 'id', value: req.body.MaLoai }, { name: 'ten', value: req.body.TenLoai }]));
app.put('/api/loaisp/:id', (req, res) => executeQuery(res, 'UPDATE LOAI_SAN_PHAM SET TenLoai=@ten WHERE MaLoai=@id', [{ name: 'id', value: req.params.id }, { name: 'ten', value: req.body.TenLoai }]));
app.delete('/api/loaisp/:id', (req, res) => executeQuery(res, 'DELETE FROM LOAI_SAN_PHAM WHERE MaLoai=@id', [{ name: 'id', value: req.params.id }]));

// 2. SẢN PHẨM
app.get('/api/sanpham', (req, res) => executeQuery(res, 'SELECT * FROM SAN_PHAM'));
app.post('/api/sanpham', (req, res) => executeQuery(res, 'INSERT INTO SAN_PHAM(MaSP, MoTa, DonGia, Ten, MaLoai) VALUES(@MaSP, @MoTa, @DonGia, @Ten, @MaLoai)', [
    { name: 'MaSP', value: req.body.MaSP }, { name: 'MoTa', value: req.body.MoTa }, { name: 'DonGia', value: req.body.DonGia }, { name: 'Ten', value: req.body.Ten }, { name: 'MaLoai', value: req.body.MaLoai }
]));
app.put('/api/sanpham/:id', (req, res) => executeQuery(res, 'UPDATE SAN_PHAM SET MoTa=@MoTa, DonGia=@DonGia, Ten=@Ten, MaLoai=@MaLoai WHERE MaSP=@id', [
    { name: 'id', value: req.params.id }, { name: 'MoTa', value: req.body.MoTa }, { name: 'DonGia', value: req.body.DonGia }, { name: 'Ten', value: req.body.Ten }, { name: 'MaLoai', value: req.body.MaLoai }
]));
app.delete('/api/sanpham/:id', (req, res) => executeQuery(res, 'DELETE FROM SAN_PHAM WHERE MaSP=@id', [{ name: 'id', value: req.params.id }]));

// 3. ĐƠN VỊ CUNG CẤP
app.get('/api/donvicungcap', (req, res) => executeQuery(res, 'SELECT * FROM DON_VI_CUNG_CAP'));
app.post('/api/donvicungcap', (req, res) => executeQuery(res, 'INSERT INTO DON_VI_CUNG_CAP(MaDV, Ten, DiaChi) VALUES(@id, @ten, @diachi)', [{ name: 'id', value: req.body.MaDV }, { name: 'ten', value: req.body.Ten }, { name: 'diachi', value: req.body.DiaChi }]));
app.put('/api/donvicungcap/:id', (req, res) => executeQuery(res, 'UPDATE DON_VI_CUNG_CAP SET Ten=@ten, DiaChi=@diachi WHERE MaDV=@id', [{ name: 'id', value: req.params.id }, { name: 'ten', value: req.body.Ten }, { name: 'diachi', value: req.body.DiaChi }]));
app.delete('/api/donvicungcap/:id', (req, res) => executeQuery(res, 'DELETE FROM DON_VI_CUNG_CAP WHERE MaDV=@id', [{ name: 'id', value: req.params.id }]));

// 4. KHO HÀNG
app.get('/api/khohang', (req, res) => executeQuery(res, 'SELECT * FROM KHO_HANG'));
app.post('/api/khohang', (req, res) => executeQuery(res, 'INSERT INTO KHO_HANG(MaKho, DiaChi) VALUES(@id, @diachi)', [{ name: 'id', value: req.body.MaKho }, { name: 'diachi', value: req.body.DiaChi }]));
app.put('/api/khohang/:id', (req, res) => executeQuery(res, 'UPDATE KHO_HANG SET DiaChi=@diachi WHERE MaKho=@id', [{ name: 'id', value: req.params.id }, { name: 'diachi', value: req.body.DiaChi }]));
app.delete('/api/khohang/:id', (req, res) => executeQuery(res, 'DELETE FROM KHO_HANG WHERE MaKho=@id', [{ name: 'id', value: req.params.id }]));

// 5. CHI NHÁNH
app.get('/api/chinhanh', (req, res) => executeQuery(res, 'SELECT * FROM CHI_NHANH'));
app.post('/api/chinhanh', (req, res) => executeQuery(res, 'INSERT INTO CHI_NHANH(MaCN, Ten, DiaChi) VALUES(@id, @ten, @diachi)', [{ name: 'id', value: req.body.MaCN }, { name: 'ten', value: req.body.Ten }, { name: 'diachi', value: req.body.DiaChi }]));
app.put('/api/chinhanh/:id', (req, res) => executeQuery(res, 'UPDATE CHI_NHANH SET Ten=@ten, DiaChi=@diachi WHERE MaCN=@id', [{ name: 'id', value: req.params.id }, { name: 'ten', value: req.body.Ten }, { name: 'diachi', value: req.body.DiaChi }]));
app.delete('/api/chinhanh/:id', (req, res) => executeQuery(res, 'DELETE FROM CHI_NHANH WHERE MaCN=@id', [{ name: 'id', value: req.params.id }]));

// 6. KHACH HANG
app.get('/api/khachhang', (req, res) => executeQuery(res, 'SELECT * FROM KHACH_HANG'));
app.post('/api/khachhang', (req, res) => executeQuery(res, 'INSERT INTO KHACH_HANG(MaKH, Ten, TheTichDiem, Email, SoNha, Phuong, Quan, ThanhPho) VALUES(@MaKH, @Ten, @TheTichDiem, @Email, @SoNha, @Phuong, @Quan, @ThanhPho)', [
    { name: 'MaKH', value: req.body.MaKH }, { name: 'Ten', value: req.body.Ten }, { name: 'TheTichDiem', value: req.body.TheTichDiem }, { name: 'Email', value: req.body.Email }, { name: 'SoNha', value: req.body.SoNha }, { name: 'Phuong', value: req.body.Phuong }, { name: 'Quan', value: req.body.Quan }, { name: 'ThanhPho', value: req.body.ThanhPho }
]));
app.put('/api/khachhang/:id', (req, res) => executeQuery(res, 'UPDATE KHACH_HANG SET Ten=@Ten, TheTichDiem=@TheTichDiem, Email=@Email, SoNha=@SoNha, Phuong=@Phuong, Quan=@Quan, ThanhPho=@ThanhPho WHERE MaKH=@id', [
    { name: 'id', value: req.params.id }, { name: 'Ten', value: req.body.Ten }, { name: 'TheTichDiem', value: req.body.TheTichDiem }, { name: 'Email', value: req.body.Email }, { name: 'SoNha', value: req.body.SoNha }, { name: 'Phuong', value: req.body.Phuong }, { name: 'Quan', value: req.body.Quan }, { name: 'ThanhPho', value: req.body.ThanhPho }
]));
app.delete('/api/khachhang/:id', (req, res) => executeQuery(res, 'DELETE FROM KHACH_HANG WHERE MaKH=@id', [{ name: 'id', value: req.params.id }]));

// 7. VỊ TRÍ
app.get('/api/vitri', (req, res) => executeQuery(res, 'SELECT * FROM VI_TRI'));
app.post('/api/vitri', (req, res) => executeQuery(res, 'INSERT INTO VI_TRI(MaViTri, LuongTheoGio, TenViTri) VALUES(@id, @luong, @ten)', [{ name: 'id', value: req.body.MaViTri }, { name: 'luong', value: req.body.LuongTheoGio }, { name: 'ten', value: req.body.TenViTri }]));
app.put('/api/vitri/:id', (req, res) => executeQuery(res, 'UPDATE VI_TRI SET LuongTheoGio=@luong, TenViTri=@ten WHERE MaViTri=@id', [{ name: 'id', value: req.params.id }, { name: 'luong', value: req.body.LuongTheoGio }, { name: 'ten', value: req.body.TenViTri }]));
app.delete('/api/vitri/:id', (req, res) => executeQuery(res, 'DELETE FROM VI_TRI WHERE MaViTri=@id', [{ name: 'id', value: req.params.id }]));

// 8. NHÂN VIÊN
app.get('/api/nhanvien', (req, res) => executeQuery(res, 'SELECT * FROM NHAN_VIEN'));
app.post('/api/nhanvien', (req, res) => executeQuery(res, 'INSERT INTO NHAN_VIEN(MaNV, ThoiGianLamViecTrongNgay, HoVaTen, Email, DiaChi, SoDienThoai, MaCN, MaNguoiQuanLy, MaViTri) VALUES(@MaNV, @ThoiGian, @HoVaTen, @Email, @DiaChi, @SDT, @MaCN, @MaNQL, @MaVT)', [
    { name: 'MaNV', value: req.body.MaNV }, { name: 'ThoiGian', value: req.body.ThoiGianLamViecTrongNgay }, { name: 'HoVaTen', value: req.body.HoVaTen }, { name: 'Email', value: req.body.Email }, { name: 'DiaChi', value: req.body.DiaChi }, { name: 'SDT', value: req.body.SoDienThoai }, { name: 'MaCN', value: req.body.MaCN }, { name: 'MaNQL', value: req.body.MaNguoiQuanLy }, { name: 'MaVT', value: req.body.MaViTri }
]));
app.put('/api/nhanvien/:id', (req, res) => executeQuery(res, 'UPDATE NHAN_VIEN SET ThoiGianLamViecTrongNgay=@ThoiGian, HoVaTen=@HoVaTen, Email=@Email, DiaChi=@DiaChi, SoDienThoai=@SDT, MaCN=@MaCN, MaNguoiQuanLy=@MaNQL, MaViTri=@MaVT WHERE MaNV=@id', [
    { name: 'id', value: req.params.id }, { name: 'ThoiGian', value: req.body.ThoiGianLamViecTrongNgay }, { name: 'HoVaTen', value: req.body.HoVaTen }, { name: 'Email', value: req.body.Email }, { name: 'DiaChi', value: req.body.DiaChi }, { name: 'SDT', value: req.body.SoDienThoai }, { name: 'MaCN', value: req.body.MaCN }, { name: 'MaNQL', value: req.body.MaNguoiQuanLy }, { name: 'MaVT', value: req.body.MaViTri }
]));
app.delete('/api/nhanvien/:id', (req, res) => executeQuery(res, 'DELETE FROM NHAN_VIEN WHERE MaNV=@id', [{ name: 'id', value: req.params.id }]));

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`🚀 Server đang chạy tại port ${PORT}`));