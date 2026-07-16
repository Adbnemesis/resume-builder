import os
import re
import sys
import time
import subprocess
from datetime import datetime
from send_emails_gmail_api import get_gmail_service, send_message
from sync_sheets import parse_email_list, write_email_list_markdown, EMAIL_LIST_MD

TEMPLATE_PATH = "personal_data/Email_temp.md"
RESUME_PATH = "personal_data/Anubhav Talus July 2026.pdf"

def load_email_template(file_path):
    """Loads and parses the subject and body from the template file."""
    if not os.path.exists(file_path) or os.path.getsize(file_path) == 0:
        return None, None
        
    with open(file_path, "r", encoding="utf-8") as f:
        content = f.read().strip()
        
    lines = content.split('\n')
    if not lines:
        return None, None
        
    # Check if first line is a subject header
    first_line = lines[0].strip()
    subject_match = re.match(r'^(?:Subject|#\s*Subject):\s*(.*)', first_line, re.IGNORECASE)
    if subject_match:
        subject = subject_match.group(1).strip()
        body = '\n'.join(lines[1:]).strip()
    else:
        subject = "Job Application - Anubhav Talus"
        body = content
        
    return subject, body

def main():
    sys.stdout.reconfigure(encoding='utf-8', newline='\n')
    
    print("==================================================")
    print("         RECRUITER OUTREACH CAMPAIGN RUNNER       ")
    print("==================================================")
    
    # 1. Load email template
    subject_template, body_template = load_email_template(TEMPLATE_PATH)
    if not subject_template or not body_template:
        print(f"\nError: The template file '{TEMPLATE_PATH}' is empty or does not exist.")
        print("Please write your email content in that file first and then rerun.")
        sys.exit(1)
        
    # 2. Check resume file
    if not os.path.exists(RESUME_PATH):
        print(f"\nError: Resume attachment file not found at '{RESUME_PATH}'.")
        sys.exit(1)
        
    # 3. Load contacts
    if not os.path.exists(EMAIL_LIST_MD):
        print(f"\nError: Contacts file '{EMAIL_LIST_MD}' not found. Please sync sheets first.")
        sys.exit(1)
        
    all_contacts = parse_email_list(EMAIL_LIST_MD)
    
    # Filter un-emailed contacts
    unemailed = [c for c in all_contacts if c["status"].strip().lower() in ["discovered", "not sent", ""]]
    
    if not unemailed:
        print("\nNo un-emailed recruiter contacts found. All contacts are already 'Sent' or updated.")
        sys.exit(0)
        
    # Limit to 10 emails
    campaign_batch = unemailed[:10]
    print(f"\nFound {len(unemailed)} un-emailed contacts. Starting batch of {len(campaign_batch)}...")
    
    # 4. Initialize Gmail API
    print("Initializing Gmail API...")
    try:
        service = get_gmail_service()
    except Exception as e:
        print(f"Failed to authenticate Gmail API: {e}")
        sys.exit(1)
        
    sender_email = "anubhavtalus@gmail.com"
    current_date = datetime.now().strftime("%Y-%m-%d")
    
    sent_count = 0
    for contact in campaign_batch:
        company = contact["company"]
        recipient = contact["email"]
        
        # Safety Check: Never email Thoughtworks (since user already works there)
        if "thoughtworks" in company.lower() or "thoughtworks" in recipient.lower():
            print(f"Safety warning: Skipping {recipient} ({company}) because user is already employed at Thoughtworks.")
            continue
            
        print(f"\n[{sent_count+1}/{len(campaign_batch)}] Preparing email to {recipient} ({company})...")
        
        # Customize subject & body placeholders
        subject = subject_template.replace("[Company Name]", company).replace("[Company]", company)
        body = body_template.replace("[Company Name]", company).replace("[Company]", company)
        
        recruiter_name = contact["name"] if contact["name"] != "Unknown" else "Hiring Manager"
        body = body.replace("[Hiring Manager / Recruiter Name]", recruiter_name)
        body = body.replace("[Hiring Manager]", recruiter_name)
        
        # Send email with attachment
        res = send_message(
            service=service,
            sender=sender_email,
            to=recipient,
            subject=subject,
            message_text=body,
            attachment_path=RESUME_PATH
        )
        
        if res:
            # Update local status
            contact["status"] = f"Sent ({current_date})"
            sent_count += 1
            # Add small delay between sending to prevent rate issues
            time.sleep(2)
        else:
            print(f"Failed to send email to {recipient}.")
            
    print(f"\nBatch completed. Successfully sent {sent_count} emails.")
    
    # 5. Write back local updates
    if sent_count > 0:
        print("Saving updated status to local list...")
        write_email_list_markdown(EMAIL_LIST_MD, all_contacts)
        
        print("Triggering Google Sheets Sync...")
        subprocess.run([sys.executable, "sync_sheets.py"])
        
    print("\nCampaign batch run finished.")

if __name__ == '__main__':
    main()
