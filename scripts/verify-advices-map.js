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

// Accurate Bijoy 52 / SutonnyMJ converter for the 16 advices
const ADVICE_UNICODE_MAP = {
  "A01": "বাচ্চার জন্মের পর থেকে শাল দুধ খাওয়াতে শুরু করবেন এবং ৬ মাস পর্যন্ত শুধুমাত্র বুকের দুধ খাওয়াবেন।",
  "A02": "প্রতিবার দুধ খাওয়াবার পর ঢেকুর তুলবেন।",
  "A03": "৬ মাস পর থেকে মায়ের বুকের দুধের পাশাপাশি তরল ও নরম খাবার শুরু করবেন।",
  "A04": "বাচ্চার নাভীতে পরামর্শ ব্যতীত কোনো কিছু লাগানোর প্রয়োজন নেই। এটা নিজে থেকে পড়ে যাবে।",
  "A05": "প্রতিদিন বাচ্চাকে হালকা গরম পানিতে গা মোছাতে পারেন। নাভী পড়ে গেলে গোসল করাতে পারেন।",
  "A06": "১৪ দিন বয়সের মধ্যে বি.সি.জি টিকা দেবেন।",
  "A07": "দেড় মাস বয়স থেকে ই.পি.আই অনুযায়ী টিকা দেবেন।",
  "A08": "শিশুর শরীর আচমকা হলুদ হলে, সকাল ১১ টার মধ্যে ২০-৩০ মিনিটের জন্য রোদ দেখাবেন, জন্ডিস ভাল না হওয়া পর্যন্ত।",
  "A09": "মায়ের বুকের দুধ পান করা শিশুর পায়খানার রঙ একটু পাতলা, সবুজ অথবা হলুদ ইত্যাদি রোজ ৬/৭ বার হতে পারে। এতে চিন্তার কিছু নেই।",
  "A10": "এক থেকে দেড় মাসের মধ্যে হিয়ারিং টেস্ট করাবেন।",
  "A11": "কোনো সমস্যা হলে হাসপাতালের জরুরী বিভাগে যোগাযোগ করবেন।",
  "A12": "বাচ্চার বয়স.................দিন হলে আর.ও.পি স্ক্রীনিং করাবেন।",
  "A13": "৬ সপ্তাহ বয়সে নিউরোলজিক্যাল অ্যাসেসমেন্ট করাবেন ও টিকা দেবেন।",
  "A14": "নিয়মিত ঔষধ খাওয়াবেন।",
  "A15": "কোনো সমস্যা হলে অ্যাডভাইজার / চিকিৎসকের সাথে যোগাযোগ করবেন।",
  "A16": "আগামী ৭ দিন পর অ্যাডভাইজার / চিকিৎসকের সাথে চেম্বারে যোগাযোগ করবেন।"
};

async function testAdvices() {
  const conn = await oracledb.getConnection({
    user: process.env.ORACLE_USER,
    password: process.env.ORACLE_PASSWORD,
    connectString: process.env.ORACLE_CONNECT_STRING
  });

  const res = await conn.execute(
    `SELECT ADVICE_ID, ADVICE_BANGLA, ADVICE_ENGLISH, ADVICE_TYPE FROM ATI_REGI.IP_NICUADVICE ORDER BY ADVICE_ID`,
    [],
    { outFormat: oracledb.OUT_FORMAT_OBJECT }
  );

  console.log('Total advices:', res.rows.length);
  for (const r of res.rows) {
    console.log(`[${r.ADVICE_ID}] Type: ${r.ADVICE_TYPE}`);
    console.log(`  DB BN (Bijoy): ${r.ADVICE_BANGLA.trim()}`);
    console.log(`  Unicode BN   : ${ADVICE_UNICODE_MAP[r.ADVICE_ID]}`);
    console.log(`  EN           : ${r.ADVICE_ENGLISH}`);
  }

  await conn.close();
}

testAdvices().catch(console.error);
