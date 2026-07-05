/**
 * ============================================================================
 * ATS RECOMMENDATION ENGINE — ats-recommendations.js
 * ============================================================================
 * Generates prioritized, actionable improvement suggestions based on the
 * ATS Engine analysis. Each suggestion includes the issue, impact explanation,
 * exact fix, estimated score gain, and priority level.
 *
 * Public API (exposed on window.ATSRecommendations):
 *   - generate(resumeData)       → array of Suggestion objects
 *   - getTopSuggestions(data, n)  → top N suggestions by priority + gain
 *   - invalidateCache()           → force regeneration
 *
 * Depends on: window.ATSEngine
 * ============================================================================
 */

(function () {
  'use strict';

  const MAX_SUGGESTIONS = 25;

  let _cache = { hash: null, suggestions: null };

  function _hash(data) {
    const str = JSON.stringify(data);
    let hash = 0;
    for (let i = 0; i < str.length; i++) {
      hash = ((hash << 5) - hash) + str.charCodeAt(i);
      hash |= 0;
    }
    return hash;
  }

  // ═══════════════════════════════════════════════════════════════════════════
  // KNOWLEDGE BASES — Corrections and templates for intelligent suggestions
  // ═══════════════════════════════════════════════════════════════════════════

  const TECH_CASING_MAP = {
    'javascript': 'JavaScript',
    'typescript': 'TypeScript',
    'nodejs': 'Node.js',
    'node.js': 'Node.js',
    'mongodb': 'MongoDB',
    'postgres': 'PostgreSQL',
    'postgresql': 'PostgreSQL',
    'reactjs': 'React',
    'react.js': 'React',
    'aws': 'AWS',
    'gcp': 'GCP',
    'api': 'API',
    'apis': 'APIs',
    'html': 'HTML',
    'css': 'CSS',
    'sql': 'SQL',
    'nosql': 'NoSQL',
    'cicd': 'CI/CD',
    'ci/cd': 'CI/CD',
    'rest': 'REST',
    'json': 'JSON',
    'xml': 'XML',
    'ui': 'UI',
    'ux': 'UX',
    'ui/ux': 'UI/UX',
    'dns': 'DNS',
    'url': 'URL',
    'http': 'HTTP',
    'https': 'HTTPS',
    'github': 'GitHub',
    'gitlab': 'GitLab',
    'dockerize': 'Dockerize',
    'dockerized': 'Dockerized'
  };

  const SPELLING_MAP = {
    'recieve': 'receive',
    'seperate': 'separate',
    'impliment': 'implement',
    'implimented': 'implemented',
    'responsable': 'responsible',
    'manageing': 'managing',
    'optimise': 'optimize',
    'optimised': 'optimized',
    'analysing': 'analyzing',
    'analyse': 'analyze',
    'developement': 'development',
    'enviroment': 'environment',
    'committment': 'commitment',
    'refering': 'referring',
    'occurred': 'occurred',
    'ocurred': 'occurred',
    'arguement': 'argument',
    'fourty': 'forty',
    'sucessful': 'successful'
  };

  const ROLE_BULLETS = {
    engineer: [
      "Designed and implemented robust microservices using Node.js and TypeScript, reducing backend latency by 25%.",
      "Collaborated with cross-functional teams to provision and deploy scalable cloud infrastructure on AWS.",
      "Optimized frontend web application performance in React, boosting Core Web Vitals and user engagement."
    ],
    developer: [
      "Designed and implemented robust microservices using Node.js and TypeScript, reducing backend latency by 25%.",
      "Collaborated with cross-functional teams to provision and deploy scalable cloud infrastructure on AWS.",
      "Optimized frontend web application performance in React, boosting Core Web Vitals and user engagement."
    ],
    frontend: [
      "Built responsive, interactive user interfaces with React, Next.js, and Tailwind CSS, increasing traffic by 15%.",
      "Collaborated with UX/UI designers to translate Figma design mockups into semantic, high-quality code.",
      "Integrated RESTful and GraphQL APIs to streamline state management and frontend data fetching workflows."
    ],
    backend: [
      "Developed and scaled RESTful APIs using Python, Flask, and PostgreSQL, handling over 10K daily active users.",
      "Designed database schemas and optimized complex SQL queries, decreasing query execution times by 40%.",
      "Implemented OAuth2 protocols and JWT authentication to enforce secure user access controls."
    ],
    data: [
      "Developed machine learning models using Python and scikit-learn, achieving 85% predictive accuracy on user churn.",
      "Cleaned, transformed, and processed high-volume datasets using Pandas and SQL queries.",
      "Created interactive executive dashboards in Tableau to visualize and communicate key business insights."
    ],
    manager: [
      "Defined product roadmaps and authored comprehensive PRDs for major feature updates and product launches.",
      "Conducted user research interviews and market analysis to identify high-impact customer opportunities.",
      "Coordinated cross-functional engineering, design, and marketing teams to deliver projects on-time and on-budget."
    ],
    designer: [
      "Created high-fidelity Figma UI/UX mockups, wireframes, and prototypes for mobile and web products.",
      "Conducted user testing and analysis to iteratively improve product accessibility and satisfaction.",
      "Established and maintained scalable design systems to ensure visual consistency across all platforms."
    ]
  };

  // ═══════════════════════════════════════════════════════════════════════════
  // HELPERS
  // ═══════════════════════════════════════════════════════════════════════════

  function _escapeRegExp(string) {
    return string.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  }

  function _findTyposInText(text) {
    if (!text) return null;

    // Check spelling
    for (const [typo, correction] of Object.entries(SPELLING_MAP)) {
      const regex = new RegExp(`\\b${typo}\\b`, 'i');
      if (regex.test(text)) {
        return { typo, correction, type: 'spelling' };
      }
    }

    // Check tech casing
    for (const [lower, correction] of Object.entries(TECH_CASING_MAP)) {
      const escapedLower = lower.replace(/[\/.]/g, '\\$&');
      const regex = new RegExp(`\\b${escapedLower}\\b`, 'i');
      const match = text.match(regex);
      if (match && match[0] !== correction) {
        return { typo: match[0], correction, type: 'casing' };
      }
    }

    return null;
  }

  function _rewriteWeakVerbStart(bulletText) {
    if (!bulletText) return null;
    const trimmed = bulletText.trim();

    const rules = [
      { pattern: /^[\s•\-–—]*helped\s+with\s+designing/i, replacement: 'Co-designed and developed' },
      { pattern: /^[\s•\-–—]*helped\s+to\s+design/i, replacement: 'Co-designed' },
      { pattern: /^[\s•\-–—]*helped\s+write/i, replacement: 'Coauthored' },
      { pattern: /^[\s•\-–—]*helped\s+build/i, replacement: 'Co-developed' },
      { pattern: /^[\s•\-–—]*helped\s+develop/i, replacement: 'Co-developed' },
      { pattern: /^[\s•\-–—]*helped\s+implement/i, replacement: 'Co-implemented' },
      { pattern: /^[\s•\-–—]*helped\s+optimize/i, replacement: 'Co-optimized' },
      { pattern: /^[\s•\-–—]*worked\s+on\s+implementing/i, replacement: 'Implemented' },
      { pattern: /^[\s•\-–—]*worked\s+on\s+building/i, replacement: 'Engineered and constructed' },
      { pattern: /^[\s•\-–—]*worked\s+on\s+developing/i, replacement: 'Developed' },
      { pattern: /^[\s•\-–—]*worked\s+on\s+optimizing/i, replacement: 'Optimized' },
      { pattern: /^[\s•\-–—]*was\s+responsible\s+for\s+managing/i, replacement: 'Managed and coordinated' },
      { pattern: /^[\s•\-–—]*was\s+responsible\s+for\s+testing/i, replacement: 'Orchestrated QA testing of' },
      { pattern: /^[\s•\-–—]*was\s+responsible\s+for\s+developing/i, replacement: 'Developed' },
      { pattern: /^[\s•\-–—]*was\s+responsible\s+for/i, replacement: 'Spearheaded' },
      { pattern: /^[\s•\-–—]*did\s+analysis\s+on/i, replacement: 'Analyzed' },
      { pattern: /^[\s•\-–—]*did\s+testing\s+for/i, replacement: 'Executed testing for' },
      { pattern: /^[\s•\-–—]*used\s+(\w+)\s+to\s+(?:build|develop|create)/i, replacement: (match, tech) => `Leveraged ${tech} to construct` },
      { pattern: /^[\s•\-–—]*used\s+(\w+)\s+for/i, replacement: (match, tech) => `Utilized ${tech} for` },
      { pattern: /^[\s•\-–—]*tried\s+to\s+improve/i, replacement: 'Optimized' },
      { pattern: /^[\s•\-–—]*assisted\s+in/i, replacement: 'Collaborated on' },
      { pattern: /^[\s•\-–—]*assisted\s+with/i, replacement: 'Supported the execution of' },
      { pattern: /^[\s•\-–—]*tasked\s+with\s+developing/i, replacement: 'Developed and delivered' },
      { pattern: /^[\s•\-–—]*tasked\s+with/i, replacement: 'Spearheaded' },
      { pattern: /^[\s•\-–—]*assigned\s+to\s+develop/i, replacement: 'Developed' },
      { pattern: /^[\s•\-–—]*assigned\s+to/i, replacement: 'Spearheaded' },
      { pattern: /^[\s•\-–—]*had\s+to\s+manage/i, replacement: 'Managed' },
      { pattern: /^[\s•\-–—]*helped\s+the\s+team\s+with/i, replacement: 'Supported team in executing' }
    ];

    for (const rule of rules) {
      if (rule.pattern.test(trimmed)) {
        if (typeof rule.replacement === 'function') {
          return trimmed.replace(rule.pattern, rule.replacement);
        } else {
          return trimmed.replace(rule.pattern, rule.replacement);
        }
      }
    }

    if (/^[\s•\-–—]*helped\s+/i.test(trimmed)) {
      return trimmed.replace(/^[\s•\-–—]*helped\s+/i, 'Collaborated on ');
    }
    if (/^[\s•\-–—]*worked\s+on\s+/i.test(trimmed)) {
      return trimmed.replace(/^[\s•\-–—]*worked\s+on\s+/i, 'Contributed to ');
    }

    return null;
  }

  function _removePronouns(text) {
    if (!text) return '';
    let cleaned = text.trim();

    cleaned = cleaned.replace(/^[\s•\-–—]*(?:I\s+was\s+responsible\s+for\s+managing|I\s+managed)/i, 'Managed');
    cleaned = cleaned.replace(/^[\s•\-–—]*(?:I\s+was\s+responsible\s+for\s+testing|I\s+tested)/i, 'Tested');
    cleaned = cleaned.replace(/^[\s•\-–—]*I\s+helped\s+to\s+/i, 'Collaborated on ');
    cleaned = cleaned.replace(/^[\s•\-–—]*I\s+helped\s+/i, 'Collaborated on ');
    cleaned = cleaned.replace(/^[\s•\-–—]*I\s+worked\s+on\s+/i, 'Contributed to ');
    cleaned = cleaned.replace(/^[\s•\-–—]*I\s+developed\s+/i, 'Developed ');
    cleaned = cleaned.replace(/^[\s•\-–—]*I\s+built\s+/i, 'Built ');
    cleaned = cleaned.replace(/^[\s•\-–—]*I\s+am\s+/i, '');
    cleaned = cleaned.replace(/^[\s•\-–—]*I\s+/i, '');

    cleaned = cleaned.replace(/\bmy\s+team\b/gi, 'the team');
    cleaned = cleaned.replace(/\bmy\s+role\b/gi, 'role');
    cleaned = cleaned.replace(/\bmy\s+responsibilities\b/gi, 'responsibilities');
    cleaned = cleaned.replace(/\bfor\s+my\s+company\b/gi, '');
    cleaned = cleaned.replace(/\bby\s+me\b/gi, '');

    if (cleaned.length > 0) {
      cleaned = cleaned.charAt(0).toUpperCase() + cleaned.slice(1);
    }
    return cleaned;
  }

  // ═══════════════════════════════════════════════════════════════════════════
  // SUGGESTION GENERATORS
  // ═══════════════════════════════════════════════════════════════════════════

  function _generateTypoSuggestions(data, suggestions) {
    const E = window.ATSEngine;

    // 1. Check personal fields
    const p = data.personal || {};
    const personalFields = ['name', 'location'];
    personalFields.forEach(f => {
      const val = p[f];
      if (val && E.isRealContent(val)) {
        const found = _findTyposInText(val);
        if (found) {
          const corrected = val.replace(new RegExp(`\\b${_escapeRegExp(found.typo)}\\b`, 'gi'), found.correction);
          suggestions.push({
            id: `typo-personal-${f}-${found.typo}`,
            category: 'Grammar & Consistency',
            priority: 'high',
            issue: `Potential ${found.type} issue in contact details: "${found.typo}"`,
            impact: 'Spelling or casing errors in contact information look unprofessional to recruiters.',
            fix: `Change "${found.typo}" to "${found.correction}".`,
            section: 'personal',
            estimatedGain: 2,
            type: 'formatting',
            fixAction: {
              type: 'replacePersonalField',
              path: ['personal', f],
              newValue: corrected
            }
          });
        }
      }
    });

    // 2. Check sections
    const sections = data.sections || [];
    sections.forEach(sec => {
      if (sec.type === 'list' && sec.items) {
        sec.items.forEach((item, itemIdx) => {
          // Check title
          const title = item.title || '';
          const foundTitle = _findTyposInText(title);
          if (foundTitle) {
            const corrected = title.replace(new RegExp(`\\b${_escapeRegExp(foundTitle.typo)}\\b`, 'gi'), foundTitle.correction);
            suggestions.push({
              id: `typo-title-${sec.id}-${itemIdx}-${foundTitle.typo}`,
              category: 'Grammar & Consistency',
              priority: 'high',
              issue: `Potential ${foundTitle.type} issue in "${sec.name}" entry: "${foundTitle.typo}"`,
              impact: 'Spelling mistakes in role names or organization titles reduce resume quality scores.',
              fix: `Update "${foundTitle.typo}" to "${foundTitle.correction}".`,
              section: sec.id,
              itemIndex: itemIdx,
              estimatedGain: 2,
              type: 'formatting',
              fixAction: {
                type: 'replaceItemField',
                sectionId: sec.id,
                itemIndex: itemIdx,
                field: 'title',
                newValue: corrected
              }
            });
          }

          // Check subtitle
          const subtitle = item.subtitle || '';
          const foundSub = _findTyposInText(subtitle);
          if (foundSub) {
            const corrected = subtitle.replace(new RegExp(`\\b${_escapeRegExp(foundSub.typo)}\\b`, 'gi'), foundSub.correction);
            suggestions.push({
              id: `typo-subtitle-${sec.id}-${itemIdx}-${foundSub.typo}`,
              category: 'Grammar & Consistency',
              priority: 'high',
              issue: `Potential ${foundSub.type} issue in "${sec.name}" role description: "${foundSub.typo}"`,
              impact: 'Formatting and casing errors in subtitles look unpolished.',
              fix: `Update "${foundSub.typo}" to "${foundSub.correction}".`,
              section: sec.id,
              itemIndex: itemIdx,
              estimatedGain: 2,
              type: 'formatting',
              fixAction: {
                type: 'replaceItemField',
                sectionId: sec.id,
                itemIndex: itemIdx,
                field: 'subtitle',
                newValue: corrected
              }
            });
          }

          // Check highlights
          const highlights = item.highlights || [];
          highlights.forEach((hl, hlIdx) => {
            const foundHl = _findTyposInText(hl);
            if (foundHl) {
              const corrected = hl.replace(new RegExp(`\\b${_escapeRegExp(foundHl.typo)}\\b`, 'gi'), foundHl.correction);
              suggestions.push({
                id: `typo-hl-${sec.id}-${itemIdx}-${hlIdx}-${foundHl.typo}`,
                category: 'Grammar & Consistency',
                priority: 'high',
                issue: `Potential ${foundHl.type} issue in bullet point: "${foundHl.typo}"`,
                impact: 'Spelling or casing typos in bullet points are highly visible and negatively impact ATS scores.',
                fix: `Correct "${foundHl.typo}" to "${foundHl.correction}" in bullet point.`,
                section: sec.id,
                itemIndex: itemIdx,
                highlightIndex: hlIdx,
                estimatedGain: 2,
                type: 'formatting',
                fixAction: {
                  type: 'replaceHighlight',
                  sectionId: sec.id,
                  itemIndex: itemIdx,
                  highlightIndex: hlIdx,
                  newValue: corrected
                }
              });
            }
          });
        });
      }
    });
  }

  function _generateContactSuggestions(data, suggestions) {
    const p = data.personal || {};
    const E = window.ATSEngine;

    if (!E.isRealContent(p.name) || E.isPlaceholder(p.name)) {
      suggestions.push({
        id: 'contact-name',
        category: 'Contact Information',
        priority: 'high',
        issue: 'Full name is missing or uses placeholder text',
        impact: 'ATS cannot identify the candidate without a real name. This is the first thing parsed.',
        fix: 'Enter your full legal name (First Last) in the Personal Details section.',
        section: 'personal',
        estimatedGain: 5,
        type: 'content'
      });
    }

    if (!p.email || !p.email.includes('@') || E.isPlaceholder(p.email)) {
      suggestions.push({
        id: 'contact-email',
        category: 'Contact Information',
        priority: 'high',
        issue: 'Professional email address is missing',
        impact: 'Recruiters and ATS systems cannot contact you without a valid email.',
        fix: 'Add a professional email address (preferably Gmail or custom domain).',
        section: 'personal',
        estimatedGain: 4,
        type: 'content'
      });
    }

    if (!E.isRealContent(p.phone) || E.isPlaceholder(p.phone)) {
      suggestions.push({
        id: 'contact-phone',
        category: 'Contact Information',
        priority: 'high',
        issue: 'Phone number is missing',
        impact: 'Many recruiters prefer phone contact for initial screening.',
        fix: 'Add your phone number with country code.',
        section: 'personal',
        estimatedGain: 3,
        type: 'content'
      });
    }

    if (!p.linkedin || !E.isRealContent(p.linkedin.username)) {
      suggestions.push({
        id: 'contact-linkedin',
        category: 'Contact Information',
        priority: 'medium',
        issue: 'LinkedIn profile link is missing',
        impact: '87% of recruiters check LinkedIn profiles. Missing it reduces credibility.',
        fix: 'Add your LinkedIn profile URL and username in Personal Details.',
        section: 'personal',
        estimatedGain: 2,
        type: 'content'
      });
    }

    if (!p.github || !E.isRealContent(p.github.username)) {
      suggestions.push({
        id: 'contact-github',
        category: 'Contact Information',
        priority: 'low',
        issue: 'GitHub profile not linked',
        impact: 'For tech roles, a GitHub profile demonstrates active coding and open-source contributions.',
        fix: 'Add your GitHub username and URL if you have public repositories.',
        section: 'personal',
        estimatedGain: 1,
        type: 'content'
      });
    }
  }

  function _generateStructureSuggestions(data, suggestions) {
    const sections = data.sections || [];
    const E = window.ATSEngine;

    const sectionNames = sections.map(s => (s.name || '').toLowerCase());

    if (!sectionNames.some(n => n.includes('experience') || n.includes('work'))) {
      suggestions.push({
        id: 'structure-experience',
        category: 'Resume Structure',
        priority: 'high',
        issue: 'Missing Experience section',
        impact: 'Experience is the highest-weighted section in ATS scoring (12% of total). Without it, your resume loses critical points.',
        fix: 'Add an "Experience" section with your work history, roles, and accomplishments.',
        section: null,
        estimatedGain: 8,
        type: 'structure'
      });
    }

    if (!sectionNames.some(n => n.includes('skill'))) {
      suggestions.push({
        id: 'structure-skills',
        category: 'Resume Structure',
        priority: 'high',
        issue: 'Missing Skills section',
        impact: 'ATS keyword matching relies heavily on a dedicated Skills section. Missing it means many keywords go undetected.',
        fix: 'Add a "Skills" section with categorized technical and soft skills.',
        section: null,
        estimatedGain: 7,
        type: 'structure'
      });
    }

    if (!sectionNames.some(n => n.includes('education'))) {
      suggestions.push({
        id: 'structure-education',
        category: 'Resume Structure',
        priority: 'high',
        issue: 'Missing Education section',
        impact: 'Most ATS systems require education information for automatic filtering.',
        fix: 'Add an "Education" section with your degree, institution, and dates.',
        section: null,
        estimatedGain: 5,
        type: 'structure'
      });
    }

    const hasSummary = sections.some(s => {
      const lower = (s.name || '').toLowerCase();
      return ['summary', 'objective', 'about', 'profile'].some(p => lower.includes(p));
    });

    if (!hasSummary) {
      suggestions.push({
        id: 'structure-summary',
        category: 'Professional Summary',
        priority: 'medium',
        issue: 'No Professional Summary section',
        impact: 'A summary is the first thing ATS and recruiters read. It provides context for your entire resume.',
        fix: 'Add a "Professional Summary" section at the top with 2-3 sentences highlighting your experience level, key skills, and career goals.',
        section: null,
        estimatedGain: 4,
        type: 'structure'
      });
    }

    sections.forEach(sec => {
      let isEmpty = false;
      if (sec.type === 'list') {
        isEmpty = !(sec.items || []).some(item => E.isRealContent(item.title));
      } else if (sec.type === 'tags') {
        isEmpty = !(sec.categories || []).some(c => c.tags && c.tags.length > 0);
      }

      if (isEmpty) {
        suggestions.push({
          id: `structure-empty-${sec.id}`,
          category: 'Section Completeness',
          priority: 'medium',
          issue: `"${sec.name}" section is empty`,
          impact: 'Empty sections signal an incomplete resume to ATS and recruiters.',
          fix: `Add content to "${sec.name}" or remove the section if not applicable.`,
          section: sec.id,
          estimatedGain: 2,
          type: 'structure'
        });
      }
    });
  }

  function _generateSkillsSuggestions(data, suggestions) {
    const E = window.ATSEngine;
    const tags = E.getAllTags(data);

    if (tags.length > 0 && tags.length < 8) {
      suggestions.push({
        id: 'skills-count',
        category: 'Skills',
        priority: 'medium',
        issue: `Only ${tags.length} skills listed`,
        impact: 'Competitive resumes typically list 10-20 skills. More skills = more keyword matches.',
        fix: 'Add more technical skills, frameworks, tools, and methodologies relevant to your target roles.',
        section: 'skills',
        estimatedGain: 3,
        type: 'keyword'
      });
    }

    const skillsSections = (data.sections || []).filter(s => s.type === 'tags');
    skillsSections.forEach(sec => {
      if ((sec.categories || []).length < 2 && tags.length > 5) {
        suggestions.push({
          id: `skills-categorize-${sec.id}`,
          category: 'Skills',
          priority: 'low',
          issue: 'Skills are in a single category',
          impact: 'Categorized skills (Languages, Frameworks, Tools, etc.) improve readability and ATS parsing.',
          fix: 'Organize skills into 2-4 categories: e.g., "Programming Languages", "Frameworks", "DevOps Tools", "Databases".',
          section: sec.id,
          estimatedGain: 2,
          type: 'formatting'
        });
      }
    });

    const placeholderSkills = tags.filter(t => E.isPlaceholder(t));
    if (placeholderSkills.length > 0) {
      suggestions.push({
        id: 'skills-placeholder',
        category: 'Skills',
        priority: 'high',
        issue: `${placeholderSkills.length} placeholder/generic skill(s) detected`,
        impact: 'Placeholder text causes ATS to flag your resume as incomplete.',
        fix: 'Replace placeholder skills with real technical skills you possess.',
        section: 'skills',
        estimatedGain: 3,
        type: 'content'
      });
    }
  }

  function _generateExperienceSuggestions(data, suggestions) {
    const E = window.ATSEngine;
    const sections = data.sections || [];

    const expSections = sections.filter(s => {
      const lower = (s.name || '').toLowerCase();
      return (lower.includes('experience') || lower.includes('work')) && s.type === 'list';
    });

    expSections.forEach(sec => {
      const items = (sec.items || []).filter(item => E.isRealContent(item.title));

      items.forEach((item, idx) => {
        const highlights = (item.highlights || []).filter(h => E.isRealContent(h));

        // Missing bullet points
        if (highlights.length === 0) {
          suggestions.push({
            id: `exp-bullets-${sec.id}-${idx}`,
            category: 'Experience',
            priority: 'high',
            issue: `"${item.title || 'Entry'}" has no bullet points`,
            impact: 'Entries without descriptions provide no keywords for ATS matching.',
            fix: 'Add 3-5 bullet points describing your achievements, responsibilities, and impact.',
            section: sec.id,
            itemIndex: idx,
            estimatedGain: 4,
            type: 'content'
          });
        } else if (highlights.length < 3) {
          suggestions.push({
            id: `exp-morebullets-${sec.id}-${idx}`,
            category: 'Experience',
            priority: 'medium',
            issue: `"${item.title || 'Entry'}" has only ${highlights.length} bullet point(s)`,
            impact: 'More bullet points provide more keywords and demonstrate depth of experience.',
            fix: 'Add more bullet points to reach 3-5 per role.',
            section: sec.id,
            itemIndex: idx,
            estimatedGain: 2,
            type: 'content'
          });

          // Suggest high-impact role bullet additions
          const titleText = ((item.title || '') + ' ' + (item.subtitle || '')).toLowerCase();
          let matchedKey = null;
          if (titleText.includes('frontend') || titleText.includes('front-end')) matchedKey = 'frontend';
          else if (titleText.includes('backend') || titleText.includes('back-end')) matchedKey = 'backend';
          else if (titleText.includes('data')) matchedKey = 'data';
          else if (titleText.includes('manager') || titleText.includes('lead')) matchedKey = 'manager';
          else if (titleText.includes('designer') || titleText.includes('ui') || titleText.includes('ux')) matchedKey = 'designer';
          else if (titleText.includes('engineer')) matchedKey = 'engineer';
          else if (titleText.includes('developer') || titleText.includes('programmer')) matchedKey = 'developer';

          if (matchedKey && ROLE_BULLETS[matchedKey]) {
            ROLE_BULLETS[matchedKey].forEach((bullet, bIdx) => {
              const alreadyHas = highlights.some(h => h.toLowerCase().includes(bullet.substring(0, 15).toLowerCase()));
              if (!alreadyHas) {
                suggestions.push({
                  id: `exp-addbullet-${sec.id}-${idx}-${matchedKey}-${bIdx}`,
                  category: 'Experience',
                  priority: 'medium',
                  issue: `"${item.title || 'Role'}" has few details. Add a high-impact bullet point.`,
                  impact: 'Adding rich, quantified descriptions of your achievements significantly improves ATS and recruiter relevance.',
                  fix: `Add bullet: "${bullet}"`,
                  section: sec.id,
                  itemIndex: idx,
                  estimatedGain: 2,
                  type: 'content',
                  fixAction: {
                    type: 'addHighlight',
                    sectionId: sec.id,
                    itemIndex: idx,
                    newValue: bullet
                  }
                });
              }
            });
          }
        }

        // Missing role/title
        if (!E.isRealContent(item.subtitle)) {
          suggestions.push({
            id: `exp-role-${sec.id}-${idx}`,
            category: 'Experience',
            priority: 'high',
            issue: `Job title/role missing for "${item.title || 'entry'}"`,
            impact: 'ATS uses job titles for role matching and seniority detection.',
            fix: 'Add your exact job title (e.g., "Software Developer Intern", "Senior Backend Engineer").',
            section: sec.id,
            itemIndex: idx,
            estimatedGain: 3,
            type: 'content'
          });
        }

        // Missing dates
        if (!E.isRealContent(item.duration)) {
          suggestions.push({
            id: `exp-dates-${sec.id}-${idx}`,
            category: 'Experience',
            priority: 'medium',
            issue: `Dates missing for "${item.title || 'entry'}"`,
            impact: 'ATS calculates total years of experience from dates. Missing dates break this calculation.',
            fix: 'Add employment dates (e.g., "Jan 2023 – Present" or "06 2022 – 12 2023").',
            section: sec.id,
            itemIndex: idx,
            estimatedGain: 2,
            type: 'content'
          });
        }

        // Check bullet quality
        highlights.forEach((h, hlIdx) => {
          const firstWord = E.getFirstWord(h);

          // Weak verb
          if (firstWord && E.WEAK_VERBS.has(firstWord)) {
            const rewritten = _rewriteWeakVerbStart(h);
            const alternatives = _getAlternativeVerbs(h);

            const suggestion = {
              id: `exp-weakverb-${sec.id}-${idx}-${hlIdx}`,
              category: 'Action Verbs',
              priority: 'medium',
              issue: `Bullet starts with weak verb "${firstWord}"`,
              impact: 'Weak verbs like "was", "helped", "used" reduce impact. ATS prefers strong action verbs.',
              fix: `Replace "${firstWord}" with a stronger verb: ${alternatives.join(', ')}`,
              section: sec.id,
              itemIndex: idx,
              highlightIndex: hlIdx,
              estimatedGain: 1,
              type: 'content'
            };

            if (rewritten && rewritten !== h) {
              suggestion.fix = `Rewrite bullet to start with action verb: "${rewritten}"`;
              suggestion.fixAction = {
                type: 'replaceHighlight',
                sectionId: sec.id,
                itemIndex: idx,
                highlightIndex: hlIdx,
                newValue: rewritten
              };
            }

            suggestions.push(suggestion);
          }

          // No numbers (prompt suggestion)
          if (E.countNumbers(h) === 0 && /\b(improved|increased|reduced|decreased|saved|grew|boosted|optimized|enhanced|streamlined)\b/i.test(h)) {
            suggestions.push({
              id: `exp-quantify-${sec.id}-${idx}-${hlIdx}`,
              category: 'Quantifiable Achievements',
              priority: 'high',
              issue: 'Achievement claim without numbers',
              impact: 'Bullets mentioning improvement without metrics are 40% less effective. Recruiters want proof.',
              fix: 'Add specific numbers. Click Auto-Apply to enter a metric.',
              section: sec.id,
              itemIndex: idx,
              highlightIndex: hlIdx,
              estimatedGain: 2,
              type: 'content',
              fixAction: {
                type: 'promptForMetric',
                sectionId: sec.id,
                itemIndex: idx,
                highlightIndex: hlIdx,
                text: h
              }
            });
          }
        });
      });
    });
  }

  function _generateProjectSuggestions(data, suggestions) {
    const E = window.ATSEngine;
    const sections = data.sections || [];

    const projSections = sections.filter(s => {
      const lower = (s.name || '').toLowerCase();
      return lower.includes('project') && s.type === 'list';
    });

    projSections.forEach(sec => {
      const items = (sec.items || []).filter(item => E.isRealContent(item.title));

      if (items.length === 1) {
        suggestions.push({
          id: `proj-count-${sec.id}`,
          category: 'Projects',
          priority: 'medium',
          issue: 'Only 1 project listed',
          impact: 'Multiple projects demonstrate diverse skills and initiative. Aim for 2-4.',
          fix: 'Add more projects — include personal projects, hackathon entries, or open-source contributions.',
          section: sec.id,
          estimatedGain: 2,
          type: 'content'
        });
      }

      items.forEach((item, idx) => {
        const highlights = (item.highlights || []).filter(h => E.isRealContent(h));

        if (highlights.length === 0) {
          suggestions.push({
            id: `proj-desc-${sec.id}-${idx}`,
            category: 'Projects',
            priority: 'medium',
            issue: `Project "${item.title}" has no description`,
            impact: 'Without bullet points, ATS cannot extract keywords from this project.',
            fix: 'Add 2-3 bullets describing the tech stack, your contributions, and the outcome.',
            section: sec.id,
            itemIndex: idx,
            estimatedGain: 2,
            type: 'content'
          });
        }

        const allText = [item.title, item.subtitle, ...(item.highlights || [])].join(' ').toLowerCase();
        const hasTech = [...E.TECH_KEYWORDS].some(kw => allText.includes(kw));
        if (!hasTech && highlights.length > 0) {
          suggestions.push({
            id: `proj-tech-${sec.id}-${idx}`,
            category: 'Projects',
            priority: 'low',
            issue: `No technologies mentioned in project "${item.title}"`,
            impact: 'ATS matches technology keywords. Missing them means this project won\'t contribute to keyword scores.',
            fix: 'Mention specific technologies used (e.g., "Built with React, Node.js, and PostgreSQL").',
            section: sec.id,
            itemIndex: idx,
            estimatedGain: 1,
            type: 'keyword'
          });
        }
      });
    });
  }

  function _generateKeywordSuggestions(data, suggestions) {
    const E = window.ATSEngine;
    const allHighlights = E.getAllHighlights(data);
    const allTags = E.getAllTags(data);

    const tagsLower = allTags.map(t => t.toLowerCase());
    const highlightsText = allHighlights.join(' ').toLowerCase();

    const keywordsOnlyInSkills = tagsLower.filter(tag => {
      return E.TECH_KEYWORDS.has(tag) && !highlightsText.includes(tag);
    });

    if (keywordsOnlyInSkills.length > 5) {
      suggestions.push({
        id: 'keywords-distribute',
        category: 'Keyword Quality',
        priority: 'medium',
        issue: `${keywordsOnlyInSkills.length} skills only appear in the Skills section`,
        impact: 'ATS gives higher weight to keywords that appear in context (within bullet points), not just skill lists.',
        fix: 'Integrate your top skills into experience and project descriptions. E.g., "Developed RESTful APIs using Python and Flask".',
        section: null,
        estimatedGain: 3,
        type: 'keyword'
      });
    }
  }

  function _generateReadabilitySuggestions(data, suggestions) {
    const E = window.ATSEngine;
    const sections = data.sections || [];
    const highlights = E.getAllHighlights(data);

    // Scan individual highlights for first-person pronouns
    sections.forEach(sec => {
      if (sec.type === 'list' && sec.items) {
        sec.items.forEach((item, itemIdx) => {
          if (item.highlights) {
            item.highlights.forEach((hl, hlIdx) => {
              if (/\b(I\s+|my\s+|me\s+|myself\s+)/i.test(hl)) {
                const rewritten = _removePronouns(hl);
                const suggestion = {
                  id: `readability-pronoun-${sec.id}-${itemIdx}-${hlIdx}`,
                  category: 'Readability',
                  priority: 'medium',
                  issue: `Bullet point uses first-person pronouns`,
                  impact: 'Professional resumes avoid pronouns (I, my, me). Use action-driven implied first-person statements.',
                  fix: `Remove pronouns: "${rewritten}"`,
                  section: sec.id,
                  itemIndex: itemIdx,
                  highlightIndex: hlIdx,
                  estimatedGain: 1,
                  type: 'formatting'
                };
                if (rewritten && rewritten !== hl) {
                  suggestion.fixAction = {
                    type: 'replaceHighlight',
                    sectionId: sec.id,
                    itemIndex: itemIdx,
                    highlightIndex: hlIdx,
                    newValue: rewritten
                  };
                }
                suggestions.push(suggestion);
              }
            });
          }
        });
      }
    });

    const longBullets = highlights.filter(h => h.length > 200);
    if (longBullets.length > 0) {
      suggestions.push({
        id: 'readability-length',
        category: 'Readability',
        priority: 'low',
        issue: `${longBullets.length} bullet(s) are too long (>200 characters)`,
        impact: 'Long bullets reduce readability and may get truncated by some ATS systems.',
        fix: 'Keep bullet points concise (50-150 characters). Split long bullets into two separate points.',
        section: null,
        estimatedGain: 1,
        type: 'formatting'
      });
    }
  }

  function _generateConsistencySuggestions(data, suggestions) {
    const E = window.ATSEngine;
    const highlights = E.getAllHighlights(data);

    if (highlights.length > 2) {
      const endsWithPeriod = highlights.filter(h => h.trim().endsWith('.'));
      const ratio = endsWithPeriod.length / highlights.length;
      if (ratio > 0.2 && ratio < 0.8) {
        const mode = ratio >= 0.5 ? 'add' : 'remove';
        suggestions.push({
          id: 'consistency-punctuation',
          category: 'Grammar & Consistency',
          priority: 'low',
          issue: 'Inconsistent bullet point punctuation',
          impact: 'Inconsistent formatting signals carelessness to both ATS parsers and recruiters.',
          fix: mode === 'add'
            ? 'End all bullet points with periods for consistency.'
            : 'Remove trailing periods from all bullet points for consistency.',
          section: null,
          estimatedGain: 1,
          type: 'formatting',
          fixAction: {
            type: 'fixAllPunctuation',
            mode: mode
          }
        });
      }
    }

    const normalized = highlights.map(h => h.toLowerCase().replace(/[^a-z0-9\s]/g, '').trim());
    const dupes = normalized.filter((h, i) => normalized.indexOf(h) !== i && h.length > 20);
    if (dupes.length > 0) {
      suggestions.push({
        id: 'consistency-duplicates',
        category: 'Grammar & Consistency',
        priority: 'medium',
        issue: `${dupes.length} duplicate bullet point(s) detected`,
        impact: 'Duplicate content wastes valuable resume space and looks unprofessional.',
        fix: 'Remove exact duplicate bullet points throughout the resume.',
        section: null,
        estimatedGain: 2,
        type: 'content',
        fixAction: {
          type: 'removeDuplicates'
        }
      });
    }
  }

  function _getAlternativeVerbs(bulletText) {
    const lower = bulletText.toLowerCase();

    if (/\b(code|software|app|feature|system|api|function|module|component|interface)\b/.test(lower)) {
      return ['Developed', 'Engineered', 'Architected', 'Implemented', 'Built'];
    }
    if (/\b(team|group|people|colleague|member|department)\b/.test(lower)) {
      return ['Led', 'Coordinated', 'Collaborated', 'Managed', 'Mentored'];
    }
    if (/\b(performance|speed|latency|throughput|efficiency|load|time)\b/.test(lower)) {
      return ['Optimized', 'Accelerated', 'Streamlined', 'Enhanced', 'Improved'];
    }
    if (/\b(bug|issue|error|problem|fix|debug|crash)\b/.test(lower)) {
      return ['Resolved', 'Debugged', 'Diagnosed', 'Remedied', 'Troubleshot'];
    }
    if (/\b(report|data|metric|analysis|insight|dashboard)\b/.test(lower)) {
      return ['Analyzed', 'Evaluated', 'Measured', 'Assessed', 'Quantified'];
    }
    if (/\b(deploy|release|server|infrastructure|cloud|ci|cd|pipeline)\b/.test(lower)) {
      return ['Deployed', 'Provisioned', 'Automated', 'Configured', 'Orchestrated'];
    }
    if (/\b(test|quality|qa|validation|verification|coverage)\b/.test(lower)) {
      return ['Tested', 'Validated', 'Verified', 'Audited', 'Benchmarked'];
    }
    if (/\b(document|write|blog|article|guide|specification)\b/.test(lower)) {
      return ['Authored', 'Documented', 'Published', 'Crafted', 'Articulated'];
    }

    return ['Developed', 'Implemented', 'Delivered', 'Executed', 'Spearheaded'];
  }

  // ═══════════════════════════════════════════════════════════════════════════
  // MAIN GENERATOR
  // ═══════════════════════════════════════════════════════════════════════════

  function generate(resumeData) {
    if (!resumeData || !window.ATSEngine) return [];

    const currentHash = _hash(resumeData);
    if (_cache.hash === currentHash && _cache.suggestions) {
      return _cache.suggestions;
    }

    const suggestions = [];

    // Run all generators
    _generateTypoSuggestions(resumeData, suggestions);
    _generateContactSuggestions(resumeData, suggestions);
    _generateStructureSuggestions(resumeData, suggestions);
    _generateSkillsSuggestions(resumeData, suggestions);
    _generateExperienceSuggestions(resumeData, suggestions);
    _generateProjectSuggestions(resumeData, suggestions);
    _generateKeywordSuggestions(resumeData, suggestions);
    _generateReadabilitySuggestions(resumeData, suggestions);
    _generateConsistencySuggestions(resumeData, suggestions);

    const seen = new Set();
    const unique = suggestions.filter(s => {
      if (seen.has(s.id)) return false;
      seen.add(s.id);
      return true;
    });

    const priorityOrder = { high: 0, medium: 1, low: 2 };
    unique.sort((a, b) => {
      const pDiff = (priorityOrder[a.priority] || 2) - (priorityOrder[b.priority] || 2);
      if (pDiff !== 0) return pDiff;
      return (b.estimatedGain || 0) - (a.estimatedGain || 0);
    });

    const result = unique.slice(0, MAX_SUGGESTIONS);

    _cache = { hash: currentHash, suggestions: result };
    return result;
  }

  function getTopSuggestions(resumeData, n = 5) {
    return generate(resumeData).slice(0, n);
  }

  function invalidateCache() {
    _cache = { hash: null, suggestions: null };
  }

  window.ATSRecommendations = {
    generate,
    getTopSuggestions,
    invalidateCache
  };

})();
