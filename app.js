const sql = require('mssql');
const express = require('express');
const cors = require('cors');
const config = require('./dbconfig');

const app = express();
app.use(cors());
app.use(express.json());

// ====== HELPER ======
async function getPool() {
  return await sql.connect(config);
}

// ==================== LOAI SAN PHAM ====================
app.get('/api/loaisp', async (req, res) => {
  try {
    const pool = await getPool();
    const r = await pool.request().query('SELECT * FROM LOAI_SAN_PHAM');
    res.json(r.recordset);
  } catch (e) { res.status(500).json({ error: e.message }); }
});

app.post('/api/loaisp', async (req, res) => {
  try {
    const { MaLoai, TenLoai } = req.body;
    const pool = await getPool();
    await pool.request()
      .input('MaLoai', MaLoai).input('TenLoai', TenLoai)
      .query('INSERT INTO LOAI_SAN_PHAM(MaLoai,TenLoai) VALUES(@MaLoai,@TenLoai)');
    res.json({ success: true });
  } catch (e) { res.status(500).json({ error: e.message }); }
});

app.put('/api/loaisp/:id', async (req, res) => {
  try {
    const { TenLoai } = req.body;
    const pool = await getPool();
    await pool.request()
      .input('id', req.params.id).input('TenLoai', TenLoai)
      .query('UPDATE LOAI_SAN_PHAM SET TenLoai=@TenLoai WHERE MaLoai=@id');
    res.json({ success: true });
  } catch (e) { res.status(500).json({ error: e.message }); }
});

app.delete('/api/loaisp/:id', async (req, res) => {
  try {
    const pool = await getPool();
    await pool.request().input('id', req.params.id)
      .query('DELETE FROM LOAI_SAN_PHAM WHERE MaLoai=@id');
    res.json({ success: true });
  } catch (e) { res.status(500).json({ error: e.message }); }
});

// ==================== SAN PHAM ====================
app.get('/api/sanpham', async (req, res) => {
  try {
    const pool = await getPool();
    const r = await pool.request().query('SELECT * FROM SAN_PHAM');
    res.json(r.recordset);
  } catch (e) { res.status(500).json({ error: e.message }); }
});

app.post('/api/sanpham', async (req, res) => {
  try {
    const { MaSP, MoTa, DonGia, Ten, MaLoai } = req.body;
    const pool = await getPool();
    await pool.request()
      .input('MaSP', MaSP).input('MoTa', MoTa)
      .input('DonGia', DonGia).input('Ten', Ten).input('MaLoai', MaLoai)
      .query('INSERT INTO SAN_PHAM(MaSP,MoTa,DonGia,Ten,MaLoai) VALUES(@MaSP,@MoTa,@DonGia,@Ten,@MaLoai)');
    res.json({ success: true });
  } catch (e) { res.status(500).json({ error: e.message }); }
});

app.put('/api/sanpham/:id', async (req, res) => {
  try {
    const { MoTa, DonGia, Ten, MaLoai } = req.body;
    const pool = await getPool();
    await pool.request()
      .input('id', req.params.id).input('MoTa', MoTa)
      .input('DonGia', DonGia).input('Ten', Ten).input('MaLoai', MaLoai)
      .query('UPDATE SAN_PHAM SET MoTa=@MoTa,DonGia=@DonGia,Ten=@Ten,MaLoai=@MaLoai WHERE MaSP=@id');
    res.json({ success: true });
  } catch (e) { res.status(500).json({ error: e.message }); }
});

app.delete('/api/sanpham/:id', async (req, res) => {
  try {
    const pool = await getPool();
    await pool.request().input('id', req.params.id)
      .query('DELETE FROM SAN_PHAM WHERE MaSP=@id');
    res.json({ success: true });
  } catch (e) { res.status(500).json({ error: e.message }); }
});

// ==================== KHACH HANG ====================
app.get('/api/khachhang', async (req, res) => {
  try {
    const pool = await getPool();
    const r = await pool.request().query('SELECT * FROM KHACH_HANG');
    res.json(r.recordset);
  } catch (e) { res.status(500).json({ error: e.message }); }
});

