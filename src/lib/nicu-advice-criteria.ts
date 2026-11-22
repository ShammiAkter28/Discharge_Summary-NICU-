/**
 * NICU / PICU Clinical Advice & Birth Age Criteria Engine
 * Maps to Oracle IP_NICUADVICE and IP_NICUADVICE_ASSIGN tables.
 */

export interface NicuAdviceDefinition {
  adviceId: string;
  adviceType: "G" | "D";
  adviceEnglish: string;
  adviceBanglaUnicode: string;
  adviceBanglaBijoy: string;
  minAgeDays: number;
  maxAgeDays: number;
  targetCriteria: "EARLY_NEONATE" | "NEONATE" | "INFANT_6WK" | "INFANT_6MO" | "ALL_AGES" | "PRETERM_RISK";
  categoryLabelEn: string;
  categoryLabelBn: string;
  priority: number;
}

/**
 * Master catalog matching ATI_REGI.IP_NICUADVICE (Rows A01 to A16)
 * with accurate Unicode Bangla translations and evidence-based neonatal birth age criteria.
 */
export const NICU_ADVICE_CATALOG: NicuAdviceDefinition[] = [
  {
    adviceId: "A01",
    adviceType: "G",
    adviceEnglish:
      "Begin breastfeeding your baby as soon as possible after birth and give your baby the precious first milk (colostrum). For the first six months, feed your baby only breast milk to support healthy growth and development.",
    adviceBanglaUnicode:
      "বাচ্চার জন্মের পর থেকে শাল দুধ খাওয়াতে শুরু করবেন এবং ৬ মাস পর্যন্ত শুধুমাত্র বুকের দুধ খাওয়াবেন।",
    adviceBanglaBijoy:
      "ev”Pvi R‡b¥i ci †_‡K kvj `ya LvIqv‡Z ïi“ Ki‡eb Ges 6 gvm ch©š— ïaygvÎ ey‡Ki `ya \r\nLvIqv‡eb|",
    minAgeDays: 0,
    maxAgeDays: 180,
    targetCriteria: "NEONATE",
    categoryLabelEn: "Breastfeeding & Nutrition (0 - 6 Months)",
    categoryLabelBn: "শাল দুধ ও বুকের দুধ (জন্ম থেকে ৬ মাস)",
    priority: 1,
  },
  {
    adviceId: "A02",
    adviceType: "G",
    adviceEnglish: "Burp your baby after each feeding.",
    adviceBanglaUnicode: "প্রতিবার দুধ খাওয়াবার পর ঢেকুর তুলবেন।",
    adviceBanglaBijoy: "cÖwZevi `ya LvIqvevi ci †XKzi †Zvjv‡eb|",
    minAgeDays: 0,
    maxAgeDays: 180,
    targetCriteria: "NEONATE",
    categoryLabelEn: "Feeding Technique (0 - 6 Months)",
    categoryLabelBn: "দুধ খাওয়ানোর নিয়ম ও ঢেকুর তোলা",
    priority: 2,
  },
  {
    adviceId: "A03",
    adviceType: "G",
    adviceEnglish:
      "From 6 months of age, start introducing soft and semi-solid foods alongside breast milk.",
    adviceBanglaUnicode:
      "৬ মাস পর থেকে মায়ের বুকের দুধের পাশাপাশি তরল ও নরম খাবার শুরু করবেন।",
    adviceBanglaBijoy:
      "6 gvm ci †_‡K gv‡qi ey‡Ki `y‡ai cvkvcvwk Zij I big Lvevi ïi“ Ki‡eb|",
    minAgeDays: 180,
    maxAgeDays: 730,
    targetCriteria: "INFANT_6MO",
    categoryLabelEn: "Weaning & Complementary Feeding (≥ 6 Months)",
    categoryLabelBn: "পরিপূরক নরম খাদ্য শুরু (বয়স: ৬ মাস+)",
    priority: 8,
  },
  {
    adviceId: "A04",
    adviceType: "G",
    adviceEnglish:
      "Do not apply anything to your baby’s umbilical cord stump unless advised by a healthcare professional. It will fall off naturally on its own.",
    adviceBanglaUnicode:
      "বাচ্চার নাভীতে পরামর্শ ব্যতীত কোনো কিছু লাগানোর প্রয়োজন নেই। এটা নিজে থেকে পড়ে যাবে।",
    adviceBanglaBijoy:
      "ev”Pvi bvfx‡Z civgk© e¨ZxZ †Kv‡bv wKQz jvMv‡bvi cÖ‡q‡vRb †bB| GUv wb‡R †_‡K c‡o hv‡e|",
    minAgeDays: 0,
    maxAgeDays: 14,
    targetCriteria: "EARLY_NEONATE",
    categoryLabelEn: "Cord Stump Care (0 - 14 Days)",
    categoryLabelBn: "নাভী ও ত্বক যত্ন (জন্ম থেকে ১৪ দিন)",
    priority: 3,
  },
  {
    adviceId: "A05",
    adviceType: "G",
    adviceEnglish:
      "You can gently wipe your baby’s body daily with lukewarm water. Once the umbilical cord stump has fallen off and the area has healed, you can start giving your baby a bath.",
    adviceBanglaUnicode:
      "প্রতিদিন বাচ্চাকে হালকা গরম পানিতে গা মোছাতে পারেন। নাভী পড়ে গেলে গোসল করাতে পারেন।",
    adviceBanglaBijoy:
      "cÖwZw`b ev”Pv‡K nvjKv Mig cvwb‡Z Mv †gvQv‡Z cv‡ib| bvfx c‡o †M‡j †Mvmj Kiv‡Z cv‡ib|",
    minAgeDays: 0,
    maxAgeDays: 30,
    targetCriteria: "NEONATE",
    categoryLabelEn: "Hygiene & Bathing (0 - 1 Month)",
    categoryLabelBn: "গা মোছানো ও গোসল (জন্ম থেকে ১ মাস)",
    priority: 4,
  },
  {
    adviceId: "A06",
    adviceType: "G",
    adviceEnglish:
      "Make sure your baby receives the BCG vaccine within the first 14 days after birth.",
    adviceBanglaUnicode: "১৪ দিন বয়সের মধ্যে বি.সি.জি টিকা দেবেন।",
    adviceBanglaBijoy: "14 w`b eq‡mi g‡a¨ we.wm.wR wUKv w`‡eb|",
    minAgeDays: 0,
    maxAgeDays: 14,
    targetCriteria: "EARLY_NEONATE",
    categoryLabelEn: "BCG Vaccination (0 - 14 Days)",
    categoryLabelBn: "বিসিজি টিকা (বয়স: ০ থেকে ১৪ দিন)",
    priority: 1,
  },
  {
    adviceId: "A07",
    adviceType: "G",
    adviceEnglish:
      "Ensure your baby receives all vaccinations according to the EPI schedule, starting at 6 weeks of age.",
    adviceBanglaUnicode: "দেড় মাস (৬ সপ্তাহ) বয়স থেকে ই.পি.আই অনুযায়ী টিকা দেবেন।",
    adviceBanglaBijoy: "†`o gvm eqm †_‡K B.wc.AvB Abyhvqx wUKv w`‡eb|",
    minAgeDays: 28,
    maxAgeDays: 120,
    targetCriteria: "INFANT_6WK",
    categoryLabelEn: "EPI Immunization Schedule (from 6 Weeks)",
    categoryLabelBn: "ইপিআই পূর্ণাঙ্গ টিকা (বয়স: ৬ সপ্তাহ বা দেড় মাস)",
    priority: 2,
  },
  {
    adviceId: "A08",
    adviceType: "G",
    adviceEnglish:
      "If your baby’s skin suddenly becomes yellow, seek medical advice promptly, as this may be a sign of jaundice. Do not rely on sunlight to treat jaundice.",
    adviceBanglaUnicode:
      "শিশুর শরীর আচমকা হলুদ হলে, সকাল ১১ টার মধ্যে ২০-৩০ মিনিটের জন্য রোদ দেখাবেন, জন্ডিস ভাল না হওয়া পর্যন্ত।",
    adviceBanglaBijoy:
      "wkïi kixi AvPgKv njy` n‡j, mKvj 11 Uvi g‡a¨ 20-30 wgwb‡Ui Rb¨ †iv` †`Lv‡eb, RwÛm fvj bv nIqv ch©šÍ|",
    minAgeDays: 0,
    maxAgeDays: 28,
    targetCriteria: "NEONATE",
    categoryLabelEn: "Neonatal Jaundice Care (0 - 28 Days)",
    categoryLabelBn: "জন্ডিস লক্ষণ ও রোদ দেখানো (০-২৮ দিন)",
    priority: 5,
  },
  {
    adviceId: "A09",
    adviceType: "G",
    adviceEnglish:
      "Breastfed babies may pass loose stools that are yellow or green in color, as often as 6–7 times a day. This is usually normal and nothing to worry about.",
    adviceBanglaUnicode:
      "মায়ের বুকের দুধ পান করা শিশুর পায়খানার রঙ একটু পাতলা, সবুজ অথবা হলুদ ইত্যাদি রোজ ৬/৭ বার হতে পারে। এতে চিন্তার কিছু নেই।",
    adviceBanglaBijoy:
      "gv‡qi ey‡Ki `ya cvb Kiv wkïi cvqLvbvi is GKUz cvZjv, meyR A_ev njy` BZ¨vw` †ivR 6/7 evi n‡Z cv‡i| G‡Z wPšÍvi wKQz †bB|",
    minAgeDays: 0,
    maxAgeDays: 60,
    targetCriteria: "NEONATE",
    categoryLabelEn: "Normal Stool Behavior (0 - 2 Months)",
    categoryLabelBn: "স্বাভাবিক পায়খানার বৈশিষ্ট্য (০-২ মাস)",
    priority: 6,
  },
  {
    adviceId: "A10",
    adviceType: "G",
    adviceEnglish:
      "Please have a hearing test done within one to one and a half months.",
    adviceBanglaUnicode: "এক থেকে দেড় মাসের মধ্যে বাচ্চার হিয়ারিং টেস্ট করাবেন।",
    adviceBanglaBijoy: "GK †_‡K †`o gv‡mi g‡a¨ wnqvwis †U÷ Kiv‡eb|",
    minAgeDays: 20,
    maxAgeDays: 60,
    targetCriteria: "INFANT_6WK",
    categoryLabelEn: "Hearing Screening (1 - 1.5 Months)",
    categoryLabelBn: "শ্রবণ পরীক্ষা / হিয়ারিং টেস্ট (১ থেকে ১.৫ মাস)",
    priority: 4,
  },
  {
    adviceId: "A11",
    adviceType: "G",
    adviceEnglish:
      "If any problems arise, please contact the hospital's Emergency Department.",
    adviceBanglaUnicode:
      "যেকোনো জরুরি সমস্যা দেখা দিলে তাৎক্ষণিক হাসপাতালের জরুরি বিভাগে যোগাযোগ করবেন।",
    adviceBanglaBijoy: "†Kv‡bv mgm¨ n‡j nvmcvZv‡ji Riæix wefv‡M †hvMv‡hvM Ki‡eb|",
    minAgeDays: 0,
    maxAgeDays: 9999,
    targetCriteria: "ALL_AGES",
    categoryLabelEn: "Emergency Care (All Ages)",
    categoryLabelBn: "জরুরি বিপদচিহ্ন ও যোগাযোগ (সকল বয়স)",
    priority: 9,
  },
  {
    adviceId: "A12",
    adviceType: "G",
    adviceEnglish:
      "Perform ROP (Retinopathy of Prematurity) screening when the baby reaches the specified age in days (usually 30-32 days).",
    adviceBanglaUnicode:
      "বাচ্চার বয়স ৩০ দিন হলে আর.ও.পি (চোখের রেটিনা) স্ক্রীনিং করাবেন।",
    adviceBanglaBijoy: "ev”Pvi eqm.................w`b n‡j Avi.I.wc w¯Œwbs Kiv‡eb|",
    minAgeDays: 14,
    maxAgeDays: 45,
    targetCriteria: "PRETERM_RISK",
    categoryLabelEn: "ROP Retinopathy Screening (Preterm / 30 Days)",
    categoryLabelBn: "আর.ও.পি রেটিনা স্ক্রীনিং (প্রিমেচিউর / ৩০ দিন বয়স)",
    priority: 3,
  },
  {
    adviceId: "A13",
    adviceType: "G",
    adviceEnglish:
      "Perform a neurological assessment and administer the vaccination at 6 weeks of age.",
    adviceBanglaUnicode:
      "৬ সপ্তাহ বয়সে নিউরোলজিক্যাল অ্যাসেসমেন্ট করাবেন ও টিকা দেবেন।",
    adviceBanglaBijoy:
      "6 mßvn eq‡m Kiv‡eb wbD‡ivjwRK¨vj A¨vmm‡g›U Kiv‡eb I wUKv w`‡eb|",
    minAgeDays: 28,
    maxAgeDays: 60,
    targetCriteria: "INFANT_6WK",
    categoryLabelEn: "Neurological Assessment (6 Weeks)",
    categoryLabelBn: "স্নায়ুবিক বিকাশ পর্যবেক্ষণ ও টিকা (৬ সপ্তাহ বয়স)",
    priority: 5,
  },
  {
    adviceId: "A14",
    adviceType: "D",
    adviceEnglish: "Administer the prescribed medication regularly as scheduled.",
    adviceBanglaUnicode: "প্রেসক্রিপশন অনুযায়ী নিয়মিত সঠিক সময়ে ঔষধ খাওয়াবেন।",
    adviceBanglaBijoy: "wbqwgZ Jla LvIqv‡eb |",
    minAgeDays: 0,
    maxAgeDays: 9999,
    targetCriteria: "ALL_AGES",
    categoryLabelEn: "Medication Compliance (All Ages)",
    categoryLabelBn: "নিয়মিত ঔষধ সেবন (সকল বয়স)",
    priority: 10,
  },
  {
    adviceId: "A15",
    adviceType: "D",
    adviceEnglish: "If any problems, please contact the attending physician/advisor.",
    adviceBanglaUnicode:
      "কোনো শারীরিক জটিলতা বা সমস্যা দেখা দিলে চিকিৎসকের সাথে যোগাযোগ করবেন।",
    adviceBanglaBijoy:
      "†Kv‡bv mgm¨ n‡j A¨vWfvBRvi / A¨vWfvBRv‡ii mv‡_ †hvMv‡hvM Ki‡eb|",
    minAgeDays: 0,
    maxAgeDays: 9999,
    targetCriteria: "ALL_AGES",
    categoryLabelEn: "Physician Contact (All Ages)",
    categoryLabelBn: "চিকিৎসক ও কনসালট্যান্ট যোগাযোগ (সকল বয়স)",
    priority: 11,
  },
  {
    adviceId: "A16",
    adviceType: "D",
    adviceEnglish:
      "Please visit the advisor’s/doctor’s chamber for a follow-up consultation after 7 days.",
    adviceBanglaUnicode:
      "ছুটির পর আগামী ৭ দিন পর চিকিৎসকের চেম্বার/বহির্বিভাগে ফলো-আপের জন্য যোগাযোগ করবেন।",
    adviceBanglaBijoy:
      "AvMvgx 7 w`b ci A¨vWfvBRvi / g¨vWv‡gi mv‡_ †P¤^v‡i †hvMv‡hvM Ki‡eb|",
    minAgeDays: 0,
    maxAgeDays: 9999,
    targetCriteria: "ALL_AGES",
    categoryLabelEn: "Follow-up Consultation (7 Days post-discharge)",
    categoryLabelBn: "৭ দিন পর ফলো-আপ সাক্ষাত (সকল বয়স)",
    priority: 12,
  },
];

