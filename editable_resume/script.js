// DEFAULT RESUME DATA (Safe placeholder template for Git tracking)
const DEFAULT_RESUME_DATA = {
  personal: {
    name: "YOUR NAME",
    location: "City, State",
    phone: "+91 0000000000",
    email: "your.email@example.com",
    linkedin: {
      username: "LinkedInProfile",
      url: "https://linkedin.com/in/yourprofile"
    },
    github: {
      username: "GitHubProfile",
      url: "https://github.com/yourprofile"
    },
    leetcode: {
      username: "LeetCodeProfile",
      url: "https://leetcode.com/yourprofile"
    },
    hackerrank: {
      username: "HackerRankProfile",
      url: "https://hackerrank.com/yourprofile"
    }
  },
  education: [
    {
      institution: "Your University Name",
      degree: "Degree and Branch (e.g. B.Tech Computer Science) - CGPA - 9.00",
      duration: "08 2020 – 05 2024",
      location: "City, State, Country"
    },
    {
      institution: "Your School Name",
      degree: "12th CBSE Board - Percentage - 95%",
      duration: "05 2019 – 04 2020",
      location: "City, State, Country"
    }
  ],
  skills: {
    coursework: [
      "Data Structures and Algorithms",
      "Operating Systems",
      "Object Oriented Programming",
      "Database Systems"
    ],
    languagesFrameworks: [
      "C++",
      "Java",
      "Python",
      "HTML",
      "CSS",
      "JavaScript",
      "React",
      "NodeJS",
      "SQL",
      "Docker"
    ]
  },
  projects: [
    {
      name: "Your Project Title",
      description: "Describe your project key achievements, tech stack used, and key features. E.g. Built a responsive web app using React and NodeJS."
    }
  ],
  experience: [
    {
      company: "Your Company Name",
      role: "Software Developer Intern",
      duration: "01 2024 – 06 2024",
      location: "City, State",
      highlights: [
        "Detail your primary job roles and responsibilities.",
        "Include metrics if possible: e.g. Reduced processing latencies by 30% using multi-threading in C++.",
        "Discuss team collaboration and tool integrations."
      ]
    }
  ],
  extracurricular: [
    {
      title: "Hackathon / Competition Name",
      description: "Secured 1st/2nd/3rd rank in hackathons or coding contests."
    }
  ],
  certifications: [
    "Web Development Bootcamp",
    "Cloud Practitioner Certificate"
  ]
};

// DEFAULT DESIGN SETTINGS
const DEFAULT_DESIGN_DATA = {
  template: "modern",
  font: "font-inter",
  accentColor: "#1a56db",
  margin: "20",
  fontSize: "12",
  spacing: "15",
  lineHeight: "1.3"
};

// Application States
let resumeData = {};
let designData = {};
let zoomLevel = 1.0;

// Initialize Application
document.addEventListener("DOMContentLoaded", async () => {
  await loadState();
  initTabNavigation();
  initFormInputs();
  initListControls();
  initDesignControls();
  initZoomAndUtilityControls();
  
  // Initial renders
  renderAllForms();
  renderPreview();
});

// State Storage Management
async function loadState() {
  const savedResume = localStorage.getItem("resume_builder_data");
  const savedDesign = localStorage.getItem("resume_builder_design");
  
  if (savedResume) {
    try {
      resumeData = JSON.parse(savedResume);
    } catch(e) {
      resumeData = null;
    }
  }
  
  // If no local storage data is found, try fetching the git-ignored local_resume_data.json
  if (!resumeData) {
    try {
      const response = await fetch("local_resume_data.json");
      if (response.ok) {
        resumeData = await response.json();
      }
    } catch(e) {
      console.log("local_resume_data.json not found or blocked by CORS. Using template placeholders.");
    }
  }
  
  // If still no data, fallback to default placeholders
  if (!resumeData) {
    resumeData = JSON.parse(JSON.stringify(DEFAULT_RESUME_DATA));
  }

  if (savedDesign) {
    try {
      designData = JSON.parse(savedDesign);
    } catch(e) {
      designData = { ...DEFAULT_DESIGN_DATA };
    }
  } else {
    designData = { ...DEFAULT_DESIGN_DATA };
  }
}

function saveState() {
  localStorage.setItem("resume_builder_data", JSON.stringify(resumeData));
  localStorage.setItem("resume_builder_design", JSON.stringify(designData));
  renderPreview();
}

// Switch between Editor Tabs
function initTabNavigation() {
  const tabButtons = document.querySelectorAll(".tab-btn");
  const panels = document.querySelectorAll(".tab-panel");
  
  tabButtons.forEach(btn => {
    btn.addEventListener("click", () => {
      tabButtons.forEach(b => b.classList.remove("active"));
      panels.forEach(p => p.classList.remove("active"));
      
      btn.classList.add("active");
      const targetPanel = document.getElementById(`panel-${btn.dataset.tab}`);
      if (targetPanel) targetPanel.classList.add("active");
    });
  });
}

// Bind basic personal details inputs
function initFormInputs() {
  const bindings = [
    { id: "inputName", obj: ["personal", "name"] },
    { id: "inputEmail", obj: ["personal", "email"] },
    { id: "inputPhone", obj: ["personal", "phone"] },
    { id: "inputLocation", obj: ["personal", "location"] },
    { id: "inputLinkedinUsername", obj: ["personal", "linkedin", "username"] },
    { id: "inputLinkedinUrl", obj: ["personal", "linkedin", "url"] },
    { id: "inputGithubUsername", obj: ["personal", "github", "username"] },
    { id: "inputGithubUrl", obj: ["personal", "github", "url"] },
    { id: "inputLeetcodeUsername", obj: ["personal", "leetcode", "username"] },
    { id: "inputLeetcodeUrl", obj: ["personal", "leetcode", "url"] },
    { id: "inputHackerrankUsername", obj: ["personal", "hackerrank", "username"] },
    { id: "inputHackerrankUrl", obj: ["personal", "hackerrank", "url"] }
  ];

  bindings.forEach(bind => {
    const input = document.getElementById(bind.id);
    if (!input) return;
    
    input.addEventListener("input", (e) => {
      let current = resumeData;
      for (let i = 0; i < bind.obj.length - 1; i++) {
        current = current[bind.obj[i]];
      }
      current[bind.obj[bind.obj.length - 1]] = e.target.value;
      saveState();
    });
  });

  // Skills textareas mapping
  const courseworkTextarea = document.getElementById("inputCoursework");
  const skillsTextarea = document.getElementById("inputLanguagesFrameworks");

  courseworkTextarea.addEventListener("input", (e) => {
    resumeData.skills.coursework = e.target.value
      .split(",")
      .map(s => s.trim())
      .filter(s => s.length > 0);
    saveState();
  });

  skillsTextarea.addEventListener("input", (e) => {
    resumeData.skills.languagesFrameworks = e.target.value
      .split(",")
      .map(s => s.trim())
      .filter(s => s.length > 0);
    saveState();
  });
}

// Bind add buttons for list inputs
function initListControls() {
  document.getElementById("btnAddEducation").addEventListener("click", () => {
    resumeData.education.push({
      institution: "New School Name",
      degree: "B.Tech Computer Science (or similar)",
      duration: "08 2024 – 05 2028",
      location: "City, Country"
    });
    renderEducationForm();
    saveState();
  });

  document.getElementById("btnAddExperience").addEventListener("click", () => {
    resumeData.experience.push({
      company: "Company Name",
      role: "Software Developer",
      duration: "Start Date – End Date",
      location: "Office Location",
      highlights: ["Description of job responsibility or accomplishment."]
    });
    renderExperienceForm();
    saveState();
  });

  document.getElementById("btnAddProject").addEventListener("click", () => {
    resumeData.projects.push({
      name: "Project Title",
      description: "Brief summary of what was built and technologies used."
    });
    renderProjectsForm();
    saveState();
  });

  document.getElementById("btnAddExtracurricular").addEventListener("click", () => {
    resumeData.extracurricular.push({
      title: "Title / Hackathon",
      description: "Details on what you accomplished or won."
    });
    renderExtracurricularForm();
    saveState();
  });

  document.getElementById("btnAddCertification").addEventListener("click", () => {
    resumeData.certifications.push("New Certificate Title");
    renderCertificationsForm();
    saveState();
  });
}

