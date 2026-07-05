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
  sections: [
    {
      id: "education",
      name: "Education",
      type: "list",
      items: [
        {
          title: "Your University Name",
          subtitle: "Degree and Branch (e.g. B.Tech Computer Science) - CGPA - 9.00",
          duration: "08 2020 – 05 2024",
          location: "City, State, Country",
          highlights: []
        },
        {
          title: "Your School Name",
          subtitle: "12th CBSE Board - Percentage - 95%",
          duration: "05 2019 – 04 2020",
          location: "City, State, Country",
          highlights: []
        }
      ]
    },
    {
      id: "skills",
      name: "Skills",
      type: "tags",
      categories: [
        { id: "coursework", label: "Coursework", tags: ["Data Structures and Algorithms", "Operating Systems", "Object Oriented Programming", "Database Systems"] },
        { id: "frameworks", label: "Frameworks/Languages", tags: ["C++", "Java", "Python", "HTML", "CSS", "JavaScript", "React", "NodeJS", "SQL", "Docker"] }
      ]
    },
    {
      id: "projects",
      name: "Projects",
      type: "list",
      items: [
        {
          title: "Your Project Title",
          subtitle: "",
          duration: "",
          location: "",
          highlights: ["Describe your project key achievements, tech stack used, and key features. E.g. Built a responsive web app using React and NodeJS."]
        }
      ]
    },
    {
      id: "experience",
      name: "Experience",
      type: "list",
      items: [
        {
          title: "Your Company Name",
          subtitle: "Software Developer Intern",
          duration: "01 2024 – 06 2024",
          location: "City, State",
          highlights: [
            "Detail your primary job roles and responsibilities.",
            "Include metrics if possible: e.g. Reduced processing latencies by 30% using multi-threading in C++.",
            "Discuss team collaboration and tool integrations."
          ]
        }
      ]
    },
    {
      id: "extracurricular",
      name: "Extracurricular",
      type: "list",
      items: [
        {
          title: "Hackathon / Competition Name",
          subtitle: "Secured 1st/2nd/3rd rank in hackathons or coding contests.",
          duration: "",
          location: "",
          highlights: []
        }
      ]
    },
    {
      id: "certifications",
      name: "Certifications",
      type: "list",
      items: [
        { title: "Web Development Bootcamp", subtitle: "", duration: "", location: "", highlights: [] },
        { title: "Cloud Practitioner Certificate", subtitle: "", duration: "", location: "", highlights: [] }
      ]
    }
  ]
};

// DEFAULT DESIGN SETTINGS
const DEFAULT_DESIGN_DATA = {
  template: "classic",
  font: "font-inter",
  accentColor: "#1a56db",
  margin: "9",
  fontSize: "11",
  spacing: "6",
  lineHeight: "1.2",
  sectionOrder: ["education", "skills", "projects", "experience", "extracurricular", "certifications"],
  sectionVisibility: {
    education: true,
    skills: true,
    projects: true,
    experience: true,
    extracurricular: true,
    certifications: true
  }
};

// Application States
let resumeData = {};
let designData = {};

// Expose states to the window object dynamically via getters/setters for 3D game compatibility
Object.defineProperty(window, "resumeData", {
  get: () => resumeData,
  set: (val) => { resumeData = val; },
  configurable: true
});
Object.defineProperty(window, "designData", {
  get: () => designData,
  set: (val) => { designData = val; },
  configurable: true
});

let zoomLevel = 1.0;

// Initialize Application
document.addEventListener("DOMContentLoaded", async () => {
  await loadState();
  initTabNavigation();
  initFormInputs();
  initListControls();
  initDesignControls();
  updateDesignUI();
  initZoomAndUtilityControls();
  
  // Initial renders
  renderAllForms();
  initLayoutPanel();
  renderPreview();
  updateATSWidget();

  // Initialize ATS UI panel
  if (window.ATSUI) {
    window.ATSUI.init();
  }
});

// State Storage Management
// State Storage Management
function migrateToDynamicSchema(data) {
  if (!data) return null;
  if (data.sections && Array.isArray(data.sections)) return data; // Already migrated!

  const sections = [];

  // Migrate Education
  if (data.education && Array.isArray(data.education)) {
    sections.push({
      id: "education",
      name: "Education",
      type: "list",
      items: data.education.map(edu => ({
        title: edu.institution || "",
        subtitle: edu.degree || "",
        duration: edu.duration || "",
        location: edu.location || "",
        highlights: edu.highlights || []
      }))
    });
  }

  // Migrate Skills
  if (data.skills) {
    let categories = [];
    if (Array.isArray(data.skills)) {
      categories = data.skills;
    } else {
      categories = [
        { id: "coursework", label: "Coursework", tags: data.skills.coursework || [] },
        { id: "frameworks", label: "Frameworks/Languages", tags: data.skills.languagesFrameworks || [] }
      ];
    }
    sections.push({
      id: "skills",
      name: "Skills",
      type: "tags",
      categories: categories
    });
  }

  // Migrate Experience
  if (data.experience && Array.isArray(data.experience)) {
    sections.push({
      id: "experience",
      name: "Experience",
      type: "list",
      items: data.experience.map(exp => ({
        title: exp.company || "",
        subtitle: exp.role || "",
        duration: exp.duration || "",
        location: exp.location || "",
        highlights: exp.highlights || []
      }))
    });
  }

  // Migrate Projects
  if (data.projects && Array.isArray(data.projects)) {
    sections.push({
      id: "projects",
      name: "Projects",
      type: "list",
      items: data.projects.map(proj => ({
        title: proj.name || "",
        subtitle: "",
        duration: "",
        location: "",
        highlights: proj.description ? [proj.description] : (proj.highlights || [])
      }))
    });
  }

  // Migrate Extracurricular
  if (data.extracurricular && Array.isArray(data.extracurricular)) {
    sections.push({
      id: "extracurricular",
      name: "Extracurricular",
      type: "list",
      items: data.extracurricular.map(extra => ({
        title: extra.title || "",
        subtitle: "",
        duration: "",
        location: "",
        highlights: extra.description ? [extra.description] : (extra.highlights || [])
      }))
    });
  }

  // Migrate Certifications
  if (data.certifications && Array.isArray(data.certifications)) {
    sections.push({
      id: "certifications",
      name: "Certifications",
      type: "list",
      items: data.certifications.map(cert => {
        if (typeof cert === "string") {
          return { title: cert, subtitle: "", duration: "", location: "", highlights: [] };
        } else {
          return {
            title: cert.title || "",
            subtitle: cert.subtitle || "",
            duration: cert.duration || "",
            location: cert.location || "",
            highlights: cert.highlights || []
          };
        }
      })
    });
  }

  data.sections = sections;

  // Clean up old fields
  delete data.education;
  delete data.skills;
  delete data.experience;
  delete data.projects;
  delete data.extracurricular;
  delete data.certifications;

  return data;
}

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

  // Migrate to dynamic sections schema
  resumeData = migrateToDynamicSchema(resumeData);

  if (savedDesign) {
    try {
      designData = JSON.parse(savedDesign);
      // Migrate old large defaults to new compact, single-page optimized spacings
      if (designData.template === "modern") designData.template = "classic";
      if (designData.margin === "20") designData.margin = "12";
      if (designData.spacing === "15") designData.spacing = "8";
      if (designData.fontSize === "12") designData.fontSize = "11";
      if (designData.lineHeight === "1.3") designData.lineHeight = "1.2";
    } catch(e) {
      designData = { ...DEFAULT_DESIGN_DATA };
    }
  } else {
    designData = { ...DEFAULT_DESIGN_DATA };
  }

  // Ensure sectionOrder and sectionVisibility exist and are synced
  syncDesignDataWithSections();
}

function syncDesignDataWithSections() {
  if (!designData) designData = {};
  
  // Rebuild sectionOrder to match the current sections in resumeData
  const currentIds = resumeData.sections.map(s => s.id);
  designData.sectionOrder = currentIds;
  
  // Rebuild sectionVisibility: keep visibility of existing ones, default new ones to true
  const newVis = {};
  resumeData.sections.forEach(s => {
    if (designData.sectionVisibility && designData.sectionVisibility[s.id] !== undefined) {
      newVis[s.id] = designData.sectionVisibility[s.id];
    } else {
      newVis[s.id] = true;
    }
  });
  designData.sectionVisibility = newVis;
}

function saveState() {
  localStorage.setItem("resume_builder_data", JSON.stringify(resumeData));
  localStorage.setItem("resume_builder_design", JSON.stringify(designData));
  renderPreview();
  updateATSWidget();
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
  // Skills are now managed via tag chips — no textarea listeners needed
}

