import React, { useState, useEffect } from "react";
import { useSelector } from "react-redux";
import {
  BarChart3,
  Plus,
  FileText,
  Clock,
  CheckCircle,
  XCircle,
  AlertTriangle,
  Bell,
  TrendingUp,
  Eye,
  MoreVertical,
  Filter,
  Search,
  Zap,
  Upload,
  Target,
  Activity,
  Calendar,
  BellDot,
  ExternalLink
} from "lucide-react";
import { selectAccount } from "../../../../App/DashboardSlice";
import {
  getUserOverview,
  getUserAds,
  getUserNotifications,
  markNotificationAsRead,
  getUnreadNotificationCount,
  getAdStatusSummary
} from "../../../../Services/Repository/DashboardRepo";

const UserFeatures = () => {
  const user = useSelector(selectAccount);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [showNotifications, setShowNotifications] = useState(false);
  
  // Data states
  const [overviewData, setOverviewData] = useState(null);
  const [adsData, setAdsData] = useState([]);
  const [notifications, setNotifications] = useState([]);
  const [filteredAds, setFilteredAds] = useState([]);
  const unreadNotifications = Array.isArray(notifications) ? notifications.some(n => !n.is_read) : false;

  // Fetch data
  const fetchDashboardData = async (showToast = true) => {
    try {
      if (showToast) setLoading(true);
      else setRefreshing(true);

      const [overview, adsResponse, notifsResponse] = await Promise.all([
        getUserOverview(),
        getUserAds(),
        getUserNotifications()
      ]);

      setOverviewData(overview.data);
      const adsArray = Array.isArray(adsResponse?.data) ? adsResponse.data : [];
      const notificationsArray = Array.isArray(notifsResponse?.data) ? notifsResponse.data : [];
      setAdsData(adsArray);
      setNotifications(notificationsArray);
      setFilteredAds(adsArray);
    } catch (error) {
      console.error("Failed to fetch dashboard data:", error);
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
    let filtered = [...adsData];

    // Search filter
    if (searchQuery) {
      filtered = filtered.filter(ad =>
        ad.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        ad.description.toLowerCase().includes(searchQuery.toLowerCase())
      );
    }

    // Status filter
    if (statusFilter !== "all") {
      filtered = filtered.filter(ad => {
        const verdict = ad.analysis_results?.[0]?.verdict;
        switch (statusFilter) {
          case "pending":
            return verdict === null || verdict === undefined;
          case "passed":
            return verdict === "pass";
          case "failed":
            return verdict === "fail";
          case "manual_review":
            return verdict === "manual_review";
          default:
            return true;
        }
      });
    }

    setFilteredAds(filtered);
  }, [searchQuery, statusFilter, adsData]);

  const handleNotificationClick = async (notification) => {
    if (!notification.is_read) {
      try {
        await markNotificationAsRead(notification.notification_id);
        setNotifications(prev => 
          prev.map(n => 
            n.notification_id === notification.notification_id 
              ? { ...n, is_read: true }
              : n
          )
        );
      } catch (error) {
        console.error("Failed to mark notification as read:", error);
      }
    }
  };

  const getStatusColor = (verdict) => {
    switch (verdict) {
      case "pass":
        return "text-green-500 bg-green-50 dark:bg-green-900/20";
      case "fail":
        return "text-red-500 bg-red-50 dark:bg-red-900/20";
      case "manual_review":
        return "text-yellow-500 bg-yellow-50 dark:bg-yellow-900/20";
      default:
        return "text-blue-500 bg-blue-50 dark:bg-blue-900/20";
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

  const getNotificationIcon = (type) => {
    switch (type) {
      case "report_ready":
        return <FileText className="w-4 h-4" />;
      case "processing_completed":
        return <CheckCircle className="w-4 h-4" />;
      case "ad_flagged":
        return <AlertTriangle className="w-4 h-4" />;
      default:
        return <Bell className="w-4 h-4" />;
    }
  };

  return (
    <div className="p-6 space-y-6">
      {/* Overview Section */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="p-4 bg-white dark:bg-gray-800 rounded-lg shadow">
          <div className="flex items-center space-x-3">
            <div className="p-2 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
              <Upload className="w-5 h-5 text-blue-500" />
            </div>
            <div>
              <p className="text-sm text-gray-500 dark:text-gray-400">Total Uploads</p>
              <h3 className="text-2xl font-semibold">{overviewData?.total_uploads || 0}</h3>
            </div>
          </div>
        </div>

        <div className="p-4 bg-white dark:bg-gray-800 rounded-lg shadow">
          <div className="flex items-center space-x-3">
            <div className="p-2 bg-green-50 dark:bg-green-900/20 rounded-lg">
              <CheckCircle className="w-5 h-5 text-green-500" />
            </div>
            <div>
              <p className="text-sm text-gray-500 dark:text-gray-400">Passed</p>
              <h3 className="text-2xl font-semibold">{overviewData?.passed_count || 0}</h3>
            </div>
          </div>
        </div>

        <div className="p-4 bg-white dark:bg-gray-800 rounded-lg shadow">
          <div className="flex items-center space-x-3">
            <div className="p-2 bg-red-50 dark:bg-red-900/20 rounded-lg">
              <XCircle className="w-5 h-5 text-red-500" />
            </div>
            <div>
              <p className="text-sm text-gray-500 dark:text-gray-400">Failed</p>
              <h3 className="text-2xl font-semibold">{overviewData?.failed_count || 0}</h3>
            </div>
          </div>
        </div>

        <div className="p-4 bg-white dark:bg-gray-800 rounded-lg shadow">
          <div className="flex items-center space-x-3">
            <div className="p-2 bg-yellow-50 dark:bg-yellow-900/20 rounded-lg">
              <AlertTriangle className="w-5 h-5 text-yellow-500" />
            </div>
            <div>
              <p className="text-sm text-gray-500 dark:text-gray-400">Manual Review</p>
              <h3 className="text-2xl font-semibold">{overviewData?.manual_review_count || 0}</h3>
            </div>
          </div>
        </div>
      </div>

      {/* Filters and Search */}
      <div className="flex flex-col sm:flex-row justify-between items-center space-y-4 sm:space-y-0 sm:space-x-4">
        <div className="flex items-center space-x-4 w-full sm:w-auto">
          <div className="relative flex-1 sm:flex-none">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
            <input
              type="text"
              placeholder="Search ads..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10 pr-4 py-2 w-full sm:w-64 rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
          <div className="relative">
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="pl-4 pr-10 py-2 rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="all">All Status</option>
              <option value="pending">Pending</option>
              <option value="passed">Passed</option>
              <option value="failed">Failed</option>
              <option value="manual_review">Manual Review</option>
            </select>
            <Filter className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
          </div>
        </div>
        
        <div className="flex items-center space-x-4">
          <button
            onClick={() => fetchDashboardData(false)}
            className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700"
          >
            <Zap className="w-5 h-5 text-gray-500" />
          </button>
          <div className="relative">
            <button
              onClick={() => setShowNotifications(!showNotifications)}
              className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700"
            >
              {unreadNotifications ? (
                <BellDot className="w-5 h-5 text-blue-500" />
              ) : (
                <Bell className="w-5 h-5 text-gray-500" />
              )}
            </button>
            {showNotifications && (
              <div className="absolute right-0 mt-2 w-80 bg-white dark:bg-gray-800 rounded-lg shadow-lg border border-gray-200 dark:border-gray-700 z-50">
                <div className="p-4 border-b border-gray-200 dark:border-gray-700">
                  <h3 className="text-lg font-semibold">Notifications</h3>
                </div>
                <div className="max-h-96 overflow-y-auto">
                  {notifications.length === 0 ? (
                    <p className="p-4 text-gray-500 text-center">No notifications</p>
                  ) : (
                    notifications.map((notification) => (
                      <div
                        key={notification.notification_id}
                        onClick={() => handleNotificationClick(notification)}
                        className={`p-4 cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-700 ${
                          !notification.is_read ? 'bg-blue-50 dark:bg-blue-900/20' : ''
                        }`}
                      >
                        <div className="flex items-start space-x-3">
                          <div className={`p-2 rounded-lg ${getStatusColor(notification.type)}`}>
                            {getNotificationIcon(notification.type)}
                          </div>
                          <div>
                            <p className="font-medium">{notification.title}</p>
                            <p className="text-sm text-gray-500 dark:text-gray-400">
                              {notification.message}
                            </p>
                            <p className="text-xs text-gray-400 mt-1">
                              {new Date(notification.created_at).toLocaleDateString()}
                            </p>
                          </div>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Ads List */}
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-gray-200 dark:border-gray-700">
                <th className="px-6 py-4 text-left text-sm font-semibold text-gray-500">Ad Title</th>
                <th className="px-6 py-4 text-left text-sm font-semibold text-gray-500">Status</th>
                <th className="px-6 py-4 text-left text-sm font-semibold text-gray-500">Upload Date</th>
                <th className="px-6 py-4 text-left text-sm font-semibold text-gray-500">Actions</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan="4" className="px-6 py-4 text-center">
                    <div className="flex justify-center items-center space-x-2">
                      <div className="w-4 h-4 border-2 border-blue-500 border-t-transparent rounded-full animate-spin" />
                      <span>Loading...</span>
                    </div>
                  </td>
                </tr>
              ) : filteredAds.length === 0 ? (
                <tr>
                  <td colSpan="4" className="px-6 py-4 text-center text-gray-500">
                    No ads found
                  </td>
                </tr>
              ) : (
                filteredAds.map((ad) => (
                  <tr
                    key={ad.id}
                    className="border-b border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-700"
                  >
                    <td className="px-6 py-4">
                      <div className="flex items-center space-x-3">
                        <div className="flex-shrink-0">
                          {ad.type === 'video' ? (
                            <FileText className="w-8 h-8 text-blue-500" />
                          ) : (
                            <img
                              src={ad.thumbnail_url}
                              alt={ad.title}
                              className="w-8 h-8 rounded object-cover"
                            />
                          )}
                        </div>
                        <div>
                          <p className="font-medium">{ad.title}</p>
                          <p className="text-sm text-gray-500">{ad.description}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                        getStatusColor(ad.analysis_results?.[0]?.verdict)
                      }`}>
                        {getStatusIcon(ad.analysis_results?.[0]?.verdict)}
                        <span className="ml-1.5">
                          {ad.analysis_results?.[0]?.verdict
                            ? ad.analysis_results[0].verdict.replace('_', ' ').toUpperCase()
                            : 'PENDING'}
                        </span>
                      </div>
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-500">
                      {new Date(ad.created_at).toLocaleDateString()}
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center space-x-3">
                        <button
                          className="p-1 hover:bg-gray-100 dark:hover:bg-gray-700 rounded"
                          title="View Details"
                        >
                          <Eye className="w-4 h-4 text-gray-500" />
                        </button>
                        <button
                          className="p-1 hover:bg-gray-100 dark:hover:bg-gray-700 rounded"
                          title="View Report"
                        >
                          <ExternalLink className="w-4 h-4 text-gray-500" />
                        </button>
                        <button
                          className="p-1 hover:bg-gray-100 dark:hover:bg-gray-700 rounded"
                          title="More Actions"
                        >
                          <MoreVertical className="w-4 h-4 text-gray-500" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default UserFeatures;
    