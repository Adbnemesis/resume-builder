import os
import sys
import json
import csv
import re
from datetime import datetime
from google.auth.transport.requests import Request
from google.oauth2.credentials import Credentials
from google_auth_oauthlib.flow import InstalledAppFlow
from googleapiclient.discovery import build

sys.stdout.reconfigure(encoding='utf-8', newline='\n')

SCOPES = ['https://www.googleapis.com/auth/spreadsheets']
SPREADSHEET_ID = '1AvZJnRdimDyJ9UJjdKLiL5Rfi1ax_zCYkwvDSIFxgJg'
CREDENTIALS_FILE = './google_sheet_credentials.json'
TOKEN_FILE = '/Users/talus/.gemini/antigravity-ide/brain/fc235cc2-a94c-4329-aace-10322a424428/scratch/token.json'
JOBS_CSV = './job_results.csv'
EMAIL_LIST_MD = './personal_data/email_list.md'

def parse_email_list(file_path):
    """Parses email records from email_list.md."""
    records = []
    if not os.path.exists(file_path):
        return records
        
    with open(file_path, "r", encoding="utf-8") as f:
        lines = f.readlines()
        
    for line in lines:
        line = line.strip()
        if not line or line.startswith("#") or line.startswith("|-") or line.startswith("| -"):
            continue
            
        # Check if it's already a markdown table line
        if line.startswith("|"):
            parts = [p.strip() for p in line.split("|")]
            # Table format: | Empty | Company | Email | Status | Response | Empty |
            if len(parts) >= 5 and parts[1] != "Company" and not parts[1].startswith("---"):
                company = parts[1]
                emails = [e.strip() for e in re.split(r'[,; ]+', parts[2]) if e.strip() and "@" in e]
                for email in emails:
                    records.append({
                        "company": company,
                        "email": email,
                        "status": parts[3] if len(parts) > 3 else "Discovered",
                        "response": parts[4] if len(parts) > 4 else "No"
                    })
        else:
            # Text format: Company - email1, email2
            parts = re.split(r'\s*-\s*|\s*-\s*', line, maxsplit=1)
            if len(parts) == 2:
                company = parts[0].strip()
                emails = [e.strip() for e in re.split(r'[,; ]+', parts[1]) if e.strip() and "@" in e]
                for email in emails:
                    records.append({
                        "company": company,
                        "email": email,
                        "status": "Discovered",
                        "response": "No"
                    })
    return records

def write_email_list_markdown(file_path, records):
    """Writes the synchronized email list back to email_list.md as a clean table."""
    # Deduplicate records by (company, email) keeping the most advanced status
    unique_records = {}
    for r in records:
        key = (r["company"], r["email"])
        if key not in unique_records:
            unique_records[key] = r
        else:
            # Overwrite only if status is more descriptive than "Discovered"
            if r["status"] != "Discovered":
                unique_records[key]["status"] = r["status"]
            if r["response"] != "No":
                unique_records[key]["response"] = r["response"]

    sorted_records = sorted(unique_records.values(), key=lambda x: (x["company"].lower(), x["email"].lower()))

    # Ensure target folder exists
    os.makedirs(os.path.dirname(file_path), exist_ok=True)

    with open(file_path, "w", encoding="utf-8") as f:
        f.write("# Recruiter Outreach List\n\n")
        f.write("| Company | Recruiter Email | Outreach Status | Got Response? |\n")
        f.write("|---|---|---|---|\n")
        for r in sorted_records:
            f.write(f"| {r['company']} | {r['email']} | {r['status']} | {r['response']} |\n")
            
    print(f"Formatted and updated local '{file_path}' with latest sheet statuses.")

