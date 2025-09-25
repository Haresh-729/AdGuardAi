import { createSlice } from '@reduxjs/toolkit';

// Get stored data from localStorage
const localData = JSON.parse(localStorage.getItem('account'));
const Dstate = JSON.parse(localStorage.getItem('dState'));
const theme = localStorage.getItem('theme') || 'dark';
const localCredits = localStorage.getItem('credits');

const initialState = {
  dashboardMenuState: true,
  dashboardFeature: Dstate ? Dstate : 'Home',
  account: localData ? localData : {role: "user", email: "haresh@gmail.com", },
  isLoggedIn: localData ? localData.isLoggedIn : false,
  profileData: [],
  theme: theme,
  credits: localCredits ? parseInt(localCredits) : 0
};

const DashboardSlice = createSlice({
  initialState,
  name: 'dashboard',
  reducers: {
    setOpenDMenu: (state, action) => {
      state.dashboardMenuState = action.payload.dashboardMenuState;
    },
    setCloseDMenu: (state, action) => {
      state.dashboardMenuState = action.payload.dashboardMenuState;
    },
    setDFeature: (state, action) => {
      state.dashboardFeature = action.payload.dashboardFeature;
      localStorage.setItem(
        'dState',
        JSON.stringify(action.payload.dashboardFeature),
      );
    },
    setAccount: (state, action) => {
      state.account = action.payload;
      state.isLoggedIn = true;
      state.credits = action.payload.credits || 0;
      
      // Store account data with isLoggedIn flag
      const accountToStore = { 
        ...action.payload, 
        isLoggedIn: true 
      };
      localStorage.setItem('account', JSON.stringify(accountToStore));
      localStorage.setItem('credits', state.credits.toString());
    },
    setAccountAfterRegister: (state, action) => {
      state.account = action.payload;
      state.isLoggedIn = false;
      
      // Store temporary account data for verification process
      const tempAccountData = { 
        ...action.payload, 
        isLoggedIn: false 
      };
      localStorage.setItem('account', JSON.stringify(tempAccountData));
    },
    LogOut: (state) => {
      // Reset all state to initial values
      state.account = {};
      state.profileData = [];
      state.isLoggedIn = false;
      state.dashboardMenuState = false;
      state.dashboardFeature = 'Home';
      state.credits = 0;
      
      // Clear all localStorage
      localStorage.clear();
    },
    setTheme: (state, action) => {
      state.theme = action.payload.theme;
      localStorage.setItem('theme', action.payload.theme);
      
      // Also update the document attribute
      if (typeof document !== 'undefined') {
        document.documentElement.setAttribute('data-theme', action.payload.theme);
      }
    },
    setCredits: (state, action) => {
      state.credits = action.payload.credits;
      localStorage.setItem('credits', action.payload.credits.toString());
      
      // Also update the account object if it exists
      if (state.account && Object.keys(state.account).length > 0) {
        state.account.credits = action.payload.credits;
        const updatedAccount = { 
          ...state.account, 
          isLoggedIn: state.isLoggedIn 
        };
        localStorage.setItem('account', JSON.stringify(updatedAccount));
      }
    },
    updateAccountProfile: (state, action) => {
      // Update specific account fields without affecting login status
      if (state.account && Object.keys(state.account).length > 0) {
        state.account = {
          ...state.account,
          ...action.payload
        };
        
        const updatedAccount = { 
          ...state.account, 
          isLoggedIn: state.isLoggedIn 
        };
        localStorage.setItem('account', JSON.stringify(updatedAccount));
      }
    },
    setProfileData: (state, action) => {
      state.profileData = action.payload;
    },
  },
});

export const {
  setOpenDMenu,
  setCloseDMenu,
  setDFeature,
  setAccount,
  setAccountAfterRegister,
  LogOut,
  setTheme,
  setCredits,
  updateAccountProfile,
  setProfileData
} = DashboardSlice.actions;

// Selectors
export const dashboardMenuState = (state) => state.dashboard.dashboardMenuState;
export const dashboardFeature = (state) => state.dashboard.dashboardFeature;
export const isUserLoggedIn = (state) => state.dashboard.isLoggedIn;
export const selectAccount = (state) => state.dashboard.account;
export const selectProfileData = (state) => state.dashboard.profileData;
export const selectTheme = (state) => state.dashboard.theme;
export const selectCredits = (state) => state.dashboard.credits;

export default DashboardSlice.reducer;