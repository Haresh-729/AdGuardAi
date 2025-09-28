import React, { useState, useEffect } from 'react';
import {
  X,
  CheckCircle,
  XCircle,
  AlertTriangle,
  Clock,
  Phone,
  PhoneCall,
  Download,
  ExternalLink,
  Eye,
  Play,
  Pause,
  Volume2,
  VolumeX,
  FileText,
  Image as ImageIcon,
  Link,
  Calendar,
  User,
  Shield,
  AlertCircle,
  Info,
  ChevronDown,
  ChevronUp,
  Maximize2,
  Minimize2,
  Copy,
  CheckCircle2,
  TrendingUp,
  TrendingDown,
  Minus,
  Timer,
  Activity,
  Zap,
  Upload,
} from 'lucide-react';

const AdvancedDetailModal = ({ report, isAdmin, onClose, onAdminAction }) => {
  const [activeTab, setActiveTab] = useState('overview');
  const [expandedSections, setExpandedSections] = useState({
    media: true,
    violations: true,
    timeline: false,
    technical: false,
  });
  const [selectedMedia, setSelectedMedia] = useState(null);
  const [videoStates, setVideoStates] = useState({});

  // Extract data from report
  const complianceResult = report.compliance_result || {};
  const media = report.media?.public_url || {};
  const adDetails = complianceResult.processing_summary?.ad_details || report.advertisement;
  const userData = complianceResult.processing_summary?.user_data || report.user;
  const executionTime = report.execution_time || {};
  
  // Calculate overall metrics
  const overallRiskScore = complianceResult.compliance_results?.risk_score || 0;
  const overallVerdict = complianceResult.compliance_results?.verdict || report.verdict || 'unknown';
  const callRequired = report.call_required || complianceResult.compliance_results?.make_call;
  const callCompleted = executionTime.call_process_completed ? true : false;

  // Extract violations from all sources
  const getAllViolations = () => {
    const violations = [];
    
    // Text violations
    if (complianceResult.text_op?.violations) {
      violations.push(...complianceResult.text_op.violations.map(v => ({
        ...v,
        type: 'text',
        source: 'Text Content'
      })));
    }

    // Image violations
    if (complianceResult.image_op?.results) {
      complianceResult.image_op.results.forEach((result, index) => {
        if (result.image_compliance?.violations) {
          violations.push(...result.image_compliance.violations.map(v => ({
            ...v,
            type: 'image',
            source: `Image ${index + 1}`,
            mediaUrl: result.source_url
          })));
        }
      });
    }

    // Video violations (both audio and visual)
    if (complianceResult.video_op?.results) {
      complianceResult.video_op.results.forEach((result, index) => {
        // Audio violations
        if (result.audio_analysis?.violations) {
          violations.push(...result.audio_analysis.violations.map(v => ({
            ...v,
            type: 'video_audio',
            source: `Video ${index + 1} (Audio)`,
            mediaUrl: result.source_url,
            transcription: result.audio_analysis.transcribed_text
          })));
        }
        
        // Frame violations
        if (result.detailed_frame_results) {
          result.detailed_frame_results.forEach(frame => {
            if (frame.image_compliance?.violations) {
              violations.push(...frame.image_compliance.violations.map(v => ({
                ...v,
                type: 'video_frame',
                source: `Video ${index + 1} (Frame ${frame.frame_number})`,
                timestamp: frame.timestamp,
                mediaUrl: result.source_url
              })));
            }
          });
        }
      });
    }

    return violations;
  };

  const allViolations = getAllViolations();

  const toggleSection = (section) => {
    setExpandedSections(prev => ({
      ...prev,
      [section]: !prev[section]
    }));
  };

  const getRiskLevelInfo = (score) => {
    if (score <= 0.3) return { level: 'Low', color: 'text-green-600', bgColor: 'bg-green-100', icon: TrendingDown };
    if (score <= 0.7) return { level: 'Medium', color: 'text-yellow-600', bgColor: 'bg-yellow-100', icon: Minus };
    return { level: 'High', color: 'text-red-600', bgColor: 'bg-red-100', icon: TrendingUp };
  };

  const getStatusInfo = (verdict) => {
    switch (verdict?.toLowerCase()) {
      case 'pass':
      case 'approved':
        return { label: 'Passed', color: 'text-green-600', bgColor: 'bg-green-100', icon: CheckCircle };
      case 'fail':
      case 'rejected':
        return { label: 'Failed', color: 'text-red-600', bgColor: 'bg-red-100', icon: XCircle };
      case 'clarification_needed':
        return { label: 'Clarification Needed', color: 'text-blue-600', bgColor: 'bg-blue-100', icon: Phone };
      case 'manual_review':
        return { label: 'Manual Review', color: 'text-yellow-600', bgColor: 'bg-yellow-100', icon: AlertTriangle };
      default:
        return { label: 'Processing', color: 'text-gray-600', bgColor: 'bg-gray-100', icon: Clock };
    }
  };

  const riskInfo = getRiskLevelInfo(overallRiskScore);
  const statusInfo = getStatusInfo(overallVerdict);

  const tabs = [
    { id: 'overview', label: 'Overview', icon: Shield },
    { id: 'media', label: 'Media Analysis', icon: ImageIcon },
    { id: 'violations', label: `Violations (${allViolations.length})`, icon: AlertTriangle },
    { id: 'call', label: 'Call Process', icon: Phone },
    { id: 'timeline', label: 'Processing', icon: Timer },
    { id: 'technical', label: 'Technical', icon: Activity },
  ];

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-99999 flex">
      {/* Keep sidebar and navbar visible */}
      <div className=" bg-transparent"></div>
      
      <div className="flex-1 flex flex-col">
        {/* Keep navbar space */}
        <div className=" bg-transparent"></div>
        
        {/* Main modal content */}
        <div className="flex-1 bg-[var(--card-bg)] m-4 rounded-2xl border border-[var(--border-color)] overflow-hidden flex flex-col">
          {/* Header */}
          <div className="flex items-center justify-between p-6 border-b border-[var(--border-color)] bg-gradient-to-r from-[var(--accent-color)]/5 to-blue-500/5">
            <div className="flex items-center space-x-4">
              <div className="w-12 h-12 bg-gradient-to-r from-[var(--accent-color)] to-blue-600 rounded-xl flex items-center justify-center">
                <Shield className="w-6 h-6 text-white" />
              </div>
              <div>
                <h1 className="text-2xl font-bold text-[var(--text-primary)]">
                  {adDetails?.title || 'Advertisement Report'}
                </h1>
                <p className="text-[var(--text-secondary)]">
                  Analysis ID: {report.analysis_results_id} • Created: {new Date(report.created_at).toLocaleDateString()}
                </p>
              </div>
            </div>
            
            <div className="flex items-center space-x-3">
              {/* Quick Status Indicators */}
              <div className={`flex items-center space-x-2 px-3 py-2 rounded-lg ${statusInfo.bgColor}`}>
                <statusInfo.icon className={`w-4 h-4 ${statusInfo.color}`} />
                <span className={`text-sm font-medium ${statusInfo.color}`}>{statusInfo.label}</span>
              </div>
              
              <div className={`flex items-center space-x-2 px-3 py-2 rounded-lg ${riskInfo.bgColor}`}>
                <riskInfo.icon className={`w-4 h-4 ${riskInfo.color}`} />
                <span className={`text-sm font-medium ${riskInfo.color}`}>
                  {riskInfo.level} Risk ({(overallRiskScore * 100).toFixed(1)}%)
                </span>
              </div>

              <button
                onClick={onClose}
                className="w-10 h-10 rounded-lg hover:bg-[var(--highlight-color)] flex items-center justify-center transition-colors"
              >
                <X className="w-5 h-5 text-[var(--text-secondary)]" />
              </button>
            </div>
          </div>

          {/* Tab Navigation */}
          <div className="flex items-center px-6 bg-[var(--bg-secondary)] border-b border-[var(--border-color)]">
            {tabs.map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`flex items-center space-x-2 px-4 py-3 border-b-2 transition-all ${
                  activeTab === tab.id
                    ? 'border-[var(--accent-color)] text-[var(--accent-color)]'
                    : 'border-transparent text-[var(--text-secondary)] hover:text-[var(--text-primary)]'
                }`}
              >
                <tab.icon className="w-4 h-4" />
                <span className="text-sm font-medium">{tab.label}</span>
              </button>
            ))}
          </div>

          {/* Tab Content */}
          <div className="flex-1 overflow-y-auto p-6">
            {activeTab === 'overview' && (
              <OverviewTab
                report={report}
                adDetails={adDetails}
                userData={userData}
                complianceResult={complianceResult}
                allViolations={allViolations}
                isAdmin={isAdmin}
                onAdminAction={onAdminAction}
              />
            )}

            {activeTab === 'media' && (
              <MediaTab
                media={media}
                complianceResult={complianceResult}
                selectedMedia={selectedMedia}
                setSelectedMedia={setSelectedMedia}
                videoStates={videoStates}
                setVideoStates={setVideoStates}
              />
            )}

            {activeTab === 'violations' && (
              <ViolationsTab violations={allViolations} />
            )}

            {activeTab === 'call' && (
              <CallTab
                complianceResult={complianceResult}
                callRequired={callRequired}
                callCompleted={callCompleted}
                executionTime={executionTime}
              />
            )}

            {activeTab === 'timeline' && (
              <TimelineTab executionTime={executionTime} report={report} />
            )}

            {activeTab === 'technical' && (
              <TechnicalTab report={report} complianceResult={complianceResult} />
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

// Overview Tab Component
const OverviewTab = ({ report, adDetails, userData, complianceResult, allViolations, isAdmin, onAdminAction }) => {
  const overallRiskScore = complianceResult.compliance_results?.risk_score || 0;
  const modalities = complianceResult.compliance_results?.modalities || {};

  return (
    <div className="space-y-6">
      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-[var(--bg-secondary)] rounded-xl p-4 border border-[var(--border-color)]">
          <div className="flex items-center space-x-3">
            <Shield className="w-8 h-8 text-[var(--accent-color)]" />
            <div>
              <p className="text-sm text-[var(--text-secondary)]">Overall Status</p>
              <p className="text-lg font-bold text-[var(--text-primary)] capitalize">
                {complianceResult.compliance_results?.verdict || 'Processing'}
              </p>
            </div>
          </div>
        </div>

        <div className="bg-[var(--bg-secondary)] rounded-xl p-4 border border-[var(--border-color)]">
          <div className="flex items-center space-x-3">
            <AlertTriangle className="w-8 h-8 text-red-500" />
            <div>
              <p className="text-sm text-[var(--text-secondary)]">Violations</p>
              <p className="text-lg font-bold text-[var(--text-primary)]">{allViolations.length}</p>
            </div>
          </div>
        </div>

        <div className="bg-[var(--bg-secondary)] rounded-xl p-4 border border-[var(--border-color)]">
          <div className="flex items-center space-x-3">
            <Zap className="w-8 h-8 text-yellow-500" />
            <div>
              <p className="text-sm text-[var(--text-secondary)]">Risk Score</p>
              <p className="text-lg font-bold text-[var(--text-primary)]">
                {(overallRiskScore * 100).toFixed(1)}%
              </p>
            </div>
          </div>
        </div>

        <div className="bg-[var(--bg-secondary)] rounded-xl p-4 border border-[var(--border-color)]">
          <div className="flex items-center space-x-3">
            <Phone className="w-8 h-8 text-blue-500" />
            <div>
              <p className="text-sm text-[var(--text-secondary)]">Call Status</p>
              <p className="text-lg font-bold text-[var(--text-primary)]">
                {report.call_required ? 'Required' : 'Not Required'}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Advertisement Details */}
      <div className="bg-[var(--bg-secondary)] rounded-xl p-6 border border-[var(--border-color)]">
        <h3 className="text-lg font-semibold text-[var(--text-primary)] mb-4">Advertisement Details</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="text-sm text-[var(--text-secondary)]">Title:</label>
            <p className="text-[var(--text-primary)] font-medium">{adDetails?.title}</p>
          </div>
          <div>
            <label className="text-sm text-[var(--text-secondary)]">Language:</label>
            <p className="text-[var(--text-primary)] font-medium">{adDetails?.language || 'Not specified'}</p>
          </div>
          <div>
            <label className="text-sm text-[var(--text-secondary)]">Target Region:</label>
            <p className="text-[var(--text-primary)] font-medium">{adDetails?.target_region || 'Not specified'}</p>
          </div>
          <div>
            <label className="text-sm text-[var(--text-secondary)]">Target Audience:</label>
            <p className="text-[var(--text-primary)] font-medium">{adDetails?.target_audience || 'Not specified'}</p>
          </div>
          <div className="md:col-span-2">
            <label className="text-sm text-[var(--text-secondary)]">Description:</label>
            <p className="text-[var(--text-primary)] mt-1">{adDetails?.description}</p>
          </div>
          {adDetails?.landing_url && (
            <div className="md:col-span-2">
              <label className="text-sm text-[var(--text-secondary)]">Landing Page:</label>
              <a 
                href={adDetails.landing_url} 
                target="_blank" 
                rel="noopener noreferrer"
                className="text-[var(--accent-color)] hover:opacity-80 flex items-center space-x-1 mt-1"
              >
                <span>{adDetails.landing_url}</span>
                <ExternalLink className="w-3 h-3" />
              </a>
            </div>
          )}
        </div>
      </div>

      {/* Modality Analysis Summary */}
      <div className="bg-[var(--bg-secondary)] rounded-xl p-6 border border-[var(--border-color)]">
        <h3 className="text-lg font-semibold text-[var(--text-primary)] mb-4">Analysis by Content Type</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {Object.entries(modalities).map(([type, data]) => {
            if (!data || (!data.summary && data.compliant === undefined)) return null;
            
            const typeIcons = {
              text: FileText,
              image: ImageIcon,
              video: Play,
              audio: Volume2,
              link: Link
            };
            
            const Icon = typeIcons[type] || Shield;
            
            return (
              <div key={type} className="bg-[var(--card-bg)] rounded-lg p-4 border border-[var(--border-color)]">
                <div className="flex items-center space-x-3 mb-2">
                  <Icon className="w-5 h-5 text-[var(--accent-color)]" />
                  <span className="font-medium text-[var(--text-primary)] capitalize">{type}</span>
                  {data.compliant !== undefined && (
                    data.compliant ? 
                      <CheckCircle className="w-4 h-4 text-green-600" /> : 
                      <XCircle className="w-4 h-4 text-red-600" />
                  )}
                </div>
                <p className="text-sm text-[var(--text-secondary)]">
                  {data.summary || (data.compliant ? 'Compliant' : 'Non-compliant')}
                </p>
                {data.risk_score !== undefined && (
                  <p className="text-xs text-[var(--text-secondary)] mt-1">
                    Risk: {(data.risk_score * 100).toFixed(1)}%
                  </p>
                )}
              </div>
            );
          })}
        </div>
      </div>

      {/* Admin Actions */}
      {isAdmin && (
        <div className="bg-[var(--bg-secondary)] rounded-xl p-6 border border-[var(--border-color)]">
          <h3 className="text-lg font-semibold text-[var(--text-primary)] mb-4">Admin Review</h3>
          
          {report.admin_verdict ? (
            <div className="space-y-3">
              <div className="flex items-center space-x-3">
                <span className="text-sm text-[var(--text-secondary)]">Final Verdict:</span>
                <div className="flex items-center space-x-2">
                  {report.admin_verdict === 'approved' ? (
                    <CheckCircle className="w-4 h-4 text-green-600" />
                  ) : (
                    <XCircle className="w-4 h-4 text-red-600" />
                  )}
                  <span className={`font-medium capitalize ${
                    report.admin_verdict === 'approved' ? 'text-green-600' : 'text-red-600'
                  }`}>
                    {report.admin_verdict}
                  </span>
                </div>
              </div>
              
              {report.admin_reason && (
                <div>
                  <span className="text-sm text-[var(--text-secondary)]">Reason:</span>
                  <p className="text-[var(--text-primary)] mt-1 bg-[var(--card-bg)] p-3 rounded border">{report.admin_reason}</p>
                </div>
              )}
              
              {report.approved_by_user && (
                <div>
                  <span className="text-sm text-[var(--text-secondary)]">Reviewed by:</span>
                  <p className="text-[var(--text-primary)] mt-1">{report.approved_by_user.name} on {new Date(report.updated_at).toLocaleDateString()}</p>
                </div>
              )}
            </div>
          ) : (
            <div className="flex items-center space-x-3">
              <button
                onClick={() => onAdminAction('approve', report.analysis_results_id)}
                className="flex items-center space-x-2 px-6 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-all"
              >
                <CheckCircle className="w-4 h-4" />
                <span>Approve Advertisement</span>
              </button>
              <button
                onClick={() => onAdminAction('reject', report.analysis_results_id)}
                className="flex items-center space-x-2 px-6 py-3 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-all"
              >
                <XCircle className="w-4 h-4" />
                <span>Reject Advertisement</span>
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

// Media Tab Component
const MediaTab = ({ media, complianceResult, selectedMedia, setSelectedMedia, videoStates, setVideoStates }) => {
  const handleVideoToggle = (videoId) => {
    setVideoStates(prev => ({
      ...prev,
      [videoId]: {
        ...prev[videoId],
        playing: !prev[videoId]?.playing
      }
    }));
  };

  return (
    <div className="space-y-6">
      {/* Media Gallery */}
      {(media.image?.length > 0 || media.video?.length > 0) && (
        <div className="bg-[var(--bg-secondary)] rounded-xl p-6 border border-[var(--border-color)]">
          <h3 className="text-lg font-semibold text-[var(--text-primary)] mb-4">Media Assets</h3>
          
          {/* Images */}
          {media.image?.length > 0 && (
            <div className="mb-6">
              <h4 className="text-md font-medium text-[var(--text-primary)] mb-3 flex items-center space-x-2">
                <ImageIcon className="w-4 h-4" />
                <span>Images ({media.image.length})</span>
              </h4>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {media.image.map((imageUrl, index) => {
                  const imageAnalysis = complianceResult.image_op?.results?.[index];
                  
                  return (
                    <div key={index} className="bg-[var(--card-bg)] rounded-lg p-3 border border-[var(--border-color)]">
                      <div className="relative group">
                        <img 
                          src={imageUrl} 
                          alt={`Advertisement Image ${index + 1}`}
                          className="w-full h-48 object-cover rounded-lg cursor-pointer"
                          onClick={() => setSelectedMedia({ type: 'image', url: imageUrl, index })}
                          onError={(e) => {
                            e.target.style.display = 'none';
                            e.target.nextSibling.style.display = 'flex';
                          }}
                        />
                        <div className="hidden w-full h-48 bg-gray-200 rounded-lg items-center justify-center">
                          <span className="text-gray-500">Image not available</span>
                        </div>
                        
                        <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity rounded-lg flex items-center justify-center space-x-2">
                          <button
                            onClick={() => setSelectedMedia({ type: 'image', url: imageUrl, index })}
                            className="p-2 bg-white/20 rounded-lg hover:bg-white/30 transition-colors"
                          >
                            <Eye className="w-4 h-4 text-white" />
                          </button>
                          <a
                            href={imageUrl}
                            download={`image-${index + 1}.jpg`}
                            className="p-2 bg-white/20 rounded-lg hover:bg-white/30 transition-colors"
                          >
                            <Download className="w-4 h-4 text-white" />
                          </a>
                        </div>
                      </div>
                      
                      <div className="mt-3 space-y-2">
                        <div className="flex items-center justify-between">
                          <span className="text-sm font-medium text-[var(--text-primary)]">Image {index + 1}</span>
                          {imageAnalysis?.image_compliance && (
                            <div className="flex items-center space-x-1">
                              {imageAnalysis.image_compliance.compliant ? (
                                <CheckCircle className="w-3 h-3 text-green-600" />
                              ) : (
                                <XCircle className="w-3 h-3 text-red-600" />
                              )}
                              <span className={`text-xs ${imageAnalysis.image_compliance.compliant ? 'text-green-600' : 'text-red-600'}`}>
                                {imageAnalysis.image_compliance.compliant ? 'Compliant' : 'Violations'}
                              </span>
                            </div>
                          )}
                        </div>
                        
                        {imageAnalysis?.image_compliance?.extracted_text && (
                          <div className="bg-[var(--bg-secondary)] rounded p-2">
                            <p className="text-xs text-[var(--text-secondary)]">Extracted Text:</p>
                            <p className="text-xs text-[var(--text-primary)] mt-1">{imageAnalysis.image_compliance.extracted_text}</p>
                          </div>
                        )}
                        
                        {imageAnalysis?.image_compliance?.visual_analysis?.detected_objects && (
                          <div>
                            <p className="text-xs text-[var(--text-secondary)]">Detected Objects:</p>
                            <div className="flex flex-wrap gap-1 mt-1">
                              {imageAnalysis.image_compliance.visual_analysis.detected_objects.slice(0, 3).map((obj, i) => (
                                <span key={i} className="text-xs px-2 py-1 bg-[var(--accent-color)]/10 text-[var(--accent-color)] rounded">
                                  {obj}
                                </span>
                              ))}
                              {imageAnalysis.image_compliance.visual_analysis.detected_objects.length > 3 && (
                                <span className="text-xs text-[var(--text-secondary)]">
                                  +{imageAnalysis.image_compliance.visual_analysis.detected_objects.length - 3} more
                                </span>
                              )}
                            </div>
                          </div>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* Videos */}
          {media.video?.length > 0 && (
            <div>
              <h4 className="text-md font-medium text-[var(--text-primary)] mb-3 flex items-center space-x-2">
                <Play className="w-4 h-4" />
                <span>Videos ({media.video.length})</span>
              </h4>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {media.video.map((videoUrl, index) => {
                  const videoAnalysis = complianceResult.video_op?.results?.[index];
                  
                  return (
                    <div key={index} className="bg-[var(--card-bg)] rounded-lg p-3 border border-[var(--border-color)]">
                      <div className="relative">
                        <video 
                          src={videoUrl}
                          className="w-full h-48 object-cover rounded-lg"
                          controls
                          preload="metadata"
                        />
                      </div>
                      
                      <div className="mt-3 space-y-3">
                        <div className="flex items-center justify-between">
                          <span className="text-sm font-medium text-[var(--text-primary)]">Video {index + 1}</span>
                          <div className="flex items-center space-x-2">
                            {videoAnalysis?.compliance_assessment && (
                              <>
                                <div className="flex items-center space-x-1">
                                  {videoAnalysis.compliance_assessment.video_compliant ? (
                                    <CheckCircle className="w-3 h-3 text-green-600" />
                                  ) : (
                                    <XCircle className="w-3 h-3 text-red-600" />
                                  )}
                                  <span className="text-xs text-[var(--text-secondary)]">Visual</span>
                                </div>
                                <div className="flex items-center space-x-1">
                                  {videoAnalysis.compliance_assessment.audio_compliant ? (
                                    <CheckCircle className="w-3 h-3 text-green-600" />
                                  ) : (
                                    <XCircle className="w-3 h-3 text-red-600" />
                                  )}
                                  <span className="text-xs text-[var(--text-secondary)]">Audio</span>
                                </div>
                              </>
                            )}
                          </div>
                        </div>
                        
                        {videoAnalysis?.video_metadata && (
                          <div className="bg-[var(--bg-secondary)] rounded p-2">
                            <p className="text-xs text-[var(--text-secondary)]">Video Info:</p>
                            <p className="text-xs text-[var(--text-primary)] mt-1">
                              Duration: {Math.round(videoAnalysis.video_metadata.duration_seconds)}s | 
                              Resolution: {videoAnalysis.video_metadata.width}x{videoAnalysis.video_metadata.height} | 
                              FPS: {videoAnalysis.video_metadata.fps}
                            </p>
                          </div>
                        )}
                        
                        {videoAnalysis?.audio_analysis?.transcribed_text && (
                          <div className="bg-[var(--bg-secondary)] rounded p-2">
                            <p className="text-xs text-[var(--text-secondary)]">Audio Transcript:</p>
                            <p className="text-xs text-[var(--text-primary)] mt-1 max-h-20 overflow-y-auto">
                              {videoAnalysis.audio_analysis.transcribed_text}
                            </p>
                          </div>
                        )}

                        {videoAnalysis?.violation_summary && (
                          <div className="flex items-center justify-between text-xs">
                            <span className="text-[var(--text-secondary)]">
                              Violations: {videoAnalysis.violation_summary.total_violations}
                            </span>
                            <span className="text-[var(--text-secondary)]">
                              Risk: {(videoAnalysis.compliance_assessment?.risk_score * 100 || 0).toFixed(1)}%
                            </span>
                          </div>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </div>
      )}

      {/* Text Content Analysis */}
      {complianceResult.text_op && (
        <div className="bg-[var(--bg-secondary)] rounded-xl p-6 border border-[var(--border-color)]">
          <h3 className="text-lg font-semibold text-[var(--text-primary)] mb-4 flex items-center space-x-2">
            <FileText className="w-5 h-5" />
            <span>Text Content Analysis</span>
          </h3>
          
          <div className="space-y-4">
            <div className="bg-[var(--card-bg)] rounded-lg p-4 border border-[var(--border-color)]">
              <div className="flex items-center justify-between mb-3">
                <span className="font-medium text-[var(--text-primary)]">Advertisement Copy</span>
                <div className="flex items-center space-x-2">
                  {complianceResult.text_op.compliant ? (
                    <CheckCircle className="w-4 h-4 text-green-600" />
                  ) : (
                    <XCircle className="w-4 h-4 text-red-600" />
                  )}
                  <span className={`text-sm ${complianceResult.text_op.compliant ? 'text-green-600' : 'text-red-600'}`}>
                    {complianceResult.text_op.compliant ? 'Compliant' : 'Non-compliant'}
                  </span>
                </div>
              </div>
              
              <p className="text-[var(--text-primary)] mb-3">
                {complianceResult.text_op.processed_content}
              </p>
              
              <div className="flex items-center justify-between text-sm">
                <span className="text-[var(--text-secondary)]">
                  Analysis Method: {complianceResult.text_op.analysis_method}
                </span>
                <span className="text-[var(--text-secondary)]">
                  Risk Score: {(complianceResult.text_op.risk_score * 100).toFixed(1)}%
                </span>
              </div>
              
              {complianceResult.text_op.summary && (
                <div className="mt-3 bg-[var(--bg-secondary)] rounded p-3">
                  <p className="text-sm text-[var(--text-primary)]">{complianceResult.text_op.summary}</p>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Landing Page Analysis */}
      {complianceResult.link_op && (
        <div className="bg-[var(--bg-secondary)] rounded-xl p-6 border border-[var(--border-color)]">
          <h3 className="text-lg font-semibold text-[var(--text-primary)] mb-4 flex items-center space-x-2">
            <Link className="w-5 h-5" />
            <span>Landing Page Analysis</span>
          </h3>
          
          <div className="bg-[var(--card-bg)] rounded-lg p-4 border border-[var(--border-color)]">
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center space-x-2">
                <span className="font-medium text-[var(--text-primary)]">{complianceResult.link_op.domain}</span>
                <a 
                  href={complianceResult.link_op.url} 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="text-[var(--accent-color)] hover:opacity-80"
                >
                  <ExternalLink className="w-4 h-4" />
                </a>
              </div>
              <div className="flex items-center space-x-2">
                {complianceResult.link_op.compliant ? (
                  <CheckCircle className="w-4 h-4 text-green-600" />
                ) : (
                  <XCircle className="w-4 h-4 text-red-600" />
                )}
                <span className={`text-sm ${complianceResult.link_op.compliant ? 'text-green-600' : 'text-red-600'}`}>
                  {complianceResult.link_op.compliant ? 'Compliant' : 'Non-compliant'}
                </span>
              </div>
            </div>
            
            <p className="text-sm text-[var(--text-primary)] mb-3">{complianceResult.link_op.summary}</p>
            
            <div className="flex items-center justify-between text-sm">
              <span className="text-[var(--text-secondary)]">
                Analysis Method: {complianceResult.link_op.analysis_method}
              </span>
              <span className="text-[var(--text-secondary)]">
                Risk Score: {(complianceResult.link_op.risk_score * 100).toFixed(1)}%
              </span>
            </div>
          </div>
        </div>
      )}

      {/* Media Viewer Modal */}
      {selectedMedia && (
        <div className="fixed inset-0 bg-black/80 z-50 flex items-center justify-center p-4" onClick={() => setSelectedMedia(null)}>
          <div className="max-w-4xl max-h-full bg-[var(--card-bg)] rounded-lg overflow-hidden" onClick={e => e.stopPropagation()}>
            <div className="flex items-center justify-between p-4 border-b border-[var(--border-color)]">
              <span className="font-medium text-[var(--text-primary)]">
                {selectedMedia.type === 'image' ? 'Image' : 'Video'} {selectedMedia.index + 1}
              </span>
              <button onClick={() => setSelectedMedia(null)} className="text-[var(--text-secondary)] hover:text-[var(--text-primary)]">
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="p-4">
              {selectedMedia.type === 'image' ? (
                <img src={selectedMedia.url} alt="Full size" className="max-w-full max-h-[70vh] object-contain mx-auto" />
              ) : (
                <video src={selectedMedia.url} controls className="max-w-full max-h-[70vh] mx-auto" />
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

// Violations Tab Component
const ViolationsTab = ({ violations }) => {
  const [selectedViolation, setSelectedViolation] = useState(null);
  
  const getSeverityColor = (confidence) => {
    if (confidence >= 0.8) return { color: 'text-red-600', bg: 'bg-red-50', border: 'border-red-200' };
    if (confidence >= 0.6) return { color: 'text-yellow-600', bg: 'bg-yellow-50', border: 'border-yellow-200' };
    return { color: 'text-blue-600', bg: 'bg-blue-50', border: 'border-blue-200' };
  };

  const groupedViolations = violations.reduce((acc, violation) => {
    if (!acc[violation.type]) acc[violation.type] = [];
    acc[violation.type].push(violation);
    return acc;
  }, {});

  return (
    <div className="space-y-6">
      {violations.length === 0 ? (
        <div className="text-center py-12">
          <CheckCircle className="w-16 h-16 text-green-500 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-[var(--text-primary)] mb-2">No Violations Found</h3>
          <p className="text-[var(--text-secondary)]">This advertisement appears to be compliant with all policies.</p>
        </div>
      ) : (
        <>
          {/* Summary */}
          <div className="bg-[var(--bg-secondary)] rounded-xl p-6 border border-[var(--border-color)]">
            <h3 className="text-lg font-semibold text-[var(--text-primary)] mb-4">Violations Summary</h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="text-center">
                <div className="text-2xl font-bold text-red-600">{violations.length}</div>
                <div className="text-sm text-[var(--text-secondary)]">Total Violations</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-yellow-600">
                  {violations.filter(v => v.confidence >= 0.8).length}
                </div>
                <div className="text-sm text-[var(--text-secondary)]">High Confidence</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-[var(--accent-color)]">
                  {Object.keys(groupedViolations).length}
                </div>
                <div className="text-sm text-[var(--text-secondary)]">Content Types</div>
              </div>
            </div>
          </div>

          {/* Violations by Type */}
          {Object.entries(groupedViolations).map(([type, typeViolations]) => (
            <div key={type} className="bg-[var(--bg-secondary)] rounded-xl p-6 border border-[var(--border-color)]">
              <h3 className="text-lg font-semibold text-[var(--text-primary)] mb-4 capitalize flex items-center space-x-2">
                {type === 'text' && <FileText className="w-5 h-5" />}
                {type === 'image' && <ImageIcon className="w-5 h-5" />}
                {(type === 'video_audio' || type === 'video_frame') && <Play className="w-5 h-5" />}
                <span>{type.replace('_', ' ')} Violations ({typeViolations.length})</span>
              </h3>
              
              <div className="space-y-4">
                {typeViolations.map((violation, index) => {
                  const severity = getSeverityColor(violation.confidence || 0);
                  
                  return (
                    <div key={index} className={`bg-[var(--card-bg)] rounded-lg p-4 border ${severity.border}`}>
                      <div className="flex items-start justify-between mb-3">
                        <div className="flex-1">
                          <div className="flex items-center space-x-2 mb-2">
                            <span className={`text-xs px-2 py-1 rounded-full ${severity.bg} ${severity.color} border ${severity.border}`}>
                              {Math.round((violation.confidence || 0) * 100)}% Confidence
                            </span>
                            <span className="text-xs px-2 py-1 rounded-full bg-[var(--bg-secondary)] text-[var(--text-secondary)] border border-[var(--border-color)]">
                              {violation.source}
                            </span>
                            {violation.timestamp !== undefined && (
                              <span className="text-xs px-2 py-1 rounded-full bg-blue-50 text-blue-600 border border-blue-200">
                                {violation.timestamp}s
                              </span>
                            )}
                          </div>
                          
                          <h4 className="font-medium text-[var(--text-primary)] mb-2">
                            {violation.violation}
                          </h4>
                          
                          {violation.evidence && (
                            <div className="bg-[var(--bg-secondary)] rounded p-3 mb-2">
                              <p className="text-xs text-[var(--text-secondary)] mb-1">Evidence:</p>
                              <p className="text-sm text-[var(--text-primary)]">{violation.evidence}</p>
                            </div>
                          )}
                          
                          {violation.transcription && (
                            <div className="bg-[var(--bg-secondary)] rounded p-3 mb-2">
                              <p className="text-xs text-[var(--text-secondary)] mb-1">Audio Transcript:</p>
                              <p className="text-sm text-[var(--text-primary)]">{violation.transcription}</p>
                            </div>
                          )}
                          
                          {violation.policy_section && (
                            <p className="text-xs text-[var(--text-secondary)]">
                              Policy Section: {violation.policy_section}
                            </p>
                          )}
                        </div>
                        
                        {violation.mediaUrl && (
                          <button
                            onClick={() => setSelectedViolation(violation)}
                            className="ml-3 px-3 py-1 text-xs bg-[var(--accent-color)] text-white rounded hover:opacity-80"
                          >
                            View Media
                          </button>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          ))}
        </>
      )}
    </div>
  );
};

// Call Tab Component
const CallTab = ({ complianceResult, callRequired, callCompleted, executionTime }) => {
  const queries = complianceResult.compliance_results?.queries_for_call || [];
  
  return (
    <div className="space-y-6">
      {/* Call Status */}
      <div className="bg-[var(--bg-secondary)] rounded-xl p-6 border border-[var(--border-color)]">
        <h3 className="text-lg font-semibold text-[var(--text-primary)] mb-4">Call Process Status</h3>
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="text-center">
            <div className={`w-16 h-16 rounded-full mx-auto mb-3 flex items-center justify-center ${
              callRequired ? 'bg-blue-100 text-blue-600' : 'bg-gray-100 text-gray-600'
            }`}>
              <Phone className="w-8 h-8" />
            </div>
            <div className="font-medium text-[var(--text-primary)]">
              {callRequired ? 'Call Required' : 'No Call Needed'}
            </div>
            <div className="text-sm text-[var(--text-secondary)]">
              {callRequired ? 'Clarification needed' : 'Analysis complete'}
            </div>
          </div>
          
          <div className="text-center">
            <div className={`w-16 h-16 rounded-full mx-auto mb-3 flex items-center justify-center ${
              callCompleted ? 'bg-green-100 text-green-600' : 'bg-gray-100 text-gray-600'
            }`}>
              <PhoneCall className="w-8 h-8" />
            </div>
            <div className="font-medium text-[var(--text-primary)]">
              {callCompleted ? 'Call Completed' : 'Call Pending'}
            </div>
            <div className="text-sm text-[var(--text-secondary)]">
              {callCompleted 
                ? `Completed at ${new Date(executionTime.call_process_completed).toLocaleString()}`
                : 'Awaiting call process'
              }
            </div>
          </div>
          
          <div className="text-center">
            <div className={`w-16 h-16 rounded-full mx-auto mb-3 flex items-center justify-center ${
              queries.length > 0 ? 'bg-yellow-100 text-yellow-600' : 'bg-gray-100 text-gray-600'
            }`}>
              <AlertCircle className="w-8 h-8" />
            </div>
            <div className="font-medium text-[var(--text-primary)]">
              {queries.length} Questions
            </div>
            <div className="text-sm text-[var(--text-secondary)]">
              For clarification
            </div>
          </div>
        </div>
      </div>

      {/* Clarification Questions */}
      {queries.length > 0 && (
        <div className="bg-[var(--bg-secondary)] rounded-xl p-6 border border-[var(--border-color)]">
          <h3 className="text-lg font-semibold text-[var(--text-primary)] mb-4">
            Clarification Questions ({queries.length})
          </h3>
          
          <div className="space-y-4">
            {queries.map((query, index) => (
              <div key={index} className="bg-[var(--card-bg)] rounded-lg p-4 border border-[var(--border-color)]">
                <div className="flex items-start space-x-3">
                  <div className="w-6 h-6 rounded-full bg-[var(--accent-color)] text-white flex items-center justify-center text-xs font-bold">
                    {index + 1}
                  </div>
                  <div className="flex-1">
                    <h4 className="font-medium text-[var(--text-primary)] mb-2">
                      Question {index + 1}
                    </h4>
                    <p className="text-[var(--text-primary)] mb-3">
                      {query.question}
                    </p>
                    <div className="bg-[var(--bg-secondary)] rounded p-3">
                      <p className="text-xs text-[var(--text-secondary)] mb-1">Reason for asking:</p>
                      <p className="text-sm text-[var(--text-primary)]">{query.reason}</p>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Call Instructions */}
      {callRequired && !callCompleted && (
        <div className="bg-blue-50 rounded-xl p-6 border border-blue-200">
          <h3 className="text-lg font-semibold text-blue-800 mb-4 flex items-center space-x-2">
            <Info className="w-5 h-5" />
            <span>Next Steps</span>
          </h3>
          <div className="space-y-3 text-blue-700">
            <p>• A compliance specialist will contact the advertiser to discuss the flagged concerns</p>
            <p>• The call will address the {queries.length} clarification question{queries.length !== 1 ? 's' : ''} listed above</p>
            <p>• Based on the call outcome, the final compliance decision will be updated</p>
            <p>• You will be notified once the call process is complete</p>
          </div>
        </div>
      )}
    </div>
  );
};

// Timeline Tab Component
const TimelineTab = ({ executionTime, report }) => {
  const timelineEvents = [
    { key: 'upload_started', label: 'Upload Started', time: executionTime.upload_started, icon: Upload },
    { key: 'media_upload_started', label: 'Media Upload Started', time: executionTime.media_upload_started, icon: FileText },
    { key: 'media_upload_completed', label: 'Media Upload Completed', time: executionTime.media_upload_completed, icon: CheckCircle },
    { key: 'compliance_check_started', label: 'Compliance Check Started', time: executionTime.compliance_check_started, icon: Shield },
    { key: 'compliance_completed', label: 'AI Analysis Completed', time: executionTime.compliance_completed, icon: CheckCircle },
    { key: 'call_process_completed', label: 'Call Process Completed', time: executionTime.call_process_completed, icon: PhoneCall },
    { key: 'report_generation_started', label: 'Report Generation Started', time: executionTime.report_generation_started, icon: FileText },
  ].filter(event => event.time);

  const getDuration = (start, end) => {
    if (!start || !end) return null;
    const diff = new Date(end) - new Date(start);
    const seconds = Math.round(diff / 1000);
    if (seconds < 60) return `${seconds}s`;
    const minutes = Math.round(seconds / 60);
    return `${minutes}m`;
  };

  return (
    <div className="space-y-6">
      <div className="bg-[var(--bg-secondary)] rounded-xl p-6 border border-[var(--border-color)]">
        <h3 className="text-lg font-semibold text-[var(--text-primary)] mb-4">Processing Summary</h3>
        
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div className="text-center">
            <div className="text-2xl font-bold text-[var(--accent-color)]">
              {timelineEvents.length}
            </div>
            <div className="text-sm text-[var(--text-secondary)]">Processing Steps</div>
          </div>
          
          <div className="text-center">
            <div className="text-2xl font-bold text-[var(--accent-color)]">
              {getDuration(executionTime.upload_started, executionTime.compliance_completed) || 'N/A'}
            </div>
            <div className="text-sm text-[var(--text-secondary)]">Total Analysis Time</div>
          </div>
          
          <div className="text-center">
            <div className="text-2xl font-bold text-[var(--accent-color)]">
              {report.status || 'Processing'}
            </div>
            <div className="text-sm text-[var(--text-secondary)]">Current Status</div>
          </div>
          
          <div className="text-center">
            <div className="text-2xl font-bold text-[var(--accent-color)]">
              {new Date(report.created_at).toLocaleDateString()}
            </div>
            <div className="text-sm text-[var(--text-secondary)]">Date Created</div>
          </div>
        </div>
      </div>
      {/* Timeline */}
      <div className="bg-[var(--bg-secondary)] rounded-xl p-6 border border-[var(--border-color)]">
        <h3 className="text-lg font-semibold text-[var(--text-primary)] mb-6">Processing Timeline</h3>
        
        <div className="relative">
          {/* Timeline line */}
          <div className="absolute left-4 top-0 bottom-0 w-0.5 bg-[var(--border-color)]"></div>
          
          <div className="space-y-6">
            {timelineEvents.map((event, index) => {
              const isLast = index === timelineEvents.length - 1;
              const nextEvent = timelineEvents[index + 1];
              const duration = nextEvent ? getDuration(event.time, nextEvent.time) : null;
              
              return (
                <div key={event.key} className="relative flex items-center space-x-4">
                  {/* Timeline dot */}
                  <div className="w-8 h-8 rounded-full bg-[var(--accent-color)] flex items-center justify-center text-white z-10">
                    <event.icon className="w-4 h-4" />
                  </div>
                  
                  {/* Event content */}
                  <div className="flex-1 bg-[var(--card-bg)] rounded-lg p-4 border border-[var(--border-color)]">
                    <div className="flex items-center justify-between">
                      <h4 className="font-medium text-[var(--text-primary)]">{event.label}</h4>
                      <span className="text-sm text-[var(--text-secondary)]">
                        {new Date(event.time).toLocaleString()}
                      </span>
                    </div>
                    {duration && (
                      <p className="text-xs text-[var(--text-secondary)] mt-1">
                        Duration: {duration}
                      </p>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
};

// Technical Tab Component
const TechnicalTab = ({ report, complianceResult }) => {
  const [expandedSection, setExpandedSection] = useState(null);
  
  const copyToClipboard = (text) => {
    navigator.clipboard.writeText(text);
    // Toast notification would go here
  };

  return (
    <div className="space-y-6">
      {/* API Response Data */}
      <div className="bg-[var(--bg-secondary)] rounded-xl p-6 border border-[var(--border-color)]">
        <h3 className="text-lg font-semibold text-[var(--text-primary)] mb-4">Raw Report Data</h3>
        
        <div className="bg-[var(--card-bg)] rounded-lg border border-[var(--border-color)] overflow-hidden">
          <div className="flex items-center justify-between p-3 border-b border-[var(--border-color)]">
            <span className="text-sm font-medium text-[var(--text-primary)]">JSON Response</span>
            <button
              onClick={() => copyToClipboard(JSON.stringify(report, null, 2))}
              className="flex items-center space-x-1 px-2 py-1 text-xs bg-[var(--accent-color)] text-white rounded hover:opacity-80"
            >
              <Copy className="w-3 h-3" />
              <span>Copy</span>
            </button>
          </div>
          <pre className="p-4 text-xs text-[var(--text-primary)] overflow-auto max-h-96 bg-[var(--input-bg)]">
            {JSON.stringify(report, null, 2)}
          </pre>
        </div>
      </div>

      {/* Processing Details */}
      {complianceResult.processing_summary && (
        <div className="bg-[var(--bg-secondary)] rounded-xl p-6 border border-[var(--border-color)]">
          <h3 className="text-lg font-semibold text-[var(--text-primary)] mb-4">Processing Details</h3>
          
          <div className="space-y-4">
            <div className="bg-[var(--card-bg)] rounded-lg p-4 border border-[var(--border-color)]">
              <h4 className="font-medium text-[var(--text-primary)] mb-2">Processing Summary</h4>
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <span className="text-[var(--text-secondary)]">Items Processed:</span>
                  <span className="ml-2 text-[var(--text-primary)]">
                    {complianceResult.processing_summary.total_items_processed}
                  </span>
                </div>
                <div>
                  <span className="text-[var(--text-secondary)]">Processing Errors:</span>
                  <span className="ml-2 text-[var(--text-primary)]">
                    {complianceResult.processing_summary.processing_errors?.length || 0}
                  </span>
                </div>
              </div>
            </div>

            {/* User Data */}
            {complianceResult.processing_summary.user_data && (
              <div className="bg-[var(--card-bg)] rounded-lg p-4 border border-[var(--border-color)]">
                <h4 className="font-medium text-[var(--text-primary)] mb-2">User Information</h4>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                  <div>
                    <span className="text-[var(--text-secondary)]">Name:</span>
                    <span className="ml-2 text-[var(--text-primary)]">
                      {complianceResult.processing_summary.user_data.name}
                    </span>
                  </div>
                  <div>
                    <span className="text-[var(--text-secondary)]">Email:</span>
                    <span className="ml-2 text-[var(--text-primary)]">
                      {complianceResult.processing_summary.user_data.email}
                    </span>
                  </div>
                  <div>
                    <span className="text-[var(--text-secondary)]">Sector:</span>
                    <span className="ml-2 text-[var(--text-primary)]">
                      {complianceResult.processing_summary.user_data.sector}
                    </span>
                  </div>
                  <div>
                    <span className="text-[var(--text-secondary)]">Mobile:</span>
                    <span className="ml-2 text-[var(--text-primary)]">
                      {complianceResult.processing_summary.user_data.mobile}
                    </span>
                  </div>
                </div>
              </div>
            )}

            {/* Analysis Methods */}
            <div className="bg-[var(--card-bg)] rounded-lg p-4 border border-[var(--border-color)]">
              <h4 className="font-medium text-[var(--text-primary)] mb-2">Analysis Methods Used</h4>
              <div className="space-y-2 text-sm">
                {complianceResult.text_op?.analysis_method && (
                  <div className="flex items-center space-x-2">
                    <FileText className="w-4 h-4 text-[var(--accent-color)]" />
                    <span className="text-[var(--text-secondary)]">Text:</span>
                    <span className="text-[var(--text-primary)]">{complianceResult.text_op.analysis_method}</span>
                  </div>
                )}
                
                {complianceResult.image_op?.results?.[0]?.image_compliance?.analysis_method && (
                  <div className="flex items-center space-x-2">
                    <ImageIcon className="w-4 h-4 text-[var(--accent-color)]" />
                    <span className="text-[var(--text-secondary)]">Image:</span>
                    <span className="text-[var(--text-primary)]">
                      {complianceResult.image_op.results[0].image_compliance.analysis_method}
                    </span>
                  </div>
                )}
                
                {complianceResult.video_op?.results?.[0]?.audio_analysis?.analysis_method && (
                  <div className="flex items-center space-x-2">
                    <Play className="w-4 h-4 text-[var(--accent-color)]" />
                    <span className="text-[var(--text-secondary)]">Video Audio:</span>
                    <span className="text-[var(--text-primary)]">
                      {complianceResult.video_op.results[0].audio_analysis.analysis_method}
                    </span>
                  </div>
                )}
                
                {complianceResult.link_op?.analysis_method && (
                  <div className="flex items-center space-x-2">
                    <Link className="w-4 h-4 text-[var(--accent-color)]" />
                    <span className="text-[var(--text-secondary)]">Landing Page:</span>
                    <span className="text-[var(--text-primary)]">{complianceResult.link_op.analysis_method}</span>
                  </div>
                )}
              </div>
            </div>

            {/* Video Processing Details */}
            {complianceResult.video_op?.results?.[0]?.processing_summary && (
              <div className="bg-[var(--card-bg)] rounded-lg p-4 border border-[var(--border-color)]">
                <h4 className="font-medium text-[var(--text-primary)] mb-2">Video Processing Details</h4>
                <div className="grid grid-cols-2 gap-4 text-sm">
                  {Object.entries(complianceResult.video_op.results[0].processing_summary).map(([key, value]) => (
                    <div key={key}>
                      <span className="text-[var(--text-secondary)] capitalize">
                        {key.replace(/_/g, ' ')}:
                      </span>
                      <span className="ml-2 text-[var(--text-primary)]">
                        {typeof value === 'boolean' ? (value ? 'Yes' : 'No') : value}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* System Information */}
      <div className="bg-[var(--bg-secondary)] rounded-xl p-6 border border-[var(--border-color)]">
        <h3 className="text-lg font-semibold text-[var(--text-primary)] mb-4">System Information</h3>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
          <div className="bg-[var(--card-bg)] rounded-lg p-4 border border-[var(--border-color)]">
            <h4 className="font-medium text-[var(--text-primary)] mb-2">Report Metadata</h4>
            <div className="space-y-1">
              <div>
                <span className="text-[var(--text-secondary)]">Analysis ID:</span>
                <span className="ml-2 text-[var(--text-primary)]">{report.analysis_results_id}</span>
              </div>
              <div>
                <span className="text-[var(--text-secondary)]">Advertisement ID:</span>
                <span className="ml-2 text-[var(--text-primary)]">{report.advertisement_id}</span>
              </div>
              <div>
                <span className="text-[var(--text-secondary)]">Media ID:</span>
                <span className="ml-2 text-[var(--text-primary)]">{report.media_id}</span>
              </div>
              <div>
                <span className="text-[var(--text-secondary)]">User ID:</span>
                <span className="ml-2 text-[var(--text-primary)]">{report.user_id}</span>
              </div>
            </div>
          </div>

          <div className="bg-[var(--card-bg)] rounded-lg p-4 border border-[var(--border-color)]">
            <h4 className="font-medium text-[var(--text-primary)] mb-2">Timestamps</h4>
            <div className="space-y-1">
              <div>
                <span className="text-[var(--text-secondary)]">Created:</span>
                <span className="ml-2 text-[var(--text-primary)]">
                  {new Date(report.created_at).toLocaleString()}
                </span>
              </div>
              <div>
                <span className="text-[var(--text-secondary)]">Updated:</span>
                <span className="ml-2 text-[var(--text-primary)]">
                  {new Date(report.updated_at).toLocaleString()}
                </span>
              </div>
              {report.report_data?.generated_at && (
                <div>
                  <span className="text-[var(--text-secondary)]">Report Generated:</span>
                  <span className="ml-2 text-[var(--text-primary)]">
                    {new Date(report.report_data.generated_at).toLocaleString()}
                  </span>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Error Information */}
      {(report.report_data?.error || complianceResult.error) && (
        <div className="bg-red-50 rounded-xl p-6 border border-red-200">
          <h3 className="text-lg font-semibold text-red-800 mb-4 flex items-center space-x-2">
            <AlertTriangle className="w-5 h-5" />
            <span>Error Information</span>
          </h3>
          
          {report.report_data?.error && (
            <div className="bg-white rounded-lg p-4 border border-red-200 mb-4">
              <h4 className="font-medium text-red-800 mb-2">Report Generation Error</h4>
              <p className="text-red-700 text-sm">{report.report_data.error}</p>
              <p className="text-red-600 text-xs mt-1">
                Final Reason: {report.report_data.final_reason}
              </p>
            </div>
          )}
          
          {complianceResult.error && (
            <div className="bg-white rounded-lg p-4 border border-red-200">
              <h4 className="font-medium text-red-800 mb-2">Compliance Service Error</h4>
              <p className="text-red-700 text-sm">{complianceResult.message}</p>
              <p className="text-red-600 text-xs mt-1">
                Timestamp: {new Date(complianceResult.timestamp).toLocaleString()}
              </p>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default AdvancedDetailModal;