app.post('/api/khachhang', async (req, res) => {
  try {
    const { MaKH, Ten, TheTichDiem, Email, SoNha, Phuong, Quan, ThanhPho } = req.body;
    const pool = await getPool();
    await pool.request()
      .input('MaKH', MaKH).input('Ten', Ten).input('TheTichDiem', TheTichDiem)
      .input('Email', Email).input('SoNha', SoNha).input('Phuong', Phuong)
      .input('Quan', Quan).input('ThanhPho', ThanhPho)
      .query('INSERT INTO KHACH_HANG(MaKH,Ten,TheTichDiem,Email,SoNha,Phuong,Quan,ThanhPho) VALUES(@MaKH,@Ten,@TheTichDiem,@Email,@SoNha,@Phuong,@Quan,@ThanhPho)');
    res.json({ success: true });
  } catch (e) { res.status(500).json({ error: e.message }); }
});

app.put('/api/khachhang/:id', async (req, res) => {
  try {
    const { Ten, TheTichDiem, Email, SoNha, Phuong, Quan, ThanhPho } = req.body;
    const pool = await getPool();
    await pool.request()
      .input('id', req.params.id).input('Ten', Ten).input('TheTichDiem', TheTichDiem)
      .input('Email', Email).input('SoNha', SoNha).input('Phuong', Phuong)
      .input('Quan', Quan).input('ThanhPho', ThanhPho)
      .query('UPDATE KHACH_HANG SET Ten=@Ten,TheTichDiem=@TheTichDiem,Email=@Email,SoNha=@SoNha,Phuong=@Phuong,Quan=@Quan,ThanhPho=@ThanhPho WHERE MaKH=@id');
    res.json({ success: true });
  } catch (e) { res.status(500).json({ error: e.message }); }
});

app.delete('/api/khachhang/:id', async (req, res) => {
  try {
    const pool = await getPool();
    await pool.request().input('id', req.params.id)
      .query('DELETE FROM KHACH_HANG WHERE MaKH=@id');
    res.json({ success: true });
  } catch (e) { res.status(500).json({ error: e.message }); }
});

// ==================== CHI NHANH ====================
app.get('/api/chinhanh', async (req, res) => {
  try {
    const pool = await getPool();
    const r = await pool.request().query('SELECT * FROM CHI_NHANH');
    res.json(r.recordset);
  } catch (e) { res.status(500).json({ error: e.message }); }
});

app.post('/api/chinhanh', async (req, res) => {
  try {
    const { MaCN, Ten, DiaChi } = req.body;
    const pool = await getPool();
    await pool.request()
      .input('MaCN', MaCN).input('Ten', Ten).input('DiaChi', DiaChi)
      .query('INSERT INTO CHI_NHANH(MaCN,Ten,DiaChi) VALUES(@MaCN,@Ten,@DiaChi)');
    res.json({ success: true });
  } catch (e) { res.status(500).json({ error: e.message }); }
});

app.put('/api/chinhanh/:id', async (req, res) => {
  try {
    const { Ten, DiaChi } = req.body;
    const pool = await getPool();
    await pool.request()
      .input('id', req.params.id).input('Ten', Ten).input('DiaChi', DiaChi)
      .query('UPDATE CHI_NHANH SET Ten=@Ten,DiaChi=@DiaChi WHERE MaCN=@id');
    res.json({ success: true });
  } catch (e) { res.status(500).json({ error: e.message }); }
});

app.delete('/api/chinhanh/:id', async (req, res) => {
  try {
    const pool = await getPool();
    await pool.request().input('id', req.params.id)
      .query('DELETE FROM CHI_NHANH WHERE MaCN=@id');
    res.json({ success: true });
  } catch (e) { res.status(500).json({ error: e.message }); }
});

// ==================== VI TRI ====================
app.get('/api/vitri', async (req, res) => {
  try {
    const pool = await getPool();
    const r = await pool.request().query('SELECT * FROM VI_TRI');
    res.json(r.recordset);
  } catch (e) { res.status(500).json({ error: e.message }); }
});

// ==================== NHAN VIEN ====================
app.get('/api/nhanvien', async (req, res) => {
  try {
    const pool = await getPool();
    const r = await pool.request().query('SELECT * FROM NHAN_VIEN');
    res.json(r.recordset);
  } catch (e) { res.status(500).json({ error: e.message }); }
});

