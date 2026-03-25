const sql = require('mssql/msnodesqlv8');

const config = {
    connectionString: 'Driver={ODBC Driver 18 for SQL Server};Server=localhost;Database=shop_thoi_trang;Trusted_Connection=yes;TrustServerCertificate=yes;'
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