// Bind add buttons for list inputs
function initListControls() {
  // Delegate clicks on btn-add-skill-category
  document.addEventListener("click", (e) => {
    const btn = e.target.closest(".btn-add-skill-category");
    if (btn) {
      const secId = btn.dataset.sec;
      const skillsSec = resumeData.sections.find(s => s.id === secId);
      if (skillsSec) {
        if (!skillsSec.categories) skillsSec.categories = [];
        skillsSec.categories.push({ id: `cat_${Date.now()}`, label: "Custom Category", tags: [] });
        renderSkillsForm(skillsSec);
        saveState();
      }
    }
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

function updateDesignUI() {
  if (!designData) return;
  
  // 1. Template
  const templateRadios = document.querySelectorAll('input[name="layoutTemplate"]');
  templateRadios.forEach(radio => {
    radio.checked = (designData.template === radio.value);
  });
  
  // 2. Font
  const fontSelect = document.getElementById("selectFont");
  if (fontSelect) fontSelect.value = designData.font || "font-inter";
  
  // 3. Accent Color
  const colorPicker = document.getElementById("colorAccent");
  const colorText = document.getElementById("colorAccentText");
  if (colorPicker) colorPicker.value = designData.accentColor || "#1a56db";
  if (colorText) colorText.value = designData.accentColor || "#1a56db";
  
  // 4. Sliders
  const sliders = [
    { id: "rangeMargin", dataKey: "margin", labelVal: "valMargin" },
    { id: "rangeFontSize", dataKey: "fontSize", labelVal: "valFontSize" },
    { id: "rangeSpacing", dataKey: "spacing", labelVal: "valSpacing" },
    { id: "rangeLineHeight", dataKey: "lineHeight", labelVal: "valLineHeight" }
  ];
  
  sliders.forEach(slide => {
    const el = document.getElementById(slide.id);
    const label = document.getElementById(slide.labelVal);
    if (el) el.value = designData[slide.dataKey];
    if (label) label.textContent = designData[slide.dataKey];
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

  // Create custom section
  const btnCreateSection = document.getElementById("btnCreateCustomSection");
  const btnTabCreateSection = document.getElementById("btnTabCreateCustomSection");
  const customSecModal = document.getElementById("customSectionModal");
  const customSecNameInput = document.getElementById("customSecName");
  const customSecTypeSelect = document.getElementById("customSecType");
  const customSecBtnCancel = document.getElementById("customSecBtnCancel");
  const customSecBtnConfirm = document.getElementById("customSecBtnConfirm");

  if (customSecModal) {
    const openModal = () => {
      customSecNameInput.value = "";
      customSecTypeSelect.value = "list";
      customSecModal.style.display = "flex";
      customSecNameInput.focus();
    };

    if (btnCreateSection) btnCreateSection.addEventListener("click", openModal);
    if (btnTabCreateSection) btnTabCreateSection.addEventListener("click", openModal);

    customSecBtnCancel.addEventListener("click", () => {
      customSecModal.style.display = "none";
    });

    customSecBtnConfirm.addEventListener("click", () => {
      const name = customSecNameInput.value;
      const type = customSecTypeSelect.value;
      if (name && name.trim()) {
        const secId = "custom_" + Date.now();
        const cleanName = name.trim();
        
        const newSection = {
          id: secId,
          name: cleanName,
          type: type
        };

        if (type === "list") {
          newSection.items = [{
            title: "",
            subtitle: "",
            duration: "",
            location: "",
            highlights: [""]
          }];
        } else {
          newSection.categories = [{
            id: `cat_${Date.now()}_0`,
            label: "General",
            tags: []
          }];
        }

        resumeData.sections.push(newSection);

        if (!designData.sectionOrder) designData.sectionOrder = resumeData.sections.map(s => s.id);
        else designData.sectionOrder.push(secId);

        if (!designData.sectionVisibility) designData.sectionVisibility = {};
        designData.sectionVisibility[secId] = true;

        renderDynamicTabsAndPanels();
        renderSectionOrderList();
        saveState();

        customSecModal.style.display = "none";

        setTimeout(() => {
          const tabBtn = document.querySelector(`.tab-btn[data-tab="${secId}"]`);
          if (tabBtn) tabBtn.click();
        }, 100);
      }
    });
  }

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

  // -------------------------------------------------------
  // Single-Page Print: auto-scale to fit one A4 page
  // -------------------------------------------------------
  function printSinglePage() {
    const paper = document.getElementById("resumePaper");
    const wrapper = document.getElementById("resumeContentWrapper");
    if (!paper || !wrapper) { window.print(); return; }

    const A4_HEIGHT_PX = 1122; // 297mm at 96dpi
    const A4_WIDTH_PX  = 794;  // 210mm at 96dpi

    // Temporarily reset any current transform to measure true size
    const prevTransform = paper.style.transform;
    const prevWrapperTransform = wrapper.style.transform;
    
    paper.style.transform = "scale(1)";
    wrapper.style.transform = "none";

    // Convert margin in mm to pixels (1 mm = 3.7795 px)
    const marginPx = (parseFloat(designData.margin) || 12) * 3.7795;
    const printableHeightPx = A4_HEIGHT_PX - (2 * marginPx);
    const printableWidthPx  = A4_WIDTH_PX - (2 * marginPx);

    const contentH = wrapper.scrollHeight;
    const contentW = wrapper.scrollWidth;

    // Calculate scale to fit within the printable area
    const scaleH = printableHeightPx / contentH;
    const scaleW = printableWidthPx  / contentW;
    const scale  = Math.min(scaleH, scaleW, 1); // never upscale

    // Restore original transform
    paper.style.transform = prevTransform;
    wrapper.style.transform = prevWrapperTransform;

    // Apply scale via CSS variable (picked up by @media print)
    document.documentElement.style.setProperty("--print-scale", scale.toFixed(4));

    // Trigger print
    window.print();
  }

  document.getElementById("btnPrint").addEventListener("click", printSinglePage);

  // Handle printing events globally (button or Ctrl+P/Cmd+P shortcuts)
  window.addEventListener("beforeprint", () => {
    const paper = document.getElementById("resumePaper");
    const wrapper = document.getElementById("resumeContentWrapper");
    if (!paper || !wrapper) return;
    const A4_HEIGHT_PX = 1122;
    const A4_WIDTH_PX  = 794;
    
    const prevTransform = paper.style.transform;
    const prevWrapperTransform = wrapper.style.transform;
    
    paper.style.transform = "scale(1)";
    wrapper.style.transform = "none";
    
    const marginPx = (parseFloat(designData.margin) || 12) * 3.7795;
    const printableHeightPx = A4_HEIGHT_PX - (2 * marginPx);
    const printableWidthPx  = A4_WIDTH_PX - (2 * marginPx);

    const contentH = wrapper.scrollHeight;
    const contentW = wrapper.scrollWidth;
    
    paper.style.transform = prevTransform;
    wrapper.style.transform = prevWrapperTransform;
    
    const scale = Math.min(printableHeightPx / contentH, printableWidthPx / contentW, 1);
    document.documentElement.style.setProperty("--print-scale", scale.toFixed(4));
  });

  window.addEventListener("afterprint", () => {
    document.documentElement.style.setProperty("--print-scale", "1");
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
      renderSectionOrderList();
      renderPreview();
      updateATSWidget();
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
        if (parsed.personal && (parsed.education || parsed.sections || parsed.experience)) {
          resumeData = migrateToDynamicSchema(parsed);
          syncDesignDataWithSections();
          saveState();
          renderAllForms();
          await showCustomAlert("Import Successful", "Resume data successfully imported!", "fa-solid fa-circle-check", "#10b981");
        } else {
          await showCustomAlert("Import Failed", "Failed to parse JSON: Missing critical sections (personal, sections). Ensure this is a valid JSON backup file exported from this builder.", "fa-solid fa-circle-exclamation", "#ef4444");
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
        const arrayBuffer = await file.arrayBuffer();
        const text = await extractTextFromPDF(arrayBuffer);
        const parsedData = parseResumeText(text);
        
        if (await showCustomConfirm("Import PDF", "We extracted your details from the PDF. Would you like to load this data into the editor? This will overwrite your current draft.", "fa-solid fa-file-pdf", "#3b82f6")) {
          resumeData = parsedData;
          // Apply tight, compact margins and spacing for a professional look on import
          designData.margin = "6";
          designData.spacing = "2";
          designData.fontSize = "9.5";
          designData.lineHeight = "1.15";
          updateDesignUI();
          syncDesignDataWithSections();
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

// Helper: Escape HTML special chars to prevent XSS in templates
function escHtml(str) {
  return String(str || '').replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;');
}

// Helper: Parse markdown formatting (bold, italic, underline, links, headings)
function parseMarkdown(text) {
  if (!text) return "";
  let html = escHtml(text);
  
  // Bold: **text** or __text__
  html = html.replace(/\*\*(.*?)\*\*/g, "<strong>$1</strong>");
  html = html.replace(/__(.*?)__/g, "<strong>$1</strong>");
  
  // Italic: *text* or _text_
  html = html.replace(/\*(.*?)\*/g, "<em>$1</em>");
  html = html.replace(/_(.*?)_/g, "<em>$1</em>");
  
  // Underline: ~text~
  html = html.replace(/~(.*?)~/g, "<u>$1</u>");
  
  // Headings: ### heading, ## heading, # heading
  html = html.replace(/^### (.*?)$/gm, "<h3>$1</h3>");
  html = html.replace(/^## (.*?)$/gm, "<h2>$1</h2>");
  html = html.replace(/^# (.*?)$/gm, "<h1>$1</h1>");
  
  // Links: [text](url)
  html = html.replace(/\[(.*?)\]\((.*?)\)/g, '<a href="$2" target="_blank" style="color:var(--accent-color);text-decoration:underline;">$1</a>');
  
  return html;
}

// Helper: Apply markdown formatting directly to selection in inputs
function applyFormatting(input, action) {
  if (!input) return;
  const start = input.selectionStart;
  const end = input.selectionEnd;
  const val = input.value;
  const selected = val.substring(start, end);

  let formatted = "";
  let caretOffset = 0;

  switch (action) {
    case "bold":
      formatted = `**${selected || "bold text"}**`;
      caretOffset = selected ? 0 : 2;
      break;
    case "italic":
      formatted = `*${selected || "italic text"}*`;
      caretOffset = selected ? 0 : 1;
      break;
    case "underline":
      formatted = `~${selected || "underlined text"}~`;
      caretOffset = selected ? 0 : 1;
      break;
    case "link":
      const url = prompt("Enter URL:", "https://");
      if (url === null) return;
      formatted = `[${selected || "link text"}](${url})`;
      break;
  }

  input.value = val.substring(0, start) + formatted + val.substring(end);
  input.focus();
  
  if (selected) {
    input.setSelectionRange(start + formatted.length, start + formatted.length);
  } else {
    const newCursor = start + formatted.length - caretOffset;
    input.setSelectionRange(newCursor, newCursor);
  }

  input.dispatchEvent(new Event("input", { bubbles: true }));
}

// Bind keyboard shortcuts (Ctrl+B, Ctrl+I, Ctrl+U) to all input/textarea fields
document.addEventListener("keydown", (e) => {
  if ((e.ctrlKey || e.metaKey) && ["b", "i", "u"].includes(e.key.toLowerCase())) {
    const active = document.activeElement;
    if (active && (active.tagName === "INPUT" || active.tagName === "TEXTAREA")) {
      e.preventDefault();
      const key = e.key.toLowerCase();
      const action = key === "b" ? "bold" : key === "i" ? "italic" : "underline";
      applyFormatting(active, action);
    }
  }
});

  window.updateResumeData = (d) => { resumeData = d; };
  window.saveState = saveState;
  window.syncDesignDataWithSections = syncDesignDataWithSections;
  window.saveDesignState = () => { localStorage.setItem("resume_builder_design", JSON.stringify(designData)); };

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

  // Render all dynamic tabs and panels
  renderDynamicTabsAndPanels();
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

// Skills: Tag chip input form
function renderSkillsForm(sec) {
  if (!sec) return;
  if (!sec.categories || sec.categories.length === 0) {
    sec.categories = [{
      id: `cat_${Date.now()}_0`,
      label: "General",
      tags: []
    }];
    saveState();
  }

  const container = document.getElementById(`skills-list-${sec.id}`);
  if (!container) return;
  container.innerHTML = "";

  const skillsArr = sec.categories || [];

  skillsArr.forEach((cat, catIdx) => {
    const div = document.createElement("div");
    div.className = "skill-category-block";
    div.innerHTML = `
      <div class="skill-category-header">
        <input type="text" class="skill-cat-label" value="${escHtml(cat.label)}" data-idx="${catIdx}" placeholder="Category name">
        <button class="btn-remove-item skill-cat-delete" data-idx="${catIdx}" title="Remove category"><i class="fa-solid fa-trash"></i></button>
      </div>
      <div class="skill-tags-area" data-catidx="${catIdx}">
        ${cat.tags.map((tag, tIdx) => `
          <span class="skill-tag">
            ${escHtml(tag)}
            <button class="skill-tag-remove" data-catidx="${catIdx}" data-tidx="${tIdx}" title="Remove skill">×</button>
          </span>
        `).join("")}
        <input type="text" class="skill-tag-input" data-catidx="${catIdx}" placeholder="Type skill, press Enter">
      </div>
    `;
    container.appendChild(div);
  });

  // Bind label change
  container.querySelectorAll(".skill-cat-label").forEach(inp => {
    inp.addEventListener("input", (e) => {
      skillsArr[+e.target.dataset.idx].label = e.target.value;
      saveState();
    });
  });

  // Bind category delete
  container.querySelectorAll(".skill-cat-delete").forEach(btn => {
    btn.addEventListener("click", (e) => {
      const idx = +btn.dataset.idx;
      skillsArr.splice(idx, 1);
      renderSkillsForm(sec);
      saveState();
    });
  });

  // Bind tag remove
  container.querySelectorAll(".skill-tag-remove").forEach(btn => {
    btn.addEventListener("click", (e) => {
      const ci = +btn.dataset.catidx;
      const ti = +btn.dataset.tidx;
      skillsArr[ci].tags.splice(ti, 1);
      renderSkillsForm(sec);
      saveState();
    });
  });

  // Bind tag add on Enter
  container.querySelectorAll(".skill-tag-input").forEach(inp => {
    inp.addEventListener("keydown", (e) => {
      if (e.key === "Enter" || e.key === ",") {
        e.preventDefault();
        const val = inp.value.trim().replace(/,$/, "");
        const ci = +inp.dataset.catidx;
        if (val && !skillsArr[ci].tags.includes(val)) {
          skillsArr[ci].tags.push(val);
          renderSkillsForm(sec);
          saveState();
          // Refocus the input for the same category
          const inputs = container.querySelectorAll(".skill-tag-input");
          if (inputs[ci]) inputs[ci].focus();
        }
      }
    });
  });
}

function getIconClass(id) {
  const mapping = {
    education: "fa-graduation-cap",
    skills: "fa-screwdriver-wrench",
    experience: "fa-briefcase",
    projects: "fa-laptop-code",
    extracurricular: "fa-award",
    certifications: "fa-certificate"
  };
  return mapping[id] || "fa-folder-open";
}

function renderDynamicTabsAndPanels() {
  const tabsContainer = document.getElementById("dynamicTabs");
  const panelsContainer = document.getElementById("dynamicPanels");
  if (!tabsContainer || !panelsContainer) return;

  const activeTabBtn = document.querySelector(".editor-tabs .tab-btn.active");
  const activeTabId = activeTabBtn ? activeTabBtn.dataset.tab : "personal";

  tabsContainer.innerHTML = "";
  panelsContainer.innerHTML = "";


  resumeData.sections.forEach(sec => {
    const btn = document.createElement("button");
    btn.className = "tab-btn" + (activeTabId === sec.id ? " active" : "");
    btn.dataset.tab = sec.id;
    btn.innerHTML = `<i class="fa-solid ${getIconClass(sec.id)}"></i> ${sec.name}`;
    tabsContainer.appendChild(btn);

    const panel = document.createElement("section");
    panel.className = "tab-panel" + (activeTabId === sec.id ? " active" : "");
    panel.id = `panel-${sec.id}`;
    panelsContainer.appendChild(panel);

    if (sec.type === "tags") {
      renderSkillsFormMarkup(panel, sec);
    } else {
      renderListFormMarkup(panel, sec);
    }
  });

  bindTabNavigationHandlers();
}

function bindTabNavigationHandlers() {
  const tabButtons = document.querySelectorAll(".editor-tabs .tab-btn");
  const panels = document.querySelectorAll(".editor-panels .tab-panel");
  
  tabButtons.forEach(btn => {
    if (btn.id === "btnTabCreateCustomSection") return;
    btn.replaceWith(btn.cloneNode(true));
  });

  const newTabButtons = document.querySelectorAll(".editor-tabs .tab-btn");
  const newPanels = document.querySelectorAll(".editor-panels .tab-panel");

  newTabButtons.forEach(btn => {
    if (btn.id === "btnTabCreateCustomSection") return;
    btn.addEventListener("click", () => {
      newTabButtons.forEach(b => b.classList.remove("active"));
      newPanels.forEach(p => p.classList.remove("active"));
      
      btn.classList.add("active");
      const targetPanel = document.getElementById(`panel-${btn.dataset.tab}`);
      if (targetPanel) targetPanel.classList.add("active");
    });
  });
}

function renderSkillsFormMarkup(panel, sec) {
  panel.innerHTML = `
    <div class="panel-header-action">
      <input type="text" class="section-title-input" value="${escHtml(sec.name)}" data-sec="${sec.id}" title="Click to rename section">
      <div style="display: flex; gap: 8px;">
        <button class="btn btn-small btn-secondary btn-add-skill-category" data-sec="${sec.id}"><i class="fa-solid fa-plus"></i> Add Category</button>
        <button class="btn btn-small btn-danger btn-delete-section" data-sec="${sec.id}" title="Delete whole section"><i class="fa-solid fa-trash"></i></button>
      </div>
    </div>
    <div class="skill-categories-list" id="skills-list-${sec.id}"></div>
  `;

  const titleInput = panel.querySelector(".section-title-input");
  if (titleInput) {
    titleInput.addEventListener("input", (e) => {
      const newName = e.target.value.trim();
      if (newName) {
        sec.name = newName;
        const tabBtn = document.querySelector(`.editor-tabs .tab-btn[data-tab="${sec.id}"]`);
        if (tabBtn) {
          tabBtn.innerHTML = `<i class="fa-solid ${getIconClass(sec.id)}"></i> ${escHtml(newName)}`;
        }
        const orderLabel = document.querySelector(`.section-order-row[data-key="${sec.id}"] .section-row-label`);
        if (orderLabel) {
          orderLabel.textContent = newName;
        }
        saveState();
        renderPreview();
      }
    });
  }

  panel.querySelector(".btn-delete-section").addEventListener("click", async (e) => {
    const sId = e.currentTarget.dataset.sec;
    if (await showCustomConfirm("Delete Section", `Are you sure you want to delete the "${sec.name}" section?`)) {
      const idx = resumeData.sections.findIndex(s => s.id === sId);
      if (idx !== -1) resumeData.sections.splice(idx, 1);
      const oIdx = designData.sectionOrder.indexOf(sId);
      if (oIdx !== -1) designData.sectionOrder.splice(oIdx, 1);
      const personalTabBtn = document.querySelector('.tab-btn[data-tab="personal"]');
      if (personalTabBtn) personalTabBtn.click();
      renderDynamicTabsAndPanels();
      renderSectionOrderList();
      saveState();
    }
  });

  renderSkillsForm(sec);
}

function renderListFormMarkup(panel, sec) {
  if (!sec.items || sec.items.length === 0) {
    sec.items = [{
      title: "",
      subtitle: "",
      duration: "",
      location: "",
      highlights: [""]
    }];
    saveState();
  }

  panel.innerHTML = `
    <div class="panel-header-action">
      <input type="text" class="section-title-input" value="${escHtml(sec.name)}" data-sec="${sec.id}" title="Click to rename section">
      <div style="display: flex; gap: 8px;">
        <button class="btn btn-small btn-secondary btn-add-item" data-sec="${sec.id}"><i class="fa-solid fa-plus"></i> Add Item</button>
        <button class="btn btn-small btn-danger btn-delete-section" data-sec="${sec.id}" title="Delete whole section"><i class="fa-solid fa-trash"></i></button>
      </div>
    </div>
    <div class="list-container" id="list-${sec.id}"></div>
  `;

  const titleInput = panel.querySelector(".section-title-input");
  if (titleInput) {
    titleInput.addEventListener("input", (e) => {
      const newName = e.target.value.trim();
      if (newName) {
        sec.name = newName;
        const tabBtn = document.querySelector(`.editor-tabs .tab-btn[data-tab="${sec.id}"]`);
        if (tabBtn) {
          tabBtn.innerHTML = `<i class="fa-solid ${getIconClass(sec.id)}"></i> ${escHtml(newName)}`;
        }
        const orderLabel = document.querySelector(`.section-order-row[data-key="${sec.id}"] .section-row-label`);
        if (orderLabel) {
          orderLabel.textContent = newName;
        }
        saveState();
        renderPreview();
      }
    });
  }

  panel.querySelector(".btn-delete-section").addEventListener("click", async (e) => {
    const sId = e.currentTarget.dataset.sec;
    if (await showCustomConfirm("Delete Section", `Are you sure you want to delete the "${sec.name}" section?`)) {
      const idx = resumeData.sections.findIndex(s => s.id === sId);
      if (idx !== -1) resumeData.sections.splice(idx, 1);
      const oIdx = designData.sectionOrder.indexOf(sId);
      if (oIdx !== -1) designData.sectionOrder.splice(oIdx, 1);
      const personalTabBtn = document.querySelector('.tab-btn[data-tab="personal"]');
      if (personalTabBtn) personalTabBtn.click();
      renderDynamicTabsAndPanels();
      renderSectionOrderList();
      saveState();
    }
  });

  const container = document.getElementById(`list-${sec.id}`);
  if (!container) return;

  const getPlaceholder = (field) => {
    const mappings = {
      education: { title: "Institution", subtitle: "Degree / Program Details", duration: "Duration (e.g. 2020 – 2024)", location: "Location (City, Country)" },
      experience: { title: "Company Name", subtitle: "Role / Job Title", duration: "Duration (e.g. 2024 – Present)", location: "Location (City, Country)" },
      projects: { title: "Project Title", subtitle: "Tech Stack / Technologies", duration: "Date (e.g. 05 2024)", location: "Project Link / URL" },
      extracurricular: { title: "Achievement / Activity", subtitle: "Organization / Context", duration: "Date / Duration", location: "Location / Link" },
      certifications: { title: "Certificate Name", subtitle: "Issuing Organization", duration: "Date Issued", location: "Credential ID / Link" }
    };
    return (mappings[sec.id] && mappings[sec.id][field]) || field.charAt(0).toUpperCase() + field.slice(1);
  };

  (sec.items || []).forEach((item, index) => {
    const itemDiv = document.createElement("div");
    itemDiv.className = "list-item";

    let highlightsHtml = "";
    (item.highlights || []).forEach((hl, hlIdx) => {
      const targetId = `input-hl-${sec.id}-${index}-${hlIdx}`;
      highlightsHtml += `
        <div class="highlight-row">
          <div class="highlight-input-wrapper">
            <div class="format-toolbar mini-toolbar" data-target="${targetId}">
              <button type="button" class="btn-format" data-action="bold" title="Bold"><b>B</b></button>
              <button type="button" class="btn-format" data-action="italic" title="Italic"><i>I</i></button>
              <button type="button" class="btn-format" data-action="underline" title="Underline"><u>U</u></button>
              <button type="button" class="btn-format" data-action="link" title="Link">🔗</button>
            </div>
            <input type="text" id="${targetId}" value="${escHtml(hl)}" class="item-hl-input" data-sec="${sec.id}" data-item-idx="${index}" data-hl-idx="${hlIdx}">
          </div>
          <button class="btn-remove-highlight" data-sec="${sec.id}" data-item-idx="${index}" data-hl-idx="${hlIdx}"><i class="fa-solid fa-xmark"></i></button>
        </div>
      `;
    });

    const titleId = `input-${sec.id}-${index}-title`;
    const subtitleId = `input-${sec.id}-${index}-subtitle`;
    const durationId = `input-${sec.id}-${index}-duration`;
    const locationId = `input-${sec.id}-${index}-location`;

    itemDiv.innerHTML = `
      <div class="form-grid">
        <div class="form-group col-span-2">
          <div class="label-with-format">
            <label>${getPlaceholder('title')}</label>
            <div class="format-toolbar" data-target="${titleId}">
              <button type="button" class="btn-format" data-action="bold" title="Bold"><b>B</b></button>
              <button type="button" class="btn-format" data-action="italic" title="Italic"><i>I</i></button>
              <button type="button" class="btn-format" data-action="underline" title="Underline"><u>U</u></button>
              <button type="button" class="btn-format" data-action="link" title="Link">🔗</button>
            </div>
          </div>
          <input type="text" id="${titleId}" value="${escHtml(item.title)}" class="item-field" data-sec="${sec.id}" data-idx="${index}" data-field="title" placeholder="${getPlaceholder('title')}">
        </div>
        <div class="form-group col-span-2">
          <div class="label-with-format">
            <label>${getPlaceholder('subtitle')}</label>
            <div class="format-toolbar" data-target="${subtitleId}">
              <button type="button" class="btn-format" data-action="bold" title="Bold"><b>B</b></button>
              <button type="button" class="btn-format" data-action="italic" title="Italic"><i>I</i></button>
              <button type="button" class="btn-format" data-action="underline" title="Underline"><u>U</u></button>
              <button type="button" class="btn-format" data-action="link" title="Link">🔗</button>
            </div>
          </div>
          <input type="text" id="${subtitleId}" value="${escHtml(item.subtitle)}" class="item-field" data-sec="${sec.id}" data-idx="${index}" data-field="subtitle" placeholder="${getPlaceholder('subtitle')}">
        </div>
        <div class="form-group">
          <div class="label-with-format">
            <label>${getPlaceholder('duration')}</label>
            <div class="format-toolbar" data-target="${durationId}">
              <button type="button" class="btn-format" data-action="bold" title="Bold"><b>B</b></button>
              <button type="button" class="btn-format" data-action="italic" title="Italic"><i>I</i></button>
              <button type="button" class="btn-format" data-action="underline" title="Underline"><u>U</u></button>
              <button type="button" class="btn-format" data-action="link" title="Link">🔗</button>
            </div>
          </div>
          <input type="text" id="${durationId}" value="${escHtml(item.duration)}" class="item-field" data-sec="${sec.id}" data-idx="${index}" data-field="duration" placeholder="${getPlaceholder('duration')}">
        </div>
        <div class="form-group">
          <div class="label-with-format">
            <label>${getPlaceholder('location')}</label>
            <div class="format-toolbar" data-target="${locationId}">
              <button type="button" class="btn-format" data-action="bold" title="Bold"><b>B</b></button>
              <button type="button" class="btn-format" data-action="italic" title="Italic"><i>I</i></button>
              <button type="button" class="btn-format" data-action="underline" title="Underline"><u>U</u></button>
              <button type="button" class="btn-format" data-action="link" title="Link">🔗</button>
            </div>
          </div>
          <input type="text" id="${locationId}" value="${escHtml(item.location)}" class="item-field" data-sec="${sec.id}" data-idx="${index}" data-field="location" placeholder="${getPlaceholder('location')}">
        </div>
        
        <div class="form-group col-span-2">
          <label>Bullet Points / Key Highlights</label>
          <div class="highlights-container">
            <div class="highlights-list-area">
              ${highlightsHtml}
            </div>
            <button class="btn btn-small btn-secondary btn-add-highlight" data-sec="${sec.id}" data-idx="${index}" style="margin-top: 8px;">
              <i class="fa-solid fa-plus"></i> Add Bullet Point
            </button>
          </div>
        </div>
      </div>
      <div class="list-item-controls">
        <button class="btn-move-up btn-item-up" data-sec="${sec.id}" data-idx="${index}"><i class="fa-solid fa-arrow-up"></i> Move Up</button>
        <button class="btn-move-down btn-item-down" data-sec="${sec.id}" data-idx="${index}"><i class="fa-solid fa-arrow-down"></i> Move Down</button>
        <button class="btn-remove-item btn-item-delete" data-sec="${sec.id}" data-idx="${index}"><i class="fa-solid fa-trash"></i> Delete</button>
      </div>
    `;
    container.appendChild(itemDiv);
  });

  container.querySelectorAll(".item-field").forEach(input => {
    input.addEventListener("input", (e) => {
      const { sec: sId, idx, field } = e.target.dataset;
      const targetSec = resumeData.sections.find(s => s.id === sId);
      if (targetSec && targetSec.items[idx]) {
        targetSec.items[idx][field] = e.target.value;
        saveState();
      }
    });
  });

  container.querySelectorAll(".item-hl-input").forEach(input => {
    input.addEventListener("input", (e) => {
      const { sec: sId, itemIdx, hlIdx } = e.target.dataset;
      const targetSec = resumeData.sections.find(s => s.id === sId);
      if (targetSec && targetSec.items[itemIdx] && targetSec.items[itemIdx].highlights) {
        targetSec.items[itemIdx].highlights[hlIdx] = e.target.value;
        saveState();
      }
    });
  });

  container.querySelectorAll(".btn-add-highlight").forEach(btn => {
    btn.addEventListener("click", (e) => {
      const { sec: sId, idx } = btn.dataset;
      const targetSec = resumeData.sections.find(s => s.id === sId);
      if (targetSec && targetSec.items[idx]) {
        if (!targetSec.items[idx].highlights) targetSec.items[idx].highlights = [];
        targetSec.items[idx].highlights.push("New bullet highlight.");
        renderDynamicTabsAndPanels();
        saveState();
      }
    });
  });

  container.querySelectorAll(".btn-remove-highlight").forEach(btn => {
    btn.addEventListener("click", (e) => {
      const { sec: sId, itemIdx, hlIdx } = btn.dataset;
      const targetSec = resumeData.sections.find(s => s.id === sId);
      if (targetSec && targetSec.items[itemIdx] && targetSec.items[itemIdx].highlights) {
        targetSec.items[itemIdx].highlights.splice(hlIdx, 1);
        renderDynamicTabsAndPanels();
        saveState();
      }
    });
  });

  container.querySelectorAll(".btn-item-up").forEach(btn => {
    btn.addEventListener("click", (e) => {
      const { sec: sId, idx } = btn.dataset;
      const index = parseInt(idx);
      const targetSec = resumeData.sections.find(s => s.id === sId);
      if (targetSec && index > 0) {
        swapItems(targetSec.items, index, index - 1);
        renderDynamicTabsAndPanels();
        saveState();
      }
    });
  });

  container.querySelectorAll(".btn-item-down").forEach(btn => {
    btn.addEventListener("click", (e) => {
      const { sec: sId, idx } = btn.dataset;
      const index = parseInt(idx);
      const targetSec = resumeData.sections.find(s => s.id === sId);
      if (targetSec && index < targetSec.items.length - 1) {
        swapItems(targetSec.items, index, index + 1);
        renderDynamicTabsAndPanels();
        saveState();
      }
    });
  });

  container.querySelectorAll(".btn-item-delete").forEach(btn => {
    btn.addEventListener("click", async (e) => {
      const { sec: sId, idx } = btn.dataset;
      const index = parseInt(idx);
      const targetSec = resumeData.sections.find(s => s.id === sId);
      if (targetSec) {
        if (await showCustomConfirm("Delete Item", "Are you sure you want to delete this item?")) {
          targetSec.items.splice(index, 1);
          renderDynamicTabsAndPanels();
          saveState();
        }
      }
    });
  });

  panel.querySelector(".btn-add-item").addEventListener("click", (e) => {
    const sId = e.currentTarget.dataset.sec;
    const targetSec = resumeData.sections.find(s => s.id === sId);
    if (targetSec) {
      if (!targetSec.items) targetSec.items = [];
      targetSec.items.push({ title: "New Item", subtitle: "", duration: "", location: "", highlights: [] });
      renderDynamicTabsAndPanels();
      saveState();
    }
  });

  panel.querySelector(".btn-delete-section").addEventListener("click", async (e) => {
    const sId = e.currentTarget.dataset.sec;
    const targetSec = resumeData.sections.find(s => s.id === sId);
    if (targetSec) {
      if (await showCustomConfirm("Delete Section", `Are you sure you want to completely delete the "${targetSec.name}" section? This will remove all items inside it.`)) {
        const idx = resumeData.sections.findIndex(s => s.id === sId);
        if (idx !== -1) resumeData.sections.splice(idx, 1);

        const oIdx = designData.sectionOrder.indexOf(sId);
        if (oIdx !== -1) designData.sectionOrder.splice(oIdx, 1);
        if (designData.sectionVisibility) delete designData.sectionVisibility[sId];

        const personalTabBtn = document.querySelector('.tab-btn[data-tab="personal"]');
        if (personalTabBtn) personalTabBtn.click();

        renderDynamicTabsAndPanels();
        renderSectionOrderList();
        saveState();
      }
    }
  });

  // Bind formatting toolbar buttons
  container.querySelectorAll(".btn-format").forEach(btn => {
    btn.addEventListener("mousedown", (e) => {
      e.preventDefault(); // Prevent input defocus!
      const targetId = btn.closest(".format-toolbar").dataset.target;
      const input = document.getElementById(targetId);
      if (input) {
        applyFormatting(input, btn.dataset.action);
      }
    });
  });
}

// Layout Order Panel: drag-and-drop section reordering + visibility toggles
const SECTION_META = {
  education:       { label: "Education",       icon: "fa-graduation-cap" },
  skills:          { label: "Skills",           icon: "fa-screwdriver-wrench" },
  projects:        { label: "Projects",         icon: "fa-laptop-code" },
  experience:      { label: "Experience",       icon: "fa-briefcase" },
  extracurricular: { label: "Extracurriculars", icon: "fa-award" },
  certifications:  { label: "Certifications",   icon: "fa-certificate" }
};

function initLayoutPanel() {
  renderSectionOrderList();
}

function renderSectionOrderList() {
  const container = document.getElementById("sectionOrderList");
  if (!container) return;
  container.innerHTML = "";

  const order = designData.sectionOrder || resumeData.sections.map(s => s.id);
  const vis   = designData.sectionVisibility || {};

  order.forEach((key, idx) => {
    const sec = resumeData.sections.find(s => s.id === key);
    if (!sec) return;

    const iconClass = (SECTION_META[key] && SECTION_META[key].icon) || "fa-folder-open";
    const label = sec.name;
    const visible = vis[key] !== false;

    const row = document.createElement("div");
    row.className = "section-order-row" + (visible ? "" : " section-hidden");
    row.dataset.key = key;
    row.draggable = true;
    row.innerHTML = `
      <span class="section-drag-handle" title="Drag to reorder"><i class="fa-solid fa-grip-vertical"></i></span>
      <i class="fa-solid ${iconClass} section-row-icon"></i>
      <span class="section-row-label">${label}</span>
      <div class="section-row-actions">
        <button class="btn-move-up section-order-up" data-idx="${idx}" title="Move up"><i class="fa-solid fa-arrow-up"></i></button>
        <button class="btn-move-down section-order-down" data-idx="${idx}" title="Move down"><i class="fa-solid fa-arrow-down"></i></button>
        <button class="btn-visibility-toggle${visible ? " visible" : ""}" data-key="${key}" title="${visible ? "Hide section" : "Show section"}">
          <i class="fa-solid ${visible ? "fa-eye" : "fa-eye-slash"}"></i>
        </button>
      </div>
    `;
    container.appendChild(row);
  });

  container.querySelectorAll(".section-order-up").forEach(btn => {
    btn.addEventListener("click", () => {
      const idx = +btn.dataset.idx;
      if (idx === 0) return;
      swapItems(designData.sectionOrder, idx, idx - 1);
      renderSectionOrderList();
      saveState();
    });
  });
  container.querySelectorAll(".section-order-down").forEach(btn => {
    btn.addEventListener("click", () => {
      const idx = +btn.dataset.idx;
      if (idx >= designData.sectionOrder.length - 1) return;
      swapItems(designData.sectionOrder, idx, idx + 1);
      renderSectionOrderList();
      saveState();
    });
  });

  container.querySelectorAll(".btn-visibility-toggle").forEach(btn => {
    btn.addEventListener("click", () => {
      const key = btn.dataset.key;
      designData.sectionVisibility[key] = !btn.classList.contains("visible");
      renderSectionOrderList();
      saveState();
    });
  });

  let dragSrc = null;
  container.querySelectorAll(".section-order-row").forEach(row => {
    row.addEventListener("dragstart", (e) => {
      dragSrc = row;
      row.classList.add("dragging");
      e.dataTransfer.effectAllowed = "move";
    });
    row.addEventListener("dragend", () => {
      row.classList.remove("dragging");
      container.querySelectorAll(".section-order-row").forEach(r => r.classList.remove("drag-over"));
    });
    row.addEventListener("dragover", (e) => {
      e.preventDefault();
      if (row !== dragSrc) {
        container.querySelectorAll(".section-order-row").forEach(r => r.classList.remove("drag-over"));
        row.classList.add("drag-over");
      }
    });
    row.addEventListener("drop", (e) => {
      e.preventDefault();
      if (dragSrc && dragSrc !== row) {
        const srcKey = dragSrc.dataset.key;
        const dstKey = row.dataset.key;
        const srcIdx = designData.sectionOrder.indexOf(srcKey);
        const dstIdx = designData.sectionOrder.indexOf(dstKey);
        if (srcIdx !== -1 && dstIdx !== -1) {
          designData.sectionOrder.splice(srcIdx, 1);
          designData.sectionOrder.splice(dstIdx, 0, srcKey);
          renderSectionOrderList();
          saveState();
        }
      }
    });
  });
}

// ATS Score: calculate content completeness percentage
function calcATSScore() {
  if (window.ATSEngine) {
    return window.ATSEngine.getScore(resumeData);
  }
  return 0;
}

function updateATSWidget() {
  if (window.ATSEngine) {
    window.ATSEngine.updateWidget();
  }
  if (window.ATSUI) {
    window.ATSUI.refresh();
  }
}

/* ==========================================================================
   RESUME LIVE PREVIEW RENDERING ENGINE
   ========================================================================== */

function renderPreview() {
  const paper = document.getElementById("resumePaper");
  if (!paper) return;
  const wrapper = document.getElementById("resumeContentWrapper") || paper;
  
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
    contactItems.push(`<a href="${p.leetcode.url || '#'}" target="_blank" class="resume-contact-item"><i class="fa-solid fa-code"></i> ${p.leetcode.username}</a>`);
  }
  if (p.hackerrank && p.hackerrank.username) {
    contactItems.push(`<a href="${p.hackerrank.url || '#'}" target="_blank" class="resume-contact-item"><i class="fa-solid fa-square-poll-vertical"></i> ${p.hackerrank.username}</a>`);
  }

  htmlContent += `
    <header class="resume-header" data-section-link="personal">
      <h1>${parseMarkdown(p.name)}</h1>
      <div class="location">${parseMarkdown(p.location)}</div>
      <div class="resume-contact-row">
        ${contactItems.join(" &bull; ")}
      </div>
    </header>
  `;

  // 2. Render dynamic sections based on sectionOrder and sectionVisibility
  const order = designData.sectionOrder || resumeData.sections.map(s => s.id);
  const vis = designData.sectionVisibility || {};

  order.forEach(key => {
    if (vis[key] === false) return; // Hidden section

    const sec = resumeData.sections.find(s => s.id === key);
    if (!sec) return;

    if (sec.type === "tags") {
      const nonEmpty = (sec.categories || []).filter(c => c.tags && c.tags.length > 0);
      if (nonEmpty.length === 0) return;

      let s = `<section class="resume-section preview-section" data-section-id="${sec.id}" data-section-link="${sec.id}" draggable="true">
        <div class="preview-section-handle"><i class="fa-solid fa-grip-vertical"></i> Drag</div>
        <h2 class="resume-section-title">${sec.name}</h2>
        <div class="skills-text-container">`;

      nonEmpty.forEach((cat, ci) => {
        if (designData.template === "tech") {
          s += `<div class="skills-category"${ci > 0 ? ' style="margin-top:10px"' : ''}>
            <strong>${parseMarkdown(cat.label)}:</strong>
            <div class="skills-badge-list">
              ${cat.tags.map(t => `<span class="skill-badge">${parseMarkdown(t)}</span>`).join("")}
            </div>
          </div>`;
        } else {
          s += `<div class="skills-category"${ci > 0 ? ' style="margin-top:4px"' : ''}>
            <strong>${parseMarkdown(cat.label)}:</strong> ${cat.tags.map(t => parseMarkdown(t)).join(", ")}
          </div>`;
        }
      });
      s += `</div></section>`;
      htmlContent += s;
    } else {
      if (!sec.items || sec.items.length === 0) return;

      let s = `<section class="resume-section preview-section" data-section-id="${sec.id}" data-section-link="${sec.id}" draggable="true">
        <div class="preview-section-handle"><i class="fa-solid fa-grip-vertical"></i> Drag</div>
        <h2 class="resume-section-title">${sec.name}</h2>`;

      sec.items.forEach(item => {
        let highlightsHtml = "";
        if (item.highlights && item.highlights.length > 0) {
          highlightsHtml = `<ul class="resume-highlights">` + 
            item.highlights.map(h => `<li>${parseMarkdown(h)}</li>`).join("") + 
            `</ul>`;
        }

        const hasSubRow = item.subtitle || item.location;
        const subRowHtml = hasSubRow ? `
          <div class="resume-item-subtitle">
            <span>${parseMarkdown(item.subtitle)}</span>
            <span>${parseMarkdown(item.location)}</span>
          </div>
        ` : "";

        s += `
          <div class="resume-item">
            <div class="resume-item-header">
              <span class="resume-item-title">${parseMarkdown(item.title)}</span>
              <span>${parseMarkdown(item.duration)}</span>
            </div>
            ${subRowHtml}
            ${highlightsHtml}
          </div>
        `;
      });
      s += `</section>`;
      htmlContent += s;
    }
  });

  // Assign generated layout to DOM wrapper canvas
  wrapper.innerHTML = htmlContent;

  // Bind Section Links (Clicking preview section moves editor view)
  const previewSections = wrapper.querySelectorAll("[data-section-link]");
  previewSections.forEach(sect => {
    sect.addEventListener("click", (e) => {
      if (e.defaultPrevented) return;
      const sectionKey = sect.dataset.sectionLink;
      const tabBtn = document.querySelector(`.tab-btn[data-tab="${sectionKey}"]`);
      if (tabBtn) {
        tabBtn.click();
        const panel = document.getElementById(`panel-${sectionKey}`);
        if (panel) {
          const h2 = panel.querySelector("h2");
          if (h2) {
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

  bindPreviewDragAndDrop();

  // Dynamic single-page auto-scaling logic inside the wrapper
  setTimeout(() => {
    const A4_HEIGHT_PX = 1122.5; // standard 297mm at 96dpi
    const marginMm = parseFloat(designData.margin || 12);
    const paddingPx = marginMm * 3.7795; // mm to px conversion
    const availableHeight = A4_HEIGHT_PX - (2 * paddingPx);

    // Reset transform to measure true scrollHeight
    wrapper.style.transform = "none";
    wrapper.style.height = "auto";
    const contentH = wrapper.scrollHeight;

    if (contentH > availableHeight) {
      const scale = availableHeight / contentH;
      wrapper.style.transform = `scale(${scale.toFixed(4)})`;
      wrapper.style.transformOrigin = "top center";
    } else {
      wrapper.style.transform = "none";
    }
  }, 0);
}

let draggedSectionId = null;

function bindPreviewDragAndDrop() {
  const previewSections = document.querySelectorAll("#resumePaper .preview-section");
  
  previewSections.forEach(section => {
    section.addEventListener("dragstart", (e) => {
      draggedSectionId = section.dataset.sectionId;
      section.classList.add("preview-dragging");
      e.dataTransfer.effectAllowed = "move";
      e.dataTransfer.setData("text/plain", draggedSectionId);
    });

    section.addEventListener("dragend", () => {
      section.classList.remove("preview-dragging");
      draggedSectionId = null;
      saveState();
    });

    section.addEventListener("dragover", (e) => {
      e.preventDefault();
      const targetId = section.dataset.sectionId;
      if (draggedSectionId && draggedSectionId !== targetId) {
        const order = designData.sectionOrder;
        const draggedIdx = order.indexOf(draggedSectionId);
        const targetIdx = order.indexOf(targetId);
        if (draggedIdx !== -1 && targetIdx !== -1) {
          order.splice(draggedIdx, 1);
          order.splice(targetIdx, 0, draggedSectionId);
          renderPreview(); // Update preview layout instantly
          renderSectionOrderList(); // Update sidebar list instantly
        }
      }
    });
  });
}

// --- PDF PARSING AND HEURISTIC LAYOUT PARSER ---

async function extractTextFromPDF(fileOrArrayBuffer) {
  const arrayBuffer = fileOrArrayBuffer instanceof ArrayBuffer ? fileOrArrayBuffer : await fileOrArrayBuffer.arrayBuffer();
  const pdf = await pdfjsLib.getDocument({ data: arrayBuffer }).promise;
  let fullText = "";
  
  const commonHeaders = [
    "EDUCATION", "EXPERIENCE", "WORK EXPERIENCE", "PROJECTS", 
    "SKILLS", "SKILL SET", "TECHNICAL SKILLS", "AWARDS", 
    "CERTIFICATIONS", "EXTRACURRICULAR", "EXTRACURRICULARS", 
    "SUMMARY", "PUBLICATIONS", "INTERESTS", "ACHIEVEMENTS",
    "PATENTS", "LEADERSHIP", "ORGANIZATIONS", "LANGUAGES",
    "COURSES", "OBJECTIVE", "VOLUNTEERING", "ACTIVITIES",
    "HACKATHONS", "PROJECT EXPERIENCE", "ACADEMIC PROJECTS",
    "WORK HISTORY", "PROFESSIONAL EXPERIENCE", "LINKS", "ABOUT ME"
  ];

  const commonHeadersNormalized = commonHeaders.map(h => h.toUpperCase().replace(/[^A-Z]/g, ""));

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
      
      const itemStrNorm = item.str.trim().toUpperCase().replace(/[^A-Z]/g, "");
      const isCommonHeader = commonHeadersNormalized.includes(itemStrNorm);

      // Group items with Y coordinates within a 5-pixel threshold
      let foundLineYStr = null;
      if (!isCommonHeader) {
        for (const lineYStr in linesMap) {
          const lineY = parseFloat(lineYStr);
          // Never merge normal text with a line containing a common header
          const targetLineItems = linesMap[lineYStr];
          const hasHeader = targetLineItems.some(ti => commonHeadersNormalized.includes(ti.text.trim().toUpperCase().replace(/[^A-Z]/g, "")));
          if (hasHeader) continue;

          if (Math.abs(lineY - y) < 5) {
            foundLineYStr = lineYStr;
            break;
          }
        }
      }
      
      if (foundLineYStr !== null) {
        linesMap[foundLineYStr].push({ text: item.str, x: x, width: item.width || 0 });
      } else {
        linesMap[y] = [{ text: item.str, x: x, width: item.width || 0 }];
      }
    });
    
    // Sort lines from top of the page to bottom (descending Y coordinate)
    const sortedYKeys = Object.keys(linesMap).map(Number).sort((a, b) => b - a);
    
    let pageText = "";
    
    // 1. Extract link annotations and prepend them as special Link: lines
    try {
      const annotations = await page.getAnnotations();
      if (annotations && annotations.length > 0) {
        annotations.forEach(annot => {
          const url = annot.url || annot.unsafeUrl;
          if (url) {
            pageText += `Link: ${url}\n`;
          }
        });
      }
    } catch (err) {
      console.warn("Could not read annotations for page:", i, err);
    }

    sortedYKeys.forEach(yKey => {
      // Sort items within the same line from left to right (ascending X coordinate)
      const lineItems = linesMap[yKey];
      lineItems.sort((a, b) => a.x - b.x);
      
      // Join items - use tab separator for large X gaps (preserves left/right alignment)
      // Merge characters that are part of the same word (gap <= 3px)
      let lineText = "";
      lineItems.forEach((item, idx) => {
        if (idx === 0) {
          lineText = item.text;
        } else {
          const prevItem = lineItems[idx - 1];
          const prevEnd = prevItem.x + prevItem.width;
          const gap = item.x - prevEnd;
          
          // Calculate average character width of current and previous items
          const charCount = (prevItem.text.length + item.text.length) || 2;
          const avgCharWidth = (prevItem.width + item.width) / charCount;
          
          const threshold1 = Math.max(1.5, avgCharWidth * 0.3);
          const threshold2 = Math.max(6.0, avgCharWidth * 1.1);
          const tabThreshold = Math.max(25.0, avgCharWidth * 4.0);
          
          let spacingChar = "";
          if (gap > tabThreshold) {
            spacingChar = "\t";
          } else if (gap > threshold2) {
            spacingChar = "  "; // Word boundary in spaced-out text
          } else if (gap > threshold1) {
            spacingChar = " ";
          }
          lineText += spacingChar + item.text;
        }
      });
      pageText += lineText + "\n";
    });
    
    fullText += pageText + "\n";
  }
  return fullText;
}

function splitMergedTokens(text) {
  const rolePattern = /\b(developer|engineer|intern|manager|analyst|specialist|consultant|architect|lead|director|officer|assistant|associate|adviser|advisor)/i;
  
  // Find camelCase transitions like "DeveloperHyderabad" where the left word is a job role
  let cleaned = text.replace(/([a-z])([A-Z][a-z]+)/g, (match, p1, p2, offset) => {
    const startOfLine = text.lastIndexOf("\n", offset) + 1;
    const lineBeforeMatch = text.substring(startOfLine, offset + 1);
    const lastWordMatch = lineBeforeMatch.match(/([a-zA-Z]+)$/);
    const leftWord = lastWordMatch ? lastWordMatch[1] : "";
    if (rolePattern.test(leftWord)) {
      return p1 + " " + p2;
    }
    return match;
  });
  
  // General layout merge splits
  cleaned = cleaned
    .replace(/([a-z])(\d)/g, "$1 $2")
    .replace(/(\d)([A-Z])/g, "$1 $2")
    .replace(/([%])([A-Z])/g, "$1 $2")
    .replace(/(\))([A-Z])/g, "$1 $2");
    
  return cleaned;
}

function collapseSpacedLetters(text) {
  let cleanedText = splitMergedTokens(text);

  return cleanedText.split("\n").map(line => {
    if (!line.trim()) return "";
    
    // Replace tabs or multiple spaces with a word boundary token
    const wordBoundary = "|||";
    let s = line.replace(/\t/g, wordBoundary).replace(/ {2,}/g, wordBoundary);
    
    // Split by word boundary
    let parts = s.split(wordBoundary);
    let newParts = parts.map(part => {
      let trimmed = part.trim();
      if (!trimmed) return "";
      
      // Count single spaces
      let spaces = 0;
      for (let i = 0; i < trimmed.length; i++) {
        if (trimmed[i] === ' ') spaces++;
      }
      
      // Calculate letters length (excluding spaces)
      let lettersLen = trimmed.length - spaces;
      
      // If it looks like spaced-out letters (e.g. lettersLen / spaces <= 2.1)
      if (spaces > 0 && (lettersLen / spaces) <= 2.1) {
        return trimmed.replace(/ /g, "");
      }
      return trimmed;
    });
    
    // Rejoin with a single space
    return newParts.filter(p => p.length > 0).join(" ");
  }).join("\n");
}

function cleanPdfText(text) {
  text = collapseSpacedLetters(text);

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
  
  // 6. Clean space before/after commas
  text = text.replace(/\s+,\s*/g, ", ");
  
  // 7. Clean mid-word ligatures where capitalized MXP represent 'ti' (only in lowercase context to avoid breaking acronyms or headers)
  text = text.replace(/([a-z]+)[MXP]([a-z]+)/g, "$1ti$2");
  
  // 8. Clean specific misspelled words from font issues
  text = text.replace(/\bsoaware\b/gi, "software");
  text = text.replace(/\bsoLware\b/gi, "software");

  // Heal split email addresses (e.g. "contact.prateekcse 1@gmail.com" -> "contact.prateekcse1@gmail.com")
  text = text.replace(/\b([a-zA-Z0-9._%+-]+)\s+([a-zA-Z0-9._%+-]+)@([a-zA-Z0-9.-]+\.[a-zA-Z]{2,})\b/g, "$1$2@$3");
  text = text.replace(/\b([a-zA-Z0-9._%+-]+)@\s+([a-zA-Z0-9.-]+\.[a-zA-Z]{2,})\b/g, "$1@$2");

  // Clean up email icon residues from front of contact details
  text = text.replace(/\b(?:pe|e|envelope|envel)contact\./gi, "contact.");

  // Separate email from merged contact label/icon (e.g. "taluscpp@gmail.comPhone" -> "taluscpp@gmail.com Phone")
  text = text.replace(/\b([a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.(?:com|in|org|net|edu|co|io))\s*(Phone|tihone|Mobile|Cell|Location|GitHub|LinkedIn)/gi, "$1 $2");

  // Standardize spaces around date range dashes (e.g. "01 2024 –06 2024" -> "01 2024 – 06 2024")
  text = text.replace(/(\b\d{2}|\b\d{4})\s*[-–—]\s*(\b\d{2}|\b\d{4}|\bpresent\b|\bongoing\b)/gi, "$1 – $2");

  // Heal split URLs (e.g. "github.com/ prateek1217" -> "github.com/prateek1217")
  text = text.replace(/\b(github\.com|linkedin\.com\/in|leetcode\.com|hackerrank\.com)\/\s+([a-zA-Z0-9_-]+)/gi, "$1/$2");
  
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
    sections: []
  };

  const nonLinkLines = lines.filter(l => !l.startsWith("Link: "));
  if (nonLinkLines.length > 0) {
    const firstLine = nonLinkLines[0];
    const tabParts = firstLine.split(/\t| {2,}/);
    if (tabParts.length >= 2) {
      data.personal.name = tabParts[0].trim();
      data.personal.location = tabParts.slice(1).join(" ").trim();
    } else if (firstLine.includes(",")) {
      const parts = firstLine.split(",");
      const words = parts[0].trim().split(/\s+/);
      if (words.length > 2) {
        data.personal.name = words.slice(0, 2).join(" ");
        data.personal.location = words.slice(2).join(" ") + ", " + parts.slice(1).join(",").trim();
      } else {
        data.personal.name = parts[0].trim();
        data.personal.location = parts.slice(1).join(",").trim();
      }
    } else {
      data.personal.name = firstLine;
    }
  }


  const emailRegex = /[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/g;
  const phoneRegex = /\(?\+?[0-9\(\)\s\-]{8,20}/g;

  const dateRangeRegex = /(\b\d{2}[\/\s]*\d{4}\s*[-–]\s*(\bongoing\b|\bpresent\b|\d{2}[\/\s]*\d{4})\b|\bongoing\b|\bpresent\b)/i;
  const yearRangeRegex = /(\b\d{4}\s*[-–]\s*(\bongoing\b|\bpresent\b|\d{4})\b)/i;
  // Matches "Aug 2025 – Present", "January 2024 – June 2025", etc.
  const monthRangeRegex = /\b(?:Jan(?:uary)?|Feb(?:ruary)?|Mar(?:ch)?|Apr(?:il)?|May|Jun(?:e)?|Jul(?:y)?|Aug(?:ust)?|Sep(?:tember)?|Oct(?:ober)?|Nov(?:ember)?|Dec(?:ember)?)\s+\d{4}\s*[-–]\s*(?:(?:Jan(?:uary)?|Feb(?:ruary)?|Mar(?:ch)?|Apr(?:il)?|May|Jun(?:e)?|Jul(?:y)?|Aug(?:ust)?|Sep(?:tember)?|Oct(?:ober)?|Nov(?:ember)?|Dec(?:ember)?)\s+\d{4}|\bongoing\b|\bpresent\b)/i;
  const descVerbRegex = /^(built|developed|created|designed|implemented|worked|used|led|managed|deployed|migrated|optimized|integrated|tested|wrote|configured|maintained|analyzed|established|conducted|presented|published|achieved|secured|contributed|improved|spearheaded|architected|launched|delivered|collaborated|refactored|automated|orchestrated|utilized|reduced|increased|streamlined)/i;

  const commonHeaders = [
    "EDUCATION", "EXPERIENCE", "WORK EXPERIENCE", "PROJECTS", 
    "SKILLS", "SKILL SET", "TECHNICAL SKILLS", "AWARDS", 
    "CERTIFICATIONS", "EXTRACURRICULAR", "EXTRACURRICULARS", 
    "SUMMARY", "PUBLICATIONS", "INTERESTS", "ACHIEVEMENTS",
    "PATENTS", "LEADERSHIP", "ORGANIZATIONS", "LANGUAGES",
    "COURSES", "OBJECTIVE", "VOLUNTEERING", "ACTIVITIES",
    "HACKATHONS", "PROJECT EXPERIENCE", "ACADEMIC PROJECTS",
    "WORK HISTORY", "PROFESSIONAL EXPERIENCE", "LINKS", "ABOUT ME",
    "AI/ML INITIATIVES", "INITIATIVES", "PREVIOUS EXPERIENCE"
  ];
  const commonHeadersNormalized = commonHeaders.map(h => h.toUpperCase().replace(/[^A-Z]/g, ""));

  let firstHeaderIdx = lines.length;
  for (let i = 2; i < lines.length; i++) {
    const line = lines[i].replace(/\t/g, " ").trim();
    if (!line || line.startsWith("Link: ")) continue;
    
    const normLine = line.toUpperCase().replace(/[^A-Z]/g, "");
    if (commonHeadersNormalized.includes(normLine)) {
      firstHeaderIdx = i;
      break;
    }
  }

  // Scan top rows for contact details
  const searchLimit = Math.min(lines.length, 12, firstHeaderIdx);
  for (let i = 1; i < searchLimit; i++) {
    const line = lines[i];
    
    // Parse prepended link annotations first
    if (line.startsWith("Link: ")) {
      const url = line.substring(6).trim();
      const lowerUrl = url.toLowerCase();
      
      if (lowerUrl.startsWith("mailto:")) {
        const email = url.substring(7).trim();
        if (!data.personal.email || data.personal.email === "your.email@example.com") {
          data.personal.email = email;
        }
      } else if (lowerUrl.includes("linkedin.com")) {
        const parts = url.split("linkedin.com/in/");
        const user = parts.length > 1 ? parts[1].split("/")[0].split("?")[0].trim() : "Username";
        data.personal.linkedin = { username: user, url: url };
      } else if (lowerUrl.includes("github.com")) {
        const parts = url.split("github.com/");
        const user = parts.length > 1 ? parts[1].split("/")[0].split("?")[0].trim() : "Username";
        data.personal.github = { username: user, url: url };
      } else if (lowerUrl.includes("leetcode.com")) {
        const parts = url.split("leetcode.com/");
        const user = parts.length > 1 ? parts[1].split("/")[0].split("?")[0].trim() : "Username";
        data.personal.leetcode = { username: user, url: url };
      } else if (lowerUrl.includes("hackerrank.com")) {
        const parts = url.split("hackerrank.com/");
        const user = parts.length > 1 ? parts[1].split("/")[0].split("?")[0].trim() : "Username";
        data.personal.hackerrank = { username: user, url: url };
      }
      continue;
    }

    const lowerLine = line.toLowerCase();

    // 1. Explicit label extraction (highly robust for third-party resumes)
    const emailMatch = line.match(/Email:\s*([^\s]+)/i);
    if (emailMatch) {
      const val = emailMatch[1].replace(/(Phone|Location|GitHub|LinkedIn):.*/i, "").trim();
      if (!data.personal.email) data.personal.email = val;
    }
    
    const phoneMatch = line.match(/Phone:\s*([^\s]+)/i);
    if (phoneMatch) {
      const val = phoneMatch[1].replace(/(Email|Location|GitHub|LinkedIn):.*/i, "").trim();
      if (!data.personal.phone) data.personal.phone = val;
    }
    
    const locationMatch = line.match(/Location:\s*(.+?)(?=GitHub:|LinkedIn:|Email:|Phone:|$)/i);
    if (locationMatch) {
      if (!data.personal.location) data.personal.location = locationMatch[1].trim();
    }
    
    const githubMatch = line.match(/GitHub:\s*(.+?)(?=LinkedIn:|Email:|Phone:|Location:|$)/i);
    if (githubMatch) {
      const val = githubMatch[1].trim();
      const user = val.split("/").pop();
      if (!data.personal.github.username) {
        data.personal.github = {
          username: user,
          url: val.startsWith("http") ? val : "https://" + val
        };
      }
    }
    
    const linkedinMatch = line.match(/LinkedIn:\s*(.+?)(?=GitHub:|Email:|Phone:|Location:|$)/i);
    if (linkedinMatch) {
      const val = linkedinMatch[1].trim();
      const user = val.split("/").pop();
      if (!data.personal.linkedin.username) {
        data.personal.linkedin = {
          username: user,
          url: val.startsWith("http") ? val : "https://" + val
        };
      }
    }

    // 2. Fallbacks if labels aren't present
    const emails = line.match(emailRegex);
    if (emails && !data.personal.email) {
      data.personal.email = emails[0];
    }

    const phones = line.match(phoneRegex);
    if (phones && !data.personal.phone) {
      data.personal.phone = phones[0].trim();
    }

    if (line.length <= 60 && line.includes(",") && !line.match(emailRegex) && !line.match(phoneRegex) && !data.personal.location) {
      // Only set as location if it doesn't look like section content
      if (!line.match(/\d{2}\s+\d{4}/) && !lowerLine.includes("university") && !lowerLine.includes("school")) {
        data.personal.location = line.replace(/\t/g, " ").trim();
      }
    }

    if (lowerLine.includes("linkedin") && !data.personal.linkedin.username) {
      const parts = line.split("linkedin.com/in/");
      if (parts.length > 1) {
        const user = parts[1].trim().split(" ")[0];
        data.personal.linkedin = {
          username: user,
          url: "https://linkedin.com/in/" + user
        };
      }
    }
    if (lowerLine.includes("github") && !data.personal.github.username) {
      const parts = line.split("github.com/");
      if (parts.length > 1) {
        const user = parts[1].trim().split(" ")[0];
        data.personal.github = {
          username: user,
          url: "https://github.com/" + user
        };
      }
    }
  }

  // Robust URL / social links parser
  const allUrls = [];
  lines.forEach(l => {
    if (l.startsWith("Link: ")) {
      allUrls.push(l.substring(6).trim());
    } else {
      const urlMatches = l.match(/https?:\/\/[^\s"'()]+/g);
      if (urlMatches) {
        urlMatches.forEach(u => allUrls.push(u));
      }
    }
  });

  allUrls.forEach(url => {
    const lowerUrl = url.toLowerCase();
    if (lowerUrl.startsWith("mailto:")) {
      const email = url.substring(7).trim();
      if (!data.personal.email || data.personal.email === "your.email@example.com") {
        data.personal.email = email;
      }
    } else if (lowerUrl.includes("linkedin.com/in/")) {
      const parts = url.split("linkedin.com/in/");
      const user = parts.length > 1 ? parts[1].split("/")[0].split("?")[0].trim() : "";
      if (user && user !== "Username") {
        data.personal.linkedin = { username: user, url: url };
      }
    } else if (lowerUrl.includes("github.com/")) {
      const parts = url.split("github.com/");
      const user = parts.length > 1 ? parts[1].split("/")[0].split("?")[0].trim() : "";
      if (user && user !== "Username" && user !== "in" && user !== "settings") {
        data.personal.github = { username: user, url: `https://github.com/${user}` };
      }
    } else if (lowerUrl.includes("leetcode.com/")) {
      let parts = url.split("leetcode.com/");
      if (parts.length > 1) {
        let path = parts[1];
        if (path.startsWith("u/")) path = path.substring(2);
        const user = path.split("/")[0].split("?")[0].trim();
        if (user && user !== "Username") {
          data.personal.leetcode = { username: user, url: `https://leetcode.com/${user}` };
        }
      }
    } else if (lowerUrl.includes("hackerrank.com/")) {
      const parts = url.split("hackerrank.com/");
      const user = parts.length > 1 ? parts[1].split("/")[0].split("?")[0].trim() : "";
      if (user && user !== "Username") {
        data.personal.hackerrank = { username: user, url: `https://hackerrank.com/${user}` };
      }
    }
  });

  // Extract usernames from text if not populated by URLs
  if (!data.personal.github.username || !data.personal.linkedin.username) {
    for (let i = 1; i < searchLimit; i++) {
      const line = lines[i];
      if (line.startsWith("Link: ")) continue;
      
      const words = line.split(/[\s|•,;()]+/);
      words.forEach(word => {
        const cleanedWord = word.trim();
        if (/^[a-zA-Z0-9_-]{4,20}$/.test(cleanedWord)) {
          if (/^\d+$/.test(cleanedWord)) return;
          const normWord = cleanedWord.toLowerCase();
          const normName = data.personal.name.toLowerCase();
          if (normName.includes(normWord)) return;
          const ignoreWords = ["github", "linkedin", "leetcode", "hackerrank", "username", "experience", "education", "projects", "skills", "achievements", "awards", "certifications", "summary", "objective", "extracurricular", "publications", "interests", "hobbies", "phone", "email", "location", "about", "details"];
          if (ignoreWords.includes(normWord)) return;
          
          if (!data.personal.github.username) {
            data.personal.github = { username: cleanedWord, url: `https://github.com/${cleanedWord}` };
          }
          if (!data.personal.linkedin.username) {
            data.personal.linkedin = { username: cleanedWord, url: `https://linkedin.com/in/${cleanedWord}` };
          }
          if (!data.personal.leetcode.username) {
            data.personal.leetcode = { username: cleanedWord, url: `https://leetcode.com/${cleanedWord}` };
          }
        }
      });
    }
  }

  if (!data.personal.email) data.personal.email = "your.email@example.com";
  if (!data.personal.phone) data.personal.phone = "+91 0000000000";
  if (!data.personal.location) data.personal.location = "City, State";

  // Dynamic Header/Section detection
  const detectedHeaders = [];

  for (let i = 2; i < lines.length; i++) {
    const line = lines[i].replace(/\t/g, " ").trim();
    if (!line) continue;

    // Ignore direct URL/Link lines
    if (line.startsWith("Link: ")) continue;

    // Ignore lines that match the candidate name to prevent it from being parsed as a section header
    if (data.personal.name) {
      const normName = data.personal.name.toUpperCase().replace(/[^A-Z]/g, "");
      const normLine = line.toUpperCase().replace(/[^A-Z]/g, "");
      if (normName.includes(normLine) || normLine.includes(normName)) {
        continue;
      }
    }

    const lowerLine = line.toLowerCase();
    
    // Standalone header checks (length between 3 and 35, no digits, no email/phone etc.)
    if (line.length < 4 || line.length > 35) continue;
    if (line.startsWith("•") || line.startsWith("-") || line.startsWith("*")) continue;
    if (line.match(emailRegex) || line.match(phoneRegex) || lowerLine.includes("http") || lowerLine.includes("github.com") || lowerLine.includes("linkedin.com")) continue;
    if (/[.!?;:|]/.test(line)) continue;
    if (/\d/.test(line)) continue;

    const forbidden = [
      "company", "university", "school", "college", "instit", "academy", "present", "ongoing",
      "developer", "engineer", "analyst", "manager", "intern", "consultant", "director", "specialist",
      "india", "usa", "germany", "singapore", "gurugram", "haryana", "noida", "delhi", "mumbai", "pune", "hyderabad", "bangalore"
    ];
    if (forbidden.some(word => lowerLine.includes(word))) continue;

    const normLine = line.toUpperCase().replace(/[^A-Z]/g, "");
    let isHeader = false;
    for (const hNorm of commonHeadersNormalized) {
      if (normLine === hNorm || (hNorm.length >= 6 && (normLine.startsWith(hNorm) || normLine.endsWith(hNorm)))) {
        isHeader = true;
        break;
      }
    }

    if (!isHeader && line === line.toUpperCase() && line.length >= 5) {
      const firstWord = lowerLine.split(" ")[0];
      if (!descVerbRegex.test(firstWord)) {
        isHeader = true;
      }
    }

    if (isHeader) {
      detectedHeaders.push({ name: line, idx: i });
    }
  }

  // Sort headers by index
  detectedHeaders.sort((a, b) => a.idx - b.idx);

  if (detectedHeaders.length === 0) {
    return data;
  }

  // === Determine content direction (reversed vs normal) ===
  let contentStartLine = -1;
  for (let i = 1; i < detectedHeaders[0].idx; i++) {
    const line = lines[i].replace(/\t/g, " ").trim();
    const lowerLine = line.toLowerCase();
    
    if (line.match(emailRegex) || line.match(phoneRegex)) continue;
    if (lowerLine.includes("linkedin") || lowerLine.includes("github")) continue;
    if (lowerLine.includes("leetcode") || lowerLine.includes("hackerrank")) continue;
    if (line.includes("•") || line.includes("✉") || line.includes("cid:")) continue;
    if (line.startsWith("Link: ") || lowerLine.includes("http") || lowerLine.includes("mailto:")) continue;
    if (/[□\u0000]/.test(line)) continue;
    // Skip candidate name
    if (data.personal.name) {
      const normName = data.personal.name.toUpperCase().replace(/[^A-Z]/g, "");
      const normLine = line.toUpperCase().replace(/[^A-Z]/g, "");
      if (normName && normLine && (normName.includes(normLine) || normLine.includes(normName))) continue;
    }
    // Skip location-like lines
    if (/^[A-Za-z\s]+,\s*[A-Za-z\s]+$/.test(line)) continue;
    
    if (i >= 2 && line.length > 10) {
      contentStartLine = i;
      break;
    }
  }

  // Determine if reversed layout by checking if content starts above first header AND contains dates or bullets
  let isReversed = false;
  if (contentStartLine !== -1 && (detectedHeaders[0].idx - contentStartLine > 0)) {
    let hasSectionIndicator = false;
    for (let i = contentStartLine; i < detectedHeaders[0].idx; i++) {
      const l = lines[i];
      if (dateRangeRegex.test(l) || yearRangeRegex.test(l) || l.trim().startsWith("•") || l.trim().startsWith("-") || l.trim().startsWith("*")) {
        hasSectionIndicator = true;
        break;
      }
    }
    isReversed = hasSectionIndicator;
  }

  // === Dynamic Summary/Objective extraction above first header (if not reversed) ===
  if (!isReversed && contentStartLine !== -1) {
    const summaryLines = [];
    for (let i = contentStartLine; i < detectedHeaders[0].idx; i++) {
      const line = lines[i].replace(/\t/g, " ").trim();
      if (!line || line.length <= 3) continue;
      const lowerLine = line.toLowerCase();

      // Skip personal info lines comprehensively
      if (line.match(emailRegex) || line.match(phoneRegex)) continue;
      if (lowerLine.includes("linkedin") || lowerLine.includes("github") || lowerLine.includes("leetcode") || lowerLine.includes("hackerrank")) continue;
      if (line.startsWith("•") || line.startsWith("-") || line.startsWith("*")) continue;
      if (line.startsWith("Link: ") || lowerLine.includes("http") || lowerLine.includes("mailto:")) continue;
      // Skip lines with icon/contact characters
      if (/[•✉□\u0000]/.test(line)) continue;
      // Skip lines matching or containing the candidate name
      if (data.personal.name) {
        const normName = data.personal.name.toUpperCase().replace(/[^A-Z]/g, "");
        const normLine = line.toUpperCase().replace(/[^A-Z]/g, "");
        if (normName && normLine && (normName.includes(normLine) || normLine.includes(normName))) continue;
      }
      // Skip lines that look like locations (city, state patterns)
      if (/^[A-Za-z\s]+,\s*[A-Za-z\s]+$/.test(line)) continue;
      const locationWords = ["gurugram", "haryana", "noida", "delhi", "mumbai", "pune", "hyderabad", "bangalore", "india", "chennai", "kolkata"];
      if (locationWords.some(w => lowerLine.includes(w))) continue;

      summaryLines.push(line);
    }

    if (summaryLines.length > 0) {
      let mergedSummary = "";
      summaryLines.forEach(l => {
        if (mergedSummary) {
          if (mergedSummary.endsWith("-")) {
            mergedSummary = mergedSummary.slice(0, -1) + l;
          } else {
            mergedSummary += " " + l;
          }
        } else {
          mergedSummary = l;
        }
      });

      // Only create a Summary section if the text is genuinely a summary paragraph
      // (long enough and contains sentence-like structure, not just leftover fragments)
      const hasProse = /\b(eager|seeking|experienced|professional|skills|passionate|with|and|the|for|in|on|of|to|a|an|developer|engineer|intern|student)\b/i.test(mergedSummary);
      if (mergedSummary.length > 40 && /[a-z]{3,}/.test(mergedSummary) && hasProse) {
        const isObjective = /\b(eager|seeking|contribute|obtain|objective|to\s+get|passion)\b/i.test(mergedSummary);
        const secName = isObjective ? "Objective" : "Summary";
        const secId = isObjective ? "objective" : "summary";
        
        data.sections.push({
          id: secId,
          name: secName,
          type: "list",
          items: [{
            title: "",
            subtitle: "",
            duration: "",
            location: "",
            highlights: [mergedSummary]
          }]
        });
      }
    }
  }

  // Build section content ranges based on detected direction
  const sectionRanges = [];
  if (isReversed) {
    detectedHeaders.forEach((header, hIdx) => {
      const start = hIdx === 0 ? contentStartLine : detectedHeaders[hIdx - 1].idx + 1;
      const end = header.idx;
      if (end > start) {
        sectionRanges.push({ name: header.name, secLines: lines.slice(start, end) });
      }
    });
  } else {
    detectedHeaders.forEach((header, hIdx) => {
      const start = header.idx + 1;
      const end = hIdx < detectedHeaders.length - 1 ? detectedHeaders[hIdx + 1].idx : lines.length;
      if (end > start) {
        sectionRanges.push({ name: header.name, secLines: lines.slice(start, end) });
      }
    });
  }

  // Helper: detect description verbs that indicate a highlight line, not a title/subtitle

  // Parse each section
  sectionRanges.forEach((section, hIdx) => {
    const secLines = section.secLines;
    const secName = section.name;
    const isSkills = secName.toUpperCase().includes("SKILL");

    const cleanSecName = secName.charAt(0).toUpperCase() + secName.slice(1).toLowerCase();
    
    // Normalize IDs to standard defaults where applicable (handling spacing issues like "Educa tion")
    let secId = cleanSecName.toLowerCase();
    const normalizedSecId = secId.replace(/[^a-z]/g, "");
    if (normalizedSecId.includes("experience") || normalizedSecId.includes("work")) secId = "experience";
    else if (normalizedSecId.includes("education")) secId = "education";
    else if (normalizedSecId.includes("project")) secId = "projects";
    else if (normalizedSecId.includes("skill")) secId = "skills";
    else if (normalizedSecId.includes("cert")) secId = "certifications";
    else if (normalizedSecId.includes("extra") || normalizedSecId.includes("achievement") || normalizedSecId.includes("award")) secId = "extracurricular";
    else secId = "sec_" + Date.now() + "_" + hIdx;

    // Ensure unique IDs
    let baseId = secId;
    let counter = 1;
    while (data.sections.some(s => s.id === secId)) {
      secId = baseId + "_" + counter;
      counter++;
    }

    if (isSkills) {
      // Tags/Skills section parser
      const categories = [];
      secLines.forEach(l => {
        const cleanL = l.replace(/\t/g, " ").trim();
        if (cleanL.includes(":")) {
          const parts = cleanL.split(":");
          const label = parts[0].trim();
          const tags = parts.slice(1).join(":").split(",").map(t => t.trim()).filter(t => t.length > 0);
          categories.push({ id: `cat_${Date.now()}_${categories.length}`, label, tags });
        } else {
          const tags = cleanL.split(",").map(t => t.trim()).filter(t => t.length > 0);
          if (tags.length > 0) {
            if (categories.length > 0) {
              categories[categories.length - 1].tags = categories[categories.length - 1].tags.concat(tags);
            } else {
              categories.push({ id: `cat_${Date.now()}_${categories.length}`, label: "General", tags });
            }
          }
        }
      });
      data.sections.push({ id: secId, name: cleanSecName, type: "tags", categories });
    } else {
      // List section parser (education, experience, projects, etc.)
      const items = [];
      let currentItem = null;

      secLines.forEach(l => {
        const trimmedL = l.trim();
        // Inline bullet split (e.g. "ShiShu Teams •Built a video...")
        if (trimmedL.includes("•") && !trimmedL.startsWith("•")) {
          const parts = trimmedL.split("•");
          const titlePart = parts[0].replace(/\t/g, " ").trim();
          const highlightPart = parts.slice(1).join("•").replace(/\t/g, " ").trim();
          currentItem = {
            title: titlePart || "Name / Title",
            subtitle: "",
            duration: "",
            location: "",
            highlights: [highlightPart]
          };
          items.push(currentItem);
          return;
        }

        const hasBullet = trimmedL.startsWith("•") || /^[•\-*▪◦■●✦⁃✓]\s*/.test(trimmedL) || /^[•\-*▪◦■●✦⁃✓]/.test(trimmedL);
        const cleanLine = trimmedL.replace(/^[•\-*▪◦■●✦⁃✓]\s*/, "").replace(/\t/g, " ").trim();
        
        if (!cleanLine) return;

        if (hasBullet) {
          if (!currentItem) {
            currentItem = { title: "Item Detail", subtitle: "", duration: "", location: "", highlights: [] };
            items.push(currentItem);
          }
          currentItem.highlights.push(cleanLine);
          return;
        }

        // Non-bullet line: determine if this starts a new item
        const hasDateRange = dateRangeRegex.test(l) || yearRangeRegex.test(l) || monthRangeRegex.test(l);
        
        let startsNewItem = false;
        if (!currentItem) {
          startsNewItem = true;
        } else if (hasDateRange) {
          // Only start a new item if the current item already has some content (duration, subtitle, or highlights)
          if (currentItem.duration || currentItem.subtitle || currentItem.highlights.length > 0) {
            startsNewItem = true;
          } else {
            // Otherwise, we will just update the current item's duration!
            const dateMatch = l.match(monthRangeRegex) || l.match(dateRangeRegex) || l.match(yearRangeRegex);
            if (dateMatch) {
              currentItem.duration = dateMatch[0];
            }
          }
        } else if (secId === "projects" && currentItem.highlights.length > 0) {
          const lastHighlight = currentItem.highlights[currentItem.highlights.length - 1];
          const endsWithSentencePunct = /[.!?;]$/.test(lastHighlight.trim());
          if (endsWithSentencePunct && isLikelyProjectTitle(cleanLine)) {
            // In projects section: a short title-like line after content signals a new project
            startsNewItem = true;
          }
        }
        
        // A project title containing a pipe separator always starts a new item
        if (secId === "projects" && cleanLine.includes("|")) {
          startsNewItem = true;
        }

        if (startsNewItem) {
          let title = "";
          let dur = "";
          let loc = "";
          let subtitleVal = "";
          
          // Use tab separation to split left-aligned title from right-aligned date/location
          const tabParts = l.split("\t").map(p => p.trim()).filter(p => p.length > 0);
          
          if (tabParts.length >= 2) {
            title = tabParts[0];
            const rightPart = tabParts[tabParts.length - 1];
            const dateMatch = rightPart.match(monthRangeRegex) || rightPart.match(dateRangeRegex) || rightPart.match(yearRangeRegex);
            if (dateMatch) {
              dur = dateMatch[0];
              const remainingRight = rightPart.replace(dur, "").trim().replace(/\s+(?:Jan(?:uary)?|Feb(?:ruary)?|Mar(?:ch)?|Apr(?:il)?|May|Jun(?:e)?|Jul(?:y)?|Aug(?:ust)?|Sep(?:tember)?|Oct(?:ober)?|Nov(?:ember)?|Dec(?:ember)?)\s*$/i, "").trim().replace(/[-—,\s|]+$/, "").trim();
              if (remainingRight) {
                loc = remainingRight;
              }
            } else {
              loc = rightPart;
            }
            
            if (tabParts.length >= 3) {
              subtitleVal = tabParts[1];
              // Check if title is a degree, if so, swap them
              const degreeRegex = /^(btech|be|mtech|ms|phd|bsc|msc|ba|ma|bba|mba|bachelor|master|doctor|12th|10th|diploma|graduate)/i;
              const normTitle = title.toLowerCase().replace(/[^a-z0-9]/g, "");
              if (degreeRegex.test(normTitle)) {
                title = tabParts[1];
                subtitleVal = tabParts[0];
              }
            }
          } else {
            title = cleanLine;
            const dateMatch = l.match(monthRangeRegex) || l.match(dateRangeRegex) || l.match(yearRangeRegex);
            if (dateMatch) {
              dur = dateMatch[0];
              title = title.replace(dur, "").trim();
              title = title.replace(/\s+(?:Jan(?:uary)?|Feb(?:ruary)?|Mar(?:ch)?|Apr(?:il)?|May|Jun(?:e)?|Jul(?:y)?|Aug(?:ust)?|Sep(?:tember)?|Oct(?:ober)?|Nov(?:ember)?|Dec(?:ember)?)\s*$/i, "").trim();
            }
          }
          
          title = title.replace(/[-—,\s|]+$/, "").trim();

          // Extract location from title if any (e.g. "Indian Institute of Information Technology, Kota, Rajasthan")
          const locMatch = title.match(/\s+([A-Z][A-Za-z\s]{1,20}(?:,\s*[A-Za-z\s]{1,20}){1,3})$/);
          if (locMatch && locMatch[1].length < 35 && locMatch[1].includes(",")) {
            let locStr = locMatch[1].trim();
            
            // Trim role words from start of location string
            const roleWords = ["developer", "engineer", "intern", "analyst", "manager", "specialist", "consultant", "architect", "lead", "director", "officer", "assistant", "associate", "adviser", "advisor"];
            let words = locStr.split(/\s+/);
            while (words.length > 1 && roleWords.includes(words[0].toLowerCase())) {
              words = words.slice(1);
            }
            locStr = words.join(" ");
            
            // Trim forbidden starts (like "Technology", "University") from location string
            const forbiddenStart = ["technology", "university", "school", "college", "institute", "academy", "dept", "department", "engineering", "science", "arts", "information", "computer"];
            const firstWord = locStr.split(",")[0].trim().toLowerCase();
            if (forbiddenStart.some(w => firstWord.includes(w)) && locStr.includes(",")) {
              const parts = locStr.split(",", 2);
              locStr = parts[1].trim();
            }
            
            loc = locStr;
            title = title.slice(0, title.lastIndexOf(locStr)).trim();
            title = title.replace(/[-—,\s|]+$/, "").trim();
          }

          // HEURISTIC: If title is empty or very short, and we have a previous non-bullet line,
          // it means the title and date were split on consecutive lines due to vertical alignment offsets.
          if (!title && currentItem) {
            if (currentItem.highlights.length > 0) {
              const lastHighlight = currentItem.highlights[currentItem.highlights.length - 1];
              if (!lastHighlight.includes("•") && lastHighlight.length < 50) {
                title = currentItem.highlights.pop();
              }
            } else if (currentItem.subtitle) {
              title = currentItem.subtitle;
              currentItem.subtitle = "";
            }
          }

          currentItem = {
            title: title || "Name / Title",
            subtitle: subtitleVal,
            duration: dur,
            location: loc,
            highlights: []
          };
          items.push(currentItem);
        } else {
          // Continuation line: subtitle, description, or location
          
          // Extract date range from continuation line if not set yet (e.g. B.Tech details line containing the date range)
          const dateMatch = cleanLine.match(monthRangeRegex) || cleanLine.match(dateRangeRegex) || cleanLine.match(yearRangeRegex);
          if (dateMatch && !currentItem.duration) {
            currentItem.duration = dateMatch[0];
            cleanLine = cleanLine.replace(dateMatch[0], "").trim();
            // Strip trailing month name if any
            cleanLine = cleanLine.replace(/\s+(?:Jan(?:uary)?|Feb(?:ruary)?|Mar(?:ch)?|Apr(?:il)?|May|Jun(?:e)?|Jul(?:y)?|Aug(?:ust)?|Sep(?:tember)?|Oct(?:ober)?|Nov(?:ember)?|Dec(?:ember)?)\s*$/i, "").trim();
            cleanLine = cleanLine.replace(/[-—,\s|]+$/, "").trim();
          }

          if (!currentItem.subtitle && currentItem.highlights.length === 0 && !descVerbRegex.test(cleanLine)) {
            // Degree swap check: if current item's title is a degree, swap title & subtitle so school is title
            const degreeRegex = /^(btech|be|mtech|ms|phd|bsc|msc|ba|ma|bba|mba|bachelor|master|doctor|12th|10th|diploma|graduate)/i;
            const normTitle = currentItem.title.toLowerCase().replace(/[^a-z0-9]/g, "");
            if (degreeRegex.test(normTitle)) {
              const degreeText = currentItem.title;
              currentItem.title = cleanLine;
              currentItem.subtitle = degreeText;
              
              // Extract location from the new title (school name)
              const locMatch = currentItem.title.match(/\s+([A-Z][A-Za-z\s]{1,20}(?:,\s*[A-Za-z\s]{1,20}){1,3})$/);
              if (locMatch && locMatch[1].length < 35 && locMatch[1].includes(",")) {
                let locStr = locMatch[1].trim();
                
                // Trim role words from start of location string
                const roleWords = ["developer", "engineer", "intern", "analyst", "manager", "specialist", "consultant", "architect", "lead", "director", "officer", "assistant", "associate", "adviser", "advisor"];
                let words = locStr.split(/\s+/);
                while (words.length > 1 && roleWords.includes(words[0].toLowerCase())) {
                  words = words.slice(1);
                }
                locStr = words.join(" ");
                
                const forbiddenStart = ["technology", "university", "school", "college", "institute", "academy", "dept", "department", "engineering", "science", "arts", "information", "computer"];
                const firstWord = locStr.split(",")[0].trim().toLowerCase();
                if (forbiddenStart.some(w => firstWord.includes(w)) && locStr.includes(",")) {
                  const parts = locStr.split(",", 2);
                  locStr = parts[1].trim();
                }
                currentItem.location = locStr;
                currentItem.title = currentItem.title.slice(0, currentItem.title.lastIndexOf(locStr)).trim();
                currentItem.title = currentItem.title.replace(/[-—,\s|]+$/, "").trim();
              }
            } else {
              // Standard subtitle + location line (e.g. "Software Developer  Pune, India")
              const tabParts = l.split("\t").map(p => p.trim()).filter(p => p.length > 0);
              if (tabParts.length >= 2) {
                // Join them and run location extraction
                const joined = tabParts.join(" ");
                const locMatch = joined.match(/\s+([A-Z][A-Za-z\s]{1,20}(?:,\s*[A-Za-z\s]{1,20}){1,3})$/);
                if (locMatch && !currentItem.location && locMatch[1].length < 35 && locMatch[1].includes(",")) {
                  let locStr = locMatch[1].trim();
                  
                  // Trim role words from start of location string
                  const roleWords = ["developer", "engineer", "intern", "analyst", "manager", "specialist", "consultant", "architect", "lead", "director", "officer", "assistant", "associate", "adviser", "advisor"];
                  let words = locStr.split(/\s+/);
                  while (words.length > 1 && roleWords.includes(words[0].toLowerCase())) {
                    words = words.slice(1);
                  }
                  locStr = words.join(" ");
                  
                  const forbiddenStart = ["technology", "university", "school", "college", "institute", "academy", "dept", "department", "engineering", "science", "arts", "information", "computer"];
                  const firstWord = locStr.split(",")[0].trim().toLowerCase();
                  if (forbiddenStart.some(w => firstWord.includes(w)) && locStr.includes(",")) {
                    const parts = locStr.split(",", 2);
                    locStr = parts[1].trim();
                  }

                  const subtitleStr = joined.slice(0, joined.lastIndexOf(locStr)).trim();
                  if (subtitleStr.length > 5) {
                    currentItem.subtitle = subtitleStr.replace(/[-—,\s|]+$/, "").trim();
                    currentItem.location = locStr;
                  } else {
                    currentItem.subtitle = joined;
                  }
                } else {
                  // Fallback for single-word location after tab (e.g. "Software Developer \t Pune")
                  const lastPart = tabParts[tabParts.length - 1];
                  const isRoleWord = /\b(developer|engineer|intern|manager|analyst|specialist|consultant|architect|lead)\b/i.test(lastPart);
                  if (!isRoleWord && /^[A-Z][A-Za-z\s]{2,15}$/.test(lastPart)) {
                    currentItem.subtitle = tabParts.slice(0, -1).join(" ");
                    currentItem.location = lastPart;
                  } else {
                    currentItem.subtitle = joined;
                  }
                }
              } else {
                // Try to extract trailing location from subtitle (e.g. "B.Tech - CGPA - 8.44 Greater Noida, UP, India")
                const locMatch = cleanLine.match(/\s+([A-Z][A-Za-z\s]{1,20}(?:,\s*[A-Za-z\s]{1,20}){1,3})$/);
                if (locMatch && !currentItem.location && locMatch[1].length < 35 && locMatch[1].includes(",")) {
                  let locStr = locMatch[1].trim();
                  
                  // Trim role words from start of location string
                  const roleWords = ["developer", "engineer", "intern", "analyst", "manager", "specialist", "consultant", "architect", "lead", "director", "officer", "assistant", "associate", "adviser", "advisor"];
                  let words = locStr.split(/\s+/);
                  while (words.length > 1 && roleWords.includes(words[0].toLowerCase())) {
                    words = words.slice(1);
                  }
                  locStr = words.join(" ");
                  
                  const forbiddenStart = ["technology", "university", "school", "college", "institute", "academy", "dept", "department", "engineering", "science", "arts", "information", "computer"];
                  const firstWord = locStr.split(",")[0].trim().toLowerCase();
                  if (forbiddenStart.some(w => firstWord.includes(w)) && locStr.includes(",")) {
                    const parts = locStr.split(",", 2);
                    locStr = parts[1].trim();
                  }

                  const subtitleStr = cleanLine.slice(0, cleanLine.lastIndexOf(locStr)).trim();
                  if (subtitleStr.length > 5) {
                    currentItem.subtitle = subtitleStr.replace(/[-—,\s|]+$/, "").trim();
                    currentItem.location = locStr;
                  } else {
                    currentItem.subtitle = cleanLine;
                  }
                } else {
                  currentItem.subtitle = cleanLine;
                }
              }
            }
          } else {
            // Description or highlight line
            if (currentItem.highlights.length > 0) {
              const lastIdx = currentItem.highlights.length - 1;
              const lastHighlight = currentItem.highlights[lastIdx];
              
              const firstChar = cleanLine.charAt(0);
              const startsWithLower = firstChar && firstChar === firstChar.toLowerCase() && firstChar !== firstChar.toUpperCase();
              const startsWithParen = cleanLine.startsWith(')') || cleanLine.startsWith('}');
              const endsWithSentencePunct = /[.!?;]$/.test(lastHighlight.trim());
              
              if (startsWithLower || startsWithParen || !endsWithSentencePunct) {
                currentItem.highlights[lastIdx] = lastHighlight + " " + cleanLine;
              } else {
                currentItem.highlights.push(cleanLine);
              }
            } else {
              currentItem.highlights.push(cleanLine);
            }
          }
        }
      });

      data.sections.push({ id: secId, name: cleanSecName, type: "list", items });
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
    
    if (statusInd) {
      statusInd.innerHTML = '<i class="fa-solid fa-spinner fa-spin"></i> Parsing test PDF...';
    }
    
    const fullText = await extractTextFromPDF(arrayBuffer);
    const parsedData = parseResumeText(fullText);
    if (await showCustomConfirm("Import PDF", "We extracted your details from the PDF. Would you like to load this data into the editor? This will overwrite your current draft.", "fa-solid fa-file-pdf", "#3b82f6")) {
      resumeData = parsedData;
      // Apply tight, compact margins and spacing for a professional look on import
      designData.margin = "6";
      designData.spacing = "2";
      designData.fontSize = "9.5";
      designData.lineHeight = "1.15";
      updateDesignUI();
      syncDesignDataWithSections();
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
window.extractTextFromPDF = extractTextFromPDF;
window.parseResumeText = parseResumeText;
window.renderEditor = renderAllForms;
window.renderPreview = renderPreview;