app.post('/api/nhanvien', async (req, res) => {
  try {
    const { MaNV, ThoiGianLamViecTrongNgay, HoVaTen, Email, DiaChi, SoDienThoai, MaCN, MaNguoiQuanLy, MaViTri } = req.body;
    const pool = await getPool();
    await pool.request()
      .input('MaNV', MaNV).input('ThoiGianLamViecTrongNgay', ThoiGianLamViecTrongNgay)
      .input('HoVaTen', HoVaTen).input('Email', Email).input('DiaChi', DiaChi)
      .input('SoDienThoai', SoDienThoai).input('MaCN', MaCN)
      .input('MaNguoiQuanLy', MaNguoiQuanLy).input('MaViTri', MaViTri)
      .query('INSERT INTO NHAN_VIEN(MaNV,ThoiGianLamViecTrongNgay,HoVaTen,Email,DiaChi,SoDienThoai,MaCN,MaNguoiQuanLy,MaViTri) VALUES(@MaNV,@ThoiGianLamViecTrongNgay,@HoVaTen,@Email,@DiaChi,@SoDienThoai,@MaCN,@MaNguoiQuanLy,@MaViTri)');
    res.json({ success: true });
  } catch (e) { res.status(500).json({ error: e.message }); }
});

app.put('/api/nhanvien/:id', async (req, res) => {
  try {
    const { ThoiGianLamViecTrongNgay, HoVaTen, Email, DiaChi, SoDienThoai, MaCN, MaNguoiQuanLy, MaViTri } = req.body;
    const pool = await getPool();
    await pool.request()
      .input('id', req.params.id)
      .input('ThoiGianLamViecTrongNgay', ThoiGianLamViecTrongNgay)
      .input('HoVaTen', HoVaTen).input('Email', Email).input('DiaChi', DiaChi)
      .input('SoDienThoai', SoDienThoai).input('MaCN', MaCN)
      .input('MaNguoiQuanLy', MaNguoiQuanLy).input('MaViTri', MaViTri)
      .query('UPDATE NHAN_VIEN SET ThoiGianLamViecTrongNgay=@ThoiGianLamViecTrongNgay,HoVaTen=@HoVaTen,Email=@Email,DiaChi=@DiaChi,SoDienThoai=@SoDienThoai,MaCN=@MaCN,MaNguoiQuanLy=@MaNguoiQuanLy,MaViTri=@MaViTri WHERE MaNV=@id');
    res.json({ success: true });
  } catch (e) { res.status(500).json({ error: e.message }); }
});

app.delete('/api/nhanvien/:id', async (req, res) => {
  try {
    const pool = await getPool();
    await pool.request().input('id', req.params.id)
      .query('DELETE FROM NHAN_VIEN WHERE MaNV=@id');
    res.json({ success: true });
  } catch (e) { res.status(500).json({ error: e.message }); }
});

// ==================== DON HANG ====================
app.get('/api/donhang', async (req, res) => {
  try {
    const pool = await getPool();
    const r = await pool.request().query('SELECT * FROM DON_HANG');
    res.json(r.recordset);
  } catch (e) { res.status(500).json({ error: e.message }); }
});

app.post('/api/donhang', async (req, res) => {
  try {
    const { MaDonHang, NgayMua, PhuongThucThanhToan, MaKH, MaNV } = req.body;
    const pool = await getPool();
    await pool.request()
      .input('MaDonHang', MaDonHang).input('NgayMua', NgayMua)
      .input('PhuongThucThanhToan', PhuongThucThanhToan)
      .input('MaKH', MaKH).input('MaNV', MaNV)
      .query('INSERT INTO DON_HANG(MaDonHang,NgayMua,PhuongThucThanhToan,MaKH,MaNV) VALUES(@MaDonHang,@NgayMua,@PhuongThucThanhToan,@MaKH,@MaNV)');
    res.json({ success: true });
  } catch (e) { res.status(500).json({ error: e.message }); }
});

app.delete('/api/donhang/:id', async (req, res) => {
  try {
    const pool = await getPool();
    await pool.request().input('id', req.params.id)
      .query('DELETE FROM DON_HANG WHERE MaDonHang=@id');
    res.json({ success: true });
  } catch (e) { res.status(500).json({ error: e.message }); }
});

