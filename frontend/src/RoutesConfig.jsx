import React from 'react';
import { Routes, Route } from 'react-router-dom';
import { useSelector } from 'react-redux';
import { HeroPage, Login, VerifyEmail } from './Components';
import { dashboardMenuState } from './App/DashboardSlice';
import { isUserLoggedIn } from './App/DashboardSlice';

import NavBar from './Components/protected/Dashboard/NavBar';
import Sidebar from './Components/utils/Sidebar';
import Dashboard from './Components/protected/Dashboard/Dashboard';
import Profile from './Components/protected/Profile/Profile';
import Onboarding from './Components/protected/Profile/Onboarding';

const RoutesConfig = () => {
  const isLoggedIn = useSelector(isUserLoggedIn);
  const ifDMenuState = useSelector(dashboardMenuState);
  if (!isLoggedIn) {
    return (
      <Routes>
        <Route
          path="/"
          key={'home'}
          className="transition-all scrollbar-hide"
          element={[<HeroPage key={'HeroPage'} />]}
        />
        <Route
          path="/login"
          key={'login'}
          className="transition-all scrollbar-hide"
          element={[<Login key={"login"}/>]}
        />
        <Route
          path="/verify-email"
          key={'verify-email'}
          className="transition-all scrollbar-hide"
          element={[<VerifyEmail key={"verify_email"}/>]}
        />
      </Routes>
    );
  } else {
    return (
      <div
        className={`w-full h-[100vh] bg-[var(--bg-primary)] flex flex-col overflow-y-auto scrollbar-hide`}
      >
        <Sidebar isOpen={ifDMenuState} />
        <NavBar />
        <div className={`${ifDMenuState && 'pl-[4rem]'} `}>
          <Routes>
            <Route path="/" element={<Dashboard />} />
            <Route path="/dashboard" element={<Dashboard />} />
            <Route path="/onboard" element={<Onboarding />} />
            <Route path="/profile" element={<Profile />} />
          </Routes>
        </div>
      </div>
    );
  }
};

export default RoutesConfig;
