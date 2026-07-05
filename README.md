# Interactive Resume Builder

A premium, fully interactive, and responsive single-page resume editor web application. Built using modern client-side standards (HTML, CSS, JavaScript) to run completely locally in your browser.

> [!TIP]
> **Dynamic PDF Importing & Parsing**: You can import existing PDF resumes directly! Click the **Import PDF** button in the header, select a `.pdf` file containing a clear text layer, and our client-side parsing engine (powered by Mozilla PDF.js) will extract details (Name, Contact, Education, Experience, Skills, Projects, and Certificates) and organize the text into the editor sections automatically.

---

## Features

1. **Real-time WYSIWYG Synchronization**: As you type inside the editor dashboard, the resume canvas renders the results instantly.
2. **Interactive Preview Reordering (Drag-and-Drop)**:
   * Hover over any section in the A4 resume preview to show its drag handle.
   * Drag sections directly on the preview to rearrange their layout order, which syncs back to the editor sidebar instantly.
3. **Dynamically Extensible Custom Sections**:
   * Add custom sections (e.g. "Achievements", "Summary", "Publications") inside the Layout settings panel. Custom sections support dynamic item lists, descriptions, and drag reordering.
4. **Dynamic Bullet Points Support**:
   * All list-based sections (Education, Projects, Experience, Certifications, and Custom Sections) support custom bullet points. You can add, edit, or remove highlights for any item.
5. **Rich Text Formatting (Markdown, Toolbars & Shortcuts)**:
   * **Formatting Toolbar**: Use inline formatting buttons next to inputs and highlights to easily insert markdown formatting:
     * **Bold**: `**text**` $\rightarrow$ **Bold**
     * *Italics*: `*text*` $\rightarrow$ *Italic*
     * <u>Underline</u>: `~text~` $\rightarrow$ <u>Underline</u>
     * 🔗 Link: `[text](url)` $\rightarrow$ [link text](https://example.com)
     * Headings: `# Heading 1`, `## Heading 2`, `### Heading 3` (supported at the start of input lines)
   * **Keyboard Shortcuts**: Native support for **Ctrl+B / Cmd+B** (Bold), **Ctrl+I / Cmd+I** (Italic), and **Ctrl+U / Cmd+U** (Underline) inside any text input field.
6. **Pixel-Perfect Print-Scaling Fitting**:
   * Fixed screen preview A4 page dimensions match your print A4 boundaries.
   * An **automatic scaling container** wrapper measures the height of your text. If your content exceeds the page height (e.g., when adding an extra section), it automatically scales down the inner content to fit exactly on a single page, keeping the outer A4 margins perfectly aligned with the margins of the printed sheet.
7. **Four Premium Themes**:
   * **Classic Standard (Original)**: Matches standard, minimalist resumes with thin solid black dividers, bold durations, and underlined project titles.
   * **Modern Minimalist**: Clean layout with left-aligned sections and primary accent colors.
   * **Executive Elegance**: Centered headers and traditional serif typography.
   * **Tech Focus**: Compact spacing, monospace accents, and badge-like tags for coding skills.
8. **Portable JSON Backups**: Import/Export feature saves and restores your progress locally via standard `.json` configuration files.

---

## How to Run the App

Since the app is entirely client-side, you can open and run it locally:

### Option A: Double-Click the File
1. Open the [editable_resume/](editable_resume/) folder.
2. Double-click [index.html](editable_resume/index.html) to load the editor directly in your web browser.

### Option B: Local Web Server (Recommended)
Running a local web server allows the app to automatically detect and load your private personal data.

#### How to Start the Server:
1. Run this command in your project root:
   ```bash
   python3 -m http.server 8080 --directory editable_resume/
   ```
2. Navigate to [http://localhost:8080](http://localhost:8080) in your browser.

#### How to Stop the Server:
* In the terminal where the server is running, press **`Ctrl + C`**.
* If the server was sent to the background or port `8080` is locked, you can free the port and stop the server by running:
  ```bash
  kill $(lsof -t -i:8080)
  ```

#### How to Restart the Server:
1. Free port `8080` using the stop instructions above.
2. Re-run the start command:
   ```bash
   python3 -m http.server 8080 --directory editable_resume/
   ```

---

## How to Save as PDF (Print Options)

When exporting your resume via browser print (`Cmd + P` / `Ctrl + P` or the **PDF** print button):
1. **Destination**: Select **Save as PDF**.
2. **Margins**: Set to **None** (this allows the resume builder's CSS to take full edge-to-edge control of the sheet).
3. **Headers and footers**: **Uncheck** this box (having it checked reserves margins at the top and bottom for URLs/dates, which breaks page height constraints).
4. **Background graphics**: **Check** this box (this forces the browser to print colored markers, custom lines, and visual accents).

---

## Google Sheets Application Management

The application features a Google Sheets integration to sync and manage your job applications automatically:

* **Spreadsheet ID**: `1AvZJnRdimDyJ9UJjdKLiL5Rfi1ax_zCYkwvDSIFxgJg`
* **Features**:
  * **Automated Sync**: Appends new jobs with details (Company, Title, Location, Salary, WLB, ATS Score, Link) and sets status to `"Not Applied"`.
  * **Duplicate Prevention**: Reads existing listings from the sheet first and only adds newly discovered jobs (so you don't repeat applications).
  * **Token Re-use**: The authenticated session is stored securely in your local environment, meaning subsequent runs will sync instantly without prompting for login.
* **Sync command**:
  Run this command in the project root to synchronize your latest CSV results to Google Sheets:
  ```bash
  python3 -u sync_sheets.py
  ```

---

## Data Privacy & Git Ignoring

To prevent exposing private information (like your phone number, email address, and job search metrics) on public GitHub repositories, this project splits data into two files:

1. **`resume_data.json` (Tracked by Git)**: Contained inside the repository, filled with safe, generic placeholders.
2. **`local_resume_data.json` (Ignored by Git)**: Ignored by `.gitignore`. You can put your actual personal resume details here.

### How the Data Loads:
* **Priority 1**: The application first reads active session data stored in your browser's `localStorage` (changes are saved automatically as you edit).
* **Priority 2**: If no session is found, it attempts to load your private data from `local_resume_data.json` (requires serving the app via localhost).
* **Priority 3**: If it cannot fetch your private file, it loads the public placeholders.
* **Manual Import**: You can click the **Import** button in the header at any time to upload a `.json` backup of your real resume details directly into browser memory.

---

## ATS Resume Analyzer

We have integrated a **production-ready client-side ATS Resume Analyzer** directly into the editor and live preview. 

### Features:
1. **General ATS Score**: Calculated instantly across 16 categories using weighted metrics (Action Verbs, Quantifiable Achievements, Structure, Keywords). Click the score widget in the header to open the analysis panel.
2. **Prioritized Recommendations**: View high, medium, and low-priority suggestions with estimated score increases. Click "Show in Editor" to navigate directly to the field or "Add Skills" to auto-apply missing tags.
3. **Job-Specific Matching**: Paste a job description or provide a URL (fetched via CORS proxies). The analyzer compares requirements to generate match percentages (Skill, Keyword, Experience, Education) and missing items (Skills, Technologies, Keywords).
4. **Auto-refresh**: Scoring updates in real-time as you type, with caching to maintain performance.

