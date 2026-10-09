const state = {
  safetyFlags: new Set(),
  selectedIds: new Set(),
  steps: [],
  answers: {},
  current: 0,
};

const LEVEL_ORDER = { green: 0, amber: 1, red: 2, emergency: 3 };
const LEVEL_LABEL = { green: "Green", amber: "Amber", red: "Red", emergency: "Emergency" };

const $ = (id) => document.getElementById(id);

const worse = (a, b) => (LEVEL_ORDER[b] > LEVEL_ORDER[a] ? b : a);

function showScreen(name) {
  document.querySelectorAll(".screen").forEach((s) => s.classList.remove("active"));
  $("screen-" + name).classList.add("active");
  window.scrollTo(0, 0);
}

function telLink(number) {
  return "tel:" + number.replace(/[^\d+]/g, "");
}

function fillContactDetails() {
  document.querySelectorAll("[data-hospital-name]").forEach((el) => (el.textContent = CONFIG.hospitalName));
  document.querySelectorAll("[data-ctcae-version]").forEach((el) => (el.textContent = CONFIG.ctcaeVersion));
  document.querySelectorAll("[data-hospital-phone]").forEach((el) => {
    el.textContent = CONFIG.hospitalPhone;
    el.href = telLink(CONFIG.hospitalPhone);
  });
  document.querySelectorAll("[data-emergency-number]").forEach((el) => {
    el.textContent = CONFIG.emergencyNumber;
    el.href = telLink(CONFIG.emergencyNumber);
  });
}

/* ---------- Welcome ---------- */

$("agree").addEventListener("change", (e) => {
  $("btn-start").disabled = !e.target.checked;
});

$("btn-start").addEventListener("click", () => {
  renderSafetyList();
  showScreen("safety");
});

/* ---------- Safety check ---------- */

function renderSafetyList() {
  const list = $("safety-list");
  list.innerHTML = "";

  SAFETY_CHECKS.forEach((item) => {
    const label = document.createElement("label");
    label.className = "check-item";

    const input = document.createElement("input");
    input.type = "checkbox";
    input.checked = state.safetyFlags.has(item.id);

    const text = document.createElement("span");
    text.textContent = item.text;

    input.addEventListener("change", () => {
      if (input.checked) state.safetyFlags.add(item.id);
      else state.safetyFlags.delete(item.id);
      label.classList.toggle("selected", input.checked);
      updateSafetyButton();
    });

    label.classList.toggle("selected", input.checked);
    label.append(input, text);
    list.append(label);
  });

  updateSafetyButton();
}

function updateSafetyButton() {
  $("btn-safety-next").textContent = state.safetyFlags.size > 0 ? "Continue" : "None of these";
}

$("btn-safety-back").addEventListener("click", () => showScreen("welcome"));

$("btn-safety-next").addEventListener("click", () => {
  if (state.safetyFlags.size > 0) {
    showResult();
  } else {
    renderSymptomGrid();
    showScreen("symptoms");
  }
});

/* ---------- Symptom selection ---------- */

function renderSymptomGrid() {
  const grid = $("symptom-grid");
  grid.innerHTML = "";

  SYMPTOMS.forEach((symptom) => {
    const button = document.createElement("button");
    button.type = "button";
    button.className = "symptom-card";
    button.innerHTML = `<span class="symptom-name">${symptom.name}</span>
      <span class="symptom-sub">${symptom.subtitle}</span>`;
    button.setAttribute("aria-pressed", state.selectedIds.has(symptom.id));

    button.addEventListener("click", () => {
      if (state.selectedIds.has(symptom.id)) state.selectedIds.delete(symptom.id);
      else state.selectedIds.add(symptom.id);
      button.setAttribute("aria-pressed", state.selectedIds.has(symptom.id));
      $("btn-symptoms-next").disabled = state.selectedIds.size === 0;
    });

    grid.append(button);
  });

  $("btn-symptoms-next").disabled = state.selectedIds.size === 0;
}

$("btn-symptoms-back").addEventListener("click", () => {
  renderSafetyList();
  showScreen("safety");
});

$("btn-symptoms-next").addEventListener("click", () => {
  state.steps = [];
  SYMPTOMS.filter((s) => state.selectedIds.has(s.id)).forEach((symptom) => {
    symptom.questions.forEach((_, qIndex) => state.steps.push({ symptom, qIndex }));
  });
  state.current = 0;
  renderQuestion();
  showScreen("question");
});

/* ---------- Questions ---------- */

const answerKey = (symptom, qIndex) => symptom.id + ":" + qIndex;

