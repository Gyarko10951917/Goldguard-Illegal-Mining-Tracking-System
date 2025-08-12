"use client";
import { Eye, EyeOff, Lock, Shield } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';

// Simple password hashing function (same as in management page)
const hashPassword = (password: string): string => {
  try {
    // Simple base64 encoding with salt (for demo purposes)
    // In production, use bcrypt or similar
    const salt = 'goldguard_salt_2024';
    return btoa(salt + password + salt);
  } catch (error) {
    console.error('Error hashing password:', error);
    return '';
  }
};

// Initialize admin data if not exists
const initializeAdminData = () => {
  try {
    const storedAdmins = localStorage.getItem('goldguard_admins');
    if (!storedAdmins) {
      const mockAdmins = [
        {
          id: 1,
          name: 'John Doe',
          email: 'john.doe@goldguard.gov.gh',
          passwordHash: hashPassword('AdminPass123!'),
          role: 'Super Admin',
          regions: ['All Regions'],
          status: 'Active',
          createdAt: '2024-01-01',
          lastLogin: '2024-08-06'
        },
        {
          id: 2,
          name: 'Jane Smith',
          email: 'jane.smith@goldguard.gov.gh',
          passwordHash: hashPassword('RegionalPass123!'),
          role: 'Regional Admin',
          regions: ['Ashanti', 'Eastern'],
          status: 'Active',
          createdAt: '2024-02-15',
          lastLogin: '2024-08-05'
        }
      ];
      localStorage.setItem('goldguard_admins', JSON.stringify(mockAdmins));
      console.log('Initialized admin data:', mockAdmins);
    }
  } catch (error) {
    console.error('Error initializing admin data:', error);
  }
};

