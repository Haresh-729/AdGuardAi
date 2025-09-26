import React, { useState } from 'react';
import { ArrowLeft, Mail, KeyRound, Lock, Eye, EyeOff } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useDispatch } from 'react-redux';
import { forgotPassword, resetPassword } from '../../Services/Repository/UserRepo';
import OtpInput from 'react-otp-input';

const ForgotPassword = () => {
  const [step, setStep] = useState(1); // 1: email, 2: otp + password
  const [email, setEmail] = useState('');
  const [otp, setOtp] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  
  const navigate = useNavigate();
  const dispatch = useDispatch();

  const handleSendOTP = async (e) => {
    e.preventDefault();
    if (!email) {
      alert('Please enter your email address');
      return;
    }

    setIsLoading(true);
    try {
      await dispatch(forgotPassword(email));
      setStep(2);
    } catch (error) {
      console.error('Send OTP error:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleResetPassword = async (e) => {
    e.preventDefault();
    
    if (otp.length !== 6) {
      alert('Please enter a complete 6-digit OTP');
      return;
    }

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

    setIsLoading(true);
    try {
      await dispatch(resetPassword(email, parseInt(otp), newPassword, navigate));
    } catch (error) {
      console.error('Reset password error:', error);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[var(--bg-primary)] flex items-center justify-center p-4">
      <div className="w-full max-w-md bg-[var(--card-bg)] rounded-lg shadow-lg border border-[var(--border-color)] p-8">
        {/* Header */}
        <div className="flex items-center mb-6">
          <button
            onClick={() => step === 1 ? navigate('/login') : setStep(1)}
            className="mr-3 text-[var(--text-secondary)] hover:text-[var(--text-primary)]"
          >
            <ArrowLeft className="w-5 h-5" />
          </button>
          <div className="flex items-center">
            <div className="w-10 h-10 bg-[var(--accent-color)] rounded-full flex items-center justify-center mr-3">
              <KeyRound className="w-5 h-5 text-white" />
            </div>
            <h2 className="text-2xl font-bold text-[var(--text-primary)]">
              Reset Password
            </h2>
          </div>
        </div>

        {step === 1 ? (
          // Step 1: Email
          <>
            <p className="text-[var(--text-secondary)] text-center mb-6">
              Enter your email address and we'll send you an OTP to reset your password.
            </p>

            <form onSubmit={handleSendOTP} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-[var(--text-secondary)] mb-1">
                  Email Address
                </label>
                <div className="relative">
                  <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 text-[var(--text-secondary)] w-5 h-5" />
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
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
                {isLoading ? 'Sending OTP...' : 'Send Reset OTP'}
              </button>
            </form>
          </>
        ) : (
          // Step 2: OTP + Password
          <>
            <p className="text-[var(--text-secondary)] text-center mb-6">
              We've sent a verification code to {email}. Enter it below along with your new password.
            </p>

            <form onSubmit={handleResetPassword} className="space-y-4">
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
                      className="h-12 mx-1 text-center text-[var(--text-primary)] bg-[var(--input-bg)] border border-[var(--input-border)] rounded-lg focus:outline-none focus:ring-2 focus:ring-[var(--accent-color)] font-bold text-xl"
                    />
                  )}
                  containerStyle={{
                    justifyContent: 'space-between',
                    gap: '0.2rem',
                  }}
                />
              </div>

              {/* New Password */}
              <div>
                <label className="block text-sm font-medium text-[var(--text-secondary)] mb-1">
                  New Password
                </label>
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 text-[var(--text-secondary)] w-5 h-5" />
                  <input
                    type={showPassword ? 'text' : 'password'}
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    className="w-full pl-10 pr-10 py-2 bg-[var(--input-bg)] border border-[var(--input-border)] rounded-md focus:outline-none focus:ring-2 focus:ring-[var(--accent-color)] text-[var(--text-primary)]"
                    placeholder="Enter new password"
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

              {/* Confirm Password */}
              <div>
                <label className="block text-sm font-medium text-[var(--text-secondary)] mb-1">
                  Confirm New Password
                </label>
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 text-[var(--text-secondary)] w-5 h-5" />
                  <input
                    type={showConfirmPassword ? 'text' : 'password'}
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    className="w-full pl-10 pr-10 py-2 bg-[var(--input-bg)] border border-[var(--input-border)] rounded-md focus:outline-none focus:ring-2 focus:ring-[var(--accent-color)] text-[var(--text-primary)]"
                    placeholder="Confirm new password"
                    required
                  />
                  <button
                    type="button"
                    onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                    className="absolute right-3 top-1/2 transform -translate-y-1/2 text-[var(--text-secondary)]"
                  >
                    {showConfirmPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                  </button>
                </div>
              </div>

              <button
                type="submit"
                disabled={isLoading}
                className="w-full bg-[var(--button-bg)] text-[var(--button-text)] py-2 px-4 rounded-md hover:bg-[var(--button-hover)] transition disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isLoading ? 'Resetting Password...' : 'Reset Password'}
              </button>
            </form>
          </>
        )}
      </div>
    </div>
  );
};

export default ForgotPassword;