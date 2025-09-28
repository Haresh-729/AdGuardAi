import React from 'react';
import {
  CheckCircle,
  XCircle,
  AlertTriangle,
  Clock,
  AlertCircle,
  Shield,
  FileText,
  Image as ImageIcon,
  Play,
  Volume2,
  Link,
  Eye,
  Download,
  ExternalLink,
  Zap,
  Info,
  TrendingUp,
  TrendingDown,
  Minus,
} from 'lucide-react';

// Status color mapping
export const getStatusColor = (status) => {
  switch (status?.toLowerCase()) {
    case 'pass':
    case 'approved':
      return 'text-green-600';
    case 'fail':
    case 'rejected':
      return 'text-red-600';
    case 'manual_review':
    case 'pending':
      return 'text-yellow-600';
    case 'clarification_needed':
      return 'text-blue-600';
    case 'error':
      return 'text-gray-600';
    default:
      return 'text-[var(--text-secondary)]';
  }
};

// Status icon mapping
export const getStatusIcon = (status) => {
  switch (status?.toLowerCase()) {
    case 'pass':
    case 'approved':
      return CheckCircle;
    case 'fail':
    case 'rejected':
      return XCircle;
    case 'manual_review':
    case 'pending':
      return AlertTriangle;
    case 'clarification_needed':
      return AlertCircle;
    case 'error':
      return Clock;
    default:
      return Shield;
  }
};

// Risk level calculation
export const getRiskLevel = (riskScore) => {
  if (riskScore <= 0.3) return 'low';
  if (riskScore <= 0.7) return 'medium';
  return 'high';
};

// Format compliance data for display
export const formatComplianceData = (report) => {
  const complianceResult = report.compliance_result;
  const status = complianceResult?.compliance_results?.verdict || 
                complianceResult?.final_verdict || 
                'unknown';
  
  const riskScore = complianceResult?.compliance_results?.risk_score || 0;
  
  // Extract media types
  const mediaTypes = [];
  if (complianceResult?.text_op) mediaTypes.push('text');
  if (complianceResult?.image_op) mediaTypes.push('image');
  if (complianceResult?.video_op) mediaTypes.push('video');
  if (complianceResult?.audio_op) mediaTypes.push('audio');
  if (complianceResult?.link_op) mediaTypes.push('link');

  // Extract violations
  const violations = [];
  
  // Text violations
  if (complianceResult?.text_op?.violations) {
    violations.push(...complianceResult.text_op.violations.map(v => ({
      ...v,
      type: 'text',
      source: 'Text Content'
    })));
  }

  // Image violations
  if (complianceResult?.image_op?.results) {
    complianceResult.image_op.results.forEach(result => {
      if (result.image_compliance?.violations) {
        violations.push(...result.image_compliance.violations.map(v => ({
          ...v,
          type: 'image',
          source: 'Image Content',
          url: result.source_url
        })));
      }
    });
  }

  // Video violations
  if (complianceResult?.video_op?.results) {
    complianceResult.video_op.results.forEach(result => {
      if (result.audio_analysis?.violations) {
        violations.push(...result.audio_analysis.violations.map(v => ({
          ...v,
          type: 'video_audio',
          source: 'Video Audio',
          url: result.source_url
        })));
      }
      // Add video frame violations if any
      if (result.detailed_frame_results) {
        result.detailed_frame_results.forEach(frame => {
          if (frame.image_compliance?.violations) {
            violations.push(...frame.image_compliance.violations.map(v => ({
              ...v,
              type: 'video_frame',
              source: `Video Frame ${frame.frame_number}`,
              timestamp: frame.timestamp,
              url: result.source_url
            })));
          }
        });
      }
    });
  }

  return {
    status,
    riskScore,
    mediaTypes,
    violations,
    totalViolations: violations.length,
    hasCallRequired: report.call_required,
    adminVerdict: report.admin_verdict,
    adminReason: report.admin_reason,
  };
};

