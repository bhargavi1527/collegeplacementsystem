
const express = require("express");
const fs = require("fs");
const path = require("path");

const app = express();
const PORT = 3000;

const dbPath = path.join(__dirname, "data", "db.json");

app.use(express.json());

// Serve frontend files from the main project folder
app.use(express.static(path.join(__dirname, "..")));

function readDB() {
  return JSON.parse(fs.readFileSync(dbPath, "utf8"));
}

function saveDB(data) {
  fs.writeFileSync(dbPath, JSON.stringify(data, null, 2));
}

function nextId(items) {
  return items.length
    ? Math.max(...items.map(item => item.id)) + 1
    : 1;
}

app.get("/", (req, res) => {
  res.sendFile(path.join(__dirname, "..", "index.html"));
});

// Dashboard
app.get("/api/dashboard", (req, res) => {
  const db = readDB();
  res.json({
    students: db.students.length,
    companies: db.companies.length,
    jobs: db.jobs.length,
    placed: db.placements.filter(p => p.status === "Selected").length
  });
});

// STUDENTS
app.get("/api/students", (req, res) => {
  res.json(readDB().students);
});

app.post("/api/students", (req, res) => {
  const { name, roll, dept, cgpa } = req.body;

  if (!name || !roll || !dept ||
      !Number.isFinite(cgpa) || cgpa < 0 || cgpa > 10) {
    return res.status(400).json({
      message: "Enter valid student details and CGPA between 0 and 10."
    });
  }

  const db = readDB();

  if (db.students.some(s => s.roll.toLowerCase() === roll.toLowerCase())) {
    return res.status(400).json({ message: "Roll number already exists." });
  }

  const student = {
    id: nextId(db.students),
    name,
    roll,
    dept,
    cgpa
  };

  db.students.push(student);
  saveDB(db);
  res.status(201).json(student);
});

app.delete("/api/students/:id", (req, res) => {
  const db = readDB();
  const id = Number(req.params.id);
  const exists = db.students.some(s => s.id === id);

  if (!exists) {
    return res.status(404).json({ message: "Student not found." });
  }

  db.students = db.students.filter(s => s.id !== id);
  db.placements = db.placements.filter(p => p.studentId !== id);
  saveDB(db);

  res.json({ message: "Student deleted." });
});

// COMPANIES
app.get("/api/companies", (req, res) => {
  res.json(readDB().companies);
});

app.post("/api/companies", (req, res) => {
  const { name, role, pkg } = req.body;

  if (!name || !role || !Number.isFinite(pkg) || pkg < 0) {
    return res.status(400).json({ message: "Enter valid company details." });
  }

  const db = readDB();
  const company = {
    id: nextId(db.companies),
    name,
    role,
    pkg
  };

  db.companies.push(company);
  saveDB(db);
  res.status(201).json(company);
});

app.delete("/api/companies/:id", (req, res) => {
  const db = readDB();
  const id = Number(req.params.id);

  if (!db.companies.some(c => c.id === id)) {
    return res.status(404).json({ message: "Company not found." });
  }

  db.companies = db.companies.filter(c => c.id !== id);
  saveDB(db);
  res.json({ message: "Company deleted." });
});

// JOBS
app.get("/api/jobs", (req, res) => {
  res.json(readDB().jobs);
});

app.post("/api/jobs", (req, res) => {
  const { title, company, pkg } = req.body;

  if (!title || !company || !Number.isFinite(pkg) || pkg < 0) {
    return res.status(400).json({ message: "Enter valid job details." });
  }

  const db = readDB();
  const job = {
    id: nextId(db.jobs),
    title,
    company,
    pkg
  };

  db.jobs.push(job);
  saveDB(db);
  res.status(201).json(job);
});

app.delete("/api/jobs/:id", (req, res) => {
  const db = readDB();
  const id = Number(req.params.id);

  if (!db.jobs.some(j => j.id === id)) {
    return res.status(404).json({ message: "Job not found." });
  }

  db.jobs = db.jobs.filter(j => j.id !== id);
  saveDB(db);
  res.json({ message: "Job deleted." });
});

// PLACEMENTS
app.get("/api/placements", (req, res) => {
  res.json(readDB().placements);
});

app.post("/api/apply", (req, res) => {
  const { roll, jobId } = req.body;
  const db = readDB();

  const student = db.students.find(
    s => s.roll.toLowerCase() === String(roll).toLowerCase()
  );

  const job = db.jobs.find(j => j.id === Number(jobId));

  if (!student) {
    return res.status(404).json({ message: "Student not found." });
  }

  if (!job) {
    return res.status(404).json({ message: "Job not found." });
  }

  const alreadyApplied = db.placements.some(
    p => p.studentId === student.id && p.jobId === job.id
  );

  if (alreadyApplied) {
    return res.status(400).json({
      message: "This student has already applied for this job."
    });
  }

  const placement = {
    id: nextId(db.placements),
    studentId: student.id,
    studentName: student.name,
    roll: student.roll,
    jobId: job.id,
    jobTitle: job.title,
    company: job.company,
    status: "Applied"
  };

  db.placements.push(placement);
  saveDB(db);

  res.status(201).json(placement);
});

app.put("/api/placements/:id", (req, res) => {
  const db = readDB();
  const placement = db.placements.find(
    p => p.id === Number(req.params.id)
  );

  if (!placement) {
    return res.status(404).json({ message: "Placement not found." });
  }

  placement.status = "Selected";
  saveDB(db);

  res.json(placement);
});

app.delete("/api/placements/:id", (req, res) => {
  const db = readDB();
  const id = Number(req.params.id);

  if (!db.placements.some(p => p.id === id)) {
    return res.status(404).json({ message: "Placement not found." });
  }

  db.placements = db.placements.filter(p => p.id !== id);
  saveDB(db);

  res.json({ message: "Placement deleted." });
});

// Start server
app.listen(PORT, () => {
  console.log(`Server running at http://localhost:${PORT}`);
});
