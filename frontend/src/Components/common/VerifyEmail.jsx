import React, { useState, useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import OtpInput from 'react-otp-input';
import { useDispatch, useSelector } from 'react-redux';
import { ArrowLeft, Timer, Mail, Shield, KeyRound, Sun, Moon } from 'lucide-react';
import { selectAccount } from '../../App/DashboardSlice';
import { verifyOTP, resendOTP } from '../../Services/Repository/UserRepo';

const VerifyEmail = () => {
  const [otp, setOtp] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isResending, setIsResending] = useState(false);
  const [resendCooldown, setResendCooldown] = useState(0);
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [isDarkTheme, setIsDarkTheme] = useState(false);
  
  const acc = useSelector(selectAccount);
  const location = useLocation();
  const navigate = useNavigate();
  const dispatch = useDispatch();
  
  // Get email and type from navigation state or redux store
  const email = location.state?.email || acc?.uemail || acc?.email;
  const verificationType = location.state?.type || 'email-verification'; // 'email-verification' or 'password-reset'
  const isPasswordReset = verificationType === 'password-reset';

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
  
  // Cooldown timer for resend OTP
  useEffect(() => {
    let timer;
    if (resendCooldown > 0) {
      timer = setInterval(() => {
        setResendCooldown(prev => prev - 1);
      }, 1000);
    }
    return () => clearInterval(timer);
  }, [resendCooldown]);

  const handleVerifyOTP = async (e) => {
    e.preventDefault();
    
    if (otp.length !== 6) {
      alert('Please enter a complete 6-digit OTP');
      return;
    }

    setIsLoading(true);
    
    try {
      if (isPasswordReset) {
        // For password reset, we need to handle it differently
        // First verify OTP, then reset password
        if (!newPassword || !confirmPassword) {
          alert('Please fill in all password fields');
          return;
        }
        
        if (newPassword !== confirmPassword) {
          alert('Passwords do not match');
          return;
        }
        
        if (newPassword.length < 6) {
          alert('Password must be at least 6 characters long');
          return;
        }
        
        // await dispatch(resetPassword(email, parseInt(otp), newPassword, navigate));
      } else {
        // Normal email verification
        await dispatch(verifyOTP(email, parseInt(otp), navigate));
      }
    } catch (error) {
      console.error('OTP verification error:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleResendOTP = async () => {
    if (resendCooldown > 0) return;
    
    setIsResending(true);
    
    try {
      await dispatch(resendOTP(email));
      setResendCooldown(60); // 60 seconds cooldown
      setOtp(''); // Clear current OTP input
    } catch (error) {
      console.error('Resend OTP error:', error);
    } finally {
      setIsResending(false);
    }
  };

  const handleBackNavigation = () => {
    if (isPasswordReset) {
      navigate('/login');
    } else {
      navigate('/login');
    }
  };

  if (!email) {
    // If no email is available, redirect to login
    navigate('/login');
    return null;
  }

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
              onClick={handleBackNavigation}
              className="inline-flex items-center gap-2 text-sm text-[var(--text-secondary)] hover:text-[var(--text-primary)] transition-colors"
            >
              <ArrowLeft className="w-4 h-4" />
              Back to Login
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
                {isPasswordReset ? (
                  <KeyRound className="w-8 h-8 text-white" />
                ) : (
                  <Shield className="w-8 h-8 text-white" />
                )}
              </div>
              <h1 className="text-2xl font-bold text-[var(--text-primary)] mb-2 font-[Varela_Round,Manrope,ui-sans-serif]">
                {isPasswordReset ? 'Reset Your Password' : 'Verify Your Email'}
              </h1>
              <p className="text-[var(--text-secondary)] text-sm">
                {isPasswordReset 
                  ? `We've sent a verification code to ${email}. Enter it below along with your new password.`
                  : `We've sent a verification code to ${email}. Please enter it below.`
                }
              </p>
            </div>

            {/* Content */}
            <div className="p-6 space-y-6">
              <div>
                <label className="block text-sm font-medium text-[var(--text-secondary)] mb-3 text-center">
                  Enter 6-digit verification code
                </label>
                <OtpInput
                  value={otp}
                  onChange={setOtp}
                  numInputs={6}
                  renderInput={(props) => (
                    <input
                      {...props}
                      placeholder="0"
                      className="h-12 mx-1 text-center text-[var(--text-primary)] bg-[var(--input-bg)] border border-[var(--input-border)] rounded-lg focus:outline-none focus:ring-2 focus:ring-[var(--accent-color)] font-bold text-xl"
                    />
                  )}
                  containerStyle={{
                    justifyContent: 'space-between',
                    gap: '0.2rem',
                  }}
                />
              </div>

              {/* Password fields for reset */}
              {isPasswordReset && (
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-[var(--text-secondary)] mb-2">
                      New Password
                    </label>
                    <input
                      type={showPassword ? 'text' : 'password'}
                      value={newPassword}
                      onChange={(e) => setNewPassword(e.target.value)}
                      className="w-full px-3 py-3 bg-[var(--input-bg)] border border-[var(--input-border)] rounded-xl focus:outline-none focus:ring-2 focus:ring-[var(--accent-color)] text-[var(--text-primary)]"
                      placeholder="Enter new password"
                      required
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-[var(--text-secondary)] mb-2">
                      Confirm New Password
                    </label>
                    <input
                      type={showConfirmPassword ? 'text' : 'password'}
                      value={confirmPassword}
                      onChange={(e) => setConfirmPassword(e.target.value)}
                      className="w-full px-3 py-3 bg-[var(--input-bg)] border border-[var(--input-border)] rounded-xl focus:outline-none focus:ring-2 focus:ring-[var(--accent-color)] text-[var(--text-primary)]"
                      placeholder="Confirm new password"
                      required
                    />
                  </div>
                </div>
              )}

              <button
                onClick={handleVerifyOTP}
                disabled={isLoading || otp.length !== 6}
                className="w-full inline-flex items-center justify-center rounded-xl bg-[var(--button-bg)] px-4 py-3 text-sm font-medium text-[var(--button-text)] shadow-sm hover:bg-[var(--button-hover)] focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-[var(--accent-color)] focus:ring-offset-[var(--card-bg)] transition-all transform hover:scale-[1.02] disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none"
              >
                {isLoading 
                  ? (isPasswordReset ? 'Resetting Password...' : 'Verifying...') 
                  : (isPasswordReset ? 'Reset Password' : 'Verify Email')
                }
              </button>

              {/* Footer Actions */}
              <div className="flex items-center justify-between text-sm">
                <button
                  onClick={handleResendOTP}
                  disabled={resendCooldown > 0 || isResending}
                  className="inline-flex items-center gap-2 text-[var(--accent-color)] hover:opacity-80 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <Timer className="w-4 h-4" />
                  {resendCooldown > 0 
                    ? `Resend in ${resendCooldown}s`
                    : isResending 
                      ? 'Sending...' 
                      : 'Resend Code'
                  }
                </button>
              </div>

              {/* Email Info */}
              <div className="bg-[var(--bg-secondary)] rounded-xl p-4 border border-[var(--border-color)]">
                <div className="flex items-center gap-2 text-sm">
                  <Mail className="w-4 h-4 text-[var(--accent-color)]" />
                  <span className="text-[var(--text-secondary)]">Code sent to: </span>
                  <span className="font-medium text-[var(--text-primary)]">{email}</span>
                </div>
              </div>

              {/* Security note for password reset */}
              {isPasswordReset && (
                <div className="bg-[var(--highlight-color)]/10 rounded-xl p-4 border border-[var(--highlight-color)]/20">
                  <p className="text-xs text-[var(--text-secondary)] text-center">
                    🔒 For your security, this verification code will expire in 10 minutes.
                  </p>
                </div>
              )}
            </div>
          </div>
        </div>
      </section>
    </div>
  );
};

export default VerifyEmail;