// Media Preview Component
export const MediaPreview = ({ type, url, className = "" }) => {
  const handleDownload = async (url, filename) => {
    try {
      const response = await fetch(url);
      const blob = await response.blob();
      const downloadUrl = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = downloadUrl;
      link.download = filename || 'media-file';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(downloadUrl);
    } catch (error) {
      console.error('Download failed:', error);
    }
  };

  const getFileName = (url) => {
    return url.split('/').pop() || 'media-file';
  };

  switch (type) {
    case 'image':
      return (
        <div className={`relative group ${className}`}>
          <img 
            src={url} 
            alt="Advertisement Media"
            className="w-full h-48 object-cover rounded-lg border border-[var(--border-color)]"
            onError={(e) => {
              e.target.src = 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMjQiIGhlaWdodD0iMjQiIHZpZXdCb3g9IjAgMCAyNCAyNCIgZmlsbD0ibm9uZSIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj4KPHBhdGggZD0iTTIxIDMuNUgzQzIuNzIzODYgMy41IDIuNSAzLjcyMzg2IDIuNSA0VjIwQzIuNSAyMC4yNzYxIDIuNzIzODYgMjAuNSAzIDIwLjVIMjFDMjEuMjc2MSAyMC41IDIxLjUgMjAuMjc2MSAyMS41IDIwVjRDMjEuNSAzLjcyMzg2IDIxLjI3NjEgMy41IDIxIDMuNVoiIHN0cm9rZT0iIzk5OTk5OSIgc3Ryb2tlLXdpZHRoPSIxLjUiLz4KPHBhdGggZD0iTTcuNSA5QzguMzI4NDMgOSA5IDguMzI4NDMgOSA3LjVDOSA2LjY3MTU3IDguMzI4NDMgNiA3LjUgNkM2LjY3MTU3IDYgNiA2LjY3MTU3IDYgNy41QzYgOC4zMjg0MyA2LjY3MTU3IDkgNy41IDlaIiBmaWxsPSIjOTk5OTk5Ii8+CjxwYXRoIGQ9Ik0yMS41IDE2LjVMMTYuNSAxMS41TDE0IDEzLjVMOSA5TDIuNSAxNS41IiBzdHJva2U9IiM5OTk5OTkiIHN0cm9rZS13aWR0aD0iMS41IiBzdHJva2UtbGluZWNhcD0icm91bmQiIHN0cm9rZS1saW5lam9pbj0icm91bmQiLz4KPC9zdmc+';
            }}
          />
          <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity rounded-lg flex items-center justify-center space-x-2">
            <button
              onClick={() => window.open(url, '_blank')}
              className="p-2 bg-white/20 rounded-lg hover:bg-white/30 transition-colors"
            >
              <Eye className="w-4 h-4 text-white" />
            </button>
            <button
              onClick={() => handleDownload(url, getFileName(url))}
              className="p-2 bg-white/20 rounded-lg hover:bg-white/30 transition-colors"
            >
              <Download className="w-4 h-4 text-white" />
            </button>
          </div>
        </div>
      );

    case 'video':
      return (
        <div className={`relative group ${className}`}>
          <video 
            src={url}
            className="w-full h-48 object-cover rounded-lg border border-[var(--border-color)]"
            controls
            preload="metadata"
          />
          <div className="absolute top-2 right-2 bg-black/70 rounded-lg px-2 py-1">
            <Play className="w-4 h-4 text-white" />
          </div>
        </div>
      );

    case 'audio':
      return (
        <div className={`bg-[var(--bg-secondary)] rounded-lg p-4 border border-[var(--border-color)] ${className}`}>
          <div className="flex items-center space-x-3">
            <Volume2 className="w-8 h-8 text-[var(--accent-color)]" />
            <div className="flex-1">
              <audio 
                src={url}
                controls
                className="w-full"
              />
            </div>
          </div>
        </div>
      );

    case 'link':
      return (
        <div className={`bg-[var(--bg-secondary)] rounded-lg p-4 border border-[var(--border-color)] ${className}`}>
          <div className="flex items-center space-x-3">
            <Link className="w-6 h-6 text-[var(--accent-color)]" />
            <div className="flex-1">
              <p className="text-sm text-[var(--text-secondary)]">Landing Page</p>
              <a 
                href={url} 
                target="_blank" 
                rel="noopener noreferrer"
                className="text-[var(--accent-color)] hover:opacity-80 flex items-center space-x-1"
              >
                <span className="truncate">{url}</span>
                <ExternalLink className="w-3 h-3" />
              </a>
            </div>
          </div>
        </div>
      );

    default:
      return (
        <div className={`bg-[var(--bg-secondary)] rounded-lg p-4 border border-[var(--border-color)] ${className}`}>
          <div className="flex items-center space-x-3">
            <FileText className="w-6 h-6 text-[var(--accent-color)]" />
            <div>
              <p className="text-sm text-[var(--text-primary)]">Media File</p>
              <p className="text-xs text-[var(--text-secondary)]">Unknown format</p>
            </div>
          </div>
        </div>
      );
  }
};

