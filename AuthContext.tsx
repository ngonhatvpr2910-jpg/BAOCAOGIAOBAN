import React, { createContext, useContext, useState, useEffect } from 'react';
import { User, UserRole } from './types';
import { INITIAL_USERS } from './initialData';
import { StorageService } from './storage';

interface AuthContextType {
  currentUser: User;
  isAuthenticated: boolean;
  availableUsers: User[];
  loginWithPin: (userId: string, pin: string) => boolean;
  switchUser: (user: User) => void;
  logout: () => void;
  canEditDCBG: boolean;
  canEditDCRO: boolean;
  canManageSettings: boolean;
  canApproveBriefing: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [currentUser, setCurrentUser] = useState<User>(() => StorageService.getCurrentUser());
  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(true);

  useEffect(() => {
    StorageService.saveCurrentUser(currentUser);
  }, [currentUser]);

  const loginWithPin = (userId: string, pin: string): boolean => {
    // Standard PIN for demonstration is 1234 or 2026
    const targetUser = INITIAL_USERS.find(u => u.id === userId);
    if (targetUser && (pin === '1234' || pin === '2026' || pin.length >= 4)) {
      setCurrentUser(targetUser);
      setIsAuthenticated(true);
      return true;
    }
    return false;
  };

  const switchUser = (user: User) => {
    setCurrentUser(user);
    setIsAuthenticated(true);
  };

  const logout = () => {
    setIsAuthenticated(false);
  };

  const canEditDCBG = isAuthenticated && (currentUser.role === 'manager_pxlr' || currentUser.role === 'supervisor_dcbg' || currentUser.role === 'planner');
  const canEditDCRO = isAuthenticated && (currentUser.role === 'manager_pxlr' || currentUser.role === 'supervisor_dcro' || currentUser.role === 'planner');
  const canManageSettings = isAuthenticated && (currentUser.role === 'manager_pxlr' || currentUser.role === 'planner');
  const canApproveBriefing = isAuthenticated && (currentUser.role === 'manager_pxlr');

  return (
    <AuthContext.Provider
      value={{
        currentUser,
        isAuthenticated,
        availableUsers: INITIAL_USERS,
        loginWithPin,
        switchUser,
        logout,
        canEditDCBG,
        canEditDCRO,
        canManageSettings,
        canApproveBriefing,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
