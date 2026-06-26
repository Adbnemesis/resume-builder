# Interactive Resume Builder

A premium, fully interactive, and responsive single-page resume editor web application. Built using modern client-side standards (HTML, CSS, JavaScript) to run completely locally in your browser.

> [!TIP]
**Dynamic PDF Importing & Parsing**: You can import existing PDF resumes directly! Click the **Import PDF** button in the header, select a `.pdf` file containing a clear text layer, and our client-side parsing engine (powered by Mozilla PDF.js) will extract and organize the text into the editor sections automatically.

## Features

1. **Real-time Synchronization**: As you type inside the editor dashboard, the resume canvas renders the results instantly.
2. **Visual Style Controls**:
   * **Theme Templates**: Toggle between **Modern Minimalist**, **Executive Elegance** (traditional centered layout), and **Tech Focus** (uses color badges for coding skills).
   * **Typography Selection**: Change between serif, sans-serif, and monospace font faces (Inter, Outfit, Roboto, Playfair Display, Fira Code).
   * **Custom Accents**: Custom color pickers and rapid preset selectors.
   * **Adjustable Spacing**: Slide controls to customize margins (A4 paddings), line spacing, and section margins.
3. **Print to PDF Optimization**: Uses native browser print media queries (`Cmd+P` / `Ctrl+P`) configured to automatically hide the editor panel, strip browser margins, hide headers/footers, and print a clean page.
4. **Interactive Navigation**: Clicking on any resume element on the A4 page preview focuses the corresponding editor tab and flashes the heading to guide your edits.
5. **Portable JSON Backups**: Import/Export feature saves and restores your progress locally via standard `.json` configuration files.
6. **Dynamic PDF Parsing**: Extract details (Name, Contact, Education, Experience, Skills, Projects, and Certificates) directly from existing PDF resumes client-side using Mozilla PDF.js.

---

## How to Run the App

Since the app is entirely client-side, you can open and run it locally:

### Option A: Double-Click the File
1. Open the `editable_resume` folder.
2. Double-click [index.html](editable_resume/index.html) to load the editor directly in your web browser (Chrome, Safari, Firefox).

### Option B: Local Web Server (Recommended)
Running a local web server allows the app to automatically detect and load your private personal data.
1. Run this command in your project root:
   ```bash
   python3 -m http.server 8080 --directory editable_resume/
   ```
2. Navigate to `http://localhost:8080` in your browser.

---

## Data Privacy & Git Ignoring

To prevent exposing private information (like your phone number, email address, and job search metrics) on public GitHub repositories, this project splits data into two files:

1. **`resume_data.json` (Tracked by Git)**: Contained inside the repository, filled with safe, generic placeholders (e.g. `YOUR NAME`, `your.email@example.com`).
2. **`local_resume_data.json` (Ignored by Git)**: Ignored by `.gitignore`. You can put your actual personal resume details here.

### How the Data Loads:
* **Priority 1**: The application first reads any active session data stored in your browser's `localStorage` (your changes are saved automatically as you edit).
* **Priority 2**: If no session is found, it attempts to load your private data from `local_resume_data.json` (requires serving the app via localhost).
* **Priority 3**: If it cannot fetch your private file (e.g., if opened via `file://` CORS restrictions or the file is missing), it loads the public placeholders.
* **Manual Import**: You can click the **Import** button in the header at any time to upload a `.json` backup of your real resume details directly into browser memory.
