import React, { useState, useEffect, useCallback } from "react";
import { useDispatch, useSelector } from "react-redux";
import { selectAccount, selectTheme } from "../../../App/DashboardSlice";
import {
  getCurrentUser,
  updateUser,
  changePassword,
  deleteUser,
} from "../../../Services/Repository/AccountRepo";
import { useNavigate } from "react-router-dom";
import { toast } from "react-hot-toast";
import {
  User,
  Edit3,
  Lock,
  Trash2,
  Coins,
  Mail,
  Phone,
  Briefcase,
  Camera,
  Save,
  X,
  Eye,
  EyeOff,
  AlertTriangle,
  Calendar,
  Shield,
  CheckCircle,
  Clock,
  PhoneCall,
} from "lucide-react";

// Move this OUTSIDE the Profile component, before the Profile component definition
const PasswordForm = ({
  isChangingPassword,
  passwordData,
  showPasswords,
  setPasswordData,
  setShowPasswords,
  setIsChangingPassword,
  handlePasswordChangeClick,
}) => (
  <div className="bg-[var(--card-bg)] rounded-xl p-6 shadow-lg border border-[var(--border-color)]">
    <h2 className="text-xl font-semibold text-[var(--text-primary)] mb-6 flex items-center gap-2">
      <Lock className="w-5 h-5" />
      Change Password
    </h2>

    {isChangingPassword ? (
      <div className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-[var(--text-secondary)] mb-1">
            Current Password
          </label>
          <div className="relative">
            <input
              type={showPasswords.old ? "text" : "password"}
              value={passwordData.old_password}
              onChange={(e) =>
                setPasswordData((prev) => ({
                  ...prev,
                  old_password: e.target.value,
                }))
              }
              className="w-full px-3 py-2 pr-10 bg-[var(--input-bg)] border border-[var(--input-border)] rounded-lg text-[var(--text-primary)] focus:outline-none focus:ring-2 focus:ring-[var(--accent-color)]"
            />
            <button
              type="button"
              onClick={() =>
                setShowPasswords((prev) => ({ ...prev, old: !prev.old }))
              }
              className="absolute right-3 top-1/2 transform -translate-y-1/2 text-[var(--text-secondary)]"
            >
              {showPasswords.old ? (
                <EyeOff className="w-4 h-4" />
              ) : (
                <Eye className="w-4 h-4" />
              )}
            </button>
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium text-[var(--text-secondary)] mb-1">
            New Password
          </label>
          <div className="relative">
            <input
              type={showPasswords.new ? "text" : "password"}
              value={passwordData.new_password}
              onChange={(e) =>
                setPasswordData((prev) => ({
                  ...prev,
                  new_password: e.target.value,
                }))
              }
              className="w-full px-3 py-2 pr-10 bg-[var(--input-bg)] border border-[var(--input-border)] rounded-lg text-[var(--text-primary)] focus:outline-none focus:ring-2 focus:ring-[var(--accent-color)]"
            />
            <button
              type="button"
              onClick={() =>
                setShowPasswords((prev) => ({ ...prev, new: !prev.new }))
              }
              className="absolute right-3 top-1/2 transform -translate-y-1/2 text-[var(--text-secondary)]"
            >
              {showPasswords.new ? (
                <EyeOff className="w-4 h-4" />
              ) : (
                <Eye className="w-4 h-4" />
              )}
            </button>
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium text-[var(--text-secondary)] mb-1">
            Confirm New Password
          </label>
          <div className="relative">
            <input
              type={showPasswords.confirm ? "text" : "password"}
              value={passwordData.confirm_password}
              onChange={(e) =>
                setPasswordData((prev) => ({
                  ...prev,
                  confirm_password: e.target.value,
                }))
              }
              className="w-full px-3 py-2 pr-10 bg-[var(--input-bg)] border border-[var(--input-border)] rounded-lg text-[var(--text-primary)] focus:outline-none focus:ring-2 focus:ring-[var(--accent-color)]"
            />
            <button
              type="button"
              onClick={() =>
                setShowPasswords((prev) => ({
                  ...prev,
                  confirm: !prev.confirm,
                }))
              }
              className="absolute right-3 top-1/2 transform -translate-y-1/2 text-[var(--text-secondary)]"
            >
              {showPasswords.confirm ? (
                <EyeOff className="w-4 h-4" />
              ) : (
                <Eye className="w-4 h-4" />
              )}
            </button>
          </div>
        </div>

        <div className="flex gap-3">
          <button
            onClick={handlePasswordChangeClick}
            className="flex items-center gap-2 px-4 py-2 bg-[var(--accent-color)] text-white rounded-lg hover:opacity-80 transition-all"
          >
            <Save className="w-4 h-4" />
            Update Password
          </button>
          <button
            onClick={() => {
              setIsChangingPassword(false);
              setPasswordData({
                old_password: "",
                new_password: "",
                confirm_password: "",
              });
            }}
            className="flex items-center gap-2 px-4 py-2 bg-gray-500 text-white rounded-lg hover:opacity-80 transition-all"
          >
            <X className="w-4 h-4" />
            Cancel
          </button>
        </div>
      </div>
    ) : (
      <div>
        <p className="text-[var(--text-secondary)] mb-6">
          Keep your account secure by regularly updating your password.
        </p>
        <button
          onClick={() => setIsChangingPassword(true)}
          className="flex items-center gap-2 px-4 py-2 bg-[var(--accent-color)] text-white rounded-lg hover:opacity-80 transition-all"
        >
          <Lock className="w-4 h-4" />
          Change Password
        </button>
      </div>
    )}
  </div>
);

