import { NextRequest, NextResponse } from "next/server";
import { executeOracleQuery, testOracleHealth } from "@/lib/oracle";
import { DischargeSummary, MedicationItem, NicuAdviceItem } from "@/types/discharge";
import {
  NICU_ADVICE_CATALOG,
  calculateAgeInDays,
  getBirthAgeCriteriaCategory,
  evaluatePatientAdvices,
} from "@/lib/nicu-advice-criteria";

/**
 * GET /api/discharge
 * Query parameters:
 *  - admissionId: fetch specific record joining OP_REGISTRATION, IP_ADMISSION, IP_BED,
 *                 IP_NICUPICUDISCHARGE, IP_NICUPICUDISMEDICINE, IP_NICUADVICE_ASSIGN
 *  - action=advices: get master advices from IP_NICUADVICE filtered by birth age criteria
 *  - action=health: test Oracle DB connection
 */
export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const admissionId = searchParams.get("admissionId");
  const action = searchParams.get("action");
  const ageDaysParam = searchParams.get("ageDays");

  // Health check endpoint
  if (action === "health") {
    const health = await testOracleHealth();
    return NextResponse.json(health);
  }

  // Master Advices endpoint with birth age criteria
  if (action === "advices") {
    const ageDays = ageDaysParam ? parseInt(ageDaysParam, 10) : 7;
    const isPreterm = searchParams.get("preterm") === "true";

    try {
      // Query raw advices from Oracle IP_NICUADVICE
      const advQuery = await executeOracleQuery<any>(
        `SELECT ADVICE_ID, ADVICE_BANGLA, ADVICE_ENGLISH, ADVICE_TYPE 
         FROM ATI_REGI.IP_NICUADVICE 
         ORDER BY ADVICE_ID`
      );

      const dbRows = advQuery.rows || [];
      const evaluated = evaluatePatientAdvices(ageDays, isPreterm);

      // Merge DB rows with evaluated catalog
      const resultAdvices = evaluated.map((catAdv) => {
        const foundDb = dbRows.find(
          (r: any) => String(r.ADVICE_ID).trim() === catAdv.adviceId
        );
        return {
          adviceId: catAdv.adviceId,
          adviceType: foundDb?.ADVICE_TYPE || catAdv.adviceType,
          adviceEnglish: foundDb?.ADVICE_ENGLISH || catAdv.adviceEnglish,
          adviceBangla: catAdv.adviceBanglaUnicode,
          adviceBanglaRaw: foundDb?.ADVICE_BANGLA || catAdv.adviceBanglaBijoy,
          minAgeDays: catAdv.minAgeDays,
          maxAgeDays: catAdv.maxAgeDays,
          categoryLabelEn: catAdv.categoryLabelEn,
          categoryLabelBn: catAdv.categoryLabelBn,
          isRecommended: catAdv.isRecommended,
          selected: catAdv.selected,
        };
      });

      return NextResponse.json({
        success: true,
        source: "oracle",
        ageDays,
        criteriaCategory: getBirthAgeCriteriaCategory(ageDays),
        advices: resultAdvices,
      });
    } catch (e: any) {
      console.error("Error fetching advices:", e);
      return NextResponse.json({
        success: true,
        source: "fallback",
        ageDays,
        criteriaCategory: getBirthAgeCriteriaCategory(ageDays),
        advices: evaluatePatientAdvices(ageDays, isPreterm),
      });
    }
  }

  try {
    if (admissionId) {
      const cleanAdmNo = admissionId.trim();

      // 1. Join OP_REGISTRATION, IP_ADMISSION, IP_BED, and IP_NICUPICUDISCHARGE
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

      let joinResult = await executeOracleQuery<any>(sqlJoin, { adm_no: cleanAdmNo });
      let row = joinResult.rows && joinResult.rows.length > 0 ? joinResult.rows[0] : null;

      // Fallback: If not found in IP_ADMISSION, query IP_NICUPICUDISCHARGE directly
      if (!row) {
        const sqlDcDirect = `
          SELECT 
            d.ADMISSION_NO,
            'REG-' || d.ADMISSION_NO AS REG_NO,
            NVL(p.PATIENT_NM, 'Baby of Admission ' || d.ADMISSION_NO) AS PATIENT_NAME,
            NULL AS FATHER_NAME,
            NULL AS MOTHER_NAME,
            TO_CHAR(d.DELIVERY_DATE, 'YYYY-MM-DD') AS DOB,
            d.PAT_AGEDESCRIBE AS PAT_AGE,
            NULL AS AGE_YY, NULL AS AGE_MM, NULL AS AGE_DD,
            d.GENDER,
            d.BLOOD_CGROUP AS BLOOD_GROUP,
            d.BIRTH_WEIGHT,
            d.DIS_WEIGHT,
            d.OFC_ADM,
            d.OFC_DC,
            'BED-NICU' AS BED_NO,
            'NICU Step-down Unit' AS BED_NAME,
            'NICU-L3' AS WARD_NO,
            TO_CHAR(NVL(d.DELIVERY_DATE, d.DISCHARGE_DATE), 'YYYY-MM-DD') AS ADMISSION_DATE,
            TO_CHAR(d.DISCHARGE_DATE, 'YYYY-MM-DD') AS DISCHARGE_DATE,
            d.PRIMARY_DOCTOR AS CONSULTANT_NAME,
            d.CHIEF_COMPLAINT,
            d.HP_TREATMENT,
            d.DIAGNOSIS,
            d.CASE_SUMMARY,
            d.INVESTIGATION,
            d.ADVICE,
            d.REFERRAL_NOTE,
            d.TREAT_ON_DIS,
            d.PAT_AGEDESCRIBE,
            NULL AS PAT_MOBILE,
            NULL AS CONTACT_PHONE
          FROM ATI_REGI.IP_NICUPICUDISCHARGE d
          LEFT JOIN ATI_REGI.HC_PATIENTS p ON p.PATIENT_NO = d.ADMISSION_NO
          WHERE UPPER(d.ADMISSION_NO) = UPPER(:adm_no)
        `;
        const directResult = await executeOracleQuery<any>(sqlDcDirect, { adm_no: cleanAdmNo });
        if (directResult.rows && directResult.rows.length > 0) {
          row = directResult.rows[0];
        }
      }

      if (!row) {
        return NextResponse.json(
          {
            success: false,
            message: `No patient or admission record found for Admission ID: ${admissionId}`,
            data: null,
          },
          { status: 404 }
        );
      }

      // 2. Fetch Prescribed Medicines from IP_NICUPICUDISMEDICINE
      let medications: MedicationItem[] = [];
      try {
        const medResult = await executeOracleQuery<any>(
          `SELECT 
             MEDICINE_NO, MEDICINE_NAME, STRENGTH, UOM, QUANTITY, DURATION, INSTRUCTIONS_EN, INSTRUCTIONS_BN, SL_NO
           FROM ATI_REGI.IP_NICUPICUDISMEDICINE
           WHERE UPPER(ADMISSION_NO) = UPPER(:adm_no)
           ORDER BY SL_NO, MEDICINE_NO`,
          { adm_no: cleanAdmNo }
        );

        if (medResult.rows && medResult.rows.length > 0) {
          medications = medResult.rows.map((m: any, idx: number) => ({
            id: m.MEDICINE_NO || `med-${idx + 1}`,
            name: m.MEDICINE_NAME || "",
            dosage: m.STRENGTH ? `${m.STRENGTH} ${m.UOM || ""}`.trim() : "",
            frequency: m.INSTRUCTIONS_EN || "OD (Once Daily)",
            duration: m.DURATION || "7 Days",
            instructions: m.INSTRUCTIONS_EN || "",
            instructionsBn: m.INSTRUCTIONS_BN || "",
            strength: m.STRENGTH || "",
            uom: m.UOM || "",
            quantity: m.QUANTITY || 1,
          }));
        }
      } catch (medErr) {
        console.warn("Could not query IP_NICUPICUDISMEDICINE:", medErr);
      }

      // If no rows in IP_NICUPICUDISMEDICINE, fallback to row.TREAT_ON_DIS
      if (medications.length === 0 && row.TREAT_ON_DIS) {
        try {
          if (row.TREAT_ON_DIS.startsWith("[")) {
            medications = JSON.parse(row.TREAT_ON_DIS);
          } else {
            medications = row.TREAT_ON_DIS.split("\n")
              .filter(Boolean)
              .map((line: string, i: number) => ({
                id: `med-${i + 1}`,
                name: line.trim(),
                dosage: "",
                frequency: "OD",
                duration: "7 Days",
                instructions: "",
              }));
          }
        } catch {
          medications = [];
        }
      }

      // 3. Compute Patient Birth Age in Days & Criteria Category
      const calculatedAgeDays = calculateAgeInDays(
        row.DOB,
        row.DISCHARGE_DATE,
        row.PAT_AGE || row.PAT_AGEDESCRIBE
      );
      const isPreterm =
        (row.PAT_AGEDESCRIBE && row.PAT_AGEDESCRIBE.toLowerCase().includes("preterm")) ||
        (row.DIAGNOSIS && row.DIAGNOSIS.toLowerCase().includes("preterm")) ||
        (row.BIRTH_WEIGHT && parseFloat(row.BIRTH_WEIGHT) < 2.0);

      const criteriaCategory = getBirthAgeCriteriaCategory(calculatedAgeDays);

      // 4. Fetch Assigned Advices from IP_NICUADVICE_ASSIGN
      let assignedAdvices: NicuAdviceItem[] = [];
      try {
        const assignResult = await executeOracleQuery<any>(
          `SELECT 
             a.ADVICE_ID, a.ADVICE_TYPE, a.ADVICE_EN, a.ADVICE_BN,
             m.ADVICE_ENGLISH AS MASTER_EN, m.ADVICE_BANGLA AS MASTER_BN
           FROM ATI_REGI.IP_NICUADVICE_ASSIGN a
           LEFT JOIN ATI_REGI.IP_NICUADVICE m ON m.ADVICE_ID = a.ADVICE_ID
           WHERE UPPER(a.ADMISSION_NO) = UPPER(:adm_no)
           ORDER BY a.ADVICE_ID`,
          { adm_no: cleanAdmNo }
        );

        if (assignResult.rows && assignResult.rows.length > 0) {
          const rows = assignResult.rows;
          const assignedIds = new Set(rows.map((r: any) => String(r.ADVICE_ID).trim()));

          // Merge with master catalog to get Unicode Bengali and age category tags
          assignedAdvices = NICU_ADVICE_CATALOG.map((catAdv) => {
            const isAssigned = assignedIds.has(catAdv.adviceId);
            const foundRow = rows.find(
              (r: any) => String(r.ADVICE_ID).trim() === catAdv.adviceId
            );
            return {
              adviceId: catAdv.adviceId,
              adviceType: foundRow?.ADVICE_TYPE || catAdv.adviceType,
              adviceEnglish: foundRow?.ADVICE_EN || catAdv.adviceEnglish,
              adviceBangla: catAdv.adviceBanglaUnicode,
              adviceBanglaRaw: foundRow?.ADVICE_BN || catAdv.adviceBanglaBijoy,
              minAgeDays: catAdv.minAgeDays,
              maxAgeDays: catAdv.maxAgeDays,
              categoryLabelEn: catAdv.categoryLabelEn,
              categoryLabelBn: catAdv.categoryLabelBn,
              isRecommended: catAdv.minAgeDays <= calculatedAgeDays && calculatedAgeDays <= catAdv.maxAgeDays,
              selected: isAssigned,
            };
          });
        }
      } catch (advErr) {
        console.warn("Could not query IP_NICUADVICE_ASSIGN:", advErr);
      }

      // If no advices previously assigned for this admission, automatically evaluate
      // and select advices based on the patient's birth age criteria!
      if (assignedAdvices.length === 0) {
        const evaluated = evaluatePatientAdvices(calculatedAgeDays, isPreterm);
        assignedAdvices = evaluated.map((catAdv) => ({
          adviceId: catAdv.adviceId,
          adviceType: catAdv.adviceType,
          adviceEnglish: catAdv.adviceEnglish,
          adviceBangla: catAdv.adviceBanglaUnicode,
          adviceBanglaRaw: catAdv.adviceBanglaBijoy,
          minAgeDays: catAdv.minAgeDays,
          maxAgeDays: catAdv.maxAgeDays,
          categoryLabelEn: catAdv.categoryLabelEn,
          categoryLabelBn: catAdv.categoryLabelBn,
          isRecommended: catAdv.isRecommended,
          selected: catAdv.selected,
        }));
      }

      // Build consolidated DischargeSummary response
      const guardianStr = [
        row.MOTHER_NAME ? `${row.MOTHER_NAME} (Mother)` : "",
        row.FATHER_NAME ? `${row.FATHER_NAME} (Father)` : "",
      ]
        .filter(Boolean)
        .join(" / ") || (row.PATIENT_NAME ? `Mother of ${row.PATIENT_NAME}` : "Parents");

      const summary: DischargeSummary = {
        id: row.ADMISSION_NO,
        admissionId: row.ADMISSION_NO,
        regNo: row.REG_NO || "",
        patientName: row.PATIENT_NAME || `Baby of ${row.MOTHER_NAME || "Mother"}`,
        guardianName: guardianStr,
        fatherName: row.FATHER_NAME || "",
        motherName: row.MOTHER_NAME || "",
        dob: row.DOB || "",
        calculatedAgeDays,
        birthAgeCriteriaCategory: criteriaCategory.labelBn,
        age: row.PAT_AGE || `${calculatedAgeDays} Days`,
        gender: row.GENDER === "F" ? "Female" : "Male",
        bloodGroup: row.BLOOD_GROUP || "B+",
        bedNo: row.BED_NO || "BED-NICU-01",
        bedName: row.BED_NAME || "NICU Incubator",
        wardName: row.WARD_NO || "NICU Level 3",
        department: "Department of Neonatology & Inpatient Pediatrics",
        consultantName: row.CONSULTANT_NAME || "Prof. Dr. A. K. M. Shamsuddin",
        admissionDate: row.ADMISSION_DATE || "2026-11-01",
        dischargeDate: row.DISCHARGE_DATE || "2026-11-18",
        primaryDiagnosis: row.DIAGNOSIS || row.CHIEF_COMPLAINT || "Routine Neonatal Care",
        secondaryDiagnosis: row.CASE_SUMMARY || "",
        birthWeight: row.BIRTH_WEIGHT ? `${row.BIRTH_WEIGHT} kg` : "",
        dischargeWeight: row.DIS_WEIGHT ? `${row.DIS_WEIGHT} kg` : "",
        ofcAdm: row.OFC_ADM || "",
        ofcDc: row.OFC_DC || "",
        hospitalCourse: row.HP_TREATMENT || "Standard neonatal care given with full clinical monitoring.",
        investigationSummary: row.INVESTIGATION || "",
        conditionAtDischarge: "Stable / Improved",
        feedingAdvice: row.ADVICE || "Exclusive Breast Feeding (EBF) or Expressed Breast Milk (EBM) every 2 hours.",
        instructions: row.REFERRAL_NOTE || "Follow neonatal warm care and contact hospital if any emergency signs occur.",
        followUpDate: "2026-11-25",
        emergencyContact: row.PAT_MOBILE || "+880 1711-000000",
        medications,
        advices: assignedAdvices,
      };

      return NextResponse.json({
        success: true,
        source: "oracle",
        criteriaCategory,
        data: summary,
      });
    }

    // List recent admissions from IP_ADMISSION + IP_NICUPICUDISCHARGE
    const listSql = `
      SELECT 
        a.ADMISSION_NO,
        a.REG_NO,
        NVL(a.FULL_NAME, NVL(r.FULL_NAME, 'Baby of Admission ' || a.ADMISSION_NO)) AS PATIENT_NAME,
        NVL(d.PAT_AGEDESCRIBE, a.PAT_AGE) AS PAT_AGE,
        TO_CHAR(r.DOB, 'YYYY-MM-DD') AS DOB,
        NVL(d.GENDER, a.GENDER) AS GENDER,
        NVL(d.DIAGNOSIS, 'NICU Inpatient') AS DIAGNOSIS,
        NVL(b.BED_NAME, a.BED_NO) AS BED_NAME,
        TO_CHAR(a.ADMISSION_DT, 'YYYY-MM-DD') AS ADMISSION_DATE,
        TO_CHAR(d.DISCHARGE_DATE, 'YYYY-MM-DD') AS DISCHARGE_DATE,
        NVL(d.PRIMARY_DOCTOR, a.DOC_NAME) AS PRIMARY_DOCTOR
      FROM ATI_REGI.IP_ADMISSION a
      LEFT JOIN ATI_REGI.OP_REGISTRATION r ON r.REG_NO = a.REG_NO
      LEFT JOIN ATI_REGI.IP_BED b ON b.BED_NO = a.BED_NO
      LEFT JOIN ATI_REGI.IP_NICUPICUDISCHARGE d ON d.ADMISSION_NO = a.ADMISSION_NO
      ORDER BY a.ADMISSION_DT DESC NULLS LAST, a.ADMISSION_NO DESC
      FETCH FIRST 20 ROWS ONLY
    `;

    const listResult = await executeOracleQuery<any>(listSql);

    return NextResponse.json({
      success: true,
      source: "oracle",
      rowCount: listResult.rows?.length || 0,
      data: listResult.rows || [],
    });
  } catch (error: any) {
    console.error("GET /api/discharge Oracle Error:", error);
    return NextResponse.json(
      {
        success: false,
        error: error.message || "Database query failed",
      },
      { status: 500 }
    );
  }
}