/**
 * Computes exact chronological age in days from DOB or delivery date or age description.
 */
export function calculateAgeInDays(
  dobStr?: string,
  dischargeDateStr?: string,
  ageDesc?: string
): number {
  // 1. Try DOB string
  if (dobStr) {
    const dob = new Date(dobStr);
    const refDate = dischargeDateStr ? new Date(dischargeDateStr) : new Date();
    if (!isNaN(dob.getTime()) && !isNaN(refDate.getTime())) {
      const diffTime = refDate.getTime() - dob.getTime();
      const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));
      if (diffDays >= 0) return diffDays;
    }
  }

  // 2. Parse from ageDesc string e.g. "16 Days", "5 Days", "6 Weeks (42 Days)", "2 Months"
  if (ageDesc) {
    const dayMatch = ageDesc.match(/(\d+)\s*(?:day|days|d|দিন)/i);
    if (dayMatch) {
      return parseInt(dayMatch[1], 10);
    }
    const wkMatch = ageDesc.match(/(\d+)\s*(?:week|weeks|wk|wks|সপ্তাহ)/i);
    if (wkMatch) {
      return parseInt(wkMatch[1], 10) * 7;
    }
    const moMatch = ageDesc.match(/(\d+)\s*(?:month|months|mo|mos|মাস)/i);
    if (moMatch) {
      return parseInt(moMatch[1], 10) * 30;
    }
  }

  // Default to early neonate (7 days) if undetermined
  return 7;
}