// ==================== NHA CUNG CAP ====================
app.get('/api/nhacc', async (req, res) => {
  try {
    const pool = await getPool();
    const r = await pool.request().query('SELECT * FROM DON_VI_CUNG_CAP');
    res.json(r.recordset);
  } catch (e) { res.status(500).json({ error: e.message }); }
});

app.post('/api/nhacc', async (req, res) => {
  try {
    const { MaDV, Ten, DiaChi } = req.body;
    const pool = await getPool();
    await pool.request()
      .input('MaDV', MaDV).input('Ten', Ten).input('DiaChi', DiaChi)
      .query('INSERT INTO DON_VI_CUNG_CAP(MaDV,Ten,DiaChi) VALUES(@MaDV,@Ten,@DiaChi)');
    res.json({ success: true });
  } catch (e) { res.status(500).json({ error: e.message }); }
});

app.put('/api/nhacc/:id', async (req, res) => {
  try {
    const { Ten, DiaChi } = req.body;
    const pool = await getPool();
    await pool.request()
      .input('id', req.params.id).input('Ten', Ten).input('DiaChi', DiaChi)
      .query('UPDATE DON_VI_CUNG_CAP SET Ten=@Ten,DiaChi=@DiaChi WHERE MaDV=@id');
    res.json({ success: true });
  } catch (e) { res.status(500).json({ error: e.message }); }
});

app.delete('/api/nhacc/:id', async (req, res) => {
  try {
    const pool = await getPool();
    await pool.request().input('id', req.params.id)
      .query('DELETE FROM DON_VI_CUNG_CAP WHERE MaDV=@id');
    res.json({ success: true });
  } catch (e) { res.status(500).json({ error: e.message }); }
});

// ==================== TON KHO ====================
app.get('/api/tonkho', async (req, res) => {
  try {
    const pool = await getPool();
    const r = await pool.request().query('SELECT * FROM TON_KHO');
    res.json(r.recordset);
  } catch (e) { res.status(500).json({ error: e.message }); }
});

app.post('/api/tonkho', async (req, res) => {
  try {
    const { MaSP, MaKho, SoLuong, ViTriHang, ViTriKhu } = req.body;
    const pool = await getPool();
    await pool.request()
      .input('MaSP', MaSP).input('MaKho', MaKho).input('SoLuong', SoLuong)
      .input('ViTriHang', ViTriHang).input('ViTriKhu', ViTriKhu)
      .query('INSERT INTO TON_KHO(SoLuong,ViTriHang,ViTriKhu,MaSP,MaKho) VALUES(@SoLuong,@ViTriHang,@ViTriKhu,@MaSP,@MaKho)');
    res.json({ success: true });
  } catch (e) { res.status(500).json({ error: e.message }); }
});

app.delete('/api/tonkho/:maSP/:maKho', async (req, res) => {
  try {
    const pool = await getPool();
    await pool.request()
      .input('maSP', req.params.maSP).input('maKho', req.params.maKho)
      .query('DELETE FROM TON_KHO WHERE MaSP=@maSP AND MaKho=@maKho');
    res.json({ success: true });
  } catch (e) { res.status(500).json({ error: e.message }); }
});

// ==================== PHIEU NHAP HANG ====================
app.get('/api/phieunhap', async (req, res) => {
  try {
    const pool = await getPool();
    const r = await pool.request().query('SELECT * FROM PHIEU_NHAP_HANG');
    res.json(r.recordset);
  } catch (e) { res.status(500).json({ error: e.message }); }
});

app.post('/api/phieunhap', async (req, res) => {
  try {
    const { MaPhieu, NgayNhap } = req.body;
    const pool = await getPool();
    await pool.request()
      .input('MaPhieu', MaPhieu).input('NgayNhap', NgayNhap)
      .query('INSERT INTO PHIEU_NHAP_HANG(MaPhieu,NgayNhap) VALUES(@MaPhieu,@NgayNhap)');
    res.json({ success: true });
  } catch (e) { res.status(500).json({ error: e.message }); }
});

app.delete('/api/phieunhap/:id', async (req, res) => {
  try {
    const pool = await getPool();
    await pool.request().input('id', req.params.id)
      .query('DELETE FROM PHIEU_NHAP_HANG WHERE MaPhieu=@id');
    res.json({ success: true });
  } catch (e) { res.status(500).json({ error: e.message }); }
});

// ==================== START SERVER ====================
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`🚀 Server chạy tại port ${PORT}`));
