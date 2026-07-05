/**
 * ============================================================================
 * ATS JOB DESCRIPTION PARSER — ats-job-parser.js
 * ============================================================================
 * Parses job descriptions from pasted text or URLs. Extracts structured
 * requirements including skills, technologies, experience, education,
 * certifications, responsibilities, seniority, and keywords.
 *
 * Public API (exposed on window.ATSJobParser):
 *   - parse(text)                → ParsedJob object from pasted text
 *   - fetchAndParse(url)         → Promise<ParsedJob> from URL
 *   - extractKeywords(text)      → string[] of detected keywords
 *
 * No external dependencies (uses built-in fetch + CORS proxies).
 * ============================================================================
 */

(function () {
  'use strict';

  // ═══════════════════════════════════════════════════════════════════════════
  // CORS PROXY FALLBACKS — for fetching external URLs client-side
  // ═══════════════════════════════════════════════════════════════════════════

  const CORS_PROXIES = [
    url => `https://api.allorigins.win/raw?url=${encodeURIComponent(url)}`,
    url => `https://corsproxy.io/?${encodeURIComponent(url)}`,
    url => `https://api.codetabs.com/v1/proxy?quest=${encodeURIComponent(url)}`
  ];

  // ═══════════════════════════════════════════════════════════════════════════
  // KNOWLEDGE BASES — Patterns for parsing job descriptions
  // ═══════════════════════════════════════════════════════════════════════════

  const SENIORITY_PATTERNS = {
    intern:  /\b(intern|internship|trainee|co-op|apprentice)\b/i,
    junior:  /\b(junior|jr\.?|entry[\s-]?level|associate|new\s+grad|graduate|fresh(?:er)?)\b/i,
    mid:     /\b(mid[\s-]?level|mid[\s-]?senior|intermediate|\b[2-4]\+?\s+years)\b/i,
    senior:  /\b(senior|sr\.?|lead|principal|staff|\b[5-9]\+?\s+years|\b(?:10|1[0-5])\+?\s+years)\b/i,
    manager: /\b(manager|director|head\s+of|vp|vice\s+president|chief|c[- ]?level|executive)\b/i
  };

  const EDUCATION_PATTERNS = [
    /\b(bachelor'?s?|b\.?s\.?|b\.?a\.?|b\.?tech|b\.?e\.?|b\.?sc|undergraduate)\b/i,
    /\b(master'?s?|m\.?s\.?|m\.?a\.?|m\.?tech|m\.?e\.?|m\.?sc|mba|graduate\s+degree)\b/i,
    /\b(ph\.?d\.?|doctorate|doctoral)\b/i,
    /\b(computer\s+science|software\s+engineering|information\s+technology|electrical\s+engineering|mathematics|data\s+science|engineering)\b/i
  ];

  const CERTIFICATION_KEYWORDS = [
    'aws certified', 'azure certified', 'gcp certified', 'google cloud certified',
    'kubernetes certified', 'cka', 'ckad', 'certified kubernetes',
    'pmp', 'scrum master', 'csm', 'safe', 'agile certified',
    'cissp', 'cism', 'ceh', 'comptia', 'security+', 'network+',
    'oracle certified', 'java certified', 'microsoft certified',
    'terraform certified', 'docker certified', 'red hat certified',
    'itil', 'six sigma', 'togaf', 'istqb',
    'data engineer certified', 'machine learning certified',
    'professional engineer', 'pe license',
    'cpa', 'cfa', 'frm'
  ];

  const SOFT_SKILL_KEYWORDS = [
    'communication', 'leadership', 'teamwork', 'collaboration',
    'problem solving', 'problem-solving', 'critical thinking',
    'time management', 'adaptability', 'creativity', 'innovation',
    'attention to detail', 'self-motivated', 'self-starter',
    'proactive', 'analytical', 'interpersonal', 'mentoring',
    'mentorship', 'cross-functional', 'stakeholder',
    'presentation', 'negotiation', 'conflict resolution',
    'strategic thinking', 'decision making', 'decision-making',
    'multitasking', 'organization', 'flexibility',
    'emotional intelligence', 'work ethic', 'accountability'
  ];

  const SECTION_HEADERS_JD = {
    requirements: /\b(requirements?|qualifications?|must[\s-]?have|required|minimum\s+qualifications?|what\s+you(?:'ll)?\s+need|what\s+we(?:'re)?\s+looking\s+for)\b/i,
    preferred: /\b(preferred|nice[\s-]?to[\s-]?have|bonus|desired|plus|ideal|additional|preferred\s+qualifications?)\b/i,
    responsibilities: /\b(responsibilities|what\s+you(?:'ll)?\s+do|duties|role|about\s+the\s+role|job\s+description|your\s+impact|key\s+responsibilities|day[\s-]?to[\s-]?day)\b/i,
    benefits: /\b(benefits|perks|compensation|what\s+we\s+offer|why\s+join)\b/i,
    about: /\b(about\s+(?:us|the\s+company|the\s+team)|who\s+we\s+are|company\s+overview|our\s+mission)\b/i
  };

  // ═══════════════════════════════════════════════════════════════════════════
  // TEXT EXTRACTION FROM HTML
  // ═══════════════════════════════════════════════════════════════════════════

  function _stripHTML(html) {
    // Remove script and style tags entirely
    let clean = html.replace(/<script[\s\S]*?<\/script>/gi, '');
    clean = clean.replace(/<style[\s\S]*?<\/style>/gi, '');
    clean = clean.replace(/<nav[\s\S]*?<\/nav>/gi, '');
    clean = clean.replace(/<footer[\s\S]*?<\/footer>/gi, '');
    clean = clean.replace(/<header[\s\S]*?<\/header>/gi, '');

    // Try to find main content area
    const mainMatch = clean.match(/<main[\s\S]*?<\/main>/i) ||
                      clean.match(/<article[\s\S]*?<\/article>/i) ||
                      clean.match(/<div[^>]*(?:job|description|content|posting|details|main)[^>]*>[\s\S]*?<\/div>/i);

    if (mainMatch) {
      clean = mainMatch[0];
    }

    // Replace block elements with newlines
    clean = clean.replace(/<\/?(h[1-6]|p|div|li|br|tr|td|th|section|article)[^>]*>/gi, '\n');
    // Replace list markers
    clean = clean.replace(/<\/?(?:ul|ol)[^>]*>/gi, '\n');
    // Strip remaining tags
    clean = clean.replace(/<[^>]+>/g, ' ');
    // Decode HTML entities
    clean = clean.replace(/&amp;/g, '&').replace(/&lt;/g, '<').replace(/&gt;/g, '>');
    clean = clean.replace(/&nbsp;/g, ' ').replace(/&quot;/g, '"').replace(/&#39;/g, "'");
    clean = clean.replace(/&[a-z]+;/gi, ' ');
    // Clean whitespace
    clean = clean.replace(/[ \t]+/g, ' ');
    clean = clean.replace(/\n\s*\n+/g, '\n\n');
    return clean.trim();
  }

  // ═══════════════════════════════════════════════════════════════════════════
  // URL FETCHING
  // ═══════════════════════════════════════════════════════════════════════════

  async function fetchAndParse(url) {
    if (!url || !url.trim()) {
      throw new Error('No URL provided');
    }

    url = url.trim();
    if (!url.startsWith('http://') && !url.startsWith('https://')) {
      url = 'https://' + url;
    }

    let html = null;
    let lastError = null;

    // Try each CORS proxy
    for (const proxyFn of CORS_PROXIES) {
      try {
        const proxyUrl = proxyFn(url);
        const response = await fetch(proxyUrl, {
          signal: AbortSignal.timeout(10000)
        });

        if (response.ok) {
          html = await response.text();
          if (html && html.length > 100) break;
        }
      } catch (err) {
        lastError = err;
        continue;
      }
    }

    if (!html) {
      throw new Error(
        `Could not fetch the job posting URL. This is likely due to CORS restrictions. ` +
        `Please paste the job description text directly instead.` +
        (lastError ? ` (${lastError.message})` : '')
      );
    }

    // Extract text from HTML
    const text = _stripHTML(html);

    if (text.length < 50) {
      throw new Error('Fetched page contained insufficient text content. The page may require JavaScript or authentication. Please paste the job description manually.');
    }

    return parse(text);
  }

  // ═══════════════════════════════════════════════════════════════════════════
  // MAIN TEXT PARSER
  // ═══════════════════════════════════════════════════════════════════════════

  function parse(text) {
    if (!text || text.trim().length < 20) {
      return _emptyResult();
    }

    const result = {
      title: '',
      company: '',
      seniority: 'unknown',
      requiredSkills: [],
      preferredSkills: [],
      technologies: [],
      experienceYears: { min: 0, max: 0 },
      education: [],
      certifications: [],
      responsibilities: [],
      keywords: [],
      softSkills: [],
      roleLevel: '',
      rawText: text.substring(0, 5000) // Store first 5K chars for reference
    };

    const lower = text.toLowerCase();
    const lines = text.split('\n').map(l => l.trim()).filter(l => l.length > 0);

    // 1. Extract job title (usually first meaningful line)
    result.title = _extractTitle(lines);

    // 2. Extract company name
    result.company = _extractCompany(lines, text);

    // 3. Detect seniority
    result.seniority = _detectSeniority(text);
    result.roleLevel = _detectRoleLevel(text, result.seniority);

    // 4. Extract experience years
    result.experienceYears = _extractExperienceYears(text);

    // 5. Parse sections
    const sections = _splitIntoSections(text);

    // 6. Extract skills from requirements sections
    const requirementsText = (sections.requirements || '') + ' ' + (sections.preferred || '');
    const allText = text;

    result.requiredSkills = _extractSkills(sections.requirements || allText, true);
    result.preferredSkills = _extractSkills(sections.preferred || '', false);

    // 7. Extract technologies
    result.technologies = _extractTechnologies(allText);

    // 8. Extract education requirements
    result.education = _extractEducation(allText);

    // 9. Extract certifications
    result.certifications = _extractCertifications(allText);

    // 10. Extract responsibilities
    result.responsibilities = _extractResponsibilities(sections.responsibilities || '');

    // 11. Extract keywords (comprehensive)
    result.keywords = extractKeywords(allText);

    // 12. Extract soft skills
    result.softSkills = _extractSoftSkills(allText);

    // Deduplicate all arrays
    result.requiredSkills = [...new Set(result.requiredSkills)];
    result.preferredSkills = [...new Set(result.preferredSkills.filter(s => !result.requiredSkills.includes(s)))];
    result.technologies = [...new Set(result.technologies)];
    result.education = [...new Set(result.education)];
    result.certifications = [...new Set(result.certifications)];
    result.keywords = [...new Set(result.keywords)];
    result.softSkills = [...new Set(result.softSkills)];

    return result;
  }

  // ═══════════════════════════════════════════════════════════════════════════
  // EXTRACTION HELPERS
  // ═══════════════════════════════════════════════════════════════════════════

  function _extractTitle(lines) {
    // Look for common title patterns
    for (let i = 0; i < Math.min(lines.length, 10); i++) {
      const line = lines[i];
      if (line.length > 10 && line.length < 80) {
        // Looks like a job title if it contains role keywords
        if (/\b(engineer|developer|designer|manager|analyst|architect|specialist|consultant|scientist|lead|director|coordinator|administrator|associate|intern)\b/i.test(line)) {
          return line.replace(/[\-–—|].*$/, '').trim();
        }
      }
    }

    // Fallback: first non-trivial line
    for (const line of lines.slice(0, 5)) {
      if (line.length > 5 && line.length < 100 && !/^(about|company|location|department)/i.test(line)) {
        return line;
      }
    }

    return 'Unknown Position';
  }

  function _extractCompany(lines, text) {
    // Look for "at Company" or "Company -" patterns
    const atMatch = text.match(/\bat\s+([A-Z][A-Za-z\s&.]+?)(?:\s*[-–—|,]|\s+is\s|\s+we\s)/);
    if (atMatch) return atMatch[1].trim();

    // Look for company line near the top
    for (let i = 0; i < Math.min(lines.length, 8); i++) {
      const line = lines[i];
      if (line.length > 2 && line.length < 50) {
        // Skip if it looks like a job title
        if (/\b(engineer|developer|designer|manager|analyst|apply|posted|location)\b/i.test(line)) continue;
        // Could be company name if it's a short capitalized line
        if (/^[A-Z]/.test(line) && !/\b(requirements|qualifications|description|about)\b/i.test(line)) {
          return line;
        }
      }
    }

    return '';
  }

  function _detectSeniority(text) {
    // Check from most senior to least
    if (SENIORITY_PATTERNS.manager.test(text)) return 'manager';
    if (SENIORITY_PATTERNS.senior.test(text)) return 'senior';
    if (SENIORITY_PATTERNS.mid.test(text)) return 'mid';
    if (SENIORITY_PATTERNS.junior.test(text)) return 'junior';
    if (SENIORITY_PATTERNS.intern.test(text)) return 'intern';
    return 'unknown';
  }

  function _detectRoleLevel(text, seniority) {
    const levelMap = {
      intern: 'Intern/Entry',
      junior: 'IC1/IC2 (Junior)',
      mid: 'IC2/IC3 (Mid-Level)',
      senior: 'IC3/IC4 (Senior)',
      manager: 'Manager/Director'
    };
    return levelMap[seniority] || '';
  }

  function _extractExperienceYears(text) {
    const result = { min: 0, max: 0 };

    // Match patterns like "3+ years", "3-5 years", "minimum 3 years"
    const patterns = [
      /(\d+)\s*[-–to]+\s*(\d+)\s*(?:\+\s*)?years?/i,
      /(\d+)\+?\s*years?/i,
      /minimum\s+(\d+)\s*years?/i,
      /at\s+least\s+(\d+)\s*years?/i
    ];

    for (const pattern of patterns) {
      const match = text.match(pattern);
      if (match) {
        if (match[2]) {
          result.min = parseInt(match[1]);
          result.max = parseInt(match[2]);
        } else {
          result.min = parseInt(match[1]);
          result.max = result.min + 2;
        }
        break;
      }
    }

    return result;
  }

  function _splitIntoSections(text) {
    const sections = { requirements: '', preferred: '', responsibilities: '', benefits: '', about: '' };
    const lines = text.split('\n');

    let currentSection = null;

    lines.forEach(line => {
      const trimmed = line.trim();

      // Check if this line is a section header
      for (const [key, pattern] of Object.entries(SECTION_HEADERS_JD)) {
        if (pattern.test(trimmed) && trimmed.length < 80) {
          currentSection = key;
          return;
        }
      }

      if (currentSection && sections[currentSection] !== undefined) {
        sections[currentSection] += trimmed + '\n';
      }
    });

    return sections;
  }

  function _extractSkills(text, isRequired) {
    if (!text) return [];

    const skills = [];
    const E = window.ATSEngine;

    if (E && E.TECH_KEYWORDS) {
      const lower = text.toLowerCase();
      E.TECH_KEYWORDS.forEach(kw => {
        // Use word boundary matching for short keywords to avoid false positives
        if (kw.length <= 2) {
          const regex = new RegExp(`\\b${kw.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}\\b`, 'i');
          if (regex.test(text)) skills.push(kw);
        } else {
          if (lower.includes(kw)) skills.push(kw);
        }
      });
    }

    // Also extract from bullet point patterns
    const bulletLines = text.split('\n').filter(l => {
      const t = l.trim();
      return t.startsWith('•') || t.startsWith('-') || t.startsWith('*') || /^\d+[.)]\s/.test(t);
    });

    bulletLines.forEach(line => {
      // Extract skills mentioned in bullet points
      const cleaned = line.replace(/^[•\-*\d.)]+\s*/, '').trim();
      if (cleaned.length > 0 && cleaned.length < 100) {
        // Check for skill-like phrases
        const matches = cleaned.match(/\b(?:[A-Z][a-zA-Z.+#]*(?:\s+[A-Z][a-zA-Z.+#]*)*)\b/g);
        if (matches) {
          matches.forEach(m => {
            const lower = m.toLowerCase();
            if (E && E.TECH_KEYWORDS && E.TECH_KEYWORDS.has(lower)) {
              skills.push(lower);
            }
          });
        }
      }
    });

    return skills;
  }

  function _extractTechnologies(text) {
    const techs = [];
    const E = window.ATSEngine;

    if (!E || !E.TECH_KEYWORDS) return techs;

    const lower = text.toLowerCase();
    const techCategories = [
      // Programming languages
      'javascript', 'typescript', 'python', 'java', 'c++', 'c#', 'go', 'rust', 'ruby', 'php', 'swift', 'kotlin',
      // Frameworks
      'react', 'angular', 'vue', 'next.js', 'django', 'flask', 'spring', 'express', 'node.js',
      // Databases
      'mysql', 'postgresql', 'mongodb', 'redis', 'elasticsearch', 'dynamodb',
      // Cloud
      'aws', 'azure', 'gcp', 'docker', 'kubernetes',
      // Tools
      'git', 'jenkins', 'terraform', 'ansible', 'kafka'
    ];

    techCategories.forEach(tech => {
      if (lower.includes(tech)) {
        techs.push(tech);
      }
    });

    return techs;
  }

  function _extractEducation(text) {
    const education = [];

    EDUCATION_PATTERNS.forEach(pattern => {
      const match = text.match(pattern);
      if (match) {
        education.push(match[0]);
      }
    });

    // Also check for specific degree mentions
    const degreePattern = /(?:bachelor|master|ph\.?d|doctorate|b\.?s\.?|m\.?s\.?|b\.?tech|m\.?tech|mba)'?s?\s+(?:degree\s+)?(?:in\s+)?([A-Za-z\s,]+?)(?:\.|,|\n|$)/gi;
    let match;
    while ((match = degreePattern.exec(text)) !== null) {
      if (match[1] && match[1].trim().length > 2) {
        education.push(match[0].trim());
      }
    }

    return education;
  }

  function _extractCertifications(text) {
    const certs = [];
    const lower = text.toLowerCase();

    CERTIFICATION_KEYWORDS.forEach(cert => {
      if (lower.includes(cert)) {
        certs.push(cert.split(' ').map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(' '));
      }
    });

    return certs;
  }

  function _extractResponsibilities(text) {
    if (!text) return [];

    const lines = text.split('\n').map(l => l.trim()).filter(l => l.length > 10);
    const responsibilities = [];

    lines.forEach(line => {
      const cleaned = line.replace(/^[•\-*\d.)]+\s*/, '').trim();
      if (cleaned.length > 15 && cleaned.length < 300) {
        responsibilities.push(cleaned);
      }
    });

    return responsibilities.slice(0, 15);
  }

  function extractKeywords(text) {
    if (!text) return [];

    const keywords = new Set();
    const lower = text.toLowerCase();
    const E = window.ATSEngine;

    // Add tech keywords found in text
    if (E && E.TECH_KEYWORDS) {
      E.TECH_KEYWORDS.forEach(kw => {
        if (lower.includes(kw)) keywords.add(kw);
      });
    }

    // Add soft skills found
    SOFT_SKILL_KEYWORDS.forEach(skill => {
      if (lower.includes(skill)) keywords.add(skill);
    });

    // Extract capitalized multi-word terms (likely proper nouns / tools)
    const capitalizedTerms = text.match(/\b[A-Z][a-zA-Z]+(?:\s+[A-Z][a-zA-Z]+)+\b/g);
    if (capitalizedTerms) {
      capitalizedTerms.forEach(term => {
        if (term.length > 3 && term.length < 40) {
          keywords.add(term.toLowerCase());
        }
      });
    }

    return [...keywords];
  }

  function _extractSoftSkills(text) {
    const skills = [];
    const lower = text.toLowerCase();

    SOFT_SKILL_KEYWORDS.forEach(skill => {
      if (lower.includes(skill)) {
        skills.push(skill.split(' ').map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(' '));
      }
    });

    return skills;
  }

  function _emptyResult() {
    return {
      title: '',
      company: '',
      seniority: 'unknown',
      requiredSkills: [],
      preferredSkills: [],
      technologies: [],
      experienceYears: { min: 0, max: 0 },
      education: [],
      certifications: [],
      responsibilities: [],
      keywords: [],
      softSkills: [],
      roleLevel: '',
      rawText: ''
    };
  }

  // ═══════════════════════════════════════════════════════════════════════════
  // PUBLIC API
  // ═══════════════════════════════════════════════════════════════════════════

  window.ATSJobParser = {
    parse,
    fetchAndParse,
    extractKeywords
  };

})();
