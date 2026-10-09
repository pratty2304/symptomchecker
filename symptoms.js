/*
  ============================================================
  MEDICAL CONTENT FILE
  ============================================================
  Everything clinical lives in this file: contact details,
  emergency warning signs, symptoms, questions, grading and advice.
  You can edit the text between quotes "..." safely.
  Keep the commas, brackets and quote marks in place.

  Triage levels:
    "green"     = manage at home with self-care
    "amber"     = call the care team / helpline today
    "red"       = contact the hospital and come in now
    "emergency" = call an ambulance

  How a symptom is scored:
    - Each symptom has several questions.
    - Each answer can carry a CTCAE grade (or null = not graded)
      and a triage level.
    - The symptom's triage is the WORST triage among its answers.
    - The CTCAE grade shown to the care team is the HIGHEST grade
      among answers for each CTCAE term.

  Question types:
    "single" = patient picks one answer
    "multi"  = patient ticks all that apply; an option marked
               none: true clears the others ("None of these")

  label: a short name for the question, shown in the result
  and the care-team summary (e.g. "Temperature: 38.0°C to 39.0°C").

  Tags: some answers have a tag (e.g. tag: "fever_38"). Tags are
  used by "derived" rules to add combined grades such as
  Febrile neutropenia (fever + low neutrophil count).
  ============================================================
*/

const CONFIG = {
  hospitalName: "Your Hospital Name",
  hospitalPhone: "+91 00000 00000",   // 24-hour oncology helpline
  emergencyNumber: "108",             // ambulance
  ctcaeVersion: "CTCAE v5.0",

  // If 2 or more symptoms are AMBER together, treat the overall
  // result as RED. Set to false to turn off.
  escalateMultipleAmber: true,
};

/* Emergency warning signs, asked before anything else */
const SAFETY_CHECKS = [
  { id: "chest_pain",   level: "emergency", text: "Chest pain or tightness" },
  { id: "cant_breathe", level: "emergency", text: "Severe difficulty breathing, blue lips, or unable to speak in full sentences" },
  { id: "unconscious",  level: "emergency", text: "Fainting, collapse, a fit (seizure), or very hard to wake up" },
  { id: "confusion",    level: "emergency", text: "New confusion, or sudden weakness or numbness of the face, arm or leg" },
  { id: "heavy_bleed",  level: "emergency", text: "Heavy bleeding that will not stop, or vomiting blood" },
  { id: "allergy",      level: "emergency", text: "Swelling of the lips, tongue or throat" },
];

