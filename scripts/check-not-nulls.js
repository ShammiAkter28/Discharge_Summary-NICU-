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

async function checkNotNulls() {
  const conn = await oracledb.getConnection({
    user: process.env.ORACLE_USER,
    password: process.env.ORACLE_PASSWORD,
    connectString: process.env.ORACLE_CONNECT_STRING
  });

  const tables = ['OP_REGISTRATION', 'IP_ADMISSION', 'IP_BED'];
  for (const t of tables) {
    console.log(`\n=== Required (NOT NULL) columns for ${t} ===`);
    const cols = await conn.execute(
      `SELECT COLUMN_NAME, DATA_TYPE, DATA_LENGTH FROM ALL_TAB_COLUMNS WHERE OWNER='ATI_REGI' AND TABLE_NAME='${t}' AND NULLABLE='N'`
    );
    cols.rows.forEach(r => console.log(`  ${r[0]} : ${r[1]}(${r[2]})`));
  }

  await conn.close();
}

checkNotNulls().catch(console.error);