/**
 * POST /api/discharge
 * Saves or updates clinical discharge records across:
 *  1. IP_NICUPICUDISCHARGE (Main discharge summary)
 *  2. IP_NICUPICUDISMEDICINE (Prescribed discharge medications)
 *  3. IP_NICUADVICE_ASSIGN (Selected Bangla & English advices by birth age criteria)
 */
export async function POST(request: NextRequest) {
  try {
    const body: DischargeSummary = await request.json();

    if (!body.admissionId || !body.patientName) {
      return NextResponse.json(
        {
          success: false,
          error: "Admission ID and Patient Name are required fields.",
        },
        { status: 400 }
      );
    }

    const cleanAdmNo = body.admissionId.trim();

    // Parse numeric weights safely
    const birthWeightNum = body.birthWeight
      ? parseFloat(body.birthWeight.replace(/[^0-9.]/g, "")) || null
      : null;
    const disWeightNum = body.dischargeWeight
      ? parseFloat(body.dischargeWeight.replace(/[^0-9.]/g, "")) || null
      : null;

    // Convert medication array to string/JSON format for TREAT_ON_DIS column
    const medicationsJson =
      body.medications && body.medications.length > 0
        ? JSON.stringify(body.medications)
        : "";

    // 1. MERGE (UPSERT) into IP_NICUPICUDISCHARGE
    const mergeDischargeSql = `
      MERGE INTO ATI_REGI.IP_NICUPICUDISCHARGE target
      USING (
        SELECT 
          :adm_no AS ADMISSION_NO,
          TO_DATE(:dc_date, 'YYYY-MM-DD') AS DISCHARGE_DATE,
          :doctor AS PRIMARY_DOCTOR,
          :complaint AS CHIEF_COMPLAINT,
          :treatment AS HP_TREATMENT,
          :birth_wt AS BIRTH_WEIGHT,
          :dis_wt AS DIS_WEIGHT,
          :gender AS GENDER,
          :summary AS CASE_SUMMARY,
          :investigation AS INVESTIGATION,
          :diagnosis AS DIAGNOSIS,
          :treat_on_dis AS TREAT_ON_DIS,
          :age_desc AS PAT_AGEDESCRIBE,
          :advice AS ADVICE,
          :bld_cgroup AS BLOOD_CGROUP,
          :referral AS REFERRAL_NOTE,
          '1' AS COMPANY_NO,
          'WEB_USER' AS ENTERED_BY,
          SYSDATE AS ENTRY_TIMESTAMP
        FROM DUAL
      ) src
      ON (target.ADMISSION_NO = src.ADMISSION_NO)
      WHEN MATCHED THEN
        UPDATE SET 
          target.DISCHARGE_DATE   = src.DISCHARGE_DATE,
          target.PRIMARY_DOCTOR   = src.PRIMARY_DOCTOR,
          target.CHIEF_COMPLAINT  = src.CHIEF_COMPLAINT,
          target.HP_TREATMENT     = src.HP_TREATMENT,
          target.BIRTH_WEIGHT     = src.BIRTH_WEIGHT,
          target.DIS_WEIGHT       = src.DIS_WEIGHT,
          target.GENDER           = src.GENDER,
          target.CASE_SUMMARY     = src.CASE_SUMMARY,
          target.INVESTIGATION    = src.INVESTIGATION,
          target.DIAGNOSIS        = src.DIAGNOSIS,
          target.TREAT_ON_DIS     = src.TREAT_ON_DIS,
          target.PAT_AGEDESCRIBE  = src.PAT_AGEDESCRIBE,
          target.ADVICE           = src.ADVICE,
          target.BLOOD_CGROUP     = src.BLOOD_CGROUP,
          target.REFERRAL_NOTE    = src.REFERRAL_NOTE,
          target.UPDATED_BY       = 'WEB_USER',
          target.UPDATE_TIMESTAMP = SYSDATE
      WHEN NOT MATCHED THEN
        INSERT (
          ADMISSION_NO, DISCHARGE_DATE, PRIMARY_DOCTOR, CHIEF_COMPLAINT,
          HP_TREATMENT, BIRTH_WEIGHT, DIS_WEIGHT, GENDER, CASE_SUMMARY,
          INVESTIGATION, DIAGNOSIS, TREAT_ON_DIS, PAT_AGEDESCRIBE,
          ADVICE, BLOOD_CGROUP, REFERRAL_NOTE, COMPANY_NO, ENTERED_BY, ENTRY_TIMESTAMP
        )
        VALUES (
          src.ADMISSION_NO, src.DISCHARGE_DATE, src.PRIMARY_DOCTOR, src.CHIEF_COMPLAINT,
          src.HP_TREATMENT, src.BIRTH_WEIGHT, src.DIS_WEIGHT, src.GENDER, src.CASE_SUMMARY,
          src.INVESTIGATION, src.DIAGNOSIS, src.TREAT_ON_DIS, src.PAT_AGEDESCRIBE,
          src.ADVICE, src.BLOOD_CGROUP, src.REFERRAL_NOTE, src.COMPANY_NO, src.ENTERED_BY, src.ENTRY_TIMESTAMP
        )
    `;

    const binds = {
      adm_no: cleanAdmNo,
      dc_date: body.dischargeDate || new Date().toISOString().slice(0, 10),
      doctor: (body.consultantName || "Attending Consultant").slice(0, 16),
      complaint: (body.primaryDiagnosis || "Routine NICU Discharge").slice(0, 2000),
      treatment: (body.hospitalCourse || "Standard neonatal care given").slice(0, 2000),
      birth_wt: birthWeightNum,
      dis_wt: disWeightNum,
      gender: body.gender === "Female" ? "F" : "M",
      summary: (body.secondaryDiagnosis || "").slice(0, 2000),
      investigation: (body.investigationSummary || "").slice(0, 2000),
      diagnosis: (body.primaryDiagnosis || "").slice(0, 2000),
      treat_on_dis: medicationsJson.slice(0, 2000),
      age_desc: (body.age || "Neonate").slice(0, 100),
      advice: (body.feedingAdvice || body.instructions || "").slice(0, 2000),
      bld_cgroup: (body.bloodGroup || "O+").slice(0, 50),
      referral: (body.instructions || "Follow-up at Outpatient Clinic").slice(0, 100),
    };

    await executeOracleQuery(mergeDischargeSql, binds, { autoCommit: true });

    // 2. Synchronize IP_NICUPICUDISMEDICINE
    if (body.medications && Array.isArray(body.medications)) {
      // Clear previous medications for this admission
      await executeOracleQuery(
        `DELETE FROM ATI_REGI.IP_NICUPICUDISMEDICINE WHERE UPPER(ADMISSION_NO) = UPPER(:adm_no)`,
        { adm_no: cleanAdmNo },
        { autoCommit: true }
      );

      // Insert fresh medication schedules
      for (let idx = 0; idx < body.medications.length; idx++) {
        const med = body.medications[idx];
        if (!med.name) continue;

        await executeOracleQuery(
          `INSERT INTO ATI_REGI.IP_NICUPICUDISMEDICINE (
             ADMISSION_NO, SL_NO, MEDICINE_NO, MEDICINE_NAME, STRENGTH,
             UOM, QUANTITY, DURATION, INSTRUCTIONS_EN, INSTRUCTIONS_BN,
             ENTER_BY, ENTER_DT, COMPANY_NO
           ) VALUES (
             :adm_no, :sl_no, :med_no, :med_name, :strength,
             :uom, :qty, :duration, :inst_en, :inst_bn,
             'WEB_USER', SYSDATE, '1'
           )`,
          {
            adm_no: cleanAdmNo,
            sl_no: idx + 1,
            med_no: (med.id || `MED-${idx + 1}`).slice(0, 20),
            med_name: (med.name || "").slice(0, 150),
            strength: (med.strength || med.dosage || "").slice(0, 10),
            uom: (med.uom || "dose").slice(0, 20),
            qty: med.quantity || 1,
            duration: (med.duration || "7 Days").slice(0, 100),
            inst_en: (med.frequency || med.instructions || "").slice(0, 2000),
            inst_bn: (med.instructionsBn || "").slice(0, 2000),
          },
          { autoCommit: true }
        );
      }
    }

    // 3. Synchronize IP_NICUADVICE_ASSIGN
    if (body.advices && Array.isArray(body.advices)) {
      // Clear previous assigned advices
      await executeOracleQuery(
        `DELETE FROM ATI_REGI.IP_NICUADVICE_ASSIGN WHERE UPPER(ADMISSION_NO) = UPPER(:adm_no)`,
        { adm_no: cleanAdmNo },
        { autoCommit: true }
      );

      // Insert selected advices
      const selectedAdvices = body.advices.filter((a) => a.selected);
      for (const adv of selectedAdvices) {
        await executeOracleQuery(
          `INSERT INTO ATI_REGI.IP_NICUADVICE_ASSIGN (
             ADMISSION_NO, ADVICE_ID, ADVICE_TYPE, ADVICE_EN, ADVICE_BN,
             ENTER_BY, ENTER_DT, COMPANY_NO
           ) VALUES (
             :adm_no, :adv_id, :adv_type, :adv_en, :adv_bn,
             'WEB_USER', SYSDATE, '1'
           )`,
          {
            adm_no: cleanAdmNo,
            adv_id: (adv.adviceId || "A01").slice(0, 16),
            adv_type: (adv.adviceType || "G").slice(0, 1),
            adv_en: (adv.adviceEnglish || "").slice(0, 2000),
            adv_bn: (adv.adviceBanglaRaw || adv.adviceBangla || "").slice(0, 2000),
          },
          { autoCommit: true }
        );
      }
    }

    return NextResponse.json({
      success: true,
      message: `Discharge summary, medications (${body.medications?.length || 0}), and Bangla advices (${
        body.advices?.filter((a) => a.selected).length || 0
      }) saved successfully into Oracle DB!`,
      admissionId: cleanAdmNo,
    });
  } catch (error: any) {
    console.error("POST /api/discharge Oracle Error:", error);
    return NextResponse.json(
      {
        success: false,
        error: error.message || "Failed to commit discharge records to Oracle DB.",
      },
      { status: 500 }
    );
  }
}
