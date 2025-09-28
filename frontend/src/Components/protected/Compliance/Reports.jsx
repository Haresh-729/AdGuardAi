import React, { useState, useEffect } from 'react';
import { useSelector } from 'react-redux';
import {
  FileText,
  Filter,
  Search,
  Calendar,
  CheckCircle,
  XCircle,
  AlertTriangle,
  Eye,
  Download,
  RefreshCw,
  Clock,
  User,
  ChevronDown,
  ChevronUp,
  Play,
  Image as ImageIcon,
  Link,
  Volume2,
  Shield,
  Zap,
  FileX,
  CheckCircle2,
  AlertCircle,
} from 'lucide-react';
import { selectAccount } from '../../../App/DashboardSlice';
import {
  getUserReports,
  getAllReports,
  approveAdvertisement,
  rejectAdvertisement,
} from '../../../Services/Repository/ComplianceRepo';
import { 
  formatComplianceData, 
  getStatusIcon, 
  getStatusColor, 
  getRiskLevel,
  MediaPreview,
  ViolationCard,
  ComplianceSummary,
  MediaAnalysisResults,
  ProcessingTimeline
} from './utils/ReportHelper';

const Reports = () => {
  const user = useSelector(selectAccount);
  const isAdmin = user?.role === 'admin';

  // State management
  const [reports, setReports] = useState([]);
  const [filteredReports, setFilteredReports] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedReport, setSelectedReport] = useState(null);
  const [showDetailModal, setShowDetailModal] = useState(false);
  
  // Filter states
  const [filters, setFilters] = useState({
    status: 'all',
    verdict: 'all',
    dateRange: 'all',
    searchTerm: '',
  });
  
  const [sortConfig, setSortConfig] = useState({
    key: 'created_at',
    direction: 'desc',
  });

  // Admin actions state
  const [adminAction, setAdminAction] = useState({
    type: null, // 'approve' or 'reject'
    reportId: null,
    reason: '',
    loading: false,
  });

  // Fetch reports on component mount
  useEffect(() => {
    fetchReports();
  }, [isAdmin]);

  // Apply filters and sorting
  useEffect(() => {
    applyFiltersAndSort();
  }, [reports, filters, sortConfig]);

  const fetchReports = async () => {
    setLoading(true);
    try {
      const data = isAdmin ? await getAllReports() : await getUserReports();
      setReports(data.reports || []);
    } catch (error) {
      console.error('Failed to fetch reports:', error);
      setReports([]);
    } finally {
      setLoading(false);
    }
  };

  const applyFiltersAndSort = () => {
    let filtered = [...reports];

    // Apply status filter
    if (filters.status !== 'all') {
      filtered = filtered.filter(report => {
        const status = report.compliance_result?.compliance_results?.verdict || 'unknown';
        return status === filters.status;
      });
    }

    // Apply verdict filter
    if (filters.verdict !== 'all') {
      filtered = filtered.filter(report => {
        return report.admin_verdict === filters.verdict || 
               (!report.admin_verdict && filters.verdict === 'pending');
      });
    }

    // Apply search filter
    if (filters.searchTerm) {
      const searchLower = filters.searchTerm.toLowerCase();
      filtered = filtered.filter(report =>
        report.advertisement?.title?.toLowerCase().includes(searchLower) ||
        report.advertisement?.description?.toLowerCase().includes(searchLower)
      );
    }

    // Apply date filter
    if (filters.dateRange !== 'all') {
      const now = new Date();
      const filterDate = new Date();
      
      switch (filters.dateRange) {
        case 'today':
          filterDate.setHours(0, 0, 0, 0);
          break;
        case 'week':
          filterDate.setDate(now.getDate() - 7);
          break;
        case 'month':
          filterDate.setMonth(now.getMonth() - 1);
          break;
        default:
          break;
      }
      
      filtered = filtered.filter(report => 
        new Date(report.created_at) >= filterDate
      );
    }

    // Apply sorting
    filtered.sort((a, b) => {
      let aValue = a[sortConfig.key];
      let bValue = b[sortConfig.key];

      if (sortConfig.key === 'created_at') {
        aValue = new Date(aValue);
        bValue = new Date(bValue);
      }

      if (aValue < bValue) return sortConfig.direction === 'asc' ? -1 : 1;
      if (aValue > bValue) return sortConfig.direction === 'asc' ? 1 : -1;
      return 0;
    });

    setFilteredReports(filtered);
  };

  const handleSort = (key) => {
    setSortConfig({
      key,
      direction: sortConfig.key === key && sortConfig.direction === 'asc' ? 'desc' : 'asc',
    });
  };

  const handleAdminAction = async (action, reportId) => {
    setAdminAction({ type: action, reportId, reason: '', loading: false });
  };

  const submitAdminAction = async () => {
    setAdminAction(prev => ({ ...prev, loading: true }));
    
    try {
      if (adminAction.type === 'approve') {
        await approveAdvertisement(adminAction.reportId, adminAction.reason);
      } else {
        await rejectAdvertisement(adminAction.reportId, adminAction.reason);
      }
      
      // Refresh reports after action
      await fetchReports();
      setAdminAction({ type: null, reportId: null, reason: '', loading: false });
    } catch (error) {
      console.error('Admin action failed:', error);
      setAdminAction(prev => ({ ...prev, loading: false }));
    }
  };

  const openDetailModal = (report) => {
    setSelectedReport(report);
    setShowDetailModal(true);
  };

  const statusOptions = [
    { value: 'all', label: 'All Status' },
    { value: 'pass', label: 'Passed' },
    { value: 'fail', label: 'Failed' },
    { value: 'manual_review', label: 'Manual Review' },
    { value: 'clarification_needed', label: 'Clarification Needed' },
  ];

  const verdictOptions = [
    { value: 'all', label: 'All Verdicts' },
    { value: 'pending', label: 'Pending Review' },
    { value: 'approved', label: 'Approved' },
    { value: 'rejected', label: 'Rejected' },
  ];

  const dateOptions = [
    { value: 'all', label: 'All Time' },
    { value: 'today', label: 'Today' },
    { value: 'week', label: 'Last 7 Days' },
    { value: 'month', label: 'Last 30 Days' },
  ];

  if (loading) {
    return (
      <div className="min-h-screen bg-[var(--bg-primary)] flex items-center justify-center">
        <div className="flex items-center space-x-3">
          <RefreshCw className="w-6 h-6 animate-spin text-[var(--accent-color)]" />
          <span className="text-[var(--text-primary)] text-lg">Loading reports...</span>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[var(--bg-primary)] p-6">
      <div className="max-w-8xl mx-auto space-y-6">
        {/* Header */}
        <div className=" bg-[var(--card-bg)] rounded-2xl p-6 border border-[var(--border-color)]">
          <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between space-y-4 lg:space-y-0">
            <div className="flex items-center space-x-4">
              <div className="w-12 h-12 bg-gradient-to-r from-[var(--accent-color)] to-blue-600 rounded-xl flex items-center justify-center">
                <FileText className="w-6 h-6 text-white" />
              </div>
              <div>
                <h1 className="text-2xl font-bold text-[var(--text-primary)]">
                  {isAdmin ? 'All Compliance Reports' : 'My Reports'}
                </h1>
                <p className="text-[var(--text-secondary)]">
                  {isAdmin 
                    ? 'Manage and review all advertisement compliance reports'
                    : 'View your advertisement compliance reports and status'
                  }
                </p>
              </div>
            </div>
            
            <div className="flex items-center space-x-3">
              <button
                onClick={fetchReports}
                className="flex items-center space-x-2 px-4 py-2 bg-[var(--accent-color)] text-white rounded-lg hover:bg-[var(--button-hover)] transition-all"
              >
                <RefreshCw className="w-4 h-4" />
                <span>Refresh</span>
              </button>
            </div>
          </div>
        </div>

        {/* Filters */}
        <div className="sticky top-20 bg-[var(--card-bg)] rounded-2xl p-6 border border-[var(--border-color)]">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {/* Search */}
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-[var(--text-secondary)]" />
              <input
                type="text"
                placeholder="Search by title or description..."
                value={filters.searchTerm}
                onChange={(e) => setFilters(prev => ({ ...prev, searchTerm: e.target.value }))}
                className="w-full pl-10 pr-4 py-2 bg-[var(--input-bg)] border border-[var(--input-border)] rounded-lg focus:outline-none focus:ring-2 focus:ring-[var(--accent-color)] text-[var(--text-primary)]"
              />
            </div>

            {/* Status Filter */}
            <select
              value={filters.status}
              onChange={(e) => setFilters(prev => ({ ...prev, status: e.target.value }))}
              className="px-4 py-2 bg-[var(--input-bg)] border border-[var(--input-border)] rounded-lg focus:outline-none focus:ring-2 focus:ring-[var(--accent-color)] text-[var(--text-primary)]"
            >
              {statusOptions.map(option => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>

            {/* Verdict Filter (Admin only) */}
            {isAdmin && (
              <select
                value={filters.verdict}
                onChange={(e) => setFilters(prev => ({ ...prev, verdict: e.target.value }))}
                className="px-4 py-2 bg-[var(--input-bg)] border border-[var(--input-border)] rounded-lg focus:outline-none focus:ring-2 focus:ring-[var(--accent-color)] text-[var(--text-primary)]"
              >
                {verdictOptions.map(option => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
            )}

            {/* Date Filter */}
            <select
              value={filters.dateRange}
              onChange={(e) => setFilters(prev => ({ ...prev, dateRange: e.target.value }))}
              className="px-4 py-2 bg-[var(--input-bg)] border border-[var(--input-border)] rounded-lg focus:outline-none focus:ring-2 focus:ring-[var(--accent-color)] text-[var(--text-primary)]"
            >
              {dateOptions.map(option => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Reports Table */}
        <div className="bg-[var(--card-bg)] rounded-2xl border border-[var(--border-color)] overflow-hidden">
          <div className="p-6 border-b border-[var(--border-color)]">
            <h2 className="text-lg font-semibold text-[var(--text-primary)]">
              Reports ({filteredReports.length})
            </h2>
          </div>

          {filteredReports.length === 0 ? (
            <div className="p-12 text-center">
              <FileX className="w-16 h-16 text-[var(--text-secondary)] mx-auto mb-4" />
              <h3 className="text-lg font-medium text-[var(--text-primary)] mb-2">
                No reports found
              </h3>
              <p className="text-[var(--text-secondary)]">
                Try adjusting your filters or create a new advertisement.
              </p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-[var(--bg-secondary)]">
                  <tr>
                    <th 
                      className="px-6 py-4 text-left text-sm font-medium text-[var(--text-secondary)] cursor-pointer hover:text-[var(--text-primary)]"
                      onClick={() => handleSort('advertisement.title')}
                    >
                      <div className="flex items-center space-x-1">
                        <span>Advertisement</span>
                        {sortConfig.key === 'advertisement.title' && (
                          sortConfig.direction === 'asc' ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />
                        )}
                      </div>
                    </th>
                    <th className="px-6 py-4 text-left text-sm font-medium text-[var(--text-secondary)]">
                      AI Status
                    </th>
                    <th className="px-6 py-4 text-left text-sm font-medium text-[var(--text-secondary)]">
                      Risk Score
                    </th>
                    {isAdmin && (
                      <th className="px-6 py-4 text-left text-sm font-medium text-[var(--text-secondary)]">
                        Admin Verdict
                      </th>
                    )}
                    <th 
                      className="px-6 py-4 text-left text-sm font-medium text-[var(--text-secondary)] cursor-pointer hover:text-[var(--text-primary)]"
                      onClick={() => handleSort('created_at')}
                    >
                      <div className="flex items-center space-x-1">
                        <span>Created</span>
                        {sortConfig.key === 'created_at' && (
                          sortConfig.direction === 'asc' ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />
                        )}
                      </div>
                    </th>
                    <th className="px-6 py-4 text-left text-sm font-medium text-[var(--text-secondary)]">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[var(--border-color)]">
                  {filteredReports.map((report) => {
                    const formattedData = formatComplianceData(report);
                    const statusColor = getStatusColor(formattedData.status);
                    const StatusIcon = getStatusIcon(formattedData.status);
                    const riskLevel = getRiskLevel(formattedData.riskScore);

                    return (
                      <tr 
                        key={report.analysis_results_id}
                        className="select-none hover:bg-[var(--highlight-color)]/10 transition-colors"
                      >
                        <td className="px-6 py-4">
                          <div className="flex items-start space-x-3">
                            <div className="flex-1">
                              <h3 className="text-sm font-medium text-[var(--text-primary)]">
                                {report.advertisement?.title || 'Untitled Advertisement'}
                              </h3>
                              <p className="text-xs text-[var(--text-secondary)] mt-1 line-clamp-2">
                                {report.advertisement?.description}
                              </p>
                              <div className="flex items-center space-x-2 mt-2">
                                {formattedData.mediaTypes.map((type, index) => {
                                  const IconComponent = type === 'image' ? ImageIcon : 
                                                     type === 'video' ? Play :
                                                     type === 'text' ? FileText :
                                                     type === 'audio' ? Volume2 : Link;
                                  return (
                                    <div key={index} className="flex items-center space-x-1">
                                      <IconComponent className="w-3 h-3 text-[var(--accent-color)]" />
                                      <span className="text-xs text-[var(--text-secondary)] capitalize">{type}</span>
                                    </div>
                                  );
                                })}
                              </div>
                            </div>
                          </div>
                        </td>
                        <td className="px-6 py-4">
                          <div className="flex items-center space-x-2">
                            <StatusIcon className={`w-4 h-4 ${statusColor}`} />
                            <span className={`text-sm font-medium capitalize ${statusColor}`}>
                              {formattedData.status.replace('_', ' ')}
                            </span>
                          </div>
                        </td>
                        <td className="px-6 py-4">
                          <div className="flex items-center space-x-2">
                            <div className={`w-2 h-2 rounded-full ${
                              riskLevel === 'low' ? 'bg-green-500' :
                              riskLevel === 'medium' ? 'bg-yellow-500' : 'bg-red-500'
                            }`}></div>
                            <span className="text-sm text-[var(--text-primary)]">
                              {formattedData.riskScore}/1.0
                            </span>
                            <span className={`text-xs px-2 py-1 rounded-full ${
                              riskLevel === 'low' ? 'bg-green-100 text-green-800' :
                              riskLevel === 'medium' ? 'bg-yellow-100 text-yellow-800' :
                              'bg-red-100 text-red-800'
                            }`}>
                              {riskLevel}
                            </span>
                          </div>
                        </td>
                        {isAdmin && (
                          <td className="px-6 py-4">
                            {report.admin_verdict ? (
                              <div className="flex items-center space-x-2">
                                {report.admin_verdict === 'approved' ? (
                                  <CheckCircle2 className="w-4 h-4 text-green-500" />
                                ) : (
                                  <XCircle className="w-4 h-4 text-red-500" />
                                )}
                                <span className={`text-sm font-medium capitalize ${
                                  report.admin_verdict === 'approved' ? 'text-green-600' : 'text-red-600'
                                }`}>
                                  {report.admin_verdict}
                                </span>
                              </div>
                            ) : (
                              <div className="flex items-center space-x-2">
                                <Clock className="w-4 h-4 text-[var(--text-secondary)]" />
                                <span className="text-sm text-[var(--text-secondary)]">Pending</span>
                              </div>
                            )}
                          </td>
                        )}
                        <td className="px-6 py-4">
                          <span className="text-sm text-[var(--text-secondary)]">
                            {new Date(report.created_at).toLocaleDateString()}
                          </span>
                        </td>
                        <td className="px-6 py-4">
                          <div className="flex items-center space-x-2">
                            <button
                              onClick={() => openDetailModal(report)}
                              className="flex items-center space-x-1 px-3 py-1 bg-[var(--accent-color)] text-white rounded-md hover:bg-[var(--button-hover)] transition-all text-sm"
                            >
                              <Eye className="w-3 h-3" />
                              <span>View</span>
                            </button>
                            
                            {isAdmin && !report.admin_verdict && (
                              <>
                                <button
                                  onClick={() => handleAdminAction('approve', report.analysis_results_id)}
                                  className="flex items-center space-x-1 px-3 py-1 bg-green-600 text-white rounded-md hover:bg-green-700 transition-all text-sm"
                                >
                                  <CheckCircle className="w-3 h-3" />
                                  <span>Approve</span>
                                </button>
                                <button
                                  onClick={() => handleAdminAction('reject', report.analysis_results_id)}
                                  className="flex items-center space-x-1 px-3 py-1 bg-red-600 text-white rounded-md hover:bg-red-700 transition-all text-sm"
                                >
                                  <XCircle className="w-3 h-3" />
                                  <span>Reject</span>
                                </button>
                              </>
                            )}
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* Detail Modal */}
        {showDetailModal && selectedReport && (
          <DetailModal 
            report={selectedReport}
            isAdmin={isAdmin}
            onClose={() => setShowDetailModal(false)}
            onAdminAction={handleAdminAction}
          />
        )}

        {/* Admin Action Modal */}
        {adminAction.type && (
          <AdminActionModal
            action={adminAction}
            onSubmit={submitAdminAction}
            onCancel={() => setAdminAction({ type: null, reportId: null, reason: '', loading: false })}
            onChange={(reason) => setAdminAction(prev => ({ ...prev, reason }))}
          />
        )}
      </div>
    </div>
  );
};

// Detail Modal Component
const DetailModal = ({ report, isAdmin, onClose, onAdminAction }) => {
  const formattedData = formatComplianceData(report);

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-[var(--card-bg)] rounded-2xl max-w-6xl w-full max-h-[90vh] overflow-hidden border border-[var(--border-color)]">
        <div className="flex items-center justify-between p-6 border-b border-[var(--border-color)]">
          <h2 className="text-xl font-bold text-[var(--text-primary)]">
            Compliance Report Details
          </h2>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-lg hover:bg-[var(--highlight-color)] flex items-center justify-center transition-colors"
          >
            <XCircle className="w-5 h-5 text-[var(--text-secondary)]" />
          </button>
        </div>
        
        <div className="p-6 overflow-y-auto max-h-[calc(90vh-100px)]">
          <ReportDetailContent report={report} formattedData={formattedData} isAdmin={isAdmin} onAdminAction={onAdminAction} />
        </div>
      </div>
    </div>
  );
};

// Report Detail Content Component
const ReportDetailContent = ({ report, formattedData, isAdmin, onAdminAction }) => {
  const complianceResult = report.compliance_result?.compliance_results;

  return (
    <div className="space-y-6">
      {/* Basic Information */}
      <div className="bg-[var(--bg-secondary)] rounded-xl p-6">
        <h3 className="text-lg font-semibold text-[var(--text-primary)] mb-4">Advertisement Information</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="text-sm font-medium text-[var(--text-secondary)]">Title</label>
            <p className="text-[var(--text-primary)] mt-1">{report.advertisement?.title || 'Untitled'}</p>
          </div>
          <div>
            <label className="text-sm font-medium text-[var(--text-secondary)]">Created</label>
            <p className="text-[var(--text-primary)] mt-1">{new Date(report.created_at).toLocaleString()}</p>
          </div>
          <div className="md:col-span-2">
            <label className="text-sm font-medium text-[var(--text-secondary)]">Description</label>
            <p className="text-[var(--text-primary)] mt-1">{report.advertisement?.description || 'No description'}</p>
          </div>
        </div>
      </div>

      {/* Compliance Summary */}
      <ComplianceSummary formattedData={formattedData} />

      {/* Media Assets */}
      {formattedData.mediaTypes.length > 0 && (
        <div className="bg-[var(--bg-secondary)] rounded-xl p-6">
          <h3 className="text-lg font-semibold text-[var(--text-primary)] mb-4">Media Assets</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {/* Render Images */}
            {complianceResult?.image_op?.results?.map((result, index) => (
              <div key={`image-${index}`} className="space-y-2">
                <MediaPreview type="image" url={result.source_url} />
                <div className="text-xs text-[var(--text-secondary)]">
                  <p>Image {index + 1}</p>
                  {result.image_compliance?.extracted_text && (
                    <p className="mt-1">Text: "{result.image_compliance.extracted_text}"</p>
                  )}
                </div>
              </div>
            ))}

            {/* Render Videos */}
            {complianceResult?.video_op?.results?.map((result, index) => (
              <div key={`video-${index}`} className="space-y-2">
                <MediaPreview type="video" url={result.source_url} />
                <div className="text-xs text-[var(--text-secondary)]">
                  <p>Video {index + 1}</p>
                  {result.video_metadata && (
                    <p className="mt-1">
                      Duration: {Math.round(result.video_metadata.duration_seconds)}s |
                      {result.video_metadata.width}x{result.video_metadata.height}
                    </p>
                  )}
                </div>
              </div>
            ))}

            {/* Render Landing Page */}
            {complianceResult?.link_op && (
              <div className="space-y-2">
                <MediaPreview type="link" url={complianceResult.link_op.url} />
                <div className="text-xs text-[var(--text-secondary)]">
                  <p>Landing Page</p>
                  <p className="mt-1">Domain: {complianceResult.link_op.domain}</p>
                </div>
              </div>
            )}

            {/* Render Text Content */}
            {complianceResult?.text_op && (
              <div className="col-span-full">
                <div className="bg-[var(--card-bg)] rounded-lg p-4 border border-[var(--border-color)]">
                  <div className="flex items-center space-x-2 mb-2">
                    <FileText className="w-4 h-4 text-[var(--accent-color)]" />
                    <span className="text-sm font-medium text-[var(--text-primary)]">Text Content</span>
                  </div>
                  <p className="text-sm text-[var(--text-primary)]">
                    {complianceResult.text_op.processed_content || report.advertisement?.description}
                  </p>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Detailed Compliance Analysis */}
      <div className="bg-[var(--bg-secondary)] rounded-xl p-6">
        <h3 className="text-lg font-semibold text-[var(--text-primary)] mb-4">Compliance Analysis</h3>
        <MediaAnalysisResults complianceResult={complianceResult} />
      </div>

      {/* Violations */}
      {formattedData.violations.length > 0 && (
        <div className="bg-[var(--bg-secondary)] rounded-xl p-6">
          <h3 className="text-lg font-semibold text-[var(--text-primary)] mb-4">
            Violations Found ({formattedData.violations.length})
          </h3>
          <div className="space-y-4">
            {formattedData.violations.map((violation, index) => (
              <ViolationCard key={index} violation={violation} index={index} />
            ))}
          </div>
        </div>
      )}

      {/* Clarification Questions */}
      {complianceResult?.compliance_results?.queries_for_call && (
        <div className="bg-[var(--bg-secondary)] rounded-xl p-6">
          <h3 className="text-lg font-semibold text-[var(--text-primary)] mb-4">
            Clarification Questions
          </h3>
          <div className="space-y-4">
            {complianceResult.compliance_results.queries_for_call.map((query, index) => (
              <div key={index} className="bg-[var(--card-bg)] rounded-lg p-4 border border-[var(--border-color)]">
                <h4 className="text-sm font-medium text-[var(--text-primary)] mb-2">
                  Question {index + 1}
                </h4>
                <p className="text-sm text-[var(--text-primary)] mb-2">{query.question}</p>
                <p className="text-xs text-[var(--text-secondary)]">
                  Reason: {query.reason}
                </p>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Processing Timeline */}
      {report.execution_time && (
        <ProcessingTimeline executionTime={report.execution_time} />
      )}

      {/* Admin Actions */}
      {isAdmin && !report.admin_verdict && (
        <div className="bg-[var(--bg-secondary)] rounded-xl p-6">
          <h3 className="text-lg font-semibold text-[var(--text-primary)] mb-4">Admin Actions</h3>
          <div className="flex items-center space-x-4">
            <button
              onClick={() => onAdminAction('approve', report.analysis_results_id)}
              className="flex items-center space-x-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-all"
            >
              <CheckCircle className="w-4 h-4" />
              <span>Approve Advertisement</span>
            </button>
            <button
              onClick={() => onAdminAction('reject', report.analysis_results_id)}
              className="flex items-center space-x-2 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-all"
            >
              <XCircle className="w-4 h-4" />
              <span>Reject Advertisement</span>
            </button>
          </div>
        </div>
      )}

      {/* Raw Report Data (For Debugging - Admin Only) */}
      {isAdmin && (
        <div className="bg-[var(--bg-secondary)] rounded-xl p-6">
          <details className="cursor-pointer">
            <summary className="text-lg font-semibold text-[var(--text-primary)] mb-4">
              Raw Report Data (Debug)
            </summary>
            <div className="mt-4 bg-[var(--card-bg)] rounded-lg p-4 border border-[var(--border-color)]">
              <pre className="text-xs text-[var(--text-primary)] overflow-auto max-h-96">
                {JSON.stringify(report, null, 2)}
              </pre>
            </div>
          </details>
        </div>
      )}
    </div>
  );
};

// Admin Action Modal Component
const AdminActionModal = ({ action, onSubmit, onCancel, onChange }) => {
  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-[var(--card-bg)] rounded-2xl max-w-md w-full border border-[var(--border-color)]">
        <div className="p-6">
          <h3 className="text-lg font-bold text-[var(--text-primary)] mb-4">
            {action.type === 'approve' ? 'Approve Advertisement' : 'Reject Advertisement'}
          </h3>
          
          <textarea
            value={action.reason}
            onChange={(e) => onChange(e.target.value)}
            placeholder={`Enter reason for ${action.type}ing this advertisement (optional)`}
            className="w-full p-3 bg-[var(--input-bg)] border border-[var(--input-border)] rounded-lg focus:outline-none focus:ring-2 focus:ring-[var(--accent-color)] text-[var(--text-primary)] resize-none"
            rows={4}
          />
          
          <div className="flex items-center space-x-3 mt-6">
            <button
              onClick={onSubmit}
              disabled={action.loading}
              className={`flex items-center space-x-2 px-4 py-2 rounded-lg text-white transition-all ${
                action.type === 'approve' 
                  ? 'bg-green-600 hover:bg-green-700' 
                  : 'bg-red-600 hover:bg-red-700'
              } ${action.loading ? 'opacity-50 cursor-not-allowed' : ''}`}
            >
              {action.loading ? (
                <RefreshCw className="w-4 h-4 animate-spin" />
              ) : action.type === 'approve' ? (
                <CheckCircle className="w-4 h-4" />
              ) : (
                <XCircle className="w-4 h-4" />
              )}
              <span>{action.loading ? 'Processing...' : `${action.type === 'approve' ? 'Approve' : 'Reject'}`}</span>
            </button>
            
            <button
              onClick={onCancel}
              disabled={action.loading}
              className="px-4 py-2 bg-[var(--bg-secondary)] text-[var(--text-primary)] rounded-lg hover:bg-[var(--highlight-color)] transition-all"
            >
              Cancel
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Reports;