import os
import sys
import re
import base64
import subprocess

# Add workspace directory to path
sys.path.append(os.path.abspath('.'))
from send_emails_gmail_api import get_gmail_service
from sync_sheets import parse_email_list, write_email_list_markdown, EMAIL_LIST_MD

def get_message_body(payload):
    """Recursively gets the message body from the message payload."""
    if 'parts' in payload:
        body = ""
        for part in payload['parts']:
            body += get_message_body(part)
        return body
    if 'body' in payload and 'data' in payload['body']:
        try:
            return base64.urlsafe_b64decode(payload['body']['data']).decode('utf-8', errors='ignore')
        except Exception:
            return ""
    return ""

def main():
    # Pre-check token scopes: if gmail.readonly not in scopes, delete token
    if os.path.exists('gmail_token.json'):
        import pickle
        try:
            with open('gmail_token.json', 'rb') as f:
                creds = pickle.load(f)
            # Check scopes
            if not any('gmail.readonly' in s for s in creds.scopes):
                print("Existing token lacks read permissions. Removing it to trigger re-auth...")
                os.remove('gmail_token.json')
        except Exception:
            pass

    print("Initializing Gmail API...")
    try:
        service = get_gmail_service()
    except Exception as e:
        print(f"Failed to authenticate Gmail API: {e}")
        print("Please complete the browser OAuth login and run this script again.")
        sys.exit(1)
        
    print("Loading existing recruiter database...")
    contacts = parse_email_list(EMAIL_LIST_MD)
    db_emails = {c['email'].strip().lower() for c in contacts if c['email']}
    print(f"Loaded {len(contacts)} contacts. Tracking {len(db_emails)} unique emails.")
    
    # Query Gmail for mailer-daemon failures
    # We look for messages in the last 2 days from mailer-daemon
    query = "from:mailer-daemon newer_than:2d"
    print(f"Searching Gmail with query: '{query}'...")
    
    try:
        results = service.users().messages().list(userId='me', q=query).execute()
    except Exception as e:
        print(f"Failed to query Gmail: {e}")
        print("This may be due to cached credentials missing the 'gmail.readonly' scope.")
        print("If so, delete 'gmail_token.json' and run this script again to prompt a fresh login.")
        sys.exit(1)
        
    messages = results.get('messages', [])
    print(f"Found {len(messages)} potential bounce/notification messages.")
    
    bounced_emails = set()
    
    for idx, msg_info in enumerate(messages, 1):
        msg_id = msg_info['id']
        try:
            msg = service.users().messages().get(userId='me', id=msg_id, format='full').execute()
        except Exception as e:
            print(f"Error fetching message {msg_id}: {e}")
            continue
            
        payload = msg.get('payload', {})
        headers = payload.get('headers', [])
        
        # 1. Check for X-Failed-Recipients header
        failed_recipients = None
        for h in headers:
            if h['name'].lower() == 'x-failed-recipients':
                failed_recipients = h['value']
                break
                
        if failed_recipients:
            # Extract emails
            emails = re.findall(r'[a-zA-Z0-9_.+-]+@[a-zA-Z0-9-]+\.[a-zA-Z0-9-.]+', failed_recipients)
            for email in emails:
                bounced_emails.add(email.strip().lower())
        else:
            # 2. Fallback: Parse body for emails
            body = get_message_body(payload)
            if body:
                # Find all email-like strings in the bounce message body
                emails = re.findall(r'[a-zA-Z0-9_.+-]+@[a-zA-Z0-9-]+\.[a-zA-Z0-9-.]+', body)
                for email in emails:
                    email_lower = email.strip().lower()
                    # Only add if this email belongs to our recruiter database
                    # to avoid adding mailer-daemon domains or sender emails
                    if email_lower in db_emails:
                        bounced_emails.add(email_lower)
                        
    print(f"\nDiscovered {len(bounced_emails)} bounced/outdated email addresses:")
    for email in bounced_emails:
        print(f"- {email}")
        
    if not bounced_emails:
        print("\nNo bounces detected. Database remains unchanged.")
        return
        
    # Update local recruiter status
    updated_count = 0
    for contact in contacts:
        email_clean = contact['email'].strip().lower()
        if email_clean in bounced_emails:
            if contact['status'] != "Outdated / Bounced":
                contact['status'] = "Outdated / Bounced"
                updated_count += 1
                
    print(f"\nUpdated {updated_count} contacts in local memory to 'Outdated / Bounced'.")
    
    if updated_count > 0:
        print("Saving updates to local email_list.md...")
        write_email_list_markdown(EMAIL_LIST_MD, contacts)
        
        print("Synchronizing with Google Sheets...")
        res = subprocess.run([sys.executable, "sync_sheets.py"], capture_output=True, text=True)
        print(res.stdout)
        if res.stderr:
            print("Sync errors:", res.stderr)
            
    print("Done!")

if __name__ == '__main__':
    main()
