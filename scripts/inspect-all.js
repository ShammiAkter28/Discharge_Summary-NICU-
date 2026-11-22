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

async function inspectAll() {
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
    const countRes = await conn.execute(`SELECT COUNT(*) FROM ATI_REGI.${tbl}`);
    console.log(`Table ${tbl}: ${countRes.rows[0][0]} rows`);
  }

  console.log('\n--- Sample 2 rows from IP_NICUPICUDISCHARGE ---');
  const dsc = await conn.execute(`SELECT * FROM ATI_REGI.IP_NICUPICUDISCHARGE WHERE ROWNUM <= 2`, [], { outFormat: oracledb.OUT_FORMAT_OBJECT });
  console.log(JSON.stringify(dsc.rows, null, 2));

  console.log('\n--- Sample 2 rows from OP_REGISTRATION ---');
  const op = await conn.execute(`SELECT REG_NO, FIRST_NAME, MIDDLE_NAME, LAST_NAME, DOB, AGE_YY, AGE_MM, AGE_DD, GENDER, BIRTH_WEIGHT, BIRTH_TIME, BLOOD_GROUP FROM ATI_REGI.OP_REGISTRATION WHERE ROWNUM <= 2`, [], { outFormat: oracledb.OUT_FORMAT_OBJECT });
  console.log(JSON.stringify(op.rows, null, 2));

  console.log('\n--- Sample 2 rows from IP_ADMISSION ---');
  const adm = await conn.execute(`SELECT ADMISSION_NO, REG_NO, ADMISSION_DT, BED_NO, PRIMARY_DOCTOR, PAT_AGE, GENDER, DOC_NAME, WARD_CABIN FROM ATI_REGI.IP_ADMISSION WHERE ROWNUM <= 2`, [], { outFormat: oracledb.OUT_FORMAT_OBJECT });
  console.log(JSON.stringify(adm.rows, null, 2));

  console.log('\n--- Sample 2 rows from IP_BED ---');
  const bed = await conn.execute(`SELECT BED_NO, BED_NAME, WARD_NO FROM ATI_REGI.IP_BED WHERE ROWNUM <= 2`, [], { outFormat: oracledb.OUT_FORMAT_OBJECT });
  console.log(JSON.stringify(bed.rows, null, 2));

  await conn.close();
}

inspectAll().catch(console.error);