const ProfileDisplay = ({
  userData,
  profileData,
  isEditingProfile,
  setProfileData,
  setIsEditingProfile,
  handleProfileUpdate,
  formatDate,
}) => (
  <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
    {/* Main Profile Card */}
    <div className="lg:col-span-2 bg-[var(--card-bg)] rounded-xl p-6 shadow-lg border border-[var(--border-color)]">
      <div className="flex flex-col md:flex-row items-start gap-6">
        {/* Profile Image */}
        <div className="relative">
          <div className="w-24 h-24 md:w-32 md:h-32 rounded-full bg-gradient-to-br from-blue-500 to-teal-500 flex items-center justify-center text-white text-2xl md:text-3xl font-bold overflow-hidden">
            {profileData.profile_url ? (
              <img
                src={profileData.profile_url}
                alt="Profile"
                className="w-full h-full rounded-full object-cover"
                onError={(e) => {
                  e.target.style.display = "none";
                  e.target.nextSibling.style.display = "flex";
                }}
              />
            ) : null}
            <div
              className={`w-full h-full flex items-center justify-center ${
                profileData.profile_url ? "hidden" : ""
              }`}
            >
              {userData.name
                ?.split(" ")
                .map((n) => n[0])
                .join("")
                .toUpperCase() || <User className="w-8 h-8 md:w-12 md:h-12" />}
            </div>
          </div>
          {isEditingProfile && (
            <button className="absolute -bottom-2 -right-2 bg-[var(--accent-color)] text-white p-2 rounded-full hover:bg-opacity-80 transition-all">
              <Camera className="w-4 h-4" />
            </button>
          )}
        </div>

        {/* Profile Info */}
        <div className="flex-1 space-y-4">
          {isEditingProfile ? (
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-[var(--text-secondary)] mb-1">
                  Full Name
                </label>
                <input
                  type="text"
                  value={profileData.name}
                  onChange={(e) =>
                    setProfileData({ ...profileData, name: e.target.value })
                  }
                  className="w-full px-3 py-2 bg-[var(--input-bg)] border border-[var(--input-border)] rounded-lg text-[var(--text-primary)] focus:outline-none focus:ring-2 focus:ring-[var(--accent-color)]"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-[var(--text-secondary)] mb-1">
                  Sector
                </label>
                <input
                  type="text"
                  value={profileData.sector}
                  onChange={(e) =>
                    setProfileData({
                      ...profileData,
                      sector: e.target.value,
                    })
                  }
                  placeholder="e.g., Software Developer"
                  className="w-full px-3 py-2 bg-[var(--input-bg)] border border-[var(--input-border)] rounded-lg text-[var(--text-primary)] focus:outline-none focus:ring-2 focus:ring-[var(--accent-color)]"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-[var(--text-secondary)] mb-1">
                  Profile Image URL
                </label>
                <input
                  type="url"
                  value={profileData.profile_url}
                  onChange={(e) =>
                    setProfileData({
                      ...profileData,
                      profile_url: e.target.value,
                    })
                  }
                  placeholder="https://example.com/image.jpg"
                  className="w-full px-3 py-2 bg-[var(--input-bg)] border border-[var(--input-border)] rounded-lg text-[var(--text-primary)] focus:outline-none focus:ring-2 focus:ring-[var(--accent-color)]"
                />
              </div>
              <div className="flex gap-3">
                <button
                  onClick={handleProfileUpdate}
                  className="flex items-center gap-2 px-4 py-2 bg-[var(--accent-color)] text-white rounded-lg hover:opacity-80 transition-all"
                >
                  <Save className="w-4 h-4" />
                  Save Changes
                </button>
                <button
                  onClick={() => setIsEditingProfile(false)}
                  className="flex items-center gap-2 px-4 py-2 bg-gray-500 text-white rounded-lg hover:opacity-80 transition-all"
                >
                  <X className="w-4 h-4" />
                  Cancel
                </button>
              </div>
            </div>
          ) : (
            <div className="space-y-3">
              <h1 className="text-2xl md:text-3xl font-bold text-[var(--text-primary)]">
                {userData.name}
              </h1>

              <div className="space-y-2">
                <div className="flex items-center gap-2 text-[var(--text-secondary)]">
                  <Mail className="w-4 h-4" />
                  <span>{userData.email}</span>
                </div>

                {userData.sector && ( // Changed from occupation
                  <div className="flex items-center gap-2 text-[var(--text-secondary)]">
                    <Briefcase className="w-4 h-4" />
                    <span>{userData.sector}</span>
                  </div>
                )}

                <div className="flex items-center gap-2 text-[var(--text-secondary)]">
                  <PhoneCall className="w-4 h-4" />
                  <span className="capitalize">{userData.mobile}</span>
                </div>
              </div>

              <button
                onClick={() => setIsEditingProfile(true)}
                className="flex items-center gap-2 px-4 py-2 bg-[var(--accent-color)] text-white rounded-lg hover:opacity-80 transition-all"
              >
                <Edit3 className="w-4 h-4" />
                Edit Profile
              </button>
            </div>
          )}
        </div>
      </div>
    </div>

    {/* Account Status Card */}
    <div className="bg-[var(--card-bg)] rounded-xl p-6 shadow-lg border border-[var(--border-color)]">
      <h3 className="text-lg font-semibold text-[var(--text-primary)] mb-4">
        Account Status
      </h3>

      <div className="space-y-4">
        <div className="flex items-center gap-3">
          <div
            className={`w-3 h-3 rounded-full ${
              userData.e_verified ? "bg-green-500" : "bg-red-500"
            }`}
          ></div>
          <div>
            <p className="text-sm font-medium text-[var(--text-primary)]">
              Email Verification
            </p>
            <p className="text-xs text-[var(--text-secondary)]">
              {userData.e_verified ? "Verified" : "Pending"}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <div
            className={`w-3 h-3 rounded-full ${
              userData.is_active ? "bg-green-500" : "bg-red-500"
            }`}
          ></div>
          <div>
            <p className="text-sm font-medium text-[var(--text-primary)]">
              Account Status
            </p>
            <p className="text-xs text-[var(--text-secondary)]">
              {userData.is_active ? "Active" : "Inactive"}
            </p>
          </div>
        </div>

        <div className="pt-3 border-t border-[var(--border-color)]">
          <div className="flex items-center gap-2 text-[var(--text-secondary)] text-sm">
            <Calendar className="w-4 h-4" />
            <span>Joined {formatDate(userData.created_at)}</span>
          </div>
        </div>

        {userData.updated_at !== userData.created_at && (
          <div className="flex items-center gap-2 text-[var(--text-secondary)] text-sm">
            <Clock className="w-4 h-4" />
            <span>Last updated {formatDate(userData.updated_at)}</span>
          </div>
        )}
      </div>
    </div>
  </div>
);

