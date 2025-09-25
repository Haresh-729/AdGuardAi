import React, { useState, useEffect } from "react";
import {
  Eye,
  EyeOff,
  ArrowLeft,
  Mail,
  Lock,
  User,
  Briefcase,
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
        setIsDarkTheme(savedTheme === 'light');
      } else {
        setIsDarkTheme(window.matchMedia('(prefers-color-scheme: light)').matches);
      }
    }, []);
  
    useEffect(() => {
      document.documentElement.setAttribute('data-theme', isDarkTheme ? 'light' : 'dark');
      localStorage.setItem('theme', isDarkTheme ? 'light' : 'dark');
    }, [isDarkTheme]);

  // Form data
  const [formData, setFormData] = useState({
    email: "",
    password: "",
    confirmPassword: "",
    name: "",
    occupation: "",
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
          formData.occupation,
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
    <div className="flex flex-col items-center py-5 min-h-screen bg-[var(--bg-primary)]">
      <div className="items-center justify-start w-full px-4">
        <button
          onClick={() => {
            navigate("/");
          }}
          className="text-[var(--accent-color)] px-2 py-1 rounded-xl bg-[var(--card-bg)]"
        >
          Back
        </button>
      </div>
      <div className="w-full h-full items-center justify-center max-w-md bg-[var(--card-bg)] rounded-lg shadow-lg border border-[var(--border-color)] p-8">
        {/* Logo */}
        <div className="flex justify-center mb-6">
          <div className="w-12 h-12 bg-[var(--accent-color)] rounded-full flex items-center justify-center">
            <svg
              width="24"
              height="24"
              viewBox="0 0 24 24"
              fill="none"
              xmlns="http://www.w3.org/2000/svg"
            >
              <path
                d="M17 8C8 10 5.9 16.17 3.82 21.34L5.71 22L6.66 19.7C7.14 19.87 7.64 20 8 20C19 20 22 3 22 3C21 5 14 5.25 9 6.25C4 7.25 2 11.5 2 13.5C2 15.5 3.75 17.25 3.75 17.25C7 8 17 8 17 8Z"
                fill="white"
              />
            </svg>
          </div>
        </div>

        {/* Login View */}
        {currentView === "login" && (
          <div>
            <h2 className="text-2xl font-bold text-center mb-6 text-[var(--text-primary)]">
              Welcome Back
            </h2>

            <form className="space-y-4" onSubmit={handleLogin}>
              <div>
                <label
                  htmlFor="email"
                  className="block text-sm font-medium text-[var(--text-secondary)] mb-1"
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
                    className="w-full pl-10 pr-3 py-2 bg-[var(--input-bg)] border border-[var(--input-border)] rounded-md focus:outline-none focus:ring-2 focus:ring-[var(--accent-color)] text-[var(--text-primary)]"
                    placeholder="Enter your email"
                    required
                  />
                </div>
              </div>

              <div>
                <label
                  htmlFor="password"
                  className="block text-sm font-medium text-[var(--text-secondary)] mb-1"
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
                    className="w-full pl-10 pr-10 py-2 bg-[var(--input-bg)] border border-[var(--input-border)] rounded-md focus:outline-none focus:ring-2 focus:ring-[var(--accent-color)] text-[var(--text-primary)]"
                    placeholder="Enter your password"
                    required
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 transform -translate-y-1/2 text-[var(--text-secondary)]"
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
                  onClick={() => switchView("forgot-password")}
                  className="text-sm font-medium text-[var(--accent-color)] hover:opacity-80"
                >
                  Forgot password?
                </button>
              </div>

              <button
                type="submit"
                disabled={isLoading}
                className="w-full bg-[var(--button-bg)] text-[var(--button-text)] py-2 px-4 rounded-md hover:bg-[var(--button-hover)] transition disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isLoading ? "Signing In..." : "Sign In"}
              </button>
            </form>

            {/* <div className="mt-6">
              <div className="relative">
                <div className="absolute inset-0 flex items-center">
                  <div className="w-full border-t border-[var(--border-color)]"></div>
                </div>
                <div className="relative flex justify-center text-sm">
                  <span className="px-2 bg-[var(--card-bg)] text-[var(--text-secondary)]">
                    Or continue with
                  </span>
                </div>
              </div>

              <div className="mt-6">
                <div className="w-full">
                  <GoogleLogin
                    onSuccess={handleGoogleSuccess}
                    onError={handleGoogleError}
                    scope="email profile"
                  />
                </div>
              </div>
            </div> */}

            <p className="mt-6 text-center text-sm text-[var(--text-secondary)]">
              Don't have an account?{" "}
              <button
                onClick={() => switchView("register")}
                className="font-medium text-[var(--accent-color)] hover:opacity-80"
              >
                Sign up
              </button>
            </p>
          </div>
        )}

        {/* Register View */}
        {(currentView === "register") && (allowRegister === "true" ? (
          <div>
            <div className="flex items-center mb-6">
              <button
                onClick={() => switchView("login")}
                className="mr-3 text-[var(--text-secondary)] hover:text-[var(--text-primary)]"
              >
                <ArrowLeft className="w-5 h-5" />
              </button>
              <h2 className="text-2xl font-bold text-[var(--text-primary)]">
                Create Account
              </h2>
            </div>

            <form className="space-y-4" onSubmit={handleRegister}>
              <div>
                <label
                  htmlFor="register-name"
                  className="block text-sm font-medium text-[var(--text-secondary)] mb-1"
                >
                  Full Name
                </label>
                <div className="relative">
                  <User className="absolute left-3 top-1/2 transform -translate-y-1/2 text-[var(--text-secondary)] w-5 h-5" />
                  <input
                    type="text"
                    id="register-name"
                    name="name"
                    value={formData.name}
                    onChange={handleInputChange}
                    className="w-full pl-10 pr-3 py-2 bg-[var(--input-bg)] border border-[var(--input-border)] rounded-md focus:outline-none focus:ring-2 focus:ring-[var(--accent-color)] text-[var(--text-primary)]"
                    placeholder="Enter your full name"
                    required
                  />
                </div>
              </div>

              <div>
                <label
                  htmlFor="register-email"
                  className="block text-sm font-medium text-[var(--text-secondary)] mb-1"
                >
                  Email Address
                </label>
                <div className="relative">
                  <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 text-[var(--text-secondary)] w-5 h-5" />
                  <input
                    type="email"
                    id="register-email"
                    name="email"
                    value={formData.email}
                    onChange={handleInputChange}
                    className="w-full pl-10 pr-3 py-2 bg-[var(--input-bg)] border border-[var(--input-border)] rounded-md focus:outline-none focus:ring-2 focus:ring-[var(--accent-color)] text-[var(--text-primary)]"
                    placeholder="Enter your email"
                    required
                  />
                </div>
              </div>

              <div>
                <label
                  htmlFor="register-occupation"
                  className="block text-sm font-medium text-[var(--text-secondary)] mb-1"
                >
                  Occupation
                </label>
                <div className="relative">
                  <Briefcase className="absolute left-3 top-1/2 transform -translate-y-1/2 text-[var(--text-secondary)] w-5 h-5" />
                  <input
                    type="text"
                    id="register-occupation"
                    name="occupation"
                    value={formData.occupation}
                    onChange={handleInputChange}
                    className="w-full pl-10 pr-3 py-2 bg-[var(--input-bg)] border border-[var(--input-border)] rounded-md focus:outline-none focus:ring-2 focus:ring-[var(--accent-color)] text-[var(--text-primary)]"
                    placeholder="Enter your occupation"
                    required
                  />
                </div>
              </div>

              <div>
                <label
                  htmlFor="register-password"
                  className="block text-sm font-medium text-[var(--text-secondary)] mb-1"
                >
                  Password
                </label>
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 text-[var(--text-secondary)] w-5 h-5" />
                  <input
                    type={showPassword ? "text" : "password"}
                    id="register-password"
                    name="password"
                    value={formData.password}
                    onChange={handleInputChange}
                    className="w-full pl-10 pr-10 py-2 bg-[var(--input-bg)] border border-[var(--input-border)] rounded-md focus:outline-none focus:ring-2 focus:ring-[var(--accent-color)] text-[var(--text-primary)]"
                    placeholder="Create a password (min 6 characters)"
                    required
                    minLength="6"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 transform -translate-y-1/2 text-[var(--text-secondary)]"
                  >
                    {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                  </button>
                </div>
              </div>

              <div>
                <label
                  htmlFor="confirm-password"
                  className="block text-sm font-medium text-[var(--text-secondary)] mb-1"
                >
                  Confirm Password
                </label>
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 text-[var(--text-secondary)] w-5 h-5" />
                  <input
                    type={showConfirmPassword ? "text" : "password"}
                    id="confirm-password"
                    name="confirmPassword"
                    value={formData.confirmPassword}
                    onChange={handleInputChange}
                    className="w-full pl-10 pr-10 py-2 bg-[var(--input-bg)] border border-[var(--input-border)] rounded-md focus:outline-none focus:ring-2 focus:ring-[var(--accent-color)] text-[var(--text-primary)]"
                    placeholder="Confirm your password"
                    required
                  />
                  <button
                    type="button"
                    onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                    className="absolute right-3 top-1/2 transform -translate-y-1/2 text-[var(--text-secondary)]"
                  >
                    {showConfirmPassword ? (
                      <EyeOff size={18} />
                    ) : (
                      <Eye size={18} />
                    )}
                  </button>
                </div>
              </div>

              <button
                type="submit"
                disabled={isLoading}
                className="w-full bg-[var(--button-bg)] text-[var(--button-text)] py-2 px-4 rounded-md hover:bg-[var(--button-hover)] transition disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isLoading ? "Creating Account..." : "Create Account"}
              </button>
            </form>

            {/* <div className="mt-6">
              <div className="relative">
                <div className="absolute inset-0 flex items-center">
                  <div className="w-full border-t border-[var(--border-color)]"></div>
                </div>
                <div className="relative flex justify-center text-sm">
                  <span className="px-2 bg-[var(--card-bg)] text-[var(--text-secondary)]">
                    Or sign up with
                  </span>
                </div>
              </div>

              <div className="mt-6">
                <div className="w-full">
                  <GoogleLogin
                    onSuccess={handleGoogleSuccess}
                    onError={handleGoogleError}
                    scope="email profile"
                  />
                </div>
              </div>
            </div> */}

            <p className="mt-6 text-center text-sm text-[var(--text-secondary)]">
              Already have an account?{" "}
              <button
                onClick={() => switchView("login")}
                className="font-medium text-[var(--accent-color)] hover:opacity-80"
              >
                Sign in
              </button>
            </p>
          </div>
        ) : (
          <div className="text-center p-8">
            <div className="mb-6">
              <div className="w-16 h-16 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full flex items-center justify-center mx-auto mb-4">
                <svg
                  className="w-8 h-8 text-white"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z"
                  />
                </svg>
              </div>
              <h2 className="text-2xl font-bold text-[var(--text-primary)] mb-2">
                Registration Currently Closed
              </h2>
              <p className="text-[var(--text-secondary)] mb-6">
                This platform is currently in private beta. To request access,
                please contact the project owner.
              </p>
            </div>

            <a
              href="https://hareshkurade.netlify.app"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center px-6 py-3 bg-green-600 text-white font-medium rounded-lg hover:bg-green-700 transition-all transform hover:scale-105 shadow-lg"
            >
              <svg
                className="w-5 h-5 mr-2"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M16 12a4 4 0 10-8 0 4 4 0 008 0zm0 0v1.5a2.5 2.5 0 005 0V12a9 9 0 10-9 9m4.5-1.206a8.959 8.959 0 01-4.5 1.207"
                />
              </svg>
              Contact Haresh
            </a>

            <p className="text-sm text-gray-500 mt-4">
              Click above to get platform access.
            </p>
          </div>
        ))}

        {/* Forgot Password View */}
        {currentView === "forgot-password" && (
          <div>
            <div className="flex items-center mb-6">
              <button
                onClick={() => switchView("login")}
                className="mr-3 text-[var(--text-secondary)] hover:text-[var(--text-primary)]"
              >
                <ArrowLeft className="w-5 h-5" />
              </button>
              <h2 className="text-2xl font-bold text-[var(--text-primary)]">
                Reset Password
              </h2>
            </div>

            <p className="text-[var(--text-secondary)] text-center mb-6">
              Enter your email address and we'll send you an OTP to reset your
              password.
            </p>

            <form className="space-y-4" onSubmit={handleForgotPassword}>
              <div>
                <label
                  htmlFor="forgot-email"
                  className="block text-sm font-medium text-[var(--text-secondary)] mb-1"
                >
                  Email Address
                </label>
                <div className="relative">
                  <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 text-[var(--text-secondary)] w-5 h-5" />
                  <input
                    type="email"
                    id="forgot-email"
                    name="email"
                    value={formData.email}
                    onChange={handleInputChange}
                    className="w-full pl-10 pr-3 py-2 bg-[var(--input-bg)] border border-[var(--input-border)] rounded-md focus:outline-none focus:ring-2 focus:ring-[var(--accent-color)] text-[var(--text-primary)]"
                    placeholder="Enter your email"
                    required
                  />
                </div>
              </div>

              <button
                type="submit"
                disabled={isLoading}
                className="w-full bg-[var(--button-bg)] text-[var(--button-text)] py-2 px-4 rounded-md hover:bg-[var(--button-hover)] transition disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isLoading ? "Sending OTP..." : "Send Reset OTP"}
              </button>
            </form>

            <p className="mt-6 text-center text-sm text-[var(--text-secondary)]">
              Remember your password?{" "}
              <button
                onClick={() => switchView("login")}
                className="font-medium text-[var(--accent-color)] hover:opacity-80"
              >
                Back to Sign in
              </button>
            </p>
          </div>
        )}

        {/* Terms and Privacy */}
        <p className="mt-6 text-xs text-center text-[var(--text-secondary)]">
          By continuing, you agree to our{" "}
          <a href="#" className="text-[var(--accent-color)] hover:opacity-80">
            Terms of Service
          </a>{" "}
          and{" "}
          <a href="#" className="text-[var(--accent-color)] hover:opacity-80">
            Privacy Policy
          </a>
        </p>
      </div>
    </div>
  );
};

export default Login;
