require('dotenv').config();
const sql = require('mssql');
const express = require('express');
const cors = require('cors');

const app = express();
app.use(cors());
app.use(express.json());

const dbConfig = {
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    server: process.env.DB_SERVER,
    database: process.env.DB_NAME,
    options: { encrypt: true, trustServerCertificate: true },
    port: 1433
};

async function getPool() { return await sql.connect(dbConfig); }

async function executeQuery(res, query, inputs = []) {
    try {
        const pool = await getPool();
        const request = pool.request();
        inputs.forEach(input => {
            if (typeof input.value === 'string') request.input(input.name, sql.NVarChar, input.value);
            else request.input(input.name, input.value);
        });
        const result = await request.query(query);
        res.json(result.recordset || { success: true });
    } catch (e) { res.status(500).json({ error: e.message }); }
}

async function generateId(tableName, idColumn, prefix) {
    const pool = await getPool();
    const result = await pool.request().query(`SELECT TOP 1 ${idColumn} AS maxId FROM ${tableName} WHERE ${idColumn} LIKE '${prefix}%' ORDER BY ${idColumn} DESC`);
    if (result.recordset.length === 0) return prefix + '001';
    const numberPart = result.recordset[0].maxId.replace(prefix, '');
    return prefix + String(parseInt(numberPart, 10) + 1).padStart(3, '0');
}

async function generateOrderId() {
    const date = new Date();
    const prefix = `DH${String(date.getFullYear()).slice(-2)}${String(date.getMonth() + 1).padStart(2, '0')}${String(date.getDate()).padStart(2, '0')}-`;
    const pool = await getPool();
    const result = await pool.request().query(`SELECT TOP 1 MaDH AS maxId FROM DON_HANG WHERE MaDH LIKE '${prefix}%' ORDER BY MaDH DESC`);
    if (result.recordset.length === 0) return prefix + '001';
    const lastId = result.recordset[0].maxId;
    let lastNumber = 0;
    if (lastId.includes('-')) lastNumber = parseInt(lastId.split('-')[1], 10);
    else lastNumber = parseInt(lastId.replace(prefix, ''), 10) || 0;
    return prefix + String(lastNumber + 1).padStart(3, '0');
}

const paidOrders = new Set();
app.post('/api/webhook/sepay', async (req, res) => {
    try {
        const data = req.body;
        const match = data.content.match(/DH\d{6}-?\d{3}/i);
        if (match) {
            let maDon = match[0].toUpperCase();
            if (!maDon.includes('-')) maDon = maDon.slice(0, 8) + '-' + maDon.slice(8);
            paidOrders.add(maDon);
        }
        res.status(200).json({ success: true });
    } catch (error) { res.status(500).json({ error: 'Internal Server Error' }); }
});

app.get('/api/check-payment/:id', (req, res) => {
    const isPaid = paidOrders.has(req.params.id);
    if (isPaid) paidOrders.delete(req.params.id);
    res.json({ isPaid });
});

app.get('/api/loaisp', (req, res) => executeQuery(res, 'SELECT * FROM LOAI_SAN_PHAM'));
app.post('/api/loaisp', async (req, res) => { try { const id = await generateId('LOAI_SAN_PHAM', 'MaLoai', 'LSP'); await executeQuery(res, 'INSERT INTO LOAI_SAN_PHAM VALUES(@id, @ten)', [{name:'id', value:id}, {name:'ten', value:req.body.TenLoai}]); } catch(e) { res.status(500).json({error:e.message}); }});
app.put('/api/loaisp/:id', (req, res) => executeQuery(res, 'UPDATE LOAI_SAN_PHAM SET TenLoai=@ten WHERE MaLoai=@id', [{name:'id', value:req.params.id}, {name:'ten', value:req.body.TenLoai}]));
app.delete('/api/loaisp/:id', (req, res) => executeQuery(res, 'DELETE FROM LOAI_SAN_PHAM WHERE MaLoai=@id', [{name:'id', value:req.params.id}]));