/**
 * Returns human-readable birth age criteria category with English and Bengali labels.
 */
export function getBirthAgeCriteriaCategory(ageInDays: number): {
  id: "EARLY_NEONATE" | "LATE_NEONATE" | "INFANT_6WK" | "INFANT_6MO";
  labelEn: string;
  labelBn: string;
  description: string;
} {
  if (ageInDays <= 14) {
    return {
      id: "EARLY_NEONATE",
      labelEn: `Early Neonatal Period (0 - 14 Days) • Current: ${ageInDays} Days`,
      labelBn: `প্রারম্ভিক নবজাতক পর্যায় (বয়স: ০ - ১৪ দিন) • বর্তমান: ${ageInDays} দিন`,
      description:
        "Primary clinical focus: BCG immunization within 14 days, umbilical cord stump natural drying, colostrum & exclusive breastfeeding, gentle lukewarm sponge bathing, and neonatal jaundice observation.",
    };
  }

  if (ageInDays <= 28) {
    return {
      id: "LATE_NEONATE",
      labelEn: `Late Neonatal Period (15 - 28 Days) • Current: ${ageInDays} Days`,
      labelBn: `উত্তর নবজাতক পর্যায় (বয়স: ১৫ - ২৮ দিন) • বর্তমান: ${ageInDays} দিন`,
      description:
        "Primary clinical focus: Exclusive breastfeeding, routine stool & urine monitoring, preparing for 1-month hearing test, and ROP retinopathy screening for premature/low birth weight infants.",
    };
  }

  if (ageInDays < 180) {
    const weeks = Math.round(ageInDays / 7);
    return {
      id: "INFANT_6WK",
      labelEn: `Young Infant / Immunization Period (1 - 6 Months) • Current: ~${weeks} Weeks (${ageInDays} Days)`,
      labelBn: `শিশু ও টিকা পর্যায় (বয়স: ১ - ৬ মাস) • বর্তমান: প্রায় ${weeks} সপ্তাহ (${ageInDays} দিন)`,
      description:
        "Primary clinical focus: EPI immunization starting at 6 weeks (1.5 months), 6-week infant neurological development assessment, hearing screening, and continued exclusive breastfeeding.",
    };
  }

  const months = Math.round(ageInDays / 30);
  return {
    id: "INFANT_6MO",
    labelEn: `Weaning Infant Period (≥ 6 Months) • Current: ~${months} Months`,
    labelBn: `পরিপূরক খাদ্য গ্রহণ পর্যায় (বয়স: ৬ মাস+) • বর্তমান: প্রায় ${months} মাস`,
    description:
      "Primary clinical focus: Timely introduction of safe, nutrient-dense soft and semi-solid complementary foods alongside continued on-demand breastfeeding.",
  };
}