const DangerZone = ({ 
  showDeleteConfirm, 
  setShowDeleteConfirm, 
  handleDeleteAccount 
}) => (
    <div className="bg-red-50 dark:bg-red-900/10 rounded-xl p-6 shadow-lg border border-red-200 dark:border-red-800">
      <h2 className="text-xl font-semibold text-red-600 dark:text-red-400 mb-4 flex items-center gap-2">
        <AlertTriangle className="w-5 h-5" />
        Danger Zone
      </h2>

      {showDeleteConfirm ? (
        <div className="space-y-4">
          <div className="bg-red-100 dark:bg-red-900/20 p-4 rounded-lg">
            <h3 className="font-semibold text-red-800 dark:text-red-300 mb-2">
              Are you absolutely sure?
            </h3>
            <p className="text-red-700 dark:text-red-300 text-sm">
              This action will permanently deactivate your account and cannot be
              undone. All your data will be marked for deletion.
            </p>
          </div>
          <div className="flex gap-3">
            <button
              onClick={handleDeleteAccount}
              className="flex items-center gap-2 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-all"
            >
              <Trash2 className="w-4 h-4" />
              Yes, Delete Account
            </button>
            <button
              onClick={() => setShowDeleteConfirm(false)}
              className="flex items-center gap-2 px-4 py-2 bg-gray-500 text-white rounded-lg hover:opacity-80 transition-all"
            >
              <X className="w-4 h-4" />
              Cancel
            </button>
          </div>
        </div>
      ) : (
        <div>
          <p className="text-red-600 dark:text-red-400 mb-4">
            Once you delete your account, there is no going back. Please be
            certain.
          </p>
          <button
            onClick={() => setShowDeleteConfirm(true)}
            className="flex items-center gap-2 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-all"
          >
            <Trash2 className="w-4 h-4" />
            Delete Account
          </button>
        </div>
      )}
    </div>
  );

