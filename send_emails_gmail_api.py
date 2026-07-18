import os
import pickle
import base64
import re
from email.mime.text import MIMEText
from google.auth.transport.requests import Request
from google_auth_oauthlib.flow import InstalledAppFlow
from googleapiclient.discovery import build

SCOPES = [
    'https://www.googleapis.com/auth/gmail.send',
    'https://www.googleapis.com/auth/gmail.modify'
]

def get_gmail_service():
    """Authenticates the user and returns the Gmail API service object."""
    creds = None
    # The file gmail_token.json stores the user's access and refresh tokens, and is
    # created automatically when the authorization flow completes for the first time.
    if os.path.exists('gmail_token.json'):
        with open('gmail_token.json', 'rb') as token:
            creds = pickle.load(token)
            
    # If there are no (valid) credentials available, let the user log in.
    if not creds or not creds.valid:
        if creds and creds.expired and creds.refresh_token:
            print("Refreshing expired Gmail access token...")
            creds.refresh(Request())
        else:
            if not os.path.exists('gmail_credentials.json'):
                raise FileNotFoundError(
                    "gmail_credentials.json file not found in the project root directory.\n"
                    "Please download your client credentials JSON file from the Google Cloud Console,\n"
                    "rename it to 'gmail_credentials.json', and place it in this directory:\n"
                    f"  {os.getcwd()}/gmail_credentials.json"
                )
            print("Initializing local authentication server. Please sign in via the browser window...")
            flow = InstalledAppFlow.from_client_secrets_file('gmail_credentials.json', SCOPES)
            creds = flow.run_local_server(port=0)
            
        # Save the credentials for the next run to avoid re-authenticating
        with open('gmail_token.json', 'wb') as token:
            pickle.dump(creds, token)

    return build('gmail', 'v1', credentials=creds)

def send_message(service, sender, to, subject, message_text, attachment_path=None):
    """Creates and sends an e-mail message, supporting HTML (Markdown) and attachments."""
    from email.mime.multipart import MIMEMultipart
    
    # 1. Prepare plain-text fallback (strip markdown bold characters)
    plain_text = re.sub(r'\*\*(.*?)\*\*', r'\1', message_text)
    
    # 2. Prepare HTML version
    # Convert markdown bold to HTML strong tags
    html_text = re.sub(r'\*\*(.*?)\*\*', r'<strong>\1</strong>', message_text)
    
    # Convert markdown bullets to HTML lists
    paragraphs = html_text.split('\n\n')
    html_paragraphs = []
    for p in paragraphs:
        p = p.strip()
        if not p:
            continue
        p_html = p.replace('\n', '<br>')
        if p.startswith('*') or p.startswith('-'):
            items = p_html.split('<br>')
            ul_items = []
            for item in items:
                item_clean = re.sub(r'^[\*\-\s]+', '', item.strip())
                if item_clean:
                    ul_items.append(f"<li>{item_clean}</li>")
            p_html = "<ul>" + "".join(ul_items) + "</ul>"
        else:
            p_html = f"<p>{p_html}</p>"
        html_paragraphs.append(p_html)
    
    html_body_text = "\n".join(html_paragraphs)
    
    # Create multipart/alternative body (plain text + html)
    body_part = MIMEMultipart('alternative')
    body_part.attach(MIMEText(plain_text, 'plain'))
    body_part.attach(MIMEText(html_body_text, 'html'))
    
    if attachment_path:
        # If we have attachments, the outer wrapper must be multipart/mixed
        message = MIMEMultipart('mixed')
        message['To'] = to
        message['From'] = 'me'
        message['Subject'] = subject
        
        # Attach the alternative body
        message.attach(body_part)
        
        # Attach file
        import mimetypes
        from email.mime.base import MIMEBase
        from email import encoders
        if os.path.exists(attachment_path):
            content_type, encoding = mimetypes.guess_type(attachment_path)
            if content_type is None or encoding is not None:
                content_type = 'application/octet-stream'
            main_type, sub_type = content_type.split('/', 1)
            
            with open(attachment_path, 'rb') as f:
                file_data = f.read()
                
            part = MIMEBase(main_type, sub_type)
            part.set_payload(file_data)
            encoders.encode_base64(part)
            filename = os.path.basename(attachment_path)
            part.add_header('Content-Disposition', 'attachment', filename=filename)
            message.attach(part)
        else:
            print(f"Warning: Attachment file not found at {attachment_path}. Sending email without attachment.")
    else:
        # If no attachments, just use the alternative body
        message = body_part
        message['To'] = to
        message['From'] = 'me'
        message['Subject'] = subject
        
    # URL-safe Base64 encode the message bytes
    raw_message = base64.urlsafe_b64encode(message.as_bytes()).decode()
    
    try:
        sent_message = service.users().messages().send(userId='me', body={'raw': raw_message}).execute()
        print(f"Email sent successfully to {to}! Message ID: {sent_message['id']}")
        return sent_message
    except Exception as e:
        print(f"An error occurred while sending email to {to}: {e}")
        return None

if __name__ == '__main__':
    # Load environment variables if dotenv is available
    try:
        from dotenv import load_dotenv
        load_dotenv()
    except ImportError:
        pass
        
    sender_email = os.getenv('GMAIL_ADDRESS', 'anubhavtalus@gmail.com')
    
    print("Starting Gmail OAuth setup...")
    try:
        service = get_gmail_service()
        
        print(f"\nSending a test email from {sender_email} to {sender_email}...")
        send_message(
            service=service,
            sender=sender_email,
            to=sender_email,
            subject="Gmail API OAuth Test Success!",
            message_text=(
                "Hello!\n\n"
                "This is a test email sent securely using the Gmail API via OAuth 2.0 without passwords.\n\n"
                "Best regards,\n"
                "Your AI Assistant"
            )
        )
    except FileNotFoundError as fnfe:
        print(f"\nConfiguration Error: {fnfe}")
    except Exception as e:
        print(f"\nAn error occurred during authentication/sending: {e}")
