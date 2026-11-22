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

async function seedMasterData() {
  const conn = await oracledb.getConnection({
    user: process.env.ORACLE_USER,
    password: process.env.ORACLE_PASSWORD,
    connectString: process.env.ORACLE_CONNECT_STRING
  });

  try {
    console.log('Seeding IP_BED...');
    const beds = [
      { bed_no: 'BED-NICU-01', ward_no: 'NICU-L3', bed_name: 'NICU Incubator #01' },
      { bed_no: 'BED-NICU-02', ward_no: 'NICU-L3', bed_name: 'NICU Incubator #02' },
      { bed_no: 'BED-NICU-03', ward_no: 'NICU-L3', bed_name: 'NICU Incubator #03 (Level 3)' },
      { bed_no: 'BED-NICU-04', ward_no: 'NICU-L2', bed_name: 'NICU Cot #04 (Step-down)' },
      { bed_no: 'BED-PICU-01', ward_no: 'PICU-L1', bed_name: 'PICU Pediatric Bed #01' },
    ];

    for (const b of beds) {
      await conn.execute(
        `MERGE INTO ATI_REGI.IP_BED t
         USING (SELECT :bed_no AS BED_NO, :ward_no AS WARD_NO, :bed_name AS BED_NAME FROM DUAL) s
         ON (t.BED_NO = s.BED_NO)
         WHEN MATCHED THEN UPDATE SET t.BED_NAME = s.BED_NAME, t.WARD_NO = s.WARD_NO
         WHEN NOT MATCHED THEN INSERT (BED_NO, WARD_NO, BED_NAME, COMPANY_NO) VALUES (s.BED_NO, s.WARD_NO, s.BED_NAME, '1')`,
        b
      );
    }
    console.log('Beds seeded.');

    console.log('Seeding OP_REGISTRATION for NICU-2026-081...');
    // Baby of Shammi Akhter, DOB: 2026-11-01 (16 days old at discharge on Nov 17)
    await conn.execute(
      `MERGE INTO ATI_REGI.OP_REGISTRATION t
       USING (
         SELECT 
           'REG-2026-0081' AS REG_NO,
           'Baby of Shammi Akhter' AS FULL_NAME,
           'Baby' AS FIRST_NAME,
           'of Shammi' AS MIDDLE_NAME,
           'Akhter' AS LAST_NAME,
           'Md. Tarek' AS FNAME,
           'Shammi Akhter' AS MNAME,
           TO_DATE('2026-11-01', 'YYYY-MM-DD') AS DOB,
           'F' AS GENDER,
           'B+' AS BLOOD_GROUP,
           '+8801711000000' AS PAT_MOBILE,
           1.45 AS BIRTH_WEIGHT,
           0 AS AGE_YY,
           0 AS AGE_MM,
           16 AS AGE_DD,
           '1' AS COMPANY_NO
         FROM DUAL
       ) s
       ON (t.REG_NO = s.REG_NO)
       WHEN MATCHED THEN UPDATE SET t.FULL_NAME = s.FULL_NAME
       WHEN NOT MATCHED THEN INSERT (
         REG_NO, FULL_NAME, FIRST_NAME, MIDDLE_NAME, LAST_NAME, FNAME, MNAME,
         DOB, GENDER, BLOOD_GROUP, PAT_MOBILE, BIRTH_WEIGHT, AGE_YY, AGE_MM, AGE_DD, COMPANY_NO
       ) VALUES (
         s.REG_NO, s.FULL_NAME, s.FIRST_NAME, s.MIDDLE_NAME, s.LAST_NAME, s.FNAME, s.MNAME,
         s.DOB, s.GENDER, s.BLOOD_GROUP, s.PAT_MOBILE, s.BIRTH_WEIGHT, s.AGE_YY, s.AGE_MM, s.AGE_DD, s.COMPANY_NO
       )`
    );

    console.log('Seeding IP_ADMISSION for NICU-2026-081...');
    await conn.execute(
      `MERGE INTO ATI_REGI.IP_ADMISSION t
       USING (
         SELECT 
           'NICU-2026-081' AS ADMISSION_NO,
           'REG-2026-0081' AS REG_NO,
           'BED-NICU-03' AS BED_NO,
           TO_DATE('2026-11-01', 'YYYY-MM-DD') AS ADMISSION_DT,
           TO_DATE('2026-11-17', 'YYYY-MM-DD') AS DIS_TIMESTAMP,
           'Prof. Shamsuddin' AS PRIMARY_DOCTOR,
           'Prof. Dr. A. K. M. Shamsuddin' AS DOC_NAME,
           'Baby of Shammi Akhter' AS FULL_NAME,
           '16 Days' AS PAT_AGE,
           'F' AS GENDER,
           'NICU Incubator #03 (Level 3)' AS WARD_CABIN,
           'Y' AS NEW_BORN_BABY,
           '1' AS COMPANY_NO
         FROM DUAL
       ) s
       ON (t.ADMISSION_NO = s.ADMISSION_NO)
       WHEN MATCHED THEN UPDATE SET t.DOC_NAME = s.DOC_NAME
       WHEN NOT MATCHED THEN INSERT (
         ADMISSION_NO, REG_NO, BED_NO, ADMISSION_DT, DIS_TIMESTAMP,
         PRIMARY_DOCTOR, DOC_NAME, FULL_NAME, PAT_AGE, GENDER,
         WARD_CABIN, NEW_BORN_BABY, COMPANY_NO
       ) VALUES (
         s.ADMISSION_NO, s.REG_NO, s.BED_NO, s.ADMISSION_DT, s.DIS_TIMESTAMP,
         s.PRIMARY_DOCTOR, s.DOC_NAME, s.FULL_NAME, s.PAT_AGE, s.GENDER,
         s.WARD_CABIN, s.NEW_BORN_BABY, s.COMPANY_NO
       )`
    );

    // Also Baby 2: Early Neonate, 5 days old (BCG vaccine eligible)
    console.log('Seeding Baby 2: Early Neonate (5 days old)...');
    await conn.execute(
      `MERGE INTO ATI_REGI.OP_REGISTRATION t
       USING (
         SELECT 
           'REG-2026-0082' AS REG_NO,
           'Baby of Nusrat Jahan' AS FULL_NAME,
           'Baby' AS FIRST_NAME,
           'of Nusrat' AS MIDDLE_NAME,
           'Jahan' AS LAST_NAME,
           'Md. Rahim' AS FNAME,
           'Nusrat Jahan' AS MNAME,
           TO_DATE('2026-11-13', 'YYYY-MM-DD') AS DOB,
           'M' AS GENDER,
           'A+' AS BLOOD_GROUP,
           '+8801812345678' AS PAT_MOBILE,
           2.65 AS BIRTH_WEIGHT,
           0 AS AGE_YY, 0 AS AGE_MM, 5 AS AGE_DD,
           '1' AS COMPANY_NO
         FROM DUAL
       ) s
       ON (t.REG_NO = s.REG_NO)
       WHEN MATCHED THEN UPDATE SET t.FULL_NAME = s.FULL_NAME
       WHEN NOT MATCHED THEN INSERT (
         REG_NO, FULL_NAME, FIRST_NAME, MIDDLE_NAME, LAST_NAME, FNAME, MNAME,
         DOB, GENDER, BLOOD_GROUP, PAT_MOBILE, BIRTH_WEIGHT, AGE_YY, AGE_MM, AGE_DD, COMPANY_NO
       ) VALUES (
         s.REG_NO, s.FULL_NAME, s.FIRST_NAME, s.MIDDLE_NAME, s.LAST_NAME, s.FNAME, s.MNAME,
         s.DOB, s.GENDER, s.BLOOD_GROUP, s.PAT_MOBILE, s.BIRTH_WEIGHT, s.AGE_YY, s.AGE_MM, s.AGE_DD, s.COMPANY_NO
       )`
    );

    await conn.execute(
      `MERGE INTO ATI_REGI.IP_ADMISSION t
       USING (
         SELECT 
           'NICU-2026-082' AS ADMISSION_NO,
           'REG-2026-0082' AS REG_NO,
           'BED-NICU-01' AS BED_NO,
           TO_DATE('2026-11-13', 'YYYY-MM-DD') AS ADMISSION_DT,
           TO_DATE('2026-11-18', 'YYYY-MM-DD') AS DIS_TIMESTAMP,
           'Dr. Farhana' AS PRIMARY_DOCTOR,
           'Dr. Farhana Yasmin (MD, Neonatology)' AS DOC_NAME,
           'Baby of Nusrat Jahan' AS FULL_NAME,
           '5 Days' AS PAT_AGE,
           'M' AS GENDER,
           'NICU Incubator #01' AS WARD_CABIN,
           'Y' AS NEW_BORN_BABY,
           '1' AS COMPANY_NO
         FROM DUAL
       ) s
       ON (t.ADMISSION_NO = s.ADMISSION_NO)
       WHEN MATCHED THEN UPDATE SET t.DOC_NAME = s.DOC_NAME
       WHEN NOT MATCHED THEN INSERT (
         ADMISSION_NO, REG_NO, BED_NO, ADMISSION_DT, DIS_TIMESTAMP,
         PRIMARY_DOCTOR, DOC_NAME, FULL_NAME, PAT_AGE, GENDER,
         WARD_CABIN, NEW_BORN_BABY, COMPANY_NO
       ) VALUES (
         s.ADMISSION_NO, s.REG_NO, s.BED_NO, s.ADMISSION_DT, s.DIS_TIMESTAMP,
         s.PRIMARY_DOCTOR, s.DOC_NAME, s.FULL_NAME, s.PAT_AGE, s.GENDER,
         s.WARD_CABIN, s.NEW_BORN_BABY, s.COMPANY_NO
       )`
    );

    // Baby 3: Infant, 6 Weeks old (EPI vaccine, Neuro assessment, Hearing test eligible)
    console.log('Seeding Baby 3: Infant (6 Weeks / 42 days old)...');
    await conn.execute(
      `MERGE INTO ATI_REGI.OP_REGISTRATION t
       USING (
         SELECT 
           'REG-2026-0083' AS REG_NO,
           'Baby of Sadia Afrin' AS FULL_NAME,
           'Baby' AS FIRST_NAME,
           'of Sadia' AS MIDDLE_NAME,
           'Afrin' AS LAST_NAME,
           'Md. Kabir' AS FNAME,
           'Sadia Afrin' AS MNAME,
           TO_DATE('2026-10-07', 'YYYY-MM-DD') AS DOB,
           'F' AS GENDER,
           'O+' AS BLOOD_GROUP,
           '+8801911223344' AS PAT_MOBILE,
           1.75 AS BIRTH_WEIGHT,
           0 AS AGE_YY, 1 AS AGE_MM, 12 AS AGE_DD,
           '1' AS COMPANY_NO
         FROM DUAL
       ) s
       ON (t.REG_NO = s.REG_NO)
       WHEN MATCHED THEN UPDATE SET t.FULL_NAME = s.FULL_NAME
       WHEN NOT MATCHED THEN INSERT (
         REG_NO, FULL_NAME, FIRST_NAME, MIDDLE_NAME, LAST_NAME, FNAME, MNAME,
         DOB, GENDER, BLOOD_GROUP, PAT_MOBILE, BIRTH_WEIGHT, AGE_YY, AGE_MM, AGE_DD, COMPANY_NO
       ) VALUES (
         s.REG_NO, s.FULL_NAME, s.FIRST_NAME, s.MIDDLE_NAME, s.LAST_NAME, s.FNAME, s.MNAME,
         s.DOB, s.GENDER, s.BLOOD_GROUP, s.PAT_MOBILE, s.BIRTH_WEIGHT, s.AGE_YY, s.AGE_MM, s.AGE_DD, s.COMPANY_NO
       )`
    );

    await conn.execute(
      `MERGE INTO ATI_REGI.IP_ADMISSION t
       USING (
         SELECT 
           'NICU-2026-083' AS ADMISSION_NO,
           'REG-2026-0083' AS REG_NO,
           'BED-NICU-04' AS BED_NO,
           TO_DATE('2026-10-10', 'YYYY-MM-DD') AS ADMISSION_DT,
           TO_DATE('2026-11-18', 'YYYY-MM-DD') AS DIS_TIMESTAMP,
           'Prof. Shamsuddin' AS PRIMARY_DOCTOR,
           'Prof. Dr. A. K. M. Shamsuddin' AS DOC_NAME,
           'Baby of Sadia Afrin' AS FULL_NAME,
           '6 Weeks (42 Days)' AS PAT_AGE,
           'F' AS GENDER,
           'NICU Cot #04 (Step-down)' AS WARD_CABIN,
           'Y' AS NEW_BORN_BABY,
           '1' AS COMPANY_NO
         FROM DUAL
       ) s
       ON (t.ADMISSION_NO = s.ADMISSION_NO)
       WHEN MATCHED THEN UPDATE SET t.DOC_NAME = s.DOC_NAME
       WHEN NOT MATCHED THEN INSERT (
         ADMISSION_NO, REG_NO, BED_NO, ADMISSION_DT, DIS_TIMESTAMP,
         PRIMARY_DOCTOR, DOC_NAME, FULL_NAME, PAT_AGE, GENDER,
         WARD_CABIN, NEW_BORN_BABY, COMPANY_NO
       ) VALUES (
         s.ADMISSION_NO, s.REG_NO, s.BED_NO, s.ADMISSION_DT, s.DIS_TIMESTAMP,
         s.PRIMARY_DOCTOR, s.DOC_NAME, s.FULL_NAME, s.PAT_AGE, s.GENDER,
         s.WARD_CABIN, s.NEW_BORN_BABY, s.COMPANY_NO
       )`
    );

    // Commit all
    await conn.commit();
    console.log('✅ Successfully seeded sample master data into OP_REGISTRATION, IP_ADMISSION, IP_BED!');
  } catch (err) {
    console.error('Error during seeding:', err);
  } finally {
    await conn.close();
  }
}

seedMasterData();
