import { useCallback, useEffect, useState } from "react";
import API from "../services/api";
import "./Dashboard.css";

const images = {
    student: "https://images.unsplash.com/photo-1523240795612-9a054b0db644?w=1200",
    recruiter: "https://images.unsplash.com/photo-1521737711867-e3b97375f902?w=1200",
    admin: "https://images.unsplash.com/photo-1460925895917-afdab827c52f?w=1200",
    company: "https://images.unsplash.com/photo-1497366754035-f200968a6e72?w=600"
};

const initialJobForm = {
    title: "",
    description: "",
    requirements: "",
    location: "",
    job_type: "Internship",
    salary: "",
    skills: "",
    deadline: ""
};

function Dashboard({ user, onLogout }) {
    const [jobs, setJobs] = useState([]);
    const [applications, setApplications] = useState([]);
    const [myApplications, setMyApplications] = useState([]);
    const [savedJobs, setSavedJobs] = useState([]);
    const [recruiterJobs, setRecruiterJobs] = useState([]);
    const [notifications, setNotifications] = useState([]);

    const [adminStats, setAdminStats] = useState({});
    const [adminUsers, setAdminUsers] = useState([]);
    const [adminCompanies, setAdminCompanies] = useState([]);
    const [adminJobs, setAdminJobs] = useState([]);

    const [userSearch, setUserSearch] = useState("");
    const [userRoleFilter, setUserRoleFilter] = useState("All");
    const [selectedResumes, setSelectedResumes] = useState({});
    const [message, setMessage] = useState("");

    const [refreshing, setRefreshing] = useState(false);
    const [loading, setLoading] = useState(true);
    const [submitting, setSubmitting] = useState(false);

    // RANDOM JOB STATES
    const [randomJob, setRandomJob] = useState(null);
    const [randomLoading, setRandomLoading] = useState(false);
    const [randomError, setRandomError] = useState("");

    const [view, setView] = useState(
        user.role === "admin"
            ? "overview"
            : user.role === "recruiter"
                ? "overview"
                : "jobs"
    );

    const [search, setSearch] = useState("");
    const [locationFilter, setLocationFilter] = useState("");
    const [typeFilter, setTypeFilter] = useState("All");
    const [editingJobId, setEditingJobId] = useState(null);
    const [jobForm, setJobForm] = useState(initialJobForm);

    // =========================
    // PROFILE STATES
    // =========================

    const [profileData, setProfileData] = useState(user || {});

    const [profileForm, setProfileForm] = useState({
        name: user?.name || "",
        email: user?.email || "",
        phone: user?.phone || ""
    });

    const [editingProfile, setEditingProfile] = useState(false);
    const [savingProfile, setSavingProfile] = useState(false);

    const unreadCount = notifications.filter(
        item => !item.is_read
    ).length;

    const profileName = profileData?.name || user?.name || "User";
    const profileEmail = profileData?.email || user?.email || "Not provided";
    const profilePhone = profileData?.phone || user?.phone || "Not provided";
    const profileRole = profileData?.role || user?.role || "User";
    const profileInitial = profileName.charAt(0).toUpperCase();

    // =========================
    // PROFILE LOAD
    // =========================

const loadProfile = useCallback(async () => {
    try {
        const response = await API.get("/auth/profile");

        const data = response.data.user || response.data;

        setProfileData(data);

        setProfileForm({
            name: data.name || "",
            email: data.email || "",
            phone: data.phone || ""
        });

        setEditingProfile(false);

    } catch (error) {
        console.error("Profile loading error:", error);

        setMessage(
            error.response?.data?.message ||
            "Unable to load profile."
        );
    }
}, []);
    // =========================
    // PROFILE EDIT
    // =========================

    const handleProfileChange = (e) => {
        const { name, value } = e.target;

        setProfileForm(prev => ({
            ...prev,
            [name]: value
        }));
    };

    // =========================
    // PROFILE UPDATE
    // NAME + EMAIL + PHONE
    // =========================

    const saveProfile = async (e) => {
        e.preventDefault();

        if (savingProfile) return;

        const cleanData = {
            name: profileForm.name.trim(),
            email: profileForm.email.trim().toLowerCase(),
            phone: profileForm.phone.trim()
        };

        if (cleanData.name.length < 2) {
            setMessage("Name must contain at least 2 characters.");
            return;
        }

        if (!cleanData.email) {
            setMessage("Please enter your email address.");
            return;
        }

        try {
            setSavingProfile(true);
            setMessage("");

            const response = await API.put(
                "/auth/profile",
                cleanData
            );

            const updatedUser = response.data.user || response.data;

            setProfileData(updatedUser);

            setProfileForm({
                name: updatedUser.name || "",
                email: updatedUser.email || "",
                phone: updatedUser.phone || ""
            });

            setEditingProfile(false);

            setMessage("Profile updated successfully!");

        } catch (error) {
            console.error(
                "Profile update error:",
                error.response?.status,
                error.response?.data || error.message
            );

            setMessage(
                error.response?.data?.message ||
                "Profile update failed."
            );

        } finally {
            setSavingProfile(false);
        }
    };

    // =========================
    // PROFILE CANCEL
    // =========================

    const cancelProfileEdit = () => {
        setProfileForm({
            name: profileData.name || "",
            email: profileData.email || "",
            phone: profileData.phone || ""
        });

        setEditingProfile(false);
        setMessage("");
    };

    // Load profile whenever profile page opens
useEffect(() => {
    if (view !== "profile") return;

    const timer = setTimeout(() => {
        loadProfile();
    }, 0);

    return () => clearTimeout(timer);
}, [view, loadProfile]);

    // =========================
    // ADMIN DATA LOADING
    // =========================
const loadAdminDashboard = useCallback(async () => {
    try {
        const [statsRes, usersRes, companiesRes, jobsRes] =
            await Promise.all([
                API.get("/admin/stats"),
                API.get("/admin/users"),
                API.get("/admin/companies"),
                API.get("/admin/jobs")
            ]);

        setAdminStats(statsRes.data);
        setAdminUsers(usersRes.data);
        setAdminCompanies(companiesRes.data);
        setAdminJobs(jobsRes.data);

        return true;
    } catch (error) {
        console.error("Admin dashboard error:", error);

        setMessage(
            error.response?.data?.message ||
            "Unable to load admin dashboard. Please try again."
        );

        return false;
    }
}, []);
    const refreshAdminDashboard = async () => {
        if (refreshing) return;

        setRefreshing(true);
        setMessage("");

        try {
            const success = await loadAdminDashboard();

            if (success) {
                setMessage("Dashboard refreshed successfully!");
            }
        } finally {
            setRefreshing(false);
        }
    };

    // =========================
    // LOAD ROLE DATA
    // =========================
const loadData = useCallback(async () => {
    try {
        if (user.role === "student") {
            const response = await API.get("/jobs");

            setJobs(
                Array.isArray(response.data)
                    ? response.data
                    : response.data.jobs || []
            );
        }

        if (user.role === "recruiter") {
            const [appRes, jobRes] = await Promise.all([
                API.get("/applications/recruiter"),
                API.get("/jobs/my")
            ]);

            setApplications(appRes.data);
            setRecruiterJobs(jobRes.data);
        }

        if (user.role === "admin") {
            await loadAdminDashboard();
        }

    } catch (error) {
        console.error("Load data error:", error);

        setMessage(
            error.response?.data?.message ||
            "Unable to load data."
        );

    } finally {
        setLoading(false);
    }
}, [user.role, loadAdminDashboard]);
    // Load dashboard data once when the dashboard opens
    useEffect(() => {
        loadData();
    }, [loadData]);

    // =========================
    // RANDOM JOB DISCOVERY
    // SPRING BOOT API
    // =========================

    const getRandomJob = async () => {
        try {
            setRandomLoading(true);
            setRandomError("");
            setRandomJob(null);

            // Get latest jobs from Node.js backend
            const response = await API.get("/jobs");

            const availableJobs = Array.isArray(response.data)
                ? response.data
                : response.data.jobs || [];

            if (availableJobs.length === 0) {
                setRandomError("No jobs available.");
                return;
            }

            // Send jobs to Spring Boot Random Job API
            const result = await fetch(
                "http://localhost:8081/api/random-jobs",
                {
                    method: "POST",
                    headers: {
                        "Content-Type": "application/json"
                    },
                    body: JSON.stringify({
                        jobs: availableJobs
                    })
                }
            );

            const data = await result.json();

            if (!result.ok || !data.success) {
                throw new Error(
                    data.message || "Unable to get random job."
                );
            }

            setRandomJob(data.job);

        } catch (error) {
            console.error("Random Job Error:", error);

            setRandomError(
                "Unable to connect. Check Node.js and Spring Boot servers."
            );

        } finally {
            setRandomLoading(false);
        }
    };

    // =========================
    // ADMIN FILTER
    // =========================

    const filteredAdminUsers = adminUsers.filter(item => {
        const q = userSearch.toLowerCase();

        const matchesSearch =
            item.name?.toLowerCase().includes(q) ||
            item.email?.toLowerCase().includes(q);

        const matchesRole =
            userRoleFilter === "All" ||
            item.role === userRoleFilter;

        return matchesSearch && matchesRole;
    });

    // =========================
    // ADMIN COMPANY VERIFICATION
    // =========================

    const verifyCompany = async id => {
        try {
            const response = await API.put(
                `/admin/companies/${id}/verify`
            );

            setMessage(response.data.message);
            await loadAdminDashboard();

        } catch (error) {
            setMessage(
                error.response?.data?.message ||
                "Company verification failed."
            );
        }
    };

    // =========================
    // ADMIN DELETE JOB
    // =========================

    const adminDeleteJob = async id => {
        if (!window.confirm("Are you sure you want to delete this job?")) {
            return;
        }

        try {
            const response = await API.delete(`/admin/jobs/${id}`);

            setMessage(response.data.message);
            await loadAdminDashboard();

        } catch (error) {
            setMessage(
                error.response?.data?.message ||
                "Unable to delete job."
            );
        }
    };

    // =========================
    // STUDENT JOB FILTER
    // =========================

    const filteredJobs = jobs.filter(job => {
        const q = search.toLowerCase();

        const matchesSearch =
            job.title?.toLowerCase().includes(q) ||
            job.company_name?.toLowerCase().includes(q) ||
            job.skills?.toLowerCase().includes(q);

        const matchesLocation =
            job.location?.toLowerCase().includes(
                locationFilter.toLowerCase()
            );

        const matchesType =
            typeFilter === "All" ||
            job.job_type === typeFilter;

        return matchesSearch && matchesLocation && matchesType;
    });

    // =========================
    // STUDENT APPLY JOB
    // =========================

    const applyJob = async jobId => {
        const file = selectedResumes[jobId];

        if (!file) {
            setMessage("Please select your resume first.");
            return;
        }

        const formData = new FormData();

        formData.append("job_id", jobId);
        formData.append(
            "cover_letter",
            "I am interested in this job."
        );
        formData.append("resume", file);

        try {
            const response = await API.post(
                "/applications",
                formData
            );

            setMessage(response.data.message);

        } catch (error) {
            setMessage(
                error.response?.data?.message ||
                "Application failed."
            );
        }
    };

    // =========================
    // STUDENT SAVE JOB
    // =========================

    const saveJob = async jobId => {
        try {
            const response = await API.post(
                "/saved-jobs",
                { job_id: jobId }
            );

            setMessage(response.data.message);

        } catch (error) {
            setMessage(
                error.response?.data?.message ||
                "Unable to save job."
            );
        }
    };

    // =========================
    // STUDENT SAVED JOBS
    // =========================

    const loadSavedJobs = async () => {
        try {
            const response = await API.get("/saved-jobs");

            setSavedJobs(response.data);
            setView("saved");
            setMessage("");

        } catch (error) {
            setMessage(
                error.response?.data?.message ||
                "Unable to load saved jobs."
            );
        }
    };

    const removeSavedJob = async id => {
        try {
            const response = await API.delete(
                `/saved-jobs/${id}`
            );

            setSavedJobs(prev =>
                prev.filter(item => item.id !== id)
            );

            setMessage(response.data.message);

        } catch (error) {
            setMessage(
                error.response?.data?.message ||
                "Unable to remove saved job."
            );
        }
    };

    // =========================
    // STUDENT APPLICATIONS
    // =========================

    const loadMyApplications = async () => {
        try {
            const response = await API.get("/applications/my");

            setMyApplications(response.data);
            setView("applications");
            setMessage("");

        } catch (error) {
            setMessage(
                error.response?.data?.message ||
                "Unable to load applications."
            );
        }
    };

    // =========================
    // STUDENT NOTIFICATIONS
    // =========================

    const loadNotifications = async () => {
        try {
            const response = await API.get("/notifications");

            setNotifications(response.data);
            setView("notifications");
            setMessage("");

        } catch (error) {
            setMessage(
                error.response?.data?.message ||
                "Unable to load notifications."
            );
        }
    };

    const markAsRead = async id => {
        try {
            const response = await API.put(
                `/notifications/${id}/read`
            );

            setNotifications(prev =>
                prev.map(item =>
                    item.id === id
                        ? { ...item, is_read: 1 }
                        : item
                )
            );

            setMessage(response.data.message);

        } catch (error) {
            setMessage(
                error.response?.data?.message ||
                "Unable to update notification."
            );
        }
    };

    // =========================
    // RECRUITER APPLICATION STATUS
    // =========================

    const updateStatus = async (id, status) => {
        try {
            const response = await API.put(
                `/applications/${id}/status`,
                { status }
            );

            setMessage(response.data.message);
            await loadData();

        } catch (error) {
            setMessage(
                error.response?.data?.message ||
                "Status update failed."
            );
        }
    };

    // =========================
    // RECRUITER JOB FORM
    // =========================

    const handleJobChange = e => {
        setJobForm(prev => ({
            ...prev,
            [e.target.name]: e.target.value
        }));
    };

    const resetJobForm = () => {
        setEditingJobId(null);
        setJobForm({ ...initialJobForm });
    };

    const handleJobSubmit = async e => {
        e.preventDefault();

        if (submitting) return;

        setSubmitting(true);

        try {
            const response = editingJobId
                ? await API.put(
                    `/jobs/${editingJobId}`,
                    jobForm
                )
                : await API.post("/jobs", jobForm);

            setMessage(response.data.message);

            resetJobForm();
            setView("myjobs");

            await loadData();

        } catch (error) {
            setMessage(
                error.response?.data?.message ||
                "Job operation failed."
            );

        } finally {
            setSubmitting(false);
        }
    };

    const editJob = job => {
        setEditingJobId(job.id);

        setJobForm({
            title: job.title || "",
            description: job.description || "",
            requirements: job.requirements || "",
            location: job.location || "",
            job_type: job.job_type || "Internship",
            salary: job.salary || "",
            skills: job.skills || "",
            deadline: job.deadline
                ? String(job.deadline).substring(0, 10)
                : ""
        });

        setView("postjob");

        window.scrollTo({
            top: 0,
            behavior: "smooth"
        });
    };

    const deleteJob = async id => {
        if (!window.confirm("Are you sure you want to delete this job?")) {
            return;
        }

        try {
            const response = await API.delete(`/jobs/${id}`);

            setMessage(response.data.message);
            await loadData();

        } catch (error) {
            setMessage(
                error.response?.data?.message ||
                "Delete failed."
            );
        }
    };

    // =========================
    // NAVIGATION
    // =========================

    const studentNav = [
        ["jobs", "⌕", "Find Jobs"],
        ["randomjob", "✦", "Random Job"],
        ["applications", "▤", "My Applications"],
        ["saved", "♡", "Saved Jobs"],
        ["notifications", "♧", `Notifications (${unreadCount})`],
        ["profile", "◉", "My Profile"]
    ];

    const recruiterNav = [
        ["overview", "⌂", "Overview"],
        ["postjob", "＋", "Post a Job"],
        ["myjobs", "▣", "My Posted Jobs"],
        ["applicants", "♙", "Applications"],
        ["profile", "◉", "My Profile"]
    ];

    const adminNav = [
        ["overview", "⌂", "Overview"],
        ["users", "♙", "All Users"],
        ["companies", "▦", "Companies"],
        ["jobs", "▣", "Manage Jobs"],
        ["profile", "◉", "My Profile"]
    ];

    const navItems =
        user.role === "admin"
            ? adminNav
            : user.role === "recruiter"
                ? recruiterNav
                : studentNav;

    const pageTitle = {
        jobs: "Find Opportunities",
        randomjob: "Random Job Discovery",
        applications: "My Applications",
        saved: "Saved Jobs",
        notifications: "Notifications",
        overview: "Dashboard Overview",
        postjob: editingJobId
            ? "Edit Job"
            : "Post a New Job",
        myjobs: "My Posted Jobs",
        applicants: "Student Applications",
        users: "Registered Users",
        companies: "Company Verification",
        profile: "My Profile"
    };

    // =========================
    // REUSABLE COMPONENTS
    // =========================

    const statCard = (label, value, icon, color) => (
        <div className="stat-card" key={label}>
            <div className="stat-info">
                <p>{label}</p>
                <h2>{value ?? 0}</h2>
            </div>

            <div
                className="stat-icon"
                style={{ background: color }}
            >
                {icon}
            </div>
        </div>
    );

    const emptyState = (title, description) => (
        <div className="empty-state">
            <div className="empty-icon">▤</div>
            <h3>{title}</h3>
            <p>{description}</p>
        </div>
    );

    // =========================
    // LOADING SCREEN
    // =========================

    if (loading) {
        return (
            <div className="loading-screen">
                <div className="loader"></div>
                <h3>CareerConnect</h3>
                <p>Loading your dashboard...</p>
            </div>
        );
    }

    // =========================
    // MAIN DASHBOARD
    // =========================

    return (
        <div className="portal-layout">

            {/* SIDEBAR */}

            <aside className="sidebar">
                <div className="brand">
                    <div className="brand-logo">JP</div>

                    <div>
                        <h2>
                            Career<span>Connect</span>
                        </h2>
                        <small>JOB & INTERNSHIP PORTAL</small>
                    </div>
                </div>

                <button
                    type="button"
                    className="sidebar-profile sidebar-profile-button"
                    onClick={() => {
                        setView("profile");
                        setMessage("");
                    }}
                    title="Open My Profile"
                >
                    <div className="avatar">
                        {profileInitial}
                    </div>

                    <div
                        className="profile-info"
                        style={{
                            display: "flex",
                            flexDirection: "column",
                            gap: "4px",
                            minWidth: 0
                        }}
                    >
                        <strong>{profileName}</strong>
                        <small>{profileRole}</small>
                    </div>
                </button>

                <p className="nav-heading">WORKSPACE</p>

                <nav className="side-nav">
                    {navItems.map(([key, icon, label]) => (
                        <button
                            key={key}
                            type="button"
                            className={
                                view === key
                                    ? "nav-link active"
                                    : "nav-link"
                            }
                            onClick={() => {
                                setView(key);
                                setMessage("");

                                if (key === "saved") {
                                    loadSavedJobs();
                                }

                                if (
                                    key === "applications" &&
                                    user.role === "student"
                                ) {
                                    loadMyApplications();
                                }

                                if (key === "notifications") {
                                    loadNotifications();
                                }

                                if (
                                    key === "overview" &&
                                    user.role === "admin"
                                ) {
                                    loadAdminDashboard();
                                }

                                if (
                                    key === "overview" &&
                                    user.role === "recruiter"
                                ) {
                                    loadData();
                                }

                                if (
                                    key === "jobs" &&
                                    user.role === "student"
                                ) {
                                    loadData();
                                }

                                if (
                                    ["users", "companies"].includes(key) &&
                                    user.role === "admin"
                                ) {
                                    loadAdminDashboard();
                                }

                                if (
                                    key === "jobs" &&
                                    user.role === "admin"
                                ) {
                                    loadAdminDashboard();
                                }

                                if (
                                    ["myjobs", "applicants"].includes(key) &&
                                    user.role === "recruiter"
                                ) {
                                    loadData();
                                }
                            }}
                        >
                            <span className="nav-icon">{icon}</span>
                            <span>{label}</span>
                        </button>
                    ))}
                </nav>

                <div className="sidebar-bottom">
                    <div className="help-card">
                        <div className="help-icon">✦</div>
                        <strong>Need help?</strong>
                        <p>
                            Explore opportunities and grow your career.
                        </p>
                    </div>

                    <button
                        className="logout-btn"
                        onClick={onLogout}
                    >
                        ⇥ <span>Logout</span>
                    </button>
                </div>
            </aside>

            {/* MAIN AREA */}

            <main className="main-area">

                {/* TOPBAR */}

                <header className="topbar">
                    <div>
                        <span className="topbar-label">
                            CAREERCONNECT WORKSPACE
                        </span>

                        <h1>
                            {pageTitle[view] || "Dashboard"}
                        </h1>

                        <p>
                            Welcome back, {profileName}. Here's what's
                            happening today.
                        </p>
                    </div>

                    <button
                        type="button"
                        className="topbar-user topbar-profile-button"
                        onClick={() => {
                            setView("profile");
                            setMessage("");
                        }}
                        title="Open My Profile"
                    >
                        <div className="top-avatar">
                            {profileInitial}
                        </div>

                        <div
                            style={{
                                display: "flex",
                                flexDirection: "column",
                                gap: "4px"
                            }}
                        >
                            <strong>{profileName}</strong>
                            <small>{profileRole}</small>
                        </div>
                    </button>
                </header>

                {/* MESSAGE */}

                {message && (
                    <div className="alert-message">
                        <span>{message}</span>

                        <button
                            onClick={() => setMessage("")}
                            aria-label="Close message"
                        >
                            ×
                        </button>
                    </div>
                )}

                {/* =========================
                    PROFILE PAGE
                ========================= */}

                {view === "profile" && (
                    <section className="profile-page">

                        <div className="profile-cover">
                            <div className="profile-cover-text">
                                <span>CAREERCONNECT ACCOUNT</span>
                                <h2>My Profile</h2>
                                <p>
                                    Manage your personal account information.
                                </p>
                            </div>
                        </div>

                        <div className="profile-main-card">

                            <div className="profile-user-heading">
                                <div className="profile-large-avatar">
                                    {profileInitial}
                                </div>

                                <div className="profile-user-title">
                                    <h2>{profileName}</h2>
                                    <span className={`role-badge ${profileRole}`}>
                                        {profileRole}
                                    </span>
                                </div>

                                {!editingProfile && (
                                    <button
                                        type="button"
                                        className="primary-btn"
                                        onClick={() => {
                                            setProfileForm({
                                                name: profileData.name || "",
                                                email: profileData.email || "",
                                                phone: profileData.phone || ""
                                            });

                                            setEditingProfile(true);
                                            setMessage("");
                                        }}
                                    >
                                        ✎ Edit Profile
                                    </button>
                                )}
                            </div>

                            <div className="profile-divider"></div>

                            <div className="profile-section-heading">
                                <h3>
                                    {editingProfile
                                        ? "Edit Personal Information"
                                        : "Personal Information"}
                                </h3>

                                <p>
                                    {editingProfile
                                        ? "Update your name, email address and phone number."
                                        : "Your registered account details"}
                                </p>
                            </div>

                            {editingProfile ? (
                                <form onSubmit={saveProfile}>

                                    <div className="profile-edit-grid">

                                        <label>
                                            Full Name

                                            <input
                                                type="text"
                                                name="name"
                                                value={profileForm.name}
                                                onChange={handleProfileChange}
                                                placeholder="Enter your full name"
                                                minLength={2}
                                                maxLength={100}
                                                required
                                            />
                                        </label>

                                        <label>
                                            Email Address

                                            <input
                                                type="email"
                                                name="email"
                                                value={profileForm.email}
                                                onChange={handleProfileChange}
                                                placeholder="Enter your email address"
                                                required
                                            />
                                        </label>

                                        <label>
                                            Phone Number

                                            <input
                                                type="tel"
                                                name="phone"
                                                value={profileForm.phone}
                                                onChange={handleProfileChange}
                                                placeholder="Enter your phone number"
                                            />
                                        </label>

                                    </div>

                                    <div className="form-actions">

                                        <button
                                            type="submit"
                                            className="primary-btn"
                                            disabled={savingProfile}
                                        >
                                            {savingProfile
                                                ? "Saving..."
                                                : "Save Changes"}
                                        </button>

                                        <button
                                            type="button"
                                            className="secondary-btn"
                                            onClick={cancelProfileEdit}
                                            disabled={savingProfile}
                                        >
                                            Cancel
                                        </button>

                                    </div>
                                </form>
                            ) : (
                                <>
                                    <div className="profile-details-grid">

                                        <div className="profile-detail-box">
                                            <span className="profile-detail-icon">♙</span>
                                            <div>
                                                <label>Full Name</label>
                                                <p>{profileName}</p>
                                            </div>
                                        </div>

                                        <div className="profile-detail-box">
                                            <span className="profile-detail-icon">✉</span>
                                            <div>
                                                <label>Email Address</label>
                                                <p>{profileEmail}</p>
                                            </div>
                                        </div>

                                        <div className="profile-detail-box">
                                            <span className="profile-detail-icon">☎</span>
                                            <div>
                                                <label>Phone Number</label>
                                                <p>{profilePhone}</p>
                                            </div>
                                        </div>

                                        <div className="profile-detail-box">
                                            <span className="profile-detail-icon">▣</span>
                                            <div>
                                                <label>Account Type</label>
                                                <p className="capitalize-text">
                                                    {profileRole}
                                                </p>
                                            </div>
                                        </div>

                                    </div>

                                    <div className="profile-note">
                                        <span>ⓘ</span>
                                        <p>
                                            Your profile information is saved in your account.
                                        </p>
                                    </div>
                                </>
                            )}

                        </div>
                    </section>
                )}

                {/* =========================
                    STUDENT DASHBOARD
                ========================= */}

                {user.role === "student" && (
                    <>

                        {/* RANDOM JOB DISCOVERY */}

                        {view === "randomjob" && (
                            <>
                                <section className="section-heading">
                                    <div>
                                        <h2>✦ Discover a Random Job</h2>
                                        <p>
                                            Discover a random job opportunity
                                            from available job listings.
                                        </p>
                                    </div>
                                </section>

                                <div
                                    className="content-card"
                                    style={{
                                        padding: "30px",
                                        marginBottom: "25px"
                                    }}
                                >
                                    <h2>Random Job Discovery</h2>

                                    <p>
                                        Click the button below to get a
                                        randomly selected job using our
                                        Spring Boot recommendation service.
                                    </p>

                                    <button
                                        type="button"
                                        className="primary-btn"
                                        onClick={getRandomJob}
                                        disabled={randomLoading}
                                    >
                                        {randomLoading
                                            ? "Finding Job..."
                                            : "✦ Get Random Job"}
                                    </button>

                                    {randomError && (
                                        <p
                                            style={{
                                                color: "red",
                                                marginTop: "15px"
                                            }}
                                        >
                                            {randomError}
                                        </p>
                                    )}

                                    {randomJob && (
                                        <article
                                            className="job-card"
                                            style={{
                                                marginTop: "25px",
                                                maxWidth: "600px"
                                            }}
                                        >
                                            <div className="job-company-row">
                                                <img
                                                    src={images.company}
                                                    alt="Company"
                                                />

                                                <span className="job-type">
                                                    {randomJob.job_type || "Job"}
                                                </span>
                                            </div>

                                            <h3>{randomJob.title}</h3>

                                            <p className="company-name">
                                                {randomJob.company_name || "Company"}
                                            </p>

                                            <div className="job-meta">
                                                <span>
                                                    ⌖ {randomJob.location || "Not specified"}
                                                </span>

                                                <span>
                                                    ₹ {randomJob.salary || "Not disclosed"}
                                                </span>
                                            </div>

                                            <p className="job-description">
                                                {randomJob.description ||
                                                    "No description available"}
                                            </p>

                                            <div className="skill-line">
                                                {Array.isArray(randomJob.skills)
                                                    ? randomJob.skills.join(", ")
                                                    : randomJob.skills ||
                                                        "Skills not specified"}
                                            </div>

                                            <button
                                                type="button"
                                                className="primary-btn"
                                                onClick={() => {
                                                    setView("jobs");
                                                    setSearch(randomJob.title || "");
                                                }}
                                            >
                                                View This Job in Find Jobs
                                            </button>
                                        </article>
                                    )}
                                </div>
                            </>
                        )}

                        {/* FIND JOBS */}

                        {view === "jobs" && (
                            <>
                                <section className="hero-banner student-hero">
                                    <div className="hero-content">
                                        <span className="hero-tag">
                                            YOUR CAREER STARTS HERE
                                        </span>

                                        <h2>
                                            Discover your next
                                            <br />
                                            career opportunity.
                                        </h2>

                                        <p>
                                            Find internships and jobs that
                                            match your skills and ambitions.
                                        </p>

                                        <button
                                            onClick={() =>
                                                document
                                                    .getElementById("job-search")
                                                    ?.scrollIntoView({
                                                        behavior: "smooth"
                                                    })
                                            }
                                        >
                                            Explore Jobs →
                                        </button>
                                    </div>

                                    <img
                                        src={images.student}
                                        alt="Students working together"
                                    />
                                </section>

                                <section
                                    className="section-heading"
                                    id="job-search"
                                >
                                    <div>
                                        <h2>Explore Opportunities</h2>
                                        <p>
                                            Find the right job for your future.
                                        </p>
                                    </div>

                                    <span className="result-count">
                                        {filteredJobs.length} jobs found
                                    </span>
                                </section>

                                <div className="filter-panel">
                                    <input
                                        placeholder="Search job, company or skills"
                                        value={search}
                                        onChange={e =>
                                            setSearch(e.target.value)
                                        }
                                    />

                                    <input
                                        placeholder="Location"
                                        value={locationFilter}
                                        onChange={e =>
                                            setLocationFilter(e.target.value)
                                        }
                                    />

                                    <select
                                        value={typeFilter}
                                        onChange={e =>
                                            setTypeFilter(e.target.value)
                                        }
                                    >
                                        <option value="All">All Job Types</option>
                                        <option value="Internship">Internship</option>
                                        <option value="Full Time">Full Time</option>
                                        <option value="Part Time">Part Time</option>
                                    </select>

                                    <button
                                        className="secondary-btn"
                                        onClick={() => {
                                            setSearch("");
                                            setLocationFilter("");
                                            setTypeFilter("All");
                                        }}
                                    >
                                        Reset
                                    </button>
                                </div>

                                <div className="job-grid">
                                    {filteredJobs.map(job => (
                                        <article
                                            className="job-card"
                                            key={job.id}
                                        >
                                            <div className="job-company-row">
                                                <img
                                                    src={images.company}
                                                    alt="Company office"
                                                />

                                                <span className="job-type">
                                                    {job.job_type}
                                                </span>
                                            </div>

                                            <h3>{job.title}</h3>

                                            <p className="company-name">
                                                {job.company_name || "Company"}
                                            </p>

                                            <div className="job-meta">
                                                <span>⌖ {job.location}</span>
                                                <span>
                                                    ₹ {job.salary || "Not disclosed"}
                                                </span>
                                            </div>

                                            <p className="job-description">
                                                {job.description}
                                            </p>

                                            <div className="skill-line">
                                                {job.skills}
                                            </div>

                                            <label className="resume-label">
                                                Upload Resume (PDF/DOC)
                                            </label>

                                            <input
                                                className="file-input"
                                                type="file"
                                                accept=".pdf,.doc,.docx"
                                                onChange={e =>
                                                    setSelectedResumes(prev => ({
                                                        ...prev,
                                                        [job.id]: e.target.files[0]
                                                    }))
                                                }
                                            />

                                            <div className="card-actions">
                                                <button
                                                    className="primary-btn"
                                                    onClick={() =>
                                                        applyJob(job.id)
                                                    }
                                                >
                                                    Apply Now
                                                </button>

                                                <button
                                                    className="icon-btn"
                                                    title="Save job"
                                                    onClick={() =>
                                                        saveJob(job.id)
                                                    }
                                                >
                                                    ♡
                                                </button>
                                            </div>
                                        </article>
                                    ))}
                                </div>

                                {filteredJobs.length === 0 &&
                                    emptyState(
                                        "No jobs found",
                                        "Try changing your search or filters."
                                    )}
                            </>
                        )}

                        {/* MY APPLICATIONS */}

                        {view === "applications" && (
                            <>
                                <section className="section-heading">
                                    <div>
                                        <h2>Application Tracking</h2>
                                        <p>
                                            Track the progress of your job
                                            applications.
                                        </p>
                                    </div>
                                </section>

                                {myApplications.length === 0 ? (
                                    emptyState(
                                        "No applications yet",
                                        "Apply for a job to see your application status here."
                                    )
                                ) : (
                                    <div className="content-card table-wrap">
                                        <table>
                                            <thead>
                                                <tr>
                                                    <th>Job</th>
                                                    <th>Company</th>
                                                    <th>Location</th>
                                                    <th>Applied Date</th>
                                                    <th>Status</th>
                                                </tr>
                                            </thead>

                                            <tbody>
                                                {myApplications.map(app => (
                                                    <tr key={app.id}>
                                                        <td>
                                                            <strong>{app.title}</strong>
                                                        </td>
                                                        <td>{app.company_name}</td>
                                                        <td>{app.location}</td>
                                                        <td>
                                                            {new Date(
                                                                app.applied_at
                                                            ).toLocaleDateString()}
                                                        </td>
                                                        <td>
                                                            <span
                                                                className={`status-badge ${String(
                                                                    app.status
                                                                ).toLowerCase()}`}
                                                            >
                                                                {app.status}
                                                            </span>
                                                        </td>
                                                    </tr>
                                                ))}
                                            </tbody>
                                        </table>
                                    </div>
                                )}
                            </>
                        )}

                        {/* SAVED JOBS */}

                        {view === "saved" && (
                            <>
                                <section className="section-heading">
                                    <div>
                                        <h2>Saved Jobs</h2>
                                        <p>Your bookmarked opportunities.</p>
                                    </div>
                                </section>

                                <div className="job-grid">
                                    {savedJobs.length === 0 ? (
                                        emptyState(
                                            "No saved jobs",
                                            "Save interesting jobs to view them here."
                                        )
                                    ) : (
                                        savedJobs.map(job => (
                                            <article
                                                className="job-card"
                                                key={job.id}
                                            >
                                                <img
                                                    className="saved-company-image"
                                                    src={images.company}
                                                    alt="Company"
                                                />

                                                <h3>{job.title}</h3>
                                                <p>{job.company_name}</p>

                                                <div className="job-meta">
                                                    <span>⌖ {job.location}</span>
                                                    <span>{job.job_type}</span>
                                                </div>

                                                <p>₹ {job.salary}</p>

                                                <button
                                                    className="danger-btn"
                                                    onClick={() =>
                                                        removeSavedJob(job.id)
                                                    }
                                                >
                                                    Remove Saved Job
                                                </button>
                                            </article>
                                        ))
                                    )}
                                </div>
                            </>
                        )}

                        {/* NOTIFICATIONS */}

                        {view === "notifications" && (
                            <>
                                <section className="section-heading">
                                    <div>
                                        <h2>Your Notifications</h2>
                                        <p>
                                            {unreadCount} unread notifications
                                        </p>
                                    </div>

                                    <button
                                        className="secondary-btn"
                                        onClick={loadNotifications}
                                    >
                                        ↻ Refresh
                                    </button>
                                </section>

                                {notifications.length === 0 ? (
                                    emptyState(
                                        "You're all caught up",
                                        "New updates will appear here."
                                    )
                                ) : (
                                    notifications.map(item => (
                                        <div
                                            className={`notification-card ${
                                                item.is_read ? "read" : "unread"
                                            }`}
                                            key={item.id}
                                        >
                                            <div className="notification-icon">
                                                ♧
                                            </div>

                                            <div className="notification-content">
                                                <p>{item.message}</p>
                                                <small>
                                                    {new Date(
                                                        item.created_at
                                                    ).toLocaleString()}
                                                </small>
                                            </div>

                                            {!item.is_read && (
                                                <button
                                                    className="secondary-btn"
                                                    onClick={() =>
                                                        markAsRead(item.id)
                                                    }
                                                >
                                                    Mark as read
                                                </button>
                                            )}
                                        </div>
                                    ))
                                )}
                            </>
                        )}
                    </>
                )}

                {/* =========================
                    RECRUITER DASHBOARD
                ========================= */}

                {user.role === "recruiter" && (
                    <>

                        {/* RECRUITER OVERVIEW */}

                        {view === "overview" && (
                            <>
                                <section className="hero-banner recruiter-hero">
                                    <div className="hero-content">
                                        <span className="hero-tag">
                                            RECRUITER WORKSPACE
                                        </span>

                                        <h2>
                                            Find the right talent
                                            <br />
                                            for your team.
                                        </h2>

                                        <p>
                                            Post opportunities, manage applicants
                                            and build your team.
                                        </p>

                                        <button
                                            onClick={() => {
                                                resetJobForm();
                                                setView("postjob");
                                            }}
                                        >
                                            Post a Job +
                                        </button>
                                    </div>

                                    <img
                                        src={images.recruiter}
                                        alt="Recruitment team working"
                                    />
                                </section>

                                <div className="stats-grid">
                                    {statCard(
                                        "Jobs Posted",
                                        recruiterJobs.length,
                                        "▣",
                                        "#e9efff"
                                    )}

                                    {statCard(
                                        "Applications Received",
                                        applications.length,
                                        "♙",
                                        "#e8f7f0"
                                    )}

                                    {statCard(
                                        "Pending Reviews",
                                        applications.filter(
                                            a => a.status === "Pending"
                                        ).length,
                                        "◷",
                                        "#fff4df"
                                    )}
                                </div>

                                <section className="section-heading">
                                    <div>
                                        <h2>Recent Job Posts</h2>
                                        <p>Your latest opportunities.</p>
                                    </div>

                                    <button
                                        className="secondary-btn"
                                        onClick={() => setView("myjobs")}
                                    >
                                        View all
                                    </button>
                                </section>

                                <div className="job-grid">
                                    {recruiterJobs.slice(0, 3).map(job => (
                                        <article
                                            className="job-card"
                                            key={job.id}
                                        >
                                            <h3>{job.title}</h3>
                                            <p>{job.location}</p>

                                            <span className="job-type">
                                                {job.job_type}
                                            </span>

                                            <p>₹ {job.salary}</p>
                                        </article>
                                    ))}

                                    {recruiterJobs.length === 0 &&
                                        emptyState(
                                            "No job posts yet",
                                            "Create your first job post to get started."
                                        )}
                                </div>
                            </>
                        )}

                        {/* POST / EDIT JOB */}

                        {view === "postjob" && (
                            <>
                                <section className="section-heading">
                                    <div>
                                        <h2>
                                            {editingJobId
                                                ? "Update Job Details"
                                                : "Create a Job Listing"}
                                        </h2>

                                        <p>
                                            Share the opportunity with potential
                                            candidates.
                                        </p>
                                    </div>
                                </section>

                                <form
                                    className="content-card job-form"
                                    onSubmit={handleJobSubmit}
                                >
                                    <div className="form-grid">
                                        <label>
                                            Job Title
                                            <input
                                                name="title"
                                                placeholder="e.g. Frontend Developer"
                                                value={jobForm.title}
                                                onChange={handleJobChange}
                                                required
                                            />
                                        </label>

                                        <label>
                                            Location
                                            <input
                                                name="location"
                                                placeholder="e.g. Bengaluru"
                                                value={jobForm.location}
                                                onChange={handleJobChange}
                                            />
                                        </label>

                                        <label>
                                            Job Type
                                            <select
                                                name="job_type"
                                                value={jobForm.job_type}
                                                onChange={handleJobChange}
                                            >
                                                <option>Internship</option>
                                                <option>Full Time</option>
                                                <option>Part Time</option>
                                            </select>
                                        </label>

                                        <label>
                                            Salary
                                            <input
                                                name="salary"
                                                placeholder="e.g. 15000 per month"
                                                value={jobForm.salary}
                                                onChange={handleJobChange}
                                            />
                                        </label>

                                        <label>
                                            Required Skills
                                            <input
                                                name="skills"
                                                placeholder="HTML, CSS, React"
                                                value={jobForm.skills}
                                                onChange={handleJobChange}
                                            />
                                        </label>

                                        <label>
                                            Application Deadline
                                            <input
                                                type="date"
                                                name="deadline"
                                                value={jobForm.deadline}
                                                onChange={handleJobChange}
                                            />
                                        </label>

                                        <label className="full-field">
                                            Job Description
                                            <textarea
                                                name="description"
                                                rows="4"
                                                placeholder="Describe the role..."
                                                value={jobForm.description}
                                                onChange={handleJobChange}
                                                required
                                            />
                                        </label>

                                        <label className="full-field">
                                            Requirements
                                            <textarea
                                                name="requirements"
                                                rows="3"
                                                placeholder="Candidate requirements..."
                                                value={jobForm.requirements}
                                                onChange={handleJobChange}
                                            />
                                        </label>
                                    </div>

                                    <div className="form-actions">
                                        <button
                                            className="primary-btn"
                                            type="submit"
                                            disabled={submitting}
                                        >
                                            {submitting
                                                ? "Please wait..."
                                                : editingJobId
                                                    ? "Update Job"
                                                    : "Publish Job"}
                                        </button>

                                        {editingJobId && (
                                            <button
                                                type="button"
                                                className="secondary-btn"
                                                onClick={resetJobForm}
                                            >
                                                Cancel
                                            </button>
                                        )}
                                    </div>
                                </form>
                            </>
                        )}

                        {/* MY POSTED JOBS */}

                        {view === "myjobs" && (
                            <>
                                <section className="section-heading">
                                    <div>
                                        <h2>Manage Job Listings</h2>
                                        <p>
                                            {recruiterJobs.length} jobs posted by you.
                                        </p>
                                    </div>

                                    <button
                                        className="primary-btn"
                                        onClick={() => {
                                            resetJobForm();
                                            setView("postjob");
                                        }}
                                    >
                                        + Post Job
                                    </button>
                                </section>

                                <div className="job-grid">
                                    {recruiterJobs.map(job => (
                                        <article
                                            className="job-card"
                                            key={job.id}
                                        >
                                            <span className="job-type">
                                                {job.job_type}
                                            </span>

                                            <h3>{job.title}</h3>

                                            <div className="job-meta">
                                                <span>⌖ {job.location}</span>
                                                <span>₹ {job.salary}</span>
                                            </div>

                                            <p>{job.skills}</p>

                                            <div className="card-actions">
                                                <button
                                                    className="primary-btn"
                                                    onClick={() => editJob(job)}
                                                >
                                                    Edit
                                                </button>

                                                <button
                                                    className="danger-btn"
                                                    onClick={() =>
                                                        deleteJob(job.id)
                                                    }
                                                >
                                                    Delete
                                                </button>
                                            </div>
                                        </article>
                                    ))}
                                </div>

                                {recruiterJobs.length === 0 &&
                                    emptyState(
                                        "No jobs posted",
                                        "Publish a job to start receiving applications."
                                    )}
                            </>
                        )}

                        {/* APPLICANTS */}

                        {view === "applicants" && (
                            <>
                                <section className="section-heading">
                                    <div>
                                        <h2>Candidate Applications</h2>
                                        <p>
                                            Review resumes and update application
                                            status.
                                        </p>
                                    </div>
                                </section>

                                {applications.length === 0 ? (
                                    emptyState(
                                        "No applications received",
                                        "Applications from students will appear here."
                                    )
                                ) : (
                                    <div className="applicant-grid">
                                        {applications.map(app => (
                                            <article
                                                className="content-card applicant-card"
                                                key={app.id}
                                            >
                                                <div className="applicant-heading">
                                                    <div className="avatar">
                                                        {app.student_name
                                                            ?.charAt(0)
                                                            ?.toUpperCase()}
                                                    </div>

                                                    <div>
                                                        <h3>{app.student_name}</h3>
                                                        <small>
                                                            {app.student_email}
                                                        </small>
                                                    </div>
                                                </div>

                                                <p>
                                                    <strong>Job:</strong>{" "}
                                                    {app.job_title}
                                                </p>

                                                <p>
                                                    <strong>Phone:</strong>{" "}
                                                    {app.student_phone ||
                                                        "Not provided"}
                                                </p>

                                                {app.resume && (
                                                    <a
                                                        className="resume-link"
                                                        href={`http://localhost:5000${app.resume}`}
                                                        target="_blank"
                                                        rel="noreferrer"
                                                    >
                                                        View Candidate Resume ↗
                                                    </a>
                                                )}

                                                <label className="status-label">
                                                    Application Status
                                                </label>

                                                <select
                                                    value={app.status}
                                                    onChange={e =>
                                                        updateStatus(
                                                            app.id,
                                                            e.target.value
                                                        )
                                                    }
                                                >
                                                    <option>Pending</option>
                                                    <option>Reviewed</option>
                                                    <option>Shortlisted</option>
                                                    <option>Rejected</option>
                                                    <option>Selected</option>
                                                </select>
                                            </article>
                                        ))}
                                    </div>
                                )}
                            </>
                        )}
                    </>
                )}

                {/* =========================
                    ADMIN DASHBOARD
                ========================= */}

                {user.role === "admin" && (
                    <>

                        {/* ADMIN OVERVIEW */}

                        {view === "overview" && (
                            <>
                                <section className="hero-banner admin-hero">
                                    <div className="hero-content">
                                        <span className="hero-tag">
                                            ADMINISTRATION
                                        </span>

                                        <h2>
                                            Manage your portal
                                            <br />
                                            with confidence.
                                        </h2>

                                        <p>
                                            Monitor users, companies and job
                                            activities from one place.
                                        </p>

                                        <button
                                            onClick={refreshAdminDashboard}
                                            disabled={refreshing}
                                        >
                                            {refreshing
                                                ? "Refreshing..."
                                                : "↻ Refresh Dashboard"}
                                        </button>
                                    </div>

                                    <img
                                        src={images.admin}
                                        alt="Analytics dashboard"
                                    />
                                </section>

                                <div className="stats-grid admin-stats">
                                    {statCard(
                                        "Total Users",
                                        adminStats.totalUsers,
                                        "♙",
                                        "#e9efff"
                                    )}

                                    {statCard(
                                        "Students",
                                        adminStats.totalStudents,
                                        "♧",
                                        "#e8f7f0"
                                    )}

                                    {statCard(
                                        "Recruiters",
                                        adminStats.totalRecruiters,
                                        "♙",
                                        "#fff4df"
                                    )}

                                    {statCard(
                                        "Total Jobs",
                                        adminStats.totalJobs,
                                        "▣",
                                        "#f1eaff"
                                    )}

                                    {statCard(
                                        "Companies",
                                        adminStats.totalCompanies,
                                        "▦",
                                        "#ffeef0"
                                    )}
                                </div>

                                <section className="section-heading">
                                    <div>
                                        <h2>Quick Management</h2>
                                        <p>
                                            Access portal administration tools.
                                        </p>
                                    </div>

                                    <button
                                        className="secondary-btn"
                                        onClick={refreshAdminDashboard}
                                        disabled={refreshing}
                                    >
                                        {refreshing ? "Loading..." : "↻ Refresh"}
                                    </button>
                                </section>

                                <div className="quick-grid">
                                    <button onClick={() => setView("users")}>
                                        <span>♙</span>
                                        <strong>Manage Users</strong>
                                        <small>
                                            {adminUsers.length} registered accounts
                                        </small>
                                    </button>

                                    <button onClick={() => setView("companies")}>
                                        <span>▦</span>
                                        <strong>Verify Companies</strong>
                                        <small>
                                            {adminCompanies.length} registered companies
                                        </small>
                                    </button>

                                    <button onClick={() => setView("jobs")}>
                                        <span>▣</span>
                                        <strong>Manage Jobs</strong>
                                        <small>
                                            {adminJobs.length} job listings
                                        </small>
                                    </button>
                                </div>
                            </>
                        )}

                        {/* ADMIN USERS */}

                        {view === "users" && (
                            <>
                                <section className="section-heading">
                                    <div>
                                        <h2>Registered Users</h2>
                                        <p>
                                            Search and filter portal accounts.
                                        </p>
                                    </div>

                                    <span className="result-count">
                                        {filteredAdminUsers.length} users
                                    </span>
                                </section>

                                <div className="filter-panel">
                                    <input
                                        placeholder="Search name or email"
                                        value={userSearch}
                                        onChange={e =>
                                            setUserSearch(e.target.value)
                                        }
                                    />

                                    <select
                                        value={userRoleFilter}
                                        onChange={e =>
                                            setUserRoleFilter(e.target.value)
                                        }
                                    >
                                        <option value="All">All Roles</option>
                                        <option value="student">Students</option>
                                        <option value="recruiter">Recruiters</option>
                                        <option value="admin">Admins</option>
                                    </select>

                                    <button
                                        className="secondary-btn"
                                        onClick={() => {
                                            setUserSearch("");
                                            setUserRoleFilter("All");
                                        }}
                                    >
                                        Reset
                                    </button>

                                    <button
                                        className="secondary-btn"
                                        onClick={refreshAdminDashboard}
                                        disabled={refreshing}
                                    >
                                        {refreshing ? "Loading..." : "↻ Refresh"}
                                    </button>
                                </div>

                                <div className="content-card table-wrap">
                                    <table>
                                        <thead>
                                            <tr>
                                                <th>ID</th>
                                                <th>Name</th>
                                                <th>Email</th>
                                                <th>Phone</th>
                                                <th>Role</th>
                                            </tr>
                                        </thead>

                                        <tbody>
                                            {filteredAdminUsers.map(item => (
                                                <tr key={item.id}>
                                                    <td>{item.id}</td>
                                                    <td>
                                                        <strong>{item.name}</strong>
                                                    </td>
                                                    <td>{item.email}</td>
                                                    <td>{item.phone || "—"}</td>
                                                    <td>
                                                        <span
                                                            className={`role-badge ${item.role}`}
                                                        >
                                                            {item.role}
                                                        </span>
                                                    </td>
                                                </tr>
                                            ))}
                                        </tbody>
                                    </table>

                                    {filteredAdminUsers.length === 0 && (
                                        <p className="table-empty">
                                            No matching users found.
                                        </p>
                                    )}
                                </div>
                            </>
                        )}

                        {/* ADMIN COMPANIES */}

                        {view === "companies" && (
                            <>
                                <section className="section-heading">
                                    <div>
                                        <h2>Company Verification</h2>
                                        <p>
                                            Review recruiter company registrations.
                                        </p>
                                    </div>

                                    <button
                                        className="secondary-btn"
                                        onClick={refreshAdminDashboard}
                                        disabled={refreshing}
                                    >
                                        {refreshing ? "Loading..." : "↻ Refresh"}
                                    </button>
                                </section>

                                <div className="company-grid">
                                    {adminCompanies.map(company => (
                                        <article
                                            className="content-card company-card"
                                            key={company.id}
                                        >
                                            <img
                                                src={images.company}
                                                alt="Office building"
                                            />

                                            <h3>{company.company_name}</h3>
                                            <p>{company.recruiter_name}</p>

                                            <small>
                                                {company.recruiter_email}
                                            </small>

                                            <p>
                                                ⌖ {company.location ||
                                                    "Location not provided"}
                                            </p>

                                            <span
                                                className={`status-badge ${
                                                    company.is_verified
                                                        ? "selected"
                                                        : "pending"
                                                }`}
                                            >
                                                {company.is_verified
                                                    ? "Verified"
                                                    : "Pending Verification"}
                                            </span>

                                            {!company.is_verified && (
                                                <button
                                                    className="primary-btn"
                                                    onClick={() =>
                                                        verifyCompany(company.id)
                                                    }
                                                >
                                                    Verify Company
                                                </button>
                                            )}
                                        </article>
                                    ))}
                                </div>

                                {adminCompanies.length === 0 &&
                                    emptyState(
                                        "No companies registered",
                                        "Company registrations will appear here."
                                    )}
                            </>
                        )}

                        {/* ADMIN MANAGE JOBS */}

                        {view === "jobs" && (
                            <>
                                <section className="section-heading">
                                    <div>
                                        <h2>Manage All Jobs</h2>
                                        <p>
                                            Review job listings across the portal.
                                        </p>
                                    </div>

                                    <div className="heading-actions">
                                        <span className="result-count">
                                            {adminJobs.length} jobs
                                        </span>

                                        <button
                                            className="secondary-btn"
                                            onClick={refreshAdminDashboard}
                                            disabled={refreshing}
                                        >
                                            {refreshing
                                                ? "Loading..."
                                                : "↻ Refresh"}
                                        </button>
                                    </div>
                                </section>

                                <div className="job-grid">
                                    {adminJobs.map(job => (
                                        <article
                                            className="job-card"
                                            key={job.id}
                                        >
                                            <img
                                                className="saved-company-image"
                                                src={images.company}
                                                alt="Company"
                                            />

                                            <span className="job-type">
                                                {job.job_type}
                                            </span>

                                            <h3>{job.title}</h3>

                                            <p>
                                                {job.company_name ||
                                                    "Company not listed"}
                                            </p>

                                            <div className="job-meta">
                                                <span>⌖ {job.location}</span>
                                                <span>₹ {job.salary}</span>
                                            </div>

                                            <p>{job.skills}</p>

                                            <button
                                                className="danger-btn"
                                                onClick={() =>
                                                    adminDeleteJob(job.id)
                                                }
                                            >
                                                Delete Job
                                            </button>
                                        </article>
                                    ))}
                                </div>

                                {adminJobs.length === 0 &&
                                    emptyState(
                                        "No jobs available",
                                        "New job listings will appear here."
                                    )}
                            </>
                        )}
                    </>
                )}

                {/* FOOTER */}

                <footer className="dashboard-footer">
                    <span>© 2026 CareerConnect</span>
                    <span>Job & Internship Portal</span>
                </footer>
            </main>
        </div>
    );
}

export default Dashboard;