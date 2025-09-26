import React, { useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { useNavigate } from 'react-router-dom';
import {
  User,
  Calendar,
  Briefcase,
  Phone,
  Camera,
  ArrowRight,
  Sparkles,
  CheckCircle
} from 'lucide-react';
import { selectAccount, setDFeature } from '../../../App/DashboardSlice';
import { completeOnboarding } from '../../../Services/Repository/AccountRepo';
import GradientText from '../../bits/GradientText';
import ClickSpark from '../../bits/ClickSpark';

const Onboarding = () => {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const user = useSelector(selectAccount);

  const [currentStep, setCurrentStep] = useState(1);
  const [formData, setFormData] = useState({
    profile_url: '',
    dob: '',
    sector: '',
    mobile: ''
  });
  const [isLoading, setIsLoading] = useState(false);

  const totalSteps = 2;

  const handleInputChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
  };

  const handleNext = () => {
    if (currentStep < totalSteps) {
      setCurrentStep(currentStep + 1);
    }
  };

  const handlePrevious = () => {
    if (currentStep > 1) {
      setCurrentStep(currentStep - 1);
    }
  };

  const handleComplete = async () => {
    setIsLoading(true);
    try {
      await dispatch(completeOnboarding(formData));
      dispatch(setDFeature({ dashboardFeature: 'Home' }));
      navigate('/dashboard');
    } catch (error) {
      console.error('Onboarding failed:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const isStepValid = () => {
    switch (currentStep) {
      case 1:
        return formData.dob && formData.sector;
      case 2:
        return formData.mobile;
      default:
        return false;
    }
  };

  const languages = [
    'English', 'Hindi', 'Marathi', 'Bengali', 'Tamil', 'Telugu', 'Gujarati', 
    'Kannada', 'Malayalam', 'Punjabi', 'Urdu', 'Odia', 'Assamese', 'Other'
  ];

  return (
    <div className="min-h-screen bg-[var(--bg-primary)] flex items-center justify-center p-4">
      <div className="max-w-md w-full">
        <ClickSpark sparkColor="#0fdbff" sparkSize={32} sparkRadius={90} sparkCount={12}>
          <div className="bg-[var(--card-bg)] rounded-2xl shadow-xl border border-[var(--border-color)] overflow-hidden">
            {/* Header */}
            <div className="bg-gradient-to-r from-[var(--accent-color)]/10 to-blue-500/10 p-6 text-center border-b border-[var(--border-color)]">
              <div className="w-16 h-16 bg-gradient-to-r from-[var(--accent-color)] to-blue-500 rounded-full flex items-center justify-center mx-auto mb-4">
                <Sparkles className="w-8 h-8 text-white" />
              </div>
              <h1 className="text-2xl font-bold text-[var(--text-primary)] mb-2">
                Welcome, <GradientText>{user.uname}!</GradientText>
              </h1>
              <p className="text-[var(--text-secondary)]">
                Let's complete your profile setup
              </p>
            </div>

            {/* Progress Bar */}
            <div className="p-6 pb-0">
              <div className="flex items-center justify-between mb-6">
                {[1, 2].map((step) => (
                  <div key={step} className="flex items-center">
                    <div
                      className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-semibold transition-all ${
                        step <= currentStep
                          ? 'bg-[var(--accent-color)] text-white'
                          : 'bg-[var(--border-color)] text-[var(--text-secondary)]'
                      }`}
                    >
                      {step < currentStep ? (
                        <CheckCircle className="w-5 h-5" />
                      ) : (
                        step
                      )}
                    </div>
                    {step < totalSteps && (
                      <div
                        className={`w-16 h-1 mx-2 rounded-full transition-all ${
                          step < currentStep
                            ? 'bg-[var(--accent-color)]'
                            : 'bg-[var(--border-color)]'
                        }`}
                      />
                    )}
                  </div>
                ))}
              </div>
            </div>

            {/* Form Content */}
            <div className="p-6 space-y-6">
              {/* Step 1: Basic Info */}
              {currentStep === 1 && (
                <div className="space-y-4">
                  <h2 className="text-xl font-semibold text-[var(--text-primary)] mb-4">
                    Basic Information
                  </h2>

                  <div>
                    <label className="block text-sm font-medium text-[var(--text-secondary)] mb-2">
                      Profile Picture URL (Optional)
                    </label>
                    <div className="relative">
                      <Camera className="absolute left-3 top-1/2 transform -translate-y-1/2 text-[var(--text-secondary)] w-5 h-5" />
                      <input
                        type="url"
                        name="profile_url"
                        value={formData.profile_url}
                        onChange={handleInputChange}
                        className="w-full pl-10 pr-3 py-3 bg-[var(--input-bg)] border border-[var(--input-border)] rounded-xl focus:outline-none focus:ring-2 focus:ring-[var(--accent-color)] text-[var(--text-primary)]"
                        placeholder="https://example.com/image.jpg"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-[var(--text-secondary)] mb-2">
                      Date of Birth *
                    </label>
                    <div className="relative">
                      <Calendar className="absolute left-3 top-1/2 transform -translate-y-1/2 text-[var(--text-secondary)] w-5 h-5" />
                      <input
                        type="date"
                        name="dob"
                        value={formData.dob}
                        onChange={handleInputChange}
                        className="w-full pl-10 pr-3 py-3 bg-[var(--input-bg)] border border-[var(--input-border)] rounded-xl focus:outline-none focus:ring-2 focus:ring-[var(--accent-color)] text-[var(--text-primary)]"
                        required
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-[var(--text-secondary)] mb-2">
                      Sector *
                    </label>
                    <div className="relative">
                      <Briefcase className="absolute left-3 top-1/2 transform -translate-y-1/2 text-[var(--text-secondary)] w-5 h-5" />
                      <input
                        type="text"
                        name="sector" // Changed from "profession"
                        value={formData.sector} // Changed from profession
                        onChange={handleInputChange}
                        className="w-full pl-10 pr-3 py-3 bg-[var(--input-bg)] border border-[var(--input-border)] rounded-xl focus:outline-none focus:ring-2 focus:ring-[var(--accent-color)] text-[var(--text-primary)]"
                        placeholder="e.g., Software Engineer"
                        required
                      />
                    </div>
                  </div>
                </div>
              )}

              {/* Step 3: Contact */}
              {currentStep === 2 && (
                <div className="space-y-4">
                  <h2 className="text-xl font-semibold text-[var(--text-primary)] mb-4">
                    Contact Information
                  </h2>

                  <div>
                    <label className="block text-sm font-medium text-[var(--text-secondary)] mb-2">
                      Mobile Number *
                    </label>
                    <div className="relative">
                      <Phone className="absolute left-3 top-1/2 transform -translate-y-1/2 text-[var(--text-secondary)] w-5 h-5" />
                      <input
                        type="tel"
                        name="mobile"
                        value={formData.mobile}
                        onChange={handleInputChange}
                        className="w-full pl-10 pr-3 py-3 bg-[var(--input-bg)] border border-[var(--input-border)] rounded-xl focus:outline-none focus:ring-2 focus:ring-[var(--accent-color)] text-[var(--text-primary)]"
                        placeholder="Enter your phone number"
                        required
                      />
                    </div>
                  </div>

                  <div className="bg-[var(--bg-secondary)] rounded-xl p-4 border border-[var(--border-color)]">
                    <h3 className="font-semibold text-[var(--text-primary)] mb-2">
                      You're almost done! 🎉
                    </h3>
                    <p className="text-sm text-[var(--text-secondary)]">
                      Complete your profile setup to unlock all features and start your learning journey.
                    </p>
                  </div>
                </div>
              )}
            </div>

            {/* Footer */}
            <div className="p-6 pt-0">
              <div className="flex justify-between items-center">
                <button
                  onClick={handlePrevious}
                  disabled={currentStep === 1}
                  className="px-4 py-2 text-[var(--text-secondary)] hover:text-[var(--text-primary)] disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                >
                  Previous
                </button>

                <div className="text-sm text-[var(--text-secondary)]">
                  Step {currentStep} of {totalSteps}
                </div>

                {currentStep < totalSteps ? (
                  <button
                    onClick={handleNext}
                    disabled={!isStepValid()}
                    className="flex items-center gap-2 px-6 py-3 bg-[var(--accent-color)] text-white rounded-xl hover:opacity-80 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
                  >
                    Next
                    <ArrowRight className="w-4 h-4" />
                  </button>
                ) : (
                  <button
                    onClick={handleComplete}
                    disabled={!isStepValid() || isLoading}
                    className="flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-[var(--accent-color)] to-blue-500 text-white rounded-xl hover:from-blue-500 hover:to-[var(--accent-color)] disabled:opacity-50 disabled:cursor-not-allowed transition-all"
                  >
                    {isLoading ? 'Completing...' : 'Complete Setup'}
                    <Sparkles className="w-4 h-4" />
                  </button>
                )}
              </div>

              <div className="mt-4 text-center">
                <p className="text-xs text-[var(--text-secondary)]">
                  * Required fields
                </p>
              </div>
            </div>
          </div>
        </ClickSpark>
      </div>
    </div>
  );
};

export default Onboarding;