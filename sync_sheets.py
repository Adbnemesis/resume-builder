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

# Priority 1: Elite Tier 1 Product MNCs, Tech Giants, HFT/Quant, Top FinTechs & Tier 1 Unicorns (40L - 1Cr+)
PRIORITY_1_KEYWORDS = [
    'google', 'microsoft', 'amazon', 'meta', 'facebook', 'apple', 'netflix', 'uber',
    'linkedin', 'atlassian', 'adobe', 'salesforce', 'servicenow', 'intuit', 'paypal',
    'stripe', 'databricks', 'snowflake', 'rubrik', 'twilio', 'palantir', 'nutanix',
    'dropbox', 'github', 'splunk', 'crowdstrike', 'okta', 'palo alto', 'cloudflare',
    'pure storage', 'arista', 'nvidia', 'broadcom', 'cohesity', 'zscaler', 'sentinelone',
    'hashicorp', 'confluent', 'elastic', 'mongodb', 'redis', 'singlestore', 'cockroach',
    'clickhouse', 'datadog', 'grafana', 'sentry', 'vercel', 'airbnb', 'booking.com',
    'glean', 'postman',
    'tower research', 'quadeye', 'graviton', 'worldquant', 'de shaw', 'citadel',
    'jump trading', 'jane street', 'hudson river', 'two sigma', 'optiver',
    'morgan stanley', 'goldman sachs', 'jpmorgan', 'jpmc', 'american express', 'amex',
    'capital one',
    'swiggy', 'zomato', 'blinkit', 'flipkart', 'zepto', 'meesho', 'razorpay',
    'phonepe', 'cred', 'groww', 'zerodha', 'dream11', 'games24x7', 'browserstack'
]

# Priority 2: Tier 2 Product MNCs, Tech Unicorns, Global Banks, Semiconductor, GCCs (25L - 50L+)
PRIORITY_2_KEYWORDS = [
    'delhivery', 'oyo', 'makemytrip', 'goibibo', 'cleartrip', 'ixigo', 'redbus',
    'rapido', 'ola', 'blusmart', 'ather', 'spinny', 'cars24', 'cardekho',
    'paytm', 'mobikwik', 'cashfree', 'juspay', 'setu', 'slice', 'navi',
    'bharatpe', 'onecard', 'coindcx', 'coinswitch', 'payu', 'angel one', 'upstox',
    'barclays', 'deutsche bank', 'ubs', 'standard chartered', 'hsbc', 'wells fargo',
    'bny mellon', 'bank of america', 'fidelity', 'blackrock', 'citi', 'mastercard',
    'visa', 'dbs bank', 'pine labs', 'perfios',
    'autodesk', 'dassault', 'cisco', 'oracle', 'vmware', 'sap', 'workday',
    'godaddy', 'agoda', 'expedia', 'devrev', 'gupshup', 'zupee', 'winzo', 'mpl',
    'unifyapps', 'astrotalk', 'pegasystems', 'genesys', 'nice', 'fortinet',
    'checkpoint', 'qualys', 'cyberark', 'sailpoint', 'ansys', 'ptc', 'teradata',
    'informatica', 'akamai', 'netapp', 'juniper', 'dell', 'hp', 'hpe',
    'qualcomm', 'intel', 'amd', 'texas instruments', 'ti.com', 'arm', 'nxp',
    'mediatek', 'micron', 'western digital', 'synopsys', 'cadence',
    'tata 1mg', 'pharmeasy', 'apollo 247', 'practo', 'cult.fit', 'unacademy',
    'physicswallah', 'zetwerk', 'moglix', 'ofbusiness', 'licious', 'apna',
    'hackerrank', 'airtel', 'jio', 'tataneu', 'tata digital', 'walmart', 'target',
    'tesco', 'lowe\'s',
    'honeywell', '3m', 'mmm.com', 'siemens', 'bosch', 'schneider', 'abb',
    'rockwell', 'volvo', 'mercedes', 'mbrdi', 'bmw', 'ford', 'gm', 'boeing',
    'airbus', 'philips'
]