export default function SystemAdminAccess() {
  const router = useRouter();
  const [credentials, setCredentials] = useState({
    username: '',
    password: ''
  });
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  // Admin interface for TypeScript
  interface AdminCredential {
    id: number;
    name: string;
    email: string;
    passwordHash: string;
    role: string;
    status: 'Active' | 'Inactive';
    lastLogin?: string;
  }

  // Demo credentials - In production, this should be handled by a secure backend
  const ADMIN_CREDENTIALS = {
    username: 'goldguard_admin',
    password: 'GG2024@SecureAccess!'
  };

  // Initialize admin data on component mount
  useEffect(() => {
    // Only initialize if we're in the browser (client-side)
    if (typeof window !== 'undefined') {
      initializeAdminData();
    }
  }, []);

  // Function to verify admin credentials against stored admins
  const verifyAdminCredentials = (email: string, password: string): boolean => {
    try {
      // Check if we're in browser environment
      if (typeof window === 'undefined') {
        return false;
      }

      console.log('Verifying credentials for:', email); // Debug log
      
      const storedAdmins = localStorage.getItem('goldguard_admins');
      console.log('Stored admins:', storedAdmins); // Debug log
      
      if (storedAdmins) {
        const admins = JSON.parse(storedAdmins);
        console.log('Parsed admins:', admins); // Debug log
        
        const admin = admins.find((a: AdminCredential) => a.email.toLowerCase() === email.toLowerCase());
        console.log('Found admin:', admin); // Debug log
        
        if (admin) {
          const hashedInputPassword = hashPassword(password);
          console.log('Input password hash:', hashedInputPassword); // Debug log
          console.log('Stored password hash:', admin.passwordHash); // Debug log
          console.log('Status check:', admin.status); // Debug log
          
          if (admin.passwordHash === hashedInputPassword && admin.status === 'Active') {
            // Update last login
            admin.lastLogin = new Date().toISOString().split('T')[0];
            localStorage.setItem('goldguard_admins', JSON.stringify(admins));
            return true;
          }
        }
      }
      return false;
    } catch (error) {
      console.error('Error verifying credentials:', error);
      return false;
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError('');

    try {
      // Validate input
      if (!credentials.username.trim() || !credentials.password.trim()) {
        setError('Please enter both username/email and password.');
        setIsLoading(false);
        return;
      }

      // Simulate authentication delay
      await new Promise(resolve => setTimeout(resolve, 1000));

      console.log('Login attempt:', { username: credentials.username, password: '[HIDDEN]' }); // Debug log with password hidden

      // Check demo admin credentials (backward compatibility)
      const isDemoAdmin = credentials.username === ADMIN_CREDENTIALS.username && 
                          credentials.password === ADMIN_CREDENTIALS.password;

      console.log('Demo admin check:', isDemoAdmin); // Debug log

      // Check against stored admin credentials (email-based login)
      const isStoredAdmin = verifyAdminCredentials(credentials.username, credentials.password);

      console.log('Stored admin check:', isStoredAdmin); // Debug log

      if (isDemoAdmin || isStoredAdmin) {
        console.log('Login successful'); // Debug log
        
        // Prepare admin data for session
        let adminData;
        if (isStoredAdmin) {
          // Get admin info from stored admins
          const storedAdmins = localStorage.getItem('goldguard_admins');
          if (storedAdmins) {
            const admins = JSON.parse(storedAdmins);
            const admin = admins.find((a: AdminCredential) => a.email.toLowerCase() === credentials.username.toLowerCase());
            if (admin) {
              adminData = {
                email: admin.email,
                name: admin.name,
                role: admin.role,
                loginTime: new Date().toISOString()
              };
            }
          }
        } else {
          // Demo admin data
          adminData = {
            email: "demo@goldguard.gov.gh",
            name: "Demo Administrator", 
            role: "System Administrator",
            loginTime: new Date().toISOString()
          };
        }
        
        // Check if localStorage is available
        if (typeof window !== 'undefined' && window.localStorage) {
          // Store admin session data in JSON format (for useAdminSession compatibility)
          if (adminData) {
            localStorage.setItem('goldguard_admin_session', JSON.stringify(adminData));
            localStorage.setItem('goldguard_admin_timestamp', new Date().toISOString());
            console.log('Session set with admin data:', adminData);
          } else {
            // Fallback
            const fallbackData = {
              email: credentials.username,
              name: "Administrator",
              role: "Administrator", 
              loginTime: new Date().toISOString()
            };
            localStorage.setItem('goldguard_admin_session', JSON.stringify(fallbackData));
            localStorage.setItem('goldguard_admin_timestamp', new Date().toISOString());
            console.log('Session set with fallback data:', fallbackData);
          }
          
          // Store current admin info for backward compatibility
          if (isStoredAdmin) {
            localStorage.setItem('goldguard_current_admin', credentials.username);
          } else {
            localStorage.setItem('goldguard_current_admin', 'demo_admin');
          }
          
          // Verify the session was set correctly
          const verifySession = localStorage.getItem('goldguard_admin_session');
          console.log('Session verification:', verifySession);
          
          console.log('Redirecting to admin dashboard...');
          // Use setTimeout to ensure localStorage is fully set
          setTimeout(() => {
            router.push('/admin-dashboard');
          }, 100);
        } else {
          setError('Browser storage not available. Please check your browser settings.');
        }
        setIsLoading(false);
      } else {
        console.log('Login failed'); // Debug log
        setError('Invalid credentials. Please check your username/email and password.');
        setIsLoading(false);
      }
    } catch (error) {
      console.error('Login error:', error);
      setError('An error occurred during login. Please try again.');
      setIsLoading(false);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    try {
      if (e.key === 'Escape') {
        router.push('/');
      }
    } catch (error) {
      console.error('Error handling key press:', error);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-gray-800 to-black flex items-center justify-center p-4">
      <div className="max-w-md w-full">
        {/* Warning Banner */}
        <div className="bg-red-900 border border-red-700 rounded-lg p-4 mb-6 text-center">
          <Shield className="w-8 h-8 text-red-400 mx-auto mb-2" />
          <h2 className="text-red-400 font-bold text-sm">RESTRICTED ACCESS</h2>
          <p className="text-red-300 text-xs">Authorized Personnel Only</p>
        </div>

        {/* Login Form */}
        <div className="bg-gray-800 rounded-lg shadow-2xl p-8 border border-gray-700">
          <div className="text-center mb-8">
            <Lock className="w-12 h-12 text-yellow-400 mx-auto mb-4" />
            <h1 className="text-2xl font-bold text-white">System Access</h1>
            <p className="text-gray-400 text-sm">Ghana Gold Guard Administration</p>
          </div>

          <form onSubmit={handleSubmit} onKeyDown={handleKeyPress}>
            <div className="space-y-4">
              <div>
                <label htmlFor="username" className="block text-sm font-medium text-gray-300 mb-2">
                  Username / Email
                </label>
                <input
                  id="username"
                  type="text"
                  value={credentials.username}
                  onChange={(e) => setCredentials({ ...credentials, username: e.target.value })}
                  className="w-full px-4 py-3 bg-gray-700 border border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-yellow-500 focus:border-transparent text-white placeholder-gray-400"
                  placeholder="Enter username or email"
                  required
                  autoComplete="username"
                />
                <p className="text-xs text-gray-400 mt-1">
                  Use admin username or registered email address
                </p>
              </div>

              <div>
                <label htmlFor="password" className="block text-sm font-medium text-gray-300 mb-2">
                  Password
                </label>
                <div className="relative">
                  <input
                    id="password"
                    type={showPassword ? 'text' : 'password'}
                    value={credentials.password}
                    onChange={(e) => setCredentials({ ...credentials, password: e.target.value })}
                    className="w-full px-4 py-3 bg-gray-700 border border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-yellow-500 focus:border-transparent text-white placeholder-gray-400 pr-12"
                    placeholder="Enter password"
                    required
                    autoComplete="current-password"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-300 focus:outline-none focus:text-gray-300"
                    aria-label={showPassword ? 'Hide password' : 'Show password'}
                    tabIndex={-1}
                  >
                    {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                  </button>
                </div>
              </div>

              {error && (
                <div className="bg-red-900 border border-red-700 rounded-lg p-3">
                  <p className="text-red-400 text-sm text-center">{error}</p>
                </div>
              )}

              <button
                type="submit"
                disabled={isLoading}
                className={`w-full py-3 px-4 rounded-lg font-medium transition-colors ${
                  isLoading
                    ? 'bg-gray-600 cursor-not-allowed text-gray-400'
                    : 'bg-yellow-600 hover:bg-yellow-700 text-white'
                }`}
              >
                {isLoading ? (
                  <div className="flex items-center justify-center">
                    <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white mr-2"></div>
                    Authenticating...
                  </div>
                ) : (
                  'Access System'
                )}
              </button>
            </div>
          </form>

          <div className="mt-6 text-center">
            <button
              onClick={() => router.push('/')}
              className="text-gray-400 hover:text-gray-300 text-sm"
            >
              ← Return to Main Site
            </button>
          </div>
        </div>

        <div className="text-center mt-6">
          <p className="text-gray-500 text-xs">
            Press ESC to return to main site
          </p>
        </div>
      </div>
    </div>
  );
}