function hasAnswer(key) {
  const a = state.answers[key];
  return Array.isArray(a) ? a.length > 0 : a !== undefined;
}

function renderQuestion() {
  const { symptom, qIndex } = state.steps[state.current];
  const question = symptom.questions[qIndex];
  const key = answerKey(symptom, qIndex);
  const isMulti = question.type === "multi";
  const isLast = state.current === state.steps.length - 1;

  $("progress-fill").style.width = ((state.current + 1) / state.steps.length) * 100 + "%";
  $("question-count").textContent = `${symptom.name} · Question ${qIndex + 1} of ${symptom.questions.length}`;
  $("question-symptom").textContent = question.text;
  $("question-note").textContent = question.note || "";
  $("btn-question-next").textContent = isLast ? "See my result" : "Next";

  if (isMulti && !Array.isArray(state.answers[key])) state.answers[key] = [];

  const list = $("question-options");
  list.innerHTML = "";

  question.options.forEach((option, index) => {
    const label = document.createElement("label");
    label.className = "option";

    const input = document.createElement("input");
    input.type = isMulti ? "checkbox" : "radio";
    input.name = "answer";
    input.dataset.index = index;
    input.checked = isMulti ? state.answers[key].includes(index) : state.answers[key] === index;

    const text = document.createElement("span");
    text.textContent = option.text;

    input.addEventListener("change", () => {
      if (!isMulti) {
        state.answers[key] = index;
      } else {
        let chosen = state.answers[key].filter((i) => i !== index);
        if (input.checked) {
          const noneIndex = question.options.findIndex((o) => o.none);
          chosen = option.none ? [index] : chosen.filter((i) => i !== noneIndex).concat(index);
        }
        state.answers[key] = chosen;
      }
      syncOptions(list, key, isMulti);
    });

    label.append(input, text);
    list.append(label);
  });

  syncOptions(list, key, isMulti);
}

function syncOptions(list, key, isMulti) {
  list.querySelectorAll(".option").forEach((label) => {
    const input = label.querySelector("input");
    const index = Number(input.dataset.index);
    input.checked = isMulti ? state.answers[key].includes(index) : state.answers[key] === index;
    label.classList.toggle("selected", input.checked);
  });
  $("btn-question-next").disabled = !hasAnswer(key);
}

$("btn-question-back").addEventListener("click", () => {
  if (state.current === 0) {
    renderSymptomGrid();
    showScreen("symptoms");
  } else {
    state.current--;
    renderQuestion();
  }
});

$("btn-question-next").addEventListener("click", () => {
  if (state.current < state.steps.length - 1) {
    state.current++;
    renderQuestion();
    window.scrollTo(0, 0);
  } else {
    showResult();
  }
});

/* ---------- Scoring ---------- */

function assessSymptom(symptom) {
  let triage = "green";
  const grades = {};
  const tags = new Set();
  const findings = [];
  const warnings = [];

  symptom.questions.forEach((question, qIndex) => {
    const answer = state.answers[answerKey(symptom, qIndex)];
    const indices = Array.isArray(answer) ? answer : [answer];
    const term = question.ctcaeTerm === undefined ? symptom.ctcaeTerm : question.ctcaeTerm;

    indices.forEach((i) => {
      const option = question.options[i];
      if (!option) return;
      triage = worse(triage, option.triage);
      if (option.tag) tags.add(option.tag);
      if (term && option.grade !== null) grades[term] = Math.max(grades[term] || 0, option.grade);

      if (question.type === "multi") {
        if (!option.none) warnings.push(option);
      } else {
        findings.push({
          answer: question.label ? `<strong>${question.label}:</strong> ${option.text}` : option.text,
          triage: option.triage,
        });
      }
    });
  });

  const gradeList = Object.entries(grades).map(([term, grade]) => ({ term, grade }));

  (symptom.derived || []).forEach((rule) => {
    if (rule.when.every((t) => tags.has(t))) {
      gradeList.unshift({ term: rule.ctcaeTerm, grade: rule.grade });
      triage = worse(triage, rule.triage);
    }
  });

  return { symptom, triage, grades: gradeList, findings, warnings };
}

function computeResult() {
  const flags = SAFETY_CHECKS.filter((f) => state.safetyFlags.has(f.id));
  const assessments = flags.length > 0 ? [] : state.steps
    .filter((step) => step.qIndex === 0)
    .map((step) => assessSymptom(step.symptom));

  let level = [...flags.map((f) => f.level), ...assessments.map((a) => a.triage)].reduce(worse, "green");

  const amberCount = assessments.filter((a) => a.triage === "amber").length;
  const escalated = CONFIG.escalateMultipleAmber && level === "amber" && amberCount >= 2;
  if (escalated) level = "red";

  return { level, flags, assessments, escalated };
}