app.get('/api/sanpham', (req, res) => executeQuery(res, 'SELECT * FROM SAN_PHAM'));
app.post('/api/sanpham', async (req, res) => { try { const id = await generateId('SAN_PHAM', 'MaSP', 'SP'); await executeQuery(res, 'INSERT INTO SAN_PHAM VALUES(@id, @ten, @gia, @mt, @ml)', [{name:'id', value:id}, {name:'ten', value:req.body.Ten}, {name:'gia', value:req.body.DonGia}, {name:'mt', value:req.body.MoTa}, {name:'ml', value:req.body.MaLoai}]); } catch(e) { res.status(500).json({error:e.message}); }});
app.put('/api/sanpham/:id', (req, res) => executeQuery(res, 'UPDATE SAN_PHAM SET Ten=@ten, DonGia=@gia, MoTa=@mt, MaLoai=@ml WHERE MaSP=@id', [{name:'id', value:req.params.id}, {name:'ten', value:req.body.Ten}, {name:'gia', value:req.body.DonGia}, {name:'mt', value:req.body.MoTa}, {name:'ml', value:req.body.MaLoai}]));
app.delete('/api/sanpham/:id', (req, res) => executeQuery(res, 'DELETE FROM SAN_PHAM WHERE MaSP=@id', [{name:'id', value:req.params.id}]));

app.get('/api/diadiem', (req, res) => executeQuery(res, 'SELECT * FROM DIA_DIEM'));
app.post('/api/diadiem', async (req, res) => { try { const id = await generateId('DIA_DIEM', 'MaDD', 'DD'); await executeQuery(res, 'INSERT INTO DIA_DIEM VALUES(@id, @ten, @sn, @p, @q, @tp, @loai)', [{name:'id', value:id}, {name:'ten', value:req.body.Ten}, {name:'sn', value:req.body.SoNha||null}, {name:'p', value:req.body.Phuong||null}, {name:'q', value:req.body.Quan||null}, {name:'tp', value:req.body.ThanhPho||null}, {name:'loai', value:req.body.LoaiDD}]); } catch(e) { res.status(500).json({error:e.message}); }});
app.put('/api/diadiem/:id', (req, res) => executeQuery(res, 'UPDATE DIA_DIEM SET Ten=@ten, SoNha=@sn, Phuong=@p, Quan=@q, ThanhPho=@tp, LoaiDD=@loai WHERE MaDD=@id', [{name:'id', value:req.params.id}, {name:'ten', value:req.body.Ten}, {name:'sn', value:req.body.SoNha||null}, {name:'p', value:req.body.Phuong||null}, {name:'q', value:req.body.Quan||null}, {name:'tp', value:req.body.ThanhPho||null}, {name:'loai', value:req.body.LoaiDD}]));
app.delete('/api/diadiem/:id', (req, res) => executeQuery(res, 'DELETE FROM DIA_DIEM WHERE MaDD=@id', [{name:'id', value:req.params.id}]));

app.get('/api/donvicungcap', (req, res) => executeQuery(res, 'SELECT * FROM DON_VI_CUNG_CAP'));
app.post('/api/donvicungcap', async (req, res) => { try { const id = await generateId('DON_VI_CUNG_CAP', 'MaDV', 'NCC'); await executeQuery(res, 'INSERT INTO DON_VI_CUNG_CAP VALUES(@id, @ten, @sdt, @dc)', [{name:'id', value:id}, {name:'ten', value:req.body.TenDV}, {name:'sdt', value:req.body.SDT||null}, {name:'dc', value:req.body.DiaChi||null}]); } catch(e) { res.status(500).json({error:e.message}); }});
app.put('/api/donvicungcap/:id', (req, res) => executeQuery(res, 'UPDATE DON_VI_CUNG_CAP SET TenDV=@ten, SDT=@sdt, DiaChi=@dc WHERE MaDV=@id', [{name:'id', value:req.params.id}, {name:'ten', value:req.body.TenDV}, {name:'sdt', value:req.body.SDT||null}, {name:'dc', value:req.body.DiaChi||null}]));
app.delete('/api/donvicungcap/:id', (req, res) => executeQuery(res, 'DELETE FROM DON_VI_CUNG_CAP WHERE MaDV=@id', [{name:'id', value:req.params.id}]));

