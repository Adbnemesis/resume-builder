/**
 * ============================================================================
 * ATS SCORING ENGINE — ats-engine.js
 * ============================================================================
 * Production-ready ATS scoring engine inspired by modern Applicant Tracking
 * Systems. Evaluates resumes across 16 weighted categories with intentionally
 * strict scoring. Fully modular, configurable, and cacheable.
 *
 * Public API (exposed on window.ATSEngine):
 *   - analyze(resumeData)       → full analysis result object
 *   - getScore(resumeData)      → numeric score 0-100
 *   - getBreakdown(resumeData)  → category breakdown array
 *   - updateWidget()            → update the toolbar ATS widget
 *   - invalidateCache()         → force recalculation on next call
 *
 * Architecture:
 *   Each category scorer is a pure function: (resumeData) → CategoryResult
 *   Results are aggregated with configurable weights into a final score.
 *   A content hash is used to cache results and skip redundant computation.
 * ============================================================================
 */

(function () {
  'use strict';

  // ═══════════════════════════════════════════════════════════════════════════
  // CONFIGURATION — Weights for each scoring category (tunable)
  // ═══════════════════════════════════════════════════════════════════════════

  const CATEGORY_WEIGHTS = {
    resumeStructure:       8,
    atsFormatting:         6,
    contactInformation:    8,
    sectionCompleteness:   7,
    professionalSummary:   5,
    skills:                8,
    experience:           12,
    projects:              7,
    education:             6,
    certifications:        4,
    actionVerbs:           8,
    quantifiableAchievements: 10,
    keywordQuality:        6,
    grammarConsistency:    5,
    readability:           4,
    overallATSCompatibility: 6
  };

  const TOTAL_WEIGHT = Object.values(CATEGORY_WEIGHTS).reduce((a, b) => a + b, 0);

  // ═══════════════════════════════════════════════════════════════════════════
  // KNOWLEDGE BASES — Reference data for scoring
  // ═══════════════════════════════════════════════════════════════════════════

  const ACTION_VERBS = new Set([
    // Leadership & Management
    'led', 'managed', 'directed', 'supervised', 'coordinated', 'orchestrated',
    'oversaw', 'headed', 'spearheaded', 'championed', 'mentored', 'coached',
    'guided', 'delegated', 'administered', 'facilitated', 'organized',
    // Achievement & Results
    'achieved', 'accomplished', 'attained', 'delivered', 'exceeded', 'earned',
    'surpassed', 'outperformed', 'generated', 'produced', 'completed',
    // Creation & Development
    'developed', 'created', 'designed', 'built', 'engineered', 'architected',
    'established', 'founded', 'formulated', 'initiated', 'launched', 'pioneered',
    'introduced', 'invented', 'constructed', 'assembled', 'crafted', 'devised',
    // Improvement & Optimization
    'improved', 'enhanced', 'optimized', 'streamlined', 'accelerated', 'boosted',
    'elevated', 'maximized', 'minimized', 'refined', 'revamped', 'transformed',
    'modernized', 'upgraded', 'strengthened', 'advanced', 'consolidated',
    // Analysis & Research
    'analyzed', 'assessed', 'evaluated', 'examined', 'investigated', 'researched',
    'identified', 'diagnosed', 'discovered', 'mapped', 'measured', 'quantified',
    'surveyed', 'tested', 'validated', 'verified', 'audited', 'benchmarked',
    // Technical & Engineering
    'implemented', 'deployed', 'configured', 'integrated', 'migrated', 'automated',
    'programmed', 'coded', 'debugged', 'refactored', 'compiled', 'maintained',
    'provisioned', 'containerized', 'dockerized', 'virtualized', 'scaled',
    'monitored', 'instrumented', 'profiled', 'tuned',
    // Communication & Collaboration
    'communicated', 'presented', 'published', 'authored', 'documented',
    'collaborated', 'partnered', 'negotiated', 'advocated', 'influenced',
    'persuaded', 'reported', 'briefed', 'articulated', 'conveyed',
    // Problem Solving
    'resolved', 'solved', 'troubleshot', 'addressed', 'mitigated', 'eliminated',
    'prevented', 'rectified', 'remedied', 'overcame',
    // Financial & Business
    'reduced', 'increased', 'saved', 'grew', 'expanded', 'drove', 'captured',
    'secured', 'acquired', 'retained', 'budgeted', 'forecasted', 'projected',
    // Process & Strategy
    'planned', 'strategized', 'executed', 'standardized', 'systematized',
    'restructured', 'centralized', 'decentralized', 'prioritized', 'scheduled',
    'allocated', 'distributed', 'defined', 'outlined', 'proposed',
    // Training & Development
    'trained', 'educated', 'instructed', 'taught', 'tutored', 'onboarded',
    'empowered', 'enabled', 'supported', 'advised', 'counseled',
    // Data & Analytics
    'extracted', 'aggregated', 'correlated', 'modeled', 'predicted',
    'visualized', 'segmented', 'classified', 'clustered', 'transformed',
    // Additional strong verbs
    'leveraged', 'utilized', 'harnessed', 'applied', 'adopted', 'embraced',
    'customized', 'tailored', 'personalized', 'adapted', 'converted',
    'transitioned', 'synthesized', 'curated', 'orchestrated', 'navigated',
    'contributed', 'participated', 'volunteered', 'represented'
  ]);

  const WEAK_VERBS = new Set([
    'did', 'made', 'was', 'had', 'got', 'went', 'helped', 'worked',
    'used', 'tried', 'put', 'took', 'gave', 'came', 'thought', 'told',
    'said', 'knew', 'looked', 'wanted', 'needed', 'started', 'began',
    'am', 'is', 'are', 'were', 'been', 'being', 'have', 'has',
    'do', 'does', 'doing', 'done', 'responsible', 'tasked', 'assigned'
  ]);

  const TECH_KEYWORDS = new Set([
    // Programming Languages
    'javascript', 'typescript', 'python', 'java', 'c++', 'c#', 'go', 'golang',
    'rust', 'ruby', 'php', 'swift', 'kotlin', 'scala', 'r', 'matlab',
    'perl', 'haskell', 'elixir', 'clojure', 'dart', 'lua', 'objective-c',
    'assembly', 'fortran', 'cobol', 'vba', 'groovy', 'julia',
    // Web Technologies
    'html', 'css', 'sass', 'less', 'tailwind', 'bootstrap', 'jquery',
    'react', 'angular', 'vue', 'svelte', 'next.js', 'nextjs', 'nuxt',
    'gatsby', 'remix', 'astro', 'webpack', 'vite', 'rollup', 'babel',
    'eslint', 'prettier', 'pwa', 'webgl', 'three.js', 'websocket',
    'graphql', 'rest', 'restful', 'api', 'oauth', 'jwt', 'cors',
    // Backend Frameworks
    'node.js', 'nodejs', 'express', 'fastify', 'nestjs', 'django', 'flask',
    'fastapi', 'spring', 'springboot', 'rails', 'laravel', 'asp.net',
    '.net', 'gin', 'fiber', 'actix', 'rocket',
    // Databases
    'sql', 'mysql', 'postgresql', 'postgres', 'mongodb', 'redis', 'elasticsearch',
    'cassandra', 'dynamodb', 'sqlite', 'oracle', 'couchdb', 'neo4j',
    'firebase', 'firestore', 'supabase', 'cockroachdb', 'mariadb',
    'memcached', 'influxdb', 'timescaledb',
    // Cloud & DevOps
    'aws', 'azure', 'gcp', 'google cloud', 'heroku', 'vercel', 'netlify',
    'digitalocean', 'docker', 'kubernetes', 'k8s', 'terraform', 'ansible',
    'jenkins', 'github actions', 'gitlab ci', 'circleci', 'travis',
    'ci/cd', 'nginx', 'apache', 'cloudflare', 'cdn',
    // Data & ML
    'machine learning', 'deep learning', 'neural network', 'tensorflow',
    'pytorch', 'keras', 'scikit-learn', 'pandas', 'numpy', 'scipy',
    'matplotlib', 'jupyter', 'spark', 'hadoop', 'airflow', 'kafka',
    'rabbitmq', 'etl', 'data pipeline', 'nlp', 'computer vision',
    'reinforcement learning', 'llm', 'gpt', 'bert', 'transformer',
    'huggingface', 'langchain', 'openai', 'anthropic',
    // Mobile
    'react native', 'flutter', 'ios', 'android', 'xamarin', 'ionic',
    'cordova', 'swiftui', 'jetpack compose', 'expo',
    // Tools & Practices
    'git', 'github', 'gitlab', 'bitbucket', 'jira', 'confluence',
    'agile', 'scrum', 'kanban', 'tdd', 'bdd', 'unit testing',
    'integration testing', 'e2e', 'cypress', 'selenium', 'playwright',
    'jest', 'mocha', 'pytest', 'junit', 'postman', 'swagger',
    'figma', 'sketch', 'adobe xd', 'storybook',
    // Architecture & Concepts
    'microservices', 'monolith', 'serverless', 'event-driven',
    'message queue', 'pub/sub', 'caching', 'load balancing',
    'reverse proxy', 'api gateway', 'service mesh', 'distributed systems',
    'high availability', 'fault tolerance', 'scalability', 'performance',
    'security', 'encryption', 'ssl', 'tls', 'oauth2', 'saml',
    'sso', 'rbac', 'iam', 'vpc', 'dns', 'tcp/ip', 'http',
    // Data Science & Analytics
    'tableau', 'power bi', 'looker', 'metabase', 'grafana', 'prometheus',
    'datadog', 'splunk', 'new relic', 'kibana', 'logstash',
    'bigquery', 'redshift', 'snowflake', 'databricks', 'dbt',
    // Blockchain & Emerging
    'blockchain', 'solidity', 'ethereum', 'web3', 'smart contract',
    'defi', 'nft', 'ipfs',
    // OS & Systems
    'linux', 'unix', 'windows', 'macos', 'bash', 'shell',
    'powershell', 'vim', 'systemd', 'cron'
  ]);

  const CORE_SECTIONS = ['education', 'skills', 'experience', 'projects'];
  const VALUABLE_SECTIONS = ['certifications', 'summary', 'extracurricular', 'awards', 'achievements'];
  const SUMMARY_SECTION_IDS = ['summary', 'objective', 'about', 'professional_summary', 'about_me', 'profile'];

  // ═══════════════════════════════════════════════════════════════════════════
  // UTILITY HELPERS
  // ═══════════════════════════════════════════════════════════════════════════

  function getAllHighlights(resumeData) {
    const highlights = [];
    (resumeData.sections || []).forEach(sec => {
      if (sec.type === 'list' && sec.items) {
        sec.items.forEach(item => {
          (item.highlights || []).forEach(h => {
            if (h && h.trim()) highlights.push(h.trim());
          });
        });
      }
    });
    return highlights;
  }

  function getAllTags(resumeData) {
    const tags = [];
    (resumeData.sections || []).forEach(sec => {
      if (sec.type === 'tags' && sec.categories) {
        sec.categories.forEach(cat => {
          (cat.tags || []).forEach(t => {
            if (t && t.trim()) tags.push(t.trim());
          });
        });
      }
    });
    return tags;
  }

  function getSectionById(resumeData, id) {
    return (resumeData.sections || []).find(s => s.id === id);
  }

  function getSectionByNamePattern(resumeData, patterns) {
    return (resumeData.sections || []).find(s => {
      const name = (s.name || '').toLowerCase().replace(/[^a-z]/g, '');
      return patterns.some(p => name.includes(p.replace(/[^a-z]/g, '')));
    });
  }

  function getFirstWord(text) {
    if (!text) return '';
    // Strip markdown formatting
    const clean = text.replace(/\*\*/g, '').replace(/\*/g, '').replace(/__/g, '').replace(/_/g, '').replace(/~/g, '');
    const match = clean.match(/^[\s•\-–—]*([a-zA-Z]+)/);
    return match ? match[1].toLowerCase() : '';
  }

  function countNumbers(text) {
    if (!text) return 0;
    const matches = text.match(/\d+[\d,.]*[%xX]?/g);
    return matches ? matches.length : 0;
  }

  function isPlaceholder(text) {
    if (!text) return true;
    const lower = text.toLowerCase().trim();
    const placeholderPatterns = [
      'your ', 'enter ', 'type ', 'add ', 'placeholder', 'example',
      'e.g.', 'eg.', 'e.g ', 'lorem', 'ipsum', 'todo', 'tbd',
      'xxx', 'abc', '123', 'test', 'sample', 'dummy', 'default',
      'new item', 'new bullet', 'city, state', 'your name',
      'your.email', 'your university', 'your company', 'your project',
      'your school', '+91 0000', '0000000', 'yourprofile',
      'username'
    ];
    return placeholderPatterns.some(p => lower.includes(p));
  }

  function isRealContent(text) {
    return text && text.trim().length > 2 && !isPlaceholder(text);
  }

  function hashData(data) {
    const str = JSON.stringify(data);
    let hash = 0;
    for (let i = 0; i < str.length; i++) {
      const chr = str.charCodeAt(i);
      hash = ((hash << 5) - hash) + chr;
      hash |= 0;
    }
    return hash;
  }

  // ═══════════════════════════════════════════════════════════════════════════
  // CATEGORY SCORERS — Each returns { score: 0-100, findings[], deductions[] }
  // ═══════════════════════════════════════════════════════════════════════════

  function scoreResumeStructure(data) {
    const findings = [];
    const deductions = [];
    let score = 100;

    const sections = data.sections || [];
    const sectionCount = sections.length;

    // Check minimum sections (need at least 3 meaningful sections)
    if (sectionCount < 3) {
      score -= 35;
      deductions.push(`Only ${sectionCount} section(s) found. ATS expects at least 4-5 well-defined sections.`);
    } else if (sectionCount < 4) {
      score -= 15;
      deductions.push(`Only ${sectionCount} sections. Consider adding more sections for completeness.`);
    } else {
      findings.push(`Good structure with ${sectionCount} sections.`);
    }

    // Check for standard section names
    const sectionNames = sections.map(s => (s.name || '').toLowerCase());
    const hasEducation = sectionNames.some(n => n.includes('education'));
    const hasExperience = sectionNames.some(n => n.includes('experience') || n.includes('work'));
    const hasSkills = sectionNames.some(n => n.includes('skill'));
    const hasProjects = sectionNames.some(n => n.includes('project'));

    if (!hasEducation) { score -= 15; deductions.push('Missing "Education" section — critical for ATS.'); }
    else { findings.push('Education section present.'); }

    if (!hasExperience) { score -= 15; deductions.push('Missing "Experience" section — most important for ATS.'); }
    else { findings.push('Experience section present.'); }

    if (!hasSkills) { score -= 15; deductions.push('Missing "Skills" section — essential for keyword matching.'); }
    else { findings.push('Skills section present.'); }

    if (!hasProjects && !hasExperience) {
      score -= 10;
      deductions.push('Neither Projects nor Experience section found.');
    }

    // Check for empty sections
    const emptySections = sections.filter(s => {
      if (s.type === 'tags') return !(s.categories || []).some(c => c.tags && c.tags.length > 0);
      if (s.type === 'list') return !(s.items || []).some(item => isRealContent(item.title));
      return true;
    });

    if (emptySections.length > 0) {
      score -= emptySections.length * 5;
      deductions.push(`${emptySections.length} empty section(s): ${emptySections.map(s => s.name).join(', ')}`);
    }

    return { score: Math.max(0, score), findings, deductions };
  }

  function scoreATSFormatting(data) {
    const findings = [];
    const deductions = [];
    let score = 100;

    const allText = getAllHighlights(data).join(' ') + ' ' + getAllTags(data).join(' ');

    // Check for special characters that confuse ATS
    const specialChars = allText.match(/[★☆●◆◇■□▪▫→←↑↓✓✗✔✘☑☐⚡🔥💡🎯🏆📊📈]/g);
    if (specialChars && specialChars.length > 0) {
      score -= Math.min(25, specialChars.length * 5);
      deductions.push(`Found ${specialChars.length} special character(s)/emoji that may confuse ATS parsers.`);
    } else {
      findings.push('No problematic special characters detected.');
    }

    // Check for standard section naming
    const sectionNames = (data.sections || []).map(s => s.name || '');
    const nonStandard = sectionNames.filter(name => {
      const lower = name.toLowerCase();
      const standard = ['education', 'experience', 'skills', 'projects', 'certifications',
        'awards', 'summary', 'objective', 'extracurricular', 'achievements',
        'publications', 'interests', 'languages', 'volunteering', 'activities',
        'work experience', 'professional experience', 'technical skills',
        'professional summary', 'about me', 'about', 'profile',
        'courses', 'coursework', 'training'];
      return !standard.some(s => lower.includes(s));
    });

    if (nonStandard.length > 2) {
      score -= 10;
      deductions.push(`${nonStandard.length} non-standard section name(s). ATS may not recognize: ${nonStandard.join(', ')}`);
    } else if (nonStandard.length > 0) {
      score -= 5;
      deductions.push(`Non-standard section name(s): ${nonStandard.join(', ')}. Most ATS systems can still parse these.`);
    } else {
      findings.push('All section names follow ATS-standard conventions.');
    }

    // Check date format consistency
    const highlights = getAllHighlights(data);
    const allItems = [];
    (data.sections || []).forEach(sec => {
      if (sec.type === 'list' && sec.items) {
        sec.items.forEach(item => allItems.push(item));
      }
    });

    const dates = allItems.map(item => item.duration).filter(d => d && d.trim());
    if (dates.length > 0) {
      findings.push('Date information present in entries.');
    }

    // Check for tables/columns (indicated by excessive tab characters)
    if (allText.includes('\t')) {
      score -= 5;
      deductions.push('Tab characters detected — some ATS parsers misread tabular layouts.');
    }

    return { score: Math.max(0, score), findings, deductions };
  }

  function scoreContactInformation(data) {
    const findings = [];
    const deductions = [];
    let score = 100;

    const p = data.personal || {};

    // Name
    if (!isRealContent(p.name)) {
      score -= 30;
      deductions.push('Full name is missing or uses placeholder text.');
    } else {
      const nameParts = p.name.trim().split(/\s+/);
      if (nameParts.length < 2) {
        score -= 10;
        deductions.push('Name appears to be incomplete (first + last name expected).');
      } else {
        findings.push('Full name present.');
      }
    }

    // Email
    if (!p.email || !p.email.includes('@') || isPlaceholder(p.email)) {
      score -= 25;
      deductions.push('Professional email address is missing.');
    } else {
      findings.push('Email address present.');
      // Check for professional email
      const emailDomain = p.email.split('@')[1] || '';
      if (['hotmail.com', 'yahoo.com', 'aol.com'].includes(emailDomain.toLowerCase())) {
        score -= 5;
        deductions.push('Consider using a more professional email domain (Gmail or custom domain).');
      }
    }

    // Phone
    if (!isRealContent(p.phone)) {
      score -= 20;
      deductions.push('Phone number is missing.');
    } else {
      findings.push('Phone number present.');
    }

    // Location
    if (!isRealContent(p.location)) {
      score -= 10;
      deductions.push('Location/city not specified.');
    } else {
      findings.push('Location specified.');
    }

    // LinkedIn
    if (!p.linkedin || !isRealContent(p.linkedin.username)) {
      score -= 10;
      deductions.push('LinkedIn profile link is missing — strongly recommended for professional presence.');
    } else {
      findings.push('LinkedIn profile linked.');
    }

    // GitHub (less critical but valuable for tech)
    if (!p.github || !isRealContent(p.github.username)) {
      score -= 5;
      deductions.push('GitHub profile not linked (valuable for tech roles).');
    } else {
      findings.push('GitHub profile linked.');
    }

    return { score: Math.max(0, score), findings, deductions };
  }

  function scoreSectionCompleteness(data) {
    const findings = [];
    const deductions = [];
    let score = 100;

    const sections = data.sections || [];

    // Check each core section has substantial content
    CORE_SECTIONS.forEach(coreId => {
      const sec = sections.find(s => {
        const sid = s.id.toLowerCase();
        const sname = (s.name || '').toLowerCase();
        return sid.includes(coreId) || sname.includes(coreId);
      });

      if (!sec) {
        score -= 15;
        deductions.push(`Core section "${coreId}" is missing entirely.`);
        return;
      }

      if (sec.type === 'list') {
        const realItems = (sec.items || []).filter(item => isRealContent(item.title));
        if (realItems.length === 0) {
          score -= 15;
          deductions.push(`"${sec.name}" section exists but has no real content.`);
        } else if (realItems.length === 1 && coreId === 'experience') {
          score -= 5;
          deductions.push(`Only 1 experience entry. Multiple experiences strengthen your resume.`);
        } else {
          findings.push(`"${sec.name}" has ${realItems.length} item(s).`);
        }
      } else if (sec.type === 'tags') {
        const totalTags = (sec.categories || []).reduce((acc, cat) => acc + (cat.tags || []).length, 0);
        if (totalTags === 0) {
          score -= 15;
          deductions.push(`"${sec.name}" section has no skills/tags listed.`);
        } else if (totalTags < 5) {
          score -= 5;
          deductions.push(`"${sec.name}" has only ${totalTags} skill(s). Aim for 8-15+.`);
        } else {
          findings.push(`"${sec.name}" has ${totalTags} skill(s).`);
        }
      }
    });

    // Bonus for having valuable extra sections
    const hasValuable = sections.some(s => {
      const sid = s.id.toLowerCase();
      const sname = (s.name || '').toLowerCase();
      return VALUABLE_SECTIONS.some(v => sid.includes(v) || sname.includes(v));
    });

    if (hasValuable) {
      findings.push('Additional sections (certifications/awards) add depth.');
    }

    return { score: Math.max(0, score), findings, deductions };
  }

  function scoreProfessionalSummary(data) {
    const findings = [];
    const deductions = [];
    let score = 100;

    // Check for summary/objective section
    const summarySection = (data.sections || []).find(s => {
      const sid = s.id.toLowerCase();
      const sname = (s.name || '').toLowerCase();
      return SUMMARY_SECTION_IDS.some(p => sid.includes(p) || sname.includes(p));
    });

    if (!summarySection) {
      score -= 40;
      deductions.push('No Professional Summary/Objective section found. This is the first thing recruiters and ATS scan.');
      deductions.push('Add a 2-3 sentence summary highlighting your experience level, key skills, and career goals.');
      return { score: Math.max(0, score), findings, deductions };
    }

    findings.push('Professional Summary section exists.');

    // Check content quality
    let summaryText = '';
    if (summarySection.type === 'list' && summarySection.items) {
      summaryText = summarySection.items.map(item =>
        [item.title, item.subtitle, ...(item.highlights || [])].filter(Boolean).join(' ')
      ).join(' ');
    }

    if (!summaryText || summaryText.trim().length < 20) {
      score -= 30;
      deductions.push('Summary is too short. Aim for 2-3 impactful sentences (50-150 words).');
    } else if (summaryText.trim().length < 50) {
      score -= 15;
      deductions.push('Summary could be more detailed. Aim for 50-150 words.');
    } else if (summaryText.trim().length > 300) {
      score -= 10;
      deductions.push('Summary is too long. Keep it concise (50-150 words).');
    } else {
      findings.push('Summary length is appropriate.');
    }

    // Check for keywords in summary
    const lowerSummary = summaryText.toLowerCase();
    const hasTechKeywords = [...TECH_KEYWORDS].some(kw => lowerSummary.includes(kw));
    if (hasTechKeywords) {
      findings.push('Summary contains technical keywords.');
    } else {
      score -= 10;
      deductions.push('Summary lacks technical keywords. Include your key technologies and skills.');
    }

    return { score: Math.max(0, score), findings, deductions };
  }

  function scoreSkills(data) {
    const findings = [];
    const deductions = [];
    let score = 100;

    const tags = getAllTags(data);

    if (tags.length === 0) {
      score -= 60;
      deductions.push('No skills listed. This is critical — ATS heavily relies on skill keyword matching.');
      return { score: Math.max(0, score), findings, deductions };
    }

    // Skill count
    if (tags.length < 5) {
      score -= 30;
      deductions.push(`Only ${tags.length} skill(s) listed. Most competitive resumes have 10-20+ skills.`);
    } else if (tags.length < 8) {
      score -= 15;
      deductions.push(`${tags.length} skills listed. Consider adding more (aim for 10-20).`);
    } else if (tags.length < 12) {
      score -= 5;
      deductions.push(`${tags.length} skills is decent. Top resumes typically list 12-20+.`);
    } else {
      findings.push(`Excellent: ${tags.length} skills listed.`);
    }

    // Check for categorization
    const skillsSections = (data.sections || []).filter(s => s.type === 'tags');
    if (skillsSections.length > 0) {
      const totalCats = skillsSections.reduce((acc, s) => acc + (s.categories || []).length, 0);
      if (totalCats < 2) {
        score -= 10;
        deductions.push('Skills are in a single category. Categorize into groups (Languages, Frameworks, Tools, etc.).');
      } else {
        findings.push(`Skills organized into ${totalCats} categories — good for readability.`);
      }
    }

    // Check for tech keyword coverage
    const lowerTags = tags.map(t => t.toLowerCase());
    const techMatches = lowerTags.filter(t => TECH_KEYWORDS.has(t));
    const techRatio = techMatches.length / tags.length;

    if (techRatio < 0.3 && tags.length > 3) {
      score -= 10;
      deductions.push('Low proportion of recognized technical skills. Ensure skills match industry terminology.');
    } else if (techMatches.length > 5) {
      findings.push(`${techMatches.length} recognized technical skills found.`);
    }

    // Check for placeholder skills
    const placeholderSkills = tags.filter(t => isPlaceholder(t));
    if (placeholderSkills.length > 0) {
      score -= placeholderSkills.length * 5;
      deductions.push(`${placeholderSkills.length} placeholder/generic skill(s) detected.`);
    }

    return { score: Math.max(0, score), findings, deductions };
  }

  function scoreExperience(data) {
    const findings = [];
    const deductions = [];
    let score = 100;

    const expSection = (data.sections || []).find(s => {
      const lower = (s.name || '').toLowerCase();
      return lower.includes('experience') || lower.includes('work');
    });

    if (!expSection || expSection.type !== 'list') {
      score -= 50;
      deductions.push('No Experience section found. This is the most important section for ATS scoring.');
      return { score: Math.max(0, score), findings, deductions };
    }

    const items = (expSection.items || []).filter(item => isRealContent(item.title));

    if (items.length === 0) {
      score -= 50;
      deductions.push('Experience section exists but has no real entries.');
      return { score: Math.max(0, score), findings, deductions };
    }

    findings.push(`${items.length} experience entr${items.length === 1 ? 'y' : 'ies'} found.`);

    // Check each experience item
    items.forEach((item, idx) => {
      const prefix = `Experience #${idx + 1}`;

      // Title (company)
      if (!isRealContent(item.title)) {
        score -= 8;
        deductions.push(`${prefix}: Company/organization name is missing.`);
      }

      // Subtitle (role)
      if (!isRealContent(item.subtitle)) {
        score -= 8;
        deductions.push(`${prefix}: Job title/role is missing. ATS needs this for role matching.`);
      }

      // Duration
      if (!isRealContent(item.duration)) {
        score -= 5;
        deductions.push(`${prefix}: Duration/dates missing. ATS uses dates to calculate experience level.`);
      }

      // Highlights/bullet points
      const highlights = (item.highlights || []).filter(h => isRealContent(h));
      if (highlights.length === 0) {
        score -= 10;
        deductions.push(`${prefix}: No bullet points. Add 3-5 bullet points describing achievements.`);
      } else if (highlights.length < 2) {
        score -= 5;
        deductions.push(`${prefix}: Only ${highlights.length} bullet point. Aim for 3-5 per role.`);
      } else if (highlights.length >= 3) {
        findings.push(`${prefix}: ${highlights.length} bullet points — well detailed.`);
      }
    });

    return { score: Math.max(0, Math.min(100, score)), findings, deductions };
  }

  function scoreProjects(data) {
    const findings = [];
    const deductions = [];
    let score = 100;

    const projSection = (data.sections || []).find(s => {
      const lower = (s.name || '').toLowerCase();
      return lower.includes('project');
    });

    if (!projSection || projSection.type !== 'list') {
      score -= 30;
      deductions.push('No Projects section found. Projects demonstrate practical skills.');
      return { score: Math.max(0, score), findings, deductions };
    }

    const items = (projSection.items || []).filter(item => isRealContent(item.title));

    if (items.length === 0) {
      score -= 30;
      deductions.push('Projects section exists but has no entries.');
      return { score: Math.max(0, score), findings, deductions };
    }

    findings.push(`${items.length} project(s) listed.`);

    if (items.length < 2) {
      score -= 10;
      deductions.push('Only 1 project listed. Aim for 2-4 projects to showcase diverse skills.');
    }

    // Check project quality
    items.forEach((item, idx) => {
      const prefix = `Project #${idx + 1}`;
      const highlights = (item.highlights || []).filter(h => isRealContent(h));

      if (highlights.length === 0) {
        score -= 10;
        deductions.push(`${prefix} ("${item.title}"): No description. Add 2-3 bullet points with tech stack and impact.`);
      }

      // Check for tech mentions in project
      const allText = [item.title, item.subtitle, ...(item.highlights || [])].join(' ').toLowerCase();
      const hasTech = [...TECH_KEYWORDS].some(kw => allText.includes(kw));
      if (!hasTech && highlights.length > 0) {
        score -= 5;
        deductions.push(`${prefix}: No technologies mentioned. Include the tech stack used.`);
      }
    });

    return { score: Math.max(0, score), findings, deductions };
  }

  function scoreEducation(data) {
    const findings = [];
    const deductions = [];
    let score = 100;

    const eduSection = (data.sections || []).find(s => {
      const lower = (s.name || '').toLowerCase();
      return lower.includes('education');
    });

    if (!eduSection || eduSection.type !== 'list') {
      score -= 40;
      deductions.push('No Education section found.');
      return { score: Math.max(0, score), findings, deductions };
    }

    const items = (eduSection.items || []).filter(item => isRealContent(item.title));

    if (items.length === 0) {
      score -= 40;
      deductions.push('Education section exists but has no entries.');
      return { score: Math.max(0, score), findings, deductions };
    }

    findings.push(`${items.length} education entr${items.length === 1 ? 'y' : 'ies'}.`);

    // Check first (most recent) education
    const primary = items[0];
    if (!isRealContent(primary.subtitle)) {
      score -= 15;
      deductions.push('Primary education entry is missing degree/program details.');
    } else {
      findings.push('Degree information provided.');
    }

    if (!isRealContent(primary.duration)) {
      score -= 10;
      deductions.push('Education dates are missing.');
    }

    // Check for GPA/percentage mention
    const allEduText = items.map(i => [i.title, i.subtitle, ...(i.highlights || [])].join(' ')).join(' ');
    if (/\b(gpa|cgpa|percentage|%|grade)\b/i.test(allEduText)) {
      findings.push('GPA/grade information included.');
    }

    return { score: Math.max(0, score), findings, deductions };
  }

  function scoreCertifications(data) {
    const findings = [];
    const deductions = [];
    let score = 100;

    const certSection = (data.sections || []).find(s => {
      const lower = (s.name || '').toLowerCase();
      return lower.includes('certif') || lower.includes('license');
    });

    if (!certSection) {
      score -= 25;
      deductions.push('No Certifications section. Industry certifications can significantly boost ATS scores.');
      return { score: Math.max(0, score), findings, deductions };
    }

    let certCount = 0;
    if (certSection.type === 'list') {
      certCount = (certSection.items || []).filter(item => isRealContent(item.title)).length;
    } else if (certSection.type === 'tags') {
      certCount = (certSection.categories || []).reduce((acc, cat) => acc + (cat.tags || []).filter(t => isRealContent(t)).length, 0);
    }

    if (certCount === 0) {
      score -= 25;
      deductions.push('Certifications section exists but is empty.');
    } else {
      findings.push(`${certCount} certification(s) listed.`);
      if (certCount >= 3) {
        findings.push('Strong certification portfolio.');
      }
    }

    return { score: Math.max(0, score), findings, deductions };
  }

  function scoreActionVerbs(data) {
    const findings = [];
    const deductions = [];
    let score = 100;

    const highlights = getAllHighlights(data);

    if (highlights.length === 0) {
      score -= 50;
      deductions.push('No bullet points found. Cannot evaluate action verb usage.');
      return { score: Math.max(0, score), findings, deductions };
    }

    let actionVerbCount = 0;
    let weakVerbCount = 0;
    let noVerbCount = 0;

    highlights.forEach(h => {
      const firstWord = getFirstWord(h);
      if (!firstWord) {
        noVerbCount++;
        return;
      }

      if (ACTION_VERBS.has(firstWord)) {
        actionVerbCount++;
      } else if (WEAK_VERBS.has(firstWord)) {
        weakVerbCount++;
      } else {
        // Check if it's at least a verb-like word (not a noun/adjective)
        // Simple heuristic: if it ends in -ed, -ing, -ated, -ized, it's likely a verb
        if (/(?:ed|ing|ated|ized|ised|mented|ted|red|ced|sed|ned|led|ped|ked|ved|ged)$/i.test(firstWord)) {
          actionVerbCount += 0.5; // partial credit
        } else {
          noVerbCount++;
        }
      }
    });

    const actionVerbRatio = actionVerbCount / highlights.length;
    const weakVerbRatio = weakVerbCount / highlights.length;

    if (actionVerbRatio >= 0.7) {
      findings.push(`Excellent: ${Math.round(actionVerbRatio * 100)}% of bullet points start with strong action verbs.`);
    } else if (actionVerbRatio >= 0.4) {
      score -= 15;
      deductions.push(`Only ${Math.round(actionVerbRatio * 100)}% of bullets start with strong action verbs. Aim for 70%+.`);
    } else {
      score -= 35;
      deductions.push(`Only ${Math.round(actionVerbRatio * 100)}% of bullets use action verbs. Start each bullet with a strong verb (developed, implemented, optimized, etc.).`);
    }

    if (weakVerbCount > 0) {
      score -= Math.min(20, weakVerbCount * 5);
      deductions.push(`${weakVerbCount} bullet(s) start with weak verbs (was, did, helped, worked, used). Replace with strong action verbs.`);
    }

    // Check for verb variety
    const usedVerbs = new Set();
    highlights.forEach(h => {
      const fw = getFirstWord(h);
      if (fw && ACTION_VERBS.has(fw)) usedVerbs.add(fw);
    });

    if (usedVerbs.size > 0 && usedVerbs.size < Math.min(3, highlights.length * 0.3)) {
      score -= 10;
      deductions.push('Low verb variety — repeating the same action verbs. Diversify your word choices.');
    } else if (usedVerbs.size >= 5) {
      findings.push(`Good verb variety: ${usedVerbs.size} unique action verbs used.`);
    }

    return { score: Math.max(0, score), findings, deductions };
  }

  function scoreQuantifiableAchievements(data) {
    const findings = [];
    const deductions = [];
    let score = 100;

    const highlights = getAllHighlights(data);

    if (highlights.length === 0) {
      score -= 50;
      deductions.push('No bullet points to evaluate for quantifiable achievements.');
      return { score: Math.max(0, score), findings, deductions };
    }

    let quantifiedCount = 0;
    const unquantified = [];

    highlights.forEach((h, idx) => {
      const numCount = countNumbers(h);
      if (numCount > 0) {
        quantifiedCount++;
      } else {
        // Check for qualitative achievement words without numbers
        if (/\b(improved|increased|reduced|decreased|saved|grew|boosted|accelerated|optimized|enhanced|streamlined|cut|lowered)\b/i.test(h)) {
          unquantified.push(h.substring(0, 60) + (h.length > 60 ? '...' : ''));
        }
      }
    });

    const quantifiedRatio = quantifiedCount / highlights.length;

    if (quantifiedRatio >= 0.5) {
      findings.push(`Strong: ${Math.round(quantifiedRatio * 100)}% of bullet points contain quantifiable metrics.`);
    } else if (quantifiedRatio >= 0.25) {
      score -= 20;
      deductions.push(`Only ${Math.round(quantifiedRatio * 100)}% of bullets have numbers/metrics. Aim for 50%+. Add percentages, counts, dollar amounts, or timeframes.`);
    } else if (quantifiedRatio > 0) {
      score -= 40;
      deductions.push(`Only ${quantifiedCount} out of ${highlights.length} bullet(s) include numbers. Quantify your impact wherever possible.`);
    } else {
      score -= 55;
      deductions.push('Zero quantifiable achievements found. Add metrics like "Reduced load time by 40%", "Served 10K+ users", "Saved $50K annually".');
    }

    if (unquantified.length > 0) {
      score -= Math.min(15, unquantified.length * 3);
      deductions.push(`${unquantified.length} bullet(s) mention improvements but lack numbers. Quantify them for much higher ATS impact.`);
    }

    return { score: Math.max(0, score), findings, deductions };
  }

  function scoreKeywordQuality(data) {
    const findings = [];
    const deductions = [];
    let score = 100;

    // Gather all text from resume
    const allText = [];
    const p = data.personal || {};
    // Don't include personal info in keyword analysis

    (data.sections || []).forEach(sec => {
      allText.push(sec.name || '');
      if (sec.type === 'list' && sec.items) {
        sec.items.forEach(item => {
          allText.push(item.title || '');
          allText.push(item.subtitle || '');
          (item.highlights || []).forEach(h => allText.push(h || ''));
        });
      }
      if (sec.type === 'tags' && sec.categories) {
        sec.categories.forEach(cat => {
          (cat.tags || []).forEach(t => allText.push(t || ''));
        });
      }
    });

    const fullText = allText.join(' ').toLowerCase();
    const words = fullText.split(/[\s,;:()[\]{}|/\\]+/).filter(w => w.length > 1);

    // Count tech keyword matches
    const matchedKeywords = new Set();
    TECH_KEYWORDS.forEach(kw => {
      if (fullText.includes(kw)) {
        matchedKeywords.add(kw);
      }
    });

    if (matchedKeywords.size === 0) {
      score -= 50;
      deductions.push('No recognized technical/industry keywords found in resume content.');
    } else if (matchedKeywords.size < 5) {
      score -= 25;
      deductions.push(`Only ${matchedKeywords.size} technical keyword(s) detected. Most competitive resumes have 15+.`);
    } else if (matchedKeywords.size < 10) {
      score -= 10;
      deductions.push(`${matchedKeywords.size} technical keywords found. Good start, but aim for 15+.`);
    } else {
      findings.push(`Excellent: ${matchedKeywords.size} technical keywords detected throughout the resume.`);
    }

    // Check keyword distribution (not all in skills)
    const skillTags = getAllTags(data).map(t => t.toLowerCase());
    const keywordsInContent = [...matchedKeywords].filter(kw => {
      // Check if keyword appears outside skills section
      const inHighlights = getAllHighlights(data).some(h => h.toLowerCase().includes(kw));
      return inHighlights;
    });

    if (matchedKeywords.size > 5 && keywordsInContent.length < matchedKeywords.size * 0.3) {
      score -= 10;
      deductions.push('Keywords are concentrated in the Skills section. Integrate them into bullet points too — ATS values keyword context.');
    } else if (keywordsInContent.length > 3) {
      findings.push('Keywords well-distributed across skills and bullet points.');
    }

    return { score: Math.max(0, score), findings, deductions };
  }

  function scoreGrammarConsistency(data) {
    const findings = [];
    const deductions = [];
    let score = 100;

    const highlights = getAllHighlights(data);
    const allItems = [];
    (data.sections || []).forEach(sec => {
      if (sec.type === 'list' && sec.items) {
        sec.items.forEach(item => allItems.push(item));
      }
    });

    if (highlights.length === 0 && allItems.length === 0) {
      return { score: 50, findings: [], deductions: ['Insufficient content to evaluate grammar and consistency.'] };
    }

    // Check bullet point ending consistency (all end with period or none do)
    const endsWithPeriod = highlights.filter(h => h.trim().endsWith('.'));
    const periodRatio = highlights.length > 0 ? endsWithPeriod.length / highlights.length : 0;

    if (highlights.length > 2 && periodRatio > 0.2 && periodRatio < 0.8) {
      score -= 15;
      deductions.push(`Inconsistent punctuation: ${endsWithPeriod.length}/${highlights.length} bullets end with periods. Be consistent.`);
    } else if (highlights.length > 2) {
      findings.push('Consistent bullet point punctuation.');
    }

    // Check tense consistency (past vs present)
    let pastTenseCount = 0;
    let presentTenseCount = 0;

    highlights.forEach(h => {
      const firstWord = getFirstWord(h);
      if (!firstWord) return;
      if (/ed$/i.test(firstWord)) pastTenseCount++;
      else if (/(?:s|es|ies)$/i.test(firstWord) && !ACTION_VERBS.has(firstWord)) presentTenseCount++;
    });

    if (pastTenseCount > 2 && presentTenseCount > 2) {
      score -= 10;
      deductions.push('Mixed verb tenses detected. Use past tense for previous roles and present tense only for current role.');
    } else if (pastTenseCount > 0 || presentTenseCount > 0) {
      findings.push('Verb tense appears consistent.');
    }

    // Check capitalization consistency in titles
    const titles = allItems.map(item => item.title).filter(t => isRealContent(t));
    const capitalizedTitles = titles.filter(t => /^[A-Z]/.test(t.trim()));
    if (titles.length > 1 && capitalizedTitles.length !== titles.length && capitalizedTitles.length !== 0) {
      score -= 10;
      deductions.push('Inconsistent capitalization in entry titles.');
    }

    // Check for duplicate content
    const normalizedHighlights = highlights.map(h => h.toLowerCase().replace(/[^a-z0-9\s]/g, '').trim());
    const duplicates = normalizedHighlights.filter((h, i) =>
      normalizedHighlights.indexOf(h) !== i && h.length > 20
    );
    if (duplicates.length > 0) {
      score -= duplicates.length * 10;
      deductions.push(`${duplicates.length} duplicate bullet point(s) detected. Remove repeated content.`);
    }

    return { score: Math.max(0, score), findings, deductions };
  }

  function scoreReadability(data) {
    const findings = [];
    const deductions = [];
    let score = 100;

    const highlights = getAllHighlights(data);

    if (highlights.length === 0) {
      return { score: 50, findings: [], deductions: ['No bullet points to evaluate readability.'] };
    }

    // Check bullet point length
    const tooShort = highlights.filter(h => h.length < 20 && isRealContent(h));
    const tooLong = highlights.filter(h => h.length > 200);
    const goodLength = highlights.filter(h => h.length >= 20 && h.length <= 200);

    if (tooLong.length > 0) {
      score -= Math.min(20, tooLong.length * 5);
      deductions.push(`${tooLong.length} bullet(s) exceed 200 characters. Keep bullets concise (50-150 chars is ideal).`);
    }

    if (tooShort.length > highlights.length * 0.5) {
      score -= 15;
      deductions.push(`${tooShort.length} bullet(s) are very short (<20 chars). Bullets should be detailed enough to be meaningful.`);
    }

    if (goodLength.length >= highlights.length * 0.7) {
      findings.push('Bullet point lengths are well-balanced.');
    }

    // Check for jargon density (too many acronyms in a single bullet)
    const highJargon = highlights.filter(h => {
      const acronyms = h.match(/\b[A-Z]{2,}\b/g);
      return acronyms && acronyms.length > 4;
    });

    if (highJargon.length > 0) {
      score -= 5;
      deductions.push(`${highJargon.length} bullet(s) have excessive acronyms. Spell out some for clarity.`);
    }

    // Check for first-person pronouns (should not be in resume)
    const firstPersonBullets = highlights.filter(h =>
      /\b(I |my |me |myself)\b/i.test(h)
    );

    if (firstPersonBullets.length > 0) {
      score -= firstPersonBullets.length * 5;
      deductions.push(`${firstPersonBullets.length} bullet(s) use first-person pronouns (I, my, me). Remove them for professional tone.`);
    } else {
      findings.push('No first-person pronouns — professional tone maintained.');
    }

    return { score: Math.max(0, score), findings, deductions };
  }

  function scoreOverallATSCompatibility(data) {
    const findings = [];
    const deductions = [];
    let score = 100;

    // This is a meta-scorer that checks overall ATS-friendliness
    const sections = data.sections || [];
    const highlights = getAllHighlights(data);
    const tags = getAllTags(data);
    const p = data.personal || {};

    // Check total content volume
    const totalItems = sections.reduce((acc, sec) => {
      if (sec.type === 'list') return acc + (sec.items || []).length;
      if (sec.type === 'tags') return acc + (sec.categories || []).reduce((a, c) => a + (c.tags || []).length, 0);
      return acc;
    }, 0);

    if (totalItems < 5) {
      score -= 30;
      deductions.push('Resume has very little content overall. ATS needs substantial text to score effectively.');
    } else if (totalItems < 10) {
      score -= 15;
      deductions.push('Resume content is sparse. Add more detail to improve ATS matching.');
    } else {
      findings.push('Good amount of content for ATS parsing.');
    }

    // Check for balanced content (not all in one section)
    const listSections = sections.filter(s => s.type === 'list');
    const sectionsWithHighlights = listSections.filter(sec =>
      (sec.items || []).some(item => (item.highlights || []).length > 0)
    );

    if (listSections.length > 0 && sectionsWithHighlights.length < listSections.length * 0.5) {
      score -= 10;
      deductions.push('Most list sections lack bullet points. Add descriptions to demonstrate depth.');
    }

    // Check for overall placeholder ratio
    const allTextItems = [];
    sections.forEach(sec => {
      if (sec.type === 'list' && sec.items) {
        sec.items.forEach(item => {
          allTextItems.push(item.title);
          allTextItems.push(item.subtitle);
          (item.highlights || []).forEach(h => allTextItems.push(h));
        });
      }
    });

    const placeholderCount = allTextItems.filter(t => isPlaceholder(t)).length;
    const totalTextItems = allTextItems.filter(t => t && t.trim()).length;

    if (totalTextItems > 0 && placeholderCount / totalTextItems > 0.3) {
      score -= 20;
      deductions.push('Over 30% of content appears to be placeholder text. Replace with real content.');
    } else if (placeholderCount === 0 && totalTextItems > 5) {
      findings.push('All content appears to be genuine (no placeholders detected).');
    }

    // Check resume "completeness" — has the user actually filled it out?
    const hasRealName = isRealContent(p.name) && !isPlaceholder(p.name);
    const hasRealEmail = p.email && p.email.includes('@') && !isPlaceholder(p.email);
    const hasRealHighlights = highlights.filter(h => !isPlaceholder(h)).length;

    if (!hasRealName || !hasRealEmail) {
      score -= 15;
      deductions.push('Personal information appears incomplete or uses placeholder data.');
    }

    if (hasRealHighlights < 3) {
      score -= 10;
      deductions.push('Very few real bullet points. ATS scoring is most effective with detailed, real content.');
    }

    return { score: Math.max(0, score), findings, deductions };
  }

  // ═══════════════════════════════════════════════════════════════════════════
  // MAIN ANALYSIS ENGINE
  // ═══════════════════════════════════════════════════════════════════════════

  const categoryScorers = {
    resumeStructure:       { name: 'Resume Structure',          icon: 'fa-sitemap',         scorer: scoreResumeStructure },
    atsFormatting:         { name: 'ATS Formatting',            icon: 'fa-file-lines',      scorer: scoreATSFormatting },
    contactInformation:    { name: 'Contact Information',       icon: 'fa-address-card',    scorer: scoreContactInformation },
    sectionCompleteness:   { name: 'Section Completeness',      icon: 'fa-list-check',      scorer: scoreSectionCompleteness },
    professionalSummary:   { name: 'Professional Summary',      icon: 'fa-quote-left',      scorer: scoreProfessionalSummary },
    skills:                { name: 'Skills',                    icon: 'fa-screwdriver-wrench', scorer: scoreSkills },
    experience:            { name: 'Experience',                icon: 'fa-briefcase',       scorer: scoreExperience },
    projects:              { name: 'Projects',                  icon: 'fa-laptop-code',     scorer: scoreProjects },
    education:             { name: 'Education',                 icon: 'fa-graduation-cap',  scorer: scoreEducation },
    certifications:        { name: 'Certifications',            icon: 'fa-certificate',     scorer: scoreCertifications },
    actionVerbs:           { name: 'Action Verbs',              icon: 'fa-bolt',            scorer: scoreActionVerbs },
    quantifiableAchievements: { name: 'Quantifiable Achievements', icon: 'fa-chart-line',  scorer: scoreQuantifiableAchievements },
    keywordQuality:        { name: 'Keyword Quality',           icon: 'fa-key',             scorer: scoreKeywordQuality },
    grammarConsistency:    { name: 'Grammar & Consistency',     icon: 'fa-spell-check',     scorer: scoreGrammarConsistency },
    readability:           { name: 'Readability',               icon: 'fa-glasses',         scorer: scoreReadability },
    overallATSCompatibility: { name: 'Overall ATS Compatibility', icon: 'fa-shield-check', scorer: scoreOverallATSCompatibility }
  };

  let _cache = { hash: null, result: null };

  function analyze(resumeData) {
    if (!resumeData) return _emptyResult();

    const currentHash = hashData(resumeData);
    if (_cache.hash === currentHash && _cache.result) {
      return _cache.result;
    }

    const breakdown = [];
    let weightedSum = 0;

    for (const [key, config] of Object.entries(categoryScorers)) {
      const weight = CATEGORY_WEIGHTS[key] || 1;
      let result;

      try {
        result = config.scorer(resumeData);
      } catch (err) {
        console.warn(`ATS scorer error for "${key}":`, err);
        result = { score: 50, findings: [], deductions: ['Scoring error — unable to fully evaluate this category.'] };
      }

      const categoryResult = {
        key,
        name: config.name,
        icon: config.icon,
        weight,
        score: Math.round(result.score),
        weightedScore: Math.round(result.score * weight / TOTAL_WEIGHT),
        findings: result.findings || [],
        deductions: result.deductions || []
      };

      breakdown.push(categoryResult);
      weightedSum += result.score * weight;
    }

    const finalScore = Math.round(weightedSum / TOTAL_WEIGHT);

    // Calculate confidence level based on content completeness
    const contentSignals = _assessContentCompleteness(resumeData);
    const confidence = contentSignals >= 8 ? 'high' : contentSignals >= 5 ? 'medium' : 'low';

    // Extract top strengths and weaknesses
    const strengths = [];
    const weaknesses = [];

    breakdown.forEach(cat => {
      cat.findings.forEach(f => strengths.push({ category: cat.name, text: f }));
      cat.deductions.forEach(d => weaknesses.push({ category: cat.name, text: d, score: cat.score }));
    });

    // Sort weaknesses by category score (worst first)
    weaknesses.sort((a, b) => a.score - b.score);

    const result = {
      score: finalScore,
      confidence,
      breakdown,
      strengths: strengths.slice(0, 15),
      weaknesses: weaknesses.slice(0, 20),
      timestamp: Date.now(),
      categoryWeights: { ...CATEGORY_WEIGHTS },
      totalWeight: TOTAL_WEIGHT
    };

    _cache = { hash: currentHash, result };
    return result;
  }

  function _assessContentCompleteness(data) {
    let signals = 0;
    const p = data.personal || {};
    if (isRealContent(p.name) && !isPlaceholder(p.name)) signals++;
    if (p.email && p.email.includes('@') && !isPlaceholder(p.email)) signals++;
    if (isRealContent(p.phone) && !isPlaceholder(p.phone)) signals++;
    if (isRealContent(p.location) && !isPlaceholder(p.location)) signals++;

    const sections = data.sections || [];
    if (sections.length >= 3) signals++;
    if (sections.length >= 5) signals++;

    const highlights = getAllHighlights(data).filter(h => !isPlaceholder(h));
    if (highlights.length >= 3) signals++;
    if (highlights.length >= 8) signals++;

    const tags = getAllTags(data).filter(t => !isPlaceholder(t));
    if (tags.length >= 5) signals++;
    if (tags.length >= 10) signals++;

    return signals;
  }

  function _emptyResult() {
    return {
      score: 0,
      confidence: 'low',
      breakdown: [],
      strengths: [],
      weaknesses: [{ category: 'General', text: 'No resume data available.' }],
      timestamp: Date.now(),
      categoryWeights: { ...CATEGORY_WEIGHTS },
      totalWeight: TOTAL_WEIGHT
    };
  }

  function getScore(resumeData) {
    return analyze(resumeData).score;
  }

  function getBreakdown(resumeData) {
    return analyze(resumeData).breakdown;
  }

  function invalidateCache() {
    _cache = { hash: null, result: null };
  }

  function updateWidget() {
    const resumeData = window.resumeData;
    if (!resumeData) return;

    const pct = getScore(resumeData);
    const bar = document.getElementById('atsBarFill');
    const val = document.getElementById('atsValue');
    if (!bar || !val) return;

    bar.style.width = `${pct}%`;
    val.textContent = `${pct}%`;

    const color = pct >= 80 ? '#0d9488' : pct >= 60 ? '#22c55e' : pct >= 40 ? '#d97706' : '#dc2626';
    bar.style.background = color;
    val.style.color = color;
  }

  // ═══════════════════════════════════════════════════════════════════════════
  // PUBLIC API — Exposed on window.ATSEngine
  // ═══════════════════════════════════════════════════════════════════════════

  window.ATSEngine = {
    analyze,
    getScore,
    getBreakdown,
    updateWidget,
    invalidateCache,
    // Expose for external use (recommendations, job matcher)
    ACTION_VERBS,
    WEAK_VERBS,
    TECH_KEYWORDS,
    CATEGORY_WEIGHTS,
    TOTAL_WEIGHT,
    // Utility exports
    getAllHighlights,
    getAllTags,
    isPlaceholder,
    isRealContent,
    getFirstWord,
    countNumbers
  };

})();
