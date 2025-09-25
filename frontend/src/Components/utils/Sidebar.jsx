import React, { useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import {
  dashboardFeature,
  dashboardMenuState,
  selectAccount,
  setCloseDMenu,
  setDFeature,
} from '../../App/DashboardSlice.js';
import { features } from '../data/dynamic.js';
import { useNavigate } from 'react-router-dom';

import logo from "../../assets/adguardai_text.png"
import logo_s from "../../assets/adguardai_small.png"

import { 
  Feather, 
  X, 
  ChevronRight, 
  Sparkles, 
  TrendingUp,
  Zap,
  Settings,
  HelpCircle,
  ExternalLink
} from 'lucide-react';

const Sidebar = ({ isOpen }) => {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const [isHovered, setIsHovered] = useState(false);
  const ifDMenuState = useSelector(dashboardMenuState);
  const dashboardFeatures = useSelector(dashboardFeature);
  const userAccount = useSelector(selectAccount);

  const onCartToggler = () => {
    dispatch(setCloseDMenu({ dashboardMenuState: !ifDMenuState }));
  };

  const handleNavigation = (item) => {
    dispatch(setDFeature({ dashboardFeature: item.featureName }));
    navigate(item.route);
  };

  // Additional menu items
  const bottomMenuItems = [
    {
      featureName: 'Settings',
      displayName: 'Settings',
      logoUsed: Settings,
      route: '/settings',
      description: 'Configure your workspace'
    },
    {
      featureName: 'Help',
      displayName: 'Help & Support',
      logoUsed: HelpCircle,
      route: '/help',
      description: 'Get help and documentation'
    }
  ];

  // Quick stats for expanded sidebar
  const quickStats = [
    { label: 'Active Workflows', value: '12', icon: TrendingUp },
    { label: 'This Month', value: '89%', icon: Sparkles },
  ];

  return (
    <>
      {/* Backdrop for mobile */}
      {isOpen && (
        <div 
          className="fixed inset-0 bg-black/50 backdrop-blur-sm z-40 lg:hidden"
          onClick={onCartToggler}
        />
      )}

      {/* Sidebar */}
      <div
        className={`
          fixed left-0 top-0 h-full z-100
          ${isOpen ? 'visible' : 'invisible'}
          transition-all duration-300 ease-in-out
          ${isHovered ? 'w-72' : 'w-16'}
          bg-[var(--card-bg)]/95 backdrop-blur-md
          border-r border-[var(--border-color)]
          flex flex-col
          shadow-xl
        `}
        onMouseEnter={() => setIsHovered(true)}
        onMouseLeave={() => setIsHovered(false)}
      >
        {/* Header */}
        <div className="relative p-3 border-b border-[var(--border-color)] bg-gradient-to-r from-[var(--accent-color)]/5 to-transparent">
          {/* Close button */}
          <button
            onClick={onCartToggler}
            className={`absolute right-3 top-3 w-8 h-8 rounded-lg hover:bg-[var(--highlight-color)] transition-all duration-200 flex items-center justify-center ${
              isHovered ? 'opacity-100' : 'opacity-0 pointer-events-none'
            }`}
          >
            <X className="w-5 h-5 text-[var(--text-secondary)]" />
          </button>

          {/* Logo and Brand */}
          <div className="flex items-center space-x-3">
            {/* <div className="w-10 h-10 bg-gradient-to-r from-[var(--accent-color)] to-blue-500 rounded-xl flex items-center justify-center shadow-lg">
              <Feather className="w-6 h-6 text-white" />
            </div> */}
            <img src={logo_s} alt="logo_S" className="h-[2.4rem] mb-[0.3rem]" />
            
            <div className={`transition-all duration-300 ${isHovered ? 'opacity-100' : 'opacity-0 w-0'} overflow-hidden`}>
              <img className="w-28 h-auto" src={logo} alt="logo" />
            </div>
          </div>

          {/* Quick Stats - Only show when expanded */}
          <div className={`transition-all duration-300 ${isHovered ? 'mt-4  opacity-100' : 'opacity-0 h-0'} overflow-hidden`}>
            <div className="grid grid-cols-2 gap-2">
              {quickStats.map((stat, index) => (
                <div key={index} className="bg-[var(--bg-secondary)] rounded-lg p-2">
                  <div className="flex items-center space-x-1">
                    <stat.icon className="w-3 h-3 text-[var(--accent-color)]" />
                    <span className="text-xs font-semibold text-[var(--text-primary)]">{stat.value}</span>
                  </div>
                  <p className="text-xs text-[var(--text-secondary)] truncate">{stat.label}</p>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Navigation Menu */}
        <div className="py-4 overflow-y-auto scrollbar-hide flex-1 flex flex-col">
          <div className="px-3 space-y-2 overflow-y-auto scrollbar-hide">
            {features.map((item, index) => item.allowedRoles.includes(userAccount.role) && (
              <div
                key={index}
                onClick={() => handleNavigation(item)}
                className={`
                  group relative flex items-center cursor-pointer rounded-xl transition-all duration-200
                  ${isHovered ? 'px-3 py-3' : 'pl-3 py-3 justify-center'}
                  ${dashboardFeatures === item.featureName
                    ? 'bg-gradient-to-r from-[var(--accent-color)]/10 to-blue-500/10 border border-[var(--accent-color)]/20 shadow-lg'
                    : 'hover:bg-[var(--highlight-color)] border border-transparent'
                  }
                `}
              >
                {/* Icon */}
                <div className={`flex items-center justify-center transition-all duration-200 ${
                  dashboardFeatures === item.featureName ? 'text-[var(--accent-color)]' : 'text-[var(--text-secondary)] group-hover:text-[var(--accent-color)]'
                }`}>
                  <item.logoUsed className="w-6 h-6" />
                </div>

                {/* Label and description */}
                <div className={`ml-3 transition-all duration-300 ${isHovered ? 'opacity-100' : 'opacity-0 w-0'} overflow-hidden`}>
                  <div className="flex items-center justify-between">
                    <span className={`font-medium transition-colors ${
                      dashboardFeatures === item.featureName 
                        ? 'text-[var(--accent-color)]' 
                        : 'text-[var(--text-primary)] group-hover:text-[var(--accent-color)]'
                    }`}>
                      {item.displayName}
                    </span>
                    <ChevronRight className={`w-4 h-4 transition-all duration-200 ${
                      dashboardFeatures === item.featureName 
                        ? 'text-[var(--accent-color)] translate-x-1' 
                        : 'text-[var(--text-secondary)] group-hover:text-[var(--accent-color)] group-hover:translate-x-1'
                    }`} />
                  </div>
                </div>

                {/* Active indicator */}
                {dashboardFeatures === item.featureName && (
                  <div className="absolute left-0 top-1/2 transform -translate-y-1/2 w-1 h-8 bg-gradient-to-b from-[var(--accent-color)] to-blue-500 rounded-r-full"></div>
                )}

                {/* Tooltip for collapsed state */}
                {!isHovered && (
                  <div className="absolute left-full ml-2 px-3 py-2 bg-[var(--card-bg)] border border-[var(--border-color)] rounded-lg shadow-xl opacity-0 group-hover:opacity-100 transition-all duration-200 pointer-events-none z-50 whitespace-nowrap">
                    <span className="text-sm font-medium text-[var(--text-primary)]">{item.displayName}</span>
                    <div className="absolute left-0 top-1/2 transform -translate-y-1/2 -translate-x-1 w-2 h-2 bg-[var(--card-bg)] border-l border-b border-[var(--border-color)] rotate-45"></div>
                  </div>
                )}
              </div>
            ))}
          </div>
          <div className="flex-1"></div>

          {/* Divider */}
          <div className={`${isHovered ? "mx-3 my-2" : "mx-3 my-2"}  border-t border-[var(--border-color)]`}></div>

          {/* Bottom Menu Items */}
          <div className="px-3">
            {bottomMenuItems.map((item, index) => (
              <div
                key={index}
                onClick={() => handleNavigation(item)}
                className={`
                  
                  ${isHovered ? 'px-3 py-3 group relative flex  cursor-pointer rounded-xl transition-all duration-200 hover:bg-[var(--highlight-color)] border border-transparent' : 'h-10 flex justify-center pl-2 items-center'}
                  
                `}
              >
                <div className="flex items-center justify-center text-[var(--text-secondary)] group-hover:text-[var(--accent-color)] transition-colors">
                  <item.logoUsed className="w-6 h-6" />
                </div>

                <div className={`ml-3 transition-all duration-300 ${isHovered ? 'opacity-100' : 'opacity-0 w-0'} overflow-hidden`}>
                  <span className="font-medium text-[var(--text-primary)] group-hover:text-[var(--accent-color)] transition-colors">
                    {item.displayName}
                  </span>
                  {item.description && (
                    <p className="text-xs text-[var(--text-secondary)] mt-1">{item.description}</p>
                  )}
                </div>

                {/* Tooltip for collapsed state */}
                {!isHovered && (
                  <div className="absolute left-full ml-2 px-3 py-2 bg-[var(--card-bg)] border border-[var(--border-color)] rounded-lg shadow-xl opacity-0 group-hover:opacity-100 transition-all duration-200 pointer-events-none z-50 whitespace-nowrap">
                    <span className="text-sm font-medium text-[var(--text-primary)]">{item.displayName}</span>
                    <div className="absolute left-0 top-1/2 transform -translate-y-1/2 -translate-x-1 w-2 h-2 bg-[var(--card-bg)] border-l border-b border-[var(--border-color)] rotate-45"></div>
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>

        {/* Footer - Upgrade prompt when expanded */}
        <div className={` ${isHovered ? 'opacity-100 p-4 border-t border-[var(--border-color)] transition-all duration-300 overflow-hidden' : 'opacity-0 h-0'} `}>
          <div className="bg-gradient-to-r from-[var(--accent-color)]/10 to-blue-500/10 rounded-xl p-3 border border-[var(--accent-color)]/20">
            <div className="flex items-center space-x-2 mb-2">
              <Zap className="w-4 h-4 text-[var(--accent-color)]" />
              <span className="text-sm font-semibold text-[var(--text-primary)]">Upgrade Plan</span>
            </div>
            <p className="text-xs text-[var(--text-secondary)] mb-3">
              Unlock advanced features and increased limits
            </p>
            <button className="w-full bg-gradient-to-r from-[var(--accent-color)] to-blue-500 text-white text-xs font-medium py-2 rounded-lg hover:shadow-lg transition-all duration-200 flex items-center justify-center space-x-1">
              <span>Upgrade Now</span>
              <ExternalLink className="w-3 h-3" />
            </button>
          </div>
        </div>

        {/* Resize handle */}
        <div className="absolute right-0 top-0 bottom-0 w-1 bg-transparent hover:bg-[var(--accent-color)]/20 transition-colors cursor-col-resize"></div>
      </div>
    </>
  );
};

export default Sidebar;