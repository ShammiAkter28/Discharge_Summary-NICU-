export interface MedicationItem {
  id: string;
  name: string;
  dosage: string;
  frequency: string; // e.g. "TDS (Every 8 hours)", "OD (Once daily)"
  duration: string;  // e.g. "7 Days", "1 Month"
  instructions: string; // e.g. "After feed", "Before sleep"
  instructionsBn?: string; // Optional Bengali instructions
  strength?: string;
  uom?: string;
  quantity?: number;
}

export interface NicuAdviceItem {
  adviceId: string;
  adviceType: "G" | "D" | string;
  adviceEnglish: string;
  adviceBangla: string; // Unicode Bengali
  adviceBanglaRaw?: string; // Stored DB Bijoy
  minAgeDays?: number;
  maxAgeDays?: number;
  categoryLabelEn?: string;
  categoryLabelBn?: string;
  isRecommended?: boolean;
  selected?: boolean;
}

export interface DischargeSummary {
  id?: string;
  admissionId: string;
  regNo?: string;
  patientName: string;
  guardianName?: string;
  fatherName?: string;
  motherName?: string;
  dob?: string;
  calculatedAgeDays?: number;
  birthAgeCriteriaCategory?: string;
  age: string;
  gender: "Male" | "Female" | "Other";
  bloodGroup: string;
  bedNo: string;
  bedName?: string;
  wardName?: string;
  department: string;
  consultantName: string;
  admissionDate: string;
  dischargeDate: string;
  
  // Clinical
  primaryDiagnosis: string;
  secondaryDiagnosis?: string;
  birthWeight?: string;
  dischargeWeight?: string;
  ofcAdm?: number | string;
  ofcDc?: number | string;
  
  hospitalCourse: string;
  investigationSummary?: string;
  conditionAtDischarge: "Stable / Improved" | "Cured" | "Referred / Transferred" | "Discharged on Request (DORB)";
  
  // Feeding & Care
  feedingAdvice?: string;
  instructions: string;
  followUpDate?: string;
  emergencyContact?: string;
  
  // Medications (synced with IP_NICUPICUDISMEDICINE)
  medications: MedicationItem[];
  
  // Advices (synced with IP_NICUADVICE & IP_NICUADVICE_ASSIGN)
  advices?: NicuAdviceItem[];
  
  // Metadata
  createdAt?: string;
  updatedAt?: string;
}

export interface ApiResponse<T = any> {
  success: boolean;
  message?: string;
  data?: T;
  source?: "oracle" | "mock" | "fallback";
  error?: string;
  rowCount?: number;
}
