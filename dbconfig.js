const sql = require('mssql');
const express = require('express');
const cors = require('cors');
const config = require('./dbconfig');

const app = express();
app.use(cors());
app.use(express.json());

app.get('/api/data', async (req, res) => {
    try {
        let pool = await sql.connect(config);
        let result = await pool.request().query('SELECT * FROM BAO_GOM');
        res.json(result.recordset);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});


const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
});