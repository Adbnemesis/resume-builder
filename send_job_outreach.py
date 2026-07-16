import os
import re
import sys
from send_emails_gmail_api import get_gmail_service, send_message

def parse_jobs_from_md(file_path):
    """Parses matched jobs from job_results.md."""
    jobs = []
    if not os.path.exists(file_path):
        return jobs
    
    with open(file_path, "r", encoding="utf-8") as f:
        lines = f.readlines()
        
    for line in lines:
        if line.startswith("|") and not line.startswith("| Rank |") and not line.startswith("|---|"):
            parts = [p.strip() for p in line.split("|")]
            # Table format: | Empty | Rank | ATS | Company | Job Title | ... | Link | Empty |
            if len(parts) >= 13:
                company = parts[3].replace("**", "")
                title = parts[4].replace("**", "")
                
                link_match = re.search(r'\[View Job\]\((https?://[^\s)]+)\)', parts[11])
                link = link_match.group(1) if link_match else ""
                
                jobs.append({
                    "company": company,
                    "title": title,
                    "link": link
                })
    return jobs

def load_cover_letter(file_path):
    """Loads and returns the text from cover_letter.md."""
    if not os.path.exists(file_path):
        return None
    with open(file_path, "r", encoding="utf-8") as f:
        return f.read()

def main():
    sys.stdout.reconfigure(encoding='utf-8', newline='\n')
    
    # Files
    jobs_md_path = "job_results.md"
    cover_letter_path = "personal_data/cover_letter.md"
    
    # 1. Parse jobs
    jobs = parse_jobs_from_md(jobs_md_path)
    if not jobs:
        print(f"No matching jobs parsed from '{jobs_md_path}'. Make sure that file has job table entries.")
        sys.exit(1)
        
    print("==================================================")
    print("         JOB OUTREACH & APPLICATION DRAFTER       ")
    print("==================================================")
    print(f"Loaded {len(jobs)} matched jobs from '{jobs_md_path}'.\n")
    
    for idx, job in enumerate(jobs, 1):
        print(f"{idx:2d}. {job['company']} - {job['title']}")
        
    print("\nSelect a job to draft an email for:")
    while True:
        try:
            choice = input(f"Enter job number (1-{len(jobs)}), or 'q' to quit: ").strip()
            if choice.lower() == 'q':
                print("Exiting.")
                sys.exit(0)
            choice_idx = int(choice) - 1
            if 0 <= choice_idx < len(jobs):
                selected_job = jobs[choice_idx]
                break
            else:
                print(f"Invalid range. Please enter 1 to {len(jobs)}.")
        except ValueError:
            print("Please enter a valid number.")
            
    print(f"\nSelected: {selected_job['title']} at {selected_job['company']}")
    
    # 2. Gather recipient details
    recruiter_name = input("Enter Recruiter/Hiring Manager name (default: Hiring Team): ").strip()
    if not recruiter_name:
        recruiter_name = "Hiring Team"
        
    recipient_email = input("Enter Recruiter's Email address: ").strip()
    while not recipient_email or "@" not in recipient_email:
        print("Please enter a valid email address.")
        recipient_email = input("Enter Recruiter's Email address: ").strip()
        
    # 3. Load cover letter and format
    cover_letter_template = load_cover_letter(cover_letter_path)
    if not cover_letter_template:
        print(f"\nWarning: Could not find cover letter template at '{cover_letter_path}'.")
        print("Using standard fallback text instead.")
        cover_letter_template = (
            "Dear [Hiring Manager / Recruiter Name],\n\n"
            "I am writing to express my interest in the [Job Title] role at [Company Name]. "
            "I have 2 years of experience in software development specializing in building robust backend services.\n\n"
            "Best regards,\nAnubhav Talus"
        )
        
    # Replace placeholders
    email_body = cover_letter_template
    email_body = email_body.replace("[Hiring Manager / Recruiter Name]", recruiter_name)
    email_body = email_body.replace("[Job Title]", selected_job['title'])
    email_body = email_body.replace("[Company Name]", selected_job['company'])
    # Remove markdown header/divider styling for clean text presentation
    email_body = re.sub(r'^#\s+.*$', '', email_body, flags=re.MULTILINE) # remove H1 title header
    email_body = email_body.replace("---", "").strip()
    
    email_subject = f"Job Application: {selected_job['title']} - Anubhav Talus"
    
    print("\n---------------- GENERATED EMAIL ----------------")
    print(f"Subject: {email_subject}")
    print(f"To:      {recipient_email}")
    print("--------------------------------------------------")
    print(email_body)
    print("--------------------------------------------------\n")
    
    # 4. Confirmation actions
    print("Choose action:")
    print("1. Send a review copy/draft to yourself (anubhavtalus@gmail.com)")
    print(f"2. Send directly to Recruiter ({recipient_email})")
    print("3. Cancel and exit")
    
    while True:
        action = input("Enter choice (1, 2, or 3): ").strip()
        if action in ['1', '2', '3']:
            break
        print("Invalid choice. Enter 1, 2, or 3.")
        
    if action == '3':
        print("Cancelled.")
        sys.exit(0)
        
    # Initialize Gmail API
    print("\nConnecting to Gmail API...")
    try:
        service = get_gmail_service()
    except Exception as e:
        print(f"Authentication failed: {e}")
        sys.exit(1)
        
    sender_email = "anubhavtalus@gmail.com"
    
    if action == '1':
        # Send copy to self
        draft_subject = f"[DRAFT] {email_subject}"
        draft_body = (
            f"--- REVIEW COPY FOR {selected_job['company']} ---\n"
            f"Intended Recipient: {recipient_email}\n"
            f"Recruiter Name: {recruiter_name}\n"
            f"--------------------------------------------------\n\n"
            f"{email_body}"
        )
        print(f"Sending review copy to {sender_email}...")
        send_message(service, sender_email, sender_email, draft_subject, draft_body)
    elif action == '2':
        # Send directly to recruiter
        print(f"Sending application email to {recipient_email}...")
        send_message(service, sender_email, recipient_email, email_subject, email_body)

if __name__ == '__main__':
    main()