// Violation Card Component
export const ViolationCard = ({ violation, index }) => {
  const getSeverityColor = (confidence) => {
    if (confidence >= 0.8) return 'text-red-600 bg-red-50 border-red-200';
    if (confidence >= 0.6) return 'text-yellow-600 bg-yellow-50 border-yellow-200';
    return 'text-blue-600 bg-blue-50 border-blue-200';
  };

  const getSeverityLabel = (confidence) => {
    if (confidence >= 0.8) return 'High';
    if (confidence >= 0.6) return 'Medium';
    return 'Low';
  };

  return (
    <div className="bg-[var(--card-bg)] rounded-lg p-4 border border-[var(--border-color)] space-y-3">
      <div className="flex items-start justify-between">
        <div className="flex-1">
          <div className="flex items-center space-x-2 mb-2">
            <span className="text-sm font-medium text-[var(--text-primary)]">
              Violation #{index + 1}
            </span>
            <span className={`text-xs px-2 py-1 rounded-full border ${getSeverityColor(violation.confidence)}`}>
              {getSeverityLabel(violation.confidence)}
            </span>
            <span className="text-xs px-2 py-1 rounded-full bg-[var(--bg-secondary)] text-[var(--text-secondary)] border border-[var(--border-color)]">
              {violation.source}
            </span>
          </div>
          
          <p className="text-[var(--text-primary)] text-sm mb-2">
            {violation.violation}
          </p>
          
          {violation.evidence && (
            <div className="bg-[var(--bg-secondary)] rounded-lg p-3 mt-2">
              <p className="text-xs text-[var(--text-secondary)] mb-1">Evidence:</p>
              <p className="text-sm text-[var(--text-primary)]">{violation.evidence}</p>
            </div>
          )}
          
          {violation.policy_section && (
            <p className="text-xs text-[var(--text-secondary)] mt-2">
              Policy Section: {violation.policy_section}
            </p>
          )}
          
          {violation.timestamp !== undefined && (
            <p className="text-xs text-[var(--text-secondary)] mt-1">
              Timestamp: {violation.timestamp}s
            </p>
          )}
        </div>
        
        <div className="flex flex-col items-end">
          <span className="text-xs text-[var(--text-secondary)]">Confidence</span>
          <span className="text-sm font-medium text-[var(--text-primary)]">
            {Math.round((violation.confidence || 0) * 100)}%
          </span>
        </div>
      </div>
    </div>
  );
};

