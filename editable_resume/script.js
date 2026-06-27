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
  margin: "12",
  fontSize: "11",
  spacing: "8",
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
  initLayoutPanel();
  renderPreview();
  updateATSWidget();
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

  // Ensure sectionOrder and sectionVisibility exist (for backward compat)
  if (!designData.sectionOrder) designData.sectionOrder = resumeData.sections.map(s => s.id);
  if (!designData.sectionVisibility) {
    designData.sectionVisibility = {};
    resumeData.sections.forEach(s => {
      designData.sectionVisibility[s.id] = true;
    });
  }
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
  // Delegate clicks on btnAddSkillCategory
  document.addEventListener("click", (e) => {
    const btn = e.target.closest("#btnAddSkillCategory");
    if (btn) {
      const skillsSec = resumeData.sections.find(s => s.id === "skills");
      if (skillsSec) {
        if (!skillsSec.categories) skillsSec.categories = [];
        skillsSec.categories.push({ id: `cat_${Date.now()}`, label: "Custom Category", tags: [] });
        renderSkillsForm();
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
  if (btnCreateSection) {
    btnCreateSection.addEventListener("click", async () => {
      const name = prompt("Enter a name for your custom section (e.g. Awards, Publications):");
      if (name && name.trim()) {
        const secId = "custom_" + Date.now();
        const cleanName = name.trim();
        
        resumeData.sections.push({
          id: secId,
          name: cleanName,
          type: "list",
          items: []
        });

        if (!designData.sectionOrder) designData.sectionOrder = resumeData.sections.map(s => s.id);
        else designData.sectionOrder.push(secId);

        if (!designData.sectionVisibility) designData.sectionVisibility = {};
        designData.sectionVisibility[secId] = true;

        renderDynamicTabsAndPanels();
        renderSectionOrderList();
        saveState();

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
    if (!paper) { window.print(); return; }

    // A4 at 96dpi = 210mm × 297mm = 793.7px × 1122.5px
    // We use the scrollHeight (full content height) vs A4 height
    const A4_HEIGHT_PX = 1122; // 297mm at 96dpi
    const A4_WIDTH_PX  = 794;  // 210mm at 96dpi

    // Temporarily reset any current transform to measure true size
    const prevTransform = paper.style.transform;
    paper.style.transform = "scale(1)";
    paper.style.transformOrigin = "top center";

    const contentH = paper.scrollHeight;
    const contentW = paper.scrollWidth;

    // Calculate scale to fit within one A4 page
    const scaleH = A4_HEIGHT_PX / contentH;
    const scaleW = A4_WIDTH_PX  / contentW;
    const scale  = Math.min(scaleH, scaleW, 1); // never upscale

    // Restore original transform
    paper.style.transform = prevTransform;

    // Apply scale via CSS variable (picked up by @media print)
    document.documentElement.style.setProperty("--print-scale", scale.toFixed(4));

    // Trigger print, then reset after dialog closes
    window.print();
  }

  document.getElementById("btnPrint").addEventListener("click", printSinglePage);

  // Handle printing events globally (button or Ctrl+P/Cmd+P shortcuts)
  window.addEventListener("beforeprint", () => {
    const paper = document.getElementById("resumePaper");
    if (!paper) return;
    const A4_HEIGHT_PX = 1122;
    const A4_WIDTH_PX  = 794;
    
    const prevTransform = paper.style.transform;
    paper.style.transform = "scale(1)";
    const contentH = paper.scrollHeight;
    const contentW = paper.scrollWidth;
    paper.style.transform = prevTransform;
    
    const scale = Math.min(A4_HEIGHT_PX / contentH, A4_WIDTH_PX / contentW, 1);
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
function renderSkillsForm() {
  const container = document.getElementById("skillCategoriesList");
  if (!container) return;
  container.innerHTML = "";

  const skillsSec = resumeData.sections.find(s => s.id === "skills");
  if (!skillsSec) return;
  const skillsArr = skillsSec.categories || [];

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
      renderSkillsForm();
      saveState();
    });
  });

  // Bind tag remove
  container.querySelectorAll(".skill-tag-remove").forEach(btn => {
    btn.addEventListener("click", (e) => {
      const ci = +btn.dataset.catidx;
      const ti = +btn.dataset.tidx;
      skillsArr[ci].tags.splice(ti, 1);
      renderSkillsForm();
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
          renderSkillsForm();
          saveState();
          // Refocus the input for the same category
          const inputs = document.querySelectorAll(".skill-tag-input");
          if (inputs[ci]) inputs[ci].focus();
        }
      }
    });
  });
}

function renderDynamicTabsAndPanels() {
  const tabsContainer = document.getElementById("dynamicTabs");
  const panelsContainer = document.getElementById("dynamicPanels");
  if (!tabsContainer || !panelsContainer) return;

  const activeTabBtn = document.querySelector(".editor-tabs .tab-btn.active");
  const activeTabId = activeTabBtn ? activeTabBtn.dataset.tab : "personal";

  tabsContainer.innerHTML = "";
  panelsContainer.innerHTML = "";

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
    btn.replaceWith(btn.cloneNode(true));
  });

  const newTabButtons = document.querySelectorAll(".editor-tabs .tab-btn");
  const newPanels = document.querySelectorAll(".editor-panels .tab-panel");

  newTabButtons.forEach(btn => {
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
      <h2>${sec.name}</h2>
      <div style="display: flex; gap: 8px;">
        <button class="btn btn-small btn-secondary" id="btnAddSkillCategory"><i class="fa-solid fa-plus"></i> Add Category</button>
        <button class="btn btn-small btn-danger btn-delete-section" data-sec="${sec.id}" title="Delete whole section"><i class="fa-solid fa-trash"></i></button>
      </div>
    </div>
    <div id="skillCategoriesList"></div>
  `;

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

  renderSkillsForm();
}

function renderListFormMarkup(panel, sec) {
  panel.innerHTML = `
    <div class="panel-header-action">
      <h2>${sec.name}</h2>
      <div style="display: flex; gap: 8px;">
        <button class="btn btn-small btn-secondary btn-add-item" data-sec="${sec.id}"><i class="fa-solid fa-plus"></i> Add Item</button>
        <button class="btn btn-small btn-danger btn-delete-section" data-sec="${sec.id}" title="Delete whole section"><i class="fa-solid fa-trash"></i></button>
      </div>
    </div>
    <div class="list-container" id="list-${sec.id}"></div>
  `;

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
  let score = 0;
  let total = 0;

  const addCheck = (val, weight = 1) => {
    total += weight;
    if (val) score += weight;
  };

  const p = resumeData.personal || {};
  addCheck(p.name);
  addCheck(p.email);
  addCheck(p.phone);
  addCheck(p.location);
  addCheck(p.linkedin?.username);
  addCheck(p.github?.username);

  const sections = resumeData.sections || [];
  sections.forEach(sec => {
    if (sec.type === "list") {
      addCheck(sec.items && sec.items.length > 0, 2);
      if (sec.items && sec.items.length > 0) {
        const hasHighlights = sec.items.some(item => item.highlights && item.highlights.length > 0);
        addCheck(hasHighlights, 2);
      }
    } else if (sec.type === "tags") {
      const tagCount = (sec.categories || []).reduce((a, c) => a + (c.tags ? c.tags.length : 0), 0);
      addCheck(tagCount > 0, 2);
      addCheck(tagCount >= 5, 1);
    }
  });

  return Math.min(100, Math.round((score / total) * 100));
}

function updateATSWidget() {
  const pct = calcATSScore();
  const bar = document.getElementById("atsBarFill");
  const val = document.getElementById("atsValue");
  if (!bar || !val) return;
  bar.style.width = `${pct}%`;
  val.textContent = `${pct}%`;
  const color = pct >= 80 ? "#0d9488" : pct >= 50 ? "#d97706" : "#dc2626";
  bar.style.background = color;
  val.style.color = color;
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
    contactItems.push(`<a href="${p.leetcode.url || '#'}" target="_blank" class="resume-contact-item"><i class="fa-code"></i> ${p.leetcode.username}</a>`);
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
    sections: []
  };

  if (lines.length > 0) {
    data.personal.name = lines[0];
  }

  const emailRegex = /[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/g;
  const phoneRegex = /\(?\+?[0-9\(\)\s\-]{8,20}/g;

  // Scan top rows for contact details
  const searchLimit = Math.min(lines.length, 12);
  for (let i = 1; i < searchLimit; i++) {
    const line = lines[i];
    const lowerLine = line.toLowerCase();

    const emails = line.match(emailRegex);
    if (emails && !data.personal.email) {
      data.personal.email = emails[0];
    }

    const phones = line.match(phoneRegex);
    if (phones && !data.personal.phone) {
      data.personal.phone = phones[0].trim();
    }

    if (line.includes(",") && !line.match(emailRegex) && !line.match(phoneRegex) && !data.personal.location) {
      data.personal.location = line;
    }

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

  if (!data.personal.email) data.personal.email = "your.email@example.com";
  if (!data.personal.phone) data.personal.phone = "+91 0000000000";
  if (!data.personal.location) data.personal.location = "City, State";

  // Dynamic Header/Section detection
  const detectedHeaders = [];
  const startLine = Math.min(lines.length, 5);

  for (let i = startLine; i < lines.length; i++) {
    const line = lines[i].trim();
    if (!line) continue;

    const isUpper = line === line.toUpperCase() && /[A-Z]/.test(line);
    const commonHeaders = [
      "EDUCATION", "EXPERIENCE", "WORK EXPERIENCE", "PROJECTS", 
      "SKILLS", "SKILL SET", "TECHNICAL SKILLS", "AWARDS", 
      "CERTIFICATIONS", "EXTRACURRICULAR", "EXTRACURRICULARS", 
      "SUMMARY", "PUBLICATIONS", "INTERESTS", "ACHIEVEMENTS"
    ];
    const isCommonHeader = commonHeaders.includes(line.toUpperCase());

    if ((isUpper || isCommonHeader) && 
        line.length >= 3 && 
        line.length <= 30 && 
        !line.includes("•") && !line.startsWith("-") && !line.startsWith("*") &&
        !line.match(emailRegex) && !line.match(phoneRegex) &&
        !line.match(/\d{4}/) &&
        !line.includes(",")
    ) {
      detectedHeaders.push({ name: line, idx: i });
    }
  }

  // Sort headers by index
  detectedHeaders.sort((a, b) => a.idx - b.idx);

  // Parse each section's lines
  detectedHeaders.forEach((header, hIdx) => {
    const start = header.idx;
    const end = (hIdx < detectedHeaders.length - 1) ? detectedHeaders[hIdx + 1].idx : lines.length;
    const secLines = lines.slice(start + 1, end);
    const secName = header.name;
    const isSkills = secName.toUpperCase().includes("SKILL");

    const cleanSecName = secName.charAt(0).toUpperCase() + secName.slice(1).toLowerCase();
    
    // Normalize IDs to standard defaults where applicable
    let secId = cleanSecName.toLowerCase();
    if (secId.includes("experience")) secId = "experience";
    else if (secId.includes("education")) secId = "education";
    else if (secId.includes("project")) secId = "projects";
    else if (secId.includes("skill")) secId = "skills";
    else if (secId.includes("cert")) secId = "certifications";
    else if (secId.includes("extra")) secId = "extracurricular";
    else secId = "sec_" + Date.now() + "_" + hIdx;

    if (isSkills) {
      // Tags/Skills section parser
      const categories = [];
      secLines.forEach(l => {
        if (l.includes(":")) {
          const parts = l.split(":");
          const label = parts[0].trim();
          const tags = parts.slice(1).join(":").split(",").map(t => t.trim()).filter(t => t.length > 0);
          categories.push({ id: `cat_${Date.now()}_${categories.length}`, label, tags });
        } else {
          const tags = l.split(",").map(t => t.trim()).filter(t => t.length > 0);
          if (tags.length > 0) {
            categories.push({ id: `cat_${Date.now()}_${categories.length}`, label: "General", tags });
          }
        }
      });
      data.sections.push({
        id: secId,
        name: cleanSecName,
        type: "tags",
        categories
      });
    } else {
      // List section parser
      const items = [];
      let currentItem = null;

      secLines.forEach(l => {
        const hasBullet = l.includes("•") || l.startsWith("-") || l.startsWith("*");
        const cleanLine = l.replace(/^[•\-*]\s*/, "").trim();
        
        if (!cleanLine) return;

        if (hasBullet) {
          if (!currentItem) {
            currentItem = { title: "Item Detail", subtitle: "", duration: "", location: "", highlights: [] };
            items.push(currentItem);
          }
          currentItem.highlights.push(cleanLine);
        } else {
          const hasDate = l.match(/\d{2}\s+\d{4}/) || l.includes("ongoing") || l.includes("Present") || l.includes("–") || l.includes("-") || l.match(/\d{4}/);
          const isNewItem = !currentItem || hasDate || (currentItem.highlights.length > 0 && l.length < 60);

          if (isNewItem) {
            let title = cleanLine;
            let dur = "";
            let loc = "";
            let sub = "";

            const dateMatch = l.match(/\d{2}\s+\d{4}\s*[-–]\s*(ongoing|Present|\d{2}\s+\d{4})/i) || 
                              l.match(/\d{4}\s*[-–]\s*(ongoing|Present|\d{4})/i) || 
                              l.match(/\d{2}\s+\d{4}\s*–\s*(ongoing|Present|\d{2}\s+\d{4})/i) ||
                              l.match(/\d{4}/);
            if (dateMatch) {
              dur = dateMatch[0];
              title = title.replace(dur, "").trim();
            }

            const locMatch = title.match(/\b(Greater Noida|Gurugram|Pune|Hyderabad|Ggn|Ggurugram|Noida|Mumbai|Delhi|Bangalore|Bengaluru|TW|Autodesk|Airtel)\b.*/i);
            if (locMatch) {
              loc = locMatch[0].trim();
              title = title.replace(locMatch[0], "").trim();
            }

            title = title.replace(/[-—,\s|]+$/, "").trim();

            currentItem = {
              title: title || "Name / Title",
              subtitle: sub,
              duration: dur,
              location: loc,
              highlights: []
            };
            items.push(currentItem);
          } else {
            if (!currentItem.subtitle) {
              currentItem.subtitle = cleanLine;
            } else {
              currentItem.highlights.push(cleanLine);
            }
          }
        }
      });

      data.sections.push({
        id: secId,
        name: cleanSecName,
        type: "list",
        items
      });
    }
  });

  // Ensure default sections are present even if not parsed
  const defaultIds = ["education", "skills", "projects", "experience", "extracurricular"];
  defaultIds.forEach(id => {
    if (!data.sections.some(s => s.id === id)) {
      const standard = DEFAULT_RESUME_DATA.sections.find(s => s.id === id);
      if (standard) {
        data.sections.push(JSON.parse(JSON.stringify(standard)));
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
