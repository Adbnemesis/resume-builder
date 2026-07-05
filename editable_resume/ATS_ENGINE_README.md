# ATS Resume Analyzer — Engine & Integration Documentation

This directory contains the client-side ATS Resume Analyzer, which replicates Applicant Tracking Systems (ATS) to score resumes, generate improvement suggestions, and match resumes against job descriptions.

---

## Folder & Code Structure

The ATS analyzer is designed as a modular, decoupled set of scripts loaded in the browser.

- **`ats-engine.js`**: Core scoring logic. Contains the weighted scoring algorithms for 16 categories, as well as the technical keyword dictionary and action verb databases.
- **`ats-recommendations.js`**: Analyzes the resume's weaknesses and missing fields, generating prioritized recommendations with estimated score improvements.
- **`ats-job-parser.js`**: Parses pasted job descriptions or fetches them from a URL using CORS proxies to extract required skills, technologies, experience, education, and soft skills.
- **`ats-job-matcher.js`**: Tailors recommendations to a specific job description, calculating skill, keyword, experience, and certification matches.
- **`ats-ui.js`**: Controls the slide-out panel on the right sidebar. Renders the interactive scores, accordion breakdowns, suggestion lists, and job matching inputs.
- **`ats-panel.css`**: Styling rules for the slide-out panel, SVG circular score indicators, badges, and tab navigation.

---

## ATS Scoring Engine (`ats-engine.js`)

The engine calculates a score from **0 to 100** by evaluating 16 categories:

| Category | Weight | Evaluation Criteria |
| :--- | :---: | :--- |
| **Resume Structure** | 8 | Verifies section counts and expects standard section names. |
| **ATS Formatting** | 6 | Checks for problematic characters, symbols, or tab layouts. |
| **Contact Information** | 8 | Checks for presence of name, professional email, phone, location, LinkedIn, and GitHub. |
| **Section Completeness** | 7 | Verifies that all core sections are filled with content. |
| **Professional Summary** | 5 | Checks for a concise, keyword-rich summary statement (50-150 words). |
| **Skills** | 8 | Scores skill count, technical classification, and relevance. |
| **Experience** | 12 | Evaluates job counts, dates, titles, and descriptions. |
| **Projects** | 7 | Examines the quantity, description depth, and technology stack of projects. |
| **Education** | 6 | Validates presence of degrees, institutions, graduation dates, and GPA/grades. |
| **Certifications** | 4 | Rewards professional credentials and licenses. |
| **Action Verbs** | 8 | Checks if bullet points start with strong action verbs (e.g., *designed*, *pioneered*). |
| **Quantifiable Achievements** | 10 | Looks for metrics, percentages, dollar amounts, and counts in bullets. |
| **Keyword Quality** | 6 | Matches content against a built-in database of 500+ technical terms. |
| **Grammar & Consistency** | 5 | Checks punctuation consistency and verb tense alignment. |
| **Readability** | 4 | Filters out first-person pronouns and checks line length/jargon density. |
| **Overall ATS Compatibility** | 6 | Aggregates structure, volume, and completeness signals. |

**Total Score calculation:**  
$$\text{Score} = \text{round}\left( \frac{\sum (\text{Category Score} \times \text{Weight})}{\text{Total Weight}} \right)$$

---

## Recommendation Engine (`ats-recommendations.js`)

Generates prioritized suggestions. Each suggestion follows this schema:
```javascript
{
  id: "unique-suggestion-id",
  category: "Experience",
  priority: "high" | "medium" | "low",
  issue: "Problem description",
  impact: "Why it matters to ATS/recruiters",
  fix: "Exactly how to fix it",
  section: "sectionIdToNavigateTo",
  itemIndex: 0,
  highlightIndex: 2,
  estimatedGain: 3, // Points added to overall score when fixed
  type: "content" | "structure" | "formatting" | "keyword"
}
```

---

## Job Description Parser & Matcher

### Parser (`ats-job-parser.js`)
1. **Pasted Text**: Splits input by header patterns to categorize sections (Requirements, Responsibilities, Preferred, etc.) and uses regex patterns to extract years of experience, degree titles, and soft skills.
2. **URLs**: Fetches URLs using a list of CORS proxies (`allorigins.win`, `corsproxy.io`, `codetabs.com`). It strips navigation, script, and style tags to parse requirements directly.

### Matcher (`ats-job-matcher.js`)
Compares the resume against the parsed job description using a weighted composite score:
* **Skill Match (30%)**: Matches resume tags against the job description's extracted skills.
* **Keyword Match (25%)**: Matches general keywords.
* **Experience Match (15%)**: Compares parsed experience years against candidate's timeline.
* **Education Match (10%)**: Compares degree level requirements (Bachelor's, Master's, PhD).
* **Certification Match (10%)**: Checks for required certifications.
* **Responsibility Match (10%)**: Checks bullet points alignment.

---

## Public APIs

The modules expose their APIs globally on `window`:

### `window.ATSEngine`
* `analyze(resumeData)`: Returns `{ score, confidence, breakdown, strengths, weaknesses }`
* `getScore(resumeData)`: Returns number `0-100`
* `updateWidget()`: Redraws the widget in the editor header
* `invalidateCache()`: Clears the analysis cache

### `window.ATSRecommendations`
* `generate(resumeData)`: Returns an array of up to 25 prioritized suggestions
* `getTopSuggestions(resumeData, count)`: Returns top N suggestions

### `window.ATSJobParser`
* `parse(text)`: Synchronously parses raw text into a structured job description object
* `fetchAndParse(url)`: Asynchronously fetches a URL via proxy and parses it

### `window.ATSJobMatcher`
* `match(resumeData, parsedJob)`: Computes the overall match score and returns lists of missing tags
* `getOptimizations(resumeData, parsedJob)`: Returns job-specific recommendation cards

---

## Testing Strategy & Verification

To verify the integration:
1. Open the developer console.
2. Run `window.ATSEngine.analyze(window.resumeData)` to verify the object output structure.
3. Paste a job posting into the Match tab to verify skill and keyword extraction.
4. Verify that changing any input field updates the general ATS score widget in real-time.
