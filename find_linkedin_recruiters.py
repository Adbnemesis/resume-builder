import os
import re
import sys
import time
import subprocess
import json

# Import functions and config from sync_sheets
from sync_sheets import parse_email_list, write_email_list_markdown, EMAIL_LIST_MD

# Session and browser identifiers
SESSION_NAME = "apollo-session"
BROWSER_NAME = "chrome-direct-apollo"
BROWSER_ACT_PATH = "/Users/talus/.local/bin/browser-act"

def run_cmd(args):
    """Utility to run browser-act CLI commands."""
    cmd = [BROWSER_ACT_PATH] + args
    result = subprocess.run(cmd, capture_output=True, text=True)
    return result.stdout.strip(), result.stderr.strip(), result.returncode

def find_browser_id_by_name(name):
    """Retrieves the browser ID dynamically from browser list by name."""
    stdout, stderr, code = run_cmd(["browser", "list"])
    if code != 0:
        return None
    # Search for browser pattern matching name
    match = re.search(r'id=(\S+)\s+name="' + re.escape(name) + '"', stdout)
    if match:
        return match.group(1)
    return None

def start_session():
    """Opens the chrome-direct browser and starts a session."""
    print("Connecting to your local Chrome via browser-act...")
    browser_id = find_browser_id_by_name(BROWSER_NAME)
    if not browser_id:
        print(f"Error: Could not find browser named '{BROWSER_NAME}'. Please ensure it was created.")
        return False
    stdout, stderr, code = run_cmd(["--session", SESSION_NAME, "browser", "open", browser_id, "https://www.linkedin.com/", "--allow-restart-chrome"])
    if code != 0:
        print(f"Error starting browser session: {stderr}")
        return False
    print("Connected successfully!")
    return True

def search_recruiters(company):
    """Searches for software recruiters for a specific company in India."""
    # Construct targeted search URL
    query = f"recruiter software {company} India"
    search_url = f"https://www.linkedin.com/search/results/people/?keywords={query.replace(' ', '%20')}"
    
    print(f"\nSearching LinkedIn for recruiters at '{company}'...")
    run_cmd(["--session", SESSION_NAME, "navigate", search_url])
    
    # Wait for page stable
    time.sleep(5)
    run_cmd(["--session", SESSION_NAME, "wait", "stable", "--timeout", "10000"])
    
    js_extract_links = """
    (() => {
      const results = [];
      const links = Array.from(document.querySelectorAll('a'));
      for (const a of links) {
        if (a.href && a.href.includes('/in/') && !a.href.includes('/in/ACoAA')) {
          const parentHTML = a.parentElement ? a.parentElement.innerHTML : '';
          if (/ • (1st|2nd|3rd\\+)/.test(parentHTML)) {
            results.push(a.href);
          }
        }
      }
      return JSON.stringify(Array.from(new Set(results)));
    })()
    """
    
    stdout, stderr, code = run_cmd(["--session", SESSION_NAME, "eval", js_extract_links])
    if code != 0:
        print(f"Error evaluating profile link extractor JS: {stderr}")
        return []
        
    try:
        profile_links = json.loads(stdout)
        # Limit to top 3 results to avoid triggering captcha / rate limits rapidly
        return profile_links[:3]
    except Exception as e:
        print(f"Failed to parse profile links: {stdout}. Error: {e}")
        return []

def scrape_profile_and_email(profile_url):
    """Navigates to a profile, clicks Apollo button, and extracts email."""
    print(f"Navigating to profile: {profile_url}")
    run_cmd(["--session", SESSION_NAME, "navigate", profile_url])
    
    # Wait for profile page to render
    time.sleep(6)
    run_cmd(["--session", SESSION_NAME, "wait", "stable", "--timeout", "10000"])
    
    # Extract profile name and headline using robust parsing script
    js_profile_details = """
    (() => {
      const docTitle = document.title.split('|')[0].replace(/^\\(\\d+\\)\\s+/, '').trim();
      if (!docTitle || docTitle.includes('LinkedIn') || docTitle.includes('Page Not Found')) {
        return JSON.stringify({name: 'Unknown Recruiter', headline: 'Recruiter'});
      }
      const name = docTitle;
      const elements = Array.from(document.querySelectorAll('*'));
      let headline = 'Recruiter';
      for (const el of elements) {
        const text = el.textContent.trim();
        if (text.includes(name) && text.includes('@') && text.length < 150) {
          let h = text.replace(name, '').replace(/More|Message|Connect|Follow/g, '').trim();
          if (h) {
            headline = h;
            break;
          }
        }
      }
      if (headline === 'Recruiter') {
        for (const el of elements) {
          const text = el.textContent.trim();
          if (text.includes('@') && text.length < 100 && (text.toLowerCase().includes('recruiter') || text.toLowerCase().includes('talent') || text.toLowerCase().includes('hiring') || text.toLowerCase().includes('hr') || text.toLowerCase().includes('people') || text.toLowerCase().includes('acquisition'))) {
            headline = text;
            break;
          }
        }
      }
      return JSON.stringify({name: name, headline: headline});
    })()
    """
    stdout_details, _, _ = run_cmd(["--session", SESSION_NAME, "eval", js_profile_details])
    name = "Unknown Recruiter"
    role = "Recruiter"
    if stdout_details and stdout_details != "null":
        try:
            details = json.loads(stdout_details)
            name = details.get("name", "Unknown Recruiter")
            role = details.get("headline", "Recruiter")
        except Exception:
            pass
    
    # Locate and click Apollo button
    print("Looking for Apollo.io extension widget and 'Find Email' button...")
    js_click_apollo = """
    (() => {
      const elements = Array.from(document.querySelectorAll('button, div, span, a'));
      // Find element containing "find email", "view email", or referencing "apollo"
      const apolloBtn = elements.find(el => {
        const txt = (el.textContent || '').toLowerCase();
        const cl = (el.className || '').toString().toLowerCase();
        const id = (el.id || '').toLowerCase();
        return (txt.includes('find email') || txt.includes('view email') || cl.includes('apollo') || id.includes('apollo')) && el.offsetHeight > 0;
      });
      if (apolloBtn) {
        apolloBtn.click();
        return "Clicked Apollo button";
      }
      return "Apollo button not found";
    })()
    """
    
    click_res, _, _ = run_cmd(["--session", SESSION_NAME, "eval", js_click_apollo])
    click_res_clean = click_res.strip('"')
    print(f"Apollo Click Result: {click_res_clean}")
    
    # Wait for Apollo to fetch and render the email
    time.sleep(5)
    
    # Extract email addresses from page body
    js_extract_email = """
    (() => {
      const emailRegex = /[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\\.[a-zA-Z]{2,}/g;
      const match = document.body.innerHTML.match(emailRegex);
      if (match) {
        return JSON.stringify(Array.from(new Set(match)));
      }
      return null;
    })()
    """
    
    stdout, _, _ = run_cmd(["--session", SESSION_NAME, "eval", js_extract_email])
    
    emails = []
    if stdout and stdout != "null":
        try:
            emails = json.loads(stdout)
            # Filter out any non-personal emails if we catch them
            emails = [e for e in emails if not e.endswith('.png') and not e.endswith('.jpg') and not e.endswith('.gif')]
        except Exception:
            pass
            
    return {
        "name": name,
        "role": role,
        "url": profile_url,
        "emails": emails
    }

