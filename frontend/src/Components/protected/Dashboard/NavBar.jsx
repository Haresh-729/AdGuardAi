import React, { useEffect, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import {
  setCloseDMenu,
  LogOut,
  dashboardMenuState,
  selectAccount,
  setTheme,
  selectTheme,
  selectCredits,
} from "../../../App/DashboardSlice";
import logo from "../../../assets/adguardai_text.png";

import { useNavigate } from "react-router-dom";
import {
  ArrowRight,
  Bell,
  ChevronDown,
  CircleUserRound,
  CreditCard,
  LogOutIcon,
  Menu,
  Moon,
  Search,
  Settings,
  Sun,
  User,
  HelpCircle,
  Zap,
  RotateCcw
} from "lucide-react";
import { getUserCredits } from "../../../Services/Repository/AccountRepo";

function NavBar() {
  const [showProfileMenu, setShowProfileMenu] = useState(false);
  const [showNotifications, setShowNotifications] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");

  const ifDMenuState = useSelector(dashboardMenuState);
  const user = useSelector(selectAccount);
  const credits = useSelector(selectCredits);
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const theme = useSelector(selectTheme);

  useEffect(() => {
    const savedTheme = localStorage.getItem("theme") || "dark";
    document.documentElement.setAttribute("data-theme", savedTheme);
    dispatch(setTheme({ theme: savedTheme }));
  }, []);

  const onMenuToggle = () => {
    dispatch(
      setCloseDMenu({
        dashboardMenuState: !ifDMenuState,
      })
    );
  };

  const toggleTheme = () => {
    const newTheme = theme === "light" ? "dark" : "light";
    dispatch(setTheme({ theme: newTheme }));
    document.documentElement.setAttribute("data-theme", newTheme);
  };

  const logout = () => {
    dispatch(LogOut());
    navigate("/");
  };

  const notifications = [
    {
      id: 1,
      title: "Workflow Completed",
      message: "Your data processing workflow has finished successfully",
      time: "2 mins ago",
      unread: true,
    },
    {
      id: 2,
      title: "New Team Member",
      message: "John Doe has joined your workspace",
      time: "1 hour ago",
      unread: true,
    },
    {
      id: 3,
      title: "System Update",
      message: "New features are now available",
      time: "3 hours ago",
      unread: false,
    },
  ];

  const profileMenuItems = [
    {
      icon: User,
      label: "Profile Settings",
      action: () => navigate("/profile"),
    },
    {
      icon: CreditCard,
      label: "Billing & Usage",
      action: () => navigate("/billing"),
    },
    {
      icon: Settings,
      label: "Preferences",
      action: () => navigate("/settings"),
    },
    {
      icon: HelpCircle,
      label: "Help & Support",
      action: () => navigate("/help"),
    },
  ];

  return (
    <div className="flex w-full sticky top-0 z-99 bg-[var(--card-bg)]/95 backdrop-blur-md border-b border-[var(--border-color)] h-[5rem] md:h-17 py-1 shadow-lg">
      <div className="flex w-full px-4 md:px-6 justify-between items-center">
        {/* Left Section - Menu & Logo */}
        <div
          className={`flex items-center transition-all duration-300 ${
            ifDMenuState ? "pl-12 md:pl-16" : ""
          }`}
        >
          <button
            onClick={onMenuToggle}
            className="w-10 h-10 flex items-center justify-center rounded-xl hover:bg-[var(--highlight-color)] transition-all duration-200 mr-3"
          >
            <Menu className="w-6 h-6 text-[var(--accent-color)]" />
          </button>

          <div className="flex items-center">
            <img className="w-32 h-auto" src={logo} alt="logo" />
          </div>
        </div>

        {/* Center Section - Search */}
        {/* <div className="hidden md:flex flex-1 max-w-md mx-8">
          <div className="relative w-full">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-[var(--text-secondary)]" />
            <input
              type="text"
              placeholder="Search workflows, tasks, or files..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-2 bg-[var(--input-bg)] border border-[var(--input-border)] rounded-xl focus:outline-none focus:ring-2 focus:ring-[var(--accent-color)]/50 focus:border-[var(--accent-color)] transition-all text-[var(--text-primary)]"
            />
          </div>
        </div> */}

        {/* Right Section - Actions & Profile */}
        <div className="flex items-center space-x-2">
          {/* Credits Display */}
          <div className="hidden sm:flex items-center relative group">
            <div className="flex items-center bg-gradient-to-r from-[var(--accent-color)]/10 to-blue-500/10 rounded-xl px-3 py-2 border border-[var(--accent-color)]/20 transition-all duration-200 group-hover:shadow-lg">
              <Zap className="w-4 h-4 text-[var(--accent-color)] mr-2" />
              <span className="text-sm font-semibold text-[var(--text-primary)]">
                {credits || "-100"}
              </span>
              <span className="text-xs text-[var(--text-secondary)] ml-1">
                Credits
              </span>
            </div>

            {/* Refresh Button - Shows on Hover */}
            <div className="absolute -right-2 -top-2 opacity-0 group-hover:opacity-100 transition-all duration-200 transform group-hover:scale-100 scale-75">
              <button
                onClick={() => {dispatch(getUserCredits(user.id, true))}}
                className="w-6 h-6 bg-[var(--accent-color)] text-white rounded-full flex items-center justify-center hover:bg-[var(--button-hover)] transition-all duration-200 shadow-lg hover:shadow-xl"
                title="Refresh Credits"
              >
                <RotateCcw className="w-3 h-3" />
              </button>
            </div>
          </div>

          {/* Theme Toggle */}
          <button
            onClick={toggleTheme}
            className="w-10 h-10 flex items-center justify-center rounded-xl hover:bg-[var(--highlight-color)] transition-all duration-200"
          >
            {theme === "light" ? (
              <Moon className="w-5 h-5 text-[var(--accent-color)]" />
            ) : (
              <Sun className="w-5 h-5 text-[var(--accent-color)]" />
            )}
          </button>

          {/* Notifications */}
          <div className="relative">
            <button
              onClick={() => setShowNotifications(!showNotifications)}
              className="w-10 h-10 flex items-center justify-center rounded-xl hover:bg-[var(--highlight-color)] transition-all duration-200 relative"
            >
              <Bell className="w-5 h-5 text-[var(--text-primary)]" />
              {notifications.some((n) => n.unread) && (
                <div className="absolute top-1 right-1 w-3 h-3 bg-red-500 rounded-full animate-pulse"></div>
              )}
            </button>

            {/* Notifications Dropdown */}
            {showNotifications && (
              <div className="absolute right-0 mt-2 w-80 bg-[var(--card-bg)] rounded-xl shadow-xl border border-[var(--border-color)] overflow-hidden z-50">
                <div className="p-4 border-b border-[var(--border-color)]">
                  <h3 className="font-semibold text-[var(--text-primary)]">
                    Notifications
                  </h3>
                </div>
                <div className="max-h-64 overflow-y-auto">
                  {notifications.map((notification) => (
                    <div
                      key={notification.id}
                      className={`p-4 border-b border-[var(--border-color)] hover:bg-[var(--highlight-color)] transition-colors cursor-pointer ${
                        notification.unread ? "bg-[var(--accent-color)]/5" : ""
                      }`}
                    >
                      <div className="flex items-start space-x-3">
                        {notification.unread && (
                          <div className="w-2 h-2 bg-[var(--accent-color)] rounded-full mt-2"></div>
                        )}
                        <div className="flex-1">
                          <p className="font-medium text-[var(--text-primary)] text-sm">
                            {notification.title}
                          </p>
                          <p className="text-[var(--text-secondary)] text-xs mt-1">
                            {notification.message}
                          </p>
                          <p className="text-[var(--text-secondary)] text-xs mt-1">
                            {notification.time}
                          </p>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
                <div className="p-3 text-center border-t border-[var(--border-color)]">
                  <button className="text-sm text-[var(--accent-color)] hover:opacity-80">
                    View All Notifications
                  </button>
                </div>
              </div>
            )}
          </div>

          {/* Profile Menu */}
          <div className="relative">
            <button
              onClick={() => setShowProfileMenu(!showProfileMenu)}
              className="flex items-center space-x-3 p-2 rounded-xl hover:bg-[var(--highlight-color)] transition-all duration-200 border border-[var(--border-color)]"
            >
              <div className="w-8 h-8 bg-gradient-to-r from-[var(--accent-color)] to-blue-500 rounded-full flex items-center justify-center">
                <CircleUserRound className="w-5 h-5 text-white" />
              </div>
              <div className="hidden md:flex flex-col items-start">
                <span className="text-sm font-semibold text-[var(--text-primary)]">
                  {user?.uname || "User"}
                </span>
                <span className="text-xs text-[var(--text-secondary)] capitalize">
                  {user.role}
                </span>
              </div>
              <ChevronDown
                className={`w-4 h-4 text-[var(--text-secondary)] transition-transform duration-200 ${
                  showProfileMenu ? "rotate-180" : ""
                }`}
              />
            </button>

            {/* Profile Dropdown */}
            {showProfileMenu && (
              <div className="absolute right-0 mt-2 w-64 bg-[var(--card-bg)] rounded-xl shadow-xl border border-[var(--border-color)] overflow-hidden z-50">
                {/* User Info */}
                <div className="p-4 border-b border-[var(--border-color)] bg-gradient-to-r from-[var(--accent-color)]/5 to-blue-500/5">
                  <div className="flex items-center space-x-3">
                    <div className="w-12 h-12 bg-gradient-to-r from-[var(--accent-color)] to-blue-500 rounded-full flex items-center justify-center">
                      <CircleUserRound className="w-8 h-8 text-white" />
                    </div>
                    <div>
                      <p className="font-semibold text-[var(--text-primary)]">
                        {user?.uname || "User"}
                      </p>
                      <p className="text-sm text-[var(--text-secondary)]">
                        {user?.uemail || "user@example.com"}
                      </p>
                    </div>
                  </div>
                </div>

                {/* Menu Items */}
                <div className="py-2">
                  {profileMenuItems.map((item, index) => (
                    <button
                      key={index}
                      onClick={item.action}
                      className="w-full flex items-center space-x-3 px-4 py-3 hover:bg-[var(--highlight-color)] transition-colors text-left"
                    >
                      <item.icon className="w-5 h-5 text-[var(--text-secondary)]" />
                      <span className="text-[var(--text-primary)]">
                        {item.label}
                      </span>
                    </button>
                  ))}
                </div>

                {/* Logout */}
                <div className="border-t border-[var(--border-color)] py-2">
                  <button
                    onClick={logout}
                    className="w-full flex items-center space-x-3 px-4 py-3 hover:bg-red-500/10 transition-colors text-left group"
                  >
                    <LogOutIcon className="w-5 h-5 text-red-500" />
                    <span className="text-red-500 group-hover:text-red-400">
                      Sign Out
                    </span>
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Mobile Search */}
      {/* <div className="md:hidden absolute top-full left-0 right-0 p-4 bg-[var(--card-bg)] border-b border-[var(--border-color)]">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-[var(--text-secondary)]" />
          <input
            type="text"
            placeholder="Search..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-10 pr-4 py-2 bg-[var(--input-bg)] border border-[var(--input-border)] rounded-xl focus:outline-none focus:ring-2 focus:ring-[var(--accent-color)]/50 text-[var(--text-primary)]"
          />
        </div>
      </div> */}

      {/* Click outside to close dropdowns */}
      {(showProfileMenu || showNotifications) && (
        <div
          className="fixed inset-0 z-30"
          onClick={() => {
            setShowProfileMenu(false);
            setShowNotifications(false);
          }}
        ></div>
      )}
    </div>
  );
}

export default NavBar;
