
const API = "/api";
let studentRecords = [];

async function request(url, options = {}) {
  const response = await fetch(API + url, {
    headers: { "Content-Type": "application/json" },
    ...options
  });

  const data = await response.json();

  if (!response.ok) {
    throw new Error(data.message || "Something went wrong");
  }

  return data;
}

function showError(error) {
  alert(error.message);
}

async function loadData() {
  try {
    const [students, companies, jobs, placements] =
      await Promise.all([
        request("/students"),
        request("/companies"),
        request("/jobs"),
        request("/placements")
      ]);

    studentRecords = students;
    const placed = placements.filter(p => p.status === "Selected").length;
    const placementRate = students.length
      ? Math.round((placed / students.length) * 100)
      : 0;

    document.getElementById("studentCount").textContent = students.length;
    document.getElementById("companyCount").textContent = companies.length;
    document.getElementById("jobCount").textContent = jobs.length;
    document.getElementById("placementCount").textContent = placed;
    document.getElementById("reportStudents").textContent = students.length;
    document.getElementById("reportCompanies").textContent = companies.length;
    document.getElementById("reportPlacements").textContent = placed;
    document.getElementById("reportPercentage").textContent = `${placementRate}%`;
    document.getElementById("dashboardSummary").textContent =
      `${placed} of ${students.length} registered students have been selected.`;
    document.getElementById("progressBar").style.width = `${placementRate}%`;
    document.getElementById("progressText").textContent =
      `${placementRate}% Placement Rate`;

    renderStudents(students);
    renderCompanies(companies);
    renderJobs(jobs);
    renderPlacements(placements);
  } catch (error) {
    showError(error);
  }
}

function renderStudents(students) {
  const search = document.getElementById("studentSearch").value.toLowerCase();

  document.getElementById("studentTable").innerHTML =
    students.filter(s =>
      s.name.toLowerCase().includes(search) ||
      s.roll.toLowerCase().includes(search)
    ).map(s => `
      <tr>
        <td>${escapeHTML(s.name)}</td>
        <td>${escapeHTML(s.roll)}</td>
        <td>${escapeHTML(s.dept)}</td>
        <td>${s.cgpa}</td>
        <td><button class="delete-btn" onclick="deleteStudent(${s.id})">Delete</button></td>
      </tr>
    `).join("");
}

function renderCompanies(companies) {
  document.getElementById("companyTable").innerHTML =
    companies.map(c => `
      <tr>
        <td>${escapeHTML(c.name)}</td>
        <td>${escapeHTML(c.role)}</td>
        <td>${c.pkg} LPA</td>
        <td><button class="delete-btn" onclick="deleteCompany(${c.id})">Delete</button></td>
      </tr>
    `).join("");
}

function renderJobs(jobs) {
  document.getElementById("jobList").innerHTML =
    jobs.map(j => `
      <article class="job-card">
        <h3>${escapeHTML(j.title)}</h3>
        <p>${escapeHTML(j.company)}</p>
        <p>${j.pkg} LPA</p>
        <button type="button" onclick="prepareApplication(${j.id})">Apply</button>
        <button type="button" class="delete-btn" onclick="deleteJob(${j.id})">Delete</button>
      </article>
    `).join("");

  document.getElementById("applyJobId").innerHTML =
    '<option value="">Select a job</option>' + jobs.map(j =>
      `<option value="${j.id}">${escapeHTML(j.title)} - ${escapeHTML(j.company)}</option>`
    ).join("");
}

function prepareApplication(jobId) {
  document.getElementById("applyJobId").value = jobId;
  document.getElementById("applyRoll").focus();
}

function showPage(pageId) {
  document.querySelectorAll(".page").forEach(page => {
    page.classList.toggle("active", page.id === pageId);
  });

  document.querySelectorAll(".sidebar a[data-page]").forEach(link => {
    link.classList.toggle("active", link.dataset.page === pageId);
  });

  const activePage = document.getElementById(pageId);
  if (activePage) {
    document.getElementById("pageTitle").textContent =
      activePage.dataset.title || "Dashboard";
  }
}

