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

async function testQueryWithBinds() {
  const conn = await oracledb.getConnection({
    user: process.env.ORACLE_USER,
    password: process.env.ORACLE_PASSWORD,
    connectString: process.env.ORACLE_CONNECT_STRING
  });

  const sqlJoin = `
    SELECT 
      a.ADMISSION_NO,
      a.REG_NO,
      NVL(a.FULL_NAME, NVL(r.FULL_NAME, r.FIRST_NAME || ' ' || r.LAST_NAME)) AS PATIENT_NAME,
      r.FNAME AS FATHER_NAME,
      r.MNAME AS MOTHER_NAME,
      TO_CHAR(r.DOB, 'YYYY-MM-DD') AS DOB,
      NVL(d.PAT_AGEDESCRIBE, NVL(a.PAT_AGE, r.AGE_YY || 'Y ' || r.AGE_MM || 'M ' || r.AGE_DD || 'D')) AS PAT_AGE,
      r.AGE_YY,
      r.AGE_MM,
      r.AGE_DD,
      NVL(d.GENDER, NVL(a.GENDER, r.GENDER)) AS GENDER,
      NVL(d.BLOOD_CGROUP, NVL(r.BLOOD_GROUP, 'O+')) AS BLOOD_GROUP,
      NVL(d.BIRTH_WEIGHT, r.BIRTH_WEIGHT) AS BIRTH_WEIGHT,
      d.DIS_WEIGHT,
      d.OFC_ADM,
      d.OFC_DC,
      a.BED_NO,
      NVL(b.BED_NAME, a.WARD_CABIN) AS BED_NAME,
      b.WARD_NO,
      TO_CHAR(a.ADMISSION_DT, 'YYYY-MM-DD') AS ADMISSION_DATE,
      TO_CHAR(NVL(d.DISCHARGE_DATE, SYSDATE), 'YYYY-MM-DD') AS DISCHARGE_DATE,
      NVL(d.PRIMARY_DOCTOR, NVL(a.DOC_NAME, a.PRIMARY_DOCTOR)) AS CONSULTANT_NAME,
      d.CHIEF_COMPLAINT,
      d.HP_TREATMENT,
      d.DIAGNOSIS,
      d.CASE_SUMMARY,
      d.INVESTIGATION,
      d.ADVICE,
      d.REFERRAL_NOTE,
      d.TREAT_ON_DIS,
      d.PAT_AGEDESCRIBE,
      r.PAT_MOBILE,
      r.CONTACT_PHONE
    FROM ATI_REGI.IP_ADMISSION a
    LEFT JOIN ATI_REGI.OP_REGISTRATION r ON r.REG_NO = a.REG_NO
    LEFT JOIN ATI_REGI.IP_BED b ON b.BED_NO = a.BED_NO
    LEFT JOIN ATI_REGI.IP_NICUPICUDISCHARGE d ON d.ADMISSION_NO = a.ADMISSION_NO
    WHERE UPPER(a.ADMISSION_NO) = UPPER(:adm_no)
  `;

  const res = await conn.execute(sqlJoin, { adm_no: 'NICU-2026-081' }, { outFormat: oracledb.OUT_FORMAT_OBJECT });
  console.log('Result for NICU-2026-081:');
  console.log(JSON.stringify(res.rows[0], null, 2));

  // Also test IP_NICUADVICE query
  const adv = await conn.execute(`SELECT ADVICE_ID, ADVICE_ENGLISH, ADVICE_TYPE FROM ATI_REGI.IP_NICUADVICE ORDER BY ADVICE_ID`, [], { outFormat: oracledb.OUT_FORMAT_OBJECT });
  console.log(`IP_NICUADVICE count: ${adv.rows.length}`);

  await conn.close();
}

testQueryWithBinds().catch(console.error);