app.get('/api/khachhang', (req, res) => executeQuery(res, 'SELECT * FROM KHACH_HANG'));
app.post('/api/khachhang', async (req, res) => { try { const id = await generateId('KHACH_HANG', 'MaKH', 'KH'); await executeQuery(res, 'INSERT INTO KHACH_HANG VALUES(@id, @ten, @sdt, @em, @the, @dc)', [{name:'id', value:id}, {name:'ten', value:req.body.TenKH}, {name:'sdt', value:req.body.SDT||null}, {name:'em', value:req.body.Email||null}, {name:'the', value:req.body.TheTichDiem||null}, {name:'dc', value:req.body.DiaChi||null}]); } catch(e) { res.status(500).json({error:e.message}); }});
app.put('/api/khachhang/:id', (req, res) => executeQuery(res, 'UPDATE KHACH_HANG SET TenKH=@ten, SDT=@sdt, Email=@em, TheTichDiem=@the, DiaChi=@dc WHERE MaKH=@id', [{name:'id', value:req.params.id}, {name:'ten', value:req.body.TenKH}, {name:'sdt', value:req.body.SDT||null}, {name:'em', value:req.body.Email||null}, {name:'the', value:req.body.TheTichDiem||null}, {name:'dc', value:req.body.DiaChi||null}]));
app.delete('/api/khachhang/:id', (req, res) => executeQuery(res, 'DELETE FROM KHACH_HANG WHERE MaKH=@id', [{name:'id', value:req.params.id}]));

app.get('/api/nhanvien', (req, res) => executeQuery(res, 'SELECT * FROM NHAN_VIEN'));
app.post('/api/nhanvien', async (req, res) => { try { const id = await generateId('NHAN_VIEN', 'MaNV', 'NV'); await executeQuery(res, 'INSERT INTO NHAN_VIEN VALUES(@id, @ht, @sdt, @em, @luong, @vt, @madd)', [{name:'id', value:id}, {name:'ht', value:req.body.HoTen}, {name:'sdt', value:req.body.SDT||null}, {name:'em', value:req.body.Email||null}, {name:'luong', value:req.body.MucLuong}, {name:'vt', value:req.body.ViTri||null}, {name:'madd', value:req.body.MaDD}]); } catch(e) { res.status(500).json({error:e.message}); }});
app.put('/api/nhanvien/:id', (req, res) => executeQuery(res, 'UPDATE NHAN_VIEN SET HoTen=@ht, SDT=@sdt, Email=@em, MucLuong=@luong, ViTri=@vt, MaDD=@madd WHERE MaNV=@id', [{name:'id', value:req.params.id}, {name:'ht', value:req.body.HoTen}, {name:'sdt', value:req.body.SDT||null}, {name:'em', value:req.body.Email||null}, {name:'luong', value:req.body.MucLuong}, {name:'vt', value:req.body.ViTri||null}, {name:'madd', value:req.body.MaDD}]));
app.delete('/api/nhanvien/:id', (req, res) => executeQuery(res, 'DELETE FROM NHAN_VIEN WHERE MaNV=@id', [{name:'id', value:req.params.id}]));

app.get('/api/khuvuc', (req, res) => executeQuery(res, 'SELECT * FROM KHU_VUC'));
app.post('/api/khuvuc', async (req, res) => { try { const id = await generateId('KHU_VUC', 'MaKhu', 'KV'); await executeQuery(res, 'INSERT INTO KHU_VUC(MaKhu, TenKhu, MaDD) VALUES(@id, @ten, @madd)', [{name:'id', value:id}, {name:'ten', value:req.body.TenKhu}, {name:'madd', value:req.body.MaDD}]); } catch(e) { res.status(500).json({error:e.message}); }});
app.put('/api/khuvuc/:id', (req, res) => executeQuery(res, 'UPDATE KHU_VUC SET TenKhu=@ten, MaDD=@madd WHERE MaKhu=@id', [{name:'id', value:req.params.id}, {name:'ten', value:req.body.TenKhu}, {name:'madd', value:req.body.MaDD}]));
app.delete('/api/khuvuc/:id', (req, res) => executeQuery(res, 'DELETE FROM KHU_VUC WHERE MaKhu=@id', [{name:'id', value:req.params.id}]));