def clean_company_name(comp):
    c = comp.strip()
    prefixes = [
        r'^\(India\)', r'^\(HR\)', r'^\(CHRO\)', r'^\(HR Support\)',
        r'^Acquisition\s*', r'^Head HR\s*', r'^Director\s*', r'^VP\s*',
        r'^Sr\.\s*', r'^Associate\s*', r'^Global\s*', r'^Group\s*', r'^& Art\s*', r'^& Consultants\s*',
        r'^& HRElement\s*', r'^& Security\s*'
    ]
    for p in prefixes:
        c = re.sub(p, '', c, flags=re.IGNORECASE).strip()
    return c

def matches_keyword(keyword, comp_clean, domain_name):
    # Exact match on domain
    if keyword == domain_name:
        return True
    # Word boundary match in cleaned company name
    pattern = r'\b' + re.escape(keyword) + r'\b'
    if re.search(pattern, comp_clean):
        return True
    return False

def get_alignment_priority(company_name, email):
    c_clean = clean_company_name(company_name).lower()
    e_lower = email.lower()
    domain = e_lower.split('@')[-1] if '@' in e_lower else ''
    domain_name = domain.split('.')[0] if '.' in domain else domain

    # Priority 1: Elite Tier 1 Product & AI/FinTech Giants
    for k in PRIORITY_1_KEYWORDS:
        if matches_keyword(k, c_clean, domain_name):
            return 1, 'Priority 1 (Tier 1 Product / FinTech / HFT)'

    # Priority 2: Tier 2 Product Unicorns & GCCs
    for k in PRIORITY_2_KEYWORDS:
        if matches_keyword(k, c_clean, domain_name):
            return 2, 'Priority 2 (Tier 2 Product Unicorn / GCC / FinTech)'

    # AI / Developer Product Startup domains (.ai, .io, .dev)
    if domain.endswith('.ai') or domain.endswith('.io') or domain.endswith('.dev'):
        return 2, 'Priority 2 (AI / Developer SaaS Startup)'

    # Priority 3: Digital Engineering Studios & Specialized Consultancies
    return 3, 'Priority 3 (Digital Engineering Studio / Specialized Tech)'

def parse_email_list(file_path):
    """Parses email records from email_list.md using the 8-column format."""
    records = []
    if not os.path.exists(file_path):
        return records
        
    with open(file_path, "r", encoding="utf-8") as f:
        lines = f.readlines()
        
    for line in lines:
        line = line.strip()
        if not line or line.startswith("#") or line.startswith("|-") or line.startswith("| -"):
            continue
            
        if line.startswith("|"):
            parts = [p.strip() for p in line.split("|")]
            if len(parts) >= 8 and parts[1] != "Company" and not parts[1].startswith("---"):
                company = parts[1]
                name = parts[2]
                emails = [e.strip() for e in re.split(r'[,; ]+', parts[3]) if e.strip() and "@" in e]
                role = parts[4] if len(parts) > 4 else "Recruiter"
                url = parts[5] if len(parts) > 5 else "N/A"
                status = parts[6] if len(parts) > 6 else "Discovered"
                reply = parts[7] if len(parts) > 7 else "No"
                followup = parts[8] if len(parts) > 8 else "No"
                for email in emails:
                    records.append({
                        "company": company,
                        "name": name if name else "Unknown",
                        "email": email,
                        "role": role if role else "Recruiter",
                        "url": url if url else "N/A",
                        "status": status if status else "Discovered",
                        "response": reply if reply else "No",
                        "followup": followup if followup else "No"
                    })
    return records

