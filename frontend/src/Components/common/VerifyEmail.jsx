import React, { useState, useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import OtpInput from 'react-otp-input';
import { useDispatch, useSelector } from 'react-redux';
import { ArrowLeft, Timer, Mail, Shield, KeyRound } from 'lucide-react';
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
  
  const acc = useSelector(selectAccount);
  const location = useLocation();
  const navigate = useNavigate();
  const dispatch = useDispatch();
  
  // Get email and type from navigation state or redux store
  const email = location.state?.email || acc?.uemail || acc?.email;
  const verificationType = location.state?.type || 'email-verification'; // 'email-verification' or 'password-reset'
  const isPasswordReset = verificationType === 'password-reset';
  
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
    <div className="relative min-h-screen flex items-center justify-center bg-[var(--bg-primary)]">
      {/* Background decoration */}
      <div className="absolute inset-0 bg-gradient-to-br from-[var(--bg-primary)] via-[var(--bg-secondary)] to-[var(--bg-primary)] opacity-50"></div>

      {/* Content */}
      <div className="relative z-10 w-full max-w-2xl px-6">
        <div className="bg-[var(--card-bg)] backdrop-blur-md p-8 rounded-2xl shadow-xl border border-[var(--border-color)]">
          {/* Icon */}
          <div className="mb-6 flex justify-center">
            <div className="p-3 bg-[var(--accent-color)]/20 rounded-full">
              {isPasswordReset ? (
                <KeyRound className="w-8 h-8 text-[var(--accent-color)]" />
              ) : (
                <Shield className="w-8 h-8 text-[var(--accent-color)]" />
              )}
            </div>
          </div>

          {/* Header */}
          <h1 className="text-3xl font-bold text-center text-[var(--text-primary)] mb-2">
            {isPasswordReset ? 'Reset Your Password' : 'Verify Your Email'}
          </h1>
          <p className="text-[var(--text-secondary)] text-center mb-8">
            {isPasswordReset 
              ? `We've sent a verification code to ${email}. Enter it below along with your new password.`
              : `We've sent a verification code to ${email}. Please enter it below.`
            }
          </p>

          {/* Form */}
          <form onSubmit={handleVerifyOTP} className="space-y-6">
            {/* OTP Input */}
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
                    className=" h-12 mx-1 text-center text-[var(--text-primary)] bg-[var(--input-bg)] border border-[var(--input-border)] rounded-lg focus:outline-none focus:ring-2 focus:ring-[var(--accent-color)] font-bold text-xl"
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
              <>
                <div>
                  <label
                    htmlFor="confirm-password"
                    className="block text-sm font-medium text-[var(--text-secondary)] mb-1"
                  >
                    Confirm New Password
                  </label>
                  <div className="relative">
                    <input
                      type={showConfirmPassword ? 'text' : 'password'}
                      id="confirm-password"
                      value={confirmPassword}
                      onChange={(e) => setConfirmPassword(e.target.value)}
                      className="w-full px-3 py-2 bg-[var(--input-bg)] border border-[var(--input-border)] rounded-md focus:outline-none focus:ring-2 focus:ring-[var(--accent-color)] text-[var(--text-primary)]"
                      placeholder="Confirm new password"
                      required
                    />
                    <button
                      type="button"
                      onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                      className="absolute right-3 top-1/2 transform -translate-y-1/2 text-[var(--text-secondary)]"
                    >
                      {showConfirmPassword ? '🙈' : '👁️'}
                    </button>
                  </div>
                </div>
              </>
            )}

            <button
              type="submit"
              disabled={isLoading || otp.length !== 6}
              className="w-full py-3 px-4 bg-[var(--button-bg)] hover:bg-[var(--button-hover)] text-[var(--button-text)] font-medium rounded-lg transition duration-200 ease-in-out transform hover:scale-[1.02] disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none"
            >
              {isLoading 
                ? (isPasswordReset ? 'Resetting Password...' : 'Verifying...') 
                : (isPasswordReset ? 'Reset Password' : 'Verify Email')
              }
            </button>
          </form>

          {/* Footer */}
          <div className="mt-6 flex items-center justify-between text-[var(--text-secondary)]">
            <button
              onClick={handleBackNavigation}
              className="flex items-center gap-2 hover:text-[var(--text-primary)] transition-colors"
            >
              <ArrowLeft className="w-4 h-4" />
              Back to Login
            </button>

            <button
              onClick={handleResendOTP}
              disabled={resendCooldown > 0 || isResending}
              className="flex items-center gap-2 text-[var(--accent-color)] hover:opacity-80 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
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

          {/* Email display */}
          <div className="mt-6 p-3 bg-[var(--bg-secondary)] rounded-lg border border-[var(--border-color)]">
            <div className="flex items-center gap-2 text-sm text-[var(--text-secondary)]">
              <Mail className="w-4 h-4" />
              <span>Code sent to: </span>
              <span className="font-medium text-[var(--text-primary)]">{email}</span>
            </div>
          </div>

          {/* Extra Info */}
          <div className="mt-6 text-center">
            <p className="text-sm text-[var(--text-secondary)]">
              Didn't receive the code? Check your spam folder or{' '}
              <button 
                onClick={handleResendOTP}
                disabled={resendCooldown > 0 || isResending}
                className="text-[var(--accent-color)] hover:opacity-80 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                request a new one
              </button>
            </p>
          </div>

          {/* Security note for password reset */}
          {isPasswordReset && (
            <div className="mt-6 p-3 bg-[var(--highlight-color)] rounded-lg border border-[var(--border-color)]">
              <p className="text-xs text-[var(--text-secondary)] text-center">
                🔒 For your security, this verification code will expire in 10 minutes.
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default VerifyEmail;