app.get('/api/kehang', (req, res) => executeQuery(res, 'SELECT * FROM KE_HANG'));
app.post('/api/kehang', async (req, res) => { try { const id = await generateId('KE_HANG', 'MaKe', 'KE'); await executeQuery(res, 'INSERT INTO KE_HANG(MaKe, TenKe, SucChua, SoTang, MaKhu) VALUES(@id, @ten, @suc, @tang, @makhu)', [{name:'id', value:id}, {name:'ten', value:req.body.TenKe}, {name:'suc', value:req.body.SucChua}, {name:'tang', value:req.body.SoTang}, {name:'makhu', value:req.body.MaKhu}]); } catch(e) { res.status(500).json({error:e.message}); }});
app.put('/api/kehang/:id', (req, res) => executeQuery(res, 'UPDATE KE_HANG SET TenKe=@ten, SucChua=@suc, SoTang=@tang, MaKhu=@makhu WHERE MaKe=@id', [{name:'id', value:req.params.id}, {name:'ten', value:req.body.TenKe}, {name:'suc', value:req.body.SucChua}, {name:'tang', value:req.body.SoTang}, {name:'makhu', value:req.body.MaKhu}]));
app.delete('/api/kehang/:id', (req, res) => executeQuery(res, 'DELETE FROM KE_HANG WHERE MaKe=@id', [{name:'id', value:req.params.id}]));

app.get('/api/tonkho', (req, res) => executeQuery(res, 'SELECT * FROM TON_KHO'));
app.put('/api/tonkho/:id', (req, res) => executeQuery(res, 'UPDATE TON_KHO SET SoLuong=@sl WHERE MaSP=@id AND MaKe=@make', [{name:'sl', value:req.body.SoLuong}, {name:'id', value:req.params.id}, {name:'make', value:req.body.MaKe}]));
app.delete('/api/tonkho/:id', (req, res) => executeQuery(res, 'DELETE FROM TON_KHO WHERE MaSP=@id', [{name:'id', value:req.params.id}]));

app.get('/api/phieukho', (req, res) => executeQuery(res, 'SELECT * FROM PHIEU_KHO ORDER BY NgayLap DESC, MaPhieu DESC'));

app.post('/api/phieukho', async (req, res) => {
    let { LoaiPhieu, MaNV, MaSP, MaKe, SoLuong } = req.body;
    if (!MaSP || !MaKe || !SoLuong || SoLuong <= 0) return res.status(400).json({ error: "Invalid parameters" });
    let transaction;
    try {
        const pool = await getPool();
        transaction = new sql.Transaction(pool);
        await transaction.begin();
        const reqDD = new sql.Request(transaction);
        const ddInfo = await reqDD.input('make', sql.VarChar, MaKe).query(`SELECT MaDD FROM KHU_VUC WHERE MaKhu = (SELECT MaKhu FROM KE_HANG WHERE MaKe = @make)`);
        if (ddInfo.recordset.length === 0) throw new Error("Invalid");
        const maDD = ddInfo.recordset[0].MaDD;
        const pnResult = await new sql.Request(transaction).query(`SELECT TOP 1 MaPhieu AS maxId FROM PHIEU_KHO WHERE MaPhieu LIKE 'PN%' ORDER BY MaPhieu DESC`);
        let newMaPN = pnResult.recordset.length > 0 ? 'PN' + String(parseInt(pnResult.recordset[0].maxId.replace('PN',''), 10)+1).padStart(3, '0') : 'PN001';
        await new sql.Request(transaction).input('mp', sql.VarChar, newMaPN).input('manv', sql.VarChar, MaNV).input('madd', sql.VarChar, maDD).input('loai', sql.NVarChar, LoaiPhieu || 'Nhập NCC').query(`INSERT INTO PHIEU_KHO(MaPhieu, NgayLap, LoaiPhieu, MaNV, MaDD) VALUES(@mp, GETDATE(), @loai, @manv, @madd)`);
        await new sql.Request(transaction).input('mp', sql.VarChar, newMaPN).input('masp', sql.VarChar, MaSP).input('sl', sql.Int, SoLuong).query(`INSERT INTO CHI_TIET_PHIEU(MaPhieu, MaSP, SoLuongNhap, GiaNhap) VALUES(@mp, @masp, @sl, 0)`);
        const checkKho = await new sql.Request(transaction).input('masp', sql.VarChar, MaSP).input('make', sql.VarChar, MaKe).query(`SELECT * FROM TON_KHO WHERE MaSP = @masp AND MaKe = @make`);
        if (checkKho.recordset.length > 0) {
            await new sql.Request(transaction).input('masp', sql.VarChar, MaSP).input('make', sql.VarChar, MaKe).input('sl', sql.Int, SoLuong).query(`UPDATE TON_KHO SET SoLuong = SoLuong + @sl WHERE MaSP = @masp AND MaKe = @make`);
        } else {
            await new sql.Request(transaction).input('masp', sql.VarChar, MaSP).input('make', sql.VarChar, MaKe).input('sl', sql.Int, SoLuong).query(`INSERT INTO TON_KHO(MaSP, MaKe, SoLuong) VALUES(@masp, @make, @sl)`);
        }
        await transaction.commit();
        res.json({ success: true, message: `Success` });
    } catch (e) {
        if (transaction) await transaction.rollback();
        res.status(500).json({ error: e.message });
    }
});

