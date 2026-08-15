#!/usr/bin/env python3
import os
import sys
import subprocess
import time
from datetime import datetime

# Set working directory to project root
PROJECT_DIR = os.path.dirname(os.path.abspath(__file__))
os.chdir(PROJECT_DIR)
sys.path.append(PROJECT_DIR)

LOG_FILE = os.path.join(PROJECT_DIR, "daily_campaign.log")

def notify_desktop(title, message):
    try:
        cmd = f'display notification "{message}" with title "{title}"'
        subprocess.run(["osascript", "-e", cmd], check=False)
    except Exception:
        pass

def log(msg):
    ts = datetime.now().strftime("%Y-%m-%d %H:%M:%S")
    formatted = f"[{ts}] {msg}"
    print(formatted)
    with open(LOG_FILE, "a", encoding="utf-8") as f:
        f.write(formatted + "\n")

def run_step(cmd, desc):
    log(f"--- Starting: {desc} ---")
    try:
        res = subprocess.run([sys.executable] + cmd, capture_output=True, text=True)
        if res.stdout:
            for line in res.stdout.strip().split('\n'):
                log(f"  {line}")
        if res.stderr:
            for line in res.stderr.strip().split('\n'):
                log(f"  [STDERR] {line}")
        if res.returncode != 0:
            log(f"Warning: Step '{desc}' exited with code {res.returncode}")
        else:
            log(f"Finished: {desc} (Success)")
    except Exception as e:
        log(f"Error running step '{desc}': {e}")

def trash_bounce_notifications():
    log("--- Starting: Cleanup Bounce Notifications from Inbox ---")
    try:
        from send_emails_gmail_api import get_gmail_service
        
        service = get_gmail_service()
        res = service.users().messages().list(userId='me', q='from:mailer-daemon in:inbox', maxResults=50).execute()
        messages = res.get('messages', [])
        
        trashed = 0
        for m in messages:
            try:
                service.users().messages().trash(userId='me', id=m['id']).execute()
                trashed += 1
            except Exception:
                pass
        log(f"Moved {trashed} bounce notification(s) to Trash.")
    except Exception as e:
        log(f"Notice during bounce notifications cleanup: {e}")

def main():
    notify_desktop("Job Agent", "10:30 AM Recruiter Campaign Started")
    log("==================================================================")
    log("       STARTING DAILY RECRUITER OUTREACH & FOLLOW-UP CAMPAIGN     ")
    log("==================================================================")
    
    # Step 1: Pre-campaign bounce check
    run_step(["check_bounces.py"], "Pre-campaign Bounce Check & Status Sync")
    
    # Step 2: Send 20 follow-up emails
    run_step(["send_followup_campaign.py", "20", "--yes"], "Send 20 Follow-up Emails")
    
    # Step 3: Send 30 new cold outreach emails
    run_step(["send_outreach_campaign.py", "30", "--yes"], "Send 30 New Cold Outreach Emails")
    
    # Step 4: Initial bounce check
    run_step(["check_bounces.py"], "Post-campaign Bounce Check & Status Sync")
    
    # Step 5: Wait 45s and run secondary bounce check for delayed enterprise server responses
    log("Waiting 45s for delayed enterprise mail server delivery receipts...")
    time.sleep(45)
    run_step(["check_bounces.py"], "Secondary Bounce Check & Status Sync")
    
    # Step 6: Clean up bounce notification emails from inbox
    trash_bounce_notifications()
    
    # Step 7: Final Google Sheets sync
    run_step(["sync_sheets.py"], "Final Google Sheets Sync")
    
    log("==================================================================")
    log("       DAILY CAMPAIGN COMPLETED SUCCESSFULLY                      ")
    log("==================================================================")
    notify_desktop("Job Agent", "Daily Campaign Completed: 50 emails sent & Google Sheets updated!")

if __name__ == '__main__':
    main()