/* ---------- Result ---------- */

function showResult() {
  const { level, flags, assessments, escalated } = computeResult();
  const text = RESULT_MESSAGES[level];

  $("result-banner").className = "result-banner " + level;
  $("result-title").textContent = text.title;
  $("result-message").textContent = text.message;
  renderResultActions(level);

  $("result-escalation").textContent = escalated
    ? "You have two or more symptoms that each need attention. Together, they mean you should be seen urgently."
    : "";

  renderResultDetails(flags, assessments);
  renderSummary(flags, assessments);
  showScreen("result");
}

function renderResultActions(level) {
  const box = $("result-actions");
  const call = (label, number, cls) =>
    `<a class="btn ${cls}" href="${telLink(number)}">${label}</a>`;

  if (level === "emergency") {
    box.innerHTML =
      call(`Call ambulance ${CONFIG.emergencyNumber}`, CONFIG.emergencyNumber, "call-red") +
      call("Call hospital helpline", CONFIG.hospitalPhone, "call-outline");
  } else if (level === "red") {
    box.innerHTML =
      call("Call hospital helpline", CONFIG.hospitalPhone, "call-red") +
      call(`Very unwell? Call ${CONFIG.emergencyNumber}`, CONFIG.emergencyNumber, "call-outline");
  } else if (level === "amber") {
    box.innerHTML = call("Call hospital helpline", CONFIG.hospitalPhone, "call-amber");
  } else {
    box.innerHTML = "";
  }
}

const chip = (level) => `<span class="chip ${level}">${LEVEL_LABEL[level]}</span>`;

function renderResultDetails(flags, assessments) {
  const box = $("result-details");
  let html = "";

  if (flags.length > 0) {
    html += "<h3>You told us you have</h3><ul>";
    flags.forEach((f) => (html += `<li>${f.text}</li>`));
    html += "</ul>";
  }

  if (assessments.length > 0) {
    html += "<h3>Your symptoms</h3>";
    assessments.forEach(({ symptom, triage, findings, warnings }) => {
      html += `<div class="symptom-result">
        <h4>${chip(triage)}${symptom.name}</h4>
        <ul class="findings">
          ${findings.map((f) => `<li>${f.answer}</li>`).join("")}
          ${warnings.map((w) => `<li class="warning">${w.text}</li>`).join("")}
        </ul>`;
      if (triage === "green" && symptom.selfCare.length > 0) {
        html += `<p class="self-care-title">What you can do at home</p>
          <ul>${symptom.selfCare.map((tip) => `<li>${tip}</li>`).join("")}</ul>`;
      }
      html += "</div>";
    });

    if (assessments.some((a) => a.triage === "green")) {
      html += `<div class="notice">${GREEN_SAFETY_NET}</div>`;
    }
  }

  box.innerHTML = html;
}

function renderSummary(flags, assessments) {
  const rows = [
    ...flags.map((f) => ({
      name: "Emergency warning sign",
      grades: "—",
      findings: f.text,
      triage: f.level,
    })),
    ...assessments.map(({ symptom, triage, grades, findings, warnings }) => ({
      name: `${symptom.name}<span class="term">${symptom.subtitle}</span>`,
      grades: grades.length === 0
        ? "Not graded"
        : grades.map((g) => `${g.term}: <strong>${g.grade === null ? "Not graded" : "Grade " + g.grade}</strong>`).join("<br>"),
      findings: [
        ...findings.map((f) => f.answer),
        ...warnings.map((w) => `<span class="warning">${w.text}</span>`),
      ].join("<br>"),
      triage,
    })),
  ];

  $("summary-body").innerHTML = rows
    .map(
      (r) => `<tr>
        <td>${r.name}</td>
        <td>${r.grades}</td>
        <td>${r.findings}</td>
        <td>${chip(r.triage)}</td>
      </tr>`
    )
    .join("");

  $("summary-meta").textContent =
    "Completed on " + new Date().toLocaleString() + " · Grading based on " + CONFIG.ctcaeVersion;
}

$("btn-print").addEventListener("click", () => window.print());

$("btn-restart").addEventListener("click", () => {
  state.safetyFlags.clear();
  state.selectedIds.clear();
  state.steps = [];
  state.answers = {};
  state.current = 0;
  showScreen("welcome");
});

fillContactDetails();
