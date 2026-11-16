
require("dotenv").config();
const db = require("./config/db");

const roles = [
    ["Frontend Developer", "React, HTML, CSS, JavaScript"],
    ["Backend Developer", "Node.js, Express, REST API, MySQL"],
    ["Full Stack Developer", "React, Node.js, MongoDB, JavaScript"],
    ["Python Developer", "Python, Flask, Django, SQL"],
    ["Java Developer", "Java, Spring Boot, MySQL, OOP"],
    ["Data Analyst", "Excel, SQL, Python, Power BI"],
    ["UI UX Designer", "Figma, Wireframing, Prototyping"],
    ["Software Tester", "Manual Testing, Selenium, Java"],
    ["Cloud Engineer", "AWS, Azure, Linux, Docker"],
    ["Cybersecurity Analyst", "Networking, Security, Linux"]
];

const levels = [
    "Junior", "Graduate", "Trainee", "Associate",
    "Entry Level", "Software", "Web", "Application",
    "Technical", "Graduate Trainee"
];

const locations = [
    "Bengaluru", "Mysuru", "Hyderabad", "Chennai",
    "Pune", "Mumbai", "Delhi", "Noida",
    "Mangaluru", "Remote"
];

const descriptions = [
    "Work with the development team to build and maintain real-world applications.",
    "Develop features, fix bugs and improve application performance.",
    "Collaborate with team members and contribute to software projects.",
    "Learn modern technologies and work on practical development tasks.",
    "Design, develop, test and maintain reliable software solutions."
];

async function seedJobs() {
    try {
        const [companies] = await db.promise().query(
            "SELECT id, company_name FROM companies ORDER BY id ASC LIMIT 1"
        );

        if (companies.length === 0) {
            throw new Error(
                "No company found. First register a recruiter and create a company."
            );
        }

        const companyId = companies[0].id;
        let inserted = 0;
        let skipped = 0;

        for (let i = 0; i < 100; i++) {
            const role = roles[i % roles.length];
            const level = levels[Math.floor(i / roles.length)];
            const title = `${level} ${role[0]}`;
            const location = locations[i % locations.length];
            const jobType =
                i % 3 === 0 ? "Internship" :
                i % 3 === 1 ? "Full Time" : "Part Time";

            const salary =
                jobType === "Internship"
                    ? "10000 - 15000 per month"
                    : jobType === "Part Time"
                    ? "8000 - 12000 per month"
                    : "25000 - 45000 per month";

            const description = descriptions[i % descriptions.length];

            const requirements =
                "Basic knowledge of the required skills, problem-solving ability, " +
                "communication skills and willingness to learn.";

            const skills = role[1];

            const deadline = new Date();
            deadline.setDate(deadline.getDate() + 30 + (i % 60));
            const deadlineDate = deadline.toISOString().slice(0, 10);

            const [existing] = await db.promise().query(
                "SELECT id FROM jobs WHERE company_id = ? AND title = ? LIMIT 1",
                [companyId, title]
            );

            if (existing.length > 0) {
                skipped++;
                continue;
            }

            await db.promise().query(
                `INSERT INTO jobs
                (company_id, title, description, requirements, location,
                 job_type, salary, skills, deadline)
                VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
                [
                    companyId,
                    title,
                    description,
                    requirements,
                    location,
                    jobType,
                    salary,
                    skills,
                    deadlineDate
                ]
            );

            inserted++;
        }

        console.log("--------------------------------");
        console.log("100 Demo Jobs Seed Process Done!");
        console.log("Company:", companies[0].company_name);
        console.log("New Jobs Added:", inserted);
        console.log("Already Existing:", skipped);
        console.log("--------------------------------");

    } catch (error) {
        console.error("Seed Error:", error.message);
    } finally {
        db.end();
    }
}

seedJobs();
