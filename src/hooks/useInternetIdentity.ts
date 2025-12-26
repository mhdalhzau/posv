import React from 'react';

export const useInternetIdentity = () => {
  return {
    login: () => console.log("Login clicked (Dummy)"),
    logout: () => console.log("Logout clicked (Dummy)"),
    identity: null,
    isAuthenticated: false,
    isLoggingIn: false
  };
};

// Kita ubah return-nya agar valid di file .ts (tanpa kurung siku HTML)
export const InternetIdentityProvider = ({ children }: { children: React.ReactNode }) => {
  return children; 
};