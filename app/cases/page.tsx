"use client";
import { AlertTriangle, Briefcase, Calendar, Download, Edit, Eye, Image as ImageIcon, LayoutDashboard, LogOut, MapPin, Search, Settings, Trash2, Users } from 'lucide-react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import React, { useState } from 'react';
import AdminProtection from '../component/AdminProtection';
import { useAdminSession } from '../component/hooks/useAdminSession';
import AdminNavBar from '../component/landingpage/AdminNavBar';
import Footer from '../component/landingpage/footer';
import { useTheme } from '../component/ThemeContext';
const sidebarItems = [
  { id: "dashboard", label: "Dashboard", href: "/admin-dashboard", icon: LayoutDashboard },
  { id: "cases", label: "Cases", href: "/cases", icon: Briefcase },
  { id: "imageanalysis", label: "Image Analysis", href: "/imageanalysis", icon: Eye },
  { id: "management", label: "Management", href: "/management", icon: Users },
  { id: "settings", label: "Settings", href: "/settings", icon: Settings },
  { id: "logout", label: "Logout", href: "#", icon: LogOut, action: undefined },
];

interface Case {
  id: string;
  title: string;
  region: string;
  type: string;
  status: 'Open' | 'In Progress' | 'Resolved' | 'Closed' | 'New' | 'Under Investigation' | 'Pending';
  priority: 'Low' | 'Medium' | 'High' | 'Critical';
  assignedTo: string;
  reportedDate: string;
  lastUpdated?: string;
  description: string;
  location?: string;
  reporter?: {
    name?: string;
    phone?: string;
    email?: string;
    anonymous: boolean;
  } | string;
  evidence?: Array<{
    type: string;
    description: string;
    fileUrl: string;
    fileName: string;
  }>;
}

interface BackendCase {
  caseId: string;
  title: string;
  region: string;
  type: string;
  status: string;
  priority: string;
  assignedTo?: {
    profile: {
      firstName: string;
      lastName: string;
    };
  };
  createdAt: string;
  updatedAt: string;
  description: string;
  location?: {
    address?: string;
  };
  reporter?: {
    isAnonymous: boolean;
    fullName?: string;
  };
  evidence?: Array<{
    type: string;
    description: string;
    fileUrl: string;
    fileName: string;
  }>;
}

interface Officer {
  id: number;
  name: string;
  badgeNumber: string;
  rank: string;
  department: string;
  status: 'Active' | 'Inactive';
  assignedRegions: string[];
}

