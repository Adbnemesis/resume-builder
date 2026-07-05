/**
 * ============================================================================
 * ATS PANEL UI — ats-ui.js
 * ============================================================================
 * Renders the full ATS analysis slide-out panel. Handles score display,
 * breakdown accordion, strengths/weaknesses, suggestions, job analysis,
 * job matching, and optimization recommendations.
 *
 * Public API (exposed on window.ATSUI):
 *   - init()              → bind event listeners and initial render
 *   - toggle()            → open/close the ATS panel
 *   - open()              → open the panel
 *   - close()             → close the panel
 *   - refresh()           → re-render with latest data (debounced)
 *
 * Depends on: window.ATSEngine, window.ATSRecommendations,
 *             window.ATSJobParser, window.ATSJobMatcher
 * ============================================================================
 */

(function () {
  'use strict';

  let _isOpen = false;
  let _currentJobData = null;
  let _currentMatchResult = null;
  let _refreshTimer = null;
  let _activeTab = 'general'; // 'general' | 'job'

  // ═══════════════════════════════════════════════════════════════════════════
  // INITIALIZATION
  // ═══════════════════════════════════════════════════════════════════════════

  function init() {
    _renderPanelShell();
    _bindEvents();
    // Initial render after a short delay to ensure data is loaded
    setTimeout(() => refresh(), 300);
  }

  // ═══════════════════════════════════════════════════════════════════════════
  // PANEL SHELL (Injected once)
  // ═══════════════════════════════════════════════════════════════════════════

  function _renderPanelShell() {
    // Create backdrop
    if (!document.getElementById('atsBackdrop')) {
      const backdrop = document.createElement('div');
      backdrop.id = 'atsBackdrop';
      backdrop.className = 'ats-backdrop';
      backdrop.addEventListener('click', close);
      document.body.appendChild(backdrop);
    }

    const panel = document.getElementById('atsPanel');
    if (!panel) return;

    panel.innerHTML = `
      <div class="ats-panel-header">
        <h2><i class="fa-solid fa-chart-simple"></i> ATS Analyzer</h2>
        <button class="ats-panel-close" id="atsPanelClose" title="Close"><i class="fa-solid fa-xmark"></i></button>
      </div>
      <div class="ats-panel-body">
        <!-- Score Ring -->
        <div class="ats-score-ring-container" id="atsScoreRing">
          <div class="ats-score-ring">
            <svg viewBox="0 0 120 120">
              <circle class="ring-bg" cx="60" cy="60" r="52"/>
              <circle class="ring-fill" id="atsRingFill" cx="60" cy="60" r="52"
                stroke-dasharray="326.73" stroke-dashoffset="326.73"/>
            </svg>
            <div class="ats-score-number" id="atsScoreNum">0</div>
          </div>
          <div class="ats-score-label">ATS Score</div>
          <div class="ats-confidence-badge low" id="atsConfidence">
            <i class="fa-solid fa-circle-info"></i> <span>Low Confidence</span>
          </div>
        </div>

        <!-- Tabs -->
        <div class="ats-panel-tabs">
          <button class="ats-panel-tab active" data-tab="general">
            <i class="fa-solid fa-chart-pie"></i> General
          </button>
          <button class="ats-panel-tab" data-tab="job">
            <i class="fa-solid fa-bullseye"></i> Job Match
          </button>
        </div>

        <!-- General Tab -->
        <div class="ats-tab-content active" id="atsTabGeneral" data-tab-content="general">
          <div id="atsBreakdownSection"></div>
          <div id="atsStrengthsSection"></div>
          <div id="atsWeaknessesSection"></div>
          <div id="atsSuggestionsSection"></div>
        </div>

        <!-- Job Match Tab -->
        <div class="ats-tab-content" id="atsTabJob" data-tab-content="job">
          <div id="atsJobInputSection"></div>
          <div id="atsJobMatchSection"></div>
          <div id="atsJobOptimizationsSection"></div>
        </div>
      </div>
    `;
  }

  // ═══════════════════════════════════════════════════════════════════════════
  // EVENT BINDINGS
  // ═══════════════════════════════════════════════════════════════════════════

  function _bindEvents() {
    // Close button
    const closeBtn = document.getElementById('atsPanelClose');
    if (closeBtn) closeBtn.addEventListener('click', close);

    // ATS widget click
    const widget = document.getElementById('atsWidget');
    if (widget) widget.addEventListener('click', toggle);

    // Tab switching
    const tabs = document.querySelectorAll('.ats-panel-tab');
    tabs.forEach(tab => {
      tab.addEventListener('click', () => {
        _activeTab = tab.dataset.tab;
        tabs.forEach(t => t.classList.remove('active'));
        tab.classList.add('active');

        document.querySelectorAll('.ats-tab-content').forEach(c => c.classList.remove('active'));
        const target = document.querySelector(`.ats-tab-content[data-tab-content="${_activeTab}"]`);
        if (target) target.classList.add('active');

        if (_activeTab === 'job') {
          _renderJobInput();
        }
      });
    });

    // Keyboard: ESC to close
    document.addEventListener('keydown', (e) => {
      if (e.key === 'Escape' && _isOpen) close();
    });
  }

  // ═══════════════════════════════════════════════════════════════════════════
  // OPEN / CLOSE / TOGGLE
  // ═══════════════════════════════════════════════════════════════════════════

  function toggle() {
    if (_isOpen) close();
    else open();
  }

  function open() {
    const panel = document.getElementById('atsPanel');
    const backdrop = document.getElementById('atsBackdrop');
    if (panel) panel.classList.add('open');
    if (backdrop) backdrop.classList.add('visible');
    _isOpen = true;
    refresh();
  }

  function close() {
    const panel = document.getElementById('atsPanel');
    const backdrop = document.getElementById('atsBackdrop');
    if (panel) panel.classList.remove('open');
    if (backdrop) backdrop.classList.remove('visible');
    _isOpen = false;
  }

  // ═══════════════════════════════════════════════════════════════════════════
  // MAIN REFRESH (debounced)
  // ═══════════════════════════════════════════════════════════════════════════

  function refresh() {
    if (_refreshTimer) clearTimeout(_refreshTimer);
    _refreshTimer = setTimeout(_doRefresh, 100);
  }

  function _doRefresh() {
    const resumeData = window.resumeData;
    if (!resumeData || !window.ATSEngine) return;

    const analysis = window.ATSEngine.analyze(resumeData);

    _renderScoreRing(analysis.score, analysis.confidence);
    _renderBreakdown(analysis.breakdown);
    _renderStrengths(analysis.strengths);
    _renderWeaknesses(analysis.weaknesses);
    _renderSuggestions(resumeData);

    // Render job input if on job tab
    if (_activeTab === 'job') {
      _renderJobInput();
      if (_currentJobData) {
        _runJobMatch(resumeData);
      }
    }
  }

  // ═══════════════════════════════════════════════════════════════════════════
  // SCORE RING RENDERER
  // ═══════════════════════════════════════════════════════════════════════════

  function _renderScoreRing(score, confidence) {
    const ringFill = document.getElementById('atsRingFill');
    const scoreNum = document.getElementById('atsScoreNum');
    const confidenceBadge = document.getElementById('atsConfidence');

    if (!ringFill || !scoreNum) return;

    // Animate score
    const circumference = 2 * Math.PI * 52; // 326.73
    const offset = circumference - (score / 100) * circumference;
    ringFill.style.strokeDashoffset = offset;

    // Color
    const color = score >= 80 ? '#4ade80' : score >= 60 ? '#22c55e' : score >= 40 ? '#fbbf24' : '#f87171';
    ringFill.style.stroke = color;
    scoreNum.style.color = color;
    scoreNum.textContent = score;

    // Confidence badge
    if (confidenceBadge) {
      confidenceBadge.className = `ats-confidence-badge ${confidence}`;
      const labels = { high: 'High Confidence', medium: 'Medium Confidence', low: 'Low Confidence' };
      const icons = { high: 'fa-circle-check', medium: 'fa-circle-info', low: 'fa-circle-exclamation' };
      confidenceBadge.innerHTML = `<i class="fa-solid ${icons[confidence] || icons.low}"></i> <span>${labels[confidence] || labels.low}</span>`;
    }
  }

  // ═══════════════════════════════════════════════════════════════════════════
  // BREAKDOWN RENDERER
  // ═══════════════════════════════════════════════════════════════════════════

  function _renderBreakdown(breakdown) {
    const container = document.getElementById('atsBreakdownSection');
    if (!container) return;

    let html = `
      <div class="ats-section open">
        <div class="ats-section-header" data-toggle="breakdown">
          <h3><i class="fa-solid fa-chart-bar"></i> Score Breakdown</h3>
          <div style="display:flex;align-items:center;gap:8px">
            <span class="section-count">${breakdown.length} categories</span>
            <i class="fa-solid fa-chevron-down ats-section-chevron"></i>
          </div>
        </div>
        <div class="ats-section-content">
          <div class="ats-section-inner">
    `;

    breakdown.forEach(cat => {
      const color = cat.score >= 80 ? '#4ade80' : cat.score >= 60 ? '#22c55e' : cat.score >= 40 ? '#fbbf24' : '#f87171';
      const hasDetails = cat.findings.length > 0 || cat.deductions.length > 0;

      html += `<div class="ats-breakdown-item-wrapper${hasDetails ? '' : ''}">`;
      html += `
        <div class="ats-breakdown-item" ${hasDetails ? 'data-expandable="true"' : ''}>
          <div class="ats-breakdown-icon"><i class="fa-solid ${cat.icon || 'fa-circle'}"></i></div>
          <div class="ats-breakdown-info">
            <div class="ats-breakdown-name">${cat.name}</div>
            <div class="ats-breakdown-bar">
              <div class="ats-breakdown-bar-fill" style="width:${cat.score}%;background:${color}"></div>
            </div>
          </div>
          <div class="ats-breakdown-score" style="color:${color}">${cat.score}</div>
        </div>
      `;

      if (hasDetails) {
        html += `<div class="ats-breakdown-detail"><div class="ats-detail-list">`;
        cat.findings.forEach(f => {
          html += `<div class="ats-detail-finding"><i class="fa-solid fa-check"></i> ${_escHtml(f)}</div>`;
        });
        cat.deductions.forEach(d => {
          html += `<div class="ats-detail-deduction"><i class="fa-solid fa-minus"></i> ${_escHtml(d)}</div>`;
        });
        html += `</div></div>`;
      }

      html += `</div>`;
    });

    html += `</div></div></div>`;
    container.innerHTML = html;

    // Bind accordion toggles
    _bindAccordions(container);
    _bindExpandableItems(container);
  }

  // ═══════════════════════════════════════════════════════════════════════════
  // STRENGTHS / WEAKNESSES RENDERERS
  // ═══════════════════════════════════════════════════════════════════════════

  function _renderStrengths(strengths) {
    const container = document.getElementById('atsStrengthsSection');
    if (!container) return;

    if (strengths.length === 0) {
      container.innerHTML = '';
      return;
    }

    let html = `
      <div class="ats-section">
        <div class="ats-section-header" data-toggle="strengths">
          <h3><i class="fa-solid fa-circle-check" style="color:#4ade80"></i> Strengths</h3>
          <div style="display:flex;align-items:center;gap:8px">
            <span class="section-count">${strengths.length}</span>
            <i class="fa-solid fa-chevron-down ats-section-chevron"></i>
          </div>
        </div>
        <div class="ats-section-content">
          <div class="ats-section-inner">
    `;

    strengths.forEach(s => {
      html += `
        <div class="ats-list-item strength">
          <i class="fa-solid fa-check-circle"></i>
          <div>
            <div>${_escHtml(s.text)}</div>
            <div class="ats-list-category">${_escHtml(s.category)}</div>
          </div>
        </div>
      `;
    });

    html += `</div></div></div>`;
    container.innerHTML = html;
    _bindAccordions(container);
  }

  function _renderWeaknesses(weaknesses) {
    const container = document.getElementById('atsWeaknessesSection');
    if (!container) return;

    if (weaknesses.length === 0) {
      container.innerHTML = '';
      return;
    }

    let html = `
      <div class="ats-section open">
        <div class="ats-section-header" data-toggle="weaknesses">
          <h3><i class="fa-solid fa-triangle-exclamation" style="color:#fbbf24"></i> Weaknesses</h3>
          <div style="display:flex;align-items:center;gap:8px">
            <span class="section-count">${weaknesses.length}</span>
            <i class="fa-solid fa-chevron-down ats-section-chevron"></i>
          </div>
        </div>
        <div class="ats-section-content">
          <div class="ats-section-inner">
    `;

    weaknesses.forEach(w => {
      html += `
        <div class="ats-list-item weakness">
          <i class="fa-solid fa-circle-xmark"></i>
          <div>
            <div>${_escHtml(w.text)}</div>
            <div class="ats-list-category">${_escHtml(w.category)}</div>
          </div>
        </div>
      `;
    });

    html += `</div></div></div>`;
    container.innerHTML = html;
    _bindAccordions(container);
  }

  // ═══════════════════════════════════════════════════════════════════════════
  // SUGGESTIONS RENDERER
  // ═══════════════════════════════════════════════════════════════════════════

  function _renderSuggestions(resumeData) {
    const container = document.getElementById('atsSuggestionsSection');
    if (!container || !window.ATSRecommendations) return;

    const suggestions = window.ATSRecommendations.generate(resumeData);

    if (suggestions.length === 0) {
      container.innerHTML = `
        <div class="ats-section">
          <div class="ats-section-header">
            <h3><i class="fa-solid fa-lightbulb" style="color:#fbbf24"></i> Suggestions</h3>
          </div>
          <div class="ats-section-content" style="max-height:none">
            <div class="ats-section-inner">
              <div class="ats-empty-state"><i class="fa-solid fa-check-double"></i> No suggestions — your resume looks great!</div>
            </div>
          </div>
        </div>
      `;
      return;
    }

    let html = `
      <div class="ats-section open">
        <div class="ats-section-header" data-toggle="suggestions">
          <h3><i class="fa-solid fa-lightbulb" style="color:#fbbf24"></i> Improvement Suggestions</h3>
          <div style="display:flex;align-items:center;gap:8px">
            <span class="section-count">${suggestions.length}</span>
            <i class="fa-solid fa-chevron-down ats-section-chevron"></i>
          </div>
        </div>
        <div class="ats-section-content">
          <div class="ats-section-inner">
    `;

    suggestions.forEach(s => {
      html += _renderSuggestionCard(s);
    });

    html += `</div></div></div>`;
    container.innerHTML = html;
    _bindAccordions(container);
    _bindSuggestionActions(container);
  }

  function _renderSuggestionCard(s) {
    let actionsHtml = '';
    if (s.section) {
      actionsHtml += `<button class="ats-suggestion-btn navigate" data-section="${s.section}" data-item="${s.itemIndex || ''}"><i class="fa-solid fa-arrow-right"></i> Show in Editor</button>`;
    }
    if (s.type === 'keyword' && s.skills && s.skills.length > 0) {
      actionsHtml += `<button class="ats-suggestion-btn apply-skill" data-skills="${_escHtml(s.skills.join(','))}"><i class="fa-solid fa-plus"></i> Add Skills</button>`;
    }

    return `
      <div class="ats-suggestion-card">
        <div class="ats-suggestion-header">
          <span class="ats-suggestion-priority ${s.priority}">${s.priority}</span>
          <span class="ats-suggestion-category">${_escHtml(s.category)}</span>
          <span class="ats-suggestion-gain"><i class="fa-solid fa-arrow-up"></i> +${s.estimatedGain}pts</span>
        </div>
        <div class="ats-suggestion-issue">${_escHtml(s.issue)}</div>
        <div class="ats-suggestion-impact">${_escHtml(s.impact)}</div>
        <div class="ats-suggestion-fix"><i class="fa-solid fa-wrench"></i> <span>${_escHtml(s.fix)}</span></div>
        ${actionsHtml ? `<div class="ats-suggestion-actions">${actionsHtml}</div>` : ''}
      </div>
    `;
  }

  // ═══════════════════════════════════════════════════════════════════════════
  // JOB INPUT RENDERER
  // ═══════════════════════════════════════════════════════════════════════════

  function _renderJobInput() {
    const container = document.getElementById('atsJobInputSection');
    if (!container) return;

    // Only re-render if empty (preserve user input)
    if (container.querySelector('.ats-job-input-group')) return;

    container.innerHTML = `
      <div class="ats-section open">
        <div class="ats-section-header">
          <h3><i class="fa-solid fa-paste" style="color:#22d3ee"></i> Job Description</h3>
        </div>
        <div class="ats-section-content" style="max-height:none">
          <div class="ats-section-inner">
            <div class="ats-job-input-group">
              <textarea class="ats-job-textarea" id="atsJobText"
                placeholder="Paste the full job description here..."></textarea>
              <div class="ats-job-or-divider">OR</div>
              <div class="ats-job-url-row">
                <input type="url" class="ats-job-url-input" id="atsJobUrl"
                  placeholder="Paste job posting URL...">
                <button class="ats-job-btn primary" id="atsJobFetchBtn">
                  <i class="fa-solid fa-download"></i> Fetch
                </button>
              </div>
              <div style="display:flex;gap:8px">
                <button class="ats-job-btn primary" id="atsJobAnalyzeBtn" style="flex:1">
                  <i class="fa-solid fa-magnifying-glass-chart"></i> Analyze Match
                </button>
                <button class="ats-job-btn secondary" id="atsJobClearBtn">
                  <i class="fa-solid fa-xmark"></i> Clear
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    `;

    // Bind job analysis buttons
    const analyzeBtn = document.getElementById('atsJobAnalyzeBtn');
    const fetchBtn = document.getElementById('atsJobFetchBtn');
    const clearBtn = document.getElementById('atsJobClearBtn');
    const textArea = document.getElementById('atsJobText');
    const urlInput = document.getElementById('atsJobUrl');

    if (analyzeBtn) {
      analyzeBtn.addEventListener('click', () => {
        const text = textArea.value.trim();
        if (text.length < 20) {
          _showStatus('Please paste a job description (at least 20 characters).');
          return;
        }
        _currentJobData = window.ATSJobParser.parse(text);
        _runJobMatch(window.resumeData);
      });
    }

    if (fetchBtn) {
      fetchBtn.addEventListener('click', async () => {
        const url = urlInput.value.trim();
        if (!url) {
          _showStatus('Please enter a job posting URL.');
          return;
        }

        fetchBtn.disabled = true;
        fetchBtn.innerHTML = '<i class="fa-solid fa-spinner fa-spin"></i> Fetching...';

        try {
          _currentJobData = await window.ATSJobParser.fetchAndParse(url);
          // Pre-fill textarea with the detected text for user verification
          if (_currentJobData.rawText) {
            textArea.value = _currentJobData.rawText.substring(0, 3000);
          }
          _runJobMatch(window.resumeData);
        } catch (err) {
          _showStatus(err.message || 'Failed to fetch URL. Please paste the job description manually.');
        } finally {
          fetchBtn.disabled = false;
          fetchBtn.innerHTML = '<i class="fa-solid fa-download"></i> Fetch';
        }
      });
    }

    if (clearBtn) {
      clearBtn.addEventListener('click', () => {
        textArea.value = '';
        urlInput.value = '';
        _currentJobData = null;
        _currentMatchResult = null;
        const matchSection = document.getElementById('atsJobMatchSection');
        const optSection = document.getElementById('atsJobOptimizationsSection');
        if (matchSection) matchSection.innerHTML = '';
        if (optSection) optSection.innerHTML = '';
      });
    }
  }

  function _showStatus(message) {
    // Use a temporary toast
    const existing = document.querySelector('.ats-toast');
    if (existing) existing.remove();

    const toast = document.createElement('div');
    toast.className = 'ats-toast';
    toast.style.cssText = `
      position: fixed; bottom: 24px; right: 24px; z-index: 200;
      background: rgba(30, 41, 59, 0.95); color: #fbbf24;
      padding: 12px 20px; border-radius: 10px; font-size: 0.82rem;
      border: 1px solid rgba(234, 179, 8, 0.3);
      box-shadow: 0 8px 30px rgba(0,0,0,0.3);
      font-family: var(--font-ui);
      animation: atsToastIn 0.3s ease;
      max-width: 380px;
    `;
    toast.textContent = message;
    document.body.appendChild(toast);

    setTimeout(() => {
      toast.style.opacity = '0';
      toast.style.transition = 'opacity 0.3s';
      setTimeout(() => toast.remove(), 300);
    }, 4000);
  }

  // ═══════════════════════════════════════════════════════════════════════════
  // JOB MATCH RENDERER
  // ═══════════════════════════════════════════════════════════════════════════

  function _runJobMatch(resumeData) {
    if (!_currentJobData || !window.ATSJobMatcher) return;

    _currentMatchResult = window.ATSJobMatcher.match(resumeData, _currentJobData);
    _renderJobMatch(_currentMatchResult);
    _renderJobOptimizations(resumeData);
  }

  function _renderJobMatch(result) {
    const container = document.getElementById('atsJobMatchSection');
    if (!container) return;

    const colorFor = (pct) => pct >= 80 ? '#4ade80' : pct >= 60 ? '#22c55e' : pct >= 40 ? '#fbbf24' : '#f87171';
    const iconFor = (level) => {
      return { strong: 'fa-circle-check', good: 'fa-thumbs-up', moderate: 'fa-circle-info', weak: 'fa-triangle-exclamation' }[level] || 'fa-circle-info';
    };

    let html = '';

    // Job title
    if (result.jobTitle) {
      html += `<div style="text-align:center;margin-bottom:8px">
        <div style="font-size:0.82rem;font-weight:600;color:#e2e8f0">${_escHtml(result.jobTitle)}</div>
        ${result.company ? `<div style="font-size:0.72rem;color:#94a3b8">${_escHtml(result.company)}</div>` : ''}
      </div>`;
    }

    // Recommendation banner
    html += `<div class="ats-recommendation-banner ${result.recommendationLevel}">
      <i class="fa-solid ${iconFor(result.recommendationLevel)}"></i>
      <span>${_escHtml(result.recommendation)}</span>
    </div>`;

    // Match grid
    html += `<div class="ats-match-grid">
      <div class="ats-match-card">
        <div class="ats-match-percent" style="color:${colorFor(result.atsScore)}">${result.atsScore}</div>
        <div class="ats-match-label">ATS Score</div>
      </div>
      <div class="ats-match-card">
        <div class="ats-match-percent" style="color:${colorFor(result.jobMatchPercent)}">${result.jobMatchPercent}%</div>
        <div class="ats-match-label">Job Match</div>
      </div>
      <div class="ats-match-card">
        <div class="ats-match-percent" style="color:${colorFor(result.skillMatch.percent)}">${result.skillMatch.percent}%</div>
        <div class="ats-match-label">Skill Match</div>
        <div class="ats-match-detail">${result.skillMatch.matched.length}/${result.skillMatch.total} skills</div>
      </div>
      <div class="ats-match-card">
        <div class="ats-match-percent" style="color:${colorFor(result.keywordMatch.percent)}">${result.keywordMatch.percent}%</div>
        <div class="ats-match-label">Keyword Match</div>
        <div class="ats-match-detail">${result.keywordMatch.matched.length}/${result.keywordMatch.total} keywords</div>
      </div>
      <div class="ats-match-card">
        <div class="ats-match-percent" style="color:${colorFor(result.experienceMatch.percent)}">${result.experienceMatch.percent}%</div>
        <div class="ats-match-label">Experience</div>
        <div class="ats-match-detail">${_escHtml(result.experienceMatch.detail || '').substring(0, 60)}</div>
      </div>
      <div class="ats-match-card">
        <div class="ats-match-percent" style="color:${colorFor(result.educationMatch.percent)}">${result.educationMatch.percent}%</div>
        <div class="ats-match-label">Education</div>
      </div>
      <div class="ats-match-card full-width">
        <div class="ats-match-percent" style="color:${colorFor(result.certificationMatch.percent)}">${result.certificationMatch.percent}%</div>
        <div class="ats-match-label">Certifications</div>
        <div class="ats-match-detail">${_escHtml(result.certificationMatch.detail || '')}</div>
      </div>
    </div>`;

    // Missing items sections
    if (result.missingSkills.length > 0) {
      html += _renderTagSection('Missing Skills', result.missingSkills, 'fa-screwdriver-wrench');
    }
    if (result.missingKeywords.length > 0) {
      html += _renderTagSection('Missing Keywords', result.missingKeywords.slice(0, 15), 'fa-key');
    }
    if (result.missingTechnologies.length > 0) {
      html += _renderTagSection('Missing Technologies', result.missingTechnologies, 'fa-microchip', 'tech');
    }
    if (result.missingCertifications.length > 0) {
      html += _renderTagSection('Missing Certifications', result.missingCertifications, 'fa-certificate');
    }

    container.innerHTML = html;
  }

  function _renderTagSection(title, tags, icon, tagClass) {
    return `
      <div class="ats-section" style="margin-top:12px">
        <div class="ats-section-header" data-toggle="${title.toLowerCase().replace(/\s/g, '')}">
          <h3><i class="fa-solid ${icon}" style="color:#f87171"></i> ${title}</h3>
          <div style="display:flex;align-items:center;gap:8px">
            <span class="section-count">${tags.length}</span>
            <i class="fa-solid fa-chevron-down ats-section-chevron"></i>
          </div>
        </div>
        <div class="ats-section-content">
          <div class="ats-section-inner">
            <div class="ats-tag-cloud">
              ${tags.map(t => `<span class="ats-tag ${tagClass || ''}">${_escHtml(t)}</span>`).join('')}
            </div>
          </div>
        </div>
      </div>
    `;
  }

  // ═══════════════════════════════════════════════════════════════════════════
  // JOB OPTIMIZATIONS RENDERER
  // ═══════════════════════════════════════════════════════════════════════════

  function _renderJobOptimizations(resumeData) {
    const container = document.getElementById('atsJobOptimizationsSection');
    if (!container || !_currentJobData || !window.ATSJobMatcher) return;

    const optimizations = window.ATSJobMatcher.getOptimizations(resumeData, _currentJobData);

    if (optimizations.length === 0) {
      container.innerHTML = '';
      return;
    }

    let html = `
      <div class="ats-section open">
        <div class="ats-section-header" data-toggle="jobopt">
          <h3><i class="fa-solid fa-wand-magic-sparkles" style="color:#a78bfa"></i> Job-Specific Optimizations</h3>
          <div style="display:flex;align-items:center;gap:8px">
            <span class="section-count">${optimizations.length}</span>
            <i class="fa-solid fa-chevron-down ats-section-chevron"></i>
          </div>
        </div>
        <div class="ats-section-content">
          <div class="ats-section-inner">
    `;

    optimizations.forEach(s => {
      html += _renderSuggestionCard(s);
    });

    html += `</div></div></div>`;
    container.innerHTML = html;
    _bindAccordions(container);
    _bindSuggestionActions(container);
  }

  // ═══════════════════════════════════════════════════════════════════════════
  // ACCORDION & INTERACTION BINDINGS
  // ═══════════════════════════════════════════════════════════════════════════

  function _bindAccordions(container) {
    container.querySelectorAll('.ats-section-header[data-toggle]').forEach(header => {
      header.addEventListener('click', () => {
        const section = header.closest('.ats-section');
        if (section) section.classList.toggle('open');
      });
    });
  }

  function _bindExpandableItems(container) {
    container.querySelectorAll('.ats-breakdown-item[data-expandable]').forEach(item => {
      item.addEventListener('click', () => {
        const wrapper = item.closest('.ats-breakdown-item-wrapper');
        if (wrapper) wrapper.classList.toggle('expanded');
      });
    });
  }

  function _bindSuggestionActions(container) {
    // Navigate to editor section
    container.querySelectorAll('.ats-suggestion-btn.navigate').forEach(btn => {
      btn.addEventListener('click', (e) => {
        e.stopPropagation();
        const section = btn.dataset.section;
        if (section) {
          close(); // Close ATS panel
          // Click the tab to navigate to the section
          const tabBtn = document.querySelector(`.tab-btn[data-tab="${section}"]`);
          if (tabBtn) {
            tabBtn.click();
            // Flash effect
            const panel = document.getElementById(`panel-${section}`);
            if (panel) {
              const h2 = panel.querySelector('h2, .section-title-input');
              if (h2) {
                h2.style.transition = 'none';
                h2.style.color = '#8b5cf6';
                h2.style.textShadow = '0 0 12px rgba(139, 92, 246, 0.5)';
                setTimeout(() => {
                  h2.style.transition = 'all 0.5s ease';
                  h2.style.color = '';
                  h2.style.textShadow = '';
                }, 600);
              }
            }
          }
        }
      });
    });

    // Apply skills
    container.querySelectorAll('.ats-suggestion-btn.apply-skill').forEach(btn => {
      btn.addEventListener('click', (e) => {
        e.stopPropagation();
        const skills = (btn.dataset.skills || '').split(',').filter(s => s.trim());
        if (skills.length === 0) return;

        const resumeData = window.resumeData;
        if (!resumeData) return;

        // Find the first skills section
        const skillsSection = (resumeData.sections || []).find(s => s.type === 'tags');
        if (skillsSection && skillsSection.categories && skillsSection.categories.length > 0) {
          // Add to first category
          const cat = skillsSection.categories[0];
          let added = 0;
          skills.forEach(skill => {
            const trimmed = skill.trim();
            if (trimmed && !cat.tags.includes(trimmed)) {
              cat.tags.push(trimmed);
              added++;
            }
          });

          if (added > 0) {
            // Trigger save and re-render
            if (window.saveState) window.saveState();
            if (window.renderEditor) window.renderEditor();

            // Update button to show success
            btn.innerHTML = '<i class="fa-solid fa-check"></i> Added!';
            btn.style.opacity = '0.6';
            btn.style.pointerEvents = 'none';

            // Refresh ATS analysis
            if (window.ATSEngine) window.ATSEngine.invalidateCache();
            if (window.ATSRecommendations) window.ATSRecommendations.invalidateCache();
            setTimeout(() => refresh(), 200);
          }
        }
      });
    });
  }

  // ═══════════════════════════════════════════════════════════════════════════
  // UTILITIES
  // ═══════════════════════════════════════════════════════════════════════════

  function _escHtml(str) {
    return String(str || '').replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
  }

  // ═══════════════════════════════════════════════════════════════════════════
  // PUBLIC API
  // ═══════════════════════════════════════════════════════════════════════════

  window.ATSUI = {
    init,
    toggle,
    open,
    close,
    refresh
  };

})();
