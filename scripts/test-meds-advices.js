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

async function testSaveMedsAndAdvices() {
  const conn = await oracledb.getConnection({
    user: process.env.ORACLE_USER,
    password: process.env.ORACLE_PASSWORD,
    connectString: process.env.ORACLE_CONNECT_STRING
  });

  const admNo = 'NICU-2026-081';

  try {
    // 1. Test inserting into IP_NICUPICUDISMEDICINE
    console.log('Testing IP_NICUPICUDISMEDICINE insert...');
    await conn.execute(`DELETE FROM ATI_REGI.IP_NICUPICUDISMEDICINE WHERE ADMISSION_NO = :adm_no`, { adm_no: admNo });
    
    await conn.execute(
      `INSERT INTO ATI_REGI.IP_NICUPICUDISMEDICINE (
         ADMISSION_NO, SL_NO, MEDICINE_NO, MEDICINE_NAME, STRENGTH, UOM, QUANTITY, DURATION, INSTRUCTIONS_EN, INSTRUCTIONS_BN, ENTER_BY, ENTER_DT, COMPANY_NO
       ) VALUES (
         :adm_no, 1, 'MED-001', 'Syrup Zinc Sulphate', '20mg/5ml', 'ml', 1, '14 Days', 'Morning between feeds', 'সকালে খাওয়ার মাঝে', 'WEB_USER', SYSDATE, '1'
       )`,
      { adm_no: admNo }
    );
    console.log('Medicine inserted successfully.');

    // 2. Test inserting into IP_NICUADVICE_ASSIGN
    console.log('Testing IP_NICUADVICE_ASSIGN insert...');
    await conn.execute(`DELETE FROM ATI_REGI.IP_NICUADVICE_ASSIGN WHERE ADMISSION_NO = :adm_no`, { adm_no: admNo });

    await conn.execute(
      `INSERT INTO ATI_REGI.IP_NICUADVICE_ASSIGN (
         ADMISSION_NO, ADVICE_ID, ADVICE_TYPE, ADVICE_EN, ADVICE_BN, ENTER_BY, ENTER_DT, COMPANY_NO
       ) VALUES (
         :adm_no, 'A01', 'G', 'Begin breastfeeding your baby as soon as possible...', 'ev”Pvi R‡b¥i ci †_‡K...', 'WEB_USER', SYSDATE, '1'
       )`,
      { adm_no: admNo }
    );
    console.log('Advice assigned successfully.');

    await conn.commit();
    console.log('All tests committed!');

    // Read back
    const medRows = await conn.execute(`SELECT * FROM ATI_REGI.IP_NICUPICUDISMEDICINE WHERE ADMISSION_NO = :adm_no`, { adm_no: admNo }, { outFormat: oracledb.OUT_FORMAT_OBJECT });
    console.log('Med rows in DB:', medRows.rows);

    const advRows = await conn.execute(`SELECT * FROM ATI_REGI.IP_NICUADVICE_ASSIGN WHERE ADMISSION_NO = :adm_no`, { adm_no: admNo }, { outFormat: oracledb.OUT_FORMAT_OBJECT });
    console.log('Adv rows in DB:', advRows.rows);

  } catch (e) {
    console.error('Error:', e);
  } finally {
    await conn.close();
  }
}

testSaveMedsAndAdvices();
