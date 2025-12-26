// src/hooks/useAuth.tsx
import React, { createContext, useContext, useState, ReactNode } from 'react';
import { UserProfile, AppRole } from '../backend';

// Tipe data untuk state Auth
interface AuthContextType {
  user: UserProfile | null;
  login: (username: string, role: AppRole) => Promise<void>;
  logout: () => void;
  isAuthenticated: boolean;
  isLoading: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [user, setUser] = useState<UserProfile | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(false);

  // Fungsi Login Simulasi (Ganti dengan API call nanti)
  const login = async (username: string, role: AppRole) => {
    setIsLoading(true);
    
    // Simulasi delay jaringan
    await new Promise(resolve => setTimeout(resolve, 1000));

    // Set user dummy berdasarkan input
    const dummyUser: UserProfile = {
      name: username || "User",
      role: role,
      outletId: BigInt(1), // Default outlet ID
    };

    setUser(dummyUser);
    setIsLoading(false);
  };

  const logout = () => {
    setUser(null);
  };

  return (
    <AuthContext.Provider 
      value={{ 
        user, 
        login, 
        logout, 
        isAuthenticated: !!user,
        isLoading 
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

// Custom Hook untuk menggunakan Auth
export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};