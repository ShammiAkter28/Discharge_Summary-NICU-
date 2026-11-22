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

async function checkDetails() {
  const conn = await oracledb.getConnection({
    user: process.env.ORACLE_USER,
    password: process.env.ORACLE_PASSWORD,
    connectString: process.env.ORACLE_CONNECT_STRING
  });

  console.log('--- ALL ROWS IN IP_NICUADVICE ---');
  const advices = await conn.execute(
    `SELECT * FROM ATI_REGI.IP_NICUADVICE ORDER BY ADVICE_ID`,
    [],
    { outFormat: oracledb.OUT_FORMAT_OBJECT }
  );
  console.log(JSON.stringify(advices.rows, null, 2));

  console.log('\n--- IP_ADMISSION COLUMNS ---');
  const ipAdmCols = await conn.execute(
    `SELECT COLUMN_NAME, DATA_TYPE FROM ALL_TAB_COLUMNS WHERE OWNER='ATI_REGI' AND TABLE_NAME='IP_ADMISSION' ORDER BY COLUMN_ID`
  );
  console.log(ipAdmCols.rows.map(r => r.join(': ')).join(', '));

  console.log('\n--- IP_BED COLUMNS ---');
  const ipBedCols = await conn.execute(
    `SELECT COLUMN_NAME, DATA_TYPE FROM ALL_TAB_COLUMNS WHERE OWNER='ATI_REGI' AND TABLE_NAME='IP_BED' ORDER BY COLUMN_ID`
  );
  console.log(ipBedCols.rows.map(r => r.join(': ')).join(', '));

  console.log('\n--- IP_NICUPICUDISCHARGE COLUMNS ---');
  const dcCols = await conn.execute(
    `SELECT COLUMN_NAME, DATA_TYPE FROM ALL_TAB_COLUMNS WHERE OWNER='ATI_REGI' AND TABLE_NAME='IP_NICUPICUDISCHARGE' ORDER BY COLUMN_ID`
  );
  console.log(dcCols.rows.map(r => r.join(': ')).join(', '));

  console.log('\n--- SAMPLE RECENT IP_ADMISSION ---');
  const sampleAdm = await conn.execute(
    `SELECT ADMISSION_NO, REG_NO, ADMISSION_DATE, DISCHARGE_DATE, BED_NO, WARD_NO, DOCTOR_ID, PRIMARY_DIAGNOSIS 
     FROM ATI_REGI.IP_ADMISSION WHERE ROWNUM <= 5`,
    [],
    { outFormat: oracledb.OUT_FORMAT_OBJECT }
  ).catch(e => conn.execute(`SELECT * FROM ATI_REGI.IP_ADMISSION WHERE ROWNUM <= 2`, [], { outFormat: oracledb.OUT_FORMAT_OBJECT }));
  console.log(JSON.stringify(sampleAdm.rows, null, 2));

  await conn.close();
}

checkDetails().catch(console.error);
