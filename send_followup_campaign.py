import os
import re
import sys
import time
import subprocess
from datetime import datetime
from send_emails_gmail_api import get_gmail_service, send_message
from sync_sheets import parse_email_list, write_email_list_markdown, EMAIL_LIST_MD

TEMPLATE_PATH = "personal_data/Followup_Email_temp.md"
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
        subject = "Re: Exploring opportunities : Software Engineer 2"
        body = content
        
    return subject, body

def main():
    sys.stdout.reconfigure(encoding='utf-8', newline='\n')
    
    print("==================================================")
    print("        RECRUITER FOLLOW-UP CAMPAIGN RUNNER       ")
    print("==================================================")
    
    # 1. Load follow-up template
    subject_template, body_template = load_email_template(TEMPLATE_PATH)
    if not subject_template or not body_template:
        print(f"\nError: The follow-up template file '{TEMPLATE_PATH}' is empty or does not exist.")
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
    
    # Filter contacts for follow-up
    followup_targets = []
    for c in all_contacts:
        status = c["status"].strip().lower()
        response = c["response"].strip().lower()
        followup = c.get("followup", "No").strip().lower()
        
        # Conditions:
        # 1. Initial email must have been sent (status contains 'sent')
        # 2. Status is NOT outdated / bounced (does not contain 'outdated' or 'bounce')
        # 3. Reply status is 'No'
        # 4. Follow-up email not already sent (followup is 'No' or empty)
        is_initial_sent = "sent" in status
        is_not_bounced = "outdated" not in status and "bounce" not in status
        has_no_reply = response == "no"
        followup_not_sent = followup in ["no", ""]
        
        if is_initial_sent and is_not_bounced and has_no_reply and followup_not_sent:
            followup_targets.append(c)
            
    total_recruiters = len(all_contacts)
    
    if not followup_targets:
        print(f"\nRecruiter Follow-up Statistics:")
        print(f"- Total recruiters found in database: {total_recruiters}")
        print("\nNo pending follow-up targets found matching the conditions:")
        print("  * Initial email already sent")
        print("  * Outreach status is not outdated/bounced")
        print("  * Reply status is 'No'")
        print("  * Follow-on not already sent")
        sys.exit(0)
        
    # Limit to 10 follow-ups or custom count if specified, supporting bypass flags
    batch_size = 10
    bypass_confirm = False
    for arg in sys.argv[1:]:
        if arg in ["--yes", "-y"]:
            bypass_confirm = True
        else:
            try:
                batch_size = int(arg)
            except ValueError:
                pass
                
    campaign_batch = followup_targets[:batch_size]
    
    print("\n==================================================")
    print("             FOLLOW-UP CAMPAIGN PREVIEW           ")
    print("==================================================")
    print(f"Total recruiters found: {total_recruiters}")
    print(f"Total follow-up targets pending: {len(followup_targets)}")
    print(f"Follow-ups to be sent in this batch: {len(campaign_batch)}")
    print("--------------------------------------------------")
    for idx, contact in enumerate(campaign_batch, 1):
        print(f"{idx:2d}. {contact['name']} ({contact['company']}) - {contact['email']} [Sent on: {contact['status']}]")
    print("==================================================\n")
    
    if bypass_confirm:
        print("Bypassing confirmation prompt (--yes / -y specified)...")
    else:
        confirm = input("Do you want to proceed with sending these follow-up emails? (y/n): ").strip().lower()
        if confirm != 'y' and confirm != 'yes':
            print("Campaign sending cancelled by user.")
            sys.exit(0)
        
    # 4. Initialize Gmail API
    print("\nInitializing Gmail API...")
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
            
        print(f"\n[{sent_count+1}/{len(campaign_batch)}] Preparing follow-up to {recipient} ({company})...")
        
        # Customize placeholders
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
            # Update local follow-up status
            contact["followup"] = f"Sent ({current_date})"
            sent_count += 1
            # Add small delay between sending to prevent rate issues
            time.sleep(2)
        else:
            print(f"Failed to send follow-up to {recipient}.")
            
    print(f"\nBatch completed. Successfully sent {sent_count} follow-up emails.")
    
    # 5. Write back local updates
    if sent_count > 0:
        print("Saving updated status to local list...")
        write_email_list_markdown(EMAIL_LIST_MD, all_contacts)
        
        print("Triggering Google Sheets Sync...")
        subprocess.run([sys.executable, "sync_sheets.py"])
        
    print("\nFollow-up campaign batch run finished.")

if __name__ == '__main__':
    main()
