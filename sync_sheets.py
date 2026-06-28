import os
import sys
import json
import csv
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

    # 1. Fetch sheet name and details
    sheet_name = 'Sheet1'
    try:
        result = sheet_service.values().get(
            spreadsheetId=SPREADSHEET_ID,
            range='Sheet1!A:K'
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

    # 2. Initialize sheet headers if empty
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

    # Get existing Job IDs to prevent duplicate inserts
    existing_job_ids = set()
    for row in rows[1:]:
        if len(row) > 0:
            existing_job_ids.add(row[0].strip())

    # 3. Read current jobs from CSV
    if not os.path.exists(JOBS_CSV):
        print(f"Jobs CSV not found at {JOBS_CSV}")
        return

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

    # 4. Append new rows to sheet
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
        print("No new job listings to add (all existing entries are up-to-date).")

if __name__ == '__main__':
    main()
