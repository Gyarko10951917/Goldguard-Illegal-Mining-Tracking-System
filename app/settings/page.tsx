"use client";
import { Briefcase, Eye, LayoutDashboard, LogOut, Settings as LucideSettings, Users } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import React from "react";
import AdminProtection from "../component/AdminProtection";
import { useTheme } from "../component/ThemeContext";
import { useAdminSession } from "../component/hooks/useAdminSession";
import AdminNavBar from "../component/landingpage/AdminNavBar";
import Footer from "../component/landingpage/footer";

import { Bell, Database, Globe, Mail, Save, Shield } from 'lucide-react';

export default function SettingsPage() {
  const router = useRouter();
  const [activeSection, setActiveSection] = React.useState("settings");
  const { currentAdmin } = useAdminSession();
  const [notifications, setNotifications] = React.useState<Array<{
    id: number;
    message: string;
    type: 'success' | 'error' | 'info';
    timestamp: number;
  }>>([]);
  

  const sidebarItems = [
    { id: "dashboard", label: "Dashboard", href: "/admin-dashboard", icon: LayoutDashboard },
    { id: "cases", label: "Cases", href: "/cases", icon: Briefcase },
    { id: "imageanalysis", label: "Image Analysis", href: "/imageanalysis", icon: Eye },
    { id: "management", label: "Management", href: "/management", icon: Users },
    { id: "settings", label: "Settings", href: "/settings", icon: LucideSettings },
    { id: "logout", label: "Logout", href: "#", icon: LogOut, action: () => {
      // Clear admin session
      localStorage.removeItem('goldguard_admin_session');
      localStorage.removeItem('goldguard_admin_timestamp');
      // Redirect to main page instead of admin login
      router.push("/");
    }},
  ];
  const { theme, setTheme, alertNotifications, setAlertNotifications } = useTheme();

  // Notification helper functions
  const addNotification = React.useCallback((message: string, type: 'success' | 'error' | 'info' = 'success') => {
    const id = Date.now();
    setNotifications(prev => [...prev, { id, message, type, timestamp: id }]);
    
    // Auto-remove notification after 3 seconds
    setTimeout(() => {
      setNotifications(prev => prev.filter(notif => notif.id !== id));
    }, 3000);
  }, []);

  const removeNotification = React.useCallback((id: number) => {
    setNotifications(prev => prev.filter(notif => notif.id !== id));
  }, []);



  const [settings, setSettings] = React.useState({
    emailNotifications: false,
    smsNotifications: false,
    pushNotifications: false,
    weeklyReports: false,
    systemMaintenance: false,
    dataRetention: '7',
    backupFrequency: 'daily',
    timezone: 'Africa/Accra',
    language: 'en',
    theme: theme || 'light',
  });

  // Load settings from localStorage on component mount
  React.useEffect(() => {
    const loadSettings = () => {
      try {
        const savedSettings = localStorage.getItem('goldguard_admin_settings');
        if (savedSettings) {
          const parsedSettings = JSON.parse(savedSettings);
          setSettings(prev => ({
            ...prev,
            ...parsedSettings,
            theme: theme || parsedSettings.theme || 'light'
          }));
        }
      } catch (error) {
        console.error('Error loading settings from localStorage:', error);
      }
    };
    loadSettings();
  }, [theme]);

  const handleSettingChange = (key: string, value: boolean | string) => {
    const newSettings = { ...settings, [key]: value };
    setSettings(newSettings);
    
    // Handle theme changes
    if (key === 'theme' && (value === 'light' || value === 'dark' || value === 'taupe')) {
      setTheme(value);
      addNotification(`Theme changed to ${value} mode successfully!`, 'success');
      // Save theme immediately to localStorage
      localStorage.setItem('goldguard_theme', value);
    } else if (key === 'theme' && value === 'auto') {
      // For auto mode, we could implement system preference detection
      // For now, default to light mode
      setTheme('light');
      addNotification('Theme set to auto mode (defaulting to light)', 'info');
      localStorage.setItem('goldguard_theme', 'light');
    }
    
    // Handle notification settings
    if (key === 'emailNotifications') {
      addNotification(
        value ? 'Email notifications enabled' : 'Email notifications disabled', 
        'success'
      );
    } else if (key === 'smsNotifications') {
      addNotification(
        value ? 'SMS notifications enabled' : 'SMS notifications disabled', 
        'success'
      );
    } else if (key === 'pushNotifications') {
      addNotification(
        value ? 'Push notifications enabled' : 'Push notifications disabled', 
        'success'
      );
      // Update global alert notifications setting
      setAlertNotifications(value as boolean);
      localStorage.setItem('goldguard_alert_notifications', value.toString());
    } else if (key === 'weeklyReports') {
      addNotification(
        value ? 'Weekly reports enabled' : 'Weekly reports disabled', 
        'success'
      );
    } else if (key === 'systemMaintenance') {
      addNotification(
        value ? 'Maintenance mode activated' : 'Maintenance mode deactivated', 
        value ? 'info' : 'success'
      );
    }
    
    // Auto-save individual settings changes
    try {
      localStorage.setItem('goldguard_admin_settings', JSON.stringify(newSettings));
    } catch (error) {
      console.error('Error auto-saving settings:', error);
    }
  };

  const [showPrompt, setShowPrompt] = React.useState(false);
  const handleSave = () => {
    try {
      // Save settings to localStorage
      localStorage.setItem('goldguard_admin_settings', JSON.stringify(settings));
      
      // Also save theme and notification preferences separately for global access
      localStorage.setItem('goldguard_theme', settings.theme);
      localStorage.setItem('goldguard_alert_notifications', settings.pushNotifications.toString());
      
      // Update theme context if needed
      if (settings.theme !== theme) {
        setTheme(settings.theme as 'light' | 'dark' | 'taupe');
      }
      
      // Show both the modal and toast notification
      setShowPrompt(true);
      addNotification('All settings saved successfully!', 'success');
      setTimeout(() => setShowPrompt(false), 2000);
    } catch (error) {
      console.error('Error saving settings:', error);
      addNotification('Error saving settings. Please try again.', 'error');
    }
  };

  return (
    <AdminProtection>
      <div className={`min-h-screen ${theme === "dark" ? "bg-gray-900 text-white" : theme === "taupe" ? "bg-[#f5f3ef] text-gray-800" : "bg-white text-gray-800"}`}>
      <AdminNavBar adminInitials={currentAdmin.initials} />
      <div className="flex pt-16">
        {/* Sidebar */}
        <div className={`w-64 min-h-screen p-4 border-r ${theme === "dark" ? "bg-gray-800 border-gray-700" : theme === "taupe" ? "bg-[#d8cfc4] border-[#b8b0a1]" : "bg-white border-gray-200"}`}> 
          <div className="mb-8">
            <div className="flex items-center space-x-3 mb-6">
              <div className="w-10 h-10 bg-[#ffe066] rounded-full flex items-center justify-center">
                <span className="text-[#2a260f] font-semibold">{currentAdmin.initials}</span>
              </div>
              <div>
                <h3 className="font-semibold text-[#2a260f]">{currentAdmin.name}</h3>
                <p className="text-sm text-[#6e6657]">{currentAdmin.role}</p>
              </div>
            </div>
          </div>
          <nav className="space-y-2">
            {sidebarItems.map((item) => (
              <div key={item.id}>
                {item.action ? (
                  <button
                    onClick={item.action}
                    className={`w-full flex items-center px-3 py-2 rounded-lg transition-colors font-semibold ${
                      activeSection === item.id
                        ? "bg-[#b8b0a1] text-[#2a260f] shadow-md"
                        : "hover:bg-[#e6e0d6] text-[#2a260f]"
                    }`}
                  >
                    {item.icon && <item.icon className="w-5 h-5 mr-2" />}
                    <span>{item.label}</span>
                  </button>
                ) : (
                  <Link
                    href={item.href}
                    className={`flex items-center px-3 py-2 rounded-lg transition-colors font-semibold ${
                      activeSection === item.id
                        ? "bg-[#b8b0a1] text-[#2a260f] shadow-md"
                        : "hover:bg-[#e6e0d6] text-[#2a260f]"
                    }`}
                    onClick={() => setActiveSection(item.id)}
                  >
                    {item.icon && <item.icon className="w-5 h-5 mr-2" />}
                    <span>{item.label}</span>
                  </Link>
                )}
              </div>
            ))}
          </nav>
        </div>
        {/* Main Content */}
        <div className="flex-1 p-6 space-y-6">
          <div>
            <h2 className={`text-2xl font-bold ${
              theme === "dark" ? "text-white" : "text-gray-900"
            }`}>System Settings</h2>
            <p className={`${
              theme === "dark" ? "text-gray-300" : "text-gray-600"
            }`}>Configure system preferences and notifications</p>
          </div>

          {/* Notification Settings */}
          <div className={`rounded-lg shadow-sm border p-6 ${
            theme === "dark" ? "bg-gray-800 border-gray-700" : theme === "taupe" ? "bg-[#f8f6f2] border-[#d8cfc4]" : "bg-white border-gray-200"
          }`}>
            <div className="flex items-center mb-4">
              <Bell className="w-6 h-6 text-amber-600 mr-2" />
              <h3 className={`text-lg font-semibold ${
                theme === "dark" ? "text-white" : "text-gray-900"
              }`}>Notification Settings</h3>
            </div>
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <h4 className={`font-medium ${
                    theme === "dark" ? "text-gray-200" : "text-gray-900"
                  }`}>Email Notifications</h4>
                  <p className={`text-sm ${
                    theme === "dark" ? "text-gray-400" : "text-gray-500"
                  }`}>Receive email alerts for new reports</p>
                </div>
                <label className="relative inline-flex items-center cursor-pointer">
                  <input
                    type="checkbox"
                    checked={settings.emailNotifications}
                    onChange={(e) => handleSettingChange('emailNotifications', e.target.checked)}
                    className="sr-only peer"
                    title="Enable email notifications"
                  />
                  <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-amber-600"></div>
                </label>
              </div>
              <div className="flex items-center justify-between">
                <div>
                  <h4 className={`font-medium ${
                    theme === "dark" ? "text-gray-200" : "text-gray-900"
                  }`}>SMS Notifications</h4>
                  <p className={`text-sm ${
                    theme === "dark" ? "text-gray-400" : "text-gray-500"
                  }`}>Receive SMS alerts for urgent reports</p>
                </div>
                <label className="relative inline-flex items-center cursor-pointer">
                  <input
                    type="checkbox"
                    checked={settings.smsNotifications}
                    onChange={(e) => handleSettingChange('smsNotifications', e.target.checked)}
                    className="sr-only peer"
                    title="Enable SMS notifications"
                  />
                  <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-amber-600"></div>
                </label>
              </div>
              <div className="flex items-center justify-between">
                <div>
                  <h4 className={`font-medium ${
                    theme === "dark" ? "text-gray-200" : "text-gray-900"
                  }`}>Push Notifications</h4>
                  <p className={`text-sm ${
                    theme === "dark" ? "text-gray-400" : "text-gray-500"
                  }`}>Browser push notifications</p>
                </div>
                <label className="relative inline-flex items-center cursor-pointer">
                  <input
                    type="checkbox"
                    checked={settings.pushNotifications}
                    onChange={(e) => handleSettingChange('pushNotifications', e.target.checked)}
                    className="sr-only peer"
                    title="Enable push notifications"
                  />
                  <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-amber-600"></div>
                </label>
              </div>
              <div className="flex items-center justify-between">
                <div>
                  <h4 className={`font-medium ${
                    theme === "dark" ? "text-gray-200" : "text-gray-900"
                  }`}>Weekly Reports</h4>
                  <p className={`text-sm ${
                    theme === "dark" ? "text-gray-400" : "text-gray-500"
                  }`}>Receive weekly summary reports</p>
                </div>
                <label className="relative inline-flex items-center cursor-pointer">
                  <input
                    type="checkbox"
                    checked={settings.weeklyReports}
                    onChange={(e) => handleSettingChange('weeklyReports', e.target.checked)}
                    className="sr-only peer"
                    title="Enable weekly reports"
                  />
                  <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-amber-600"></div>
                </label>
              </div>
              {/* Alert Notifications (from ThemeContext) */}
              <div className="flex items-center justify-between">
                <div>
                  <h4 className={`font-medium ${
                    theme === "dark" ? "text-gray-200" : "text-gray-900"
                  }`}>Alert Notifications</h4>
                  <p className={`text-sm ${
                    theme === "dark" ? "text-gray-400" : "text-gray-500"
                  }`}>Show alert bell for new reported cases (Dashboard)</p>
                </div>
                <label className="relative inline-flex items-center cursor-pointer">
                  <input
                    type="checkbox"
                    checked={alertNotifications}
                    onChange={e => {
                      setAlertNotifications(e.target.checked);
                      addNotification(
                        e.target.checked ? 'Alert notifications enabled' : 'Alert notifications disabled', 
                        'success'
                      );
                    }}
                    className="sr-only peer"
                    aria-label="Enable alert notifications"
                    title="Enable alert notifications"
                  />
                  <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-amber-600"></div>
                </label>
              </div>
            </div>
          </div>

          {/* Theme Selection */}
          <div className={`rounded-lg shadow-sm border p-6 ${
            theme === "dark" ? "bg-gray-800 border-gray-700" : theme === "taupe" ? "bg-[#f8f6f2] border-[#d8cfc4]" : "bg-white border-gray-200"
          }`}>
            <div className="flex items-center mb-4">
              <Globe className="w-6 h-6 text-amber-600 mr-2" />
              <h3 className={`text-lg font-semibold ${
                theme === "dark" ? "text-white" : "text-gray-900"
              }`}>Theme Selection</h3>
            </div>
            <p className={`text-sm mb-6 ${
              theme === "dark" ? "text-gray-400" : "text-gray-600"
            }`}>Choose your preferred theme for the admin dashboard</p>
            
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {/* Light Theme */}
              <div 
                onClick={() => handleSettingChange('theme', 'light')}
                className={`p-4 border-2 rounded-lg cursor-pointer transition-all hover:shadow-md ${
                  settings.theme === 'light' 
                    ? 'border-amber-500 bg-amber-50' 
                    : theme === "dark" 
                      ? "border-gray-600 bg-gray-700 hover:border-gray-500" 
                      : "border-gray-300 bg-white hover:border-gray-400"
                }`}
              >
                <div className="flex items-center justify-between mb-3">
                  <h4 className={`font-semibold ${
                    theme === "dark" ? "text-white" : "text-gray-900"
                  }`}>Light Theme</h4>
                  {settings.theme === 'light' && (
                    <div className="w-4 h-4 bg-amber-500 rounded-full flex items-center justify-center">
                      <div className="w-2 h-2 bg-white rounded-full"></div>
                    </div>
                  )}
                </div>
                <div className="bg-white border border-gray-200 rounded p-2 mb-2">
                  <div className="h-2 bg-gray-100 rounded mb-1"></div>
                  <div className="h-2 bg-gray-200 rounded w-3/4"></div>
                </div>
                <p className={`text-xs ${
                  theme === "dark" ? "text-gray-400" : "text-gray-500"
                }`}>Clean and bright interface</p>
              </div>

              {/* Dark Theme */}
              <div 
                onClick={() => handleSettingChange('theme', 'dark')}
                className={`p-4 border-2 rounded-lg cursor-pointer transition-all hover:shadow-md ${
                  settings.theme === 'dark' 
                    ? 'border-amber-500 bg-amber-50' 
                    : theme === "dark" 
                      ? "border-gray-600 bg-gray-700 hover:border-gray-500" 
                      : "border-gray-300 bg-white hover:border-gray-400"
                }`}
              >
                <div className="flex items-center justify-between mb-3">
                  <h4 className={`font-semibold ${
                    theme === "dark" ? "text-white" : "text-gray-900"
                  }`}>Dark Theme</h4>
                  {settings.theme === 'dark' && (
                    <div className="w-4 h-4 bg-amber-500 rounded-full flex items-center justify-center">
                      <div className="w-2 h-2 bg-white rounded-full"></div>
                    </div>
                  )}
                </div>
                <div className="bg-gray-800 border border-gray-700 rounded p-2 mb-2">
                  <div className="h-2 bg-gray-700 rounded mb-1"></div>
                  <div className="h-2 bg-gray-600 rounded w-3/4"></div>
                </div>
                <p className={`text-xs ${
                  theme === "dark" ? "text-gray-400" : "text-gray-500"
                }`}>Easy on the eyes in low light</p>
              </div>

              {/* Taupe Theme */}
              <div 
                onClick={() => handleSettingChange('theme', 'taupe')}
                className={`p-4 border-2 rounded-lg cursor-pointer transition-all hover:shadow-md ${
                  settings.theme === 'taupe' 
                    ? 'border-amber-500 bg-amber-50' 
                    : theme === "dark" 
                      ? "border-gray-600 bg-gray-700 hover:border-gray-500" 
                      : "border-gray-300 bg-white hover:border-gray-400"
                }`}
              >
                <div className="flex items-center justify-between mb-3">
                  <h4 className={`font-semibold ${
                    theme === "dark" ? "text-white" : "text-gray-900"
                  }`}>Taupe Theme</h4>
                  {settings.theme === 'taupe' && (
                    <div className="w-4 h-4 bg-amber-500 rounded-full flex items-center justify-center">
                      <div className="w-2 h-2 bg-white rounded-full"></div>
                    </div>
                  )}
                </div>
                <div className="bg-[#f5f3ef] border border-[#d8cfc4] rounded p-2 mb-2">
                  <div className="h-2 bg-[#e6e0d6] rounded mb-1"></div>
                  <div className="h-2 bg-[#d8cfc4] rounded w-3/4"></div>
                </div>
                <p className={`text-xs ${
                  theme === "dark" ? "text-gray-400" : "text-gray-500"
                }`}>Warm and professional look</p>
              </div>
            </div>

            {/* Current Theme Display */}
            <div className="mt-6 p-4 bg-amber-50 border border-amber-200 rounded-lg">
              <div className="flex items-center">
                <div className="w-3 h-3 bg-amber-500 rounded-full mr-2"></div>
                <span className={`text-sm font-medium ${
                  theme === "dark" ? "text-gray-800" : "text-amber-800"
                }`}>
                  Current Theme: {settings.theme.charAt(0).toUpperCase() + settings.theme.slice(1)}
                </span>
              </div>
            </div>
          </div>

          {/* Security Settings */}
          <div className={`rounded-lg shadow-sm border p-6 ${
            theme === "dark" ? "bg-gray-800 border-gray-700" : theme === "taupe" ? "bg-[#f8f6f2] border-[#d8cfc4]" : "bg-white border-gray-200"
          }`}>
            <div className="flex items-center mb-4">
              <Shield className="w-6 h-6 text-amber-600 mr-2" />
              <h3 className={`text-lg font-semibold ${
                theme === "dark" ? "text-white" : "text-gray-900"
              }`}>Security Settings</h3>
            </div>
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <h4 className={`font-medium ${
                    theme === "dark" ? "text-gray-200" : "text-gray-900"
                  }`}>System Maintenance Mode</h4>
                  <p className={`text-sm ${
                    theme === "dark" ? "text-gray-400" : "text-gray-500"
                  }`}>Enable maintenance mode for system updates</p>
                </div>
                <label className="relative inline-flex items-center cursor-pointer">
                  <input
                    type="checkbox"
                    checked={settings.systemMaintenance}
                    onChange={(e) => handleSettingChange('systemMaintenance', e.target.checked)}
                    className="sr-only peer"
                    title="Enable system maintenance mode"
                  />
                  <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-red-600"></div>
                </label>
              </div>
            </div>
          </div>

          {/* Data Management */}
          <div className={`rounded-lg shadow-sm border p-6 ${
            theme === "dark" ? "bg-gray-800 border-gray-700" : theme === "taupe" ? "bg-[#f8f6f2] border-[#d8cfc4]" : "bg-white border-gray-200"
          }`}>
            <div className="flex items-center mb-4">
              <Database className="w-6 h-6 text-amber-600 mr-2" />
              <h3 className={`text-lg font-semibold ${
                theme === "dark" ? "text-white" : "text-gray-900"
              }`}>Data Management</h3>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className={`block text-sm font-medium mb-2 ${
                  theme === "dark" ? "text-gray-300" : "text-gray-700"
                }`}>
                  Data Retention Period (years)
                </label>
                <select
                  value={settings.dataRetention}
                  onChange={(e) => handleSettingChange('dataRetention', e.target.value)}
                  className={`w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-amber-500 ${
                    theme === "dark" ? "bg-gray-700 border-gray-600 text-white" : "bg-white border-gray-300 text-gray-900"
                  }`}
                  title="Select data retention period"
                >
                  <option value="1">1 Year</option>
                  <option value="3">3 Years</option>
                  <option value="5">5 Years</option>
                  <option value="7">7 Years</option>
                  <option value="10">10 Years</option>
                </select>
              </div>
              
              <div>
                <label className={`block text-sm font-medium mb-2 ${
                  theme === "dark" ? "text-gray-300" : "text-gray-700"
                }`}>
                  Backup Frequency
                </label>
                <select
                  value={settings.backupFrequency}
                  onChange={(e) => handleSettingChange('backupFrequency', e.target.value)}
                  className={`w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-amber-500 ${
                    theme === "dark" ? "bg-gray-700 border-gray-600 text-white" : "bg-white border-gray-300 text-gray-900"
                  }`}
                  title="Select backup frequency"
                >
                  <option value="hourly">Hourly</option>
                  <option value="daily">Daily</option>
                  <option value="weekly">Weekly</option>
                  <option value="monthly">Monthly</option>
                </select>
              </div>
            </div>
          </div>

          {/* System Preferences */}
          <div className={`rounded-lg shadow-sm border p-6 ${
            theme === "dark" ? "bg-gray-800 border-gray-700" : theme === "taupe" ? "bg-[#f8f6f2] border-[#d8cfc4]" : "bg-white border-gray-200"
          }`}>
            <div className="flex items-center mb-4">
              <Globe className="w-6 h-6 text-amber-600 mr-2" />
              <h3 className={`text-lg font-semibold ${
                theme === "dark" ? "text-white" : "text-gray-900"
              }`}>System Preferences</h3>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className={`block text-sm font-medium mb-2 ${
                  theme === "dark" ? "text-gray-300" : "text-gray-700"
                }`}>
                  Timezone
                </label>
                <select
                  value={settings.timezone}
                  onChange={(e) => handleSettingChange('timezone', e.target.value)}
                  className={`w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-amber-500 ${
                    theme === "dark" ? "bg-gray-700 border-gray-600 text-white" : "bg-white border-gray-300 text-gray-900"
                  }`}
                  title="Select timezone"
                >
                  <option value="Africa/Accra">Ghana (GMT)</option>
                  <option value="UTC">UTC</option>
                  <option value="America/New_York">Eastern Time</option>
                  <option value="Europe/London">London</option>
                </select>
              </div>
              
              <div>
                <label className={`block text-sm font-medium mb-2 ${
                  theme === "dark" ? "text-gray-300" : "text-gray-700"
                }`}>
                  Language
                </label>
                <select
                  value={settings.language}
                  onChange={(e) => handleSettingChange('language', e.target.value)}
                  className={`w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-amber-500 ${
                    theme === "dark" ? "bg-gray-700 border-gray-600 text-white" : "bg-white border-gray-300 text-gray-900"
                  }`}
                  title="Select language"
                >
                  <option value="en">English</option>
                  <option value="tw">Twi</option>
                  <option value="ga">Ga</option>
                  <option value="ee">Ewe</option>
                </select>
              </div>
            </div>
          </div>

          {/* Email Configuration */}
          <div className={`rounded-lg shadow-sm border p-6 ${
            theme === "dark" ? "bg-gray-800 border-gray-700" : theme === "taupe" ? "bg-[#f8f6f2] border-[#d8cfc4]" : "bg-white border-gray-200"
          }`}>
            <div className="flex items-center mb-4">
              <Mail className="w-6 h-6 text-amber-600 mr-2" />
              <h3 className={`text-lg font-semibold ${
                theme === "dark" ? "text-white" : "text-gray-900"
              }`}>Email Configuration</h3>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className={`block text-sm font-medium mb-2 ${
                  theme === "dark" ? "text-gray-300" : "text-gray-700"
                }`}>
                  SMTP Server
                </label>
                <input
                  type="text"
                  placeholder="smtp.gmail.com"
                  className={`w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-amber-500 ${
                    theme === "dark" ? "bg-gray-700 border-gray-600 text-white placeholder-gray-400" : "bg-white border-gray-300 text-gray-900"
                  }`}
                  title="SMTP server address"
                />
              </div>
              
              <div>
                <label className={`block text-sm font-medium mb-2 ${
                  theme === "dark" ? "text-gray-300" : "text-gray-700"
                }`}>
                  SMTP Port
                </label>
                <input
                  type="number"
                  placeholder="587"
                  className={`w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-amber-500 ${
                    theme === "dark" ? "bg-gray-700 border-gray-600 text-white placeholder-gray-400" : "bg-white border-gray-300 text-gray-900"
                  }`}
                  title="SMTP port number"
                />
              </div>
              
              <div>
                <label className={`block text-sm font-medium mb-2 ${
                  theme === "dark" ? "text-gray-300" : "text-gray-700"
                }`}>
                  From Email
                </label>
                <input
                  type="email"
                  placeholder="noreply@goldguard.gov.gh"
                  className={`w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-amber-500 ${
                    theme === "dark" ? "bg-gray-700 border-gray-600 text-white placeholder-gray-400" : "bg-white border-gray-300 text-gray-900"
                  }`}
                  title="From email address"
                />
              </div>
              
              <div>
                <label className={`block text-sm font-medium mb-2 ${
                  theme === "dark" ? "text-gray-300" : "text-gray-700"
                }`}>
                  From Name
                </label>
                <input
                  type="text"
                  placeholder="GoldGuard System"
                  className={`w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-amber-500 ${
                    theme === "dark" ? "bg-gray-700 border-gray-600 text-white placeholder-gray-400" : "bg-white border-gray-300 text-gray-900"
                  }`}
                  title="From name"
                />
              </div>
            </div>
          </div>

          {/* Save Button */}
          <div className="flex justify-end">
            <button
              onClick={handleSave}
              className="flex items-center space-x-2 bg-amber-600 hover:bg-amber-700 text-white px-6 py-3 rounded-lg transition-colors"
            >
              <Save className="w-5 h-5" />
              <span>Save Settings</span>
            </button>
          </div>
          {showPrompt && (
            <div className="fixed inset-0 flex items-center justify-center z-50">
              <div className={`rounded-lg shadow-lg p-6 border flex flex-col items-center ${
                theme === "dark" ? "bg-gray-800 border-gray-700" : theme === "taupe" ? "bg-[#f8f6f2] border-[#d8cfc4]" : "bg-white border-gray-200"
              }`}>
                <span className="text-amber-600 mb-2">
                  <Save className="w-8 h-8" />
                </span>
                <span className={`text-lg font-semibold mb-1 ${
                  theme === "dark" ? "text-white" : "text-gray-900"
                }`}>Settings Saved!</span>
                <span className={`${
                  theme === "dark" ? "text-gray-300" : "text-gray-600"
                }`}>Your changes have been saved successfully.</span>
              </div>
              <div className="fixed inset-0 bg-black opacity-30 z-40"></div>
            </div>
          )}
        </div>
      </div>

      {/* Toast Notifications */}
      <div className="fixed top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 z-50 space-y-2">
        {notifications.map((notification) => (
          <div
            key={notification.id}
            className={`max-w-md w-full shadow-xl rounded-lg pointer-events-auto ring-1 ring-black ring-opacity-5 overflow-hidden transform transition-all duration-500 ease-in-out animate-pulse ${
              notification.type === 'success' 
                ? 'bg-green-50 border-l-4 border-green-400' 
                : notification.type === 'error' 
                ? 'bg-red-50 border-l-4 border-red-400' 
                : 'bg-blue-50 border-l-4 border-blue-400'
            }`}
          >
            <div className="p-6">
              <div className="flex items-center justify-center">
                <div className="flex-shrink-0">
                  {notification.type === 'success' && (
                    <Save className="h-8 w-8 text-green-400" />
                  )}
                  {notification.type === 'error' && (
                    <Bell className="h-8 w-8 text-red-400" />
                  )}
                  {notification.type === 'info' && (
                    <Bell className="h-8 w-8 text-blue-400" />
                  )}
                </div>
                <div className="ml-4 flex-1 text-center">
                  <p className={`text-lg font-semibold ${
                    notification.type === 'success' 
                      ? 'text-green-800' 
                      : notification.type === 'error' 
                      ? 'text-red-800' 
                      : 'text-blue-800'
                  }`}>
                    {notification.type === 'success' && 'Success!'}
                    {notification.type === 'error' && 'Error!'}
                    {notification.type === 'info' && 'Info!'}
                  </p>
                  <p className={`mt-2 text-sm ${
                    notification.type === 'success' 
                      ? 'text-green-700' 
                      : notification.type === 'error' 
                      ? 'text-red-700' 
                      : 'text-blue-700'
                  }`}>
                    {notification.message}
                  </p>
                </div>
                <div className="ml-4 flex-shrink-0">
                  <button
                    className={`inline-flex rounded-md text-sm font-medium focus:outline-none focus:ring-2 focus:ring-offset-2 ${
                      notification.type === 'success' 
                        ? 'text-green-500 hover:text-green-600 focus:ring-green-500' 
                        : notification.type === 'error' 
                        ? 'text-red-500 hover:text-red-600 focus:ring-red-500' 
                        : 'text-blue-500 hover:text-blue-600 focus:ring-blue-500'
                    }`}
                    onClick={() => removeNotification(notification.id)}
                  >
                    <span className="sr-only">Close</span>
                    <svg className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                      <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
                    </svg>
                  </button>
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>

      <Footer />
    </div>
    </AdminProtection>
  );
}