def write_email_list_markdown(file_path, records):
    """Formats and writes records into a clean Markdown table."""
    sorted_records = sorted(
        records,
        key=lambda x: (
            get_alignment_priority(x["company"], x["email"])[0],
            clean_company_name(x["company"]).lower(),
            x["company"].lower(),
            x["email"].lower()
        )
    )
    
    with open(file_path, "w", encoding="utf-8") as f:
        f.write("# Recruiter Outreach List\n\n")
        f.write("| Company | Name | Recruiter Email | Role | LinkedIn Profile | Outreach Status | Reply Status | Follow on sent? |\n")
        f.write("|---|---|---|---|---|---|---|---|\n")
        for r in sorted_records:
            f.write(f"| {r['company']} | {r['name']} | {r['email']} | {r['role']} | {r['url']} | {r['status']} | {r['response']} | {r.get('followup', 'No')} |\n")
    print(f"Formatted and updated local '{file_path}' with latest sheet statuses.")

def main():
    creds = None
    if os.path.exists(TOKEN_FILE):
        creds = Credentials.from_authorized_user_file(TOKEN_FILE, SCOPES)
    if not creds or not creds.valid:
        if creds and creds.expired and creds.refresh_token:
            creds.refresh(Request())
        else:
            if not os.path.exists(CREDENTIALS_FILE):
                print(f"Credentials file '{CREDENTIALS_FILE}' not found. Exiting.")
                return
            flow = InstalledAppFlow.from_client_secrets_file(CREDENTIALS_FILE, SCOPES)
            creds = flow.run_local_server(port=0)
        with open(TOKEN_FILE, 'w') as token:
            token.write(creds.to_json())

    sheet_service = build('sheets', 'v4', credentials=creds).spreadsheets()

    # Get metadata
    sheet_metadata = sheet_service.get(spreadsheetId=SPREADSHEET_ID).execute()
    sheets = sheet_metadata.get('sheets', '')
    sheet_names = [s['properties']['title'] for s in sheets]

    # --- Sync Jobs Tab ---
    jobs_sheet_name = 'Jobs'
    if jobs_sheet_name not in sheet_names:
        sheet_service.batchUpdate(spreadsheetId=SPREADSHEET_ID, body={
            'requests': [{'addSheet': {'properties': {'title': jobs_sheet_name}}}]
        }).execute()
        headers = ["Title", "Company", "Location", "Source", "Date Posted", "Link", "Match Score"]
        sheet_service.values().update(
            spreadsheetId=SPREADSHEET_ID, range=f"'{jobs_sheet_name}'!A1:G1",
            valueInputOption='RAW', body={'values': [headers]}
        ).execute()

    if os.path.exists(JOBS_CSV):
        with open(JOBS_CSV, 'r', encoding='utf-8') as f:
            reader = csv.reader(f)
            job_rows = list(reader)
        if job_rows:
            header_row = job_rows[0]
            data_rows = job_rows[1:]
            unique_rows = []
            seen = set()
            for r in data_rows:
                key = (r[0], r[1])
                if key not in seen:
                    seen.add(key)
                    unique_rows.append(r)
            sheet_service.values().clear(spreadsheetId=SPREADSHEET_ID, range=f"'{jobs_sheet_name}'!A2:G").execute()
            if unique_rows:
                sheet_service.values().update(
                    spreadsheetId=SPREADSHEET_ID, range=f"'{jobs_sheet_name}'!A2:G{len(unique_rows)+1}",
                    valueInputOption='RAW', body={'values': unique_rows}
                ).execute()
                print(f"Successfully synced {len(unique_rows)} unique jobs to Google Sheet '{jobs_sheet_name}'.")
    else:
        print(f"Jobs CSV not found at {JOBS_CSV}, skipping jobs sync.")

    # --- Sync Recruiters Tab ---
    rec_sheet_name = 'Recruiters'
    if rec_sheet_name not in sheet_names:
        sheet_service.batchUpdate(spreadsheetId=SPREADSHEET_ID, body={
            'requests': [{'addSheet': {'properties': {'title': rec_sheet_name}}}]
        }).execute()
        headers = ["Company", "Name", "Recruiter Email", "Role", "LinkedIn Profile", "Outreach Status", "Reply Status", "Follow on sent?"]
        sheet_service.values().update(
            spreadsheetId=SPREADSHEET_ID, range=f"'{rec_sheet_name}'!A1:H1",
            valueInputOption='RAW', body={'values': [headers]}
        ).execute()

    local_contacts = parse_email_list(EMAIL_LIST_MD)
    print(f"Parsed {len(local_contacts)} local email contacts from '{EMAIL_LIST_MD}'.")

    result = sheet_service.values().get(spreadsheetId=SPREADSHEET_ID, range=f"'{rec_sheet_name}'!A:H").execute()
    rows = result.get('values', [])
    sheet_data = {}
    if len(rows) > 1:
        for r in rows[1:]:
            if len(r) >= 3 and r[2].strip():
                email_key = r[2].strip().lower()
                company_key = r[0].strip().lower() if len(r) > 0 else ""
                key = (company_key, email_key)
                sheet_data[key] = {
                    "company": r[0].strip() if len(r) > 0 else "",
                    "name": r[1].strip() if len(r) > 1 else "",
                    "email": r[2].strip(),
                    "role": r[3].strip() if len(r) > 3 else "",
                    "url": r[4].strip() if len(r) > 4 else "",
                    "status": r[5].strip() if len(r) > 5 else "Discovered",
                    "response": r[6].strip() if len(r) > 6 else "No",
                    "followup": r[7].strip() if len(r) > 7 else "No"
                }

    all_records_map = {}
    for c in local_contacts:
        key = (c["company"].strip().lower(), c["email"].strip().lower())
        all_records_map[key] = c

    for key, val in sheet_data.items():
        if key not in all_records_map:
            all_records_map[key] = {
                "company": val["company"],
                "name": val["name"],
                "email": val["email"],
                "role": val["role"],
                "url": val["url"],
                "status": val["status"],
                "response": val["response"],
                "followup": val["followup"]
            }
        else:
            sheet_status = val["status"].strip()
            local_status = all_records_map[key]["status"].strip()
            
            if "outdated" in sheet_status.lower() or "bounce" in sheet_status.lower():
                all_records_map[key]["status"] = sheet_status
            elif "outdated" in local_status.lower() or "bounce" in local_status.lower():
                all_records_map[key]["status"] = local_status
            elif "sent" in sheet_status.lower() or "got" in sheet_status.lower():
                all_records_map[key]["status"] = sheet_status
            elif "sent" in local_status.lower() or "got" in local_status.lower():
                all_records_map[key]["status"] = local_status
            else:
                all_records_map[key]["status"] = sheet_status
                
            if val["response"].lower() == "yes" or all_records_map[key]["response"].lower() == "yes":
                all_records_map[key]["response"] = "Yes"
                
            if val["followup"].lower() == "yes" or all_records_map[key].get("followup", "No").lower() == "yes":
                all_records_map[key]["followup"] = "Yes"

    sorted_records = sorted(
        all_records_map.values(),
        key=lambda x: (
            get_alignment_priority(x["company"], x["email"])[0],
            clean_company_name(x["company"]).lower(),
            x["company"].lower(),
            x["email"].lower()
        )
    )

    print("Clearing old rows from Google Sheet...")
    sheet_service.values().clear(
        spreadsheetId=SPREADSHEET_ID,
        range=f"'{rec_sheet_name}'!A2:H"
    ).execute()

    sheet_rows = []
    for r in sorted_records:
        sheet_rows.append([
            r["company"],
            r["name"],
            r["email"],
            r["role"],
            r["url"],
            r["status"],
            r["response"],
            r.get("followup", "No")
        ])
        
    if sheet_rows:
        body = {'values': sheet_rows}
        sheet_service.values().update(
            spreadsheetId=SPREADSHEET_ID,
            range=f"'{rec_sheet_name}'!A2:H{len(sheet_rows)+1}",
            valueInputOption='RAW',
            body=body
        ).execute()
        print(f"Successfully synced {len(sheet_rows)} recruiter rows to Google Sheet '{rec_sheet_name}'.")

    write_email_list_markdown(EMAIL_LIST_MD, sorted_records)

if __name__ == '__main__':
    main()
