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

async function inspectConstraints() {
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

  console.log('=== CONSTRAINTS & KEYS ===');
  for (const tbl of tables) {
    const cons = await conn.execute(
      `SELECT c.CONSTRAINT_NAME, c.CONSTRAINT_TYPE, cc.COLUMN_NAME, c.R_CONSTRAINT_NAME
       FROM ALL_CONSTRAINTS c
       JOIN ALL_CONS_COLUMNS cc ON c.OWNER = cc.OWNER AND c.CONSTRAINT_NAME = cc.CONSTRAINT_NAME
       WHERE c.OWNER = 'ATI_REGI' AND c.TABLE_NAME = :tbl AND c.CONSTRAINT_TYPE IN ('P', 'R', 'U')
       ORDER BY c.CONSTRAINT_TYPE, cc.POSITION`,
      [tbl]
    );
    console.log(`\nTable ${tbl}:`);
    for (const row of cons.rows) {
      console.log(`  ${row[1] === 'P' ? 'PRIMARY KEY' : row[1] === 'R' ? 'FOREIGN KEY' : 'UNIQUE'}: ${row[2]} (${row[0]}) ${row[3] || ''}`);
    }
  }

  await conn.close();
}

inspectConstraints().catch(console.error);