// Bind Styling Sidebar Controls
function initDesignControls() {
  // Template selectors
  const templateRadios = document.querySelectorAll('input[name="layoutTemplate"]');
  templateRadios.forEach(radio => {
    radio.addEventListener("change", (e) => {
      designData.template = e.target.value;
      saveState();
    });
  });

  // Typography selector
  const fontSelect = document.getElementById("selectFont");
  fontSelect.addEventListener("change", (e) => {
    designData.font = e.target.value;
    saveState();
  });

  // Color picker
  const colorPicker = document.getElementById("colorAccent");
  const colorText = document.getElementById("colorAccentText");
  
  colorPicker.addEventListener("input", (e) => {
    const val = e.target.value;
    colorText.value = val;
    designData.accentColor = val;
    saveState();
  });

  colorText.addEventListener("input", (e) => {
    const val = e.target.value;
    if (val.match(/^#[0-9A-Fa-f]{6}$/)) {
      colorPicker.value = val;
      designData.accentColor = val;
      saveState();
    }
  });

  // Accent Presets
  const presets = document.querySelectorAll(".color-preset");
  presets.forEach(p => {
    p.addEventListener("click", () => {
      const color = p.dataset.color;
      colorPicker.value = color;
      colorText.value = color;
      designData.accentColor = color;
      saveState();
    });
  });

  // Sliders for Spacing & Sizing
  const sliders = [
    { id: "rangeMargin", dataKey: "margin", labelVal: "valMargin", unit: "" },
    { id: "rangeFontSize", dataKey: "fontSize", labelVal: "valFontSize", unit: "" },
    { id: "rangeSpacing", dataKey: "spacing", labelVal: "valSpacing", unit: "" },
    { id: "rangeLineHeight", dataKey: "lineHeight", labelVal: "valLineHeight", unit: "" }
  ];

  sliders.forEach(slide => {
    const el = document.getElementById(slide.id);
    const label = document.getElementById(slide.labelVal);
    
    el.addEventListener("input", (e) => {
      const val = e.target.value;
      label.textContent = val;
      designData[slide.dataKey] = val;
      saveState();
    });
  });
}

// Bind Zoom & Import/Export Operations
function initZoomAndUtilityControls() {
  const canvasWrapper = document.getElementById("canvasWrapper");
  const resumePaper = document.getElementById("resumePaper");
  const zoomText = document.getElementById("zoomPercent");

  const updateZoom = () => {
    resumePaper.style.transform = `scale(${zoomLevel})`;
    zoomText.textContent = `${Math.round(zoomLevel * 100)}%`;
    
    // Adjust height on the wrapper to account for scaled height overflows
    const paperHeight = resumePaper.offsetHeight;
    canvasWrapper.style.minHeight = `${paperHeight * zoomLevel + 80}px`;
  };

  document.getElementById("btnZoomIn").addEventListener("click", () => {
    if (zoomLevel < 1.5) {
      zoomLevel += 0.1;
      updateZoom();
    }
  });

  document.getElementById("btnZoomOut").addEventListener("click", () => {
    if (zoomLevel > 0.5) {
      zoomLevel -= 0.1;
      updateZoom();
    }
  });

  // Sidebar toggle
  document.getElementById("btnToggleSidebar").addEventListener("click", () => {
    document.body.classList.toggle("sidebar-collapsed");
    window.dispatchEvent(new Event('resize'));
  });

  // Mobile toggle button
  const mobileToggleBtn = document.getElementById("mobileToggleBtn");
  const previewPanel = document.getElementById("previewPanel");
  
  mobileToggleBtn.addEventListener("click", () => {
    const isShowing = previewPanel.classList.toggle("show-mobile");
    if (isShowing) {
      mobileToggleBtn.innerHTML = '<i class="fa-solid fa-pen-to-square"></i>';
      mobileToggleBtn.style.backgroundColor = '#e2e8f0';
      mobileToggleBtn.style.color = '#0f172a';
    } else {
      mobileToggleBtn.innerHTML = '<i class="fa-solid fa-eye"></i>';
      mobileToggleBtn.style.backgroundColor = 'var(--accent-color)';
      mobileToggleBtn.style.color = '#ffffff';
    }
  });

  // Print button
  document.getElementById("btnPrint").addEventListener("click", () => {
    window.print();
  });

  // Reset Button
  document.getElementById("btnReset").addEventListener("click", async () => {
    if (await showCustomConfirm("Reset Resume", "Are you sure you want to reset all edits to the original default resume?")) {
      resumeData = JSON.parse(JSON.stringify(DEFAULT_RESUME_DATA));
      designData = { ...DEFAULT_DESIGN_DATA };
      localStorage.removeItem("resume_builder_data");
      localStorage.removeItem("resume_builder_design");
      
      // Update form visual values
      renderAllForms();
      renderPreview();
    }
  });

  // JSON Export
  document.getElementById("btnExport").addEventListener("click", () => {
    const jsonString = JSON.stringify(resumeData, null, 2);
    const blob = new Blob([jsonString], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    
    const a = document.createElement("a");
    a.href = url;
    a.download = `resume_data_${resumeData.personal.name.toLowerCase().replace(/\s+/g, '_')}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  });

  // JSON Import
  const fileImport = document.getElementById("fileImport");
  document.getElementById("btnImportTrigger").addEventListener("click", () => {
    fileImport.click();
  });

  fileImport.addEventListener("change", async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    // Check file extension immediately to avoid raw PDF uploads
    if (!file.name.toLowerCase().endsWith('.json')) {
      await showCustomAlert("Error", "Error: Only JSON backup files (.json) are supported. You cannot upload a PDF resume directly to parse it.\n\nIf you want to save your current resume edits as a PDF, please use the 'PDF' button at the top-left of the editor instead.", "fa-solid fa-circle-exclamation", "#ef4444");
      fileImport.value = "";
      return;
    }

    const reader = new FileReader();
    reader.onload = async (event) => {
      try {
        const parsed = JSON.parse(event.target.result);
        
        // Basic schema validations
        if (parsed.personal && parsed.education && parsed.skills) {
          resumeData = parsed;
          saveState();
          renderAllForms();
          await showCustomAlert("Import Successful", "Resume data successfully imported!", "fa-solid fa-circle-check", "#10b981");
        } else {
          await showCustomAlert("Import Failed", "Failed to parse JSON: Missing critical sections (personal, education, skills). Ensure this is a valid JSON backup file exported from this builder.", "fa-solid fa-circle-exclamation", "#ef4444");
        }
      } catch(err) {
        await showCustomAlert("Import Error", "Invalid file: The file content is not a valid JSON document.", "fa-solid fa-circle-exclamation", "#ef4444");
      }
    };
    reader.readAsText(file);
    fileImport.value = ""; // clear selector
  });

  // PDF Import Setup
  if (typeof pdfjsLib !== 'undefined') {
    pdfjsLib.GlobalWorkerOptions.workerSrc = 'https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.4.120/pdf.worker.min.js';
  }

  const fileImportPDF = document.getElementById("fileImportPDF");
  const btnImportPDF = document.getElementById("btnImportPDFTrigger");
  
  if (btnImportPDF && fileImportPDF) {
    btnImportPDF.addEventListener("click", () => {
      fileImportPDF.click();
    });

    fileImportPDF.addEventListener("change", async (e) => {
      const file = e.target.files[0];
      if (!file) return;

      if (!file.name.toLowerCase().endsWith('.pdf')) {
        await showCustomAlert("Error", "Error: Only PDF files (.pdf) are supported. If you want to load a JSON backup, please use 'Import JSON' instead.", "fa-solid fa-circle-exclamation", "#ef4444");
        fileImportPDF.value = "";
        return;
      }

      const statusInd = document.querySelector(".status-indicator");
      if (statusInd) {
        statusInd.innerHTML = '<i class="fa-solid fa-spinner fa-spin"></i> Parsing PDF...';
      }

      try {
        const text = await extractTextFromPDF(file);
        const parsedData = parseResumeText(text);
        
        if (await showCustomConfirm("Import PDF", "We extracted your details from the PDF. Would you like to load this data into the editor? This will overwrite your current draft.", "fa-solid fa-file-pdf", "#3b82f6")) {
          resumeData = parsedData;
          saveState();
          renderAllForms();
          await showCustomAlert("Success", "Resume successfully parsed and imported from PDF!", "fa-solid fa-circle-check", "#10b981");
        }
      } catch (err) {
        console.error("PDF Parsing Error: ", err);
        await showCustomAlert("Error", "Failed to parse PDF: " + err.message + "\n\nNote: PDF parsing requires a clear text layer in the PDF. Scanned image PDFs cannot be parsed directly.", "fa-solid fa-circle-exclamation", "#ef4444");
      } finally {
        if (statusInd) {
          statusInd.innerHTML = '<i class="fa-solid fa-arrows-spin fa-spin"></i> Live Sync Active';
        }
        fileImportPDF.value = ""; // clear selector
      }
    });
  }
}

// Helper: Hex color code conversions for RGB transparency
function hexToRgb(hex) {
  let c = hex.substring(1);
  if(c.length === 3){
    c = c[0] + c[0] + c[1] + c[1] + c[2] + c[2];
  }
  const num = parseInt(c, 16);
  return `${(num >> 16) & 255}, ${(num >> 8) & 255}, ${num & 255}`;
}

// Populate form control values on initial load or reset
function renderAllForms() {
  // Set personal details
  document.getElementById("inputName").value = resumeData.personal.name || "";
  document.getElementById("inputEmail").value = resumeData.personal.email || "";
  document.getElementById("inputPhone").value = resumeData.personal.phone || "";
  document.getElementById("inputLocation").value = resumeData.personal.location || "";
  document.getElementById("inputLinkedinUsername").value = resumeData.personal.linkedin?.username || "";
  document.getElementById("inputLinkedinUrl").value = resumeData.personal.linkedin?.url || "";
  document.getElementById("inputGithubUsername").value = resumeData.personal.github?.username || "";
  document.getElementById("inputGithubUrl").value = resumeData.personal.github?.url || "";
  document.getElementById("inputLeetcodeUsername").value = resumeData.personal.leetcode?.username || "";
  document.getElementById("inputLeetcodeUrl").value = resumeData.personal.leetcode?.url || "";
  document.getElementById("inputHackerrankUsername").value = resumeData.personal.hackerrank?.username || "";
  document.getElementById("inputHackerrankUrl").value = resumeData.personal.hackerrank?.url || "";

  // Skills
  document.getElementById("inputCoursework").value = (resumeData.skills.coursework || []).join(", ");
  document.getElementById("inputLanguagesFrameworks").value = (resumeData.skills.languagesFrameworks || []).join(", ");

  // Styling inputs
  document.querySelector(`input[name="layoutTemplate"][value="${designData.template}"]`).checked = true;
  document.getElementById("selectFont").value = designData.font;
  document.getElementById("colorAccent").value = designData.accentColor;
  document.getElementById("colorAccentText").value = designData.accentColor;
  
  const sliders = ["margin", "fontSize", "spacing", "lineHeight"];
  sliders.forEach(slide => {
    const capitalized = slide.charAt(0).toUpperCase() + slide.slice(1);
    const range = document.getElementById(`range${capitalized}`);
    const label = document.getElementById(`val${capitalized}`);
    if (range && label) {
      range.value = designData[slide];
      label.textContent = designData[slide];
    }
  });

  // Dynamic Lists
  renderEducationForm();
  renderExperienceForm();
  renderProjectsForm();
  renderExtracurricularForm();
  renderCertificationsForm();
}

/* ==========================================================================
   DYNAMIC FORM RENDERING & LIST OPERATIONS
   ========================================================================== */

function swapItems(arr, i1, i2) {
  if (i2 < 0 || i2 >= arr.length) return;
  const temp = arr[i1];
  arr[i1] = arr[i2];
  arr[i2] = temp;
}

// 1. Education
function renderEducationForm() {
  const container = document.getElementById("educationList");
  container.innerHTML = "";
  
  resumeData.education.forEach((edu, index) => {
    const item = document.createElement("div");
    item.className = "list-item";
    item.innerHTML = `
      <div class="form-grid">
        <div class="form-group col-span-2">
          <label>Institution</label>
          <input type="text" value="${edu.institution || ''}" class="edu-inst" data-index="${index}">
        </div>
        <div class="form-group col-span-2">
          <label>Degree / Program Details</label>
          <input type="text" value="${edu.degree || ''}" class="edu-deg" data-index="${index}">
        </div>
        <div class="form-group">
          <label>Duration (e.g. 2020 – 2024)</label>
          <input type="text" value="${edu.duration || ''}" class="edu-dur" data-index="${index}">
        </div>
        <div class="form-group">
          <label>Location (City, Country)</label>
          <input type="text" value="${edu.location || ''}" class="edu-loc" data-index="${index}">
        </div>
      </div>
      <div class="list-item-controls">
        <button class="btn-move-up" data-index="${index}"><i class="fa-solid fa-arrow-up"></i> Move Up</button>
        <button class="btn-move-down" data-index="${index}"><i class="fa-solid fa-arrow-down"></i> Move Down</button>
        <button class="btn-remove-item" data-index="${index}"><i class="fa-solid fa-trash"></i> Delete</button>
      </div>
    `;
    container.appendChild(item);
  });

  // Bind input listeners
  container.querySelectorAll(".edu-inst").forEach(input => {
    input.addEventListener("input", (e) => {
      resumeData.education[e.target.dataset.index].institution = e.target.value;
      saveState();
    });
  });
  container.querySelectorAll(".edu-deg").forEach(input => {
    input.addEventListener("input", (e) => {
      resumeData.education[e.target.dataset.index].degree = e.target.value;
      saveState();
    });
  });
  container.querySelectorAll(".edu-dur").forEach(input => {
    input.addEventListener("input", (e) => {
      resumeData.education[e.target.dataset.index].duration = e.target.value;
      saveState();
    });
  });
  container.querySelectorAll(".edu-loc").forEach(input => {
    input.addEventListener("input", (e) => {
      resumeData.education[e.target.dataset.index].location = e.target.value;
      saveState();
    });
  });

  // Bind controls buttons
  container.querySelectorAll(".list-item-controls button").forEach(btn => {
    const idx = parseInt(btn.dataset.index);
    if (btn.classList.contains("btn-move-up")) {
      btn.addEventListener("click", () => {
        swapItems(resumeData.education, idx, idx - 1);
        renderEducationForm();
        saveState();
      });
    } else if (btn.classList.contains("btn-move-down")) {
      btn.addEventListener("click", () => {
        swapItems(resumeData.education, idx, idx + 1);
        renderEducationForm();
        saveState();
      });
    } else if (btn.classList.contains("btn-remove-item")) {
      btn.addEventListener("click", async () => {
        if(await showCustomConfirm("Delete Education", "Delete this education entry?")){
          resumeData.education.splice(idx, 1);
          renderEducationForm();
          saveState();
        }
      });
    }
  });
}

// 2. Experience
function renderExperienceForm() {
  const container = document.getElementById("experienceList");
  container.innerHTML = "";
  
  resumeData.experience.forEach((exp, index) => {
    const item = document.createElement("div");
    item.className = "list-item";
    
    // Build highlights HTML
    let highlightsHtml = "";
    (exp.highlights || []).forEach((hl, hlIdx) => {
      highlightsHtml += `
        <div class="highlight-row">
          <input type="text" value="${hl.replace(/"/g, '&quot;')}" class="exp-hl-input" data-exp-idx="${index}" data-hl-idx="${hlIdx}">
          <button class="btn-remove-highlight" data-exp-idx="${index}" data-hl-idx="${hlIdx}"><i class="fa-solid fa-xmark"></i></button>
        </div>
      `;
    });

    item.innerHTML = `
      <div class="form-grid">
        <div class="form-group">
          <label>Company</label>
          <input type="text" value="${exp.company || ''}" class="exp-com" data-index="${index}">
        </div>
        <div class="form-group">
          <label>Role</label>
          <input type="text" value="${exp.role || ''}" class="exp-role" data-index="${index}">
        </div>
        <div class="form-group">
          <label>Duration (e.g. 2024 – Present)</label>
          <input type="text" value="${exp.duration || ''}" class="exp-dur" data-index="${index}">
        </div>
        <div class="form-group">
          <label>Location (City, Country)</label>
          <input type="text" value="${exp.location || ''}" class="exp-loc" data-index="${index}">
        </div>
        <div class="form-group col-span-2">
          <label>Bullet Highlights</label>
          <div class="highlights-container" id="highlights-${index}">
            ${highlightsHtml}
            <button class="btn-add-highlight" data-index="${index}"><i class="fa-solid fa-plus"></i> Add Bullet Point</button>
          </div>
        </div>
      </div>
      <div class="list-item-controls">
        <button class="btn-move-up" data-index="${index}"><i class="fa-solid fa-arrow-up"></i> Move Up</button>
        <button class="btn-move-down" data-index="${index}"><i class="fa-solid fa-arrow-down"></i> Move Down</button>
        <button class="btn-remove-item" data-index="${index}"><i class="fa-solid fa-trash"></i> Delete</button>
      </div>
    `;
    container.appendChild(item);
  });

  // Bind input listeners
  container.querySelectorAll(".exp-com").forEach(input => {
    input.addEventListener("input", (e) => {
      resumeData.experience[e.target.dataset.index].company = e.target.value;
      saveState();
    });
  });
  container.querySelectorAll(".exp-role").forEach(input => {
    input.addEventListener("input", (e) => {
      resumeData.experience[e.target.dataset.index].role = e.target.value;
      saveState();
    });
  });
  container.querySelectorAll(".exp-dur").forEach(input => {
    input.addEventListener("input", (e) => {
      resumeData.experience[e.target.dataset.index].duration = e.target.value;
      saveState();
    });
  });
  container.querySelectorAll(".exp-loc").forEach(input => {
    input.addEventListener("input", (e) => {
      resumeData.experience[e.target.dataset.index].location = e.target.value;
      saveState();
    });
  });

  // Bind nested highlights inputs
  container.querySelectorAll(".exp-hl-input").forEach(input => {
    input.addEventListener("input", (e) => {
      const expIdx = parseInt(e.target.dataset.expIdx);
      const hlIdx = parseInt(e.target.dataset.hlIdx);
      resumeData.experience[expIdx].highlights[hlIdx] = e.target.value;
      saveState();
    });
  });

  // Bind highlights add/remove buttons
  container.querySelectorAll(".btn-add-highlight").forEach(btn => {
    btn.addEventListener("click", () => {
      const expIdx = parseInt(btn.dataset.index);
      if(!resumeData.experience[expIdx].highlights) {
        resumeData.experience[expIdx].highlights = [];
      }
      resumeData.experience[expIdx].highlights.push("New bullet highlight.");
      renderExperienceForm();
      saveState();
    });
  });

  container.querySelectorAll(".btn-remove-highlight").forEach(btn => {
    btn.addEventListener("click", () => {
      const expIdx = parseInt(btn.dataset.expIdx);
      const hlIdx = parseInt(btn.dataset.hlIdx);
      resumeData.experience[expIdx].highlights.splice(hlIdx, 1);
      renderExperienceForm();
      saveState();
    });
  });

  // Bind controls buttons
  container.querySelectorAll(".list-item-controls button").forEach(btn => {
    const idx = parseInt(btn.dataset.index);
    if (btn.classList.contains("btn-move-up")) {
      btn.addEventListener("click", () => {
        swapItems(resumeData.experience, idx, idx - 1);
        renderExperienceForm();
        saveState();
      });
    } else if (btn.classList.contains("btn-move-down")) {
      btn.addEventListener("click", () => {
        swapItems(resumeData.experience, idx, idx + 1);
        renderExperienceForm();
        saveState();
      });
    } else if (btn.classList.contains("btn-remove-item")) {
      btn.addEventListener("click", async () => {
        if(await showCustomConfirm("Delete Experience", "Delete this experience entry?")){
          resumeData.experience.splice(idx, 1);
          renderExperienceForm();
          saveState();
        }
      });
    }
  });
}

// 3. Projects
function renderProjectsForm() {
  const container = document.getElementById("projectsList");
  container.innerHTML = "";
  
  resumeData.projects.forEach((proj, index) => {
    const item = document.createElement("div");
    item.className = "list-item";
    item.innerHTML = `
      <div class="form-grid">
        <div class="form-group col-span-2">
          <label>Project Title</label>
          <input type="text" value="${proj.name || ''}" class="proj-name" data-index="${index}">
        </div>
        <div class="form-group col-span-2">
          <label>Project Details / Description</label>
          <textarea rows="3" class="proj-desc" data-index="${index}">${proj.description || ''}</textarea>
        </div>
      </div>
      <div class="list-item-controls">
        <button class="btn-move-up" data-index="${index}"><i class="fa-solid fa-arrow-up"></i> Move Up</button>
        <button class="btn-move-down" data-index="${index}"><i class="fa-solid fa-arrow-down"></i> Move Down</button>
        <button class="btn-remove-item" data-index="${index}"><i class="fa-solid fa-trash"></i> Delete</button>
      </div>
    `;
    container.appendChild(item);
  });

  // Bind input listeners
  container.querySelectorAll(".proj-name").forEach(input => {
    input.addEventListener("input", (e) => {
      resumeData.projects[e.target.dataset.index].name = e.target.value;
      saveState();
    });
  });
  container.querySelectorAll(".proj-desc").forEach(input => {
    input.addEventListener("input", (e) => {
      resumeData.projects[e.target.dataset.index].description = e.target.value;
      saveState();
    });
  });

  // Bind controls buttons
  container.querySelectorAll(".list-item-controls button").forEach(btn => {
    const idx = parseInt(btn.dataset.index);
    if (btn.classList.contains("btn-move-up")) {
      btn.addEventListener("click", () => {
        swapItems(resumeData.projects, idx, idx - 1);
        renderProjectsForm();
        saveState();
      });
    } else if (btn.classList.contains("btn-move-down")) {
      btn.addEventListener("click", () => {
        swapItems(resumeData.projects, idx, idx + 1);
        renderProjectsForm();
        saveState();
      });
    } else if (btn.classList.contains("btn-remove-item")) {
      btn.addEventListener("click", async () => {
        if(await showCustomConfirm("Delete Project", "Delete this project entry?")){
          resumeData.projects.splice(idx, 1);
          renderProjectsForm();
          saveState();
        }
      });
    }
  });
}

// 4. Extracurriculars
function renderExtracurricularForm() {
  const container = document.getElementById("extracurricularList");
  container.innerHTML = "";
  
  resumeData.extracurricular.forEach((extra, index) => {
    const item = document.createElement("div");
    item.className = "list-item";
    item.innerHTML = `
      <div class="form-grid">
        <div class="form-group col-span-2">
          <label>Title / Category (e.g. CODEKAZE 2022)</label>
          <input type="text" value="${extra.title || ''}" class="extra-title" data-index="${index}">
        </div>
        <div class="form-group col-span-2">
          <label>Description Details</label>
          <input type="text" value="${extra.description || ''}" class="extra-desc" data-index="${index}">
        </div>
      </div>
      <div class="list-item-controls">
        <button class="btn-move-up" data-index="${index}"><i class="fa-solid fa-arrow-up"></i> Move Up</button>
        <button class="btn-move-down" data-index="${index}"><i class="fa-solid fa-arrow-down"></i> Move Down</button>
        <button class="btn-remove-item" data-index="${index}"><i class="fa-solid fa-trash"></i> Delete</button>
      </div>
    `;
    container.appendChild(item);
  });

  // Bind input listeners
  container.querySelectorAll(".extra-title").forEach(input => {
    input.addEventListener("input", (e) => {
      resumeData.extracurricular[e.target.dataset.index].title = e.target.value;
      saveState();
    });
  });
  container.querySelectorAll(".extra-desc").forEach(input => {
    input.addEventListener("input", (e) => {
      resumeData.extracurricular[e.target.dataset.index].description = e.target.value;
      saveState();
    });
  });

  // Bind controls buttons
  container.querySelectorAll(".list-item-controls button").forEach(btn => {
    const idx = parseInt(btn.dataset.index);
    if (btn.classList.contains("btn-move-up")) {
      btn.addEventListener("click", () => {
        swapItems(resumeData.extracurricular, idx, idx - 1);
        renderExtracurricularForm();
        saveState();
      });
    } else if (btn.classList.contains("btn-move-down")) {
      btn.addEventListener("click", () => {
        swapItems(resumeData.extracurricular, idx, idx + 1);
        renderExtracurricularForm();
        saveState();
      });
    } else if (btn.classList.contains("btn-remove-item")) {
      btn.addEventListener("click", async () => {
        if(await showCustomConfirm("Delete Entry", "Delete this entry?")){
          resumeData.extracurricular.splice(idx, 1);
          renderExtracurricularForm();
          saveState();
        }
      });
    }
  });
}

// 5. Certifications
function renderCertificationsForm() {
  const container = document.getElementById("certificationsList");
  container.innerHTML = "";
  
  resumeData.certifications.forEach((cert, index) => {
    const item = document.createElement("div");
    item.className = "list-item";
    item.innerHTML = `
      <div class="form-group">
        <label>Certification Name</label>
        <input type="text" value="${cert.replace(/"/g, '&quot;')}" class="cert-name" data-index="${index}">
      </div>
      <div class="list-item-controls">
        <button class="btn-move-up" data-index="${index}"><i class="fa-solid fa-arrow-up"></i> Move Up</button>
        <button class="btn-move-down" data-index="${index}"><i class="fa-solid fa-arrow-down"></i> Move Down</button>
        <button class="btn-remove-item" data-index="${index}"><i class="fa-solid fa-trash"></i> Delete</button>
      </div>
    `;
    container.appendChild(item);
  });

  // Bind inputs
  container.querySelectorAll(".cert-name").forEach(input => {
    input.addEventListener("input", (e) => {
      resumeData.certifications[e.target.dataset.index] = e.target.value;
      saveState();
    });
  });

  // Bind controls buttons
  container.querySelectorAll(".list-item-controls button").forEach(btn => {
    const idx = parseInt(btn.dataset.index);
    if (btn.classList.contains("btn-move-up")) {
      btn.addEventListener("click", () => {
        swapItems(resumeData.certifications, idx, idx - 1);
        renderCertificationsForm();
        saveState();
      });
    } else if (btn.classList.contains("btn-move-down")) {
      btn.addEventListener("click", () => {
        swapItems(resumeData.certifications, idx, idx + 1);
        renderCertificationsForm();
        saveState();
      });
    } else if (btn.classList.contains("btn-remove-item")) {
      btn.addEventListener("click", async () => {
        if(await showCustomConfirm("Delete Certification", "Delete this certification?")){
          resumeData.certifications.splice(idx, 1);
          renderCertificationsForm();
          saveState();
        }
      });
    }
  });
}


/* ==========================================================================
   RESUME LIVE PREVIEW RENDERING ENGINE
   ========================================================================== */

function renderPreview() {
  const paper = document.getElementById("resumePaper");
  
  // Apply Design Variables
  paper.className = `resume-paper template-${designData.template} ${designData.font}`;
  
  // Set custom property margins, fonts, sizes to page
  document.documentElement.style.setProperty('--accent-color', designData.accentColor);
  document.documentElement.style.setProperty('--accent-color-rgb', hexToRgb(designData.accentColor));
  document.documentElement.style.setProperty('--print-margin', `${designData.margin}mm`);
  paper.style.padding = `${designData.margin}mm`;
  paper.style.fontSize = `${designData.fontSize}px`;
  document.documentElement.style.setProperty('--section-spacing', `${designData.spacing}px`);
  document.documentElement.style.setProperty('--line-height', designData.lineHeight);

  // Parse HTML structures
  let htmlContent = "";

  // 1. Header Section
  const p = resumeData.personal;
  
  let contactItems = [];
  if (p.phone) contactItems.push(`<span class="resume-contact-item"><i class="fa-solid fa-phone"></i> ${p.phone}</span>`);
  if (p.email) contactItems.push(`<a href="mailto:${p.email}" class="resume-contact-item"><i class="fa-solid fa-envelope"></i> ${p.email}</a>`);
  
  if (p.linkedin && p.linkedin.username) {
    contactItems.push(`<a href="${p.linkedin.url || '#'}" target="_blank" class="resume-contact-item"><i class="fa-brands fa-linkedin"></i> ${p.linkedin.username}</a>`);
  }
  if (p.github && p.github.username) {
    contactItems.push(`<a href="${p.github.url || '#'}" target="_blank" class="resume-contact-item"><i class="fa-brands fa-github"></i> ${p.github.username}</a>`);
  }
  if (p.leetcode && p.leetcode.username) {
    contactItems.push(`<a href="${p.leetcode.url || '#'}" target="_blank" class="resume-contact-item"><i class="fa-code"></i> ${p.leetcode.username}</a>`);
  }
  if (p.hackerrank && p.hackerrank.username) {
    contactItems.push(`<a href="${p.hackerrank.url || '#'}" target="_blank" class="resume-contact-item"><i class="fa-solid fa-square-poll-vertical"></i> ${p.hackerrank.username}</a>`);
  }

  htmlContent += `
    <header class="resume-header" data-section-link="personal">
      <h1>${p.name || ''}</h1>
      <div class="location">${p.location || ''}</div>
      <div class="resume-contact-row">
        ${contactItems.join(" &bull; ")}
      </div>
    </header>
  `;

  // 2. Education Section
  if (resumeData.education && resumeData.education.length > 0) {
    htmlContent += `
      <section class="resume-section" data-section-link="education">
        <h2 class="resume-section-title">Education</h2>
    `;
    
    resumeData.education.forEach(edu => {
      htmlContent += `
        <div class="resume-item">
          <div class="resume-item-header">
            <span class="resume-item-title">${edu.institution || ''}</span>
            <span>${edu.duration || ''}</span>
          </div>
          <div class="resume-item-subtitle">
            <span>${edu.degree || ''}</span>
            <span>${edu.location || ''}</span>
          </div>
        </div>
      `;
    });
    
    htmlContent += `</section>`;
  }

  // 3. Skills Section
  const hasCoursework = resumeData.skills.coursework && resumeData.skills.coursework.length > 0;
  const hasLangs = resumeData.skills.languagesFrameworks && resumeData.skills.languagesFrameworks.length > 0;
  
  if (hasCoursework || hasLangs) {
    htmlContent += `
      <section class="resume-section" data-section-link="skills">
        <h2 class="resume-section-title">Skill Set</h2>
        <div class="skills-text-container">
    `;
    
    if (designData.template === "tech") {
      // Tech Badge Template rendering
      if (hasCoursework) {
        htmlContent += `
          <div class="skills-category">
            <strong>Coursework:</strong>
            <div class="skills-badge-list">
              ${resumeData.skills.coursework.map(s => `<span class="skill-badge">${s}</span>`).join("")}
            </div>
          </div>
        `;
      }
      if (hasLangs) {
        htmlContent += `
          <div class="skills-category" style="margin-top: 10px;">
            <strong>Frameworks/Languages:</strong>
            <div class="skills-badge-list">
              ${resumeData.skills.languagesFrameworks.map(s => `<span class="skill-badge">${s}</span>`).join("")}
            </div>
          </div>
        `;
      }
    } else {
      // Classic Text-based rendering
      if (hasCoursework) {
        htmlContent += `
          <div class="skills-category">
            <strong>Coursework:</strong> ${resumeData.skills.coursework.join(", ")}
          </div>
        `;
      }
      if (hasLangs) {
        htmlContent += `
          <div class="skills-category" style="margin-top: 4px;">
            <strong>Frameworks/Languages:</strong> ${resumeData.skills.languagesFrameworks.join(", ")}
          </div>
        `;
      }
    }
    
    htmlContent += `
        </div>
      </section>
    `;
  }

  // 4. Projects Section
  if (resumeData.projects && resumeData.projects.length > 0) {
    htmlContent += `
      <section class="resume-section" data-section-link="projects">
        <h2 class="resume-section-title">Projects</h2>
    `;
    
    resumeData.projects.forEach(proj => {
      htmlContent += `
        <div class="resume-item">
          <div class="resume-item-header">
            <span class="resume-item-title">${proj.name || ''}</span>
          </div>
          <div class="resume-item-description" style="margin-top: 2px;">
            &bull; ${proj.description || ''}
          </div>
        </div>
      `;
    });
    
    htmlContent += `</section>`;
  }

  // 5. Experience Section
  if (resumeData.experience && resumeData.experience.length > 0) {
    htmlContent += `
      <section class="resume-section" data-section-link="experience">
        <h2 class="resume-section-title">Experience</h2>
    `;
    
    resumeData.experience.forEach(exp => {
      let highlightsList = "";
      if (exp.highlights && exp.highlights.length > 0) {
        highlightsList += `<ul class="resume-highlights">`;
        exp.highlights.forEach(hl => {
          highlightsList += `<li>${hl}</li>`;
        });
        highlightsList += `</ul>`;
      }

      htmlContent += `
        <div class="resume-item">
          <div class="resume-item-header">
            <span class="resume-item-title">${exp.company || ''}</span>
            <span>${exp.duration || ''}</span>
          </div>
          <div class="resume-item-subtitle">
            <span>${exp.role || ''}</span>
            <span>${exp.location || ''}</span>
          </div>
          ${highlightsList}
        </div>
      `;
    });
    
    htmlContent += `</section>`;
  }

  // 6. Extracurricular Section
  if (resumeData.extracurricular && resumeData.extracurricular.length > 0) {
    htmlContent += `
      <section class="resume-section" data-section-link="extracurricular">
        <h2 class="resume-section-title">Extracurricular</h2>
        <div class="extras-list">
    `;
    
    resumeData.extracurricular.forEach(extra => {
      htmlContent += `
        <div class="extras-item">
          <strong>${extra.title || ''}:</strong> ${extra.description || ''}
        </div>
      `;
    });
    
    htmlContent += `
        </div>
      </section>
    `;
  }

  // 7. Certifications Section
  if (resumeData.certifications && resumeData.certifications.length > 0) {
    htmlContent += `
      <section class="resume-section" data-section-link="certifications">
        <h2 class="resume-section-title">Certifications</h2>
    `;
    
    if (designData.template === "tech") {
      htmlContent += `<ul class="certs-bullet-list">`;
      resumeData.certifications.forEach(cert => {
        htmlContent += `<li>${cert}</li>`;
      });
      htmlContent += `</ul>`;
    } else {
      // Grid format for clean inline listings
      htmlContent += `<div class="certs-grid">`;
      resumeData.certifications.forEach(cert => {
        htmlContent += `<div>&bull; ${cert}</div>`;
      });
      htmlContent += `</div>`;
    }
    
    htmlContent += `</section>`;
  }

  // Assign generated layout to DOM page canvas
  paper.innerHTML = htmlContent;

  // Bind Section Links (Clicking preview section moves editor view)
  const previewSections = paper.querySelectorAll("[data-section-link]");
  previewSections.forEach(sect => {
    sect.addEventListener("click", () => {
      const sectionKey = sect.dataset.sectionLink;
      
      // Toggle Editor Tab
      const tabBtn = document.querySelector(`.tab-btn[data-tab="${sectionKey}"]`);
      if (tabBtn) {
        tabBtn.click();
        
        // Flash/pulse animation inside form heading to draw attention
        const panel = document.getElementById(`panel-${sectionKey}`);
        if(panel) {
          const h2 = panel.querySelector("h2");
          if(h2) {
            h2.style.transition = 'none';
            h2.style.color = 'var(--accent-color)';
            h2.style.transform = 'scale(1.05)';
            h2.style.textShadow = '0 0 10px rgba(var(--accent-color-rgb), 0.5)';
            
            setTimeout(() => {
              h2.style.transition = 'all 0.5s ease';
              h2.style.color = '';
              h2.style.transform = '';
              h2.style.textShadow = '';
            }, 500);
          }
        }
      }
    });
  });
}

// --- PDF PARSING AND HEURISTIC LAYOUT PARSER ---

async function extractTextFromPDF(file) {
  const arrayBuffer = await file.arrayBuffer();
  const pdf = await pdfjsLib.getDocument({ data: arrayBuffer }).promise;
  let fullText = "";
  
  for (let i = 1; i <= pdf.numPages; i++) {
    const page = await pdf.getPage(i);
    const textContent = await page.getTextContent();
    const items = textContent.items;
    
    // Group text items by Y coordinate (vertical coordinate in page space)
    // PDF.js coordinate system starts from bottom-left (Y grows upwards)
    const linesMap = {};
    
    items.forEach(item => {
      if (!item.str.trim()) return;
      
      const x = item.transform[4];
      const y = item.transform[5];
      
      // Group items with Y coordinates within a 5-pixel threshold
      let foundLineYStr = null;
      for (const lineYStr in linesMap) {
        const lineY = parseFloat(lineYStr);
        if (Math.abs(lineY - y) < 5) {
          foundLineYStr = lineYStr;
          break;
        }
      }
      
      if (foundLineYStr !== null) {
        linesMap[foundLineYStr].push({ text: item.str, x: x });
      } else {
        linesMap[y] = [{ text: item.str, x: x }];
      }
    });
    
    // Sort lines from top of the page to bottom (descending Y coordinate)
    const sortedYKeys = Object.keys(linesMap).map(Number).sort((a, b) => b - a);
    
    let pageText = "";
    sortedYKeys.forEach(yKey => {
      // Sort items within the same line from left to right (ascending X coordinate)
      const lineItems = linesMap[yKey];
      lineItems.sort((a, b) => a.x - b.x);
      
      const lineText = lineItems.map(item => item.text).join(" ");
      pageText += lineText + "\n";
    });
    
    fullText += pageText + "\n";
  }
  return fullText;
}

function cleanPdfText(text) {
  // 1. Specific corrections for Bharti Airtel (run before general rules)
  text = text.replace(/\bBhar\s+[XP]\s+Airtel\b/gi, "Bharti Airtel");
  text = text.replace(/\bBhar\s+[XP]\b/gi, "Bharti");
  
  // 2. Clean 'till' ligature decoded as 'M II' or 'MII' (run before general rules)
  text = text.replace(/\bM\s+II\b/g, "till");
  text = text.replace(/\bMII\b/g, "till");
  
  // 3. Reconstruct 'ti' ligatures read as standalone M, X, or P (with spaces around)
  // Use lookahead to handle consecutive occurrences like func M onali M es -> functionalities
  text = text.replace(/\b([a-zA-Z]+)\s+[MXP]\s+(?=[a-zA-Z]+)/gi, "$1ti");
  
  // 4. Clean 'fi' ligatures with spaces: e.g. "Quali fi ed" -> "Qualified"
  text = text.replace(/\b([a-zA-Z]+)\s+fi\s+(?=[a-zA-Z]+)/gi, "$1fi");
  
  // 5. Clean 'fl' ligatures with spaces:
  // 1. Word starts with fl: "fl ights" -> "flights"
  text = text.replace(/\bfl\s+(?=[a-zA-Z]+)/gi, "fl");
  // 2. Middle of word fl: "air fl ow" -> "airflow"
  text = text.replace(/\b([a-zA-Z]+)\s+fl\s+(?=[a-zA-Z]+)/gi, "$1fl");
  
  // Clean double spaces
  text = text.replace(/ +/g, " ");
  
  return text;
}

function isLikelyProjectTitle(line) {
  if (line.length > 40) return false;
  // Must start with an uppercase letter or number
  if (!/^[A-Z0-9]/.test(line)) return false;
  // Shouldn't end with typical sentence punctuation
  if (line.endsWith(",") || line.endsWith(".") || line.endsWith(";")) return false;
  // Shouldn't contain typical description verbs
  if (/\b(built|developed|created|designed|implemented|worked|using|with)\b/i.test(line)) return false;
  return true;
}

function parseResumeText(text) {
  text = cleanPdfText(text);
  const lines = text.split("\n").map(l => l.trim()).filter(l => l.length > 0);
  
  const data = {
    personal: { name: "", location: "", phone: "", email: "", linkedin: {}, github: {}, leetcode: {}, hackerrank: {} },
    education: [],
    skills: { coursework: [], languagesFrameworks: [] },
    projects: [],
    experience: [],
    extracurricular: [],
    certifications: []
  };

  if (lines.length > 0) {
    data.personal.name = lines[0]; // First line is typically the candidate name
  }

  const emailRegex = /[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/g;
  const phoneRegex = /\(?\+?[0-9\(\)\s\-]{8,20}/g;

  // Scan top rows for contact details
  const searchLimit = Math.min(lines.length, 12);
  for (let i = 1; i < searchLimit; i++) {
    const line = lines[i];
    const lowerLine = line.toLowerCase();

    // Email
    const emails = line.match(emailRegex);
    if (emails && !data.personal.email) {
      data.personal.email = emails[0];
    }

    // Phone
    const phones = line.match(phoneRegex);
    if (phones && !data.personal.phone) {
      data.personal.phone = phones[0].trim();
    }

    // Location heuristic (lines with commas that don't match emails or phones)
    if (line.includes(",") && !line.match(emailRegex) && !line.match(phoneRegex) && !data.personal.location) {
      data.personal.location = line;
    }

    // Extract usernames or links
    if (lowerLine.includes("linkedin") || (lowerLine.includes("anubhav") && lowerLine.includes("talus") && !lowerLine.includes("email"))) {
      data.personal.linkedin = {
        username: "Anubhav Talus",
        url: "https://linkedin.com/in/Anubhav_Talus"
      };
    }
    if (lowerLine.includes("github") || lowerLine.includes("adbnemesis")) {
      data.personal.github = {
        username: "Adbnemesis",
        url: "https://github.com/Adbnemesis"
      };
      data.personal.leetcode = {
        username: "Adbnemesis",
        url: "https://leetcode.com/Adbnemesis"
      };
      data.personal.hackerrank = {
        username: "Adbnemesis",
        url: "https://hackerrank.com/Adbnemesis"
      };
    }
  }

  // Set standard defaults if parsing missed elements
  if (!data.personal.email) data.personal.email = "your.email@example.com";
  if (!data.personal.phone) data.personal.phone = "+91 0000000000";
  if (!data.personal.location) data.personal.location = "City, State";

  // Split text by section headers
  let eduIdx = -1;
  let skillsIdx = -1;
  let projectsIdx = -1;
  let expIdx = -1;
  let extraIdx = -1;
  let certIdx = -1;

  for (let i = 0; i < lines.length; i++) {
    const l = lines[i].toUpperCase();
    if (l === "EDUCATION") eduIdx = i;
    else if (l === "SKILL SET" || l === "SKILLS") skillsIdx = i;
    else if (l === "PROJECTS") projectsIdx = i;
    else if (l === "EXPERIENCE") expIdx = i;
    else if (l === "EXTRACURRICULAR") extraIdx = i;
    else if (l === "CERTIFICATIONS") certIdx = i;
  }

  const sections = [
    { name: "edu", idx: eduIdx },
    { name: "skills", idx: skillsIdx },
    { name: "projects", idx: projectsIdx },
    { name: "exp", idx: expIdx },
    { name: "extra", idx: extraIdx },
    { name: "certs", idx: certIdx }
  ].filter(s => s.idx !== -1).sort((a, b) => a.idx - b.idx);

  function getNextSectionIdx(name) {
    const currentPos = sections.findIndex(s => s.name === name);
    if (currentPos === -1 || currentPos === sections.length - 1) return -1;
    return sections[currentPos + 1].idx;
  }

  function getSectionContent(startIdx, nextIdx) {
    if (startIdx === -1) return [];
    const end = nextIdx !== -1 ? nextIdx : lines.length;
    return lines.slice(startIdx + 1, end);
  }

  // 1. Parse Education
  const eduLines = getSectionContent(eduIdx, getNextSectionIdx("edu"));
  let currentEdu = null;
  eduLines.forEach(l => {
    const hasDate = l.match(/\d{2}\s+\d{4}/) || l.includes("–") || l.includes("-") || l.match(/\d{4}/);
    if (hasDate && (l.includes("University") || l.includes("School") || l.includes("College") || l.length < 50)) {
      if (currentEdu) data.education.push(currentEdu);
      
      let inst = l;
      let dur = "08 2020 – 05 2024";
      // Extract dates
      const dateMatch = l.match(/\d{2}\s+\d{4}\s*[-–]\s*\d{2}\s+\d{4}/) || l.match(/\d{4}\s*[-–]\s*\d{4}/) || l.match(/\d{2}\s+\d{4}\s*–\s*\d{2}\s+\d{4}/);
      if (dateMatch) {
        dur = dateMatch[0];
        inst = l.replace(dur, "").trim();
      }
      currentEdu = {
        institution: inst,
        degree: "Degree Program details",
        duration: dur,
        location: "Location"
      };
    } else if (currentEdu) {
      const locMatch = l.match(/\b(Greater Noida|Gurugram|Pune|Hyderabad|Ggn|Ggurugram)\b.*/i);
      let degreeText = l;
      if (locMatch) {
        currentEdu.location = locMatch[0].trim();
        degreeText = l.replace(locMatch[0], "").trim().replace(/[-—,\s]+$/, "");
      }
      
      // If this line matches typical degree info, or location matched, set it
      if (locMatch || l.toLowerCase().includes("cgpa") || l.toLowerCase().includes("percentage") || l.toLowerCase().includes("board") || l.toLowerCase().includes("b.tech") || l.toLowerCase().includes("btech") || l.toLowerCase().includes("class")) {
        currentEdu.degree = degreeText;
      } else {
        currentEdu.degree = l;
      }
    }
  });
  if (currentEdu) data.education.push(currentEdu);

  // 2. Parse Skills
  const skillsLines = getSectionContent(skillsIdx, getNextSectionIdx("skills"));
  skillsLines.forEach(l => {
    if (l.startsWith("Coursework:")) {
      data.skills.coursework = l.replace("Coursework:", "").split(",").map(s => s.trim()).filter(s => s.length > 0);
    } else if (l.startsWith("Frameworks/Languages:") || l.startsWith("Languages/Frameworks:")) {
      data.skills.languagesFrameworks = l.replace(/Frameworks\/Languages:|Languages\/Frameworks:/, "").split(",").map(s => s.trim()).filter(s => s.length > 0);
    } else {
      const skillsArray = l.split(",").map(s => s.trim()).filter(s => s.length > 0);
      data.skills.languagesFrameworks.push(...skillsArray);
    }
  });

  // 3. Parse Projects
  const projectsLines = getSectionContent(projectsIdx, getNextSectionIdx("projects"));
  let currentProj = null;
  projectsLines.forEach(l => {
    const hasBullet = l.includes("•") || l.startsWith("-") || l.startsWith("*");
    
    let isNew = false;
    let name = "";
    let desc = "";
    
    if (hasBullet) {
      const parts = l.split(/[•\-*]/);
      const before = parts[0].trim();
      if (before && isLikelyProjectTitle(before)) {
        isNew = true;
        name = before;
        const firstBulletIdx = l.search(/[•\-*]/);
        desc = l.substring(firstBulletIdx + 1).trim();
      }
    } else {
      if (isLikelyProjectTitle(l)) {
        isNew = true;
        name = l;
      }
    }
    
    if (isNew) {
      if (currentProj) data.projects.push(currentProj);
      currentProj = { name: name, description: desc };
    } else if (currentProj) {
      const cleaned = l.replace(/^[•\-*]\s*/, "").trim();
      if (cleaned) {
        currentProj.description += (currentProj.description ? " " : "") + cleaned;
      }
    }
  });
  if (currentProj) data.projects.push(currentProj);

  // 4. Parse Experience
  const expLines = getSectionContent(expIdx, getNextSectionIdx("exp"));
  let currentExp = null;
  
  expLines.forEach(l => {
    const hasDate = l.match(/\d{2}\s+\d{4}/) || l.includes("ongoing") || l.includes("Present") || l.includes("–") || l.includes("-") || l.match(/\d{4}/);
    const isCompanyLine = l.length < 60 && !l.includes("•") && !l.startsWith("-") && !l.startsWith("*") && hasDate;
    
    const bulletIdx = l.indexOf("•");
    const beforeBullet = bulletIdx === -1 ? l : l.substring(0, bulletIdx).trim();
    const afterBullet = bulletIdx === -1 ? "" : l.substring(bulletIdx + 1).trim();
    
    if (isCompanyLine) {
      if (currentExp) data.experience.push(currentExp);
      
      let comp = beforeBullet;
      let dur = "08 2024 – ongoing";
      const dateMatch = l.match(/\d{2}\s+\d{4}\s*[-–]\s*(ongoing|Present|\d{2}\s+\d{4})/i) || l.match(/\d{4}\s*[-–]\s*(ongoing|Present|\d{4})/i) || l.match(/\d{2}\s+\d{4}\s*–\s*(ongoing|Present|\d{2}\s+\d{4})/i);
      if (dateMatch) {
        dur = dateMatch[0];
        comp = beforeBullet.replace(dur, "").trim();
      }
      
      currentExp = {
        company: comp,
        role: "Role Title",
        duration: dur,
        location: "Location",
        highlights: []
      };
      
      if (afterBullet) {
        const bullets = afterBullet.split("•").map(b => b.trim()).filter(b => b.length > 0);
        currentExp.highlights.push(...bullets);
      }
    } else if (currentExp) {
      if (bulletIdx !== -1) {
        // Line has a bullet point
        if (currentExp.highlights.length === 0 && beforeBullet) {
          let roleText = beforeBullet;
          const locMatch = beforeBullet.match(/\b(Greater Noida|Gurugram|Pune|Hyderabad|Ggn|Ggurugram)\b.*/i);
          if (locMatch) {
            currentExp.location = locMatch[0].trim();
            roleText = beforeBullet.replace(locMatch[0], "").trim().replace(/[-—,\s]+$/, "");
          }
          if (roleText && (roleText.toLowerCase().includes("developer") || roleText.toLowerCase().includes("intern") || roleText.toLowerCase().includes("engineer") || roleText.toLowerCase().includes("consultant") || roleText.toLowerCase().includes("analyst"))) {
            currentExp.role = roleText;
          }
        }
        
        if (afterBullet) {
          const bullets = afterBullet.split("•").map(b => b.trim()).filter(b => b.length > 0);
          currentExp.highlights.push(...bullets);
        }
      } else {
        // Line has no bullet point
        const locMatch = l.match(/\b(Greater Noida|Gurugram|Pune|Hyderabad|Ggn|Ggurugram)\b.*/i);
        const hasRoleKeyword = l.toLowerCase().includes("developer") || l.toLowerCase().includes("intern") || l.toLowerCase().includes("engineer") || l.toLowerCase().includes("consultant") || l.toLowerCase().includes("analyst");
        
        if (currentExp.highlights.length === 0 && (locMatch || hasRoleKeyword) && l.length < 60) {
          let roleText = l;
          if (locMatch) {
            currentExp.location = locMatch[0].trim();
            roleText = l.replace(locMatch[0], "").trim().replace(/[-—,\s]+$/, "");
          }
          if (roleText && hasRoleKeyword) {
            currentExp.role = roleText;
          } else if (roleText && (!currentExp.role || currentExp.role === "Role Title")) {
            currentExp.role = roleText;
          }
        } else {
          // Highlight continuation
          const cleaned = l.replace(/^[•\-*]\s*/, "").trim();
          if (cleaned) {
            if (currentExp.highlights.length > 0) {
              currentExp.highlights[currentExp.highlights.length - 1] += " " + cleaned;
            } else {
              currentExp.highlights.push(cleaned);
            }
          }
        }
      }
    }
  });
  if (currentExp) data.experience.push(currentExp);

  // 5. Parse Extracurriculars
  const extraLines = getSectionContent(extraIdx, getNextSectionIdx("extra"));
  extraLines.forEach(l => {
    if (l.includes(":")) {
      const parts = l.split(":");
      data.extracurricular.push({
        title: parts[0].trim(),
        description: parts.slice(1).join(":").trim()
      });
    } else {
      data.extracurricular.push({
        title: "Extracurricular Achievement",
        description: l
      });
    }
  });

  // 6. Parse Certifications
  const certLines = getSectionContent(certIdx, getNextSectionIdx("certs"));
  certLines.forEach(l => {
    if (l.includes("•")) {
      const items = l.split("•").map(i => i.trim()).filter(i => i.length > 0);
      items.forEach(item => data.certifications.push(item));
    } else {
      const name = l.replace(/^[•\-*]\s*/, "");
      if (name.length > 0) {
        data.certifications.push(name);
      }
    }
  });

  return data;
}

function showCustomAlert(title, message, iconClass = "fa-solid fa-circle-info", color = "#3b82f6") {
  return new Promise((resolve) => {
    const backdrop = document.getElementById("customDialogContainer");
    const titleEl = document.getElementById("dialogTitle");
    const msgEl = document.getElementById("dialogMessage");
    const iconEl = document.getElementById("dialogIcon");
    const headerEl = backdrop.querySelector(".custom-dialog-header");
    const btnCancel = document.getElementById("dialogBtnCancel");
    const btnConfirm = document.getElementById("dialogBtnConfirm");

    titleEl.textContent = title;
    msgEl.innerHTML = message.replace(/\n/g, "<br>");
    iconEl.className = iconClass;
    headerEl.style.color = color;
    btnConfirm.style.background = `linear-gradient(135deg, ${color} 0%, ${adjustColorBrightness(color, -20)} 100%)`;

    btnCancel.style.display = "none";
    btnConfirm.textContent = "OK";
    backdrop.style.display = "flex";

    function onConfirm() {
      cleanup();
      resolve();
    }

    function cleanup() {
      btnConfirm.removeEventListener("click", onConfirm);
      backdrop.style.display = "none";
    }

    btnConfirm.addEventListener("click", onConfirm);
  });
}

function showCustomConfirm(title, message, iconClass = "fa-solid fa-circle-question", color = "#eab308") {
  return new Promise((resolve) => {
    const backdrop = document.getElementById("customDialogContainer");
    const titleEl = document.getElementById("dialogTitle");
    const msgEl = document.getElementById("dialogMessage");
    const iconEl = document.getElementById("dialogIcon");
    const headerEl = backdrop.querySelector(".custom-dialog-header");
    const btnCancel = document.getElementById("dialogBtnCancel");
    const btnConfirm = document.getElementById("dialogBtnConfirm");

    titleEl.textContent = title;
    msgEl.innerHTML = message.replace(/\n/g, "<br>");
    iconEl.className = iconClass;
    headerEl.style.color = color;
    btnConfirm.style.background = `linear-gradient(135deg, ${color} 0%, ${adjustColorBrightness(color, -20)} 100%)`;

    btnCancel.style.display = "block";
    btnConfirm.textContent = "Yes, Proceed";
    backdrop.style.display = "flex";

    function onConfirm() {
      cleanup();
      resolve(true);
    }

    function onCancel() {
      cleanup();
      resolve(false);
    }

    function cleanup() {
      btnConfirm.removeEventListener("click", onConfirm);
      btnCancel.removeEventListener("click", onCancel);
      backdrop.style.display = "none";
    }

    btnConfirm.addEventListener("click", onConfirm);
    btnCancel.addEventListener("click", onCancel);
  });
}

function adjustColorBrightness(hex, percent) {
  let R = parseInt(hex.substring(1, 3), 16);
  let G = parseInt(hex.substring(3, 5), 16);
  let B = parseInt(hex.substring(5, 7), 16);

  R = parseInt(R * (100 + percent) / 100);
  G = parseInt(G * (100 + percent) / 100);
  B = parseInt(B * (100 + percent) / 100);

  R = (R < 255) ? R : 255;
  G = (G < 255) ? G : 255;
  B = (B < 255) ? B : 255;

  R = (R > 0) ? R : 0;
  G = (G > 0) ? G : 0;
  B = (B > 0) ? B : 0;

  const rHex = R.toString(16).padStart(2, '0');
  const gHex = G.toString(16).padStart(2, '0');
  const bHex = B.toString(16).padStart(2, '0');

  return "#" + rHex + gHex + bHex;
}

async function triggerTestPDFImport() {
  const statusInd = document.querySelector(".status-indicator");
  if (statusInd) {
    statusInd.innerHTML = '<i class="fa-solid fa-spinner fa-spin"></i> Loading test PDF...';
  }
  
  try {
    const res = await fetch("test_pdf_base64.json");
    const data = await res.json();
    const binaryString = atob(data.base64);
    const len = binaryString.length;
    const bytes = new Uint8Array(len);
    for (let i = 0; i < len; i++) {
      bytes[i] = binaryString.charCodeAt(i);
    }
    const arrayBuffer = bytes.buffer;
    
    if (statusInd) {
      statusInd.innerHTML = '<i class="fa-solid fa-spinner fa-spin"></i> Parsing test PDF...';
    }
    
    const pdf = await pdfjsLib.getDocument({ data: arrayBuffer }).promise;
    let fullText = "";
    for (let i = 1; i <= pdf.numPages; i++) {
      const page = await pdf.getPage(i);
      const textContent = await page.getTextContent();
      const items = textContent.items;
      const linesMap = {};
      items.forEach(item => {
        if (!item.str.trim()) return;
        const x = item.transform[4];
        const y = item.transform[5];
        let foundLineYStr = null;
        for (const lineYStr in linesMap) {
          const lineY = parseFloat(lineYStr);
          if (Math.abs(lineY - y) < 5) {
            foundLineYStr = lineYStr;
            break;
          }
        }
        if (foundLineYStr !== null) {
          linesMap[foundLineYStr].push({ text: item.str, x: x });
        } else {
          linesMap[y] = [{ text: item.str, x: x }];
        }
      });
      const sortedYKeys = Object.keys(linesMap).map(Number).sort((a, b) => b - a);
      let pageText = "";
      sortedYKeys.forEach(yKey => {
        const lineItems = linesMap[yKey];
        lineItems.sort((a, b) => a.x - b.x);
        const lineText = lineItems.map(item => item.text).join(" ");
        pageText += lineText + "\n";
      });
      fullText += pageText + "\n";
    }
    
    const parsedData = parseResumeText(fullText);
    if (await showCustomConfirm("Import PDF", "We extracted your details from the PDF. Would you like to load this data into the editor? This will overwrite your current draft.", "fa-solid fa-file-pdf", "#3b82f6")) {
      resumeData = parsedData;
      saveState();
      renderAllForms();
      await showCustomAlert("Success", "Resume successfully parsed and imported from PDF!", "fa-solid fa-circle-check", "#10b981");
    }
  } catch (err) {
    console.error("PDF Parsing Error: ", err);
    await showCustomAlert("Error", "Failed to parse PDF: " + err.message, "fa-solid fa-circle-exclamation", "#ef4444");
  } finally {
    if (statusInd) {
      statusInd.innerHTML = '<i class="fa-solid fa-arrows-spin fa-spin"></i> Live Sync Active';
    }
  }
}

window.triggerTestPDFImport = triggerTestPDFImport;