/**
 * Evaluates which advices should be recommended based on patient's birth age in days
 * and optional clinical flags (like preterm or low birth weight).
 */
export function evaluatePatientAdvices(
  ageInDays: number,
  isPretermOrVLBW: boolean = false
): Array<NicuAdviceDefinition & { isRecommended: boolean; selected: boolean }> {
  return NICU_ADVICE_CATALOG.map((adv) => {
    let isRecommended = false;

    // Check age range
    if (adv.targetCriteria === "ALL_AGES") {
      isRecommended = true;
    } else if (adv.targetCriteria === "EARLY_NEONATE") {
      isRecommended = ageInDays <= 14;
    } else if (adv.targetCriteria === "NEONATE") {
      isRecommended = ageInDays <= 28 || (adv.adviceId === "A01" && ageInDays <= 180) || (adv.adviceId === "A02" && ageInDays <= 180);
    } else if (adv.targetCriteria === "INFANT_6WK") {
      // 6 weeks is around 42 days (e.g. 21 to 90 days)
      isRecommended = ageInDays >= 21 && ageInDays < 180;
    } else if (adv.targetCriteria === "INFANT_6MO") {
      isRecommended = ageInDays >= 180;
    } else if (adv.targetCriteria === "PRETERM_RISK") {
      isRecommended = isPretermOrVLBW || (ageInDays >= 20 && ageInDays <= 50);
    }

    return {
      ...adv,
      isRecommended,
      selected: isRecommended, // auto-select recommended advices by default
    };
  });
}
