import React, { useState, useRef } from 'react';
import { useSelector } from 'react-redux';
import { selectAccount } from '../../../App/DashboardSlice';
import { uploadAdvertisement, pollAdStatus } from '../../../Services/Repository/ComplianceRepo';
import { 
  Upload as UploadIcon, 
  Plus, 
  X, 
  FileText, 
  Image, 
  Video,
  Globe,
  Users,
  Target,
  Languages,
  ExternalLink
} from 'lucide-react';
import { FilePreview, ProgressModal, FormField, FileUploadArea } from './utils/UploadHelpers';

const Upload = () => {
  const user = useSelector(selectAccount);
  const fileInputRef = useRef(null);
  
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    type: 0,
    target_region: '',
    language: 'English',
    landing_url: '',
    target_audience: '',
    target_age_group: []
  });
  
  const [files, setFiles] = useState([]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showProgressModal, setShowProgressModal] = useState(false);
  const [progressData, setProgressData] = useState(null);
  const [errors, setErrors] = useState({});

  const adTypes = [
    { value: 0, label: 'Image Ad', icon: Image },
    { value: 1, label: 'Video Ad', icon: Video },
    { value: 2, label: 'Text Ad', icon: FileText }
  ];

  const ageGroups = [
    { value: 0, label: 'General' },
    { value: 1, label: 'Kids (0-12)' },
    { value: 2, label: 'Adults (18-64)' },
    { value: 3, label: 'Senior (65+)' }
  ];

  const languages = ['English', 'Hindi', 'Spanish', 'French', 'German', 'Chinese', 'Japanese'];

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
    if (errors[name]) {
      setErrors(prev => ({ ...prev, [name]: '' }));
    }
  };

  const handleAgeGroupChange = (ageValue) => {
    setFormData(prev => ({
      ...prev,
      target_age_group: prev.target_age_group.includes(ageValue)
        ? prev.target_age_group.filter(age => age !== ageValue)
        : [...prev.target_age_group, ageValue]
    }));
  };

  const handleFileUpload = (selectedFiles) => {
    const newFiles = Array.from(selectedFiles).map(file => ({
      file,
      id: Date.now() + Math.random(),
      preview: URL.createObjectURL(file)
    }));
    setFiles(prev => [...prev, ...newFiles]);
  };

  const removeFile = (fileId) => {
    setFiles(prev => {
      const fileToRemove = prev.find(f => f.id === fileId);
      if (fileToRemove) URL.revokeObjectURL(fileToRemove.preview);
      return prev.filter(f => f.id !== fileId);
    });
  };

  const validateForm = () => {
    const newErrors = {};
    if (!formData.title.trim()) newErrors.title = 'Title is required';
    if (!formData.description.trim()) newErrors.description = 'Description is required';
    if (!formData.target_region.trim()) newErrors.target_region = 'Target region is required';
    if (!formData.landing_url.trim()) newErrors.landing_url = 'Landing URL is required';
    if (!formData.target_audience.trim()) newErrors.target_audience = 'Target audience is required';
    if (formData.target_age_group.length === 0) newErrors.target_age_group = 'Select at least one age group';
    if (files.length === 0) newErrors.files = 'Upload at least one media file';
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!validateForm()) return;

    setIsSubmitting(true);
    
    const submitFormData = new FormData();
    Object.keys(formData).forEach(key => {
      if (key === 'target_age_group') {
        submitFormData.append(key, JSON.stringify(formData[key]));
      } else {
        submitFormData.append(key, formData[key]);
      }
    });
    
    submitFormData.append('user_id', user.id);
    files.forEach(fileObj => {
      submitFormData.append('files', fileObj.file);
    });

    try {
      const response = await uploadAdvertisement(submitFormData);
      setProgressData({
        advertisement_id: response.advertisement_id,
        current_status: 'processing',
        stages: []
      });
      setShowProgressModal(true);
      
    //   Start polling
      pollAdStatus(response.advertisement_id, (status) => {
        setProgressData(status);
      });
      
    } catch (error) {
      console.error('Upload failed:', error);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-[var(--bg-primary)] p-4 lg:p-6">
      <div className="max-w-4xl mx-auto">
        <div className="bg-[var(--card-bg)] rounded-2xl p-6 lg:p-8 border border-[var(--border-color)] shadow-lg">
          <div className="flex items-center gap-4 mb-8">
            <div className="w-12 h-12 bg-gradient-to-br from-[var(--accent-color)] to-blue-600 rounded-xl flex items-center justify-center">
              <UploadIcon className="w-6 h-6 text-white" />
            </div>
            <div>
              <h1 className="text-3xl font-bold text-[var(--text-primary)]">Upload Advertisement</h1>
              <p className="text-[var(--text-secondary)]">Create and submit your ad for compliance checking</p>
            </div>
          </div>

          <form onSubmit={handleSubmit} className="space-y-8">
            {/* Basic Information */}
            <div className="space-y-6">
              <h2 className="text-xl font-semibold text-[var(--text-primary)] border-b border-[var(--border-color)] pb-2">
                Basic Information
              </h2>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <FormField
                  label="Ad Title"
                  name="title"
                  value={formData.title}
                  onChange={handleInputChange}
                  error={errors.title}
                  placeholder="Enter advertisement title"
                  required
                />
                
                <FormField
                  label="Ad Type"
                  name="type"
                  type="select"
                  value={formData.type}
                  onChange={handleInputChange}
                  options={adTypes}
                  required
                />
              </div>

              <FormField
                label="Description"
                name="description"
                type="textarea"
                value={formData.description}
                onChange={handleInputChange}
                error={errors.description}
                placeholder="Describe your advertisement"
                required
              />
            </div>

            {/* Targeting */}
            <div className="space-y-6">
              <h2 className="text-xl font-semibold text-[var(--text-primary)] border-b border-[var(--border-color)] pb-2">
                Targeting & Audience
              </h2>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <FormField
                  label="Target Region"
                  name="target_region"
                  value={formData.target_region}
                  onChange={handleInputChange}
                  error={errors.target_region}
                  placeholder="e.g., United States, Europe"
                  icon={Globe}
                  required
                />
                
                <FormField
                  label="Language"
                  name="language"
                  type="select"
                  value={formData.language}
                  onChange={handleInputChange}
                  options={languages.map(lang => ({ value: lang, label: lang }))}
                  icon={Languages}
                  required
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <FormField
                  label="Target Audience"
                  name="target_audience"
                  value={formData.target_audience}
                  onChange={handleInputChange}
                  error={errors.target_audience}
                  placeholder="e.g., Tech enthusiasts, Students"
                  icon={Users}
                  required
                />
                
                <FormField
                  label="Landing URL"
                  name="landing_url"
                  type="url"
                  value={formData.landing_url}
                  onChange={handleInputChange}
                  error={errors.landing_url}
                  placeholder="https://example.com"
                  icon={ExternalLink}
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-[var(--text-secondary)] mb-3">
                  Target Age Groups *
                </label>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                  {ageGroups.map(group => (
                    <label key={group.value} className="flex items-center space-x-2 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={formData.target_age_group.includes(group.value)}
                        onChange={() => handleAgeGroupChange(group.value)}
                        className="w-4 h-4 text-[var(--accent-color)] focus:ring-[var(--accent-color)] border-[var(--border-color)] rounded"
                      />
                      <span className="text-sm text-[var(--text-primary)]">{group.label}</span>
                    </label>
                  ))}
                </div>
                {errors.target_age_group && (
                  <p className="text-red-500 text-sm mt-1">{errors.target_age_group}</p>
                )}
              </div>
            </div>

            {/* File Upload */}
            <div className="space-y-6">
              <h2 className="text-xl font-semibold text-[var(--text-primary)] border-b border-[var(--border-color)] pb-2">
                Media Files
              </h2>
              
              <FileUploadArea onFileUpload={handleFileUpload} fileInputRef={fileInputRef} />
              {errors.files && <p className="text-red-500 text-sm">{errors.files}</p>}
              
              {files.length > 0 && (
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  {files.map(fileObj => (
                    <FilePreview
                      key={fileObj.id}
                      fileObj={fileObj}
                      onRemove={() => removeFile(fileObj.id)}
                    />
                  ))}
                </div>
              )}
            </div>

            {/* Submit */}
            <div className="flex justify-end pt-6 border-t border-[var(--border-color)]">
              <button
                type="submit"
                disabled={isSubmitting}
                className="flex items-center gap-2 px-8 py-3 bg-[var(--button-bg)] text-[var(--button-text)] rounded-xl hover:bg-[var(--button-hover)] disabled:opacity-50 disabled:cursor-not-allowed transition-all shadow-lg"
              >
                <UploadIcon className="w-5 h-5" />
                {isSubmitting ? 'Uploading...' : 'Submit Advertisement'}
              </button>
            </div>
          </form>
        </div>
      </div>

      {showProgressModal && progressData && (
        <ProgressModal
          progressData={progressData}
          onClose={() => setShowProgressModal(false)}
        />
      )}
    </div>
  );
};

export default Upload;