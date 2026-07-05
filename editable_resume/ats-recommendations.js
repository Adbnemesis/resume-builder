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
  // SUGGESTION GENERATORS
  // ═══════════════════════════════════════════════════════════════════════════

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

    // Summary section
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

    // Empty sections
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

    // Check categorization
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

    // Check for placeholder skills
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
            const alternatives = _getAlternativeVerbs(h);
            suggestions.push({
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
            });
          }

          // No numbers
          if (E.countNumbers(h) === 0 && /\b(improved|increased|reduced|decreased|saved|grew|boosted|optimized|enhanced|streamlined)\b/i.test(h)) {
            suggestions.push({
              id: `exp-quantify-${sec.id}-${idx}-${hlIdx}`,
              category: 'Quantifiable Achievements',
              priority: 'high',
              issue: 'Achievement claim without numbers',
              impact: 'Bullets mentioning improvement without metrics are 40% less effective. Recruiters want proof.',
              fix: `Add specific numbers: e.g., "by 30%", "saving $50K", "serving 10K users", "reducing from 5s to 200ms".`,
              section: sec.id,
              itemIndex: idx,
              highlightIndex: hlIdx,
              estimatedGain: 2,
              type: 'content'
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

        // Check for tech stack mention
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
    const allText = [...allHighlights, ...allTags].join(' ').toLowerCase();

    // Check if keywords appear in bullet points (not just skills)
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
    const highlights = E.getAllHighlights(data);

    // Check for first-person pronouns
    const firstPersonBullets = highlights.filter(h => /\b(I |my |me |myself)\b/i.test(h));
    if (firstPersonBullets.length > 0) {
      suggestions.push({
        id: 'readability-firstperson',
        category: 'Readability',
        priority: 'medium',
        issue: `${firstPersonBullets.length} bullet(s) use first-person pronouns`,
        impact: 'Professional resumes avoid "I", "my", "me". It\'s an industry standard to use implied first person.',
        fix: 'Remove pronouns. Instead of "I developed a system", write "Developed a system".',
        section: null,
        estimatedGain: 1,
        type: 'formatting'
      });
    }

    // Check for overly long bullets
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

    // Check punctuation consistency
    if (highlights.length > 2) {
      const endsWithPeriod = highlights.filter(h => h.trim().endsWith('.'));
      const ratio = endsWithPeriod.length / highlights.length;
      if (ratio > 0.2 && ratio < 0.8) {
        suggestions.push({
          id: 'consistency-punctuation',
          category: 'Grammar & Consistency',
          priority: 'low',
          issue: 'Inconsistent bullet point punctuation',
          impact: 'Inconsistent formatting signals carelessness to both ATS parsers and recruiters.',
          fix: `Choose one style: either end all bullets with periods, or none. Currently ${endsWithPeriod.length}/${highlights.length} use periods.`,
          section: null,
          estimatedGain: 1,
          type: 'formatting'
        });
      }
    }

    // Check for duplicate content
    const normalized = highlights.map(h => h.toLowerCase().replace(/[^a-z0-9\s]/g, '').trim());
    const dupes = normalized.filter((h, i) => normalized.indexOf(h) !== i && h.length > 20);
    if (dupes.length > 0) {
      suggestions.push({
        id: 'consistency-duplicates',
        category: 'Grammar & Consistency',
        priority: 'medium',
        issue: `${dupes.length} duplicate bullet point(s) detected`,
        impact: 'Duplicate content wastes valuable resume space and looks unprofessional.',
        fix: 'Remove or rephrase duplicate bullet points.',
        section: null,
        estimatedGain: 2,
        type: 'content'
      });
    }
  }

  // ═══════════════════════════════════════════════════════════════════════════
  // HELPER: Suggest alternative verbs based on context
  // ═══════════════════════════════════════════════════════════════════════════

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
    _generateContactSuggestions(resumeData, suggestions);
    _generateStructureSuggestions(resumeData, suggestions);
    _generateSkillsSuggestions(resumeData, suggestions);
    _generateExperienceSuggestions(resumeData, suggestions);
    _generateProjectSuggestions(resumeData, suggestions);
    _generateKeywordSuggestions(resumeData, suggestions);
    _generateReadabilitySuggestions(resumeData, suggestions);
    _generateConsistencySuggestions(resumeData, suggestions);

    // Deduplicate by ID
    const seen = new Set();
    const unique = suggestions.filter(s => {
      if (seen.has(s.id)) return false;
      seen.add(s.id);
      return true;
    });

    // Sort: high priority first, then by estimated gain
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

  // ═══════════════════════════════════════════════════════════════════════════
  // PUBLIC API
  // ═══════════════════════════════════════════════════════════════════════════

  window.ATSRecommendations = {
    generate,
    getTopSuggestions,
    invalidateCache
  };

})();
