from flask import Flask, render_template, request

app = Flask(__name__)

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

    return render_template("success.html")


if __name__ == "__main__":
    app.run(debug=True)