const sql = require('mssql');
const config = require('./dbconfig');
async function connectandQuery() {
    try{
        let pool = await sql.connect(config);
        let result = await pool.request().query('SELECT * FROM BAO_GOM');
        console.log(result.recordset);
    }
    catch(err){
        console.log(JSON.stringify(err,null,2));
    }
    finally{
        await sql.close();
    }
}
connectandQuery();