def is_recruiter_for_company(company, headline):
    """Verifies that the recruiter's headline matches the target company and role."""
    h_lower = headline.lower()
    c_lower = company.lower()
    
    # Handle aliases
    aliases = {
        "bharti airtel": ["airtel"],
        "american express": ["amex", "american express"],
        "amex": ["amex", "american express"]
    }
    
    targets = aliases.get(c_lower, [c_lower])
    
    # Verify company is in the headline
    company_match = any(t in h_lower for t in targets)
    
    # Verify they are actually in recruitment/HR/TA
    role_keywords = ["recruiter", "talent", "hiring", "hr", "people", "acquisition", "sourcing", "ta "]
    role_match = any(r in h_lower for r in role_keywords)
    
    return company_match and role_match

def main():
    sys.stdout.reconfigure(encoding='utf-8', newline='\n')
    
    companies = [
        "Autodesk", 
        "Bharti Airtel", 
        "American Express", 
        "Docusign",
        "Google",
        "Visa",
        "Swiggy"
    ]
    
    if not start_session():
        print("Please ensure your local Chrome browser is open and retry.")
        sys.exit(1)
        
    print("\nStarting LinkedIn Recruiter Search with Apollo.io...")
    
    # Verify local files
    if not os.path.exists(EMAIL_LIST_MD):
        print(f"Error: Email list file not found at '{EMAIL_LIST_MD}'. Please create it or sync sheets first.")
        sys.exit(1)
        
    for company in companies:
        profile_links = search_recruiters(company)
        print(f"Found {len(profile_links)} potential profiles.")
        
        for link in profile_links:
            try:
                recruiter = scrape_profile_and_email(link)
                email_str = ", ".join(recruiter["emails"]) if recruiter["emails"] else "Not Found"
                print(f"Result: {recruiter['name']} ({company}) - Email: {email_str}")
                
                # Check name resolution
                if recruiter["name"] == "Unknown Recruiter" or recruiter["name"] == "Unknown":
                    print(f"Skipping {link} because profile name was not resolved successfully.")
                    continue
                    
                # Validate company & role matches
                if not is_recruiter_for_company(company, recruiter["role"]):
                    print(f"Safety warning: Skipping {recruiter['name']} ({link}) because headline '{recruiter['role']}' does not match target company '{company}' or role keyword.")
                    continue
                
                # If we successfully found email(s), add them to local MD
                if recruiter["emails"]:
                    current_records = parse_email_list(EMAIL_LIST_MD)
                    
                    added_any = False
                    for email in recruiter["emails"]:
                        # Check duplicate
                        exists = any(r["email"].lower() == email.lower() and r["company"].lower() == company.lower() for r in current_records)
                        if not exists:
                            current_records.append({
                                "company": company,
                                "name": recruiter["name"],
                                "email": email,
                                "role": recruiter["role"],
                                "url": recruiter["url"],
                                "status": "Discovered",
                                "response": "No"
                            })
                            added_any = True
                            
                    if added_any:
                        write_email_list_markdown(EMAIL_LIST_MD, current_records)
                        
                time.sleep(3)
            except Exception as ex:
                print(f"Error scraping profile {link}: {ex}")
                
    print("\nRecruiter profiles scrape complete. Initiating Google Sheets Sync...")
    
    # Close session
    run_cmd(["--session", SESSION_NAME, "session", "close"])
    
    # Trigger sheets sync
    subprocess.run([sys.executable, "sync_sheets.py"])
    
    print("\nAll done! Recruiter contacts saved and synchronized.")

if __name__ == '__main__':
    main()