// Compliance Summary Component
export const ComplianceSummary = ({ formattedData }) => {
  const riskLevel = getRiskLevel(formattedData.riskScore);
  const StatusIcon = getStatusIcon(formattedData.status);
  const statusColor = getStatusColor(formattedData.status);

  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
      {/* Overall Status */}
      <div className="bg-[var(--card-bg)] rounded-lg p-4 border border-[var(--border-color)]">
        <div className="flex items-center space-x-3">
          <StatusIcon className={`w-8 h-8 ${statusColor}`} />
          <div>
            <p className="text-sm text-[var(--text-secondary)]">Overall Status</p>
            <p className={`text-lg font-semibold capitalize ${statusColor}`}>
              {formattedData.status.replace('_', ' ')}
            </p>
          </div>
        </div>
      </div>

      {/* Risk Score */}
      <div className="bg-[var(--card-bg)] rounded-lg p-4 border border-[var(--border-color)]">
        <div className="flex items-center space-x-3">
          <div className={`w-8 h-8 rounded-full flex items-center justify-center ${
            riskLevel === 'low' ? 'bg-green-100 text-green-600' :
            riskLevel === 'medium' ? 'bg-yellow-100 text-yellow-600' :
            'bg-red-100 text-red-600'
          }`}>
            {riskLevel === 'low' ? <TrendingDown className="w-4 h-4" /> :
             riskLevel === 'medium' ? <Minus className="w-4 h-4" /> :
             <TrendingUp className="w-4 h-4" />}
          </div>
          <div>
            <p className="text-sm text-[var(--text-secondary)]">Risk Score</p>
            <p className="text-lg font-semibold text-[var(--text-primary)]">
              {formattedData.riskScore.toFixed(2)}/1.0
            </p>
            <p className={`text-xs capitalize ${
              riskLevel === 'low' ? 'text-green-600' :
              riskLevel === 'medium' ? 'text-yellow-600' :
              'text-red-600'
            }`}>
              {riskLevel} Risk
            </p>
          </div>
        </div>
      </div>

      {/* Violations Count */}
      <div className="bg-[var(--card-bg)] rounded-lg p-4 border border-[var(--border-color)]">
        <div className="flex items-center space-x-3">
          <div className="w-8 h-8 rounded-full bg-[var(--accent-color)]/10 flex items-center justify-center">
            <AlertTriangle className="w-4 h-4 text-[var(--accent-color)]" />
          </div>
          <div>
            <p className="text-sm text-[var(--text-secondary)]">Violations</p>
            <p className="text-lg font-semibold text-[var(--text-primary)]">
              {formattedData.totalViolations}
            </p>
            <p className="text-xs text-[var(--text-secondary)]">
              Issues found
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

// Media Analysis Results Component
export const MediaAnalysisResults = ({ complianceResult }) => {
  const getModalityStatus = (result) => {
    if (!result) return { compliant: null, summary: 'Not analyzed' };
    return {
      compliant: result.compliant,
      summary: result.summary || 'Analysis completed',
      violations: result.violations || []
    };
  };

  const modalities = [
    {
      key: 'text_op',
      name: 'Text Content',
      icon: FileText,
      data: complianceResult?.text_op
    },
    {
      key: 'image_op',
      name: 'Image Content',
      icon: ImageIcon,
      data: complianceResult?.image_op
    },
    {
      key: 'video_op',
      name: 'Video Content',
      icon: Play,
      data: complianceResult?.video_op
    },
    {
      key: 'audio_op',
      name: 'Audio Content',
      icon: Volume2,
      data: complianceResult?.audio_op
    },
    {
      key: 'link_op',
      name: 'Landing Page',
      icon: Link,
      data: complianceResult?.link_op
    }
  ];

  return (
    <div className="space-y-4">
      {modalities.map(({ key, name, icon: Icon, data }) => {
        const status = getModalityStatus(data);
        
        if (status.compliant === null) return null;

        return (
          <div key={key} className="bg-[var(--bg-secondary)] rounded-lg p-4 border border-[var(--border-color)]">
            <div className="flex items-center space-x-3 mb-3">
              <Icon className="w-5 h-5 text-[var(--accent-color)]" />
              <h4 className="font-medium text-[var(--text-primary)]">{name}</h4>
              <div className="flex items-center space-x-2">
                {status.compliant ? (
                  <CheckCircle className="w-4 h-4 text-green-600" />
                ) : (
                  <XCircle className="w-4 h-4 text-red-600" />
                )}
                <span className={`text-sm ${status.compliant ? 'text-green-600' : 'text-red-600'}`}>
                  {status.compliant ? 'Compliant' : 'Non-compliant'}
                </span>
              </div>
            </div>
            
            <p className="text-sm text-[var(--text-secondary)] mb-2">
              {status.summary}
            </p>
            
            {status.violations.length > 0 && (
              <div className="mt-3">
                <p className="text-sm font-medium text-[var(--text-primary)] mb-2">
                  Violations ({status.violations.length}):
                </p>
                <div className="space-y-2">
                  {status.violations.slice(0, 2).map((violation, index) => (
                    <div key={index} className="bg-[var(--card-bg)] rounded p-2 border border-[var(--border-color)]">
                      <p className="text-xs text-[var(--text-primary)]">{violation.violation || violation}</p>
                    </div>
                  ))}
                  {status.violations.length > 2 && (
                    <p className="text-xs text-[var(--text-secondary)]">
                      +{status.violations.length - 2} more violations
                    </p>
                  )}
                </div>
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
};

// Processing Timeline Component
export const ProcessingTimeline = ({ executionTime }) => {
  if (!executionTime) return null;

  const timelineEvents = [
    { key: 'upload_started', label: 'Upload Started', time: executionTime.upload_started },
    { key: 'media_upload_completed', label: 'Media Upload Completed', time: executionTime.media_upload_completed },
    { key: 'compliance_check_started', label: 'Compliance Check Started', time: executionTime.compliance_check_started },
    { key: 'compliance_completed', label: 'Compliance Analysis Completed', time: executionTime.compliance_completed },
    { key: 'call_process_completed', label: 'Call Process Completed', time: executionTime.call_process_completed },
    { key: 'report_generation_started', label: 'Report Generation Started', time: executionTime.report_generation_started }
  ].filter(event => event.time);

  return (
    <div className="bg-[var(--bg-secondary)] rounded-lg p-4 border border-[var(--border-color)]">
      <h4 className="font-medium text-[var(--text-primary)] mb-4 flex items-center space-x-2">
        <Clock className="w-4 h-4" />
        <span>Processing Timeline</span>
      </h4>
      
      <div className="space-y-3">
        {timelineEvents.map((event, index) => (
          <div key={event.key} className="flex items-center space-x-3">
            <div className="w-2 h-2 rounded-full bg-[var(--accent-color)]"></div>
            <div className="flex-1">
              <p className="text-sm text-[var(--text-primary)]">{event.label}</p>
              <p className="text-xs text-[var(--text-secondary)]">
                {new Date(event.time).toLocaleString()}
              </p>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};