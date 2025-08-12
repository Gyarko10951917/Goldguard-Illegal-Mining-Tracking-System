"use client";
import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';

interface AdminProtectionProps {
  children: React.ReactNode;
}

export default function AdminProtection({ children }: AdminProtectionProps) {
  const router = useRouter();
  const [isAuthenticated, setIsAuthenticated] = useState<boolean | null>(null);

  useEffect(() => {
    const checkAuthentication = () => {
      const session = localStorage.getItem('goldguard_admin_session');
      const timestamp = localStorage.getItem('goldguard_admin_timestamp');
      
      console.log('AdminProtection - Session check:', { session, timestamp });
      
      if (!session) {
        console.log('AdminProtection - No session found, redirecting to home');
        setIsAuthenticated(false);
        router.push('/');
        return;
      }

      // Check if it's valid session (either 'authenticated' string or JSON format)
      let isValidSession = false;
      try {
        if (session === 'authenticated') {
          // Old string format
          isValidSession = true;
          console.log('AdminProtection - Valid legacy session');
        } else if (session.startsWith('{') && session.endsWith('}')) {
          // New JSON format
          const adminData = JSON.parse(session);
          isValidSession = adminData && adminData.email && adminData.name;
          console.log('AdminProtection - Valid JSON session:', isValidSession);
        }
      } catch (error) {
        console.error('AdminProtection - Session validation error:', error);
        isValidSession = false;
      }

      if (!isValidSession) {
        console.log('AdminProtection - Invalid session, redirecting to home');
        setIsAuthenticated(false);
        router.push('/');
        return;
      }

      // Check if session is expired (24 hours)
      if (timestamp) {
        let sessionTime;
        if (timestamp.includes('-')) {
          // ISO string format
          sessionTime = new Date(timestamp).getTime();
        } else {
          // Timestamp format
          sessionTime = parseInt(timestamp);
        }
        
        const currentTime = Date.now();
        const twentyFourHours = 24 * 60 * 60 * 1000; // 24 hours in milliseconds

        if (currentTime - sessionTime > twentyFourHours) {
          // Session expired
          console.log('AdminProtection - Session expired, redirecting to home');
          localStorage.removeItem('goldguard_admin_session');
          localStorage.removeItem('goldguard_admin_timestamp');
          setIsAuthenticated(false);
          router.push('/');
          return;
        }
      }

      console.log('AdminProtection - Authentication successful');
      setIsAuthenticated(true);
    };

    checkAuthentication();
  }, [router]);

  // Show loading while checking authentication
  if (isAuthenticated === null) {
    return (
      <div className="min-h-screen bg-gray-900 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-yellow-400 mx-auto mb-4"></div>
          <p className="text-white">Verifying access...</p>
        </div>
      </div>
    );
  }

  // If not authenticated, return null (redirect is handled in useEffect)
  if (!isAuthenticated) {
    return null;
  }

  // If authenticated, render the protected content
  return <>{children}</>;
}