def main():
    creds = None
    if os.path.exists(TOKEN_FILE):
        try:
            creds = Credentials.from_authorized_user_file(TOKEN_FILE, SCOPES)
        except Exception:
            pass

    if not creds or not creds.valid:
        if creds and creds.expired and creds.refresh_token:
            try:
                creds.refresh(Request())
            except Exception:
                creds = None
        
        if not creds:
            flow = InstalledAppFlow.from_client_secrets_file(CREDENTIALS_FILE, SCOPES)
            creds = flow.run_local_server(port=0, open_browser=True)
            
        with open(TOKEN_FILE, 'w') as token:
            token.write(creds.to_json())

    service = build('sheets', 'v4', credentials=creds)
    sheet_service = service.spreadsheets()

    # --- Part 1: Sync Job Listings to Sheet1 ---
    sheet_name = 'Sheet1'
    try:
        result = sheet_service.values().get(
            spreadsheetId=SPREADSHEET_ID,
            range=f"'{sheet_name}'!A:K"
        ).execute()
    except Exception as e:
        print(f"Sheet1 fetch failed: {e}. Fetching first sheet name...")
        spreadsheet_info = sheet_service.get(spreadsheetId=SPREADSHEET_ID).execute()
        sheet_name = spreadsheet_info['sheets'][0]['properties']['title']
        result = sheet_service.values().get(
            spreadsheetId=SPREADSHEET_ID,
            range=f"'{sheet_name}'!A:K"
        ).execute()

    rows = result.get('values', [])
    headers = ["Job ID", "Company", "Job Title", "Location", "Salary (Est)", "WLB", "ATS Score", "Date Posted", "Date Discovered", "Status", "LinkedIn Link"]

    if not rows:
        body = {'values': [headers]}
        sheet_service.values().update(
            spreadsheetId=SPREADSHEET_ID,
            range=f"'{sheet_name}'!A1",
            valueInputOption='USER_ENTERED',
            body=body
        ).execute()
        rows = [headers]
        print(f"Initialized headers in sheet '{sheet_name}'.")

    existing_job_ids = set()
    for row in rows[1:]:
        if len(row) > 0:
            existing_job_ids.add(row[0].strip())

    if os.path.exists(JOBS_CSV):
        new_rows = []
        current_date = datetime.now().strftime("%Y-%m-%d")

        with open(JOBS_CSV, "r", encoding="utf-8") as f:
            reader = csv.DictReader(f)
            for row in reader:
                link = row.get("LinkedIn Link", "")
                job_id = None
                if "view/" in link:
                    job_id = link.split("view/")[-1].split("?")[0].strip()
                if not job_id:
                    job_id = str(hash(row.get("Company", "") + row.get("Job Title", "")))

                if job_id not in existing_job_ids:
                    new_rows.append([
                        job_id,
                        row.get("Company", ""),
                        row.get("Job Title", ""),
                        row.get("Location", ""),
                        row.get("Salary (Actual/Estimated)", ""),
                        row.get("Work-Life Balance Rating", ""),
                        row.get("ATS Score", ""),
                        row.get("Date Posted", ""),
                        current_date,
                        "Not Applied",
                        link
                    ])

        if new_rows:
            body = {'values': new_rows}
            sheet_service.values().append(
                spreadsheetId=SPREADSHEET_ID,
                range=f"'{sheet_name}'!A:K",
                valueInputOption='USER_ENTERED',
                insertDataOption='INSERT_ROWS',
                body=body
            ).execute()
            print(f"Appended {len(new_rows)} new job listings to Google Sheet '{sheet_name}'.")
        else:
            print("No new job listings to add.")
    else:
        print(f"Jobs CSV not found at {JOBS_CSV}, skipping jobs sync.")

    # --- Part 2: Sync Recruiter Emails to 'Recruiters' tab ---
    rec_sheet_name = 'Recruiters'
    spreadsheet_info = sheet_service.get(spreadsheetId=SPREADSHEET_ID).execute()
    existing_sheets = [s['properties']['title'] for s in spreadsheet_info['sheets']]
    
    if rec_sheet_name not in existing_sheets:
        print(f"Creating new sheet tab '{rec_sheet_name}'...")
        batch_update_request_body = {
            'requests': [{
                'addSheet': {
                    'properties': {
                        'title': rec_sheet_name
                    }
                }
            }]
        }
        sheet_service.batchUpdate(
            spreadsheetId=SPREADSHEET_ID,
            body=batch_update_request_body
        ).execute()

    # Fetch recruiter rows from sheet
    result_rec = sheet_service.values().get(
        spreadsheetId=SPREADSHEET_ID,
        range=f"'{rec_sheet_name}'!A:E"
    ).execute()
    
    rec_rows = result_rec.get('values', [])
    rec_headers = ["Company", "Email", "Status", "Date Sent", "Response Received"]
    
    if not rec_rows:
        body = {'values': [rec_headers]}
        sheet_service.values().update(
            spreadsheetId=SPREADSHEET_ID,
            range=f"'{rec_sheet_name}'!A1",
            valueInputOption='USER_ENTERED',
            body=body
        ).execute()
        rec_rows = [rec_headers]
        print(f"Initialized headers in sheet '{rec_sheet_name}'.")

    # Map sheet emails to their metadata
    sheet_data = {}
    for row in rec_rows[1:]:
        if len(row) >= 2:
            company = row[0].strip()
            email = row[1].strip()
            status = row[2].strip() if len(row) > 2 else "Discovered"
            date_sent = row[3].strip() if len(row) > 3 else "-"
            response = row[4].strip() if len(row) > 4 else "No"
            # Ignore bad entries that were formatted poorly
            if "databricks.comQualcomm" in email or (company.lower() == "databricks" and email.lower() == "pnikhade@qualcomm.com"):
                continue
            sheet_data[(company.lower(), email.lower())] = {
                "company": company,
                "email": email,
                "status": status,
                "date_sent": date_sent,
                "response": response
            }

    # Load local records
    local_records = parse_email_list(EMAIL_LIST_MD)
    print(f"Parsed {len(local_records)} local email contacts from '{EMAIL_LIST_MD}'.")

    # Merge records
    all_records_map = {}
    for r in local_records:
        key = (r["company"].lower(), r["email"].lower())
        all_records_map[key] = {
            "company": r["company"],
            "email": r["email"],
            "status": r["status"],
            "response": r["response"]
        }
        
    for key, val in sheet_data.items():
        if key not in all_records_map:
            all_records_map[key] = {
                "company": val["company"],
                "email": val["email"],
                "status": val["status"],
                "response": val["response"]
            }
        else:
            # Keep the more advanced status between local and sheet
            local_status = all_records_map[key]["status"]
            sheet_status = val["status"]
            
            if "sent" in sheet_status.lower() or "got" in sheet_status.lower():
                all_records_map[key]["status"] = sheet_status
            elif "sent" in local_status.lower() or "got" in local_status.lower():
                all_records_map[key]["status"] = local_status
            else:
                all_records_map[key]["status"] = sheet_status
                
            # Prioritize response if either is marked Yes
            if val["response"].lower() == "yes" or all_records_map[key]["response"].lower() == "yes":
                all_records_map[key]["response"] = "Yes"

    sorted_records = sorted(all_records_map.values(), key=lambda x: (x["company"].lower(), x["email"].lower()))

    # Clear existing sheet values under headers
    print("Clearing old rows from Google Sheet...")
    sheet_service.values().clear(
        spreadsheetId=SPREADSHEET_ID,
        range=f"'{rec_sheet_name}'!A2:E1000"
    ).execute()

    # Write clean merged records
    sheet_rows = []
    for r in sorted_records:
        sheet_rows.append([
            r["company"],
            r["email"],
            r["status"],
            "-",
            r["response"]
        ])
        
    if sheet_rows:
        body = {'values': sheet_rows}
        sheet_service.values().update(
            spreadsheetId=SPREADSHEET_ID,
            range=f"'{rec_sheet_name}'!A2",
            valueInputOption='USER_ENTERED',
            body=body
        ).execute()
        print(f"Successfully synced {len(sheet_rows)} recruiter rows to Google Sheet '{rec_sheet_name}'.")

    # Write back clean structured list locally
    write_email_list_markdown(EMAIL_LIST_MD, sorted_records)

if __name__ == '__main__':
    main()
