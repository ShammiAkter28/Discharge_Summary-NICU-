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

async function showAllAdvices() {
  const conn = await oracledb.getConnection({
    user: process.env.ORACLE_USER,
    password: process.env.ORACLE_PASSWORD,
    connectString: process.env.ORACLE_CONNECT_STRING
  });

  const res = await conn.execute(
    `SELECT ADVICE_ID, ADVICE_TYPE, ADVICE_ENGLISH, ADVICE_BANGLA FROM ATI_REGI.IP_NICUADVICE ORDER BY ADVICE_ID`,
    [],
    { outFormat: oracledb.OUT_FORMAT_OBJECT }
  );
  
  res.rows.forEach(r => {
    console.log(`[${r.ADVICE_ID}] (${r.ADVICE_TYPE})`);
    console.log(`  EN: ${r.ADVICE_ENGLISH}`);
    console.log(`  BN: ${r.ADVICE_BANGLA}`);
  });

  await conn.close();
}

showAllAdvices().catch(console.error);