const SYMPTOMS = [
  /* ---------------------------------------------------------- */
  {
    id: "neutropenia",
    name: "Fever, chills or signs of infection",
    subtitle: "Possible low white cells (neutropenia)",
    ctcaeTerm: "Fever",
    questions: [
      {
        type: "single",
        text: "What is your temperature right now?",
        label: "Temperature",
        note: "Do not take paracetamol before speaking to your care team. It can hide a fever.",
        ctcaeTerm: "Fever",
        options: [
          { text: "Below 37.5°C", grade: null, triage: "green" },
          { text: "37.5°C to 37.9°C", grade: null, triage: "amber" },
          { text: "38.0°C to 39.0°C", grade: 1, triage: "red", tag: "fever_38" },
          { text: "39.1°C to 40.0°C", grade: 2, triage: "red", tag: "fever_38" },
          { text: "Above 40.0°C", grade: 3, triage: "red", tag: "fever_38" },
          { text: "I don't have a thermometer / I have not checked", grade: null, triage: "amber" },
        ],
      },
      {
        type: "single",
        text: "What did your most recent blood test say about your neutrophils (white cells that fight infection)?",
        label: "Last neutrophil count",
        note: "Your report may show this as ANC or Absolute Neutrophil Count.",
        ctcaeTerm: "Neutrophil count decreased",
        options: [
          { text: "Normal, or 1500/µL or above (1.5 × 10⁹/L)", grade: null, triage: "green" },
          { text: "1000 to 1499/µL (1.0 to 1.4 × 10⁹/L)", grade: 2, triage: "green" },
          { text: "500 to 999/µL (0.5 to 0.9 × 10⁹/L)", grade: 3, triage: "amber", tag: "anc_low" },
          { text: "Below 500/µL (below 0.5 × 10⁹/L)", grade: 4, triage: "amber", tag: "anc_low" },
          { text: "I was told it was low, but I don't know the number", grade: null, triage: "amber", tag: "anc_low" },
          { text: "I don't know", grade: null, triage: "green", tag: "anc_unknown" },
        ],
      },
      {
        type: "single",
        text: "When did you last have chemotherapy?",
        label: "Last chemotherapy",
        ctcaeTerm: null,
        options: [
          { text: "In the last 7 days", grade: null, triage: "green" },
          { text: "7 to 14 days ago", grade: null, triage: "green", tag: "nadir" },
          { text: "15 to 21 days ago", grade: null, triage: "green" },
          { text: "More than 21 days ago", grade: null, triage: "green" },
          { text: "I am not on chemotherapy", grade: null, triage: "green" },
        ],
      },
      {
        type: "multi",
        text: "Do you have any of these? Tick all that apply.",
        ctcaeTerm: null,
        options: [
          { text: "Shaking or shivering attacks (rigors), especially after a drip or line flush", grade: null, triage: "red" },
          { text: "Feeling generally unwell, flu-like, or very weak", grade: null, triage: "amber" },
          { text: "New cough, sore throat or runny nose", grade: null, triage: "amber" },
          { text: "Burning or pain when passing urine", grade: null, triage: "amber" },
          { text: "Redness, pain, swelling or discharge around a PICC line, port or wound", grade: null, triage: "amber" },
          { text: "None of these", none: true, grade: null, triage: "green" },
        ],
      },
    ],
    derived: [
      { when: ["fever_38", "anc_low"], ctcaeTerm: "Febrile neutropenia", grade: 3, triage: "red" },
      { when: ["fever_38", "anc_unknown"], ctcaeTerm: "Suspected febrile neutropenia (ANC not known)", grade: null, triage: "red" },
    ],
    selfCare: [
      "Check your temperature twice a day, and any time you feel hot, cold or unwell.",
      "Wash your hands often, especially before eating and after using the toilet.",
      "Avoid crowds and people who have a cough, cold or other infection.",
      "Eat freshly cooked food; avoid raw or undercooked meat, eggs and unwashed fruit.",
    ],
  },

  /* ---------------------------------------------------------- */
  {
    id: "mucositis",
    name: "Sore mouth or mouth ulcers",
    subtitle: "Oral mucositis",
    ctcaeTerm: "Oral mucositis",
    questions: [
      {
        type: "single",
        text: "How painful is your mouth?",
        label: "Mouth pain",
        options: [
          { text: "No pain or mild soreness", grade: 1, triage: "green" },
          { text: "Moderate pain; I need pain relief or a numbing mouthwash", grade: 2, triage: "amber" },
          { text: "Severe pain", grade: 3, triage: "red" },
        ],
      },
      {
        type: "single",
        text: "How are you managing to eat and drink?",
        label: "Eating and drinking",
        options: [
          { text: "I can eat and drink normally", grade: 1, triage: "green" },
          { text: "I need to eat soft or blended foods, but I am managing", grade: 2, triage: "amber" },
          { text: "I can only manage liquids, or very little", grade: 3, triage: "red" },
          { text: "I cannot swallow fluids or my own saliva", grade: 4, triage: "red" },
        ],
      },
      {
        type: "multi",
        text: "Do you have any of these? Tick all that apply.",
        ctcaeTerm: null,
        options: [
          { text: "White patches or a furry coating in the mouth (possible thrush)", grade: null, triage: "amber" },
          { text: "Bleeding from the mouth or gums that does not stop", grade: null, triage: "red" },
          { text: "Passing much less urine than usual, or feeling dizzy (dehydration)", grade: null, triage: "red" },
          { text: "Temperature of 38.0°C or higher", grade: null, triage: "red" },
          { text: "None of these", none: true, grade: null, triage: "green" },
        ],
      },
    ],
    selfCare: [
      "Rinse your mouth 4 to 6 times a day, after meals and at bedtime, with salt water or the mouthwash your team recommended.",
      "Use a soft toothbrush and keep dentures out as much as possible.",
      "Avoid spicy, sour, very hot or crunchy foods, alcohol and tobacco.",
      "Avoid mouthwashes that contain alcohol.",
      "Sip fluids often to keep your mouth moist.",
    ],
  },

  /* ---------------------------------------------------------- */
  {
    id: "diarrhoea",
    name: "Loose or watery stools",
    subtitle: "Diarrhoea",
    ctcaeTerm: "Diarrhea",
    questions: [
      {
        type: "single",
        text: "Compared to what is normal for you, how many extra times a day are you opening your bowels?",
        label: "Stools",
        note: "If you have a stoma, think about how much more output than usual you have.",
        options: [
          { text: "Up to 3 extra times a day (or a mild increase in stoma output)", grade: 1, triage: "green" },
          { text: "4 to 6 extra times a day (or a moderate increase in stoma output)", grade: 2, triage: "amber" },
          { text: "7 or more extra times a day (or a large increase in stoma output)", grade: 3, triage: "red" },
        ],
      },
      {
        type: "single",
        text: "How is it affecting your daily life?",
        label: "Daily life",
        options: [
          { text: "I can do my usual activities", grade: 1, triage: "green" },
          { text: "It is hard to do housework, cooking or go out", grade: 2, triage: "amber" },
          { text: "I need help to wash, dress or use the toilet, or I cannot control my bowels", grade: 3, triage: "red" },
        ],
      },
      {
        type: "multi",
        text: "Do you have any of these? Tick all that apply.",
        ctcaeTerm: null,
        options: [
          { text: "Blood in the stools, or black stools", grade: null, triage: "red" },
          { text: "Severe tummy pain or cramps", grade: null, triage: "red" },
          { text: "Feeling dizzy or faint when standing, or passing much less urine than usual", grade: null, triage: "red" },
          { text: "Temperature of 38.0°C or higher", grade: null, triage: "red" },
          { text: "I am on immunotherapy (for example pembrolizumab, nivolumab, atezolizumab)", grade: null, triage: "amber" },
          { text: "Diarrhoea for more than 24 hours despite anti-diarrhoea tablets", grade: null, triage: "amber" },
          { text: "None of these", none: true, grade: null, triage: "green" },
        ],
      },
    ],
    selfCare: [
      "Drink plenty of fluids: 8 to 10 glasses a day, including oral rehydration solution (ORS).",
      "Eat small, bland meals like rice, curd rice, banana, idli or toast.",
      "Avoid spicy, oily and high-fibre foods, milk, alcohol and caffeine.",
      "Only take anti-diarrhoea tablets if your care team has told you to.",
      "Keep the skin around your bottom clean and use a barrier cream.",
    ],
  },

  /* ---------------------------------------------------------- */
  {
    id: "vomiting",
    name: "Vomiting (being sick)",
    subtitle: "Vomiting",
    ctcaeTerm: "Vomiting",
    questions: [
      {
        type: "single",
        text: "How many times have you vomited in the last 24 hours?",
        label: "Vomiting in 24 hours",
        note: "Count vomits that are at least 5 minutes apart as separate times.",
        options: [
          { text: "1 to 2 times", grade: 1, triage: "green" },
          { text: "3 to 5 times", grade: 2, triage: "amber" },
          { text: "6 or more times", grade: 3, triage: "red" },
        ],
      },
      {
        type: "single",
        text: "Can you keep fluids down?",
        label: "Fluids",
        options: [
          { text: "Yes, I am drinking almost normally", grade: 1, triage: "green" },
          { text: "Only small sips; much less than usual", grade: 2, triage: "amber" },
          { text: "No, I cannot keep any fluids down", grade: 3, triage: "red" },
        ],
      },
      {
        type: "single",
        text: "Are your anti-sickness medicines helping?",
        label: "Anti-sickness medicines",
        ctcaeTerm: null,
        options: [
          { text: "Yes, they are helping", grade: null, triage: "green" },
          { text: "No, they are not helping", grade: null, triage: "amber" },
          { text: "I cannot keep the tablets down", grade: null, triage: "amber" },
          { text: "I don't have any anti-sickness medicines", grade: null, triage: "amber" },
        ],
      },
      {
        type: "multi",
        text: "Do you have any of these? Tick all that apply.",
        ctcaeTerm: null,
        options: [
          { text: "Vomit that is green, or looks like coffee grounds", grade: null, triage: "red" },
          { text: "Severe tummy pain, or a swollen, hard tummy", grade: null, triage: "red" },
          { text: "Not opened my bowels or passed wind for 2 or more days", grade: null, triage: "red" },
          { text: "Feeling dizzy or faint, or passing much less urine than usual", grade: null, triage: "red" },
          { text: "Severe headache or blurred vision", grade: null, triage: "red" },
          { text: "None of these", none: true, grade: null, triage: "green" },
        ],
      },
    ],
    selfCare: [
      "Take your anti-sickness medicines regularly as prescribed, not only when you feel sick.",
      "Sip small amounts of fluid often: water, ORS, coconut water or clear soup.",
      "Try small, dry snacks like crackers or toast once the vomiting settles.",
      "Rest after eating and avoid lying flat straight after meals.",
      "Call your care team if vomiting continues for more than 24 hours.",
    ],
  },

  /* ---------------------------------------------------------- */
  {
    id: "breathless",
    name: "Shortness of breath",
    subtitle: "Dyspnoea",
    ctcaeTerm: "Dyspnea",
    questions: [
      {
        type: "single",
        text: "When do you feel short of breath?",
        label: "Breathless",
        options: [
          { text: "Only with moderate effort, like walking fast or climbing stairs", grade: 1, triage: "green" },
          { text: "With light effort, like walking slowly, talking or getting dressed", grade: 2, triage: "red" },
          { text: "Even when resting", grade: 3, triage: "red" },
        ],
      },
      {
        type: "single",
        text: "Is this new or different from usual?",
        label: "Onset",
        ctcaeTerm: null,
        options: [
          { text: "No, I have had this for a while and it has not changed", grade: null, triage: "green" },
          { text: "It is new, or has got worse over the last few days", grade: null, triage: "amber" },
          { text: "It started suddenly, within the last few hours", grade: null, triage: "red" },
        ],
      },
      {
        type: "multi",
        text: "Do you have any of these? Tick all that apply.",
        ctcaeTerm: null,
        options: [
          { text: "Coughing up blood", grade: null, triage: "red" },
          { text: "Pain, swelling or redness in one leg or arm", grade: null, triage: "red" },
          { text: "Temperature of 38.0°C or higher", grade: null, triage: "red" },
          { text: "Fast heartbeat or feeling faint", grade: null, triage: "red" },
          { text: "New cough, or cough with coloured phlegm", grade: null, triage: "amber" },
          { text: "I am on immunotherapy (for example pembrolizumab, nivolumab, atezolizumab)", grade: null, triage: "amber" },
          { text: "None of these", none: true, grade: null, triage: "green" },
        ],
      },
    ],
    selfCare: [
      "Pace yourself; rest between activities and sit down for tasks where you can.",
      "Sit upright or lean slightly forward to make breathing easier.",
      "Keep the room cool; a fan blowing gently on your face can help.",
      "Call your care team if your breathing gets worse or you develop a fever.",
    ],
  },

  /* ---------------------------------------------------------- */
  {
    id: "neuropathy",
    name: "Numbness, tingling or weakness in hands or feet",
    subtitle: "Peripheral neuropathy",
    ctcaeTerm: "Peripheral sensory neuropathy",
    questions: [
      {
        type: "single",
        text: "How much does the numbness or tingling affect you?",
        label: "Numbness/tingling",
        ctcaeTerm: "Peripheral sensory neuropathy",
        options: [
          { text: "I notice it, but it does not affect what I can do", grade: 1, triage: "green" },
          { text: "It makes tasks like buttoning clothes, writing or holding a cup difficult", grade: 2, triage: "amber" },
          { text: "It is severe; I need help to wash, dress or eat", grade: 3, triage: "amber" },
        ],
      },
      {
        type: "single",
        text: "Do you have any weakness in your hands, arms or legs?",
        label: "Weakness",
        ctcaeTerm: "Peripheral motor neuropathy",
        options: [
          { text: "No weakness", grade: null, triage: "green" },
          { text: "Mild weakness that I notice but does not affect what I can do", grade: 1, triage: "green" },
          { text: "Weakness that makes daily tasks hard, like climbing stairs or opening jars, or I trip or drop things", grade: 2, triage: "amber" },
          { text: "Severe weakness; I need help or a walking aid to walk or stand", grade: 3, triage: "red" },
        ],
      },
      {
        type: "single",
        text: "Do you have burning, shooting or electric-shock-like pain?",
        label: "Nerve pain",
        ctcaeTerm: null,
        options: [
          { text: "No", grade: null, triage: "green" },
          { text: "Yes, but it is mild", grade: null, triage: "green" },
          { text: "Yes, and it affects my sleep or daily life", grade: null, triage: "amber" },
        ],
      },
      {
        type: "multi",
        text: "Do you have any of these? Tick all that apply.",
        ctcaeTerm: null,
        options: [
          { text: "Weakness in the legs that came on suddenly or is getting worse quickly", grade: null, triage: "red" },
          { text: "New difficulty controlling your bladder or bowels", grade: null, triage: "red" },
          { text: "Numbness around your bottom or between your legs", grade: null, triage: "red" },
          { text: "New back pain together with numbness or weakness", grade: null, triage: "red" },
          { text: "Dizziness when standing up", grade: null, triage: "amber" },
          { text: "Severe constipation (no bowel movement for 3 or more days)", grade: null, triage: "amber" },
          { text: "None of these", none: true, grade: null, triage: "green" },
        ],
      },
    ],
    selfCare: [
      "Protect your hands and feet: wear gloves for housework and well-fitting shoes at all times.",
      "Test bath water with your elbow or a thermometer before getting in.",
      "Check your feet every day for cuts, blisters or sores.",
      "Keep floors clear and use night lights to avoid falls.",
      "Tell your care team about these symptoms before your next treatment.",
    ],
  },
];

/* Wording for the final result screen */
const RESULT_MESSAGES = {
  emergency: {
    title: "Call an ambulance now",
    message: "You have a warning sign that needs emergency care. Call an ambulance straight away. Do not drive yourself.",
  },
  red: {
    title: "Come to the hospital now",
    message: "Your answers suggest you need to be seen urgently. Call the hospital helpline to tell them you are coming, then go to the Emergency Department straight away. Do not drive yourself.",
  },
  amber: {
    title: "Call your care team today",
    message: "Your answers suggest you should speak to your care team within the next few hours. Please call the hospital helpline. If you start to feel worse before then, come to the hospital.",
  },
  green: {
    title: "You can manage this at home for now",
    message: "Your symptoms are mild. Follow the self-care advice below and keep checking how you feel.",
  },
};

const GREEN_SAFETY_NET = "Call your care team if your symptoms get worse, do not improve within 24 to 48 hours, or if you develop a temperature of 38.0°C or higher.";
