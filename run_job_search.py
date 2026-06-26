import subprocess
import json
import re
import sys
import time

def run_browser_act_eval(script_path, *args):
    proc = subprocess.run([sys.executable, script_path] + list(args), capture_output=True, text=True, check=True)
    js_code = proc.stdout.strip()
    
    cmd = [
        "/Users/talus/.local/bin/browser-act",
        "--session", "linkedin-session",
        "eval", js_code
    ]
    res_proc = subprocess.run(cmd, capture_output=True, text=True)
    if res_proc.returncode != 0:
        print(f"Error executing browser-act: {res_proc.stderr}")
        return {"error": True, "message": res_proc.stderr}
    
    try:
        return json.loads(res_proc.stdout.strip())
    except Exception as e:
        print(f"Failed to parse output: {res_proc.stdout.strip()}")
        return {"error": True, "message": str(e)}

def clean_text(text):
    if not text:
        return ""
    return re.sub(r'\s+', ' ', text).strip()

def check_experience(desc):
    if not desc:
        return True, "No description"
    desc_lower = desc.lower()
    
    exclusions = [
        r'3\s*\+\s*years', r'4\s*\+\s*years', r'5\s*\+\s*years', r'6\s*\+\s*years', r'7\s*\+\s*years',
        r'3\s*to\s*\d+\s*years', r'4\s*to\s*\d+\s*years', r'5\s*to\s*\d+\s*years',
        r'3-\d+\s*years', r'4-\d+\s*years', r'5-\d+\s*years',
        r'minimum\s*of\s*[3-9]\s*years', r'at\s*least\s*[3-9]\s*years', r'required\s*:\s*[3-9]\s*\+\s*years'
    ]
    for pattern in exclusions:
        if re.search(pattern, desc_lower):
            return False, f"Exclusion matched: {pattern}"
            
    return True, "Passed experience check"

def check_salary(desc):
    if not desc:
        return False, "No description"
    desc_lower = desc.lower()
    
    salary_patterns = [
        r'20\s*lpa', r'2\d\s*lpa', r'3\d\s*lpa', r'4\d\s*lpa', r'5\d\s*lpa',
        r'20\s*lacs', r'2\d\s*lacs', r'3\d\s*lacs', r'20\s*lakh', r'2\d\s*lakh', r'3\d\s*lakh',
        r'20,00,000', r'30,00,000', r'40,00,000'
    ]
    for pattern in salary_patterns:
        match = re.search(pattern, desc_lower)
        if match:
            return True, match.group(0)
            
    return False, "No explicit salary >= 20 LPA found in description"

def main():
    search_script = "output/linkedin-jobs/linkedin-job-search/scripts/search-jobs.py"
    detail_script = "output/linkedin-jobs/linkedin-job-detail-extract/scripts/extract-job-details.py"
    
    keywords_list = ["software developer", "sde", "software engineer"]
    all_jobs = {}
    
    print("Starting job search on LinkedIn...")
    for kw in keywords_list:
        for start in [0, 10]:
            print(f"Searching for '{kw}' (start={start})...")
            jobs = run_browser_act_eval(search_script, kw, "India", "--start", str(start), "--experience", "2,3")
            if isinstance(jobs, list):
                for job in jobs:
                    job_id = job.get("jobId")
                    if job_id and job_id not in all_jobs:
                        all_jobs[job_id] = job
            else:
                print(f"Search failed or empty for '{kw}': {jobs}")
            time.sleep(2)
            
    print(f"Found {len(all_jobs)} unique jobs. Extracting details...")
    
    matched_jobs = []
    skipped_jobs = []
    
    count = 0
    for job_id, job in all_jobs.items():
        count += 1
        print(f"[{count}/{len(all_jobs)}] Fetching details for Job ID {job_id} ({job['title']} at {job['company']})...")
        details = run_browser_act_eval(detail_script, job_id)
        if "error" in details:
            print(f"Error fetching details: {details['message']}")
            continue
            
        desc = details.get("description", "")
        exp_ok, exp_msg = check_experience(desc)
        sal_ok, sal_msg = check_salary(desc)
        
        job_info = {
            "jobId": job_id,
            "title": details.get("title", job["title"]),
            "company": details.get("company", job["company"]),
            "location": details.get("location", job["location"]),
            "link": job["link"],
            "experience_msg": exp_msg,
            "salary_msg": sal_msg,
            "description": desc
        }
        
        if exp_ok:
            if sal_ok:
                job_info["matched_reason"] = f"Matches both: Exp <= 2 years and Salary >= 20 LPA ({sal_msg})"
                matched_jobs.append(job_info)
            else:
                job_info["matched_reason"] = "Matches experience <= 2 years, but salary not explicitly mentioned in description"
                skipped_jobs.append(job_info)
        else:
            print(f"  Skipped due to experience requirement: {exp_msg}")
            
        time.sleep(2.5)
        
    print("\n--- JOB SEARCH COMPLETED ---")
    print(f"Total Matches (Both Exp & Salary met): {len(matched_jobs)}")
    print(f"Total Exp Met (Salary not explicitly mentioned): {len(skipped_jobs)}")
    
    with open("job_results.md", "w") as f:
        f.write("# LinkedIn Job Search Results\n\n")
        f.write(f"Search Criteria: Keywords: {keywords_list}, Location: India, Experience Level: Entry/Associate, <= 2 years, Salary >= 20 LPA\n\n")
        
        f.write("## Matches (Both Experience & Salary explicitly found)\n\n")
        if matched_jobs:
            for j in matched_jobs:
                f.write(f"### [{j['title']} - {j['company']}]({j['link']})\n")
                f.write(f"- **Location**: {j['location']}\n")
                f.write(f"- **Salary Details**: {j['salary_msg']}\n")
                f.write(f"- **Experience Details**: {j['experience_msg']}\n\n")
        else:
            f.write("No jobs explicitly matched both criteria in the description.\n\n")
            
        f.write("## Potential Matches (Experience <= 2 years, Salary not explicitly mentioned in text)\n\n")
        if skipped_jobs:
            for j in skipped_jobs:
                f.write(f"### [{j['title']} - {j['company']}]({j['link']})\n")
                f.write(f"- **Location**: {j['location']}\n")
                f.write(f"- **Experience Check**: {j['experience_msg']}\n\n")
        else:
            f.write("No jobs matched the experience requirement.\n\n")
            
    print("Results saved to job_results.md")

if __name__ == '__main__':
    main()