app.get('/api/pos/sanpham', (req, res) => {
    executeQuery(res, `SELECT SP.MaSP, SP.Ten, SP.DonGia, ISNULL(SUM(TK.SoLuong), 0) AS TongTonKho FROM SAN_PHAM SP JOIN TON_KHO TK ON SP.MaSP = TK.MaSP GROUP BY SP.MaSP, SP.Ten, SP.DonGia HAVING ISNULL(SUM(TK.SoLuong), 0) > 0`);
});

app.get('/api/donhang/generate-id', async (req, res) => {
    try { const newId = await generateOrderId(); res.json({ newId }); } catch (e) { res.status(500).json({ error: e.message }); }
});

app.get('/api/donhang', (req, res) => {
    const query = `SELECT DH.MaDH, ISNULL(GD.NgayGD, DH.NgayMua) AS NgayMua, DH.TongTien, DH.MaKH, DH.MaNV, GD.PhuongThuc, ISNULL(GD.TrangThai, N'Chưa trả') AS TrangThaiGD FROM DON_HANG DH LEFT JOIN GIAO_DICH GD ON DH.MaDH = GD.MaDH ORDER BY DH.NgayMua DESC, DH.MaDH DESC`;
    executeQuery(res, query);
});

app.post('/api/donhang', async (req, res) => {
    let { MaDonHang, NgayMua, PhuongThucThanhToan, MaKH, MaNV, ChiTiet } = req.body;
    if (!ChiTiet || ChiTiet.length === 0) return res.status(400).json({ error: "Empty" });
    let transaction;
    try {
        const pool = await getPool();
        const newMaDH = MaDonHang || await generateOrderId();
        let tongTien = ChiTiet.reduce((sum, item) => sum + (item.DonGiaBan * item.SoLuongMua), 0);
        transaction = new sql.Transaction(pool);
        await transaction.begin();
        const reqDD = new sql.Request(transaction);
        const ddInfo = await reqDD.input('manv', sql.VarChar, MaNV).query(`SELECT DD.MaDD, ISNULL(DD.SoNha + ', ' + DD.Phuong + ', ' + DD.Quan + ', ' + DD.ThanhPho, N'Store') AS DiaChiFull FROM NHAN_VIEN NV JOIN DIA_DIEM DD ON NV.MaDD = DD.MaDD WHERE NV.MaNV = @manv`);
        const maDDNV = ddInfo.recordset[0].MaDD;
        if (!MaKH) {
            const reqCheck = new sql.Request(transaction);
            const checkResult = await reqCheck.query(`SELECT TOP 1 MaKH FROM KHACH_HANG WHERE TenKH = N'Khách Vãng Lai'`);
            if (checkResult.recordset.length > 0) { MaKH = checkResult.recordset[0].MaKH; } 
            else {
                const reqGenID = new sql.Request(transaction);
                const idResult = await reqGenID.query(`SELECT TOP 1 MaKH AS maxId FROM KHACH_HANG WHERE MaKH LIKE 'KH%' ORDER BY MaKH DESC`);
                let newMaKH = idResult.recordset.length > 0 ? 'KH' + String(parseInt(idResult.recordset[0].maxId.replace('KH',''), 10)+1).padStart(3, '0') : 'KH001';
                await new sql.Request(transaction).input('MaKH', sql.VarChar, newMaKH).input('TenKH', sql.NVarChar, 'Khách Vãng Lai').input('DiaChi', sql.NVarChar, ddInfo.recordset[0].DiaChiFull).query(`INSERT INTO KHACH_HANG(MaKH, TenKH, DiaChi) VALUES(@MaKH, @TenKH, @DiaChi)`);
                MaKH = newMaKH;
            }
        }
        await new sql.Request(transaction).input('id', sql.VarChar, newMaDH).input('tong', sql.Float, tongTien).input('makh', sql.VarChar, MaKH).input('manv', sql.VarChar, MaNV).query(`INSERT INTO DON_HANG(MaDH, NgayMua, TrangThai, TongTien, MaKH, MaNV) VALUES(@id, GETDATE(), N'Hoàn thành', @tong, @makh, @manv)`);
        const gdResult = await new sql.Request(transaction).query(`SELECT TOP 1 MaGD AS maxId FROM GIAO_DICH WHERE MaGD LIKE 'GD%' ORDER BY MaGD DESC`);
        let newMaGD = gdResult.recordset.length > 0 ? 'GD' + String(parseInt(gdResult.recordset[0].maxId.replace('GD',''), 10)+1).padStart(3, '0') : 'GD001';
        await new sql.Request(transaction).input('magd', sql.VarChar, newMaGD).input('stien', sql.Float, tongTien).input('pt', sql.NVarChar, PhuongThucThanhToan).input('madh', sql.VarChar, newMaDH).query(`INSERT INTO GIAO_DICH(MaGD, SoTien, PhuongThuc, NgayGD, TrangThai, MaDH) VALUES(@magd, @stien, @pt, GETDATE(), N'Thành công', @madh)`);
        const pkResult = await new sql.Request(transaction).query(`SELECT TOP 1 MaPhieu AS maxId FROM PHIEU_KHO WHERE MaPhieu LIKE 'PX%' ORDER BY MaPhieu DESC`);
        let newMaPhieu = pkResult.recordset.length > 0 ? 'PX' + String(parseInt(pkResult.recordset[0].maxId.replace('PX',''), 10)+1).padStart(3, '0') : 'PX001';
        await new sql.Request(transaction).input('mp', sql.VarChar, newMaPhieu).input('manv', sql.VarChar, MaNV).input('madd', sql.VarChar, maDDNV).query(`INSERT INTO PHIEU_KHO(MaPhieu, NgayLap, LoaiPhieu, MaNV, MaDD) VALUES(@mp, GETDATE(), N'Xuất bán', @manv, @madd)`);
        for (let item of ChiTiet) {
            await new sql.Request(transaction).input('madh', sql.VarChar, newMaDH).input('masp', sql.VarChar, item.MaSP).input('sl', sql.Int, item.SoLuongMua).input('gia', sql.Float, item.DonGiaBan).query(`INSERT INTO CHI_TIET_DON(MaDH, MaSP, SoLuongMua, DonGiaBan) VALUES(@madh, @masp, @sl, @gia)`);
            const resKho = await new sql.Request(transaction).input('masp', sql.VarChar, item.MaSP).input('sl', sql.Int, item.SoLuongMua).query(`UPDATE TON_KHO SET SoLuong = SoLuong - @sl WHERE MaKe = (SELECT TOP 1 MaKe FROM TON_KHO WHERE MaSP = @masp AND SoLuong >= @sl) AND MaSP = @masp`);
            if (resKho.rowsAffected[0] === 0) throw new Error(`Stock error`);
            await new sql.Request(transaction).input('mp', sql.VarChar, newMaPhieu).input('masp', sql.VarChar, item.MaSP).input('slx', sql.Int, item.SoLuongMua).query(`INSERT INTO CHI_TIET_PHIEU(MaPhieu, MaSP, SoLuongNhap, GiaNhap) VALUES(@mp, @masp, @slx, 0)`); 
        }
        await transaction.commit();
        res.json({ success: true, message: `Success` });
    } catch (e) {
        if (transaction) await transaction.rollback();
        res.status(500).json({ error: e.message });
    }
});

