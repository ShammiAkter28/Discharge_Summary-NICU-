"use client";

import React, { useState, useEffect, useMemo } from "react";
import {
  Printer,
  Save,
  Search,
  Plus,
  Trash2,
  FileText,
  Activity,
  Calendar,
  User,
  HeartPulse,
  Pill,
  AlertTriangle,
  CheckCircle2,
  Clock,
  RotateCcw,
  Sparkles,
  Database,
  Eye,
  Edit3,
  LogOut,
  Baby,
  ShieldCheck,
  CheckSquare,
  Square,
  HelpCircle,
  ExternalLink,
  Info,
} from "lucide-react";
import { DischargeSummary, MedicationItem, NicuAdviceItem } from "@/types/discharge";
import {
  calculateAgeInDays,
  getBirthAgeCriteriaCategory,
  evaluatePatientAdvices,
} from "@/lib/nicu-advice-criteria";

// Sample initial data representing a typical NICU case
const sampleInitialData: DischargeSummary = {
  admissionId: "NICU-2026-081",
  regNo: "REG-2026-0081",
  patientName: "Baby of Shammi Akhter",
  guardianName: "Shammi Akhter (Mother) / Md. Tarek (Father)",
  fatherName: "Md. Tarek",
  motherName: "Shammi Akhter",
  dob: "2026-11-01",
  calculatedAgeDays: 16,
  birthAgeCriteriaCategory: "উত্তর নবজাতক পর্যায় (বয়স: ১৫ - ২৮ দিন)",
  age: "33 Weeks Gestation (16 Days Old)",
  gender: "Female",
  bloodGroup: "B Positive (B+)",
  bedNo: "BED-NICU-03",
  bedName: "NICU Incubator #03 (Level 3)",
  wardName: "NICU-L3",
  department: "Department of Neonatology & Inpatient Pediatrics",
  consultantName: "Prof. Dr. A. K. M. Shamsuddin",
  admissionDate: "2026-11-01",
  dischargeDate: "2026-11-18",
  birthWeight: "1.45 kg",
  dischargeWeight: "1.82 kg",
  primaryDiagnosis:
    "Preterm (33+ weeks) with Very Low Birth Weight (VLBW) + Respiratory Distress Syndrome (RDS) - Resolved + Neonatal Hyperbilirubinemia",
  secondaryDiagnosis:
    "Suspected Neonatal Sepsis (Rule Out, CRP negative, Blood Culture sterile after 72 hrs)",
  hospitalCourse:
    "Baby was admitted with tachypnea, grunting, and chest in-drawing shortly after birth. Managed with bubble CPAP (PEEP 5 cmH2O) for 48 hours with subsequent weaning to room air. Received 72 hours of intensive phototherapy for indirect hyperbilirubinemia with total bilirubin reducing from 14.8 to 7.2 mg/dL. Trophic feeds started via OG tube and advanced to full oral feeds (EBM) with steady weight gain.",
  investigationSummary:
    "Hb: 14.2 g/dL, TC: 9,800/cu mm, Platelets: 210,000/cu mm, CRP: 2.1 mg/L (Normal), S. Bilirubin (Total): 7.2 mg/dL, Direct: 0.8 mg/dL, Blood Sugar: 84 mg/dL, Electrolytes: Normal, Blood Culture: No growth at 72 hours.",
  conditionAtDischarge: "Stable / Improved",
  feedingAdvice:
    "Exclusive Breast Feeding (EBF) or Expressed Breast Milk (EBM) 35-40 ml every 2 hours (12 feeds/day). Ensure gentle burping after each feed.",
  instructions:
    "1. Kangaroo Mother Care (KMC) for at least 4-6 hours daily to maintain warmth.\n2. Umbilical cord care: Keep dry and clean; do not apply unprescribed ointment.\n3. Emergency Danger Signs: Refusal to suck, lethargy, fever (>38°C) or hypothermia (<36.5°C), chest retractions, or recurrent vomiting - rush immediately to Hospital Emergency.",
  followUpDate: "2026-11-25",
  emergencyContact: "+880 1711-000000 / NICU Helpline Ext: 402",
  medications: [
    {
      id: "med-1",
      name: "Syrup Zinc Sulphate (20mg/5ml)",
      dosage: "2.5 ml (10 mg)",
      frequency: "OD (Once Daily)",
      duration: "14 Days",
      instructions: "Give in morning between feeds",
      instructionsBn: "সকালে খাওয়ার মাঝে খাওয়াবেন",
      strength: "20mg/5ml",
      uom: "ml",
      quantity: 1,
    },
    {
      id: "med-2",
      name: "Vitamin D3 Drops (400 IU/drop)",
      dosage: "1 drop (400 IU)",
      frequency: "OD (Once Daily)",
      duration: "6 Months",
      instructions: "Directly into baby's mouth before feed",
      instructionsBn: "খাওয়ানোর আগে সরাসরি মুখে ১ ফোঁটা",
      strength: "400 IU",
      uom: "drop",
      quantity: 1,
    },
    {
      id: "med-3",
      name: "Iron Polymaltose Complex Drops",
      dosage: "2 drops (3 mg)",
      frequency: "BD (Twice Daily)",
      duration: "3 Months",
      instructions: "Give after feed; do not mix with formula",
      instructionsBn: "খাওয়ানোর পর দেবেন",
      strength: "50mg/ml",
      uom: "drop",
      quantity: 1,
    },
  ],
  advices: evaluatePatientAdvices(16, true).map((a) => ({
    adviceId: a.adviceId,
    adviceType: a.adviceType,
    adviceEnglish: a.adviceEnglish,
    adviceBangla: a.adviceBanglaUnicode,
    adviceBanglaRaw: a.adviceBanglaBijoy,
    minAgeDays: a.minAgeDays,
    maxAgeDays: a.maxAgeDays,
    categoryLabelEn: a.categoryLabelEn,
    categoryLabelBn: a.categoryLabelBn,
    isRecommended: a.isRecommended,
    selected: a.selected,
  })),
};

