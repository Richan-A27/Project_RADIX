document.addEventListener("DOMContentLoaded", () => {
    const skillsWrapper = document.querySelector(".skills-wrapper");
    const skillsInput = document.getElementById("skills");
    
    // Create a hidden input field so your Flask backend gets the skills array automatically
    const hiddenSkillsInput = document.createElement("input");
    hiddenSkillsInput.type = "hidden";
    hiddenSkillsInput.name = "final_skills";
    skillsWrapper.appendChild(hiddenSkillsInput);

    // Make the upload box clickable to trigger the hidden file input
    const uploadBox = document.querySelector(".upload-box");
    const fileInput = document.getElementById("resume");
    if (uploadBox && fileInput) {
        uploadBox.addEventListener("click", () => {
            fileInput.click();
        });
        
        fileInput.addEventListener("change", (e) => {
            if (e.target.files.length > 0) {
                uploadBox.querySelector("h3").textContent = `Selected: ${e.target.files[0].name}`;
            }
        });
    }

    // Sync current tags to the hidden input
    function updateHiddenSkills() {
        const badges = skillsWrapper.querySelectorAll(".skill-badge");
        const skillsArray = Array.from(badges).map(badge => badge.textContent.trim());
        hiddenSkillsInput.value = skillsArray.join(","); 
    }

    // Function to add a new skill tag
    function addSkillTag(skillName) {
        skillName = skillName.trim();
        if (skillName === "") return;

        // Prevent duplicate tags
        const existingBadges = Array.from(skillsWrapper.querySelectorAll(".skill-badge"))
            .map(b => b.textContent.trim().toLowerCase());
        if (existingBadges.includes(skillName.toLowerCase())) {
            skillsInput.value = "";
            return;
        }

        // Create the skill badge element
        const newBadge = document.createElement("span");
        newBadge.className = "skill-badge";
        newBadge.innerHTML = `${skillName} <i class="fa-solid fa-xmark remove-tag"></i>`;

        // Insert badge right before the input field
        skillsWrapper.insertBefore(newBadge, skillsInput);
        skillsInput.value = "";
        
        updateHiddenSkills();
    }

    // Remove tags when clicking the 'X' icon
    skillsWrapper.addEventListener("click", (e) => {
        // Targets either the 'X' font-awesome icon itself or its parent container if clicked close
        if (e.target.classList.contains("fa-xmark") || e.target.classList.contains("remove-tag")) {
            const badge = e.target.closest(".skill-badge");
            if (badge) {
                badge.remove();
                updateHiddenSkills();
            }
        }
    });

    // Add tags via Enter key or Comma
    skillsInput.addEventListener("keydown", (e) => {
        if (e.key === "Enter" || e.key === ",") {
            e.preventDefault(); // Stop the form from submitting unexpectedly
            addSkillTag(skillsInput.value);
        }
    });

    // Catch text if they click outside the input field
    skillsInput.addEventListener("blur", () => {
        if (skillsInput.value.trim() !== "") {
            addSkillTag(skillsInput.value);
        }
    });

    // Run once at startup to register the default badges (Python, Flask, SQL)
    updateHiddenSkills();
});