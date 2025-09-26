import React, { useState, useEffect } from "react";
import {
  Eye,
  EyeOff,
  ArrowLeft,
  Mail,
  Lock,
  User,
  Briefcase,
  Moon,
  Sun,
  Shield,
  Sparkles,
  Zap,
  CheckCircle2
} from "lucide-react";
import { useNavigate } from "react-router-dom";
import { useDispatch } from "react-redux";
import { GoogleLogin } from "@react-oauth/google";
import {
  login,
  loginWithGoogle,
  register,
  checkUser,
  forgotPassword,
} from "../../Services/Repository/UserRepo";

const Login = () => {
  const [currentView, setCurrentView] = useState("login"); // 'login', 'register', 'forgot-password'
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const allowRegister = import.meta.env.VITE_ALLOW_REGISTER;
  console.log("Allow Register:", allowRegister);

  const [isDarkTheme, setIsDarkTheme] = useState(false);
  
  useEffect(() => {
    const savedTheme = localStorage.getItem('theme');
    if (savedTheme) {
      setIsDarkTheme(savedTheme === 'dark'); // Fixed
    } else {
      setIsDarkTheme(false); // Default to light theme
    }
  }, []);

  useEffect(() => {
    document.documentElement.setAttribute('data-theme', isDarkTheme ? 'dark' : 'light');
    localStorage.setItem('theme', isDarkTheme ? 'dark' : 'light');
  }, [isDarkTheme]);

  const toggleTheme = () => {
    setIsDarkTheme(!isDarkTheme);
  };

  // Form data
  const [formData, setFormData] = useState({
    email: "",
    password: "",
    confirmPassword: "",
    name: "",
    sector: "",
  });

  const navigate = useNavigate();
  const dispatch = useDispatch();

  const handleInputChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    });
  };

  const handleLogin = async (e) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      const result = await dispatch(
        login(formData.email, formData.password, navigate)
      );

      if (result && result.shouldShowRegister) {
        // Account doesn't exist, switch to register view with pre-filled email
        setCurrentView("register");
        // Email is already in formData
      }
    } catch (error) {
      console.error("Login error:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleRegister = async (e) => {
    e.preventDefault();

    if (formData.password !== formData.confirmPassword) {
      alert("Passwords do not match!");
      return;
    }

    if (formData.password.length < 6) {
      alert("Password must be at least 6 characters long!");
      return;
    }

    setIsLoading(true);

    try {
      await dispatch(
        register(
          formData.name,
          formData.email,
          formData.password,
          formData.sector,
          navigate
        )
      );
    } catch (error) {
      console.error("Registration error:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleForgotPassword = async (e) => {
    e.preventDefault();

    if (!formData.email) {
      alert("Please enter your email address");
      return;
    }

    setIsLoading(true);

    try {
      await dispatch(forgotPassword(formData.email));
      // After successful OTP send, navigate to verify email for password reset
      navigate("/verify-email", {
        state: { email: formData.email, type: "password-reset" },
      });
    } catch (error) {
      console.error("Forgot password error:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleGoogleSuccess = async (credentialResponse) => {
    try {
      await dispatch(loginWithGoogle(credentialResponse, navigate));
    } catch (error) {
      console.error("Google login error:", error);
    }
  };

  const handleGoogleError = () => {
    alert("Google Sign-In failed");
  };

  const resetForm = () => {
    setFormData({
      email: formData.email, // Keep email when switching views
      password: "",
      confirmPassword: "",
      name: "",
      occupation: "",
    });
  };

  const switchView = (view) => {
    setCurrentView(view);
    resetForm();
  };

  return (
    <div className="min-h-screen bg-[var(--bg-primary)] text-[var(--text-primary)] antialiased selection:bg-[var(--accent-color)]/10 selection:text-[var(--text-primary)] font-[Manrope,ui-sans-serif,system-ui,-apple-system,'Segoe_UI',Roboto,Helvetica,Arial]">
      
      {/* Top Nav */}
      <header className="w-full">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-4 flex items-center justify-between">
          <button
            onClick={() => navigate("/")}
            className="inline-flex items-center gap-2 group"
          >
            <div className="h-8 w-8 rounded-md bg-[var(--accent-color)] text-[var(--button-text)] flex items-center justify-center shadow-sm ring-1 ring-black/5">
              <span className="text-xs font-medium tracking-tight font-[Varela_Round,Manrope,ui-sans-serif]">AG</span>
            </div>
            <span className="text-sm sm:text-base text-[var(--text-primary)] font-medium tracking-tight font-[Varela_Round,Manrope,ui-sans-serif]">AdGuard AI</span>
          </button>
          
          <div className="flex items-center gap-3">
            <button 
              onClick={toggleTheme}
              className="p-2 rounded-md bg-[var(--card-bg)] border border-[var(--border-color)] hover:bg-[var(--bg-secondary)] transition-colors"
              aria-label="Toggle theme"
            >
              {isDarkTheme ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
            </button>
            <button
              onClick={() => navigate("/")}
              className="inline-flex items-center gap-2 text-sm text-[var(--text-secondary)] hover:text-[var(--text-primary)] transition-colors"
            >
              <ArrowLeft className="w-4 h-4" />
              Back to Home
            </button>
          </div>
        </div>
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="h-px w-full bg-[var(--border-color)]"></div>
        </div>
      </header>

      {/* Main Content */}
      <section className="relative py-10 sm:py-14 flex items-center justify-center min-h-[calc(100vh-120px)]">
        <div className="mx-auto max-w-md w-full px-6">
          
          {/* Main Card */}
          <div className="relative overflow-hidden rounded-2xl bg-[var(--card-bg)] border border-[var(--border-color)] shadow-xl">
            <div className="absolute inset-0 pointer-events-none" aria-hidden="true"></div>
            
            {/* Header Section */}
            <div className="bg-gradient-to-r from-[var(--accent-color)]/10 to-blue-500/10 p-6 text-center border-b border-[var(--border-color)]">
              <div className="w-16 h-16 bg-gradient-to-r from-[var(--accent-color)] to-blue-500 rounded-xl flex items-center justify-center mx-auto mb-4">
                <Shield className="w-8 h-8 text-white" />
              </div>
              <h1 className="text-2xl font-bold text-[var(--text-primary)] mb-2 font-[Varela_Round,Manrope,ui-sans-serif]">
                {currentView === "login" ? "Welcome Back" : 
                 currentView === "register" ? "Create Account" : 
                 "Reset Password"}
              </h1>
              <p className="text-[var(--text-secondary)] text-sm">
                {currentView === "login" ? "Sign in to access your compliance dashboard" :
                 currentView === "register" ? "Join thousands of advertisers using AdGuard AI" :
                 "Enter your email to receive a reset code"}
              </p>
            </div>

            {/* Login View */}
            {currentView === "login" && (
              <div className="p-6 space-y-6">
                <div className="space-y-4">
                  <div>
                    <label
                      htmlFor="email"
                      className="block text-sm font-medium text-[var(--text-secondary)] mb-2"
                    >
                      Email Address
                    </label>
                    <div className="relative">
                      <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 text-[var(--text-secondary)] w-5 h-5" />
                      <input
                        type="email"
                        id="email"
                        name="email"
                        value={formData.email}
                        onChange={handleInputChange}
                        className="w-full pl-10 pr-3 py-3 bg-[var(--input-bg)] border border-[var(--input-border)] rounded-xl focus:outline-none focus:ring-2 focus:ring-[var(--accent-color)] text-[var(--text-primary)] transition-all"
                        placeholder="Enter your email"
                        required
                      />
                    </div>
                  </div>

                  <div>
                    <label
                      htmlFor="password"
                      className="block text-sm font-medium text-[var(--text-secondary)] mb-2"
                    >
                      Password
                    </label>
                    <div className="relative">
                      <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 text-[var(--text-secondary)] w-5 h-5" />
                      <input
                        type={showPassword ? "text" : "password"}
                        id="password"
                        name="password"
                        value={formData.password}
                        onChange={handleInputChange}
                        className="w-full pl-10 pr-10 py-3 bg-[var(--input-bg)] border border-[var(--input-border)] rounded-xl focus:outline-none focus:ring-2 focus:ring-[var(--accent-color)] text-[var(--text-primary)] transition-all"
                        placeholder="Enter your password"
                        required
                      />
                      <button
                        type="button"
                        onClick={() => setShowPassword(!showPassword)}
                        className="absolute right-3 top-1/2 transform -translate-y-1/2 text-[var(--text-secondary)] hover:text-[var(--text-primary)] transition-colors"
                      >
                        {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                      </button>
                    </div>
                  </div>

                  <div className="flex items-center justify-between">
                    <div className="flex items-center">
                      <input
                        id="remember-me"
                        name="remember-me"
                        type="checkbox"
                        className="h-4 w-4 text-[var(--accent-color)] focus:ring-[var(--accent-color)] border-[var(--border-color)] rounded"
                      />
                      <label
                        htmlFor="remember-me"
                        className="ml-2 block text-sm text-[var(--text-secondary)]"
                      >
                        Remember me
                      </label>
                    </div>

                    <button
                      type="button"
                      onClick={() => navigate('/forgot-password')} // Changed from switchView
                      className="text-sm font-medium text-[var(--accent-color)] hover:opacity-80"
                    >
                      Forgot password?
                    </button>
                  </div>

                  <button
                    type="button"
                    onClick={handleLogin}
                    disabled={isLoading}
                    className="w-full inline-flex items-center justify-center rounded-xl bg-[var(--button-bg)] px-4 py-3 text-sm font-medium text-[var(--button-text)] shadow-sm hover:bg-[var(--button-hover)] focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-[var(--accent-color)] focus:ring-offset-[var(--card-bg)] transition-all transform hover:scale-[1.02] disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none"
                  >
                    {isLoading ? (
                      <>
                        <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                        Signing In...
                      </>
                    ) : (
                      <>
                        <Zap className="mr-2 h-4 w-4" />
                        Sign In
                      </>
                    )}
                  </button>
                </div>

                <p className="text-center text-sm text-[var(--text-secondary)]">
                  Don't have an account?{" "}
                  <button
                    onClick={() => switchView("register")}
                    className="font-medium text-[var(--accent-color)] hover:opacity-80 transition-opacity"
                  >
                    Sign up
                  </button>
                </p>
              </div>
            )}

            {/* Register View */}
            {currentView === "register" && (allowRegister === "true" ? (
              <div className="p-6 space-y-6">
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-[var(--text-secondary)] mb-2">
                      Full Name
                    </label>
                    <div className="relative">
                      <User className="absolute left-3 top-1/2 transform -translate-y-1/2 text-[var(--text-secondary)] w-5 h-5" />
                      <input
                        type="text"
                        name="name"
                        value={formData.name}
                        onChange={handleInputChange}
                        className="w-full pl-10 pr-3 py-3 bg-[var(--input-bg)] border border-[var(--input-border)] rounded-xl focus:outline-none focus:ring-2 focus:ring-[var(--accent-color)] text-[var(--text-primary)] transition-all"
                        placeholder="Enter your full name"
                        required
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-[var(--text-secondary)] mb-2">
                      Email Address
                    </label>
                    <div className="relative">
                      <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 text-[var(--text-secondary)] w-5 h-5" />
                      <input
                        type="email"
                        name="email"
                        value={formData.email}
                        onChange={handleInputChange}
                        className="w-full pl-10 pr-3 py-3 bg-[var(--input-bg)] border border-[var(--input-border)] rounded-xl focus:outline-none focus:ring-2 focus:ring-[var(--accent-color)] text-[var(--text-primary)] transition-all"
                        placeholder="Enter your email"
                        required
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-[var(--text-secondary)] mb-2">
                      Sector
                    </label>
                    <div className="relative">
                      <Briefcase className="absolute left-3 top-1/2 transform -translate-y-1/2 text-[var(--text-secondary)] w-5 h-5" />
                      <input
                        type="text"
                        id="register-occupation"
                        name="sector"
                        value={formData.sector}
                        onChange={handleInputChange}
                        className="w-full pl-10 pr-3 py-3 bg-[var(--input-bg)] border border-[var(--input-border)] rounded-xl focus:outline-none focus:ring-2 focus:ring-[var(--accent-color)] text-[var(--text-primary)] transition-all"
                        placeholder="Enter your occupation"
                        required
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-[var(--text-secondary)] mb-2">
                      Password
                    </label>
                    <div className="relative">
                      <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 text-[var(--text-secondary)] w-5 h-5" />
                      <input
                        type={showPassword ? "text" : "password"}
                        name="password"
                        value={formData.password}
                        onChange={handleInputChange}
                        className="w-full pl-10 pr-10 py-3 bg-[var(--input-bg)] border border-[var(--input-border)] rounded-xl focus:outline-none focus:ring-2 focus:ring-[var(--accent-color)] text-[var(--text-primary)] transition-all"
                        placeholder="Create a password (min 6 characters)"
                        required
                        minLength="6"
                      />
                      <button
                        type="button"
                        onClick={() => setShowPassword(!showPassword)}
                        className="absolute right-3 top-1/2 transform -translate-y-1/2 text-[var(--text-secondary)] hover:text-[var(--text-primary)] transition-colors"
                      >
                        {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                      </button>
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-[var(--text-secondary)] mb-2">
                      Confirm Password
                    </label>
                    <div className="relative">
                      <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 text-[var(--text-secondary)] w-5 h-5" />
                      <input
                        type={showConfirmPassword ? "text" : "password"}
                        name="confirmPassword"
                        value={formData.confirmPassword}
                        onChange={handleInputChange}
                        className="w-full pl-10 pr-10 py-3 bg-[var(--input-bg)] border border-[var(--input-border)] rounded-xl focus:outline-none focus:ring-2 focus:ring-[var(--accent-color)] text-[var(--text-primary)] transition-all"
                        placeholder="Confirm your password"
                        required
                      />
                      <button
                        type="button"
                        onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                        className="absolute right-3 top-1/2 transform -translate-y-1/2 text-[var(--text-secondary)] hover:text-[var(--text-primary)] transition-colors"
                      >
                        {showConfirmPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                      </button>
                    </div>
                  </div>

                  <button
                    type="button"
                    onClick={handleRegister}
                    disabled={isLoading}
                    className="w-full inline-flex items-center justify-center rounded-xl bg-[var(--button-bg)] px-4 py-3 text-sm font-medium text-[var(--button-text)] shadow-sm hover:bg-[var(--button-hover)] focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-[var(--accent-color)] focus:ring-offset-[var(--card-bg)] transition-all transform hover:scale-[1.02] disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none"
                  >
                    {isLoading ? (
                      <>
                        <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                        Creating Account...
                      </>
                    ) : (
                      <>
                        <CheckCircle2 className="mr-2 h-4 w-4" />
                        Create Account
                      </>
                    )}
                  </button>
                </div>

                <p className="text-center text-sm text-[var(--text-secondary)]">
                  Already have an account?{" "}
                  <button
                    onClick={() => switchView("login")}
                    className="font-medium text-[var(--accent-color)] hover:opacity-80 transition-opacity"
                  >
                    Sign in
                  </button>
                </p>
              </div>
            ) : (
              <div className="text-center p-6">
                <div className="mb-6">
                  <div className="w-16 h-16 bg-gradient-to-br from-[var(--accent-color)] to-blue-600 rounded-xl flex items-center justify-center mx-auto mb-4">
                    <Shield className="w-8 h-8 text-white" />
                  </div>
                  <h2 className="text-xl font-bold text-[var(--text-primary)] mb-2 font-[Varela_Round,Manrope,ui-sans-serif]">
                    Registration Currently Closed
                  </h2>
                  <p className="text-[var(--text-secondary)] mb-6 text-sm">
                    This platform is currently in private beta. To request access,
                    please contact the project owner.
                  </p>
                </div>

                <a
                  href="https://hareshkurade.netlify.app"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center px-6 py-3 bg-green-600 text-white font-medium rounded-xl hover:bg-green-700 transition-all transform hover:scale-105 shadow-lg"
                >
                  <Mail className="w-5 h-5 mr-2" />
                  Contact Haresh
                </a>

                <p className="text-sm text-[var(--text-secondary)] mt-4">
                  Click above to get platform access.
                </p>

                <button
                  onClick={() => switchView("login")}
                  className="mt-4 text-sm text-[var(--accent-color)] hover:opacity-80 transition-opacity"
                >
                  ← Back to Sign In
                </button>
              </div>
            ))}

            {/* Footer */}
            <div className="px-6 pb-6">
              <div className="h-px w-full bg-[var(--border-color)] mb-4"></div>
              <p className="text-xs text-center text-[var(--text-secondary)]">
                By continuing, you agree to our{" "}
                <a href="#" className="text-[var(--accent-color)] hover:opacity-80 transition-opacity">
                  Terms of Service
                </a>{" "}
                and{" "}
                <a href="#" className="text-[var(--accent-color)] hover:opacity-80 transition-opacity">
                  Privacy Policy
                </a>
              </p>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
};

export default Login;