export default function DischargeDashboard() {
  const [formData, setFormData] = useState<DischargeSummary>(sampleInitialData);
  const [viewMode, setViewMode] = useState<"edit" | "preview">("edit");
  const [loading, setLoading] = useState(false);
  const [searchAdmId, setSearchAdmId] = useState("");
  const [dbStatus, setDbStatus] = useState<"checking" | "online" | "offline">("checking");
  const [currentUser, setCurrentUser] = useState<{ username: string; role: string } | null>(null);
  const [statusMessage, setStatusMessage] = useState<{
    type: "success" | "error" | "info";
    text: string;
  } | null>(null);

  // Advice filtering state in Edit view
  const [adviceFilter, setAdviceFilter] = useState<"recommended" | "all" | "general" | "doctor">("recommended");

  // Calculate current patient birth age criteria dynamically
  const ageInDays = useMemo(() => {
    return calculateAgeInDays(formData.dob, formData.dischargeDate, formData.age);
  }, [formData.dob, formData.dischargeDate, formData.age]);

  const criteriaCategory = useMemo(() => {
    return getBirthAgeCriteriaCategory(ageInDays);
  }, [ageInDays]);

  // Check Oracle DB health & user session on mount
  useEffect(() => {
    async function checkHealthAndAuth() {
      try {
        const [healthRes, authRes] = await Promise.all([
          fetch("/api/discharge?action=health"),
          fetch("/api/auth/me"),
        ]);
        const healthJson = await healthRes.json();
        if (healthJson.connected) {
          setDbStatus("online");
        } else {
          setDbStatus("offline");
        }

        const authJson = await authRes.json();
        if (authJson.authenticated && authJson.user) {
          setCurrentUser(authJson.user);
        }
      } catch {
        setDbStatus("offline");
      }
    }
    checkHealthAndAuth();
  }, []);

  const handleLogout = async () => {
    try {
      await fetch("/api/auth/logout", { method: "POST" });
      window.location.href = "/login";
    } catch {
      window.location.href = "/login";
    }
  };

  // Handle Field Updates
  const handleInputChange = (
    e: React.ChangeEvent<
      HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement
    >
  ) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  // Re-evaluate advices based on updated birth age
  const handleRecalculateAdvicesForAge = () => {
    const isPreterm = Boolean(
      (formData.primaryDiagnosis && formData.primaryDiagnosis.toLowerCase().includes("preterm")) ||
      (formData.age && formData.age.toLowerCase().includes("preterm")) ||
      (formData.birthWeight && parseFloat(formData.birthWeight) < 2.0)
    );

    const evaluated = evaluatePatientAdvices(ageInDays, isPreterm);
    setFormData((prev) => ({
      ...prev,
      calculatedAgeDays: ageInDays,
      birthAgeCriteriaCategory: criteriaCategory.labelBn,
      advices: evaluated.map((a) => ({
        adviceId: a.adviceId,
        adviceType: a.adviceType,
        adviceEnglish: a.adviceEnglish,
        adviceBangla: a.adviceBanglaUnicode,
        adviceBanglaRaw: a.adviceBanglaBijoy,
        minAgeDays: a.minAgeDays,
        maxAgeDays: a.maxAgeDays,
        categoryLabelEn: a.categoryLabelEn,
        categoryLabelBn: a.categoryLabelBn,
        isRecommended: a.isRecommended,
        selected: a.selected,
      })),
    }));

    setStatusMessage({
      type: "info",
      text: `Auto-selected Bangla advices matching birth age criteria: ${criteriaCategory.labelBn} (${ageInDays} days old).`,
    });
  };

  // Medication handlers
  const handleMedChange = (
    index: number,
    field: keyof MedicationItem,
    value: string
  ) => {
    setFormData((prev) => {
      const updatedMeds = [...prev.medications];
      updatedMeds[index] = {
        ...updatedMeds[index],
        [field]: value,
      };
      return { ...prev, medications: updatedMeds };
    });
  };

  const addMedication = () => {
    setFormData((prev) => ({
      ...prev,
      medications: [
        ...prev.medications,
        {
          id: `MED-00${prev.medications.length + 1}`,
          name: "",
          dosage: "",
          frequency: "OD (Once Daily)",
          duration: "7 Days",
          instructions: "",
          instructionsBn: "",
          strength: "",
          uom: "ml",
          quantity: 1,
        },
      ],
    }));
  };

  const removeMedication = (index: number) => {
    setFormData((prev) => ({
      ...prev,
      medications: prev.medications.filter((_, idx) => idx !== index),
    }));
  };

  // Advice handlers
  const toggleAdviceSelection = (adviceId: string) => {
    setFormData((prev) => {
      const currentAdvices = prev.advices || [];
      const updated = currentAdvices.map((adv) => {
        if (adv.adviceId === adviceId) {
          return { ...adv, selected: !adv.selected };
        }
        return adv;
      });
      return { ...prev, advices: updated };
    });
  };

  const selectAllAdvices = (onlyRecommended = false) => {
    setFormData((prev) => {
      const currentAdvices = prev.advices || [];
      const updated = currentAdvices.map((adv) => ({
        ...adv,
        selected: onlyRecommended ? !!adv.isRecommended : true,
      }));
      return { ...prev, advices: updated };
    });
  };

  const deselectAllAdvices = () => {
    setFormData((prev) => {
      const currentAdvices = prev.advices || [];
      const updated = currentAdvices.map((adv) => ({
        ...adv,
        selected: false,
      }));
      return { ...prev, advices: updated };
    });
  };

  // Search & Fetch Record from Oracle API
  const handleSearchFromOracle = async (admissionIdToSearch?: string) => {
    const admId = (admissionIdToSearch || searchAdmId).trim();
    if (!admId) {
      setStatusMessage({
        type: "error",
        text: "Please enter an Admission ID to search.",
      });
      return;
    }

    setLoading(true);
    setStatusMessage(null);

    try {
      const res = await fetch(
        `/api/discharge?admissionId=${encodeURIComponent(admId)}`
      );
      const json = await res.json();

      if (json.success && json.data) {
        setFormData(json.data);
        setStatusMessage({
          type: "success",
          text: `Loaded admission record #${admId} joining OP_REGISTRATION, IP_ADMISSION, IP_BED, IP_NICUPICUDISCHARGE, IP_NICUPICUDISMEDICINE & IP_NICUADVICE!`,
        });
      } else {
        setStatusMessage({
          type: "error",
          text: json.message || "Record not found in Oracle Database.",
        });
      }
    } catch (err: any) {
      setStatusMessage({
        type: "error",
        text: `Error fetching from database: ${err.message}`,
      });
    } finally {
      setLoading(false);
    }
  };

  // Save to Oracle DB across defined tables
  const handleSaveToOracle = async () => {
    setLoading(true);
    setStatusMessage(null);

    try {
      const res = await fetch("/api/discharge", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData),
      });

      const json = await res.json();

      if (json.success) {
        setStatusMessage({
          type: "success",
          text:
            json.message ||
            `Discharge records for #${formData.admissionId} successfully committed to Oracle tables!`,
        });
      } else {
        setStatusMessage({
          type: "error",
          text: json.error || "Failed to commit records to Oracle DB.",
        });
      }
    } catch (err: any) {
      setStatusMessage({
        type: "error",
        text: `Network / Server error: ${err.message}`,
      });
    } finally {
      setLoading(false);
    }
  };

  // Filtered Advices for Display in Edit Mode
  const displayedAdvices = useMemo(() => {
    const list = formData.advices || [];
    if (adviceFilter === "recommended") {
      return list.filter((a) => a.isRecommended);
    }
    if (adviceFilter === "general") {
      return list.filter((a) => a.adviceType === "G");
    }
    if (adviceFilter === "doctor") {
      return list.filter((a) => a.adviceType === "D");
    }
    return list;
  }, [formData.advices, adviceFilter]);

  // Selected Advices for Print Preview / Summary Report
  const selectedAdvicesForReport = useMemo(() => {
    return (formData.advices || []).filter((a) => a.selected);
  }, [formData.advices]);

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 flex flex-col font-sans antialiased">
      {/* Top Application Bar (Hidden in Print) */}
      <header className="no-print bg-slate-900 border-b border-slate-800 text-white sticky top-0 z-50 shadow-md">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-sky-500 to-indigo-600 flex items-center justify-center shadow-lg shadow-sky-500/20">
              <Baby className="w-6 h-6 text-white" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="font-bold text-base tracking-tight text-white">
                  Inpatient EMR
                </span>
                <span className="px-2 py-0.5 text-[10px] uppercase font-bold tracking-wider bg-sky-500/20 text-sky-300 rounded border border-sky-400/30">
                  NICU / PICU
                </span>
              </div>
              <p className="text-xs text-slate-400 hidden sm:block">
                Discharge Summary (NICU) &amp; Birth Age Bangla Advice Module
              </p>
            </div>
          </div>

          {/* Center: DB Status & Active Tables Indicator */}
          <div className="hidden md:flex items-center gap-2 text-xs bg-slate-800/80 px-3 py-1.5 rounded-full border border-slate-700">
            <span className="flex items-center gap-1.5 font-medium">
              <Database className="w-3.5 h-3.5 text-sky-400" />
              <span>Oracle 12c:</span>
            </span>
            {dbStatus === "online" ? (
              <span className="inline-flex items-center gap-1 text-emerald-400 font-semibold">
                <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span>
                Connected (7 Tables Active)
              </span>
            ) : dbStatus === "offline" ? (
              <span className="inline-flex items-center gap-1 text-rose-400 font-semibold">
                <span className="w-2 h-2 rounded-full bg-rose-400"></span>
                Disconnected
              </span>
            ) : (
              <span className="inline-flex items-center gap-1 text-amber-400 font-semibold">
                <span className="w-2 h-2 rounded-full bg-amber-400 animate-ping"></span>
                Checking...
              </span>
            )}
          </div>

          {/* Right Action Buttons */}
          <div className="flex items-center gap-3">
            {currentUser && (
              <div className="hidden lg:flex items-center gap-2 text-xs text-slate-300 border-r border-slate-700 pr-3">
                <User className="w-3.5 h-3.5 text-slate-400" />
                <span className="font-semibold text-white">{currentUser.username}</span>
                <span className="text-[10px] uppercase bg-slate-800 px-1.5 py-0.5 rounded text-slate-400">
                  {currentUser.role}
                </span>
              </div>
            )}

            <button
              type="button"
              onClick={() => setViewMode(viewMode === "edit" ? "preview" : "edit")}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                viewMode === "preview"
                  ? "bg-sky-600 text-white shadow-md shadow-sky-600/30"
                  : "bg-slate-800 text-slate-200 hover:bg-slate-700 border border-slate-700"
              }`}
            >
              {viewMode === "edit" ? (
                <>
                  <Eye className="w-3.5 h-3.5" />
                  <span>Preview Discharge Summary (NICU)</span>
                </>
              ) : (
                <>
                  <Edit3 className="w-3.5 h-3.5" />
                  <span>Edit Discharge Form</span>
                </>
              )}
            </button>

            {viewMode === "preview" && (
              <button
                type="button"
                onClick={handlePrint}
                className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg text-xs font-semibold bg-emerald-600 hover:bg-emerald-500 text-white shadow-sm transition-all"
              >
                <Printer className="w-3.5 h-3.5" />
                <span>Print Document</span>
              </button>
            )}

            <button
              type="button"
              onClick={handleSaveToOracle}
              disabled={loading}
              className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg text-xs font-semibold bg-gradient-to-r from-sky-600 to-indigo-600 hover:from-sky-500 hover:to-indigo-500 text-white shadow-md shadow-sky-600/20 disabled:opacity-50 transition-all"
            >
              <Save className="w-3.5 h-3.5" />
              <span>{loading ? "Saving..." : "Save to Oracle"}</span>
            </button>

            <button
              type="button"
              onClick={handleLogout}
              className="p-1.5 text-slate-400 hover:text-white hover:bg-slate-800 rounded-lg"
              title="Sign Out"
            >
              <LogOut className="w-4 h-4" />
            </button>
          </div>
        </div>
      </header>

      {/* Main Container */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 flex-1 w-full">
        {/* Status Alert Notification */}
        {statusMessage && (
          <div
            className={`no-print mb-6 p-4 rounded-xl text-sm flex items-start justify-between border shadow-sm transition-all ${
              statusMessage.type === "success"
                ? "bg-emerald-50 text-emerald-900 border-emerald-200"
                : statusMessage.type === "error"
                ? "bg-rose-50 text-rose-900 border-rose-200"
                : "bg-sky-50 text-sky-900 border-sky-200"
            }`}
          >
            <div className="flex items-start gap-3">
              {statusMessage.type === "success" ? (
                <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0 mt-0.5" />
              ) : statusMessage.type === "error" ? (
                <AlertTriangle className="w-5 h-5 text-rose-600 shrink-0 mt-0.5" />
              ) : (
                <Info className="w-5 h-5 text-sky-600 shrink-0 mt-0.5" />
              )}
              <span className="font-medium leading-relaxed">{statusMessage.text}</span>
            </div>
            <button
              onClick={() => setStatusMessage(null)}
              className="text-slate-400 hover:text-slate-600 text-lg leading-none font-bold ml-4"
            >
              ×
            </button>
          </div>
        )}

        {/* Search & Defined Tables Bar (Hidden in Print) */}
        <section className="no-print bg-white rounded-2xl border border-slate-200 shadow-sm p-4 mb-6">
          <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
            {/* Search Input */}
            <div className="flex items-center gap-2 max-w-md w-full">
              <div className="relative flex-1">
                <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  placeholder="Enter Admission No (e.g. NICU-2026-081)..."
                  value={searchAdmId}
                  onChange={(e) => setSearchAdmId(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && handleSearchFromOracle()}
                  className="w-full pl-9 pr-3 py-2 text-xs rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-sky-500 font-mono"
                />
              </div>
              <button
                type="button"
                onClick={() => handleSearchFromOracle()}
                disabled={loading}
                className="px-4 py-2 bg-slate-900 hover:bg-slate-800 text-white rounded-xl text-xs font-semibold shadow-sm transition-all shrink-0"
              >
                Fetch Admission
              </button>
            </div>

            {/* Quick Selectors for Test Admissions with different birth ages */}
            <div className="flex flex-wrap items-center gap-2 text-xs">
              <span className="text-slate-500 font-semibold">Quick Test Patients:</span>
              <button
                type="button"
                onClick={() => {
                  setSearchAdmId("NICU-2026-081");
                  handleSearchFromOracle("NICU-2026-081");
                }}
                className="px-2.5 py-1 rounded-lg bg-sky-50 text-sky-800 border border-sky-200 hover:bg-sky-100 font-mono text-[11px] font-semibold"
                title="16 Days Old - Preterm VLBW"
              >
                NICU-2026-081 (16d • Preterm)
              </button>
              <button
                type="button"
                onClick={() => {
                  setSearchAdmId("NICU-2026-082");
                  handleSearchFromOracle("NICU-2026-082");
                }}
                className="px-2.5 py-1 rounded-lg bg-emerald-50 text-emerald-800 border border-emerald-200 hover:bg-emerald-100 font-mono text-[11px] font-semibold"
                title="5 Days Old - BCG Vaccine criteria"
              >
                NICU-2026-082 (5d • BCG Criteria)
              </button>
              <button
                type="button"
                onClick={() => {
                  setSearchAdmId("NICU-2026-083");
                  handleSearchFromOracle("NICU-2026-083");
                }}
                className="px-2.5 py-1 rounded-lg bg-indigo-50 text-indigo-800 border border-indigo-200 hover:bg-indigo-100 font-mono text-[11px] font-semibold"
                title="6 Weeks Old - EPI Vaccine & Neuro assessment criteria"
              >
                NICU-2026-083 (6wk • EPI Criteria)
              </button>
            </div>
          </div>

          {/* Defined Tables Badge Strip */}
          <div className="mt-3 pt-3 border-t border-slate-100 flex flex-wrap items-center gap-2 text-[11px] text-slate-500">
            <span className="font-semibold text-slate-700">Active Tables:</span>
            {[
              "OP_REGISTRATION",
              "IP_ADMISSION",
              "IP_BED",
              "IP_NICUPICUDISCHARGE",
              "IP_NICUPICUDISMEDICINE",
              "IP_NICUADVICE",
              "IP_NICUADVICE_ASSIGN",
            ].map((t) => (
              <span
                key={t}
                className="px-2 py-0.5 rounded bg-slate-100 text-slate-700 font-mono border border-slate-200"
              >
                {t}
              </span>
            ))}
          </div>
        </section>

        {/* View Mode Switching: EDIT FORM vs PRINT PREVIEW */}
        {viewMode === "edit" ? (
          /* ============================================================== */
          /*                       EDIT DISCHARGE FORM                      */
          /* ============================================================== */
          <div className="space-y-6">
            {/* Section 1: Patient Demographics & Birth Age Criteria Banner */}
            <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
              <div className="bg-gradient-to-r from-sky-500 to-indigo-600 px-6 py-4 text-white flex flex-col md:flex-row md:items-center md:justify-between gap-3">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-white/10 rounded-xl backdrop-blur-sm">
                    <Baby className="w-5 h-5 text-white" />
                  </div>
                  <div>
                    <h2 className="text-base font-bold">
                      Patient Demographics & Birth Age Criteria
                    </h2>
                    <p className="text-xs text-sky-100">
                      Joined from <code className="font-mono">OP_REGISTRATION</code>,{" "}
                      <code className="font-mono">IP_ADMISSION</code> &amp;{" "}
                      <code className="font-mono">IP_BED</code>
                    </p>
                  </div>
                </div>

                {/* Birth Age Criteria Tag */}
                <div className="bg-white/20 backdrop-blur-md px-3.5 py-1.5 rounded-xl border border-white/30 text-xs font-semibold flex items-center gap-2">
                  <Clock className="w-4 h-4 text-amber-200" />
                  <span>
                    বয়স পর্যায়: {criteriaCategory.labelBn}
                  </span>
                </div>
              </div>

              <div className="p-6">
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 text-xs">
                  <div>
                    <label className="block font-semibold text-slate-700 mb-1">
                      Admission No (IP_ADMISSION) *
                    </label>
                    <input
                      type="text"
                      name="admissionId"
                      value={formData.admissionId}
                      onChange={handleInputChange}
                      className="w-full px-3 py-2 rounded-xl border border-slate-300 focus:ring-2 focus:ring-sky-500 font-mono font-bold text-slate-900 bg-slate-50"
                      required
                    />
                  </div>

                  <div>
                    <label className="block font-semibold text-slate-700 mb-1">
                      Registration No (OP_REGISTRATION)
                    </label>
                    <input
                      type="text"
                      name="regNo"
                      value={formData.regNo || ""}
                      onChange={handleInputChange}
                      placeholder="e.g. REG-2026-0081"
                      className="w-full px-3 py-2 rounded-xl border border-slate-300 focus:ring-2 focus:ring-sky-500 font-mono text-slate-800"
                    />
                  </div>

                  <div>
                    <label className="block font-semibold text-slate-700 mb-1">
                      Patient / Baby Name *
                    </label>
                    <input
                      type="text"
                      name="patientName"
                      value={formData.patientName}
                      onChange={handleInputChange}
                      className="w-full px-3 py-2 rounded-xl border border-slate-300 focus:ring-2 focus:ring-sky-500 font-semibold text-slate-900"
                      required
                    />
                  </div>

                  <div>
                    <label className="block font-semibold text-slate-700 mb-1">
                      Date of Birth (DOB)
                    </label>
                    <input
                      type="date"
                      name="dob"
                      value={formData.dob || ""}
                      onChange={handleInputChange}
                      className="w-full px-3 py-2 rounded-xl border border-slate-300 focus:ring-2 focus:ring-sky-500 font-medium text-slate-900"
                    />
                  </div>

                  <div>
                    <label className="block font-semibold text-slate-700 mb-1">
                      Mother&apos;s Name (MNAME)
                    </label>
                    <input
                      type="text"
                      name="motherName"
                      value={formData.motherName || ""}
                      onChange={handleInputChange}
                      placeholder="e.g. Shammi Akhter"
                      className="w-full px-3 py-2 rounded-xl border border-slate-300 focus:ring-2 focus:ring-sky-500 text-slate-800"
                    />
                  </div>

                  <div>
                    <label className="block font-semibold text-slate-700 mb-1">
                      Father&apos;s Name (FNAME)
                    </label>
                    <input
                      type="text"
                      name="fatherName"
                      value={formData.fatherName || ""}
                      onChange={handleInputChange}
                      placeholder="e.g. Md. Tarek"
                      className="w-full px-3 py-2 rounded-xl border border-slate-300 focus:ring-2 focus:ring-sky-500 text-slate-800"
                    />
                  </div>

                  <div>
                    <label className="block font-semibold text-slate-700 mb-1">
                      Age / Gestation Describe (PAT_AGEDESCRIBE)
                    </label>
                    <div className="flex gap-1.5">
                      <input
                        type="text"
                        name="age"
                        value={formData.age}
                        onChange={handleInputChange}
                        placeholder="e.g. 16 Days / 33 Weeks"
                        className="w-full px-3 py-2 rounded-xl border border-slate-300 focus:ring-2 focus:ring-sky-500 text-slate-800"
                      />
                      <button
                        type="button"
                        onClick={handleRecalculateAdvicesForAge}
                        className="px-2.5 py-1.5 bg-sky-100 text-sky-800 hover:bg-sky-200 rounded-lg text-[11px] font-bold shrink-0"
                        title="Recalculate advices based on this age"
                      >
                        Sync Age
                      </button>
                    </div>
                  </div>

                  <div>
                    <label className="block font-semibold text-slate-700 mb-1">
                      Gender
                    </label>
                    <select
                      name="gender"
                      value={formData.gender}
                      onChange={handleInputChange}
                      className="w-full px-3 py-2 rounded-xl border border-slate-300 focus:ring-2 focus:ring-sky-500 text-slate-800 bg-white"
                    >
                      <option value="Male">Male (M)</option>
                      <option value="Female">Female (F)</option>
                      <option value="Other">Other</option>
                    </select>
                  </div>

                  <div>
                    <label className="block font-semibold text-slate-700 mb-1">
                      Blood Group
                    </label>
                    <input
                      type="text"
                      name="bloodGroup"
                      value={formData.bloodGroup}
                      onChange={handleInputChange}
                      className="w-full px-3 py-2 rounded-xl border border-slate-300 focus:ring-2 focus:ring-sky-500 text-slate-800"
                    />
                  </div>

                  <div>
                    <label className="block font-semibold text-slate-700 mb-1">
                      Bed / Incubator (IP_BED)
                    </label>
                    <input
                      type="text"
                      name="bedNo"
                      value={formData.bedNo}
                      onChange={handleInputChange}
                      className="w-full px-3 py-2 rounded-xl border border-slate-300 focus:ring-2 focus:ring-sky-500 text-slate-800"
                    />
                  </div>

                  <div>
                    <label className="block font-semibold text-slate-700 mb-1">
                      Admission Date
                    </label>
                    <input
                      type="date"
                      name="admissionDate"
                      value={formData.admissionDate}
                      onChange={handleInputChange}
                      className="w-full px-3 py-2 rounded-xl border border-slate-300 focus:ring-2 focus:ring-sky-500 text-slate-800"
                    />
                  </div>

                  <div>
                    <label className="block font-semibold text-slate-700 mb-1">
                      Discharge Date
                    </label>
                    <input
                      type="date"
                      name="dischargeDate"
                      value={formData.dischargeDate}
                      onChange={handleInputChange}
                      className="w-full px-3 py-2 rounded-xl border border-slate-300 focus:ring-2 focus:ring-sky-500 text-slate-800 font-semibold"
                    />
                  </div>
                </div>
              </div>
            </div>

            {/* Section 2: Clinical Details & Physical Measurements */}
            <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6 space-y-4">
              <h3 className="text-sm font-bold text-slate-900 uppercase tracking-wider flex items-center gap-2 border-b border-slate-100 pb-3">
                <HeartPulse className="w-4 h-4 text-rose-500" />
                <span>Clinical Diagnoses & Neonatal Measurements (IP_NICUPICUDISCHARGE)</span>
              </h3>

              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 text-xs">
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">
                    Birth Weight (kg)
                  </label>
                  <input
                    type="text"
                    name="birthWeight"
                    value={formData.birthWeight || ""}
                    onChange={handleInputChange}
                    placeholder="e.g. 1.45 kg"
                    className="w-full px-3 py-2 rounded-xl border border-slate-300 focus:ring-2 focus:ring-sky-500 text-slate-800"
                  />
                </div>

                <div>
                  <label className="block font-semibold text-slate-700 mb-1">
                    Discharge Weight (kg)
                  </label>
                  <input
                    type="text"
                    name="dischargeWeight"
                    value={formData.dischargeWeight || ""}
                    onChange={handleInputChange}
                    placeholder="e.g. 1.82 kg"
                    className="w-full px-3 py-2 rounded-xl border border-slate-300 focus:ring-2 focus:ring-sky-500 text-slate-800 font-bold text-emerald-700"
                  />
                </div>

                <div>
                  <label className="block font-semibold text-slate-700 mb-1">
                    Condition at Discharge
                  </label>
                  <select
                    name="conditionAtDischarge"
                    value={formData.conditionAtDischarge}
                    onChange={handleInputChange}
                    className="w-full px-3 py-2 rounded-xl border border-slate-300 focus:ring-2 focus:ring-sky-500 text-slate-800 bg-white"
                  >
                    <option value="Stable / Improved">Stable / Improved</option>
                    <option value="Cured">Cured</option>
                    <option value="Referred / Transferred">Referred / Transferred</option>
                    <option value="Discharged on Request (DORB)">Discharged on Request (DORB)</option>
                  </select>
                </div>

                <div>
                  <label className="block font-semibold text-slate-700 mb-1">
                    Attending Consultant
                  </label>
                  <input
                    type="text"
                    name="consultantName"
                    value={formData.consultantName}
                    onChange={handleInputChange}
                    className="w-full px-3 py-2 rounded-xl border border-slate-300 focus:ring-2 focus:ring-sky-500 text-slate-800 font-medium"
                  />
                </div>

                <div className="sm:col-span-2">
                  <label className="block font-semibold text-slate-700 mb-1">
                    Primary Diagnosis *
                  </label>
                  <textarea
                    rows={2}
                    name="primaryDiagnosis"
                    value={formData.primaryDiagnosis}
                    onChange={handleInputChange}
                    className="w-full px-3 py-2 rounded-xl border border-slate-300 focus:ring-2 focus:ring-sky-500 text-slate-800 font-medium"
                    required
                  />
                </div>

                <div className="sm:col-span-2">
                  <label className="block font-semibold text-slate-700 mb-1">
                    Secondary Diagnoses / Case Summary
                  </label>
                  <textarea
                    rows={2}
                    name="secondaryDiagnosis"
                    value={formData.secondaryDiagnosis || ""}
                    onChange={handleInputChange}
                    className="w-full px-3 py-2 rounded-xl border border-slate-300 focus:ring-2 focus:ring-sky-500 text-slate-800"
                  />
                </div>

                <div className="sm:col-span-2">
                  <label className="block font-semibold text-slate-700 mb-1">
                    Hospital Course & Management
                  </label>
                  <textarea
                    rows={3}
                    name="hospitalCourse"
                    value={formData.hospitalCourse}
                    onChange={handleInputChange}
                    className="w-full px-3 py-2 rounded-xl border border-slate-300 focus:ring-2 focus:ring-sky-500 text-slate-800"
                  />
                </div>

                <div className="sm:col-span-2">
                  <label className="block font-semibold text-slate-700 mb-1">
                    Investigation Summary (Lab & Imaging)
                  </label>
                  <textarea
                    rows={3}
                    name="investigationSummary"
                    value={formData.investigationSummary || ""}
                    onChange={handleInputChange}
                    className="w-full px-3 py-2 rounded-xl border border-slate-300 focus:ring-2 focus:ring-sky-500 font-mono text-[11px] text-slate-800"
                  />
                </div>
              </div>
            </div>

            {/* ⭐ Section 3: BANGLA ADVICE ENGINE (IP_NICUADVICE & IP_NICUADVICE_ASSIGN) */}
            <div className="bg-white rounded-2xl border-2 border-indigo-200 shadow-md overflow-hidden">
              <div className="bg-gradient-to-r from-indigo-900 via-indigo-800 to-slate-900 px-6 py-4 text-white flex flex-col md:flex-row md:items-center md:justify-between gap-3">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-indigo-500/30 rounded-xl border border-indigo-400/30">
                    <Sparkles className="w-5 h-5 text-indigo-300" />
                  </div>
                  <div>
                    <h2 className="text-base font-bold flex items-center gap-2">
                      <span>বাংলা উপদেশ ও স্বাস্থ্য পরামর্শ (IP_NICUADVICE & IP_NICUADVICE_ASSIGN)</span>
                      <span className="bg-amber-400 text-slate-900 text-[10px] font-black px-2 py-0.5 rounded uppercase tracking-wider">
                        Birth Age Criteria
                      </span>
                    </h2>
                    <p className="text-xs text-indigo-200">
                      Showing Bangla advice to patient summary report according to patient birth age criteria ({ageInDays} days old)
                    </p>
                  </div>
                </div>

                {/* Filter & Action Buttons */}
                <div className="flex flex-wrap items-center gap-2 text-xs">
                  <button
                    type="button"
                    onClick={() => selectAllAdvices(true)}
                    className="px-3 py-1 bg-indigo-700 hover:bg-indigo-600 rounded-lg text-white font-semibold transition"
                  >
                    Select All Recommended
                  </button>
                  <button
                    type="button"
                    onClick={() => selectAllAdvices(false)}
                    className="px-2.5 py-1 bg-white/10 hover:bg-white/20 rounded-lg text-indigo-100 transition"
                  >
                    Select All
                  </button>
                  <button
                    type="button"
                    onClick={deselectAllAdvices}
                    className="px-2.5 py-1 bg-white/10 hover:bg-white/20 rounded-lg text-indigo-100 transition"
                  >
                    Clear All
                  </button>
                </div>
              </div>

              {/* Filter tabs & Category summary banner */}
              <div className="bg-indigo-50/70 border-b border-indigo-100 px-6 py-3 flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-xs">
                <div className="flex items-center gap-2">
                  <span className="font-bold text-indigo-950">Filter Advices:</span>
                  <div className="flex rounded-lg bg-indigo-200/50 p-0.5">
                    <button
                      type="button"
                      onClick={() => setAdviceFilter("recommended")}
                      className={`px-3 py-1 rounded-md font-semibold transition ${
                        adviceFilter === "recommended"
                          ? "bg-white text-indigo-950 shadow-sm"
                          : "text-indigo-800 hover:text-indigo-950"
                      }`}
                    >
                      ⭐ Recommended for Age ({criteriaCategory.labelBn})
                    </button>
                    <button
                      type="button"
                      onClick={() => setAdviceFilter("all")}
                      className={`px-3 py-1 rounded-md font-semibold transition ${
                        adviceFilter === "all"
                          ? "bg-white text-indigo-950 shadow-sm"
                          : "text-indigo-800 hover:text-indigo-950"
                      }`}
                    >
                      All 16 Advices
                    </button>
                    <button
                      type="button"
                      onClick={() => setAdviceFilter("general")}
                      className={`px-3 py-1 rounded-md font-semibold transition ${
                        adviceFilter === "general"
                          ? "bg-white text-indigo-950 shadow-sm"
                          : "text-indigo-800 hover:text-indigo-950"
                      }`}
                    >
                      General Care (G)
                    </button>
                    <button
                      type="button"
                      onClick={() => setAdviceFilter("doctor")}
                      className={`px-3 py-1 rounded-md font-semibold transition ${
                        adviceFilter === "doctor"
                          ? "bg-white text-indigo-950 shadow-sm"
                          : "text-indigo-800 hover:text-indigo-950"
                      }`}
                    >
                      Discharge &amp; Follow-up (D)
                    </button>
                  </div>
                </div>

                <div className="text-right text-[11px] text-indigo-800 font-medium">
                  Selected for Report:{" "}
                  <strong className="text-indigo-950 font-bold">
                    {selectedAdvicesForReport.length} of {formData.advices?.length || 0}
                  </strong>
                </div>
              </div>

              {/* Advice Cards Grid */}
              <div className="p-6 grid grid-cols-1 md:grid-cols-2 gap-4">
                {displayedAdvices.map((adv) => (
                  <div
                    key={adv.adviceId}
                    onClick={() => toggleAdviceSelection(adv.adviceId)}
                    className={`cursor-pointer rounded-xl border p-4 transition-all flex items-start gap-3 select-none ${
                      adv.selected
                        ? "bg-indigo-50/50 border-indigo-400 shadow-sm ring-1 ring-indigo-300"
                        : "bg-white border-slate-200 hover:border-slate-300 hover:bg-slate-50/50 opacity-80"
                    }`}
                  >
                    <div className="pt-0.5 text-indigo-600 shrink-0">
                      {adv.selected ? (
                        <CheckSquare className="w-5 h-5 text-indigo-600" />
                      ) : (
                        <Square className="w-5 h-5 text-slate-300" />
                      )}
                    </div>

                    <div className="flex-1 space-y-1.5">
                      <div className="flex items-center justify-between gap-2 flex-wrap">
                        <div className="flex items-center gap-1.5">
                          <span className="font-mono text-xs font-bold px-1.5 py-0.5 rounded bg-indigo-100 text-indigo-800 border border-indigo-200">
                            {adv.adviceId}
                          </span>
                          <span className="text-[11px] font-bold text-slate-700">
                            {adv.categoryLabelBn || adv.categoryLabelEn}
                          </span>
                        </div>

                        {adv.isRecommended && (
                          <span className="bg-emerald-100 text-emerald-800 text-[10px] font-bold px-2 py-0.5 rounded-full border border-emerald-300 flex items-center gap-1">
                            <span>⭐</span>
                            <span>বয়স উপযোগী</span>
                          </span>
                        )}
                      </div>

                      {/* Unicode Bangla Advice Text */}
                      <p className="text-sm font-semibold text-slate-900 leading-snug">
                        {adv.adviceBangla}
                      </p>

                      {/* English Advice Text */}
                      <p className="text-xs text-slate-500 leading-relaxed font-sans">
                        {adv.adviceEnglish}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Section 4: Prescribed Discharge Medications (IP_NICUPICUDISMEDICINE) */}
            <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6 space-y-4">
              <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                <h3 className="text-sm font-bold text-slate-900 uppercase tracking-wider flex items-center gap-2">
                  <Pill className="w-4 h-4 text-emerald-600" />
                  <span>Discharge Medications (IP_NICUPICUDISMEDICINE)</span>
                </h3>
                <button
                  type="button"
                  onClick={addMedication}
                  className="flex items-center gap-1 px-3 py-1.5 rounded-xl bg-emerald-50 text-emerald-700 hover:bg-emerald-100 font-semibold text-xs border border-emerald-200"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>Add Medicine</span>
                </button>
              </div>

              {formData.medications.length === 0 ? (
                <div className="text-center py-6 text-slate-400 text-xs">
                  No discharge medications prescribed. Click &quot;Add Medicine&quot; above.
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-xs">
                    <thead>
                      <tr className="border-b border-slate-200 text-slate-500 font-semibold bg-slate-50/50">
                        <th className="py-2.5 px-3">#</th>
                        <th className="py-2.5 px-3 min-w-[200px]">Medicine &amp; Strength</th>
                        <th className="py-2.5 px-3 min-w-[120px]">Dosage</th>
                        <th className="py-2.5 px-3 min-w-[140px]">Frequency</th>
                        <th className="py-2.5 px-3 min-w-[100px]">Duration</th>
                        <th className="py-2.5 px-3 min-w-[180px]">Instructions (EN / BN)</th>
                        <th className="py-2.5 px-3 text-right">Action</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {formData.medications.map((med, index) => (
                        <tr key={med.id || index} className="hover:bg-slate-50/50">
                          <td className="py-2 px-3 font-mono text-slate-400">{index + 1}</td>
                          <td className="py-2 px-3">
                            <input
                              type="text"
                              value={med.name}
                              onChange={(e) => handleMedChange(index, "name", e.target.value)}
                              placeholder="e.g. Syrup Zinc Sulphate"
                              className="w-full px-2.5 py-1.5 rounded-lg border border-slate-200 text-slate-900 font-medium text-xs focus:ring-1 focus:ring-sky-500"
                            />
                          </td>
                          <td className="py-2 px-3">
                            <input
                              type="text"
                              value={med.dosage}
                              onChange={(e) => handleMedChange(index, "dosage", e.target.value)}
                              placeholder="e.g. 2.5 ml"
                              className="w-full px-2.5 py-1.5 rounded-lg border border-slate-200 text-slate-800 text-xs"
                            />
                          </td>
                          <td className="py-2 px-3">
                            <input
                              type="text"
                              value={med.frequency}
                              onChange={(e) => handleMedChange(index, "frequency", e.target.value)}
                              placeholder="e.g. OD / BD / TDS"
                              className="w-full px-2.5 py-1.5 rounded-lg border border-slate-200 text-slate-800 text-xs"
                            />
                          </td>
                          <td className="py-2 px-3">
                            <input
                              type="text"
                              value={med.duration}
                              onChange={(e) => handleMedChange(index, "duration", e.target.value)}
                              placeholder="e.g. 14 Days"
                              className="w-full px-2.5 py-1.5 rounded-lg border border-slate-200 text-slate-800 text-xs"
                            />
                          </td>
                          <td className="py-2 px-3">
                            <input
                              type="text"
                              value={med.instructions}
                              onChange={(e) => handleMedChange(index, "instructions", e.target.value)}
                              placeholder="e.g. After feeds (সকালে খাওয়ার মাঝে)"
                              className="w-full px-2.5 py-1.5 rounded-lg border border-slate-200 text-slate-800 text-xs"
                            />
                          </td>
                          <td className="py-2 px-3 text-right">
                            <button
                              type="button"
                              onClick={() => removeMedication(index)}
                              className="p-1.5 text-rose-500 hover:text-rose-700 hover:bg-rose-50 rounded-lg"
                              title="Delete row"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>

            {/* Section 5: Feeding, Follow-up & Emergency Notes */}
            <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6 space-y-4">
              <h3 className="text-sm font-bold text-slate-900 uppercase tracking-wider flex items-center gap-2 border-b border-slate-100 pb-3">
                <AlertTriangle className="w-4 h-4 text-amber-500" />
                <span>Feeding Care, Emergency Signs &amp; Follow-up</span>
              </h3>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">
                    Feeding &amp; Nutritional Advice
                  </label>
                  <textarea
                    rows={3}
                    name="feedingAdvice"
                    value={formData.feedingAdvice || ""}
                    onChange={handleInputChange}
                    className="w-full px-3 py-2 rounded-xl border border-slate-300 focus:ring-2 focus:ring-sky-500 text-slate-800"
                  />
                </div>

                <div>
                  <label className="block font-semibold text-slate-700 mb-1">
                    Emergency Danger Signs &amp; Instructions
                  </label>
                  <textarea
                    rows={3}
                    name="instructions"
                    value={formData.instructions}
                    onChange={handleInputChange}
                    className="w-full px-3 py-2 rounded-xl border border-slate-300 focus:ring-2 focus:ring-sky-500 text-slate-800"
                  />
                </div>

                <div>
                  <label className="block font-semibold text-slate-700 mb-1">
                    Next Follow-up Appointment
                  </label>
                  <input
                    type="date"
                    name="followUpDate"
                    value={formData.followUpDate || ""}
                    onChange={handleInputChange}
                    className="w-full px-3 py-2 rounded-xl border border-slate-300 focus:ring-2 focus:ring-sky-500 text-slate-800 font-semibold"
                  />
                </div>

                <div>
                  <label className="block font-semibold text-slate-700 mb-1">
                    Emergency Contact Helpline
                  </label>
                  <input
                    type="text"
                    name="emergencyContact"
                    value={formData.emergencyContact || ""}
                    onChange={handleInputChange}
                    className="w-full px-3 py-2 rounded-xl border border-slate-300 focus:ring-2 focus:ring-sky-500 text-slate-800 font-mono"
                  />
                </div>
              </div>
            </div>

            {/* Bottom Save Action Bar */}
            <div className="flex items-center justify-end gap-3 pt-2">
              <button
                type="button"
                onClick={() => setViewMode("preview")}
                className="px-5 py-2.5 rounded-xl border border-slate-300 text-slate-700 font-bold text-xs hover:bg-slate-100 flex items-center gap-2"
              >
                <Eye className="w-4 h-4" />
                <span>Preview Discharge Summary (NICU)</span>
              </button>

              <button
                type="button"
                onClick={handleSaveToOracle}
                disabled={loading}
                className="px-6 py-2.5 rounded-xl bg-gradient-to-r from-sky-600 to-indigo-600 hover:from-sky-500 hover:to-indigo-500 text-white font-bold text-xs shadow-md shadow-sky-600/30 flex items-center gap-2"
              >
                <Save className="w-4 h-4" />
                <span>{loading ? "Saving to Oracle DB..." : "Commit All 7 Tables to Oracle"}</span>
              </button>
            </div>
          </div>
        ) : (
          /* ============================================================== */
          /*         PATIENT SUMMARY REPORT (OFFICIAL PRINT PREVIEW)        */
          /* ============================================================== */
          <div className="space-y-4">
            <div className="no-print flex items-center justify-between bg-blue-50 border-2 border-blue-200 p-4 rounded-xl text-xs text-blue-950 shadow-sm">
              <div className="flex items-center gap-2">
                <Sparkles className="w-4 h-4 text-blue-700 shrink-0" />
                <span>
                  <strong>Discharge Summary (NICU):</strong> Displays verified demographics, medications from{" "}
                  <code className="bg-blue-100 text-blue-900 px-1 py-0.5 rounded font-mono">IP_NICUPICUDISMEDICINE</code>, and age-categorized Bangla advices from{" "}
                  <code className="bg-blue-100 text-blue-900 px-1 py-0.5 rounded font-mono">IP_NICUADVICE</code>. Formatted with high-contrast medical bold styling for A4 paper printing.
                </span>
              </div>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => setViewMode("edit")}
                  className="px-3.5 py-1.5 bg-white border border-blue-300 rounded-lg text-blue-900 font-bold hover:bg-blue-100 transition-colors"
                >
                  Back to Edit Form
                </button>
                <button
                  type="button"
                  onClick={handlePrint}
                  className="px-4 py-1.5 bg-blue-800 hover:bg-blue-700 text-white rounded-lg font-bold shadow-sm flex items-center gap-1.5 transition-colors"
                >
                  <Printer className="w-3.5 h-3.5" />
                  <span>Print Document</span>
                </button>
              </div>
            </div>

            {/* Official Medical Discharge Document */}
            <div className="print-container bg-white rounded-2xl border-2 border-blue-900/30 border-t-8 border-t-blue-800 shadow-2xl p-8 md:p-12 text-slate-900 max-w-5xl mx-auto">
              {/* Hospital Header */}
              <div className="border-b-2 border-blue-900 pb-5 mb-6">
                <div className="flex items-center justify-between flex-wrap gap-4">
                  <div className="flex items-start gap-3.5">
                    <div className="w-12 h-12 rounded-xl bg-blue-900 text-white flex items-center justify-center font-black text-2xl shadow-md border border-blue-950 shrink-0">
                      ✚
                    </div>
                    <div>
                      <h1 className="text-2xl md:text-3xl font-black tracking-tight text-blue-950">
                        METROPOLITAN HOSPITAL &amp; RESEARCH CENTER
                      </h1>
                      <p className="text-xs font-black text-blue-800 uppercase tracking-widest mt-0.5">
                        DEPARTMENT OF NEONATOLOGY &amp; INPATIENT PEDIATRICS
                      </p>
                      <p className="text-[11px] text-slate-600 font-medium mt-0.5">
                        Hospital Road, Dhaka • Emergency NICU Helpline: <span className="font-bold text-blue-900">+880 1711-000000</span>
                      </p>
                    </div>
                  </div>
                  <div className="text-right border-l-2 border-blue-300 pl-4 bg-blue-50/70 p-2.5 rounded-lg border border-blue-200">
                    <span className="text-[10px] font-black uppercase tracking-wider text-blue-900 block">
                      Discharge Summary (NICU)
                    </span>
                    <span className="font-mono text-base font-black text-blue-950 block">
                      {formData.admissionId}
                    </span>
                    <span className="text-[11px] font-bold text-slate-700 block mt-0.5">
                      Date: <span className="font-mono text-slate-900">{formData.dischargeDate}</span>
                    </span>
                  </div>
                </div>

                <div className="mt-5 pt-3 border-t-2 border-blue-200 flex justify-center">
                  <span className="bg-gradient-to-r from-blue-950 via-blue-900 to-indigo-950 text-white px-8 py-2 rounded-lg text-sm md:text-base font-black uppercase tracking-widest shadow-md border-2 border-blue-950">
                    Discharge Summary (NICU)
                  </span>
                </div>
              </div>

              {/* Patient Identification Grid */}
              <div className="border-2 border-blue-300/80 rounded-xl p-4 mb-6 bg-gradient-to-br from-blue-50/60 via-slate-50 to-teal-50/30 text-xs shadow-xs">
                <div className="grid grid-cols-2 md:grid-cols-4 gap-y-3 gap-x-4">
                  <div>
                    <span className="text-blue-900 font-black uppercase tracking-wider text-[10px] block">Patient Name:</span>
                    <span className="font-extrabold text-blue-950 text-sm">{formData.patientName}</span>
                  </div>
                  <div>
                    <span className="text-blue-900 font-black uppercase tracking-wider text-[10px] block">Admission / Reg No:</span>
                    <span className="font-mono font-bold text-blue-950 bg-white/90 px-2 py-0.5 rounded border border-blue-200 inline-block">
                      {formData.admissionId} {formData.regNo ? `(${formData.regNo})` : ""}
                    </span>
                  </div>
                  <div>
                    <span className="text-blue-900 font-black uppercase tracking-wider text-[10px] block">Birth Age &amp; Category:</span>
                    <span className="font-bold text-slate-900">
                      {formData.age} • <span className="font-extrabold text-indigo-900 bg-indigo-100 px-1.5 py-0.5 rounded border border-indigo-200">({criteriaCategory.labelBn})</span>
                    </span>
                  </div>
                  <div>
                    <span className="text-blue-900 font-black uppercase tracking-wider text-[10px] block">Gender &amp; Blood Group:</span>
                    <span className="font-bold text-slate-900">
                      {formData.gender} • <span className="font-black text-rose-800 bg-rose-50 px-1.5 py-0.5 rounded border border-rose-200">{formData.bloodGroup}</span>
                    </span>
                  </div>

                  <div>
                    <span className="text-blue-900 font-black uppercase tracking-wider text-[10px] block">Parents / Guardian:</span>
                    <span className="font-bold text-slate-900">
                      {formData.guardianName || `${formData.motherName || ""} / ${formData.fatherName || ""}`}
                    </span>
                  </div>
                  <div>
                    <span className="text-blue-900 font-black uppercase tracking-wider text-[10px] block">Bed / Ward Location:</span>
                    <span className="font-bold text-slate-900">
                      {formData.bedName || formData.bedNo} ({formData.wardName || "NICU"})
                    </span>
                  </div>
                  <div>
                    <span className="text-blue-900 font-black uppercase tracking-wider text-[10px] block">Admission Date:</span>
                    <span className="font-bold text-slate-900">{formData.admissionDate}</span>
                  </div>
                  <div>
                    <span className="text-blue-900 font-black uppercase tracking-wider text-[10px] block">Discharge Date:</span>
                    <span className="font-black text-blue-950 bg-white/90 px-2 py-0.5 rounded border border-blue-200 inline-block">{formData.dischargeDate}</span>
                  </div>

                  <div>
                    <span className="text-blue-900 font-black uppercase tracking-wider text-[10px] block">Birth Weight:</span>
                    <span className="font-bold text-slate-900">{formData.birthWeight || "N/A"}</span>
                  </div>
                  <div>
                    <span className="text-blue-900 font-black uppercase tracking-wider text-[10px] block">Discharge Weight:</span>
                    <span className="font-black text-emerald-800 bg-emerald-100 px-2 py-0.5 rounded border border-emerald-300 inline-block">{formData.dischargeWeight || "N/A"}</span>
                  </div>
                  <div className="md:col-span-2">
                    <span className="text-blue-900 font-black uppercase tracking-wider text-[10px] block">Attending Consultant:</span>
                    <span className="font-extrabold text-blue-950">{formData.consultantName}</span>
                  </div>
                </div>
              </div>

              {/* Clinical Diagnoses & Management */}
              <div className="space-y-4 text-xs mb-6">
                <div>
                  <h3 className="font-black uppercase tracking-wide text-blue-950 border-b-2 border-blue-800 pb-1.5 mb-2 flex items-center justify-between">
                    <span className="flex items-center gap-2">
                      <span className="w-2.5 h-2.5 rounded-full bg-blue-700"></span>
                      <span>Clinical Diagnosis</span>
                    </span>
                    <span className="text-[11px] font-black text-white bg-emerald-700 px-3 py-0.5 rounded-full shadow-xs border border-emerald-800">
                      Condition: {formData.conditionAtDischarge}
                    </span>
                  </h3>
                  <div className="bg-blue-50/50 border-l-4 border-l-blue-800 border-y border-r border-blue-100 p-3 rounded-r-lg">
                    <p className="font-black text-blue-950 text-sm leading-snug">
                      {formData.primaryDiagnosis}
                    </p>
                    {formData.secondaryDiagnosis && (
                      <p className="text-slate-700 mt-2 font-medium">
                        <strong className="text-blue-900 font-bold">Secondary Diagnoses:</strong> {formData.secondaryDiagnosis}
                      </p>
                    )}
                  </div>
                </div>

                {/* Hospital Course */}
                <div>
                  <h3 className="font-black uppercase tracking-wide text-blue-950 border-b-2 border-blue-800 pb-1.5 mb-2 flex items-center gap-2">
                    <span className="w-2.5 h-2.5 rounded-full bg-blue-700"></span>
                    <span>Hospital Course &amp; Management</span>
                  </h3>
                  <div className="bg-slate-50 border border-slate-300 p-3.5 rounded-lg">
                    <p className="text-slate-900 font-medium leading-relaxed whitespace-pre-line text-[11.5px]">
                      {formData.hospitalCourse}
                    </p>
                  </div>
                </div>

                {/* Investigations */}
                {formData.investigationSummary && (
                  <div>
                    <h3 className="font-black uppercase tracking-wide text-blue-950 border-b-2 border-blue-800 pb-1.5 mb-2 flex items-center gap-2">
                      <span className="w-2.5 h-2.5 rounded-full bg-teal-700"></span>
                      <span>Key Investigations &amp; Diagnostic Findings</span>
                    </h3>
                    <p className="text-slate-900 leading-relaxed font-mono font-medium text-[11px] bg-teal-50/40 p-3 rounded-lg border-2 border-teal-200">
                      {formData.investigationSummary}
                    </p>
                  </div>
                )}
              </div>

              {/* Medications on Discharge (IP_NICUPICUDISMEDICINE) */}
              <div className="mb-6 print-break-inside-avoid">
                <div className="bg-gradient-to-r from-blue-950 via-blue-900 to-indigo-950 text-white px-4 py-2 rounded-t-xl flex items-center justify-between border-t-2 border-x-2 border-blue-950">
                  <div className="flex items-center gap-2.5">
                    <span className="text-lg font-serif italic font-black text-amber-300">Rx</span>
                    <span className="font-black uppercase tracking-wider text-xs md:text-sm">Discharge Medications</span>
                  </div>
                  <span className="text-[10px] font-bold uppercase tracking-wider bg-blue-800/80 text-blue-100 px-2 py-0.5 rounded border border-blue-700">
                    Synced from IP_NICUPICUDISMEDICINE
                  </span>
                </div>

                {formData.medications.length > 0 ? (
                  <table className="w-full text-left text-xs border-2 border-t-0 border-blue-900 rounded-b-xl overflow-hidden shadow-xs">
                    <thead className="bg-blue-100/80 border-b-2 border-blue-300">
                      <tr>
                        <th className="py-2 px-3 font-black text-blue-950 border-r border-blue-200 w-8">#</th>
                        <th className="py-2 px-3 font-black text-blue-950 border-r border-blue-200">Medicine &amp; Strength</th>
                        <th className="py-2 px-3 font-black text-blue-950 border-r border-blue-200">Dose</th>
                        <th className="py-2 px-3 font-black text-blue-950 border-r border-blue-200">Frequency</th>
                        <th className="py-2 px-3 font-black text-blue-950 border-r border-blue-200">Duration</th>
                        <th className="py-2 px-3 font-black text-blue-950">Instructions</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-blue-100 bg-white">
                      {formData.medications.map((med, idx) => (
                        <tr key={med.id || idx} className={idx % 2 === 0 ? "bg-white" : "bg-blue-50/30"}>
                          <td className="py-2 px-3 font-mono font-bold text-blue-800 border-r border-blue-100">{idx + 1}</td>
                          <td className="py-2 px-3 font-extrabold text-blue-950 border-r border-blue-100">{med.name}</td>
                          <td className="py-2 px-3 font-bold text-slate-900 border-r border-blue-100">{med.dosage}</td>
                          <td className="py-2 px-3 font-bold text-slate-900 border-r border-blue-100">{med.frequency}</td>
                          <td className="py-2 px-3 font-bold text-slate-800 border-r border-blue-100">{med.duration}</td>
                          <td className="py-2 px-3 text-slate-800 font-medium text-[11px]">
                            {med.instructions || med.instructionsBn || "—"}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                ) : (
                  <div className="p-4 border-2 border-t-0 border-blue-900 rounded-b-xl bg-slate-50 text-xs text-slate-500 italic">
                    No discharge medications prescribed.
                  </div>
                )}
              </div>

              {/* ⭐ BANGLA ADVICE SECTION (IP_NICUADVICE based on patient birth age criteria) */}
              <div className="mb-6 print-break-inside-avoid border-2 border-indigo-900 rounded-xl overflow-hidden bg-gradient-to-br from-indigo-50/40 via-white to-purple-50/30 shadow-xs">
                <div className="bg-gradient-to-r from-indigo-950 via-indigo-900 to-purple-950 text-white px-4 py-2.5 flex items-center justify-between border-b-2 border-indigo-900">
                  <div className="flex items-center gap-2">
                    <span className="w-3 h-3 rounded-full bg-amber-400"></span>
                    <h3 className="font-black text-xs md:text-sm uppercase tracking-wide">
                      বাংলা স্বাস্থ্য ও চিকিৎসা পরামর্শ (Care Advices Based on Birth Age Criteria)
                    </h3>
                  </div>
                  <span className="text-[11px] font-black bg-white text-indigo-950 px-3 py-0.5 rounded shadow-sm border border-indigo-200">
                    {criteriaCategory.labelBn}
                  </span>
                </div>

                <div className="p-4">
                  {selectedAdvicesForReport.length === 0 ? (
                    <p className="text-xs text-slate-500 italic">
                      No advices selected. Please return to edit form to select age-appropriate advices.
                    </p>
                  ) : (
                    <div className="space-y-3">
                      {selectedAdvicesForReport.map((adv, index) => (
                        <div
                          key={adv.adviceId}
                          className="flex items-start gap-3 bg-white p-3 rounded-lg border-2 border-indigo-200/90 shadow-2xs hover:border-indigo-400 transition-colors"
                        >
                          <span className="font-mono text-[11px] font-black px-2 py-0.5 rounded bg-indigo-900 text-white shrink-0 shadow-2xs">
                            {adv.adviceId}
                          </span>

                          <div className="flex-1">
                            <div className="flex items-center gap-2">
                              <span className="text-[10px] font-extrabold text-indigo-900 bg-indigo-100 px-2 py-0.5 rounded border border-indigo-300">
                                {adv.categoryLabelBn || adv.categoryLabelEn}
                              </span>
                              {adv.isRecommended && (
                                <span className="text-[9px] font-black text-emerald-900 bg-emerald-100 px-1.5 py-0.5 rounded border border-emerald-300">
                                  ✓ বয়স উপযোগী পরামর্শ
                                </span>
                              )}
                            </div>

                            {/* Bangla Unicode Advice Text */}
                            <p className="text-sm font-black text-slate-950 mt-1 leading-snug">
                              {adv.adviceBangla}
                            </p>

                            {/* English Advice Translation Subtext */}
                            <p className="text-[11px] text-slate-700 mt-0.5 leading-relaxed italic font-medium">
                              {adv.adviceEnglish}
                            </p>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>

              {/* Feeding Advice & Discharge Instructions */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs mb-8 print-break-inside-avoid">
                <div className="border-2 border-teal-600 rounded-xl overflow-hidden bg-teal-50/30 shadow-xs">
                  <div className="bg-teal-800 text-white px-3.5 py-1.5 font-black uppercase tracking-wide flex items-center gap-2 border-b-2 border-teal-900">
                    <span className="w-2 h-2 rounded-full bg-teal-300"></span>
                    <h4>Feeding &amp; Neonatal Nutrition</h4>
                  </div>
                  <div className="p-3.5">
                    <p className="text-teal-950 font-medium whitespace-pre-line leading-relaxed text-[11.5px]">
                      {formData.feedingAdvice || "Follow regular pediatric feeding schedule."}
                    </p>
                  </div>
                </div>

                <div className="border-2 border-rose-600 rounded-xl overflow-hidden bg-rose-50/50 shadow-xs">
                  <div className="bg-rose-700 text-white px-3.5 py-1.5 font-black uppercase tracking-wide flex items-center gap-2 border-b-2 border-rose-800">
                    <AlertTriangle className="w-3.5 h-3.5 text-white animate-pulse" />
                    <h4>Emergency Danger Signs &amp; Precautions</h4>
                  </div>
                  <div className="p-3.5">
                    <p className="text-rose-950 font-bold whitespace-pre-line leading-relaxed text-[11.5px]">
                      {formData.instructions}
                    </p>
                  </div>
                </div>
              </div>

              {/* Follow-up & Signatures */}
              <div className="border-t-2 border-blue-900 pt-5 print-break-inside-avoid text-xs">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-10">
                  <div className="bg-blue-50/90 border-2 border-blue-300 p-3.5 rounded-xl">
                    <span className="text-blue-900 uppercase font-black text-[10px] tracking-wider block">
                      Next Follow-Up Appointment:
                    </span>
                    <span className="font-black text-blue-950 text-sm block mt-0.5">
                      {formData.followUpDate || "7 Days from discharge"} at Neonatology OPD
                    </span>
                  </div>
                  <div className="bg-rose-50/90 border-2 border-rose-300 p-3.5 rounded-xl sm:text-right">
                    <span className="text-rose-900 uppercase font-black text-[10px] tracking-wider block">
                      Emergency NICU Helpline:
                    </span>
                    <span className="font-mono font-black text-rose-950 text-sm block mt-0.5">
                      {formData.emergencyContact || "+880 1711-000000"}
                    </span>
                  </div>
                </div>

                {/* Doctor Signatures Lines */}
                <div className="grid grid-cols-3 gap-8 pt-8 text-center text-xs">
                  <div>
                    <div className="border-t-2 border-slate-700 w-40 mx-auto mb-1.5"></div>
                    <span className="font-bold text-slate-900 block">Medical Officer / Resident</span>
                    <span className="text-[10px] text-slate-600 font-medium">NICU Department</span>
                  </div>

                  <div>
                    <div className="border-t-2 border-slate-700 w-40 mx-auto mb-1.5"></div>
                    <span className="font-bold text-slate-900 block">Senior Registrar</span>
                    <span className="text-[10px] text-slate-600 font-medium">Pediatrics &amp; Neonatology</span>
                  </div>

                  <div>
                    <div className="border-t-2 border-blue-900 w-44 mx-auto mb-1.5"></div>
                    <span className="font-black text-blue-950 block">{formData.consultantName}</span>
                    <span className="text-[10px] text-blue-800 font-bold">Consultant Neonatologist &amp; Seal</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
