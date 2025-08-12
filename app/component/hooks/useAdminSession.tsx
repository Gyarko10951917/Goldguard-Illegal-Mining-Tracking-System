"use client";

import { useEffect, useState } from 'react';

interface AdminData {
  name: string;
  initials: string;
  role: string;
  email?: string;
  loginTime?: string;
}

export function useAdminSession() {
  const [currentAdmin, setCurrentAdmin] = useState<AdminData>({
    name: "Administrator",
    initials: "AD",
    role: "Administrator"
  });

  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const loadAdminDetails = () => {
      if (typeof window !== 'undefined') {
        try {
          const adminSession = localStorage.getItem('goldguard_admin_session');
          if (adminSession) {
            // Check if it's valid JSON first
            if (adminSession.startsWith('{') && adminSession.endsWith('}')) {
              const adminData = JSON.parse(adminSession);
              if (adminData.name) {
                const nameParts = adminData.name.split(' ');
                const initials = nameParts.length >= 2 
                  ? (nameParts[0][0] + nameParts[1][0]).toUpperCase()
                  : adminData.name.substring(0, 2).toUpperCase();
                
                setCurrentAdmin({
                  name: adminData.name,
                  initials: initials,
                  role: adminData.role || "Administrator",
                  email: adminData.email,
                  loginTime: adminData.loginTime
                });
              }
            } else {
              // Clear invalid session data
              localStorage.removeItem('goldguard_admin_session');
              localStorage.removeItem('goldguard_admin_timestamp');
              console.log('Invalid session data cleared');
            }
          }
        } catch (error) {
          console.error('Error parsing admin session:', error);
          // Clear corrupted session data
          localStorage.removeItem('goldguard_admin_session');
          localStorage.removeItem('goldguard_admin_timestamp');
        } finally {
          setIsLoading(false);
        }
      } else {
        setIsLoading(false);
      }
    };
    
    loadAdminDetails();
  }, []);

  return { currentAdmin, isLoading };
}
