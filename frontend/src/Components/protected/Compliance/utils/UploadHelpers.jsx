import React, { useState } from 'react';
import { X, Upload, Eye, FileText, Image as ImageIcon, Video, CheckCircle, Clock, AlertCircle } from 'lucide-react';

export const FormField = ({ label, name, type = 'text', value, onChange, error, placeholder, icon: Icon, required, options }) => (
  <div>
    <label className="block text-sm font-medium text-[var(--text-secondary)] mb-2">
      {label} {required && <span className="text-red-500">*</span>}
    </label>
    <div className="relative">
      {Icon && <Icon className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-[var(--text-secondary)]" />}
      
      {type === 'select' ? (
        <select
          name={name}
          value={value}
          onChange={onChange}
          className={`w-full ${Icon ? 'pl-10' : 'pl-3'} pr-3 py-3 bg-[var(--input-bg)] border border-[var(--input-border)] rounded-xl focus:outline-none focus:ring-2 focus:ring-[var(--accent-color)] text-[var(--text-primary)]`}
        >
          {options?.map(option => (
            <option key={option.value} value={option.value}>{option.label}</option>
          ))}
        </select>
      ) : type === 'textarea' ? (
        <textarea
          name={name}
          value={value}
          onChange={onChange}
          placeholder={placeholder}
          rows={4}
          className={`w-full ${Icon ? 'pl-10' : 'pl-3'} pr-3 py-3 bg-[var(--input-bg)] border border-[var(--input-border)] rounded-xl focus:outline-none focus:ring-2 focus:ring-[var(--accent-color)] text-[var(--text-primary)] resize-none`}
        />
      ) : (
        <input
          type={type}
          name={name}
          value={value}
          onChange={onChange}
          placeholder={placeholder}
          className={`w-full ${Icon ? 'pl-10' : 'pl-3'} pr-3 py-3 bg-[var(--input-bg)] border border-[var(--input-border)] rounded-xl focus:outline-none focus:ring-2 focus:ring-[var(--accent-color)] text-[var(--text-primary)]`}
        />
      )}
    </div>
    {error && <p className="text-red-500 text-sm mt-1">{error}</p>}
  </div>
);

export const FileUploadArea = ({ onFileUpload, fileInputRef }) => (
  <div
    onClick={() => fileInputRef.current?.click()}
    className="border-2 border-dashed border-[var(--border-color)] rounded-xl p-8 text-center hover:border-[var(--accent-color)] transition-colors cursor-pointer bg-[var(--bg-secondary)]"
  >
    <Upload className="w-12 h-12 mx-auto mb-4 text-[var(--text-secondary)]" />
    <p className="text-[var(--text-primary)] font-medium mb-2">Click to upload media files</p>
    <p className="text-[var(--text-secondary)] text-sm">Support: Images, Videos (Max 100MB each, 10 files)</p>
    <input
      ref={fileInputRef}
      type="file"
      multiple
      accept="image/*,video/*"
      onChange={(e) => onFileUpload(e.target.files)}
      className="hidden"
    />
  </div>
);

export const FilePreview = ({ fileObj, onRemove }) => {
  const [showPreview, setShowPreview] = useState(false);
  const isVideo = fileObj.file.type.startsWith('video/');

  return (
    <>
      <div className="relative group bg-[var(--card-bg)] border border-[var(--border-color)] rounded-xl overflow-hidden">
        <div className="aspect-square relative">
          {isVideo ? (
            <video src={fileObj.preview} className="w-full h-full object-cover" />
          ) : (
            <img src={fileObj.preview} alt="Preview" className="w-full h-full object-cover" />
          )}
          
          <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
            <button
              onClick={() => setShowPreview(true)}
              className="p-2 bg-white rounded-full hover:bg-gray-100 transition-colors mr-2"
            >
              <Eye className="w-4 h-4 text-gray-700" />
            </button>
            <button
              onClick={onRemove}
              className="p-2 bg-red-500 rounded-full hover:bg-red-600 transition-colors text-white"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>
        
        <div className="p-3">
          <div className="flex items-center gap-2">
            {isVideo ? <Video className="w-4 h-4" /> : <ImageIcon className="w-4 h-4" />}
            <span className="text-xs text-[var(--text-secondary)] truncate">{fileObj.file.name}</span>
          </div>
        </div>
      </div>

      {showPreview && (
        <div className="fixed inset-0 bg-black/80 z-50 flex items-center justify-center p-4">
          <div className="relative max-w-4xl max-h-full">
            <button
              onClick={() => setShowPreview(false)}
              className="absolute -top-12 right-0 text-white hover:text-gray-300"
            >
              <X className="w-8 h-8" />
            </button>
            {isVideo ? (
              <video src={fileObj.preview} controls className="max-w-full max-h-full rounded-lg" />
            ) : (
              <img src={fileObj.preview} alt="Preview" className="max-w-full max-h-full rounded-lg" />
            )}
          </div>
        </div>
      )}
    </>
  );
};

export const ProgressModal = ({ progressData, onClose }) => {
  const stages = [
    { key: 'upload', label: 'Upload', icon: Upload },
    { key: 'media_processing', label: 'Media Processing', icon: FileText },
    { key: 'compliance_check', label: 'Compliance Check', icon: CheckCircle },
    { key: 'call', label: 'AI Clarification', icon: Clock },
    { key: 'report', label: 'Report Generation', icon: FileText }
  ];

  const getStageStatus = (stageKey) => {
    const stage = progressData.stages?.find(s => s.step === stageKey);
    return stage?.status || 'pending';
  };

  const getStatusIcon = (status) => {
    switch (status) {
      case 'completed': return <CheckCircle className="w-5 h-5 text-green-500" />;
      case 'in_progress': return <Clock className="w-5 h-5 text-[var(--accent-color)] animate-spin" />;
      case 'failed': return <AlertCircle className="w-5 h-5 text-red-500" />;
      default: return <Clock className="w-5 h-5 text-[var(--text-secondary)]" />;
    }
  };

  const isFinished = progressData.current_status === 'compliance_completed';

  return (
    <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
      <div className="bg-[var(--card-bg)] rounded-2xl p-6 max-w-md w-full border border-[var(--border-color)]">
        <div className="flex items-center justify-between mb-6">
          <h3 className="text-xl font-semibold text-[var(--text-primary)]">Processing Advertisement</h3>
          <button onClick={onClose} className="text-[var(--text-secondary)] hover:text-[var(--text-primary)]">
            <X className="w-6 h-6" />
          </button>
        </div>

        <div className="space-y-4">
          {stages.map((stage, index) => {
            const status = getStageStatus(stage.key);
            return (
              <div key={stage.key} className="flex items-center gap-4">
                {getStatusIcon(status)}
                <div className="flex-1">
                  <p className={`font-medium ${status === 'completed' ? 'text-green-500' : status === 'in_progress' ? 'text-[var(--accent-color)]' : 'text-[var(--text-secondary)]'}`}>
                    {stage.label}
                  </p>
                </div>
              </div>
            );
          })}
        </div>

        {isFinished && (
          <div className="mt-6 p-4 bg-green-50 dark:bg-green-900/20 rounded-xl border border-green-200 dark:border-green-800">
            <p className="text-green-800 dark:text-green-200 font-medium">✅ Compliance check completed!</p>
            <button className="mt-2 text-[var(--accent-color)] hover:opacity-80 text-sm">
              View Detailed Report →
            </button>
          </div>
        )}

        <div className="mt-6 text-center">
          <p className="text-xs text-[var(--text-secondary)]">
            ID: {progressData.advertisement_id}
          </p>
        </div>
      </div>
    </div>
  );
};