const Profile = () => {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const theme = useSelector(selectTheme);
  const currentUser = useSelector(selectAccount); // Only for user ID

  const [activeTab, setActiveTab] = useState("profile");
  const [userData, setUserData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [isEditingProfile, setIsEditingProfile] = useState(false);
  const [isChangingPassword, setIsChangingPassword] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);

  // Profile form state
  const [profileData, setProfileData] = useState({
    name: "",
    sector: "",
    profile_url: "",
  });

  // Password form state
  const [passwordData, setPasswordData] = useState({
    old_password: "",
    new_password: "",
    confirm_password: "",
  });

  const [showPasswords, setShowPasswords] = useState({
    old: false,
    new: false,
    confirm: false,
  });

  // Fetch user data on component mount
  useEffect(() => {
    const fetchUserData = async () => {
      setLoading(true);
      try {
        const response = await getCurrentUser();
        if (response) {
          setUserData(response);
          setProfileData({
            name: response.name || "",
            occupation: response.sector || "",
            profile_url: response.profile_url || "",
          });
        }
      } catch (error) {
        console.error("Failed to fetch user data:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchUserData();
  }, []);

  const handleProfileUpdate = async () => {
    const result = await dispatch(
      updateUser(userData.u_id, {
        name: profileData.name,
        sector: profileData.sector,
        profile_url: profileData.profile_url,
      })
    );

    if (result) {
      // Refresh user data after update
      const updatedData = await getCurrentUser();
      if (updatedData) {
        setUserData(updatedData);
        setProfileData({
          name: updatedData.name || "",
          sector: updatedData.sector || "",
          profile_url: updatedData.profile_url || "",
        });
      }
      setIsEditingProfile(false);
    }
  };

  const handlePasswordChange = useCallback(
    (field) => (e) => {
      setPasswordData((prev) => ({
        ...prev,
        [field]: e.target.value,
      }));
    },
    []
  );

  const handlePasswordChangeClick = async () => {
    if (passwordData.new_password !== passwordData.confirm_password) {
      toast.error("New passwords do not match");
      return;
    }

    const result = await changePassword({
      old_password: passwordData.old_password,
      new_password: passwordData.new_password,
    });

    if (result) {
      setIsChangingPassword(false);
      setPasswordData({
        old_password: "",
        new_password: "",
        confirm_password: "",
      });
    }
  };

  const handleDeleteAccount = async () => {
    await deleteUser(userData.u_id, navigate);
    setShowDeleteConfirm(false);
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString("en-US", {
      year: "numeric",
      month: "long",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-[var(--bg-primary)] flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[var(--accent-color)]"></div>
      </div>
    );
  }

  if (!userData) {
    return (
      <div className="min-h-screen bg-[var(--bg-primary)] flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-xl font-semibold text-[var(--text-primary)] mb-2">
            Failed to load profile
          </h2>
          <p className="text-[var(--text-secondary)]">
            Please try refreshing the page
          </p>
        </div>
      </div>
    );
  }


  return (
    <div className="min-h-screen bg-[var(--bg-primary)] p-4 md:p-6">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl md:text-4xl font-bold text-[var(--text-primary)] mb-2">
            Profile Settings
          </h1>
          <p className="text-[var(--text-secondary)]">
            Manage your account settings and preferences
          </p>
        </div>

        {/* Tab Navigation */}
        <div className="flex flex-wrap gap-2 mb-6 border-b border-[var(--border-color)]">
          {[
            { id: "profile", label: "Profile", icon: User },
            { id: "security", label: "Security", icon: Lock },
            { id: "danger", label: "Account", icon: AlertTriangle },
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex items-center gap-2 px-4 py-2 rounded-t-lg transition-all ${
                activeTab === tab.id
                  ? "bg-[var(--accent-color)] text-white"
                  : "text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:bg-[var(--highlight-color)]"
              }`}
            >
              <tab.icon className="w-4 h-4" />
              <span className="hidden sm:inline">{tab.label}</span>
            </button>
          ))}
        </div>

        {/* Tab Content */}
        <div className="space-y-6">
          {activeTab === "profile" && (
            <ProfileDisplay
              userData={userData}
              profileData={profileData}
              isEditingProfile={isEditingProfile}
              setProfileData={setProfileData}
              setIsEditingProfile={setIsEditingProfile}
              handleProfileUpdate={handleProfileUpdate}
              formatDate={formatDate}
            />
          )}
          {activeTab === "security" && (
            <PasswordForm
              isChangingPassword={isChangingPassword}
              passwordData={passwordData}
              showPasswords={showPasswords}
              setPasswordData={setPasswordData}
              setShowPasswords={setShowPasswords}
              setIsChangingPassword={setIsChangingPassword}
              handlePasswordChangeClick={handlePasswordChangeClick}
            />
          )}
          {activeTab === "danger" && (
            <DangerZone
              showDeleteConfirm={showDeleteConfirm}
              setShowDeleteConfirm={setShowDeleteConfirm}
              handleDeleteAccount={handleDeleteAccount}
            />
          )}
        </div>
      </div>
    </div>
  );
};

export default Profile;
