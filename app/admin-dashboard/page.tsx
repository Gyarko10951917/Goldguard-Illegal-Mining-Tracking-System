"use client";

import { BarChart3, Briefcase, Calendar, Download, Edit, Eye, LayoutDashboard, LogOut, MapPin, Menu, Search, Settings, Trash2, TrendingUp, Users, X } from "lucide-react";
import dynamic from "next/dynamic";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import AdminProtection from "../component/AdminProtection";
import { useAdminSession } from "../component/hooks/useAdminSession";
import AdminNavBar from "../component/landingpage/AdminNavBar";
import Footer from "../component/landingpage/footer";
import { useTheme } from "../component/ThemeContext";

// Dynamically import the map component to avoid SSR issues
const DashboardMapLeaflet = dynamic(() => import("./DashboardMapLeaflet"), {
  ssr: false,
  loading: () => <div className="h-96 bg-gray-100 rounded-lg flex items-center justify-center">Loading map...</div>
});

export default function AdminDashboard() {
  const recentReportsRef = useRef<HTMLDivElement>(null);
  const { theme } = useTheme();
  const router = useRouter();
  const [activeSection, setActiveSection] = useState("dashboard");
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [isClient, setIsClient] = useState(false);
  const { currentAdmin } = useAdminSession();

  // Ensure client-side only rendering for map
  useEffect(() => {
    setIsClient(true);
  }, []);

  const handleLogout = () => {
    // Clear admin session
    localStorage.removeItem('goldguard_admin_session');
    localStorage.removeItem('goldguard_admin_timestamp');
    // Redirect to main page instead of admin login
    router.push("/");
  };

  type SidebarItem = {
    id: string;
    label: string;
    href: string;
    icon?: React.ComponentType<{ className?: string }>;
    action?: () => void;
  };

  const sidebarItems: SidebarItem[] = [
    { id: "dashboard", label: "Dashboard", href: "/admin-dashboard", icon: LayoutDashboard },
    { id: "cases", label: "Cases", href: "/cases", icon: Briefcase },
    { id: "imageanalysis", label: "Image Analysis", href: "/imageanalysis", icon: Eye },
    { id: "management", label: "Management", href: "/management", icon: Users },
    { id: "settings", label: "Settings", href: "/settings", icon: Settings },
    { id: "logout", label: "Logout", href: "#", icon: LogOut, action: handleLogout },
  ];

  const [search, setSearch] = useState("");
  const [selectedStatusFilter, setSelectedStatusFilter] = useState<string>("All");
  const [showFilteredReports, setShowFilteredReports] = useState<boolean>(false);
  
  // New Report model and mock data
  interface Report {
    id: string;
    region: string;
    type: string;
    status: 'Pending' | 'Active' | 'Solved' | 'Rejected' | 'New';
    date: string;
    severity: 'Low' | 'Medium' | 'High' | 'Critical';
    reporter: string;
    location: string;
    coordinates?: {
      latitude: number;
      longitude: number;
    } | null;
  }

  // Add missing state for selectedReport AFTER interface definition
  const [selectedReport, setSelectedReport] = useState<Report | null>(null);
  const [statusFilter, setStatusFilter] = useState<string>("All");
  const [regionFilter, setRegionFilter] = useState<string>("All");

  // Monthly trends analytics state
  const [analyticsData, setAnalyticsData] = useState<{
    monthlyClicks: number;
    lastUpdated: string;
    source: 'google-analytics' | 'database';
    trend: 'up' | 'down' | 'stable';
    percentage: number;
  }>({
    monthlyClicks: 0,
    lastUpdated: new Date().toISOString(),
    source: 'database',
    trend: 'stable',
    percentage: 0
  });
  
  const [isLoadingAnalytics, setIsLoadingAnalytics] = useState(false);

  // Dynamic reports data state
  const [reports, setReports] = useState<Report[]>([]);

  // Map cases will be derived from real reports data with actual coordinates
  const mapCases = reports.map(report => {
    // Use actual coordinates if available, otherwise use default Ghana coordinates
    let lat = 5.60 + (Math.random() - 0.5) * 3; // Default Ghana coordinates with some variation
    let lng = -0.20 + (Math.random() - 0.5) * 3;
    
    if (report.coordinates && report.coordinates.latitude && report.coordinates.longitude) {
      lat = report.coordinates.latitude;
      lng = report.coordinates.longitude;
    }
    
    return {
      id: report.id,
      region: report.region,
      type: report.type,
      status: report.status,
      lat,
      lng
    };
  });

  // Load reports from cases data
  useEffect(() => {
    const loadReportsFromCases = async () => {
      try {
        // Get admin token for authentication
        const adminSession = localStorage.getItem('goldguard_admin_session');
        const token = adminSession ? JSON.parse(adminSession).token : null;

        if (!token) {
          console.warn('No admin token found, loading mock data and localStorage reports');
          loadLocalStorageReports();
          return;
        }

        const response = await fetch('http://localhost:5000/api/cases', {
          method: 'GET',
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json',
          },
        });

        if (response.ok) {
          const result = await response.json();
          if (result.success && result.data.cases) {
            // Transform backend cases to reports format
            const transformedReports: Report[] = result.data.cases.map((backendCase: any) => ({
              id: backendCase.caseId,
              region: backendCase.region,
              type: backendCase.type,
              status: backendCase.status,
              date: new Date(backendCase.createdAt).toLocaleDateString(),
              severity: backendCase.priority,
              reporter: backendCase.reporter?.anonymous ? 'Anonymous' : 
                       backendCase.reporter?.name || 'Unknown',
              location: backendCase.location?.address || backendCase.region
            }));
            setReports(transformedReports);
          } else {
            console.warn('Backend response missing cases data, falling back to local data');
            loadLocalStorageReports();
          }
        } else {
          console.warn('Failed to fetch cases from backend, falling back to local data');
          loadLocalStorageReports();
        }
      } catch (error) {
        console.error('Error loading cases for dashboard:', error);
        loadLocalStorageReports();
      }
    };

    loadReportsFromCases();
  }, []);

  const loadLocalStorageReports = () => {
    try {
      // Load only real data from localStorage
      const savedReports = JSON.parse(localStorage.getItem('goldguard_reports') || '[]');
      const localReports: Report[] = savedReports.map((report: any) => ({
        id: report.id || `LOCAL-${Date.now()}`,
        region: report.region,
        type: report.type,
        status: report.status || 'New',
        date: new Date(report.submittedAt || Date.now()).toLocaleDateString(),
        severity: 'Medium',
        reporter: report.isAnonymous ? 'Anonymous' : report.fullName || 'Unknown',
        location: report.affectedArea || report.location?.address || report.region,
        // Preserve coordinates for map display
        coordinates: report.location && typeof report.location === 'object' ? {
          latitude: report.location.latitude,
          longitude: report.location.longitude
        } : null
      }));
      
      // Remove duplicates based on id
      const uniqueReports = localReports.reduce((acc: Report[], current: Report) => {
        const existingReport = acc.find(r => r.id === current.id);
        if (!existingReport) {
          acc.push(current);
        }
        return acc;
      }, []);
      
      setReports(uniqueReports);
    } catch (error) {
      console.error('Error loading localStorage reports:', error);
      // Set empty array if localStorage fails
      setReports([]);
    }
  };

  const filteredReports = reports.filter(
    (report) => {
      const matchesSearch = report.id.toLowerCase().includes(search.toLowerCase()) ||
        report.region.toLowerCase().includes(search.toLowerCase()) ||
        report.status.toLowerCase().includes(search.toLowerCase()) ||
        report.type.toLowerCase().includes(search.toLowerCase()) ||
        report.location.toLowerCase().includes(search.toLowerCase());
      
      const matchesStatus = (showFilteredReports && selectedStatusFilter !== "All" && selectedStatusFilter !== "Total"
        ? report.status === selectedStatusFilter
        : true) && (statusFilter === "All" ? true : report.status === statusFilter);
      
      const matchesRegion = regionFilter === "All" ? true : report.region === regionFilter;
      
      return matchesSearch && matchesStatus && matchesRegion;
    }
  );

  // Add missing helper functions
  function getStatusColor(status: Report["status"]): string {
    switch (status) {
      case "Solved": return "bg-green-100 text-green-800";
      case "Active": return "bg-yellow-100 text-yellow-800";
      case "Pending": return "bg-red-100 text-red-800";
      case "New": return "bg-blue-100 text-blue-800";
      case "Rejected": return "bg-gray-100 text-gray-800";
      default: return "bg-gray-100 text-gray-800";
    }
  }

  function getSeverityColor(severity: Report["severity"]): string {
    switch (severity) {
      case "Critical": return "bg-red-100 text-red-800";
      case "High": return "bg-orange-100 text-orange-800";
      case "Medium": return "bg-yellow-100 text-yellow-800";
      case "Low": return "bg-green-100 text-green-800";
      default: return "bg-gray-100 text-gray-800";
    }
  }

  // Live data calculation functions
  function getCasesByRegion() {
    const regionCount: Record<string, number> = {};
    reports.forEach(report => {
      regionCount[report.region] = (regionCount[report.region] || 0) + 1;
    });
    
    // Convert to array and sort by count descending
    return Object.entries(regionCount)
      .map(([region, count]) => ({ region, cases: count }))
      .sort((a, b) => b.cases - a.cases);
  }

  function getCasesByType() {
    const typeCount: Record<string, number> = {};
    reports.forEach(report => {
      typeCount[report.type] = (typeCount[report.type] || 0) + 1;
    });
    
    return Object.entries(typeCount)
      .map(([type, count]) => ({ type, cases: count }))
      .sort((a, b) => b.cases - a.cases);
  }

  function getCasesBySeverity() {
    const severityCount: Record<string, number> = {};
    reports.forEach(report => {
      severityCount[report.severity] = (severityCount[report.severity] || 0) + 1;
    });
    
    const severityOrder = ['Critical', 'High', 'Medium', 'Low'];
    return severityOrder.map(severity => ({
      severity,
      cases: severityCount[severity] || 0,
      percentage: reports.length > 0 ? Math.round((severityCount[severity] || 0) / reports.length * 100) : 0
    }));
  }

  // State for real cases data
  const [casesData, setCasesData] = useState<Report[]>([]);
  
  // Load cases data for dashboard statistics
  useEffect(() => {
    const loadCasesData = async () => {
      try {
        // Get admin token for authentication
        const adminSession = localStorage.getItem('goldguard_admin_session');
        const token = adminSession ? JSON.parse(adminSession).token : null;

        let allCases: Report[] = [];

        // Try to fetch from backend if token exists
        if (token) {
          try {
            const response = await fetch('http://localhost:5000/api/cases', {
              method: 'GET',
              headers: {
                'Authorization': `Bearer ${token}`,
                'Content-Type': 'application/json',
              },
            });

            if (response.ok) {
              const result = await response.json();
              if (result.success && result.data.cases) {
                allCases = result.data.cases;
              }
            }
          } catch {
            console.warn('Backend not available, using local data only');
          }
        }

        // Also load from localStorage
        const savedReports = JSON.parse(localStorage.getItem('goldguard_reports') || '[]');
        const localCases = savedReports.map((report: any) => ({
          caseId: report.id || `LOCAL-${Date.now()}`,
          status: report.status || 'New',
          type: report.type,
          region: report.region,
          priority: report.severity || 'Medium',
          createdAt: report.submittedAt || new Date().toISOString()
        }));

        // Combine backend and local data, removing duplicates based on caseId
        allCases = [...allCases, ...localCases];
        
        // Remove duplicates by caseId (backend data takes precedence)
        const uniqueCases = allCases.reduce((acc: any[], current: any) => {
          const existingCase = acc.find(c => c.caseId === current.caseId);
          if (!existingCase) {
            acc.push(current);
          }
          return acc;
        }, []);
        
        setCasesData(uniqueCases);

      } catch (error) {
        console.error('Error loading cases data:', error);
        setCasesData([]);
      }
    };

    loadCasesData();
  }, []);

  function getStatusStats() {
    const statusCount: Record<string, number> = {};
    
    // Use real cases data instead of hardcoded reports
    casesData.forEach(caseItem => {
      const status = caseItem.status || 'New';
      statusCount[status] = (statusCount[status] || 0) + 1;
    });
    
    return {
      total: casesData.length,
      new: statusCount['New'] || 0,
      active: statusCount['Active'] || statusCount['In Progress'] || statusCount['Under Investigation'] || 0,
      pending: statusCount['Pending'] || 0,
      solved: statusCount['Solved'] || statusCount['Resolved'] || statusCount['Closed'] || 0,
      rejected: statusCount['Rejected'] || 0
    };
  }

  // Calculate live data
  const liveRegionData = getCasesByRegion();
  const liveTypeData = getCasesByType();
  const liveSeverityData = getCasesBySeverity();
  const liveStatusStats = getStatusStats();

  // Analytics functions for monthly trends
  const fetchGoogleAnalyticsData = async () => {
    setIsLoadingAnalytics(true);
    try {
      // Simulate Google Analytics API call
      await new Promise(resolve => setTimeout(resolve, 1500));
      
      const mockGoogleAnalyticsData = {
        monthlyClicks: Math.floor(Math.random() * 50000) + 25000,
        lastUpdated: new Date().toISOString(),
        source: 'google-analytics' as const,
        trend: Math.random() > 0.5 ? 'up' as const : 'down' as const,
        percentage: Math.floor(Math.random() * 30) + 5
      };

      setAnalyticsData(mockGoogleAnalyticsData);
    } catch (error) {
      console.error('Failed to fetch Google Analytics data:', error);
    } finally {
      setIsLoadingAnalytics(false);
    }
  };

  const fetchDatabaseAnalytics = async () => {
    setIsLoadingAnalytics(true);
    try {
      // Simulate database API call
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      const mockDatabaseData = {
        monthlyClicks: Math.floor(Math.random() * 40000) + 20000,
        lastUpdated: new Date().toISOString(),
        source: 'database' as const,
        trend: Math.random() > 0.4 ? 'up' as const : Math.random() > 0.2 ? 'down' as const : 'stable' as const,
        percentage: Math.floor(Math.random() * 25) + 3
      };

      setAnalyticsData(mockDatabaseData);
    } catch (error) {
      console.error('Failed to fetch database analytics:', error);
    } finally {
      setIsLoadingAnalytics(false);
    }
  };

  // Initialize analytics data on component mount
  useEffect(() => {
    const loadInitialData = async () => {
      await fetchDatabaseAnalytics();
    };
    loadInitialData();
  }, []);
  
  // Handle statistics card click
  function handleStatCardClick(status: string) {
    setSelectedStatusFilter(status);
    setShowFilteredReports(true);
    // Scroll to reports table
    if (recentReportsRef.current) {
      recentReportsRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }

  // Handle delete report
  const handleDeleteReport = (reportId: string) => {
    if (window.confirm('Are you sure you want to delete this report?')) {
      // In a real app, you would make an API call here
      console.log('Deleting report:', reportId);
      // For now, just show an alert
      alert('Report deletion functionality would be implemented here.');
    }
  };

  return (
    <AdminProtection>
      <div className={`min-h-screen ${theme === "dark" ? "bg-gray-900 text-white" : theme === "taupe" ? "bg-[#f5f3ef] text-gray-800" : "bg-white text-gray-800"}`}>
      <AdminNavBar adminInitials={currentAdmin.initials} />
      
      {/* Mobile menu button */}
      <button
        onClick={() => setSidebarOpen(!sidebarOpen)}
        className={`fixed top-20 left-4 z-50 p-2 rounded-md lg:hidden ${
          theme === "dark" ? "bg-gray-800 text-white" : theme === "taupe" ? "bg-[#d8cfc4] text-gray-800" : "bg-white text-gray-800"
        } shadow-md border border-gray-300`}
      >
        {sidebarOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
      </button>

      <div className="flex pt-16 relative">
        {/* Sidebar */}
        <div className={`${sidebarOpen ? 'translate-x-0' : '-translate-x-full'} lg:translate-x-0 transition-transform duration-300 ease-in-out
          fixed lg:relative lg:block w-64 min-h-screen p-4 border-r z-40 
          ${theme === "dark" ? "bg-gray-800 border-gray-700" : theme === "taupe" ? "bg-[#d8cfc4] border-[#b8b0a1]" : "bg-white border-gray-200"}
        `}>
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
                    onClick={() => {
                      item.action();
                      setSidebarOpen(false); // Close sidebar on mobile after action
                    }}
                    className={`w-full flex items-center space-x-3 px-3 py-2 rounded-lg transition-colors font-semibold ${
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
                    className={`flex items-center space-x-3 px-3 py-2 rounded-lg transition-colors font-semibold ${
                      activeSection === item.id
                        ? "bg-[#b8b0a1] text-[#2a260f] shadow-md"
                        : "hover:bg-[#e6e0d6] text-[#2a260f]"
                    }`}
                    onClick={() => {
                      setActiveSection(item.id);
                      setSidebarOpen(false); // Close sidebar on mobile after navigation
                    }}
                  >
                    {item.icon && <item.icon className="w-5 h-5 mr-2" />}
                    <span>{item.label}</span>
                  </Link>
                )}
              </div>
            ))}
          </nav>
        </div>

        {/* Overlay for mobile */}
        {sidebarOpen && (
          <div 
            className="fixed inset-0 bg-black bg-opacity-50 z-30 lg:hidden"
            onClick={() => setSidebarOpen(false)}
          ></div>
        )}

        {/* Main Content */}
        <div className="flex-1 p-4 lg:p-6 lg:ml-0">
          <div className="mb-4 lg:mb-6">
            <h1 className={`text-2xl lg:text-3xl font-bold mb-2 ${theme === "dark" ? "text-white" : "text-gray-800"}`}>Admin Dashboard</h1>
            <p className={`text-sm lg:text-base ${theme === "dark" ? "text-gray-300" : "text-gray-600"}`}>Welcome back, {currentAdmin.name}</p>
          </div>
          {/* Statistics Cards */}
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-3 lg:gap-6 mb-6 lg:mb-8">
            <button 
              onClick={() => handleStatCardClick("Total")}
              className={`p-3 lg:p-6 rounded-lg border shadow-sm hover:shadow-md hover:border-amber-300 transition-all duration-200 text-left group ${
                theme === "dark" ? "bg-gray-800 border-gray-700" : theme === "taupe" ? "bg-[#f8f6f2] border-[#d8cfc4]" : "bg-white border-gray-200"
              }`}
            >
              <h3 className={`text-sm lg:text-lg font-semibold mb-1 lg:mb-2 group-hover:text-amber-700 ${
                theme === "dark" ? "text-gray-200" : "text-gray-800"
              }`}>Total</h3>
              <p className={`text-xl lg:text-3xl font-bold group-hover:text-amber-800 ${
                theme === "dark" ? "text-white" : "text-gray-900"
              }`}>{liveStatusStats.total}</p>
              <p className={`text-xs lg:text-sm mt-1 ${
                theme === "dark" ? "text-gray-400" : "text-gray-500"
              }`}>Click to view all reports</p>
            </button>
            <button 
              onClick={() => handleStatCardClick("New")}
              className={`p-3 lg:p-6 rounded-lg border shadow-sm hover:shadow-md hover:border-blue-300 transition-all duration-200 text-left group ${
                theme === "dark" ? "bg-gray-800 border-gray-700" : theme === "taupe" ? "bg-[#f8f6f2] border-[#d8cfc4]" : "bg-white border-gray-200"
              }`}
            >
              <h3 className={`text-sm lg:text-lg font-semibold mb-1 lg:mb-2 group-hover:text-blue-700 ${
                theme === "dark" ? "text-gray-200" : "text-gray-800"
              }`}>New</h3>
              <p className={`text-xl lg:text-3xl font-bold group-hover:text-blue-800 ${
                theme === "dark" ? "text-white" : "text-gray-900"
              }`}>{liveStatusStats.new}</p>
              <p className={`text-xs lg:text-sm mt-1 ${
                theme === "dark" ? "text-gray-400" : "text-gray-500"
              }`}>Click to view new reports</p>
            </button>
            <button 
              onClick={() => handleStatCardClick("Active")}
              className={`p-3 lg:p-6 rounded-lg border shadow-sm hover:shadow-md hover:border-yellow-300 transition-all duration-200 text-left group ${
                theme === "dark" ? "bg-gray-800 border-gray-700" : theme === "taupe" ? "bg-[#f8f6f2] border-[#d8cfc4]" : "bg-white border-gray-200"
              }`}
            >
              <h3 className={`text-sm lg:text-lg font-semibold mb-1 lg:mb-2 group-hover:text-yellow-700 ${
                theme === "dark" ? "text-gray-200" : "text-gray-800"
              }`}>Active</h3>
              <p className={`text-xl lg:text-3xl font-bold group-hover:text-yellow-800 ${
                theme === "dark" ? "text-white" : "text-gray-900"
              }`}>{liveStatusStats.active}</p>
              <p className={`text-xs lg:text-sm mt-1 ${
                theme === "dark" ? "text-gray-400" : "text-gray-500"
              }`}>Click to view active reports</p>
            </button>
            <button 
              onClick={() => handleStatCardClick("Pending")}
              className={`p-3 lg:p-6 rounded-lg border shadow-sm hover:shadow-md hover:border-red-300 transition-all duration-200 text-left group ${
                theme === "dark" ? "bg-gray-800 border-gray-700" : theme === "taupe" ? "bg-[#f8f6f2] border-[#d8cfc4]" : "bg-white border-gray-200"
              }`}
            >
              <h3 className={`text-sm lg:text-lg font-semibold mb-1 lg:mb-2 group-hover:text-red-700 ${
                theme === "dark" ? "text-gray-200" : "text-gray-800"
              }`}>Pending</h3>
              <p className={`text-xl lg:text-3xl font-bold group-hover:text-red-800 ${
                theme === "dark" ? "text-white" : "text-gray-900"
              }`}>{liveStatusStats.pending}</p>
              <p className={`text-xs lg:text-sm mt-1 ${
                theme === "dark" ? "text-gray-400" : "text-gray-500"
              }`}>Click to view pending reports</p>
            </button>
            <button 
              onClick={() => handleStatCardClick("Solved")}
              className={`p-3 lg:p-6 rounded-lg border shadow-sm hover:shadow-md hover:border-green-300 transition-all duration-200 text-left group ${
                theme === "dark" ? "bg-gray-800 border-gray-700" : theme === "taupe" ? "bg-[#f8f6f2] border-[#d8cfc4]" : "bg-white border-gray-200"
              }`}
            >
              <h3 className={`text-sm lg:text-lg font-semibold mb-1 lg:mb-2 group-hover:text-green-700 ${
                theme === "dark" ? "text-gray-200" : "text-gray-800"
              }`}>Solved</h3>
              <p className={`text-xl lg:text-3xl font-bold group-hover:text-green-800 ${
                theme === "dark" ? "text-white" : "text-gray-900"
              }`}>{liveStatusStats.solved}</p>
              <p className={`text-xs lg:text-sm mt-1 ${
                theme === "dark" ? "text-gray-400" : "text-gray-500"
              }`}>Click to view solved reports</p>
            </button>
          </div>

          <button 
            onClick={() => handleStatCardClick("Rejected")}
            className={`p-6 rounded-lg border shadow-sm hover:shadow-md hover:border-gray-400 transition-all duration-200 text-left group mb-6 ${
              theme === "dark" ? "bg-gray-800 border-gray-700" : theme === "taupe" ? "bg-[#f8f6f2] border-[#d8cfc4]" : "bg-white border-gray-200"
            }`}
          >
            <h3 className={`text-lg font-semibold mb-2 group-hover:text-gray-700 ${
              theme === "dark" ? "text-gray-200" : "text-gray-800"
            }`}>Rejected</h3>
            <p className={`text-2xl font-bold group-hover:text-gray-800 ${
              theme === "dark" ? "text-white" : "text-gray-900"
            }`}>{liveStatusStats.rejected}</p>
            <p className={`text-sm mt-1 ${
              theme === "dark" ? "text-gray-400" : "text-gray-500"
            }`}>Click to view rejected reports</p>
          </button>
          

          
{/* Monthly Trends Analytics */}
          <div className={`rounded-lg shadow-sm border p-4 lg:p-6 mb-6 lg:mb-8 ${
            theme === "dark" ? "bg-gray-800 border-gray-700" : theme === "taupe" ? "bg-[#f8f6f2] border-[#d8cfc4]" : "bg-white border-gray-200"
          }`}>
            <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between mb-4 space-y-3 lg:space-y-0">
              <div className="flex items-center">
                <BarChart3 className="w-5 lg:w-6 h-5 lg:h-6 text-amber-600 mr-2" />
                <h3 className={`text-base lg:text-lg font-semibold ${
                  theme === "dark" ? "text-white" : "text-gray-900"
                }`}>Monthly Trends Analytics</h3>
              </div>
              <div className="flex space-x-2">
                <button
                  onClick={fetchDatabaseAnalytics}
                  disabled={isLoadingAnalytics}
                  className={`px-2 lg:px-3 py-1 text-xs lg:text-sm rounded-md transition-colors ${
                    analyticsData.source === 'database'
                      ? 'bg-amber-100 text-amber-800 border border-amber-300'
                      : 'bg-gray-100 text-gray-700 border border-gray-300 hover:bg-gray-200'
                  } ${isLoadingAnalytics ? 'opacity-50 cursor-not-allowed' : ''}`}
                >
                  Database
                </button>
                <button
                  onClick={fetchGoogleAnalyticsData}
                  disabled={isLoadingAnalytics}
                  className={`px-2 lg:px-3 py-1 text-xs lg:text-sm rounded-md transition-colors ${
                    analyticsData.source === 'google-analytics'
                      ? 'bg-amber-100 text-amber-800 border border-amber-300'
                      : 'bg-gray-100 text-gray-700 border border-gray-300 hover:bg-gray-200'
                  } ${isLoadingAnalytics ? 'opacity-50 cursor-not-allowed' : ''}`}
                >
                  Google Analytics
                </button>
              </div>
            </div>

            {/* Analytics Stats */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-3 lg:gap-4 mb-4 lg:mb-6">
              {/* Monthly Clicks */}
              <div className={`p-4 rounded-lg border ${
                theme === "dark" ? "bg-gray-700 border-gray-600" : theme === "taupe" ? "bg-[#f0ede7] border-[#d8cfc4]" : "bg-gray-50 border-gray-200"
              }`}>
                <div className="flex items-center justify-between">
                  <div>
                    <p className={`text-sm font-medium ${
                      theme === "dark" ? "text-gray-300" : "text-gray-600"
                    }`}>Monthly Clicks</p>
                    <div className="flex items-center mt-2">
                      {isLoadingAnalytics ? (
                        <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-amber-600"></div>
                      ) : (
                        <>
                          <p className={`text-2xl font-bold ${
                            theme === "dark" ? "text-white" : "text-gray-900"
                          }`}>
                            {analyticsData.monthlyClicks.toLocaleString()}
                          </p>
                          <div className={`ml-2 flex items-center text-sm ${
                            analyticsData.trend === 'up' 
                              ? 'text-green-600' 
                              : analyticsData.trend === 'down' 
                              ? 'text-red-600' 
                              : 'text-gray-500'
                          }`}>
                            <TrendingUp className={`w-4 h-4 mr-1 ${
                              analyticsData.trend === 'down' ? 'transform rotate-180' : ''
                            }`} />
                            {analyticsData.percentage}%
                          </div>
                        </>
                      )}
                    </div>
                  </div>
                </div>
              </div>

              {/* Data Source */}
              <div className={`p-4 rounded-lg border ${
                theme === "dark" ? "bg-gray-700 border-gray-600" : theme === "taupe" ? "bg-[#f0ede7] border-[#d8cfc4]" : "bg-gray-50 border-gray-200"
              }`}>
                <div>
                  <p className={`text-sm font-medium ${
                    theme === "dark" ? "text-gray-300" : "text-gray-600"
                  }`}>Data Source</p>
                  <p className={`text-lg font-semibold mt-2 capitalize ${
                    theme === "dark" ? "text-white" : "text-gray-900"
                  }`}>
                    {isLoadingAnalytics ? '...' : analyticsData.source.replace('-', ' ')}
                  </p>
                  <div className={`mt-1 flex items-center text-xs ${
                    analyticsData.source === 'google-analytics' ? 'text-blue-600' : 'text-green-600'
                  }`}>
                    <div className={`w-2 h-2 rounded-full mr-2 ${
                      analyticsData.source === 'google-analytics' ? 'bg-blue-600' : 'bg-green-600'
                    }`}></div>
                    {analyticsData.source === 'google-analytics' ? 'Live GA4' : 'Database'}
                  </div>
                </div>
              </div>

              {/* Last Updated */}
              <div className={`p-4 rounded-lg border ${
                theme === "dark" ? "bg-gray-700 border-gray-600" : theme === "taupe" ? "bg-[#f0ede7] border-[#d8cfc4]" : "bg-gray-50 border-gray-200"
              }`}>
                <div>
                  <p className={`text-sm font-medium ${
                    theme === "dark" ? "text-gray-300" : "text-gray-600"
                  }`}>Last Updated</p>
                  <div className="flex items-center mt-2">
                    <Calendar className="w-4 h-4 mr-2 text-amber-600" />
                    <p className={`text-sm font-medium ${
                      theme === "dark" ? "text-white" : "text-gray-900"
                    }`}>
                      {isLoadingAnalytics 
                        ? 'Updating...' 
                        : analyticsData.lastUpdated 
                        ? new Date(analyticsData.lastUpdated).toLocaleString()
                        : 'Never'
                      }
                    </p>
                  </div>
                </div>
              </div>
            </div>


            {/* Analytics Info */}
            <div className={`p-4 rounded-lg ${
              analyticsData.source === 'google-analytics' 
                ? 'bg-blue-50 border border-blue-200' 
                : 'bg-green-50 border border-green-200'
            }`}>
              <div className="flex items-start">
                <div className={`flex-shrink-0 w-5 h-5 rounded-full flex items-center justify-center ${
                  analyticsData.source === 'google-analytics' ? 'bg-blue-500' : 'bg-green-500'
                }`}>
                  <div className="w-2 h-2 bg-white rounded-full"></div>
                </div>
                <div className="ml-3">
                  <p className={`text-sm font-medium ${
                    analyticsData.source === 'google-analytics' ? 'text-blue-800' : 'text-green-800'
                  }`}>
                    {analyticsData.source === 'google-analytics' 
                      ? 'Google Analytics Integration' 
                      : 'Database Analytics'
                    }
                  </p>
                  <p className={`text-xs mt-1 ${
                    analyticsData.source === 'google-analytics' ? 'text-blue-700' : 'text-green-700'
                  }`}>
                    {analyticsData.source === 'google-analytics' 
                      ? 'Real-time data from GA4 with live trend signals and user engagement metrics.'
                      : 'Internal database tracking with click events, user sessions, and interaction data.'
                    }
                  </p>
                </div>
              </div>
            </div>
          </div>
            

          {/* Data Visualization Section (not sticky) */}
          <div className={`bg-opacity-95 rounded-lg shadow-lg mb-12 p-4 ${
            theme === "dark" ? "bg-gray-800" : theme === "taupe" ? "bg-[#f8f6f2]" : "bg-white"
          }`}>
            <h2 className={`text-2xl font-bold mb-6 ${
              theme === "dark" ? "text-white" : "text-gray-800"
            }`}>Data Visualization</h2>
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              {/* Cases by Region Chart */}
              <div className={`p-6 rounded-lg border shadow-sm ${
                theme === "dark" ? "bg-gray-700 border-gray-600" : theme === "taupe" ? "bg-[#faf8f4] border-[#d8cfc4]" : "bg-white border-gray-200"
              }`}>
                <h3 className={`text-lg font-semibold mb-4 ${
                  theme === "dark" ? "text-white" : "text-gray-800"
                }`}>Cases by Region</h3>
                <div className="space-y-2">
                  {liveRegionData.length > 0 ? liveRegionData.map((item) => {
                    const maxCases = Math.max(...liveRegionData.map(d => d.cases));
                    const percentage = maxCases > 0 ? (item.cases / maxCases) * 100 : 0;
                    return (
                      <div key={item.region} className="flex justify-between items-center">
                        <span className={`text-sm ${
                          theme === "dark" ? "text-gray-300" : "text-gray-700"
                        }`}>{item.region}</span>
                        <div className="flex items-center space-x-2">
                          <div className={`w-20 rounded-full h-2 ${
                            theme === "dark" ? "bg-gray-600" : "bg-gray-200"
                          }`}>
                            <div
                              className="bg-blue-600 h-2 rounded-full transition-all duration-300"
                              style={{ width: `${percentage}%` }}
                              aria-label={`Bar for ${item.region}`}
                            ></div>
                          </div>
                          <span className={`text-sm font-semibold ${
                            theme === "dark" ? "text-white" : "text-gray-800"
                          }`}>{item.cases}</span>
                        </div>
                      </div>
                    );
                  }) : (
                    <div className={`text-center py-4 ${
                      theme === "dark" ? "text-gray-400" : "text-gray-500"
                    }`}>
                      No data available
                    </div>
                  )}
                </div>
              </div>

              {/* Cases by Type Chart */}
              <div className={`p-6 rounded-lg border shadow-sm ${
                theme === "dark" ? "bg-gray-700 border-gray-600" : theme === "taupe" ? "bg-[#faf8f4] border-[#d8cfc4]" : "bg-white border-gray-200"
              }`}>
                <h3 className={`text-lg font-semibold mb-4 ${
                  theme === "dark" ? "text-white" : "text-gray-800"
                }`}>Cases by Type</h3>
                <div className="space-y-2">
                  {liveTypeData.length > 0 ? liveTypeData.map((item, index) => {
                    const colors = ['bg-red-500', 'bg-blue-500', 'bg-green-500', 'bg-yellow-500', 'bg-purple-500'];
                    const maxCases = Math.max(...liveTypeData.map(d => d.cases));
                    const percentage = maxCases > 0 ? (item.cases / maxCases) * 100 : 0;
                    return (
                      <div key={item.type} className="flex justify-between items-center">
                        <span className={`text-sm ${
                          theme === "dark" ? "text-gray-300" : "text-gray-700"
                        }`}>{item.type}</span>
                        <div className="flex items-center space-x-2">
                          <div className={`w-20 rounded-full h-2 ${
                            theme === "dark" ? "bg-gray-600" : "bg-gray-200"
                          }`}>
                            <div
                              className={`${colors[index % colors.length]} h-2 rounded-full transition-all duration-300`}
                              style={{ width: `${percentage}%` }}
                              aria-label={`Bar for ${item.type}`}
                            ></div>
                          </div>
                          <span className={`text-sm font-semibold ${
                            theme === "dark" ? "text-white" : "text-gray-800"
                          }`}>{item.cases}</span>
                        </div>
                      </div>
                    );
                  }) : (
                    <div className={`text-center py-4 ${
                      theme === "dark" ? "text-gray-400" : "text-gray-500"
                    }`}>
                      No data available
                    </div>
                  )}
                </div>
              </div>

              {/* Severity Distribution */}
              <div className={`p-6 rounded-lg border shadow-sm ${
                theme === "dark" ? "bg-gray-700 border-gray-600" : theme === "taupe" ? "bg-[#faf8f4] border-[#d8cfc4]" : "bg-white border-gray-200"
              }`}>
                <h3 className={`text-lg font-semibold mb-4 ${
                  theme === "dark" ? "text-white" : "text-gray-800"
                }`}>Severity Distribution</h3>
                <div className="space-y-3">
                  {liveSeverityData.map((item) => {
                    const severityColors = {
                      'Critical': 'bg-red-500',
                      'High': 'bg-orange-500', 
                      'Medium': 'bg-yellow-500',
                      'Low': 'bg-green-500'
                    };
                    return (
                      <div key={item.severity} className="flex items-center justify-between">
                        <div className="flex items-center space-x-2">
                          <div className={`w-3 h-3 rounded-full ${severityColors[item.severity as keyof typeof severityColors]}`}></div>
                          <span className={`text-sm ${
                            theme === "dark" ? "text-gray-300" : "text-gray-700"
                          }`}>{item.severity}</span>
                        </div>
                        <div className="flex items-center space-x-2">
                          <span className={`text-sm font-semibold ${
                            theme === "dark" ? "text-white" : "text-gray-800"
                          }`}>{item.cases}</span>
                          <span className={`text-xs ${
                            theme === "dark" ? "text-gray-400" : "text-gray-500"
                          }`}>({item.percentage}%)</span>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>



          {/* Interactive Map Section */}
          <div className={`rounded-lg shadow-sm border p-6 mb-12 ${
            theme === "dark" ? "bg-gray-800 border-gray-700" : theme === "taupe" ? "bg-[#f8f6f2] border-[#d8cfc4]" : "bg-white border-gray-200"
          }`}>
            <h2 className={`text-xl font-semibold mb-4 ${
              theme === "dark" ? "text-white" : "text-gray-900"
            }`}>Interactive Map</h2>
            <div className="h-96">
              {isClient ? (
                <DashboardMapLeaflet cases={mapCases} />
              ) : (
                <div className="h-full bg-gray-100 rounded-lg flex items-center justify-center">
                  <div className="text-gray-500">Loading map...</div>
                </div>
              )}
            </div>
          </div>

          {/* Quick Actions */}
          <div className={`rounded-lg shadow-sm border p-4 lg:p-6 mb-6 lg:mb-8 ${
            theme === "dark" ? "bg-gray-800 border-gray-700" : theme === "taupe" ? "bg-[#f8f6f2] border-[#d8cfc4]" : "bg-white border-gray-200"
          }`}>
            <h2 className={`text-lg lg:text-xl font-semibold mb-4 ${
              theme === "dark" ? "text-white" : "text-gray-900"
            }`}>Quick Actions</h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 lg:gap-4">
              <button 
                onClick={() => {
                  if (recentReportsRef.current) {
                    recentReportsRef.current.scrollIntoView({ behavior: 'smooth' });
                  }
                }}
                className="flex items-center justify-center space-x-2 bg-amber-600 hover:bg-amber-700 text-white px-3 lg:px-4 py-2 lg:py-3 rounded-lg transition-colors text-sm lg:text-base"
                title="Export Reports"
              >
                <Download className="w-4 lg:w-5 h-4 lg:h-5" />
                <span>Export Reports</span>
              </button>
              <button className="flex items-center justify-center space-x-2 bg-blue-600 hover:bg-blue-700 text-white px-3 lg:px-4 py-2 lg:py-3 rounded-lg transition-colors text-sm lg:text-base">
                <Search className="w-4 lg:w-5 h-4 lg:h-5" />
                <span>Advanced Search</span>
              </button>
              <button className="flex items-center justify-center space-x-2 bg-green-600 hover:bg-green-700 text-white px-3 lg:px-4 py-2 lg:py-3 rounded-lg transition-colors text-sm lg:text-base">
                <Calendar className="w-4 lg:w-5 h-4 lg:h-5" />
                <span>Schedule Report</span>
              </button>
              <button className="flex items-center justify-center space-x-2 bg-purple-600 hover:bg-purple-700 text-white px-3 lg:px-4 py-2 lg:py-3 rounded-lg transition-colors text-sm lg:text-base">
                <MapPin className="w-4 lg:w-5 h-4 lg:h-5" />
                <span className="hidden sm:inline">View All Locations</span>
                <span className="sm:hidden">View Locations</span>
              </button>
            </div>
          </div>

          {/* Reports Table - Updated UI */}
          <div ref={recentReportsRef} className={`rounded-lg shadow-sm border ${
            theme === "dark" ? "bg-gray-800 border-gray-700" : theme === "taupe" ? "bg-[#f8f6f2] border-[#d8cfc4]" : "bg-white border-gray-200"
          }`}>
            <div className={`p-6 border-b ${
              theme === "dark" ? "border-gray-700" : theme === "taupe" ? "border-[#d8cfc4]" : "border-gray-200"
            }`}>
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center space-x-4">
                  <h2 className={`text-xl font-semibold ${
                    theme === "dark" ? "text-white" : "text-gray-900"
                  }`}>
                    {showFilteredReports && selectedStatusFilter !== "All" && selectedStatusFilter !== "Total" 
                      ? `${selectedStatusFilter} Reports` 
                      : "Recent Reports"}
                  </h2>
                  {showFilteredReports && selectedStatusFilter !== "All" && selectedStatusFilter !== "Total" && (
                    <button
                      onClick={() => {
                        setShowFilteredReports(false);
                        setSelectedStatusFilter("All");
                      }}
                      className={`text-sm hover:text-gray-700 border px-3 py-1 rounded-md ${
                        theme === "dark" ? "text-gray-400 border-gray-600 hover:text-gray-300" : "text-gray-500 border-gray-300"
                      }`}
                    >
                      Clear Filter
                    </button>
                  )}
                </div>
                <button className="flex items-center space-x-2 text-amber-600 hover:text-amber-700" title="Export Reports">
                  <Download className="w-4 h-4" />
                  <span>Export</span>
                </button>
              </div>
              {/* Filters */}
              <div className="flex flex-col sm:flex-row gap-3 lg:gap-4">
                <div className="flex-1 relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 lg:w-5 h-4 lg:h-5" />
                  <input
                    type="text"
                    placeholder="Search reports..."
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                    className="w-full pl-8 lg:pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-amber-500 text-sm lg:text-base"
                  />
                </div>
                <select
                  value={statusFilter}
                  onChange={(e) => setStatusFilter(e.target.value)}
                  className="px-3 lg:px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-amber-500 text-sm lg:text-base"
                  title="Filter by Status"
                >
                  <option value="All">All Status</option>
                  <option value="Pending">Pending</option>
                  <option value="Active">Active</option>
                  <option value="Solved">Solved</option>
                  <option value="Rejected">Rejected</option>
                  <option value="New">New</option>
                </select>
                <select
                  value={regionFilter}
                  onChange={(e) => setRegionFilter(e.target.value)}
                  className="px-3 lg:px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-amber-500 text-sm lg:text-base"
                  title="Filter by Region"
                >
                  <option value="All">All Regions</option>
                  <option value="Ashanti">Ashanti</option>
                  <option value="Greater Accra">Greater Accra</option>
                  <option value="Western">Western</option>
                  <option value="Eastern">Eastern</option>
                  <option value="Brong Ahafo">Brong Ahafo</option>
                </select>
              </div>
              {/* Show filtered results summary */}
              {showFilteredReports && selectedStatusFilter !== "All" && selectedStatusFilter !== "Total" && (
                <div className="mt-4 p-3 bg-amber-50 border border-amber-200 rounded-lg">
                  <p className="text-sm text-amber-800">
                    Showing <span className="font-semibold">{filteredReports.length}</span> {selectedStatusFilter.toLowerCase()} reports
                    {search && ` matching "${search}"`}
                  </p>
                </div>
              )}
            </div>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Report ID</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Region</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Type</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Severity</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Date</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {filteredReports.map((report) => (
                    <tr key={report.id} className="hover:bg-gray-50">
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">{report.id}</td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        <div className="flex items-center">
                          <MapPin className="w-4 h-4 text-gray-400 mr-1" />
                          {report.region}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{report.type}</td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getStatusColor(report.status)}`}>{report.status}</span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getSeverityColor(report.severity)}`}>{report.severity}</span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        <div className="flex items-center">
                          <Calendar className="w-4 h-4 text-gray-400 mr-1" />
                          {new Date(report.date).toLocaleDateString()}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                        <div className="flex items-center space-x-2">
                          <button onClick={() => setSelectedReport(report)} className="text-amber-600 hover:text-amber-900" title="View Report">
                            <Eye className="w-4 h-4" />
                          </button>
                          <button 
                            onClick={() => router.push('/cases')} 
                            className="text-blue-600 hover:text-blue-900" 
                            title="Edit Report"
                          >
                            <Edit className="w-4 h-4" />
                          </button>
                          <button 
                            onClick={() => handleDeleteReport(report.id)} 
                            className="text-red-600 hover:text-red-900" 
                            title="Delete Report"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </div>
      {/* Report Detail Modal */}
      {selectedReport && (
        <div className="fixed inset-0 flex bg-black bg-opacity-50 items-center justify-center z-50 p-4">
          <div className={`rounded-lg shadow-xl p-4 lg:p-6 max-w-4xl w-full max-h-[90vh] overflow-y-auto ${
            theme === "dark" ? "bg-gray-800" : theme === "taupe" ? "bg-[#f8f6f2]" : "bg-white"
          }`}>
            <div className="flex items-center justify-between mb-4 lg:mb-6">
              <h3 className={`text-lg lg:text-2xl font-semibold ${
                theme === "dark" ? "text-white" : "text-[#2a260f]"
              }`}>Report Details</h3>
              <button
                onClick={() => setSelectedReport(null)}
                className={`p-1 rounded-full hover:bg-gray-100 ${
                  theme === "dark" ? "text-gray-400 hover:text-gray-600 hover:bg-gray-700" : "text-gray-400 hover:text-gray-600"
                }`}
                title="Close Details"
                aria-label="Close Details"
              >
                <X className="w-5 lg:w-6 h-5 lg:h-6" />
              </button>
            </div>
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 lg:gap-6">
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-[#6b5e36] mb-1">Report ID</label>
                  <p className="text-sm text-[#2a260f]">{selectedReport.id}</p>
                </div>
                <div>
                  <label className="block text-sm font-medium text-[#6b5e36] mb-1">Title</label>
                  <p className="text-sm text-[#2a260f]">
                    {selectedReport.type === "Environmental Damage" && "Environmental Damage in Obuasi Forest Reserve"}
                    {selectedReport.type === "Water Contamination" && "Water Contamination in Ankobra River"}
                    {selectedReport.type === "Forest Destruction" && "Forest Destruction in Atewa Range"}
                    {selectedReport.type === "Human Rights Violation" && "Human Rights Violation in Mining Site"}
                    {selectedReport.type === "Equipment Violation" && "Equipment Violation in Mining District"}
                  </p>
                </div>
                <div>
                  <label className="block text-sm font-medium text-[#6b5e36] mb-1">Description</label>
                  <p className="text-sm text-[#2a260f]">
                    {selectedReport.type === "Environmental Damage" && "Large-scale environmental damage discovered in protected forest area"}
                    {selectedReport.type === "Water Contamination" && "Mercury contamination detected in river water affecting local communities"}
                    {selectedReport.type === "Forest Destruction" && "Illegal clearing of forest land for mining activities"}
                    {selectedReport.type === "Human Rights Violation" && "Children observed working in dangerous mining conditions"}
                    {selectedReport.type === "Equipment Violation" && "Heavy machinery operating without proper permits"}
                  </p>
                </div>
                <div>
                  <label className="block text-sm font-medium text-[#6b5e36] mb-1">Location</label>
                  <p className="text-sm text-[#2a260f]">{selectedReport.location}</p>
                </div>
                <div>
                  <label className="block text-sm font-medium text-[#6b5e36] mb-1">Reporter</label>
                  <p className="text-sm text-[#2a260f]">{selectedReport.reporter}</p>
                </div>
              </div>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-[#6b5e36] mb-1">Region</label>
                  <p className="text-sm text-[#2a260f]">{selectedReport.region}</p>
                </div>
                <div>
                  <label className="block text-sm font-medium text-[#6b5e36] mb-1">Type</label>
                  <p className="text-sm text-[#2a260f]">{selectedReport.type}</p>
                </div>
                <div>
                  <label className="block text-sm font-medium text-[#6b5e36] mb-1">Status</label>
                  <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getStatusColor(selectedReport.status)}`}>
                    {selectedReport.status}
                  </span>
                </div>
                <div>
                  <label className="block text-sm font-medium text-[#6b5e36] mb-1">Priority</label>
                  <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getSeverityColor(selectedReport.severity)}`}>
                    {selectedReport.severity}
                  </span>
                </div>
                <div>
                  <label className="block text-sm font-medium text-[#6b5e36] mb-1">Assigned Officer</label>
                  <p className="text-sm text-[#2a260f]">
                    {selectedReport.status === "New" ? "Not yet assigned" : "Officer on duty"}
                  </p>
                </div>
                <div>
                  <label className="block text-sm font-medium text-[#6b5e36] mb-1">Reported Date</label>
                  <p className="text-sm text-[#2a260f]">{new Date(selectedReport.date).toLocaleDateString()}</p>
                </div>
                <div>
                  <label className="block text-sm font-medium text-[#6b5e36] mb-1">Last Updated</label>
                  <p className="text-sm text-[#2a260f]">
                    {new Date(selectedReport.date).toLocaleDateString()}
                  </p>
                </div>
              </div>
            </div>
            <div className="flex flex-col sm:flex-row sm:space-x-3 space-y-2 sm:space-y-0 mt-4 lg:mt-6 pt-4 lg:pt-6 border-t border-gray-200">
              <button className="w-full sm:w-auto bg-amber-600 hover:bg-amber-700 text-white px-3 lg:px-4 py-2 rounded-lg transition-colors text-xs lg:text-sm font-medium" title="Update Status" aria-label="Update Status">
                Update Status
              </button>
              <button className="w-full sm:w-auto bg-blue-600 hover:bg-blue-700 text-white px-3 lg:px-4 py-2 rounded-lg transition-colors text-xs lg:text-sm font-medium" title="Assign Officer" aria-label="Assign Officer">
                Assign Officer
              </button>
              <button className="w-full sm:w-auto bg-green-600 hover:bg-green-700 text-white px-3 lg:px-4 py-2 rounded-lg transition-colors text-xs lg:text-sm font-medium" title="Generate Report" aria-label="Generate Report">
                Generate Report
              </button>
              <button className="w-full sm:w-auto bg-gray-600 hover:bg-gray-700 text-white px-3 lg:px-4 py-2 rounded-lg transition-colors text-xs lg:text-sm font-medium" title="Download Case File" aria-label="Download Case File">
                <span className="hidden sm:inline">Download Case File</span>
                <span className="sm:hidden">Download</span>
              </button>
            </div>
          </div>
        </div>
      )}
      </div>
      <Footer />
    </div>
    </AdminProtection>
  );
}