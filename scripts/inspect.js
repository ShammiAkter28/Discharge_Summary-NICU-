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

async function inspect() {
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

  console.log('=== Checking Table Existence ===');
  for (const tbl of tables) {
    const res = await conn.execute(
      `SELECT OWNER, TABLE_NAME FROM ALL_TABLES WHERE TABLE_NAME = :tbl`,
      [tbl]
    );
    console.log(tbl, '=>', res.rows);
  }

  // Also search for tables matching LIKE %NICU% or %ADVICE%
  console.log('\n=== Checking matching tables like NICU or ADVICE ===');
  const searchRes = await conn.execute(
    `SELECT OWNER, TABLE_NAME FROM ALL_TABLES WHERE TABLE_NAME LIKE '%NICU%' OR TABLE_NAME LIKE '%ADVICE%' ORDER BY TABLE_NAME`
  );
  console.log('Matching tables:', searchRes.rows);

  await conn.close();
}

inspect().catch(console.error);