app.get('/api/donhang/:id/chitiet', async (req, res) => {
    try {
        const pool = await getPool();
        const result = await pool.request().input('id', sql.VarChar, req.params.id).query(`SELECT DH.MaDH, ISNULL(GD.NgayGD, DH.NgayMua) AS NgayMua, DH.TongTien, GD.PhuongThuc, ISNULL(KH.TenKH, N'Khách lẻ') AS TenKH, ISNULL(NV.HoTen, N'Không xác định') AS NguoiBan, SP.Ten AS TenSP, CT.SoLuongMua, CT.DonGiaBan, (CT.SoLuongMua * CT.DonGiaBan) AS ThanhTien FROM DON_HANG DH JOIN CHI_TIET_DON CT ON DH.MaDH = CT.MaDH JOIN SAN_PHAM SP ON CT.MaSP = SP.MaSP LEFT JOIN GIAO_DICH GD ON DH.MaDH = GD.MaDH LEFT JOIN NHAN_VIEN NV ON DH.MaNV = NV.MaNV LEFT JOIN KHACH_HANG KH ON DH.MaKH = KH.MaKH WHERE DH.MaDH = @id`);
        res.json(result.recordset);
    } catch (e) { res.status(500).json({ error: e.message }); }
});

app.get('/api/phieukho/:id/chitiet', async (req, res) => {
    try {
        const pool = await getPool();
        const result = await pool.request().input('id', sql.VarChar, req.params.id).query(`SELECT P.MaPhieu, P.NgayLap, P.LoaiPhieu, NV.HoTen AS NguoiLap, DD.Ten AS TenKho, ISNULL(DD.SoNha + ', ' + DD.Phuong + ', ' + DD.ThanhPho, N'Chưa cập nhật') AS DiaChiKho, SP.Ten AS TenSP, CT.SoLuongNhap FROM PHIEU_KHO P JOIN CHI_TIET_PHIEU CT ON P.MaPhieu = CT.MaPhieu JOIN SAN_PHAM SP ON CT.MaSP = SP.MaSP JOIN NHAN_VIEN NV ON P.MaNV = NV.MaNV JOIN DIA_DIEM DD ON P.MaDD = DD.MaDD WHERE P.MaPhieu = @id`);
        res.json(result.recordset);
    } catch (e) { res.status(500).json({ error: e.message }); }
});

