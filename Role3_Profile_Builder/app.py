from flask import Flask, render_template, request
import os
from dotenv import load_dotenv
from supabase import create_client, Client

load_dotenv()

app = Flask(__name__)

# Initialize Supabase client
SUPABASE_URL = os.getenv("SUPABASE_URL")
SUPABASE_KEY = os.getenv("SUPABASE_KEY")
if SUPABASE_URL and SUPABASE_KEY:
    supabase: Client = create_client(SUPABASE_URL, SUPABASE_KEY)
else:
    supabase = None

@app.route("/")
def home():
    return render_template("index.html")


@app.route("/submit", methods=["POST"])
def submit():

    name = request.form.get("name")
    email = request.form.get("email")
    education = request.form.get("education")
    preferred_role = request.form.get("preferred_role")
    skills = request.form.get("skills")
    hackathon = request.form.get("hackathon")
    internship = request.form.get("internship")
    certification = request.form.get("certification")

    print("Name:", name)
    print("Email:", email)
    print("Education:", education)
    print("Preferred Role:", preferred_role)
    print("Skills:", skills)
    print("Hackathon:", hackathon)
    print("Internship:", internship)
    print("Certification:", certification)

    # Wire to Supabase
    if supabase:
        try:
            supabase.table("candidate_profiles").insert({
                "name": name,
                "email": email,
                "education": education,
                "preferred_role": preferred_role,
                "skills": skills,
                "hackathon": hackathon,
                "internship": internship,
                "certification": certification
            }).execute()
            print("Successfully saved to Supabase.")
        except Exception as e:
            print(f"Error saving to Supabase: {e}")

    return render_template("success.html")


if __name__ == "__main__":
    app.run(debug=True)