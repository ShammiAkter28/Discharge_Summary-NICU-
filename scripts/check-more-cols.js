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

async function detailedColumnCheck() {
  const conn = await oracledb.getConnection({
    user: process.env.ORACLE_USER,
    password: process.env.ORACLE_PASSWORD,
    connectString: process.env.ORACLE_CONNECT_STRING
  });

  const tables = ['IP_NICUPICUDISMEDICINE', 'IP_NICUADVICE_ASSIGN'];
  for (const t of tables) {
    console.log(`\n=== ${t} ===`);
    const cols = await conn.execute(
      `SELECT COLUMN_NAME, DATA_TYPE, DATA_LENGTH, NULLABLE FROM ALL_TAB_COLUMNS WHERE OWNER='ATI_REGI' AND TABLE_NAME='${t}' ORDER BY COLUMN_ID`
    );
    cols.rows.forEach(r => console.log(`${r[0].padEnd(20)} ${r[1]}(${r[2]}) Nullable: ${r[3]}`));
  }

  // Also check IP_NICUPICUDISCHARGE again
  console.log(`\n=== IP_NICUPICUDISCHARGE ===`);
  const dcCols = await conn.execute(
    `SELECT COLUMN_NAME, DATA_TYPE, DATA_LENGTH, NULLABLE FROM ALL_TAB_COLUMNS WHERE OWNER='ATI_REGI' AND TABLE_NAME='IP_NICUPICUDISCHARGE' ORDER BY COLUMN_ID`
  );
  dcCols.rows.forEach(r => console.log(`${r[0].padEnd(20)} ${r[1]}(${r[2]}) Nullable: ${r[3]}`));

  await conn.close();
}

detailedColumnCheck().catch(console.error);
