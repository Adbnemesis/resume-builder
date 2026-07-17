# Workspace Behavior Rules - Recruiter Email Outreach Agent

You must follow these rules strictly when managing recruiter lists and executing email outreach campaigns.

---

## 1. Contact Source of Truth

*   **User-Provided Database**: The user manually provides the recruiter details. Do not run any automated web scraping, browser extension automation, or Apollo MCP discovery to harvest contacts.
*   **Target File**: All recruiter contacts are maintained locally in [email_list.md](file:///Users/talus/Downloads/job_agent/personal_data/email_list.md).
*   **Google Sheet**: The local list is kept in sync with the Google Sheet (`1AvZJnRdimDyJ9UJjdKLiL5Rfi1ax_zCYkwvDSIFxgJg`) via [sync_sheets.py](file:///Users/talus/Downloads/job_agent/sync_sheets.py).

---

## 2. Outreach Workflow & Mandatory Consent

1.  **Read Contacts**: Inspect [email_list.md](file:///Users/talus/Downloads/job_agent/personal_data/email_list.md) to identify new contacts with `Discovered` status (or other pending status).
2.  **Safety Screening**: Filter out any contact matching the **Thoughtworks Protection** rule.
3.  **Obtain Explicit Consent**: **NEVER** automatically trigger email campaigns or execute sending scripts. Always list the target recipients (name, company, email) in chat and ask the user for explicit approval to run the outreach.
4.  **Execute Outreach**: Once approved, run the outreach campaign runner:
    ```bash
    python3 send_outreach_campaign.py
    ```
    *(Note: Pipe user confirmation into the script if it prompts for confirmation in the terminal: e.g., `yes y | python3 send_outreach_campaign.py`)*
5.  **Verify Synchronization**: Ensure the sending script successfully updates the local `email_list.md` status to `Sent (YYYY-MM-DD)` and triggers [sync_sheets.py](file:///Users/talus/Downloads/job_agent/sync_sheets.py) to sync changes to Google Sheets.
6.  **Check for Bounces**: Periodically scan the Gmail inbox for delivery failures, extract invalid addresses, flag them as `Outdated / Bounced`, and sync to Google Sheets:
    ```bash
    python3 check_bounces.py
    ```

---

## 3. Local Application & Testing Rules

*   **Chrome Profile**: When running/testing the local resume builder app, always use the Chrome profile for **anubhavtalus@gmail.com** (`Profile 1` at `/Users/talus/Library/Application Support/Google/Chrome/Profile 1/`).
*   **Gmail & Sheets Auth**: Ensure OAuth tokens (`gmail_token.json`, etc.) are maintained and refreshed securely.

---

## 4. Thoughtworks Protection (Strict Safe-list)

*   **NEVER** send emails or add recruiters associated with **Thoughtworks** to any outreach lists.
*   If a recruiter's company name or email domain contains the string `thoughtworks` (case-insensitive), immediately skip and exclude them from outreach.

---

## 5. Recruiter Validation & Data Integrity

*   **Data Integrity Check**: When reviewing user-provided lists or manual inputs, ensure:
    1.  The name is not "Unknown" (if possible, resolve or fallback to "Hiring Manager").
    2.  The email address is valid and properly formatted.
    3.  The company name is clean and matches the target list.

---

## 6. Gmail API Header Standards

*   Always format MIME message headers using proper casing: `To`, `From`, `Subject`.
*   Always set the `From` header to `'me'` when sending via OAuth to ensure SPF/DKIM verification passes.

---

## 7. Data Storage

*   **Local Database**: [email_list.md](file:///Users/talus/Downloads/job_agent/personal_data/email_list.md) — primary contact database.
*   **Google Sheet**: Synchronized with local database using [sync_sheets.py](file:///Users/talus/Downloads/job_agent/sync_sheets.py).
*   **Email Templates**: [Email_temp.md](file:///Users/talus/Downloads/job_agent/personal_data/Email_temp.md) — cold email templates for outreach.
