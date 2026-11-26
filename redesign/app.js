(function () {
  "use strict";

  const STORAGE_KEY = "nicu_discharge_records_v1";
  const {
    ADMITTED_PATIENTS,
    MEDICINES_CATALOG,
    ADVICE_CATALOG,
    CONSULTANTS,
    INITIAL_SAVED_RECORDS
  } = window.NicuData;

  // =========================================================================
  // Application State
  // =========================================================================
  const state = {
    savedRecords: [],
    currentIndex: 0,
    activeStep: 1,
    mode: "Display", // "Display" | "Insert" | "Update"
    isDirty: false,
    activeMedRowIndex: null,
    selectedPatientLovIndex: 0,
    selectedMedLovIndex: 0,
    selectedAdviceLovIndex: 0,
    filteredPatients: [...ADMITTED_PATIENTS],
    filteredMedicines: [...MEDICINES_CATALOG],
    filteredAdvices: [...ADVICE_CATALOG],
    form: createEmptyRecord()
  };

  const FIELD_IDS = [
    "admissionNo", "admissionDate", "bed", "hn", "patientName", "age",
    "motherGender", "nationalId", "motherBloodGroup", "dischargeType",
    "address", "dischargeDate", "dischargeNote",
    "deliveryDate", "deliveryHour", "admittingDoctor", "consultantBy",
    "ofcAdmission", "ofcDischarge", "birthWeight", "dischargeWeight",
    "childGender", "childBloodGroup",
    "chiefComplaint", "caseSummary", "investigationDone", "diagnosis", "treatmentInHospital",
    "ageComments", "registerId", "registerName", "consultantId", "consultantName"
  ];

  // =========================================================================
  // Helpers
  // =========================================================================
  function createEmptyRecord() {
    return {
      admissionNo: "",
      admissionDate: "",
      bed: "",
      hn: "",
      patientName: "",
      age: "",
      motherGender: "",
      nationalId: "",
      motherBloodGroup: "",
      address: "",
      dischargeType: "",
      dischargeDate: formatInputDate(new Date()),
      dischargeNote: "",
      deliveryDate: "",
      deliveryHour: "",
      admittingDoctor: "",
      consultantBy: "",
      ofcAdmission: "",
      ofcDischarge: "",
      birthWeight: "",
      dischargeWeight: "",
      childGender: "",
      childBloodGroup: "",
      chiefComplaint: "",
      caseSummary: "",
      investigationDone: "",
      diagnosis: "",
      treatmentInHospital: "",
      ageComments: "",
      medications: [createEmptyMed()],
      advices: [],
      registerId: "E011310000971",
      registerName: "Ms. Shammi",
      consultantId: "",
      consultantName: ""
    };
  }

  function createEmptyMed() {
    return {
      medicineNo: "",
      name: "",
      strength: "",
      qty: "",
      duration: "",
      instructionsBn: "",
      instructionsEn: ""
    };
  }

  function clone(obj) {
    return JSON.parse(JSON.stringify(obj));
  }

  function formatInputDate(date) {
    const y = date.getFullYear();
    const m = String(date.getMonth() + 1).padStart(2, "0");
    const d = String(date.getDate()).padStart(2, "0");
    return `${y}-${m}-${d}`;
  }

  function formatDisplayDate(iso) {
    if (!iso) return "—";
    const parts = iso.split("-");
    if (parts.length !== 3) return iso;
    return `${parts[2]}/${parts[1]}/${parts[0]}`;
  }

  function parseAgeDays(ageStr, dobIso, refIso) {
    if (dobIso) {
      const dob = new Date(dobIso);
      const ref = refIso ? new Date(refIso) : new Date();
      if (!isNaN(dob.getTime()) && !isNaN(ref.getTime())) {
        const diff = Math.floor((ref - dob) / 86400000);
        if (diff >= 0) return diff;
      }
    }
    if (ageStr) {
      const yMatch = ageStr.match(/(\d+)\s*Y/i);
      const mMatch = ageStr.match(/(\d+)\s*M/i);
      const dMatch = ageStr.match(/(\d+)\s*D/i);
      const y = yMatch ? parseInt(yMatch[1], 10) : 0;
      const m = mMatch ? parseInt(mMatch[1], 10) : 0;
      const d = dMatch ? parseInt(dMatch[1], 10) : 0;
      return y * 365 + m * 30 + d;
    }
    return 14;
  }

  function matchesWildcardQuery(text, query) {
    const clean = (query || "").trim();
    if (!clean || clean === "%") return true;
    const escaped = clean
      .replace(/[.+?^${}()|[\]\\]/g, "\\$&")
      .replace(/%/g, ".*");
    const regex = new RegExp(escaped, "i");
    return regex.test(text || "");
  }

  /** Safe DOM node builder to eliminate XSS risk */
  function el(tag, attrs = {}, children = []) {
    const node = document.createElement(tag);
    for (const [key, value] of Object.entries(attrs)) {
      if (value === null || value === undefined) continue;
      if (key === "className") {
        node.className = value;
      } else if (key === "textContent") {
        node.textContent = value;
      } else if (key === "dataset") {
        for (const [dKey, dVal] of Object.entries(value)) {
          node.dataset[dKey] = dVal;
        }
      } else if (key.startsWith("on") && typeof value === "function") {
        node.addEventListener(key.slice(2).toLowerCase(), value);
      } else {
        node.setAttribute(key, value);
      }
    }
    for (const child of Array.isArray(children) ? children : [children]) {
      if (child === null || child === undefined) continue;
      node.appendChild(typeof child === "string" ? document.createTextNode(child) : child);
    }
    return node;
  }

  function showToast(message, type = "info") {
    const container = document.getElementById("toast-container");
    const toast = el("div", { className: `toast toast--${type}`, role: "status" }, [message]);
    container.appendChild(toast);
    setTimeout(() => {
      toast.style.opacity = "0";
      toast.style.transition = "opacity 200ms ease";
      setTimeout(() => toast.remove(), 220);
    }, 3200);
  }

  // =========================================================================
  // Persistence
  // =========================================================================
  function loadSavedRecords() {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (raw) {
        const parsed = JSON.parse(raw);
        if (Array.isArray(parsed) && parsed.length > 0) {
          return parsed;
        }
      }
    } catch {
      // Fallback to initial seeded records if localStorage is restricted
    }
    return clone(INITIAL_SAVED_RECORDS);
  }

  function persistRecords() {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(state.savedRecords));
    } catch {
      // Ignore storage quota errors cleanly
    }
  }

  // =========================================================================
  // Form & UI Synchronization
  // =========================================================================
  function populateFormFromState() {
    FIELD_IDS.forEach((id) => {
      const input = document.getElementById(id);
      if (!input) return;
      input.value = state.form[id] ?? "";
      input.classList.remove("is-invalid");
    });
    renderMedicationsTable();
    renderAdviceList();
    updatePatientContextStrip();
    updateWeightDeltaBadge();
    updateHeaderBadges();
  }

  function readFormIntoState() {
    FIELD_IDS.forEach((id) => {
      const input = document.getElementById(id);
      if (input) state.form[id] = input.value;
    });
  }

  function markDirty() {
    if (!state.isDirty) {
      state.isDirty = true;
      if (state.mode === "Display") {
        state.mode = "Update";
      }
      updateHeaderBadges();
    }
  }

  function updateHeaderBadges() {
    const modeBadge = document.getElementById("mode-badge");
    const modeLabel = document.getElementById("mode-label");
    const dirtyBadge = document.getElementById("dirty-badge");
    const counter = document.getElementById("record-counter");

    modeLabel.textContent = state.mode;
    modeBadge.className = "status-pill";
    if (state.mode === "Insert") modeBadge.classList.add("status-pill--insert");
    else if (state.mode === "Update") modeBadge.classList.add("status-pill--update");
    else modeBadge.classList.add("status-pill--display");

    dirtyBadge.classList.toggle("hidden", !state.isDirty);

    const total = state.savedRecords.length;
    const pos = state.mode === "Insert" ? "New" : `${state.currentIndex + 1} / ${total}`;
    counter.textContent = pos;

    const disableNav = total === 0 || state.mode === "Insert";
    document.getElementById("nav-first").disabled = disableNav || state.currentIndex <= 0;
    document.getElementById("nav-prev").disabled = disableNav || state.currentIndex <= 0;
    document.getElementById("nav-next").disabled = disableNav || state.currentIndex >= total - 1;
    document.getElementById("nav-last").disabled = disableNav || state.currentIndex >= total - 1;
  }

  function updatePatientContextStrip() {
    const name = (state.form.patientName || "").trim();
    const adm = (state.form.admissionNo || "").trim();
    const hn = (state.form.hn || "").trim();
    const bed = (state.form.bed || "").trim();
    const age = (state.form.age || "").trim();

    document.getElementById("strip-name").textContent = name || "No Patient Selected";
    document.getElementById("strip-avatar").textContent = name ? name.charAt(0).toUpperCase() : "?";
    document.getElementById("strip-adm").textContent = `Adm: ${adm || "—"}`;
    document.getElementById("strip-hn").textContent = `HN: ${hn || "—"}`;
    document.getElementById("strip-bed").textContent = `Bed: ${bed || "—"}`;
    document.getElementById("strip-age").textContent = age || "—";

    const bw = parseFloat(state.form.birthWeight);
    const dw = parseFloat(state.form.dischargeWeight);
    const wtEl = document.getElementById("strip-wt-delta");
    if (!isNaN(bw) && !isNaN(dw) && bw > 0) {
      const diff = dw - bw;
      const sign = diff >= 0 ? "+" : "";
      wtEl.textContent = `${bw.toFixed(2)} → ${dw.toFixed(2)} kg (${sign}${diff.toFixed(2)})`;
    } else {
      wtEl.textContent = "—";
    }
  }

  function updateWeightDeltaBadge() {
    const badge = document.getElementById("weight-gain-badge");
    const bw = parseFloat(state.form.birthWeight);
    const dw = parseFloat(state.form.dischargeWeight);
    if (isNaN(bw) || isNaN(dw) || bw <= 0) {
      badge.classList.add("hidden");
      return;
    }
    const diff = dw - bw;
    const pct = ((diff / bw) * 100).toFixed(1);
    const sign = diff >= 0 ? "+" : "";
    badge.textContent = `Weight Δ: ${sign}${diff.toFixed(2)} kg (${sign}${pct}%)`;
    badge.classList.remove("hidden", "delta-badge--warn");
    if (diff < 0) {
      badge.classList.add("delta-badge--warn");
    }
  }

  function switchStep(stepNum) {
    state.activeStep = stepNum;
    const p1 = document.getElementById("panel-step1");
    const p2 = document.getElementById("panel-step2");
    const t1 = document.getElementById("tab-step1");
    const t2 = document.getElementById("tab-step2");

    const isStep1 = stepNum === 1;
    p1.classList.toggle("hidden", !isStep1);
    p2.classList.toggle("hidden", isStep1);

    t1.classList.toggle("is-active", isStep1);
    t2.classList.toggle("is-active", !isStep1);
    t1.setAttribute("aria-current", isStep1 ? "step" : "false");
    t2.setAttribute("aria-current", !isStep1 ? "step" : "false");

    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  // =========================================================================
  // Step 2: Medication Table Rendering & Actions
  // =========================================================================
  function renderMedicationsTable() {
    const tbody = document.getElementById("med-tbody");
    tbody.innerHTML = "";

    if (state.form.medications.length === 0) {
      state.form.medications.push(createEmptyMed());
    }

    state.form.medications.forEach((med, idx) => {
      const tr = el("tr");

      // SL
      tr.appendChild(
        el("td", { className: "col-sl" }, [el("span", { className: "sl-badge", textContent: String(idx + 1) })])
      );

      // Medicine No + LOV button
      const medNoInput = el("input", {
        type: "text",
        className: "input table-input font-mono input--required",
        value: med.medicineNo || "",
        placeholder: "F9 / Pick",
        "aria-label": `Row ${idx + 1} Medicine Number`,
        onInput: (e) => {
          state.form.medications[idx].medicineNo = e.target.value;
          markDirty();
        },
        onKeydown: (e) => {
          if (e.key === "F9") {
            e.preventDefault();
            openMedicineLov(idx);
          }
        }
      });

      const medNoBtn = el(
        "button",
        {
          type: "button",
          className: "lov-btn table-lov-trigger",
          title: "Pick Medicine (F9)",
          onClick: () => openMedicineLov(idx)
        },
        ["LOV"]
      );

      tr.appendChild(el("td", {}, [el("div", { className: "input-group" }, [medNoInput, medNoBtn])]));

      // Medicine Name
      tr.appendChild(
        el("td", {}, [
          el("input", {
            type: "text",
            className: "input table-input",
            value: med.name || "",
            placeholder: "Medicine name",
            "aria-label": `Row ${idx + 1} Medicine Name`,
            onInput: (e) => {
              state.form.medications[idx].name = e.target.value;
              markDirty();
            }
          })
        ])
      );

      // Strength
      tr.appendChild(
        el("td", {}, [
          el("input", {
            type: "text",
            className: "input table-input font-mono input--required",
            value: med.strength || "",
            placeholder: "e.g. 250",
            "aria-label": `Row ${idx + 1} Strength`,
            onInput: (e) => {
              state.form.medications[idx].strength = e.target.value;
              markDirty();
            }
          })
        ])
      );

      // Qty
      tr.appendChild(
        el("td", {}, [
          el("input", {
            type: "text",
            className: "input table-input font-mono input--required",
            value: med.qty || "",
            placeholder: "1",
            "aria-label": `Row ${idx + 1} Quantity`,
            onInput: (e) => {
              state.form.medications[idx].qty = e.target.value;
              markDirty();
            }
          })
        ])
      );

      // Duration
      tr.appendChild(
        el("td", {}, [
          el("input", {
            type: "text",
            className: "input table-input font-mono input--required",
            value: med.duration || "",
            placeholder: "7 D",
            "aria-label": `Row ${idx + 1} Duration`,
            onInput: (e) => {
              state.form.medications[idx].duration = e.target.value;
              markDirty();
            }
          })
        ])
      );

      // Instructions in Bangla
      tr.appendChild(
        el("td", {}, [
          el("input", {
            type: "text",
            className: "input table-input font-bangla input--required",
            value: med.instructionsBn || "",
            placeholder: "বাংলায় নির্দেশনা...",
            "aria-label": `Row ${idx + 1} Instructions in Bangla`,
            onInput: (e) => {
              state.form.medications[idx].instructionsBn = e.target.value;
              markDirty();
            }
          })
        ])
      );

      // Instructions in English
      tr.appendChild(
        el("td", {}, [
          el("input", {
            type: "text",
            className: "input table-input input--required",
            value: med.instructionsEn || "",
            placeholder: "e.g. 1+0+1 After feed",
            "aria-label": `Row ${idx + 1} Instructions in English`,
            onInput: (e) => {
              state.form.medications[idx].instructionsEn = e.target.value;
              markDirty();
            }
          })
        ])
      );

      // Delete row
      const delBtn = el(
        "button",
        {
          type: "button",
          className: "icon-delete-btn",
          title: "Remove medication row",
          "aria-label": `Remove medication row ${idx + 1}`,
          onClick: () => {
            state.form.medications.splice(idx, 1);
            markDirty();
            renderMedicationsTable();
          }
        },
        ["✕"]
      );
      tr.appendChild(el("td", { className: "col-actions" }, [delBtn]));

      tbody.appendChild(tr);
    });
  }

  // =========================================================================
  // Step 2: Advice Rendering & Actions
  // =========================================================================
  function renderAdviceList() {
    const container = document.getElementById("advice-list-container");
    container.innerHTML = "";

    if (!state.form.advices || state.form.advices.length === 0) {
      container.appendChild(
        el("div", { className: "advice-empty" }, [
          "No discharge advice added yet. Click ",
          el("strong", { textContent: "Open Advice List" }),
          " or ",
          el("strong", { textContent: "Auto-Suggest by Age" }),
          " above."
        ])
      );
      return;
    }

    state.form.advices.forEach((adv, idx) => {
      const bnInput = el("textarea", {
        rows: "2",
        className: "input font-bangla input--required",
        placeholder: "বাংলায় পরামর্শ লিখুন...",
        "aria-label": `Advice ${idx + 1} Bangla`,
        onInput: (e) => {
          state.form.advices[idx].adviceBangla = e.target.value;
          markDirty();
        }
      });
      bnInput.value = adv.adviceBangla || "";

      const enInput = el("textarea", {
        rows: "2",
        className: "input",
        placeholder: "English clinical advice...",
        "aria-label": `Advice ${idx + 1} English`,
        onInput: (e) => {
          state.form.advices[idx].adviceEnglish = e.target.value;
          markDirty();
        }
      });
      enInput.value = adv.adviceEnglish || "";

      const row = el("div", { className: "advice-row" }, [
        el("span", { className: "advice-index", textContent: String(idx + 1) }),
        el("div", { className: "advice-fields" }, [
          el("div", {}, [
            el("span", { className: "advice-field-label", textContent: "পরামর্শ (Unicode বাংলা)" }),
            bnInput
          ]),
          el("div", {}, [
            el("span", { className: "advice-field-label", textContent: "Advice (English)" }),
            enInput
          ])
        ]),
        el("div", { className: "advice-row-actions" }, [
          el(
            "button",
            {
              type: "button",
              className: "icon-delete-btn",
              title: "Remove advice",
              "aria-label": `Remove advice ${idx + 1}`,
              onClick: () => {
                state.form.advices.splice(idx, 1);
                markDirty();
                renderAdviceList();
              }
            },
            ["✕"]
          )
        ])
      ]);

      container.appendChild(row);
    });
  }

  function autoSuggestAdviceByAge() {
    readFormIntoState();
    const ageDays = parseAgeDays(state.form.age, state.form.deliveryDate, state.form.dischargeDate);
    const matching = ADVICE_CATALOG.filter(
      (a) => ageDays >= a.minAgeDays && ageDays <= a.maxAgeDays
    );

    const existingIds = new Set((state.form.advices || []).map((a) => a.adviceId));
    let added = 0;
    matching.forEach((item) => {
      if (!existingIds.has(item.adviceId)) {
        state.form.advices.push({
          adviceId: item.adviceId,
          adviceEnglish: item.adviceEnglish,
          adviceBangla: item.adviceBangla
        });
        added++;
      }
    });

    if (added > 0) {
      markDirty();
      renderAdviceList();
      showToast(`Added ${added} age-appropriate advice items (Age ≈ ${ageDays} days).`, "success");
    } else {
      showToast("All age-appropriate advice items are already included.", "info");
    }
  }

  // =========================================================================
  // Modals & LOV Lookup Logic
  // =========================================================================
  function openModal(modalId) {
    const modal = document.getElementById(modalId);
    modal.classList.remove("hidden");
  }

  function closeModal(modalId) {
    const modal = document.getElementById(modalId);
    modal.classList.add("hidden");
  }

  function closeAllModals() {
    document.querySelectorAll(".modal-backdrop").forEach((m) => m.classList.add("hidden"));
  }

  // --- Patient LOV ---
  function openPatientLov() {
    const searchInput = document.getElementById("patient-lov-search");
    searchInput.value = "%";
    filterPatientLov("%");
    openModal("modal-patient-lov");
    setTimeout(() => {
      searchInput.focus();
      searchInput.select();
    }, 30);
  }

  function filterPatientLov(query) {
    state.filteredPatients = ADMITTED_PATIENTS.filter(
      (p) =>
        matchesWildcardQuery(p.patientName, query) ||
        matchesWildcardQuery(p.admissionNo, query) ||
        matchesWildcardQuery(p.hn, query) ||
        matchesWildcardQuery(p.bed, query)
    );
    state.selectedPatientLovIndex = 0;
    renderPatientLovTable();
  }

  function renderPatientLovTable() {
    const tbody = document.getElementById("patient-lov-tbody");
    tbody.innerHTML = "";
    document.getElementById("patient-lov-count").textContent = `${state.filteredPatients.length} patients`;

    if (state.filteredPatients.length === 0) {
      tbody.appendChild(
        el("tr", {}, [el("td", { colspan: "5", textContent: "No matching admitted patients found." })])
      );
      return;
    }

    state.filteredPatients.forEach((p, idx) => {
      const tr = el(
        "tr",
        {
          className: idx === state.selectedPatientLovIndex ? "is-selected" : "",
          onClick: () => {
            state.selectedPatientLovIndex = idx;
            renderPatientLovTable();
          },
          onDblclick: () => confirmPatientSelection(p)
        },
        [
          el("td", { textContent: p.patientName }),
          el("td", { className: "font-mono", textContent: p.admissionNo }),
          el("td", { className: "font-mono", textContent: p.bed }),
          el("td", { className: "font-mono", textContent: p.hn }),
          el("td", { className: "font-mono", textContent: formatDisplayDate(p.admissionDate) })
        ]
      );
      tbody.appendChild(tr);
    });
  }

  function confirmPatientSelection(patient) {
    if (!patient) return;

    const savedIdx = state.savedRecords.findIndex(
      (r) => r.admissionNo.toUpperCase() === patient.admissionNo.toUpperCase()
    );

    if (savedIdx !== -1) {
      state.currentIndex = savedIdx;
      state.form = clone(state.savedRecords[savedIdx]);
      state.mode = "Display";
      state.isDirty = false;
      populateFormFromState();
      closeModal("modal-patient-lov");
      showToast(`Loaded saved summary: ${patient.patientName} (${patient.admissionNo})`, "success");
      return;
    }

    const fresh = createEmptyRecord();
    const fields = [
      "admissionNo", "admissionDate", "dischargeDate", "deliveryDate", "deliveryHour",
      "bed", "hn", "patientName", "age", "motherGender", "nationalId",
      "motherBloodGroup", "address", "childGender", "childBloodGroup",
      "birthWeight", "dischargeWeight", "ofcAdmission", "ofcDischarge",
      "admittingDoctor", "consultantBy", "chiefComplaint", "caseSummary",
      "investigationDone", "diagnosis", "treatmentInHospital"
    ];
    fields.forEach((f) => {
      if (patient[f] !== undefined) fresh[f] = patient[f];
    });
    fresh.dischargeType = "Normal Discharge";
    fresh.ageComments = `Age: ${patient.age} — NICU discharge review`;

    if (patient.consultantBy) {
      fresh.consultantName = patient.consultantBy;
      const matchedDoc = CONSULTANTS.find(
        (c) => c.name.toLowerCase() === patient.consultantBy.toLowerCase()
      );
      if (matchedDoc) fresh.consultantId = matchedDoc.id;
    }

    state.form = fresh;
    state.mode = "Insert";
    state.isDirty = true;
    populateFormFromState();
    closeModal("modal-patient-lov");
    showToast(`Loaded admitted patient: ${patient.patientName} (${patient.admissionNo})`, "success");
  }

  // --- Medicine LOV ---
  function openMedicineLov(rowIndex = null) {
    state.activeMedRowIndex = rowIndex;
    const searchInput = document.getElementById("med-lov-search");
    searchInput.value = "%";
    filterMedicineLov("%");
    openModal("modal-medicine-lov");
    setTimeout(() => {
      searchInput.focus();
      searchInput.select();
    }, 30);
  }

  function filterMedicineLov(query) {
    state.filteredMedicines = MEDICINES_CATALOG.filter(
      (m) => matchesWildcardQuery(m.name, query) || matchesWildcardQuery(m.medicineNo, query)
    );
    state.selectedMedLovIndex = 0;
    renderMedicineLovTable();
  }

  function renderMedicineLovTable() {
    const tbody = document.getElementById("med-lov-tbody");
    tbody.innerHTML = "";
    document.getElementById("med-lov-count").textContent = `${state.filteredMedicines.length} items`;

    if (state.filteredMedicines.length === 0) {
      tbody.appendChild(
        el("tr", {}, [el("td", { colspan: "4", textContent: "No matching medicines found." })])
      );
      return;
    }

    state.filteredMedicines.forEach((m, idx) => {
      const tr = el(
        "tr",
        {
          className: idx === state.selectedMedLovIndex ? "is-selected" : "",
          onClick: () => {
            state.selectedMedLovIndex = idx;
            renderMedicineLovTable();
          },
          onDblclick: () => confirmMedicineSelection(m)
        },
        [
          el("td", { textContent: m.name }),
          el("td", { className: "font-mono", textContent: m.medicineNo }),
          el("td", { className: "font-mono", textContent: m.strength }),
          el("td", {}, [el("span", { className: "tag-pill", textContent: m.form })])
        ]
      );
      tbody.appendChild(tr);
    });
  }

  function confirmMedicineSelection(med) {
    if (!med) return;
    const newItem = {
      medicineNo: med.medicineNo,
      name: med.name,
      strength: med.strength,
      qty: med.defaultQty,
      duration: med.defaultDuration,
      instructionsBn: med.defaultBn,
      instructionsEn: med.defaultEn
    };

    if (state.activeMedRowIndex !== null && state.form.medications[state.activeMedRowIndex]) {
      state.form.medications[state.activeMedRowIndex] = newItem;
    } else {
      const emptyIdx = state.form.medications.findIndex((m) => !m.medicineNo && !m.name);
      if (emptyIdx !== -1) {
        state.form.medications[emptyIdx] = newItem;
      } else {
        state.form.medications.push(newItem);
      }
    }

    markDirty();
    renderMedicationsTable();
    closeModal("modal-medicine-lov");
    showToast(`Added ${med.name}`, "success");
  }

  // --- Advice LOV ---
  function openAdviceLov() {
    const searchInput = document.getElementById("advice-lov-search");
    searchInput.value = "%";
    document.getElementById("advice-select-all").checked = false;
    filterAdviceLov("%");
    openModal("modal-advice-lov");
    setTimeout(() => {
      searchInput.focus();
      searchInput.select();
    }, 30);
  }

  function filterAdviceLov(query) {
    state.filteredAdvices = ADVICE_CATALOG.filter(
      (a) =>
        matchesWildcardQuery(a.adviceEnglish, query) ||
        matchesWildcardQuery(a.adviceBangla, query) ||
        matchesWildcardQuery(a.criteriaLabel, query)
    );
    state.selectedAdviceLovIndex = 0;
    renderAdviceLovTable();
  }

  function renderAdviceLovTable() {
    const tbody = document.getElementById("advice-lov-tbody");
    tbody.innerHTML = "";
    document.getElementById("advice-lov-count").textContent = `${state.filteredAdvices.length} items`;

    const ageDays = parseAgeDays(state.form.age, state.form.deliveryDate, state.form.dischargeDate);
    const existingIds = new Set((state.form.advices || []).map((a) => a.adviceId));

    state.filteredAdvices.forEach((a, idx) => {
      const isRec = ageDays >= a.minAgeDays && ageDays <= a.maxAgeDays;
      const checkbox = el("input", {
        type: "checkbox",
        className: "advice-lov-check",
        value: a.adviceId,
        checked: existingIds.has(a.adviceId) ? "checked" : null
      });
      checkbox.addEventListener("click", (e) => e.stopPropagation());

      const tr = el(
        "tr",
        {
          className: idx === state.selectedAdviceLovIndex ? "is-selected" : "",
          onClick: () => {
            state.selectedAdviceLovIndex = idx;
            checkbox.checked = !checkbox.checked;
            renderAdviceSelectionHighlight(tbody, idx);
          },
          onDblclick: () => {
            checkbox.checked = true;
            confirmAdviceSelections();
          }
        },
        [
          el("td", { className: "col-check" }, [checkbox]),
          el("td", { textContent: a.adviceEnglish }),
          el("td", { className: "font-bangla", textContent: a.adviceBangla }),
          el("td", {}, [
            el("span", {
              className: `tag-pill ${isRec ? "tag-pill--recommended" : ""}`,
              textContent: isRec ? `${a.criteriaLabel} • Rec` : a.criteriaLabel
            })
          ])
        ]
      );
      tbody.appendChild(tr);
    });
  }

  function renderAdviceSelectionHighlight(tbody, selectedIdx) {
    Array.from(tbody.children).forEach((row, i) => {
      row.classList.toggle("is-selected", i === selectedIdx);
    });
  }

  function confirmAdviceSelections() {
    const checkedIds = Array.from(document.querySelectorAll(".advice-lov-check:checked")).map(
      (cb) => cb.value
    );

    let targets = checkedIds;
    if (targets.length === 0 && state.filteredAdvices[state.selectedAdviceLovIndex]) {
      targets = [state.filteredAdvices[state.selectedAdviceLovIndex].adviceId];
    }

    const existingIds = new Set((state.form.advices || []).map((a) => a.adviceId));
    let addedCount = 0;

    targets.forEach((id) => {
      if (!existingIds.has(id)) {
        const found = ADVICE_CATALOG.find((item) => item.adviceId === id);
        if (found) {
          state.form.advices.push({
            adviceId: found.adviceId,
            adviceEnglish: found.adviceEnglish,
            adviceBangla: found.adviceBangla
          });
          addedCount++;
        }
      }
    });

    if (addedCount > 0) {
      markDirty();
      renderAdviceList();
      showToast(`Added ${addedCount} discharge advice item(s).`, "success");
    }
    closeModal("modal-advice-lov");
  }

  // =========================================================================
  // Validation, Saving, Record Navigation, Clear & Exit
  // =========================================================================
  function validateForm() {
    readFormIntoState();
    const checks = [
      { id: "admissionNo", step: 1, label: "Admission No" },
      { id: "caseSummary", step: 1, label: "Case Summary" },
      { id: "ageComments", step: 2, label: "Age Comments" }
    ];

    for (const c of checks) {
      const val = (state.form[c.id] || "").trim();
      if (!val) {
        switchStep(c.step);
        const input = document.getElementById(c.id);
        if (input) {
          input.classList.add("is-invalid");
          input.focus();
        }
        showToast(`${c.label} is required before saving.`, "warning");
        return false;
      }
    }
    return true;
  }

  function saveRecord() {
    if (!validateForm()) return;

    const recordToSave = clone(state.form);
    recordToSave.medications = recordToSave.medications.filter(
      (m) => m.medicineNo || m.name || m.instructionsEn || m.instructionsBn
    );

    const existingIdx = state.savedRecords.findIndex(
      (r) => r.admissionNo.toUpperCase() === recordToSave.admissionNo.trim().toUpperCase()
    );

    if (existingIdx !== -1) {
      state.savedRecords[existingIdx] = recordToSave;
      state.currentIndex = existingIdx;
    } else {
      state.savedRecords.push(recordToSave);
      state.currentIndex = state.savedRecords.length - 1;
    }

    persistRecords();
    state.mode = "Display";
    state.isDirty = false;
    populateFormFromState();
    showToast(`Saved Discharge Summary for ${recordToSave.patientName || recordToSave.admissionNo}.`, "success");
  }

  function loadRecordAtIndex(idx) {
    if (idx < 0 || idx >= state.savedRecords.length) return;
    if (state.isDirty && !window.confirm("Discard unsaved changes and load another record?")) {
      return;
    }
    state.currentIndex = idx;
    state.form = clone(state.savedRecords[idx]);
    state.mode = "Display";
    state.isDirty = false;
    populateFormFromState();
  }

  function startNewRecord() {
    if (state.isDirty && !window.confirm("Discard unsaved changes and start a new summary?")) {
      return;
    }
    state.form = createEmptyRecord();
    state.mode = "Insert";
    state.isDirty = false;
    populateFormFromState();
    switchStep(1);
    document.getElementById("admissionNo").focus();
    showToast("Ready for new NICU discharge summary.", "info");
  }

  function clearCurrentForm() {
    if (!window.confirm("Clear all fields in the current form?")) return;
    state.form = createEmptyRecord();
    state.mode = "Insert";
    state.isDirty = false;
    populateFormFromState();
    switchStep(1);
    showToast("Form cleared.", "info");
  }

  // =========================================================================
  // Print Preview & Clinical Report Generation
  // =========================================================================
  function buildPrintPreview() {
    readFormIntoState();
    const d = state.form;
    const sheet = document.getElementById("print-sheet");
    sheet.innerHTML = "";

    // Header
    sheet.appendChild(
      el("div", { className: "doc-header" }, [
        el("div", {}, [
          el("h2", { className: "doc-hospital", textContent: "Department of Neonatology & NICU" }),
          el("p", { className: "doc-dept", textContent: "Inpatient EMR • Clinical Discharge Summary Report" })
        ]),
        el("div", { className: "doc-title-badge", textContent: "NICU Discharge Summary" })
      ])
    );

    // Demographics Grid
    const metaItems = [
      ["Patient Name", d.patientName || "—"],
      ["Admission No", d.admissionNo || "—"],
      ["HN (Hospital No)", d.hn || "—"],
      ["Age", d.age || "—"],
      ["Child Gender / Blood", `${d.childGender || "—"} / ${d.childBloodGroup || "—"}`],
      ["Bed", d.bed || "—"],
      ["Admission Date", formatDisplayDate(d.admissionDate)],
      ["Discharge Date", formatDisplayDate(d.dischargeDate)],
      ["Discharge Type", d.dischargeType || "—"],
      ["Birth / Discharge Wt.", `${d.birthWeight || "—"} kg → ${d.dischargeWeight || "—"} kg`],
      ["OFC (Adm / D/C)", `${d.ofcAdmission || "—"} cm / ${d.ofcDischarge || "—"} cm`],
      ["Delivery Date & Hr", `${formatDisplayDate(d.deliveryDate)} ${d.deliveryHour || ""}`]
    ];

    const metaGrid = el("div", { className: "doc-meta-grid" });
    metaItems.forEach(([k, v]) => {
      metaGrid.appendChild(
        el("div", { className: "doc-meta-item" }, [
          el("strong", { textContent: `${k}: ` }),
          el("span", { textContent: v })
        ])
      );
    });
    sheet.appendChild(metaGrid);

    // Clinical Sections
    const clinicalSections = [
      ["Diagnosis", d.diagnosis],
      ["Chief Complaint", d.chiefComplaint],
      ["Case Summary", d.caseSummary],
      ["Investigations Done", d.investigationDone],
      ["Treatment In Hospital", d.treatmentInHospital]
    ];

    clinicalSections.forEach(([title, content]) => {
      if (!content || !content.trim()) return;
      sheet.appendChild(
        el("section", { className: "doc-section" }, [
          el("h3", { className: "doc-section-title", textContent: title }),
          el("p", { className: "doc-text", textContent: content })
        ])
      );
    });

    // Medications Table
    const activeMeds = (d.medications || []).filter((m) => m.name || m.medicineNo);
    const medSec = el("section", { className: "doc-section" }, [
      el("h3", {
        className: "doc-section-title",
        textContent: `Medication on Discharge (${d.ageComments || "Standard Neonatal"})`
      })
    ]);

    if (activeMeds.length > 0) {
      const tbl = el("table", { className: "doc-table" });
      const thead = el("thead", {}, [
        el("tr", {}, [
          el("th", { textContent: "SL" }),
          el("th", { textContent: "Medicine" }),
          el("th", { textContent: "Strength" }),
          el("th", { textContent: "Qty" }),
          el("th", { textContent: "Duration" }),
          el("th", { textContent: "Instructions (বাংলা / English)" })
        ])
      ]);
      const tbody = el("tbody");
      activeMeds.forEach((m, i) => {
        const instr = [m.instructionsBn, m.instructionsEn].filter(Boolean).join(" • ");
        tbody.appendChild(
          el("tr", {}, [
            el("td", { textContent: String(i + 1) }),
            el("td", { textContent: m.name || m.medicineNo }),
            el("td", { textContent: m.strength || "—" }),
            el("td", { textContent: m.qty || "—" }),
            el("td", { textContent: m.duration || "—" }),
            el("td", { className: "font-bangla", textContent: instr || "—" })
          ])
        );
      });
      tbl.appendChild(thead);
      tbl.appendChild(tbody);
      medSec.appendChild(tbl);
    } else {
      medSec.appendChild(el("p", { className: "doc-text", textContent: "No discharge medications prescribed." }));
    }
    sheet.appendChild(medSec);

    // Advices
    if (d.advices && d.advices.length > 0) {
      const advSec = el("section", { className: "doc-section" }, [
        el("h3", { className: "doc-section-title", textContent: "Discharge Advice (পরামর্শ)" })
      ]);
      const ol = el("ol", { className: "doc-advice-list font-bangla" });
      d.advices.forEach((a) => {
        const line = a.adviceBangla
          ? `${a.adviceBangla}${a.adviceEnglish ? ` (${a.adviceEnglish})` : ""}`
          : a.adviceEnglish;
        if (line) ol.appendChild(el("li", { textContent: line }));
      });
      advSec.appendChild(ol);
      sheet.appendChild(advSec);
    }

    // Signatures
    sheet.appendChild(
      el("div", { className: "doc-signatures" }, [
        el("div", { className: "doc-sig-box" }, [
          el("strong", { textContent: d.registerName || "Register / MO" }),
          el("div", { textContent: `Register / AR(CA) / MO (ID: ${d.registerId || "—"})` })
        ]),
        el("div", { className: "doc-sig-box" }, [
          el("strong", { textContent: d.consultantName || d.consultantBy || "Consultant" }),
          el("div", { textContent: `Consultant Neonatologist (ID: ${d.consultantId || "—"})` })
        ])
      ])
    );

    openModal("modal-preview");
  }

  // =========================================================================
  // Live Clock & Consultant Datalist
  // =========================================================================
  function startClock() {
    const update = () => {
      const now = new Date();
      const dateStr = now.toLocaleDateString("en-GB");
      const timeStr = now.toLocaleTimeString("en-US", {
        weekday: "short",
        hour: "2-digit",
        minute: "2-digit"
      });
      document.getElementById("live-date").textContent = dateStr;
      document.getElementById("live-time").textContent = timeStr;
    };
    update();
    setInterval(update, 30000);
  }

  function initConsultantSuggestions() {
    const dl = document.getElementById("consultant-suggestions");
    CONSULTANTS.forEach((c) => {
      dl.appendChild(el("option", { value: c.name, label: `${c.id} — ${c.title}` }));
    });
  }

  // =========================================================================
  // Event Wiring
  // =========================================================================
  function bindEvents() {
    // Field change tracking
    FIELD_IDS.forEach((id) => {
      const input = document.getElementById(id);
      if (!input) return;
      input.addEventListener("input", () => {
        state.form[id] = input.value;
        input.classList.remove("is-invalid");
        markDirty();
        if (["patientName", "admissionNo", "hn", "bed", "age", "birthWeight", "dischargeWeight"].includes(id)) {
          updatePatientContextStrip();
          updateWeightDeltaBadge();
        }
      });
    });

    // Admission No F9 shortcut
    document.getElementById("admissionNo").addEventListener("keydown", (e) => {
      if (e.key === "F9") {
        e.preventDefault();
        openPatientLov();
      }
    });

    // Consultant name auto-fill ID when matched
    document.getElementById("consultantName").addEventListener("change", (e) => {
      const match = CONSULTANTS.find((c) => c.name === e.target.value);
      if (match) {
        document.getElementById("consultantId").value = match.id;
        state.form.consultantId = match.id;
      }
    });

    document.getElementById("btn-pick-consultant").addEventListener("click", () => {
      const current = document.getElementById("consultantName").value;
      const idx = CONSULTANTS.findIndex((c) => c.name === current);
      const next = CONSULTANTS[(idx + 1) % CONSULTANTS.length];
      document.getElementById("consultantId").value = next.id;
      document.getElementById("consultantName").value = next.name;
      state.form.consultantId = next.id;
      state.form.consultantName = next.name;
      markDirty();
      showToast(`Assigned consultant: ${next.name}`, "info");
    });

    // Stepper & Navigation
    document.getElementById("tab-step1").addEventListener("click", () => switchStep(1));
    document.getElementById("tab-step2").addEventListener("click", () => switchStep(2));
    document.getElementById("btn-to-step2").addEventListener("click", () => switchStep(2));
    document.getElementById("btn-back-step1").addEventListener("click", () => switchStep(1));

    // Toolbar & Form Actions
    document.getElementById("tb-new").addEventListener("click", startNewRecord);
    document.getElementById("tb-save").addEventListener("click", saveRecord);
    document.getElementById("tb-find-patient").addEventListener("click", openPatientLov);
    document.getElementById("btn-lov-patient").addEventListener("click", openPatientLov);
    document.getElementById("tb-preview").addEventListener("click", buildPrintPreview);
    document.getElementById("tb-print").addEventListener("click", () => {
      buildPrintPreview();
      setTimeout(() => window.print(), 150);
    });
    document.getElementById("tb-help").addEventListener("click", () => openModal("modal-help"));
    document.getElementById("btn-messages").addEventListener("click", () => {
      showToast("No unread hospital HIS notifications.", "info");
    });

    document.getElementById("nav-first").addEventListener("click", () => loadRecordAtIndex(0));
    document.getElementById("nav-prev").addEventListener("click", () => loadRecordAtIndex(state.currentIndex - 1));
    document.getElementById("nav-next").addEventListener("click", () => loadRecordAtIndex(state.currentIndex + 1));
    document.getElementById("nav-last").addEventListener("click", () => loadRecordAtIndex(state.savedRecords.length - 1));

    // Step 2 buttons
    document.getElementById("btn-add-med-lov").addEventListener("click", () => openMedicineLov(null));
    document.getElementById("btn-add-med-row").addEventListener("click", () => {
      state.form.medications.push(createEmptyMed());
      markDirty();
      renderMedicationsTable();
    });

    document.getElementById("btn-lov-advice").addEventListener("click", openAdviceLov);
    document.getElementById("btn-suggest-age-advice").addEventListener("click", autoSuggestAdviceByAge);
    document.getElementById("btn-add-custom-advice").addEventListener("click", () => {
      state.form.advices.push({ adviceId: `C-${Date.now()}`, adviceEnglish: "", adviceBangla: "" });
      markDirty();
      renderAdviceList();
    });

    document.getElementById("btn-step1-clear").addEventListener("click", clearCurrentForm);
    document.getElementById("btn-clear").addEventListener("click", clearCurrentForm);
    document.getElementById("btn-preview").addEventListener("click", buildPrintPreview);
    document.getElementById("btn-report").addEventListener("click", () => {
      buildPrintPreview();
      setTimeout(() => window.print(), 150);
    });
    document.getElementById("btn-preview-print").addEventListener("click", () => window.print());

    document.getElementById("btn-exit").addEventListener("click", () => {
      if (state.isDirty && !window.confirm("You have unsaved changes. Exit and reset to saved record?")) {
        return;
      }
      loadRecordAtIndex(0);
      switchStep(1);
      showToast("Session reset to saved display mode.", "info");
    });

    document.getElementById("discharge-form").addEventListener("submit", (e) => {
      e.preventDefault();
      saveRecord();
    });

    // Patient LOV search & keyboard
    const pSearch = document.getElementById("patient-lov-search");
    pSearch.addEventListener("input", () => filterPatientLov(pSearch.value));
    document.getElementById("patient-lov-find-btn").addEventListener("click", () => filterPatientLov(pSearch.value));
    document.getElementById("patient-lov-ok").addEventListener("click", () => {
      confirmPatientSelection(state.filteredPatients[state.selectedPatientLovIndex]);
    });
    pSearch.addEventListener("keydown", (e) => handleLovListKeydown(e, "patient"));

    // Medicine LOV search & keyboard
    const mSearch = document.getElementById("med-lov-search");
    mSearch.addEventListener("input", () => filterMedicineLov(mSearch.value));
    document.getElementById("med-lov-find-btn").addEventListener("click", () => filterMedicineLov(mSearch.value));
    document.getElementById("med-lov-ok").addEventListener("click", () => {
      confirmMedicineSelection(state.filteredMedicines[state.selectedMedLovIndex]);
    });
    mSearch.addEventListener("keydown", (e) => handleLovListKeydown(e, "medicine"));

    // Advice LOV search & select all
    const aSearch = document.getElementById("advice-lov-search");
    aSearch.addEventListener("input", () => filterAdviceLov(aSearch.value));
    document.getElementById("advice-lov-find-btn").addEventListener("click", () => filterAdviceLov(aSearch.value));
    document.getElementById("advice-lov-ok").addEventListener("click", confirmAdviceSelections);
    document.getElementById("advice-select-all").addEventListener("change", (e) => {
      document.querySelectorAll(".advice-lov-check").forEach((cb) => {
        cb.checked = e.target.checked;
      });
    });

    // Modal close buttons & backdrop clicks
    document.querySelectorAll("[data-close-modal]").forEach((btn) => {
      btn.addEventListener("click", () => closeModal(btn.dataset.closeModal));
    });
    document.querySelectorAll(".modal-backdrop").forEach((backdrop) => {
      backdrop.addEventListener("click", (e) => {
        if (e.target === backdrop) backdrop.classList.add("hidden");
      });
    });

    // Global keyboard shortcuts
    document.addEventListener("keydown", (e) => {
      if (e.key === "Escape") {
        closeAllModals();
        return;
      }
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === "s") {
        e.preventDefault();
        saveRecord();
        return;
      }
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === "p") {
        e.preventDefault();
        buildPrintPreview();
        return;
      }
      if (e.altKey && e.key === "1") {
        e.preventDefault();
        switchStep(1);
      } else if (e.altKey && e.key === "2") {
        e.preventDefault();
        switchStep(2);
      } else if (e.key === "F1") {
        e.preventDefault();
        openModal("modal-help");
      }
    });
  }

  function handleLovListKeydown(e, type) {
    const list = type === "patient" ? state.filteredPatients : state.filteredMedicines;
    if (list.length === 0) return;

    if (e.key === "ArrowDown") {
      e.preventDefault();
      if (type === "patient") {
        state.selectedPatientLovIndex = Math.min(list.length - 1, state.selectedPatientLovIndex + 1);
        renderPatientLovTable();
      } else {
        state.selectedMedLovIndex = Math.min(list.length - 1, state.selectedMedLovIndex + 1);
        renderMedicineLovTable();
      }
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      if (type === "patient") {
        state.selectedPatientLovIndex = Math.max(0, state.selectedPatientLovIndex - 1);
        renderPatientLovTable();
      } else {
        state.selectedMedLovIndex = Math.max(0, state.selectedMedLovIndex - 1);
        renderMedicineLovTable();
      }
    } else if (e.key === "Enter") {
      e.preventDefault();
      if (type === "patient") {
        confirmPatientSelection(list[state.selectedPatientLovIndex]);
      } else {
        confirmMedicineSelection(list[state.selectedMedLovIndex]);
      }
    }
  }

  // =========================================================================
  // Initialization
  // =========================================================================
  function init() {
    state.savedRecords = loadSavedRecords();
    state.currentIndex = 0;
    state.form = clone(state.savedRecords[0]);
    initConsultantSuggestions();
    startClock();
    bindEvents();
    populateFormFromState();
  }

  document.addEventListener("DOMContentLoaded", init);
})();
