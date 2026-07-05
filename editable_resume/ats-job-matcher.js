/**
 * ============================================================================
 * ATS JOB MATCHER — ats-job-matcher.js
 * ============================================================================
 * Compares a resume against a parsed job description to produce match scores,
 * identify gaps, and generate job-specific optimization suggestions.
 *
 * Public API (exposed on window.ATSJobMatcher):
 *   - match(resumeData, parsedJob) → MatchResult object
 *   - getOptimizations(resumeData, parsedJob) → Suggestion[] for this job
 *
 * Depends on: window.ATSEngine, window.ATSJobParser
 * ============================================================================
 */

(function () {
  'use strict';

  // ═══════════════════════════════════════════════════════════════════════════
  // MATCH WEIGHT CONFIGURATION
  // ═══════════════════════════════════════════════════════════════════════════

  const MATCH_WEIGHTS = {
    skillMatch:       30,
    keywordMatch:     25,
    experienceMatch:  15,
    educationMatch:   10,
    certificationMatch: 10,
    responsibilityMatch: 10
  };

  const TOTAL_MATCH_WEIGHT = Object.values(MATCH_WEIGHTS).reduce((a, b) => a + b, 0);

  // ═══════════════════════════════════════════════════════════════════════════
  // UTILITY HELPERS
  // ═══════════════════════════════════════════════════════════════════════════

  function _getResumeText(resumeData) {
    const parts = [];
    const p = resumeData.personal || {};
    // Include all sections
    (resumeData.sections || []).forEach(sec => {
      parts.push(sec.name || '');
      if (sec.type === 'list' && sec.items) {
        sec.items.forEach(item => {
          parts.push(item.title || '');
          parts.push(item.subtitle || '');
          (item.highlights || []).forEach(h => parts.push(h || ''));
        });
      }
      if (sec.type === 'tags' && sec.categories) {
        sec.categories.forEach(cat => {
          parts.push(cat.label || '');
          (cat.tags || []).forEach(t => parts.push(t || ''));
        });
      }
    });
    return parts.join(' ').toLowerCase();
  }

  function _getResumeSectionByType(resumeData, namePattern) {
    return (resumeData.sections || []).find(s => {
      const lower = (s.name || '').toLowerCase();
      return namePattern.some(p => lower.includes(p));
    });
  }

  function _fuzzyMatch(text, keyword) {
    if (!text || !keyword) return false;
    const lower = text.toLowerCase();
    const kw = keyword.toLowerCase();

    // Exact match
    if (lower.includes(kw)) return true;

    // Handle common variations
    const variations = [
      kw.replace(/\./g, ''),           // "Node.js" → "Nodejs"
      kw.replace(/\.js$/i, ''),         // "Node.js" → "Node"
      kw.replace(/[-_]/g, ' '),         // "machine-learning" → "machine learning"
      kw.replace(/\s+/g, ''),           // "machine learning" → "machinelearning"
      kw.replace(/\s+/g, '-'),          // "machine learning" → "machine-learning"
    ];

    return variations.some(v => lower.includes(v));
  }

  // ═══════════════════════════════════════════════════════════════════════════
  // MATCHERS
  // ═══════════════════════════════════════════════════════════════════════════

  function _matchSkills(resumeData, parsedJob) {
    const E = window.ATSEngine;
    if (!E) return { score: 0, matched: [], missing: [], total: 0 };

    const resumeTags = E.getAllTags(resumeData).map(t => t.toLowerCase());
    const resumeText = _getResumeText(resumeData);

    const allJobSkills = [...(parsedJob.requiredSkills || []), ...(parsedJob.preferredSkills || [])];
    const uniqueSkills = [...new Set(allJobSkills.map(s => s.toLowerCase()))];

    if (uniqueSkills.length === 0) {
      return { score: 100, matched: [], missing: [], total: 0 };
    }

    const matched = [];
    const missing = [];

    uniqueSkills.forEach(skill => {
      const found = resumeTags.some(t => _fuzzyMatch(t, skill)) || _fuzzyMatch(resumeText, skill);
      if (found) {
        matched.push(skill);
      } else {
        missing.push(skill);
      }
    });

    const score = Math.round((matched.length / uniqueSkills.length) * 100);

    return { score, matched, missing, total: uniqueSkills.length };
  }

  function _matchKeywords(resumeData, parsedJob) {
    const resumeText = _getResumeText(resumeData);
    const jobKeywords = (parsedJob.keywords || []).map(k => k.toLowerCase());

    if (jobKeywords.length === 0) {
      return { score: 100, matched: [], missing: [], total: 0 };
    }

    const matched = [];
    const missing = [];

    jobKeywords.forEach(kw => {
      if (_fuzzyMatch(resumeText, kw)) {
        matched.push(kw);
      } else {
        missing.push(kw);
      }
    });

    const score = Math.round((matched.length / jobKeywords.length) * 100);

    return { score, matched, missing, total: jobKeywords.length };
  }

  function _matchExperience(resumeData, parsedJob) {
    const reqYears = parsedJob.experienceYears || { min: 0, max: 0 };

    if (reqYears.min === 0 && reqYears.max === 0) {
      return { score: 80, detail: 'No specific experience requirement detected.', meets: true };
    }

    // Estimate resume experience from dates
    const expSection = _getResumeSectionByType(resumeData, ['experience', 'work']);
    let totalMonths = 0;

    if (expSection && expSection.type === 'list' && expSection.items) {
      expSection.items.forEach(item => {
        const dur = item.duration || '';
        // Try to parse date ranges
        const dateMatch = dur.match(/(\d{2})\s*(\d{4})\s*[-–—]\s*(?:(\d{2})\s*(\d{4})|present|ongoing|current)/i);
        if (dateMatch) {
          const startMonth = parseInt(dateMatch[1]);
          const startYear = parseInt(dateMatch[2]);
          let endMonth, endYear;

          if (dateMatch[3] && dateMatch[4]) {
            endMonth = parseInt(dateMatch[3]);
            endYear = parseInt(dateMatch[4]);
          } else {
            // Present
            const now = new Date();
            endMonth = now.getMonth() + 1;
            endYear = now.getFullYear();
          }

          const months = (endYear - startYear) * 12 + (endMonth - startMonth);
          if (months > 0 && months < 360) { // sanity check: < 30 years
            totalMonths += months;
          }
        }

        // Try year-only format
        const yearMatch = dur.match(/(\d{4})\s*[-–—]\s*(?:(\d{4})|present|ongoing|current)/i);
        if (!dateMatch && yearMatch) {
          const startYear = parseInt(yearMatch[1]);
          const endYear = yearMatch[2] ? parseInt(yearMatch[2]) : new Date().getFullYear();
          const months = (endYear - startYear) * 12;
          if (months > 0 && months < 360) {
            totalMonths += months;
          }
        }
      });
    }

    const totalYears = Math.round(totalMonths / 12 * 10) / 10;

    let score = 0;
    let meets = false;
    let detail = '';

    if (totalYears >= reqYears.min) {
      score = 100;
      meets = true;
      detail = `Your ~${totalYears} year(s) of experience meets the ${reqYears.min}${reqYears.max > reqYears.min ? '-' + reqYears.max : '+'} year requirement.`;
    } else if (totalYears >= reqYears.min * 0.7) {
      score = 60;
      meets = false;
      detail = `Your ~${totalYears} year(s) is close to the ${reqYears.min}+ year requirement. Highlight relevant experience.`;
    } else {
      score = 30;
      meets = false;
      detail = `Your ~${totalYears} year(s) is below the ${reqYears.min}+ year requirement.`;
    }

    return { score, detail, meets, resumeYears: totalYears, requiredYears: reqYears };
  }

  function _matchEducation(resumeData, parsedJob) {
    const reqEducation = parsedJob.education || [];

    if (reqEducation.length === 0) {
      return { score: 80, detail: 'No specific education requirement detected.', meets: true };
    }

    const eduSection = _getResumeSectionByType(resumeData, ['education']);
    if (!eduSection || !eduSection.items || eduSection.items.length === 0) {
      return { score: 20, detail: 'Education section missing — cannot match education requirements.', meets: false };
    }

    const eduText = eduSection.items.map(item =>
      [item.title, item.subtitle, ...(item.highlights || [])].join(' ')
    ).join(' ').toLowerCase();

    // Check for degree level matches
    const levels = {
      phd: /\b(ph\.?d|doctorate|doctoral)\b/i,
      masters: /\b(master|m\.?s\.?|m\.?a\.?|m\.?tech|m\.?e\.?|mba|m\.?sc)\b/i,
      bachelors: /\b(bachelor|b\.?s\.?|b\.?a\.?|b\.?tech|b\.?e\.?|b\.?sc|undergraduate)\b/i
    };

    let resumeDegreeLevel = 0;
    if (levels.phd.test(eduText)) resumeDegreeLevel = 3;
    else if (levels.masters.test(eduText)) resumeDegreeLevel = 2;
    else if (levels.bachelors.test(eduText)) resumeDegreeLevel = 1;

    let reqDegreeLevel = 0;
    const reqText = reqEducation.join(' ');
    if (levels.phd.test(reqText)) reqDegreeLevel = 3;
    else if (levels.masters.test(reqText)) reqDegreeLevel = 2;
    else if (levels.bachelors.test(reqText)) reqDegreeLevel = 1;

    let score = 0;
    let meets = false;
    let detail = '';

    if (resumeDegreeLevel >= reqDegreeLevel) {
      score = 100;
      meets = true;
      detail = 'Education level meets or exceeds requirements.';
    } else if (resumeDegreeLevel > 0) {
      score = 50;
      detail = 'Education level is below the stated requirement, but relevant experience may compensate.';
    } else {
      score = 20;
      detail = 'Cannot determine education level from resume.';
    }

    return { score, detail, meets };
  }

  function _matchCertifications(resumeData, parsedJob) {
    const reqCerts = (parsedJob.certifications || []).map(c => c.toLowerCase());

    if (reqCerts.length === 0) {
      return { score: 80, matched: [], missing: [], total: 0, detail: 'No certifications required.' };
    }

    const resumeText = _getResumeText(resumeData);
    const matched = [];
    const missing = [];

    reqCerts.forEach(cert => {
      if (_fuzzyMatch(resumeText, cert)) {
        matched.push(cert);
      } else {
        missing.push(cert);
      }
    });

    const score = matched.length > 0 ? Math.round((matched.length / reqCerts.length) * 100) : 20;

    return {
      score,
      matched,
      missing,
      total: reqCerts.length,
      detail: matched.length > 0
        ? `${matched.length}/${reqCerts.length} required certifications found.`
        : 'None of the required certifications found in resume.'
    };
  }

  // ═══════════════════════════════════════════════════════════════════════════
  // MAIN MATCH FUNCTION
  // ═══════════════════════════════════════════════════════════════════════════

  function match(resumeData, parsedJob) {
    if (!resumeData || !parsedJob) {
      return _emptyMatchResult();
    }

    const skillResult = _matchSkills(resumeData, parsedJob);
    const keywordResult = _matchKeywords(resumeData, parsedJob);
    const expResult = _matchExperience(resumeData, parsedJob);
    const eduResult = _matchEducation(resumeData, parsedJob);
    const certResult = _matchCertifications(resumeData, parsedJob);

    // Calculate weighted composite match score
    const weightedScore = (
      skillResult.score * MATCH_WEIGHTS.skillMatch +
      keywordResult.score * MATCH_WEIGHTS.keywordMatch +
      expResult.score * MATCH_WEIGHTS.experienceMatch +
      eduResult.score * MATCH_WEIGHTS.educationMatch +
      certResult.score * MATCH_WEIGHTS.certificationMatch
    ) / TOTAL_MATCH_WEIGHT;

    const jobMatchPercent = Math.round(weightedScore);

    // Get ATS score
    const E = window.ATSEngine;
    const atsScore = E ? E.getScore(resumeData) : 0;

    // Overall recommendation
    let recommendation = '';
    let recommendationLevel = '';
    if (jobMatchPercent >= 80) {
      recommendation = 'Strong Match — Your resume aligns very well with this position. Apply with confidence!';
      recommendationLevel = 'strong';
    } else if (jobMatchPercent >= 60) {
      recommendation = 'Good Match — You meet most requirements. Address the gaps below to strengthen your application.';
      recommendationLevel = 'good';
    } else if (jobMatchPercent >= 40) {
      recommendation = 'Moderate Match — You meet some requirements but have notable gaps. Significant resume tailoring recommended.';
      recommendationLevel = 'moderate';
    } else {
      recommendation = 'Weak Match — This role may require skills or experience you haven\'t demonstrated. Consider addressing major gaps.';
      recommendationLevel = 'weak';
    }

    // Collect all missing items
    const missingSkills = skillResult.missing || [];
    const missingKeywords = keywordResult.missing.filter(kw =>
      !missingSkills.includes(kw) // avoid duplicating with skills
    ) || [];
    const missingTechnologies = (parsedJob.technologies || []).filter(tech => {
      const resumeText = _getResumeText(resumeData);
      return !_fuzzyMatch(resumeText, tech);
    });
    const missingCerts = certResult.missing || [];

    return {
      atsScore,
      jobMatchPercent,
      skillMatch: {
        percent: skillResult.score,
        matched: skillResult.matched,
        missing: skillResult.missing,
        total: skillResult.total
      },
      keywordMatch: {
        percent: keywordResult.score,
        matched: keywordResult.matched,
        missing: keywordResult.missing,
        total: keywordResult.total
      },
      experienceMatch: {
        percent: expResult.score,
        detail: expResult.detail,
        meets: expResult.meets,
        resumeYears: expResult.resumeYears,
        requiredYears: expResult.requiredYears
      },
      educationMatch: {
        percent: eduResult.score,
        detail: eduResult.detail,
        meets: eduResult.meets
      },
      certificationMatch: {
        percent: certResult.score,
        matched: certResult.matched,
        missing: certResult.missing,
        total: certResult.total,
        detail: certResult.detail
      },
      missingSkills,
      missingKeywords,
      missingTechnologies: [...new Set(missingTechnologies)],
      missingCertifications: missingCerts,
      recommendation,
      recommendationLevel,
      jobTitle: parsedJob.title || 'Unknown Position',
      company: parsedJob.company || '',
      seniority: parsedJob.seniority || 'unknown',
      timestamp: Date.now()
    };
  }

  // ═══════════════════════════════════════════════════════════════════════════
  // JOB-SPECIFIC OPTIMIZATION SUGGESTIONS
  // ═══════════════════════════════════════════════════════════════════════════

  // Helper to tailor professional summaries for a target job role
  function _tailorSummaryText(summaryText, jobTitle, skills) {
    if (!summaryText) return '';
    let tailored = summaryText.trim();
    const titles = ['software engineer', 'software developer', 'frontend developer', 'frontend engineer', 'backend developer', 'backend engineer', 'data scientist', 'product manager', 'full stack developer', 'full stack engineer'];
    
    let titleReplaced = false;
    if (jobTitle) {
      for (const t of titles) {
        const regex = new RegExp(`\\b${t}\\b`, 'i');
        if (regex.test(tailored)) {
          tailored = tailored.replace(regex, jobTitle);
          titleReplaced = true;
          break;
        }
      }
      if (!titleReplaced) {
        tailored = `${jobTitle} with experience in ` + tailored.charAt(0).toLowerCase() + tailored.slice(1);
      }
    }

    if (skills && skills.length > 0) {
      const skillsStr = skills.join(', ');
      tailored = tailored.replace(/[.!?]+$/, '') + `, bringing hands-on expertise in ${skillsStr}.`;
    }

    return tailored;
  }

  function getOptimizations(resumeData, parsedJob) {
    if (!resumeData || !parsedJob) return [];

    const matchResult = match(resumeData, parsedJob);
    const suggestions = [];
    const E = window.ATSEngine;

    // 1. Missing skills
    const topMissingSkills = (matchResult.missingSkills || []).slice(0, 8);
    if (topMissingSkills.length > 0) {
      suggestions.push({
        id: 'job-missing-skills',
        category: 'Missing Skills',
        priority: 'high',
        issue: `${topMissingSkills.length} required skill(s) missing from your resume`,
        impact: 'ATS keyword matching will fail for these skills, reducing your match score significantly.',
        fix: `Add these skills to your Skills section: ${topMissingSkills.join(', ')}`,
        section: 'skills',
        estimatedGain: Math.min(10, topMissingSkills.length * 2),
        type: 'keyword',
        skills: topMissingSkills,
        fixAction: {
          type: 'addSkillsBatch',
          skills: topMissingSkills
        }
      });
    }

    // 2. Missing keywords
    const topMissingKeywords = (matchResult.missingKeywords || []).slice(0, 8);
    if (topMissingKeywords.length > 3) {
      suggestions.push({
        id: 'job-missing-keywords',
        category: 'Missing Keywords',
        priority: 'medium',
        issue: `${topMissingKeywords.length} job-specific keywords not found in your resume`,
        impact: 'ATS ranks resumes by keyword density. Missing job-specific terms lowers your ranking.',
        fix: `Integrate these keywords into your bullet points: ${topMissingKeywords.join(', ')}`,
        section: null,
        estimatedGain: Math.min(8, topMissingKeywords.length),
        type: 'keyword'
      });
    }

    // 3. Missing technologies
    const missingTech = (matchResult.missingTechnologies || []).slice(0, 6);
    if (missingTech.length > 0) {
      suggestions.push({
        id: 'job-missing-tech',
        category: 'Missing Technologies',
        priority: 'high',
        issue: `${missingTech.length} technology/technologies from the job posting not in your resume`,
        impact: 'Technology keyword matches are weighted heavily in ATS scoring for technical roles.',
        fix: `If you have experience with: ${missingTech.join(', ')} — add them to your Skills section.`,
        section: 'skills',
        estimatedGain: Math.min(8, missingTech.length * 2),
        type: 'keyword',
        fixAction: {
          type: 'addSkillsBatch',
          skills: missingTech
        }
      });
    }

    // 4. Missing certifications
    const missingCerts = (matchResult.missingCertifications || []).slice(0, 4);
    if (missingCerts.length > 0) {
      suggestions.push({
        id: 'job-missing-certs',
        category: 'Missing Certifications',
        priority: 'low',
        issue: `${missingCerts.length} certification(s) mentioned in job posting not found on resume`,
        impact: 'Some ATS systems auto-filter by certifications. Having them improves your ranking.',
        fix: `Consider pursuing: ${missingCerts.join(', ')}. If you already have them, add them to your Certifications section.`,
        section: 'certifications',
        estimatedGain: Math.min(5, missingCerts.length * 2),
        type: 'content'
      });
    }

    // 5. Experience gap
    if (matchResult.experienceMatch && !matchResult.experienceMatch.meets && matchResult.experienceMatch.requiredYears) {
      suggestions.push({
        id: 'job-experience-gap',
        category: 'Experience Gap',
        priority: 'medium',
        issue: `Job requires ${matchResult.experienceMatch.requiredYears.min}+ years, your resume shows ~${matchResult.experienceMatch.resumeYears || 0} years`,
        impact: 'Experience requirements are often strict filters in ATS. Some employers accept "equivalent experience".',
        fix: 'Highlight all relevant experience including internships, freelance work, and significant personal projects. Emphasize impact and depth over duration.',
        section: null,
        estimatedGain: 3,
        type: 'content'
      });
    }

    // 6. Bullet point optimization for keywords
    if (E) {
      const highlights = E.getAllHighlights(resumeData);
      const allMissing = [...topMissingSkills, ...topMissingKeywords];

      if (highlights.length > 0 && allMissing.length > 0) {
        const weakBullets = highlights.filter(h => {
          const hasMetrics = E.countNumbers(h) > 0;
          const firstWord = E.getFirstWord(h);
          const hasActionVerb = firstWord && E.ACTION_VERBS.has(firstWord);
          return !hasMetrics || !hasActionVerb;
        });

        if (weakBullets.length > 2) {
          suggestions.push({
            id: 'job-strengthen-bullets',
            category: 'Bullet Point Optimization',
            priority: 'medium',
            issue: `${weakBullets.length} bullet points could be strengthened with job-relevant keywords`,
            impact: 'Integrating job keywords into existing bullets provides natural keyword context that ATS values more than standalone skill lists.',
            fix: `Rewrite weak bullets to include terms like "${allMissing.slice(0, 3).join('", "')}" naturally within your accomplishments.`,
            section: null,
            estimatedGain: 4,
            type: 'content'
          });
        }
      }
    }

    // 7. Professional summary tailoring
    const summarySec = (resumeData.sections || []).find(s => {
      const lower = (s.name || '').toLowerCase();
      return ['summary', 'objective', 'about', 'profile'].some(p => lower.includes(p));
    });

    if (!summarySec) {
      suggestions.push({
        id: 'job-add-summary',
        category: 'Professional Summary',
        priority: 'high',
        issue: 'No professional summary to tailor for this specific role',
        impact: 'A targeted summary mentioning the job title and key requirements dramatically improves ATS matching.',
        fix: `Add a Professional Summary that mentions "${parsedJob.title || 'the target role'}" and includes top keywords from the job description.`,
        section: null,
        estimatedGain: 5,
        type: 'structure'
      });
    } else {
      let currentSummary = '';
      if (summarySec.type === 'list' && summarySec.items && summarySec.items[0]) {
        currentSummary = summarySec.items[0].description || summarySec.items[0].title || '';
      }
      
      if (currentSummary && currentSummary.length > 20) {
        const tailored = _tailorSummaryText(currentSummary, parsedJob.title, topMissingSkills.slice(0, 3));
        if (tailored && tailored !== currentSummary) {
          suggestions.push({
            id: 'job-tailor-summary',
            category: 'Professional Summary',
            priority: 'medium',
            issue: 'Summary may not be tailored for this specific position',
            impact: 'A tailored summary that mirrors the job description language scores significantly higher.',
            fix: `Auto-apply summary rewrite to reference "${parsedJob.title || 'this role'}" and include key terms.`,
            section: summarySec.id,
            estimatedGain: 3,
            type: 'content',
            fixAction: {
              type: 'replaceSummaryText',
              sectionId: summarySec.id,
              newValue: tailored
            }
          });
        }
      }
    }

    // Sort by priority and gain
    const priorityOrder = { high: 0, medium: 1, low: 2 };
    suggestions.sort((a, b) => {
      const pDiff = (priorityOrder[a.priority] || 2) - (priorityOrder[b.priority] || 2);
      if (pDiff !== 0) return pDiff;
      return (b.estimatedGain || 0) - (a.estimatedGain || 0);
    });

    return suggestions;
  }

  function _emptyMatchResult() {
    return {
      atsScore: 0,
      jobMatchPercent: 0,
      skillMatch: { percent: 0, matched: [], missing: [], total: 0 },
      keywordMatch: { percent: 0, matched: [], missing: [], total: 0 },
      experienceMatch: { percent: 0, detail: '', meets: false },
      educationMatch: { percent: 0, detail: '', meets: false },
      certificationMatch: { percent: 0, matched: [], missing: [], total: 0, detail: '' },
      missingSkills: [],
      missingKeywords: [],
      missingTechnologies: [],
      missingCertifications: [],
      recommendation: '',
      recommendationLevel: '',
      jobTitle: '',
      company: '',
      seniority: 'unknown',
      timestamp: Date.now()
    };
  }

  // ═══════════════════════════════════════════════════════════════════════════
  // PUBLIC API
  // ═══════════════════════════════════════════════════════════════════════════

  window.ATSJobMatcher = {
    match,
    getOptimizations
  };

})();