function renderPlacements(placements) {
  document.getElementById("placementTable").innerHTML =
    placements.map(p => `
      <tr>
        <td>${escapeHTML(p.studentName)}</td>
        <td>${escapeHTML(p.roll)}</td>
        <td>${escapeHTML(p.company)}</td>
        <td>${escapeHTML(p.jobTitle)}</td>
        <td>${escapeHTML(p.status)}</td>
        <td>
          ${p.status !== "Selected"
            ? `<button onclick="selectPlacement(${p.id})">Mark Selected</button>`
            : ""}
          <button class="delete-btn" onclick="deletePlacement(${p.id})">Delete</button>
        </td>
      </tr>
    `).join("");
}

function escapeHTML(value) {
  return String(value).replace(/[&<>"']/g, char => ({
    "&": "&amp;",
    "<": "&lt;",
    ">": "&gt;",
    '"': "&quot;",
    "'": "&#39;"
  })[char]);
}

// Add student
document.getElementById("studentForm").addEventListener("submit", async e => {
  e.preventDefault();

  try {
    await request("/students", {
      method: "POST",
      body: JSON.stringify({
        name: document.getElementById("studentName").value.trim(),
        roll: document.getElementById("rollNo").value.trim(),
        dept: document.getElementById("department").value.trim(),
        cgpa: Number(document.getElementById("cgpa").value)
      })
    });

    e.target.reset();
    await loadData();
    alert("Student added successfully!");
  } catch (error) {
    showError(error);
  }
});

// Add company
document.getElementById("companyForm").addEventListener("submit", async e => {
  e.preventDefault();

  try {
    await request("/companies", {
      method: "POST",
      body: JSON.stringify({
        name: document.getElementById("companyName").value.trim(),
        role: document.getElementById("companyRole").value.trim(),
        pkg: Number(document.getElementById("package").value)
      })
    });

    e.target.reset();
    await loadData();
    alert("Company added successfully!");
  } catch (error) {
    showError(error);
  }
});

// Add job
document.getElementById("jobForm").addEventListener("submit", async e => {
  e.preventDefault();

  try {
    await request("/jobs", {
      method: "POST",
      body: JSON.stringify({
        title: document.getElementById("jobTitle").value.trim(),
        company: document.getElementById("jobCompany").value.trim(),
        pkg: Number(document.getElementById("jobPackage").value)
      })
    });

    e.target.reset();
    await loadData();
    alert("Job added successfully!");
  } catch (error) {
    showError(error);
  }
});

// Register a placement/application
document.getElementById("applyForm").addEventListener("submit", async e => {
  e.preventDefault();

  try {
    await request("/apply", {
      method: "POST",
      body: JSON.stringify({
        roll: document.getElementById("applyRoll").value.trim(),
        jobId: Number(document.getElementById("applyJobId").value)
      })
    });

    e.target.reset();
    await loadData();
    alert("Placement application registered!");
  } catch (error) {
    showError(error);
  }
});

async function deleteStudent(id) {
  if (!confirm("Delete this student?")) return;
  try {
    await request("/students/" + id, { method: "DELETE" });
    loadData();
  } catch (error) {
    showError(error);
  }
}

async function deleteCompany(id) {
  if (!confirm("Delete this company?")) return;
  try {
    await request("/companies/" + id, { method: "DELETE" });
    loadData();
  } catch (error) {
    showError(error);
  }
}

async function deleteJob(id) {
  if (!confirm("Delete this job?")) return;
  try {
    await request("/jobs/" + id, { method: "DELETE" });
    loadData();
  } catch (error) {
    showError(error);
  }
}

async function selectPlacement(id) {
  try {
    await request("/placements/" + id, { method: "PUT" });
    loadData();
  } catch (error) {
    showError(error);
  }
}

async function deletePlacement(id) {
  if (!confirm("Delete this placement record?")) return;
  try {
    await request("/placements/" + id, { method: "DELETE" });
    loadData();
  } catch (error) {
    showError(error);
  }
}

document.getElementById("studentSearch").addEventListener("input", () => {
  renderStudents(studentRecords);
});

loadData();
