import React, { useState, useEffect } from "react";
import { useSelector } from "react-redux";
import {
  BarChart3,
  Users,
  FileText,
  TrendingUp,
  Clock,
  CheckCircle,
  XCircle,
  AlertTriangle,
  Calendar,
  Filter,
  Search,
  Download,
  RefreshCw,
  Eye,
  MoreVertical,
  Activity,
  PieChart,
  Target,
  Zap
} from "lucide-react";
import {
  getAdminStats,
  getAdminAds,
  getAdStatusSummary,
  getAdsByStatus
} from "../../../../Services/Repository/DashboardRepo";
import { selectAccount } from "../../../../App/DashboardSlice";

const AdminFeatures = () => {
  const user = useSelector(selectAccount);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [selectedTimeframe, setSelectedTimeframe] = useState("7d");
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  
  // Data states
  const [statsData, setStatsData] = useState(null);
  const [adsData, setAdsData] = useState([]);
  const [filteredAds, setFilteredAds] = useState([]);

  // Fetch data
  const fetchDashboardData = async (showToast = true) => {
    try {
      if (showToast) setLoading(true);
      else setRefreshing(true);

      const [stats, adsResponse] = await Promise.all([
        getAdminStats(),
        getAdminAds()
      ]);

      setStatsData(stats.data);
      // Ensure ads data is properly extracted and is an array
      const adsArray = Array.isArray(adsResponse?.data) ? adsResponse.data : [];
      setAdsData(adsArray);
      setFilteredAds(adsArray);
    } catch (error) {
      console.error("Failed to fetch admin dashboard data:", error);
      // Set empty arrays on error
      setAdsData([]);
      setFilteredAds([]);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchDashboardData();
  }, []);

  // Filter ads based on search and status
  useEffect(() => {
    // Ensure adsData is an array
    if (!Array.isArray(adsData)) {
      setFilteredAds([]);
      return;
    }

    let filtered = [...adsData];

    // Search filter
    if (searchQuery) {
      filtered = filtered.filter(ad =>
        ad?.title?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        ad?.description?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        ad?.users?.name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        ad?.users?.email?.toLowerCase().includes(searchQuery.toLowerCase())
      );
    }

    // Status filter
    if (statusFilter !== "all") {
      const statusFiltered = getAdsByStatus(filtered, statusFilter);
      // Ensure the result is an array
      filtered = Array.isArray(statusFiltered) ? statusFiltered : [];
    }

    setFilteredAds(filtered);
  }, [searchQuery, statusFilter, adsData]);

  const getStatusColor = (verdict) => {
    switch (verdict) {
      case "pass":
        return "text-green-500 bg-green-50 dark:bg-green-900/20";
      case "fail":
        return "text-red-500 bg-red-50 dark:bg-red-900/20";
      case "manual_review":
        return "text-yellow-500 bg-yellow-50 dark:bg-yellow-900/20";
      default:
        return "text-gray-500 bg-gray-50 dark:bg-gray-900/20";
    }
  };

  const getStatusIcon = (verdict) => {
    switch (verdict) {
      case "pass":
        return <CheckCircle className="w-4 h-4" />;
      case "fail":
        return <XCircle className="w-4 h-4" />;
      case "manual_review":
        return <AlertTriangle className="w-4 h-4" />;
      default:
        return <Clock className="w-4 h-4" />;
    }
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit"
    });
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-[var(--bg-primary)] flex items-center justify-center">
        <div className="flex items-center space-x-4">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[var(--accent-color)]"></div>
          <span className="text-[var(--text-primary)] text-lg">Loading admin dashboard...</span>
        </div>
      </div>
    );
  }

  const adStatusSummary = statsData ? {
    total: statsData.overview.total_ads,
    pending: statsData.overview.pending_ads,
    approved: statsData.overview.approved_ads,
    rejected: statsData.overview.rejected_ads
  } : { total: 0, pending: 0, approved: 0, rejected: 0 };

  return (
    <div className="min-h-screen bg-[var(--bg-primary)] p-4 lg:p-6">
      <div className="max-w-7xl mx-auto space-y-8">
        {/* Header */}
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 bg-gradient-to-br from-[var(--accent-color)] to-blue-600 rounded-xl flex items-center justify-center">
              <BarChart3 className="w-6 h-6 text-white" />
            </div>
            <div>
              <h1 className="text-2xl sm:text-3xl lg:text-4xl font-bold text-[var(--text-primary)]">
                Admin Dashboard
              </h1>
              <p className="text-[var(--text-secondary)] text-lg">
                Welcome back, {user?.uname}! Here's your platform overview.
              </p>
            </div>
          </div>
          
          <div className="flex items-center gap-3">
            <select
              value={selectedTimeframe}
              onChange={(e) => setSelectedTimeframe(e.target.value)}
              className="px-4 py-2 bg-[var(--card-bg)] border border-[var(--border-color)] rounded-xl text-[var(--text-primary)] focus:outline-none focus:ring-2 focus:ring-[var(--accent-color)]"
            >
              <option value="7d">Last 7 days</option>
              <option value="30d">Last 30 days</option>
              <option value="90d">Last 90 days</option>
            </select>
            
            <button
              onClick={() => fetchDashboardData(false)}
              disabled={refreshing}
              className="flex items-center gap-2 px-4 py-2 bg-[var(--accent-color)] text-white rounded-xl hover:opacity-80 transition-all disabled:opacity-50"
            >
              <RefreshCw className={`w-4 h-4 ${refreshing ? 'animate-spin' : ''}`} />
              Refresh
            </button>
          </div>
        </div>

        {/* Key Metrics */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <div className="bg-[var(--card-bg)] rounded-2xl p-6 border border-[var(--border-color)] hover:shadow-lg transition-shadow">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-[var(--text-secondary)] text-sm font-medium">Total Ads</p>
                <p className="text-3xl font-bold text-[var(--text-primary)] mt-1">
                  {adStatusSummary.total}
                </p>
                <p className="text-[var(--accent-color)] text-sm mt-2 flex items-center gap-1">
                  <TrendingUp className="w-4 h-4" />
                  <span>+12% from last month</span>
                </p>
              </div>
              <div className="w-12 h-12 bg-[var(--accent-color)]/10 rounded-xl flex items-center justify-center">
                <FileText className="w-6 h-6 text-[var(--accent-color)]" />
              </div>
            </div>
          </div>

          <div className="bg-[var(--card-bg)] rounded-2xl p-6 border border-[var(--border-color)] hover:shadow-lg transition-shadow">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-[var(--text-secondary)] text-sm font-medium">Total Users</p>
                <p className="text-3xl font-bold text-[var(--text-primary)] mt-1">
                  {statsData?.overview.total_users || 0}
                </p>
                <p className="text-green-500 text-sm mt-2 flex items-center gap-1">
                  <TrendingUp className="w-4 h-4" />
                  <span>+8% from last month</span>
                </p>
              </div>
              <div className="w-12 h-12 bg-green-500/10 rounded-xl flex items-center justify-center">
                <Users className="w-6 h-6 text-green-500" />
              </div>
            </div>
          </div>

          <div className="bg-[var(--card-bg)] rounded-2xl p-6 border border-[var(--border-color)] hover:shadow-lg transition-shadow">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-[var(--text-secondary)] text-sm font-medium">Pending Review</p>
                <p className="text-3xl font-bold text-[var(--text-primary)] mt-1">
                  {adStatusSummary.pending}
                </p>
                <p className="text-yellow-500 text-sm mt-2 flex items-center gap-1">
                  <Clock className="w-4 h-4" />
                  <span>Needs attention</span>
                </p>
              </div>
              <div className="w-12 h-12 bg-yellow-500/10 rounded-xl flex items-center justify-center">
                <Clock className="w-6 h-6 text-yellow-500" />
              </div>
            </div>
          </div>

          <div className="bg-[var(--card-bg)] rounded-2xl p-6 border border-[var(--border-color)] hover:shadow-lg transition-shadow">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-[var(--text-secondary)] text-sm font-medium">Approval Rate</p>
                <p className="text-3xl font-bold text-[var(--text-primary)] mt-1">
                  {adStatusSummary.total > 0 
                    ? Math.round((adStatusSummary.approved / adStatusSummary.total) * 100)
                    : 0}%
                </p>
                <p className="text-[var(--accent-color)] text-sm mt-2 flex items-center gap-1">
                  <Target className="w-4 h-4" />
                  <span>Quality metric</span>
                </p>
              </div>
              <div className="w-12 h-12 bg-[var(--accent-color)]/10 rounded-xl flex items-center justify-center">
                <PieChart className="w-6 h-6 text-[var(--accent-color)]" />
              </div>
            </div>
          </div>
        </div>

        {/* Recent Activity & Quick Stats */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Recent Activity */}
          <div className="lg:col-span-2 bg-[var(--card-bg)] rounded-2xl p-6 border border-[var(--border-color)]">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-xl font-semibold text-[var(--text-primary)]">Recent Activity</h2>
              <button className="text-[var(--accent-color)] hover:opacity-80 text-sm font-medium">
                View All
              </button>
            </div>
            
            <div className="space-y-4">
              {statsData?.recent_activity?.slice(0, 5).map((activity) => (
                <div key={activity.advertisement_id} className="flex items-center space-x-4 p-3 rounded-xl bg-[var(--bg-secondary)] border border-[var(--border-color)]">
                  <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${getStatusColor(activity.analysis_results?.[0]?.verdict)}`}>
                    {getStatusIcon(activity.analysis_results?.[0]?.verdict)}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-[var(--text-primary)] font-medium truncate">
                      {activity.title}
                    </p>
                    <p className="text-[var(--text-secondary)] text-sm">
                      by {activity.users.name}
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="text-[var(--text-secondary)] text-sm">
                      {formatDate(activity.created_at)}
                    </p>
                    <span className={`inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(activity.analysis_results?.[0]?.verdict)}`}>
                      {activity.analysis_results?.[0]?.verdict || 'pending'}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Quick Stats */}
          <div className="bg-[var(--card-bg)] rounded-2xl p-6 border border-[var(--border-color)]">
            <h2 className="text-xl font-semibold text-[var(--text-primary)] mb-6">Monthly Overview</h2>
            
            <div className="space-y-4">
              <div className="flex items-center justify-between p-3 rounded-xl bg-[var(--bg-secondary)] border border-[var(--border-color)]">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 bg-green-500/10 rounded-lg flex items-center justify-center">
                    <CheckCircle className="w-4 h-4 text-green-500" />
                  </div>
                  <span className="text-[var(--text-primary)] font-medium">Approved</span>
                </div>
                <span className="text-[var(--text-primary)] font-bold">{adStatusSummary.approved}</span>
              </div>

              <div className="flex items-center justify-between p-3 rounded-xl bg-[var(--bg-secondary)] border border-[var(--border-color)]">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 bg-red-500/10 rounded-lg flex items-center justify-center">
                    <XCircle className="w-4 h-4 text-red-500" />
                  </div>
                  <span className="text-[var(--text-primary)] font-medium">Rejected</span>
                </div>
                <span className="text-[var(--text-primary)] font-bold">{adStatusSummary.rejected}</span>
              </div>

              <div className="flex items-center justify-between p-3 rounded-xl bg-[var(--bg-secondary)] border border-[var(--border-color)]">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 bg-yellow-500/10 rounded-lg flex items-center justify-center">
                    <Clock className="w-4 h-4 text-yellow-500" />
                  </div>
                  <span className="text-[var(--text-primary)] font-medium">Pending</span>
                </div>
                <span className="text-[var(--text-primary)] font-bold">{adStatusSummary.pending}</span>
              </div>

              <div className="mt-4 p-3 rounded-xl bg-gradient-to-r from-[var(--accent-color)]/10 to-blue-500/10 border border-[var(--accent-color)]/20">
                <div className="flex items-center gap-2 mb-2">
                  <Zap className="w-4 h-4 text-[var(--accent-color)]" />
                  <span className="text-[var(--text-primary)] font-medium text-sm">AI Processing</span>
                </div>
                <p className="text-[var(--text-secondary)] text-xs">
                  Average processing time: ~28 seconds
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* All Advertisements */}
        <div className="bg-[var(--card-bg)] rounded-2xl p-6 border border-[var(--border-color)]">
          <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4 mb-6">
            <h2 className="text-xl font-semibold text-[var(--text-primary)]">All Advertisements</h2>
            
            <div className="flex flex-col sm:flex-row gap-4">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-[var(--text-secondary)]" />
                <input
                  type="text"
                  placeholder="Search ads..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-10 pr-4 py-2 bg-[var(--input-bg)] border border-[var(--input-border)] rounded-xl focus:outline-none focus:ring-2 focus:ring-[var(--accent-color)] text-[var(--text-primary)] w-full sm:w-64"
                />
              </div>
              
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="px-4 py-2 bg-[var(--card-bg)] border border-[var(--border-color)] rounded-xl text-[var(--text-primary)] focus:outline-none focus:ring-2 focus:ring-[var(--accent-color)]"
              >
                <option value="all">All Status</option>
                <option value="pending">Pending</option>
                <option value="passed">Approved</option>
                <option value="failed">Rejected</option>
                <option value="manual_review">Manual Review</option>
              </select>
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-[var(--border-color)]">
                  <th className="text-left py-3 px-4 text-[var(--text-secondary)] font-medium">Ad Details</th>
                  <th className="text-left py-3 px-4 text-[var(--text-secondary)] font-medium">Advertiser</th>
                  <th className="text-left py-3 px-4 text-[var(--text-secondary)] font-medium">Status</th>
                  <th className="text-left py-3 px-4 text-[var(--text-secondary)] font-medium">Created</th>
                  <th className="text-right py-3 px-4 text-[var(--text-secondary)] font-medium">Actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredAds.map((ad) => (
                  <tr key={ad.advertisement_id} className="border-b border-[var(--border-color)] hover:bg-[var(--bg-secondary)] transition-colors">
                    <td className="py-4 px-4">
                      <div>
                        <p className="font-medium text-[var(--text-primary)]">{ad.title}</p>
                        <p className="text-[var(--text-secondary)] text-sm truncate max-w-xs">
                          {ad.description}
                        </p>
                      </div>
                    </td>
                    <td className="py-4 px-4">
                      <div>
                        <p className="font-medium text-[var(--text-primary)]">{ad.users.name}</p>
                        <p className="text-[var(--text-secondary)] text-sm">{ad.users.email}</p>
                      </div>
                    </td>
                    <td className="py-4 px-4">
                      <span className={`inline-flex items-center gap-2 px-3 py-1 rounded-full text-sm font-medium ${getStatusColor(ad.analysis_results?.[0]?.verdict)}`}>
                        {getStatusIcon(ad.analysis_results?.[0]?.verdict)}
                        {ad.analysis_results?.[0]?.verdict || 'pending'}
                      </span>
                    </td>
                    <td className="py-4 px-4 text-[var(--text-secondary)] text-sm">
                      {formatDate(ad.created_at)}
                    </td>
                    <td className="py-4 px-4 text-right">
                      <div className="flex items-center justify-end gap-2">
                        <button className="p-2 text-[var(--text-secondary)] hover:text-[var(--accent-color)] hover:bg-[var(--highlight-color)] rounded-lg transition-colors">
                          <Eye className="w-4 h-4" />
                        </button>
                        <button className="p-2 text-[var(--text-secondary)] hover:text-[var(--accent-color)] hover:bg-[var(--highlight-color)] rounded-lg transition-colors">
                          <MoreVertical className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {filteredAds.length === 0 && (
            <div className="text-center py-12">
              <div className="w-16 h-16 bg-[var(--accent-color)]/10 rounded-full flex items-center justify-center mx-auto mb-4">
                <FileText className="w-8 h-8 text-[var(--accent-color)]" />
              </div>
              <p className="text-[var(--text-primary)] font-medium mb-2">No advertisements found</p>
              <p className="text-[var(--text-secondary)] text-sm">
                {searchQuery || statusFilter !== "all" 
                  ? "Try adjusting your search or filter criteria" 
                  : "No advertisements have been submitted yet"
                }
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default AdminFeatures;