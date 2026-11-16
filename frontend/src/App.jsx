
import { useState } from "react";
import API from "./services/api";
import Dashboard from "./components/Dashboard";
import "./App.css";

function App() {
    const [isLogin, setIsLogin] = useState(true);
    const [user, setUser] = useState(() => {
        const savedUser = localStorage.getItem("user");
        return savedUser ? JSON.parse(savedUser) : null;
    });

    const [form, setForm] = useState({
        name: "",
        email: "",
        password: "",
        phone: "",
        role: "student"
    });

    const [message, setMessage] = useState("");

    const handleChange = (e) => {
        setForm({ ...form, [e.target.name]: e.target.value });
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setMessage("Please wait...");

        try {
            const url = isLogin ? "/auth/login" : "/auth/register";
            const response = await API.post(url, form);

            if (isLogin) {
                localStorage.setItem("token", response.data.token);
                localStorage.setItem("user", JSON.stringify(response.data.user));
                setUser(response.data.user);
            } else {
                setMessage("Registration successful! Please login.");
                setIsLogin(true);
            }
        } catch (error) {
            setMessage(error.response?.data?.message || "Something went wrong");
        }
    };

    const handleLogout = () => {
        localStorage.removeItem("token");
        localStorage.removeItem("user");
        setUser(null);
        setMessage("");
    };

    if (user) {
        return <Dashboard user={user} onLogout={handleLogout} />;
    }

    return (
        <div className="app">
            <nav className="navbar">
                <h2>Job<span>Portal</span></h2>
                <p>Find Your Dream Career</p>
            </nav>

            <div className="main-container">
                <div className="welcome-section">
                    <h1>Build Your Future With Us</h1>
                    <p>Discover jobs, internships and career opportunities.</p>
                    <div className="features">
                        <p>✓ Find your dream job</p>
                        <p>✓ Apply for internships</p>
                        <p>✓ Connect with companies</p>
                    </div>
                </div>

                <div className="form-container">
                    <h2>{isLogin ? "Welcome Back!" : "Create Account"}</h2>
                    <p>{isLogin ? "Login to continue" : "Register to get started"}</p>

                    <form onSubmit={handleSubmit}>
                        {!isLogin && (
                            <>
                                <input name="name" placeholder="Full Name" value={form.name} onChange={handleChange} required />
                                <input name="phone" placeholder="Phone Number" value={form.phone} onChange={handleChange} />
                            </>
                        )}

                        <input name="email" type="email" placeholder="Email Address" value={form.email} onChange={handleChange} required />
                        <input name="password" type="password" placeholder="Password" value={form.password} onChange={handleChange} required />

                        {!isLogin && (
                            <select name="role" value={form.role} onChange={handleChange}>
                                <option value="student">Student</option>
                                <option value="recruiter">Recruiter</option>
                            </select>
                        )}

                        <button type="submit">
                            {isLogin ? "Login" : "Register"}
                        </button>
                    </form>

                    <p className="message">{message}</p>

                    <p className="switch">
                        {isLogin ? "Don't have an account?" : "Already have an account?"}
                        <span onClick={() => {
                            setIsLogin(!isLogin);
                            setMessage("");
                        }}>
                            {isLogin ? " Register" : " Login"}
                        </span>
                    </p>
                </div>
            </div>
        </div>
    );
}

export default App;