const CasePage: React.FC = () => {
  const [activeSection, setActiveSection] = useState("cases");
  const { theme } = useTheme();
  const router = useRouter();
  const { currentAdmin } = useAdminSession();
  const handleLogout = () => {
    // Clear admin session
    localStorage.removeItem('goldguard_admin_session');
    localStorage.removeItem('goldguard_admin_timestamp');
    // Redirect to main page instead of admin login
    router.push("/");
  };
  const [cases, setCases] = useState<Case[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('All');
  const [priorityFilter, setPriorityFilter] = useState('All');
  const [regionFilter, setRegionFilter] = useState('All');
  const [selectedCase, setSelectedCase] = useState<Case | null>(null);
  const [editingCase, setEditingCase] = useState<Case | null>(null);
  const [editStatus, setEditStatus] = useState<string>('');
  const [editAssignedTo, setEditAssignedTo] = useState<string>('');
  const [isSaving, setIsSaving] = useState<boolean>(false);
  const [saveMessage, setSaveMessage] = useState<string>('');
  const [downloadMessage, setDownloadMessage] = useState<string>('');
  const [officers, setOfficers] = useState<string[]>([]);

  // Helper functions
  const formatDate = (dateString?: string) => {
    if (!dateString) return 'N/A';
    return new Date(dateString).toLocaleDateString();
  };

  const formatReporter = (reporter?: Case['reporter']) => {
    if (!reporter) return 'Unknown';
    if (typeof reporter === 'string') return reporter;
    if (reporter.anonymous) return 'Anonymous Reporter';
    if (reporter.name) return reporter.name;
    return 'Anonymous Reporter';
  };

  const loadLocalStorageReports = () => {
    try {
      const savedReports = JSON.parse(localStorage.getItem('goldguard_reports') || '[]');
      const localCases: Case[] = savedReports.map((report: {
        id?: string;
        type: string;
        region: string;
        description: string;
        affectedArea?: string;
        location?: { address?: string };
        isAnonymous?: boolean;
        fullName?: string;
        submittedAt?: string;
      }) => ({
        id: report.id || `LOCAL-${Date.now()}`,
        title: `${report.type} - ${report.region}`,
        region: report.region,
        type: report.type,
        status: 'New',
        priority: 'Medium',
        assignedTo: 'Unassigned',
        reportedDate: new Date(report.submittedAt || Date.now()).toLocaleDateString(),
        lastUpdated: new Date(report.submittedAt || Date.now()).toLocaleDateString(),
        description: report.description,
        location: report.affectedArea || report.location?.address,
        reporter: report.isAnonymous ? 'Anonymous' : report.fullName || 'Unknown'
      }));
      
      // Use only localStorage reports (no mock data)
      setCases(localCases);
    } catch (error) {
      console.error('Error loading localStorage reports:', error);
      setCases([]);
    }
  };

  // Load cases from backend API
  React.useEffect(() => {
    const loadCases = async () => {
      try {
        // Get admin token for authentication (you may need to implement this)
        const adminSession = localStorage.getItem('goldguard_admin_session');
        const token = adminSession ? JSON.parse(adminSession).token : null;

        if (!token) {
          console.warn('No admin token found, loading only localStorage reports');
          // Load only localStorage reports (no mock data)
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
            // Transform backend case format to match frontend interface
            const transformedCases = result.data.cases.map((backendCase: BackendCase) => ({
              id: backendCase.caseId,
              title: backendCase.title,
              region: backendCase.region,
              type: backendCase.type,
              status: backendCase.status,
              priority: backendCase.priority,
              assignedTo: backendCase.assignedTo?.profile ? 
                `Officer ${backendCase.assignedTo.profile.firstName} ${backendCase.assignedTo.profile.lastName}` : 
                'Unassigned',
              reportedDate: new Date(backendCase.createdAt).toISOString().split('T')[0],
              lastUpdated: new Date(backendCase.updatedAt).toISOString().split('T')[0],
              description: backendCase.description,
              location: backendCase.location?.address || `${backendCase.region}, Ghana`,
              reporter: backendCase.reporter?.isAnonymous ? 'Anonymous' : 
                (backendCase.reporter?.fullName || 'Unknown'),
              evidence: backendCase.evidence || []
            }));

            // Load localStorage reports as well
            const savedReports = JSON.parse(localStorage.getItem('goldguard_reports') || '[]');
            const localCases: Case[] = savedReports.map((report: any) => ({
              id: report.id || `LOCAL-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
              title: `${report.type} - ${report.region}`,
              region: report.region,
              type: report.type,
              status: 'New',
              priority: 'Medium',
              assignedTo: 'Unassigned',
              reportedDate: new Date(report.submittedAt || Date.now()).toLocaleDateString(),
              lastUpdated: new Date(report.submittedAt || Date.now()).toLocaleDateString(),
              description: report.description,
              location: report.affectedArea || report.location?.address,
              reporter: report.isAnonymous ? 'Anonymous' : report.fullName || 'Unknown',
              evidence: report.evidence || []
            }));

            // Combine only backend cases with localStorage reports (no mock data)
            setCases([...transformedCases, ...localCases]);
          } else {
            console.error('Invalid response format:', result);
            loadLocalStorageReports();
          }
        } else {
          console.error('Failed to fetch cases:', response.statusText);
          // Fallback to localStorage data on error
          loadLocalStorageReports();
        }
      } catch (error) {
        console.error('Error fetching cases:', error);
        // Fallback to localStorage data on error
        loadLocalStorageReports();
      }
    };

    loadCases();

    // Set up polling to refresh cases every 30 seconds
    const interval = setInterval(loadCases, 30000);
    return () => clearInterval(interval);
  }, []);

  // Load officers from localStorage
  React.useEffect(() => {
    const loadOfficers = () => {
      const storedOfficers = localStorage.getItem('goldguard_officers');
      if (storedOfficers) {
        const officersData: Officer[] = JSON.parse(storedOfficers);
        const activeOfficers = officersData
          .filter((officer: Officer) => officer.status === 'Active')
          .map((officer: Officer) => officer.name);
        setOfficers(activeOfficers);
      } else {
        // Fallback to default officers if none in localStorage
        setOfficers([
          'Officer John Mensah',
          'Officer Sarah Asante', 
          'Officer Michael Boateng',
          'Officer Grace Owusu',
          'Officer Daniel Appiah',
          'Officer Emma Adjei',
          'Officer Kwame Osei',
          'Officer Akosua Adom'
        ]);
      }
    };

    loadOfficers();

    // Listen for storage changes to update officers list when management page changes
    const handleStorageChange = (e: StorageEvent) => {
      if (e.key === 'goldguard_officers') {
        loadOfficers();
      }
    };

    window.addEventListener('storage', handleStorageChange);
    return () => window.removeEventListener('storage', handleStorageChange);
  }, []);

  const statuses = ['All', 'New', 'Open', 'Under Investigation', 'In Progress', 'Resolved', 'Closed', 'Pending'];
  const editableStatuses = ['New', 'Open', 'Under Investigation', 'In Progress', 'Resolved', 'Closed', 'Pending'];
  const priorities = ['All', 'Low', 'Medium', 'High', 'Critical'];
  const regions = ['All', 'Ashanti', 'Greater Accra', 'Western', 'Eastern', 'Central', 'Volta', 'Northern', 'Upper East', 'Upper West', 'Brong Ahafo', 'Western North', 'Ahafo', 'Bono', 'Bono East', 'Oti', 'North East', 'Savannah'];

  const filteredCases = cases.filter(caseItem => {
    const matchesSearch = caseItem.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         caseItem.id.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         caseItem.description.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = statusFilter === 'All' || caseItem.status === statusFilter;
    const matchesPriority = priorityFilter === 'All' || caseItem.priority === priorityFilter;
    const matchesRegion = regionFilter === 'All' || caseItem.region === regionFilter;
    
    return matchesSearch && matchesStatus && matchesPriority && matchesRegion;
  });

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'New': return 'bg-blue-100 text-blue-800';
      case 'Open': return 'bg-purple-100 text-purple-800';
      case 'Under Investigation': return 'bg-yellow-100 text-yellow-800';
      case 'In Progress': return 'bg-indigo-100 text-indigo-800';
      case 'Resolved': return 'bg-green-100 text-green-800';
      case 'Closed': return 'bg-gray-100 text-gray-800';
      case 'Pending': return 'bg-orange-100 text-orange-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'Low': return 'bg-green-100 text-green-800';
      case 'Medium': return 'bg-yellow-100 text-yellow-800';
      case 'High': return 'bg-orange-100 text-orange-800';
      case 'Critical': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const handleDeleteCase = async (caseId: string) => {
    try {
      // First try to delete from backend
      const token = localStorage.getItem('goldguard_admin_session');
      if (token) {
        try {
          const response = await fetch(`http://localhost:5000/api/cases/${caseId}`, {
            method: 'DELETE',
            headers: {
              'Authorization': `Bearer ${token}`,
              'Content-Type': 'application/json',
            },
          });

          if (response.ok) {
            console.log('Case deleted from backend successfully');
          } else {
            console.warn('Failed to delete from backend, proceeding with local deletion');
          }
        } catch (backendError) {
          console.warn('Backend not available, proceeding with local deletion only');
        }
      }

      // Update localStorage
      const savedReports = JSON.parse(localStorage.getItem('goldguard_reports') || '[]');
      const updatedReports = savedReports.filter((report: any) => report.id !== caseId);
      localStorage.setItem('goldguard_reports', JSON.stringify(updatedReports));

      // Update local state
      const updatedCases = cases.filter(caseItem => caseItem.id !== caseId);
      setCases(updatedCases);
      setSelectedCase(null);

      console.log('Case deleted successfully');
    } catch (error) {
      console.error('Error deleting case:', error);
    }
  };

  const handleDownloadCaseFile = (caseData: Case, format: 'txt' | 'json' = 'txt') => {
    try {
      setDownloadMessage('Preparing file...');
      
      let content: string;
      let mimeType: string;
      let fileExtension: string;

      if (format === 'json') {
        // Create JSON format
        const jsonData = {
          caseReport: {
            metadata: {
              generatedOn: new Date().toISOString(),
              system: "Ghana Gold Guard Case Management System",
              contact: "info@goldguard.gov.gh"
            },
            caseIdentification: {
              caseId: caseData.id,
              title: caseData.title,
              reportedDate: caseData.reportedDate,
              lastUpdated: caseData.lastUpdated
            },
            caseDetails: {
              description: caseData.description,
              location: caseData.location,
              region: caseData.region,
              type: caseData.type
            },
            statusInformation: {
              currentStatus: caseData.status,
              priorityLevel: caseData.priority,
              assignedOfficer: caseData.assignedTo,
              reporter: caseData.reporter
            },
            timeline: {
              reportedDate: caseData.reportedDate,
              lastUpdateDate: caseData.lastUpdated,
              daysOpen: Math.ceil((new Date().getTime() - new Date(caseData.reportedDate).getTime()) / (1000 * 3600 * 24))
            },
            environmentalImpact: {
              regionAffected: caseData.region,
              caseType: caseData.type,
              priorityLevel: caseData.priority,
              urgencyFlag: caseData.priority === 'Critical' || caseData.priority === 'High'
            }
          }
        };
        
        content = JSON.stringify(jsonData, null, 2);
        mimeType = 'application/json';
        fileExtension = 'json';
      } else {
        // Create text format (existing implementation)
        content = `
GHANA GOLD GUARD - CASE FILE REPORT
=====================================

CASE IDENTIFICATION
-------------------
Case ID: ${caseData.id}
Case Title: ${caseData.title}
Report Date: ${formatDate(caseData.reportedDate)}
Last Updated: ${formatDate(caseData.lastUpdated)}

CASE DETAILS
------------
Description: ${caseData.description}
Location: ${caseData.location || 'Not specified'}
Region: ${caseData.region}
Case Type: ${caseData.type}

STATUS INFORMATION
------------------
Current Status: ${caseData.status}
Priority Level: ${caseData.priority}
Assigned Officer: ${caseData.assignedTo}
Reporter: ${formatReporter(caseData.reporter)}

CASE TIMELINE
-------------
Reported: ${formatDate(caseData.reportedDate)} by ${formatReporter(caseData.reporter)}
Last Update: ${formatDate(caseData.lastUpdated)}
Days Open: ${Math.ceil((new Date().getTime() - new Date(caseData.reportedDate).getTime()) / (1000 * 3600 * 24))}

CASE SUMMARY
------------
This case involves ${caseData.type.toLowerCase()} in the ${caseData.region} region of Ghana.
The case was reported on ${formatDate(caseData.reportedDate)} by ${formatReporter(caseData.reporter)}.
Current status is "${caseData.status}" with ${caseData.priority.toLowerCase()} priority level.
${caseData.assignedTo} is currently handling this case.

ENVIRONMENTAL IMPACT ASSESSMENT
-------------------------------
Region Affected: ${caseData.region}
Case Type: ${caseData.type}
Priority Level: ${caseData.priority}
${caseData.priority === 'Critical' || caseData.priority === 'High' ? 'URGENT ACTION REQUIRED' : 'Standard monitoring protocols apply'}

Generated on: ${new Date().toLocaleString()}
System: Ghana Gold Guard Case Management System
Contact: info@goldguard.gov.gh
=====================================
`;
        mimeType = 'text/plain;charset=utf-8';
        fileExtension = 'txt';
      }

      // Create and download the file
      const blob = new Blob([content], { type: mimeType });
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `GoldGuard_Case_${caseData.id.replace(/[^a-zA-Z0-9]/g, '_')}_${new Date().toISOString().split('T')[0]}.${fileExtension}`;
      
      // Add to DOM, trigger download, and cleanup
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);

      // Show success message
      setDownloadMessage(`✅ Case file downloaded successfully (${format.toUpperCase()} format)!`);
      
      // Clear message after 3 seconds
      setTimeout(() => {
        setDownloadMessage('');
      }, 3000);
      
    } catch (error) {
      console.error('Error downloading case file:', error);
      setDownloadMessage('❌ Failed to download case file. Please try again.');
      
      // Clear error message after 5 seconds
      setTimeout(() => {
        setDownloadMessage('');
      }, 5000);
    }
  };

  const handleEditCase = (caseItem: Case) => {
    setEditingCase(caseItem);
    setEditStatus(caseItem.status);
    setEditAssignedTo(caseItem.assignedTo);
    setSaveMessage('');
  };

  const handleKeyPress = (event: React.KeyboardEvent) => {
    if (event.key === 'Enter' && !isSaving) {
      handleSaveEdit();
    }
    if (event.key === 'Escape') {
      handleCancelEdit();
    }
  };

  const handleSaveEdit = async () => {
    if (!editingCase) return;
    
    // Validation
    if (!editStatus || !editAssignedTo) {
      setSaveMessage('Please fill in all required fields.');
      return;
    }
    
    setIsSaving(true);
    setSaveMessage('');
    
    try {
      const updatedCase = {
        ...editingCase,
        status: editStatus as Case['status'],
        assignedTo: editAssignedTo,
        lastUpdated: new Date().toISOString().split('T')[0]
      };

      // Try to update backend first
      const token = localStorage.getItem('goldguard_admin_session');
      if (token) {
        try {
          const response = await fetch(`http://localhost:5000/api/cases/${editingCase.id}`, {
            method: 'PUT',
            headers: {
              'Authorization': `Bearer ${token}`,
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({
              status: editStatus,
              assignedTo: editAssignedTo,
              lastUpdated: updatedCase.lastUpdated
            }),
          });

          if (response.ok) {
            console.log('Case updated in backend successfully');
          } else {
            console.warn('Failed to update backend, proceeding with local update');
          }
        } catch (backendError) {
          console.warn('Backend not available, proceeding with local update only');
        }
      }

      // Update localStorage
      const savedReports = JSON.parse(localStorage.getItem('goldguard_reports') || '[]');
      const updatedReports = savedReports.map((report: any) => {
        if (report.id === editingCase.id) {
          return {
            ...report,
            status: editStatus,
            assignedTo: editAssignedTo,
            lastUpdated: updatedCase.lastUpdated
          };
        }
        return report;
      });
      localStorage.setItem('goldguard_reports', JSON.stringify(updatedReports));

      // Update local state
      setCases(prev => prev.map(c => c.id === editingCase.id ? updatedCase : c));
      setSaveMessage('Case updated successfully!');
      
      // Auto-close modal after successful save
      setTimeout(() => {
        setEditingCase(null);
        setEditStatus('');
        setEditAssignedTo('');
        setSaveMessage('');
      }, 1500);
      
    } catch (error) {
      console.error('Error saving case:', error);
      setSaveMessage('Error saving changes. Please try again.');
    } finally {
      setIsSaving(false);
    }
  };

  const handleCancelEdit = () => {
    setEditingCase(null);
    setEditStatus('');
    setEditAssignedTo('');
    setSaveMessage('');
    setIsSaving(false);
  };

  return (
    <AdminProtection>
      <div className={`min-h-screen ${theme === "dark" ? "bg-gray-900 text-white" : theme === "taupe" ? "bg-[#f5f3ef] text-gray-800" : "bg-white text-gray-800"} flex flex-col`}>
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
                {item.action !== undefined ? (
                  <button
                    onClick={item.id === "logout" ? handleLogout : item.action}
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
        <div className="flex-1 p-8 space-y-8 bg-[#f5f3ed]">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-3xl font-bold text-[#2a260f]">Case Management</h2>
              <p className="text-[#6b5e36]">Track and manage investigation cases</p>
            </div>
            <button className="flex items-center space-x-2 bg-amber-600 hover:bg-amber-700 text-white px-4 py-2 rounded-lg transition-colors">
              <Download className="w-5 h-5" />
              <span>Export Cases</span>
            </button>
          </div>
          {/* Filters */}
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
              <div className="lg:col-span-2">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                  <input
                    type="text"
                    placeholder="Search cases..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-amber-500"
                  />
                </div>
              </div>
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-amber-500"
                title="Filter by status"
                aria-label="Filter by status"
              >
                {statuses.map(status => (
                  <option key={status} value={status}>Status: {status}</option>
                ))}
              </select>
              <select
                value={priorityFilter}
                onChange={(e) => setPriorityFilter(e.target.value)}
                className="px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-amber-500"
                title="Filter by priority"
                aria-label="Filter by priority"
              >
                {priorities.map(priority => (
                  <option key={priority} value={priority}>Priority: {priority}</option>
                ))}
              </select>
              <select
                value={regionFilter}
                onChange={(e) => setRegionFilter(e.target.value)}
                className="px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-amber-500"
                title="Filter by region"
                aria-label="Filter by region"
              >
                {regions.map(region => (
                  <option key={region} value={region}>Region: {region}</option>
                ))}
              </select>
            </div>
          </div>
          {/* Cases Grid */}
          <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6">
            {filteredCases.map((caseItem) => (
              <div key={caseItem.id} className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 hover:shadow-md transition-shadow">
                <div className="flex items-start justify-between mb-4">
                  <div className="flex-1">
                    <h3 className="font-semibold text-[#2a260f] mb-2 line-clamp-2">{caseItem.title}</h3>
                    <p className="text-sm text-[#6b5e36] mb-2">ID: {caseItem.id}</p>
                  </div>
                  <div className="flex items-center space-x-1 ml-2">
                    <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getPriorityColor(caseItem.priority)}`}> 
                      {caseItem.priority}
                    </span>
                  </div>
                </div>
                <div className="space-y-2 mb-4">
                  <div className="flex items-center text-sm text-[#6b5e36]">
                    <MapPin className="w-4 h-4 mr-2" />
                    {caseItem.region}
                  </div>
                  <div className="flex items-center text-sm text-[#6b5e36]">
                    <Calendar className="w-4 h-4 mr-2" />
                    {new Date(caseItem.reportedDate).toLocaleDateString()}
                  </div>
                  <div className="flex items-center text-sm text-[#6b5e36]">
                    <AlertTriangle className="w-4 h-4 mr-2" />
                    {caseItem.type}
                  </div>
                  {caseItem.evidence && caseItem.evidence.length > 0 && (
                    <div className="flex items-center text-sm text-green-600">
                      <ImageIcon className="w-4 h-4 mr-2" />
                      {caseItem.evidence.length} evidence image{caseItem.evidence.length !== 1 ? 's' : ''}
                    </div>
                  )}
                </div>
                <div className="flex items-center justify-between mb-4">
                  <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getStatusColor(caseItem.status)}`}>
                    {caseItem.status}
                  </span>
                  <span className="text-xs text-[#6b5e36]">
                    Assigned to: {caseItem.assignedTo}
                  </span>
                </div>
                <p className="text-sm text-[#6b5e36] mb-4 line-clamp-2">
                  {caseItem.description}
                </p>
                <div className="flex items-center justify-between">
                  <span className="text-xs text-[#6b5e36]">
                    Updated: {formatDate(caseItem.lastUpdated)}
                  </span>
                  <div className="flex items-center space-x-2">
                    <button
                      onClick={() => setSelectedCase(caseItem)}
                      className="text-amber-600 hover:text-amber-900"
                      title="View Details"
                      aria-label="View Details"
                    >
                      <Eye className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => handleEditCase(caseItem)}
                      className="text-blue-600 hover:text-blue-900"
                      title="Edit Case"
                      aria-label="Edit Case"
                    >
                      <Edit className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => handleDeleteCase(caseItem.id)}
                      className="text-red-600 hover:text-red-900"
                      title="Delete Case"
                      aria-label="Delete Case"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
          {/* Case Detail Modal */}
          {selectedCase && (
            <div className="absolute inset-0 flex bg-opacity-50 items-center justify-center pt-150">
              <div className="bg-white rounded-lg shadow-xl p-6 max-w-3xl w-full mx-4 ml-68 max-h-[90vh] overflow-y-auto pointer-events-auto">
                <div className="flex items-center justify-between mb-6">
                  <h3 className="text-2xl font-semibold text-[#2a260f]">Case Details</h3>
                  <button
                    onClick={() => setSelectedCase(null)}
                    className="text-gray-400 hover:text-gray-600"
                    title="Close Details"
                    aria-label="Close Details"
                  >
                    <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  </button>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-4">
                    <div>
                      <label className="block text-sm font-medium text-[#6b5e36] mb-1">Case ID</label>
                      <p className="text-sm text-[#2a260f]">{selectedCase.id}</p>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-[#6b5e36] mb-1">Title</label>
                      <p className="text-sm text-[#2a260f]">{selectedCase.title}</p>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-[#6b5e36] mb-1">Description</label>
                      <p className="text-sm text-[#2a260f]">{selectedCase.description}</p>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-[#6b5e36] mb-1">Location</label>
                      <p className="text-sm text-[#2a260f]">{selectedCase.location || 'Not specified'}</p>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-[#6b5e36] mb-1">Reporter</label>
                      <p className="text-sm text-[#2a260f]">{formatReporter(selectedCase.reporter)}</p>
                    </div>
                  </div>
                  <div className="space-y-4">
                    <div>
                      <label className="block text-sm font-medium text-[#6b5e36] mb-1">Region</label>
                      <p className="text-sm text-[#2a260f]">{selectedCase.region}</p>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-[#6b5e36] mb-1">Type</label>
                      <p className="text-sm text-[#2a260f]">{selectedCase.type}</p>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-[#6b5e36] mb-1">Status</label>
                      <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getStatusColor(selectedCase.status)}`}>
                        {selectedCase.status}
                      </span>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-[#6b5e36] mb-1">Priority</label>
                      <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getPriorityColor(selectedCase.priority)}`}>
                        {selectedCase.priority}
                      </span>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-[#6b5e36] mb-1">Assigned Officer</label>
                      <p className="text-sm text-[#2a260f]">{selectedCase.assignedTo}</p>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-[#6b5e36] mb-1">Reported Date</label>
                      <p className="text-sm text-[#2a260f]">{formatDate(selectedCase.reportedDate)}</p>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-[#6b5e36] mb-1">Last Updated</label>
                      <p className="text-sm text-[#2a260f]">{formatDate(selectedCase.lastUpdated)}</p>
                    </div>
                  </div>
                </div>
                
                {/* Evidence Images Section */}
                {selectedCase.evidence && selectedCase.evidence.length > 0 && (
                  <div className="mt-6 pt-6 border-t border-gray-200">
                    <label className="block text-sm font-medium text-[#6b5e36] mb-4">Evidence Images ({selectedCase.evidence.length})</label>
                    <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
                      {selectedCase.evidence.map((evidence, index) => (
                        <div key={index} className="bg-gray-50 rounded-lg p-4">
                          <div className="aspect-w-16 aspect-h-12 mb-3">
                            {evidence.fileUrl ? (
                              <div className="w-full h-32 bg-gray-200 rounded-lg flex items-center justify-center">
                                <ImageIcon className="w-8 h-8 text-gray-400" />
                                <span className="ml-2 text-sm text-gray-600">Image: {evidence.fileName}</span>
                              </div>
                            ) : (
                              <div className="w-full h-32 bg-gray-200 rounded-lg flex items-center justify-center">
                                <ImageIcon className="w-8 h-8 text-gray-400" />
                                <span className="ml-2 text-sm text-gray-600">{evidence.fileName}</span>
                              </div>
                            )}
                          </div>
                          <div className="space-y-1 text-xs text-gray-600">
                            <p><span className="font-medium">File:</span> {evidence.fileName}</p>
                            <p><span className="font-medium">Type:</span> {evidence.type}</p>
                            {evidence.description && (
                              <p><span className="font-medium">Description:</span> {evidence.description}</p>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
                
                {/* Download Message */}
                {downloadMessage && (
                  <div className={`mt-4 p-3 rounded-lg text-sm ${
                    downloadMessage.includes('❌') 
                      ? 'bg-red-100 text-red-800 border border-red-200' 
                      : 'bg-green-100 text-green-800 border border-green-200'
                  }`}>
                    {downloadMessage}
                  </div>
                )}
                
                <div className="flex flex-col sm:flex-row sm:space-x-3 space-y-3 sm:space-y-0 mt-6 pt-6 border-t border-gray-200">
                  <button className="w-full sm:w-auto bg-amber-600 hover:bg-amber-700 text-white px-4 py-2 rounded-lg transition-colors text-sm font-medium" title="Update Status" aria-label="Update Status">
                    Update Status
                  </button>
                  <button className="w-full sm:w-auto bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg transition-colors text-sm font-medium" title="Assign Officer" aria-label="Assign Officer">
                    Assign Officer
                  </button>
                  <button className="w-full sm:w-auto bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-lg transition-colors text-sm font-medium" title="Generate Report" aria-label="Generate Report">
                    Generate Report
                  </button>
                  
                  {/* Quick Download Button */}
                  <button 
                    className="w-full sm:w-auto bg-purple-600 hover:bg-purple-700 text-white px-4 py-2 rounded-lg transition-colors text-sm font-medium flex items-center gap-2" 
                    title="Quick Download Text Report" 
                    aria-label="Quick Download Text Report"
                    onClick={() => handleDownloadCaseFile(selectedCase, 'txt')}
                  >
                    <Download size={16} />
                    Download Case File
                  </button>
                </div>
              </div>
            </div>
          )}
          {/* Edit Case Modal */}
          {editingCase && (
            <div className="absolute inset-0 flex bg-opacity-50 items-center justify-center pt-150">
              <div 
                className="bg-white rounded-lg shadow-xl p-6 max-w-3xl w-full mx-4 ml-68 max-h-[90vh] overflow-y-auto pointer-events-auto"
                onKeyDown={handleKeyPress}
                tabIndex={-1}
              >
                <div className="flex items-center justify-between mb-6">
                  <h3 className="text-2xl font-semibold text-[#2a260f]">Edit Case</h3>
                  <button
                    onClick={handleCancelEdit}
                    className="text-gray-400 hover:text-gray-600"
                    title="Close Edit"
                    aria-label="Close Edit"
                  >
                    <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  </button>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-4">
                    <div>
                      <label className="block text-sm font-medium text-[#6b5e36] mb-1">Case ID</label>
                      <p className="text-sm text-[#2a260f] bg-gray-50 px-3 py-2 rounded-lg">{editingCase.id}</p>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-[#6b5e36] mb-1">Title</label>
                      <p className="text-sm text-[#2a260f] bg-gray-50 px-3 py-2 rounded-lg">{editingCase.title}</p>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-[#6b5e36] mb-1">Description</label>
                      <p className="text-sm text-[#2a260f] bg-gray-50 px-3 py-2 rounded-lg">{editingCase.description}</p>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-[#6b5e36] mb-1">Location</label>
                      <p className="text-sm text-[#2a260f] bg-gray-50 px-3 py-2 rounded-lg">{editingCase.location || 'Not specified'}</p>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-[#6b5e36] mb-1">Reporter</label>
                      <p className="text-sm text-[#2a260f] bg-gray-50 px-3 py-2 rounded-lg">{formatReporter(editingCase.reporter)}</p>
                    </div>
                  </div>
                  <div className="space-y-4">
                    <div>
                      <label className="block text-sm font-medium text-[#6b5e36] mb-1">Region</label>
                      <p className="text-sm text-[#2a260f] bg-gray-50 px-3 py-2 rounded-lg">{editingCase.region}</p>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-[#6b5e36] mb-1">Type</label>
                      <p className="text-sm text-[#2a260f] bg-gray-50 px-3 py-2 rounded-lg">{editingCase.type}</p>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-[#6b5e36] mb-1">Status</label>
                      <select
                        value={editStatus}
                        onChange={(e) => setEditStatus(e.target.value)}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-amber-500 focus:border-transparent"
                        title="Select case status"
                        aria-label="Select case status"
                      >
                        {editableStatuses.map(status => (
                          <option key={status} value={status}>{status}</option>
                        ))}
                      </select>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-[#6b5e36] mb-1">Priority</label>
                      <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getPriorityColor(editingCase.priority)}`}>
                        {editingCase.priority}
                      </span>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-[#6b5e36] mb-1">Assigned Officer</label>
                      <select
                        value={editAssignedTo}
                        onChange={(e) => setEditAssignedTo(e.target.value)}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-amber-500 focus:border-transparent"
                        title="Select assigned officer"
                        aria-label="Select assigned officer"
                      >
                        {officers.map(officer => (
                          <option key={officer} value={officer}>{officer}</option>
                        ))}
                      </select>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-[#6b5e36] mb-1">Reported Date</label>
                      <p className="text-sm text-[#2a260f] bg-gray-50 px-3 py-2 rounded-lg">{formatDate(editingCase.reportedDate)}</p>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-[#6b5e36] mb-1">Last Updated</label>
                      <p className="text-sm text-[#2a260f] bg-gray-50 px-3 py-2 rounded-lg">{formatDate(editingCase.lastUpdated)}</p>
                    </div>
                  </div>
                </div>
                {/* Save Message */}
                {saveMessage && (
                  <div className={`mt-4 p-3 rounded-lg text-sm ${
                    saveMessage.includes('Error') 
                      ? 'bg-red-100 text-red-800 border border-red-200' 
                      : 'bg-green-100 text-green-800 border border-green-200'
                  }`}>
                    {saveMessage}
                  </div>
                )}
                <div className="flex flex-col sm:flex-row sm:space-x-3 space-y-3 sm:space-y-0 mt-6 pt-6 border-t border-gray-200">
                  <button 
                    onClick={handleSaveEdit}
                    disabled={isSaving}
                    className={`w-full sm:w-auto px-6 py-2 rounded-lg transition-colors text-sm font-medium flex items-center justify-center ${
                      isSaving 
                        ? 'bg-gray-400 cursor-not-allowed text-white' 
                        : 'bg-green-600 hover:bg-green-700 text-white'
                    }`}
                  >
                    {isSaving ? (
                      <>
                        <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                        </svg>
                        Saving...
                      </>
                    ) : (
                      'Save Changes'
                    )}
                  </button>
                  <button 
                    onClick={handleCancelEdit}
                    disabled={isSaving}
                    className={`w-full sm:w-auto px-6 py-2 rounded-lg transition-colors text-sm font-medium ${
                      isSaving 
                        ? 'bg-gray-300 cursor-not-allowed text-gray-500' 
                        : 'bg-gray-600 hover:bg-gray-700 text-white'
                    }`}
                  >
                    Cancel
                  </button>
                </div>
              </div>
            </div>
          )}
          {/* Empty State */}
          {filteredCases.length === 0 && (
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-12 text-center">
              <AlertTriangle className="w-12 h-12 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-[#2a260f] mb-2">No cases found</h3>
              <p className="text-[#6b5e36]">Try adjusting your search criteria or filters.</p>
            </div>
          )}
        </div>
      </div>
      <Footer />
    </div>
    </AdminProtection>
  );
};
export default CasePage;