const fs = require('fs');
const path = require('path');
const envPath = path.resolve(__dirname, '..', '.env.local');
if (fs.existsSync(envPath)) {
  for (const line of fs.readFileSync(envPath, 'utf8').split('\n')) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith('#')) continue;
    const eq = trimmed.indexOf('=');
    if (eq !== -1) {
      const k = trimmed.substring(0, eq).trim();
      const v = trimmed.substring(eq + 1).trim();
      if (!process.env[k]) process.env[k] = v;
    }
  }
}
const oracledb = require('oracledb');

async function inspectColumns() {
  const conn = await oracledb.getConnection({
    user: process.env.ORACLE_USER,
    password: process.env.ORACLE_PASSWORD,
    connectString: process.env.ORACLE_CONNECT_STRING
  });

  const tables = [
    'OP_REGISTRATION',
    'IP_ADMISSION',
    'IP_BED',
    'IP_NICUPICUDISCHARGE',
    'IP_NICUPICUDISMEDICINE',
    'IP_NICUADVICE',
    'IP_NICUADVICE_ASSIGN'
  ];

  for (const tbl of tables) {
    console.log(`\n========================================`);
    console.log(`TABLE: ${tbl}`);
    console.log(`========================================`);
    
    // Columns
    const cols = await conn.execute(
      `SELECT COLUMN_NAME, DATA_TYPE, DATA_LENGTH, DATA_PRECISION, DATA_SCALE, NULLABLE
       FROM ALL_TAB_COLUMNS
       WHERE OWNER = 'ATI_REGI' AND TABLE_NAME = :tbl
       ORDER BY COLUMN_ID`,
      [tbl]
    );
    console.log('Columns:');
    for (const c of cols.rows) {
      console.log(`  ${c[0].padEnd(30)} ${c[1]}(${c[2] || ''}) nullable: ${c[5]}`);
    }

    // Row count & Sample data
    try {
      const countRes = await conn.execute(`SELECT COUNT(*) FROM ATI_REGI.${tbl}`);
      console.log(`Total rows: ${countRes.rows[0][0]}`);

      const sample = await conn.execute(
        `SELECT * FROM ATI_REGI.${tbl} WHERE ROWNUM <= 3`,
        [],
        { outFormat: oracledb.OUT_FORMAT_OBJECT }
      );
      console.log('Sample rows:', JSON.stringify(sample.rows, null, 2));
    } catch (e) {
      console.log('Error querying table:', e.message);
    }
  }

  await conn.close();
}

inspectColumns().catch(console.error);