app.get('/api/thongke', async (req, res) => {
    try {
        const pool = await getPool();
        const q1 = await pool.request().query(`SELECT ISNULL(SUM(TongTien), 0) AS TongDoanhThu, COUNT(DISTINCT MaDH) AS TongDonHang FROM DON_HANG`);
        const q2 = await pool.request().query(`SELECT DD.Ten AS ChiNhanh, ISNULL(SUM(DH.TongTien), 0) AS DoanhThu FROM DON_HANG DH JOIN NHAN_VIEN NV ON DH.MaNV = NV.MaNV JOIN DIA_DIEM DD ON NV.MaDD = DD.MaDD GROUP BY DD.Ten ORDER BY DoanhThu DESC`);
        const q3 = await pool.request().query(`SELECT ISNULL(DD.ThanhPho, N'Khác') AS ThanhPho, ISNULL(SUM(DH.TongTien), 0) AS DoanhThu FROM DON_HANG DH JOIN NHAN_VIEN NV ON DH.MaNV = NV.MaNV JOIN DIA_DIEM DD ON NV.MaDD = DD.MaDD GROUP BY DD.ThanhPho ORDER BY DoanhThu DESC`);
        res.json({ tongDoanhThu: q1.recordset[0].TongDoanhThu, tongDonHang: q1.recordset[0].TongDonHang, chiNhanh: q2.recordset, thanhPho: q3.recordset });
    } catch (e) { res.status(500).json({ error: e.message }); }
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`Running on ${PORT}`));