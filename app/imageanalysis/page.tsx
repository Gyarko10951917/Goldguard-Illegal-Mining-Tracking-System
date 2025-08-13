"use client";
import {
  AlertTriangle,
  Briefcase,
  Calendar,
  Camera,
  CheckCircle,
  Download,
  Eye,
  FileText,
  ImageIcon,
  LayoutDashboard,
  LogOut,
  MapPin,
  Search,
  Settings,
  Upload,
  User,
  Users,
  XCircle
} from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import React, { useCallback, useEffect, useRef, useState } from "react";
import AdminProtection from "../component/AdminProtection";
import { useAdminSession } from "../component/hooks/useAdminSession";
import AdminNavBar from "../component/landingpage/AdminNavBar";
import Footer from "../component/landingpage/footer";
import { useTheme } from "../component/ThemeContext";

// Define the UnverifiedCase interface
interface UnverifiedCase {
  id: string;
  title: string;
  region: string;
  type: string;
  status: 'Pending Verification' | 'Under Review' | 'Verified' | 'Rejected';
  priority: 'Low' | 'Medium' | 'High' | 'Critical';
  reportedDate: string;
  reporter: string;
  description: string;
  images: string[];
  hasLocation: boolean;
  metadata?: Array<{
    fileName: string;
    fileSize: string;
    dimensions: string;
    dateTime: string;
    location?: {
      latitude: number;
      longitude: number;
      address?: string;
    };
    camera?: {
      make: string;
      model: string;
      settings: string;
    };
    verified: boolean;
    caseId: string;
  }>;
}

// Interface for backend case data
interface BackendCase {
  caseId: string;
  title: string;
  region: string;
  type: string;
  status: string;
  priority: string;
  createdAt: string;
  updatedAt: string;
  description: string;
  location?: {
    address?: string;
    coordinates?: {
      latitude: number;
      longitude: number;
    };
  };
  reporter?: {
    isAnonymous: boolean;
    profile?: {
      firstName: string;
      lastName: string;
    };
  };
  evidence?: Array<{
    type: string;
    description: string;
    fileUrl: string;
    fileName: string;
  }>;
}
// Interface for real case data from localStorage/backend
interface RealCaseData {
  id?: string;
  type: string;
  region: string;
  description: string;
  affectedArea?: string;
  location?: { 
    address?: string;
    coordinates?: {
      latitude: number;
      longitude: number;
    };
  };
  isAnonymous?: boolean;
  fullName?: string;
  submittedAt?: string;
  verificationStatus?: 'Verified' | 'Rejected' | 'Pending Verification';
  verifiedAt?: string;
  evidence?: Array<{
    type: string;
    description: string;
    fileUrl: string;
    fileName: string;
  }>;
}

// Main component
const ImageAnalysis = () => {
  // State variables
  const [unverifiedCases, setUnverifiedCases] = useState<UnverifiedCase[]>([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("All");
  const [activeTab, setActiveTab] = useState("upload");
  const [selectedCase, setSelectedCase] = useState<UnverifiedCase | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [extractedMetadata, setExtractedMetadata] = useState<{
    fileName: string;
    fileSize: string;
    dimensions: string;
    dateTime: string;
    location?: {
      latitude: number;
      longitude: number;
      address?: string;
    };
    camera?: {
      make: string;
      model: string;
      settings: string;
    };
  } | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { theme } = useTheme();
  const router = useRouter();
  const { currentAdmin } = useAdminSession();
  const [activeSection, setActiveSection] = useState("imageanalysis");
  const [notifications, setNotifications] = useState<Array<{
    id: number;
    message: string;
    type: 'success' | 'error' | 'info';
    timestamp: number;
  }>>([]);

  // Function to load real case data from localStorage and backend
  const loadRealCaseData = useCallback(async () => {
    console.log('Starting to load real case data...');
    try {
      // Load from localStorage first
      const savedReports = JSON.parse(localStorage.getItem('goldguard_reports') || '[]');
      console.log('Loaded from localStorage:', savedReports.length, 'reports');
      
      let allCases: RealCaseData[] = [...savedReports];
      
      // Try to load from backend as well
      try {
        const adminSession = localStorage.getItem('goldguard_admin_session');
        if (adminSession) {
          const token = JSON.parse(adminSession).token;
          const response = await fetch('http://localhost:5000/api/reports', {
            headers: {
              'Authorization': `Bearer ${token}`,
              'Content-Type': 'application/json'
            }
          });
          
          if (response.ok) {
            const backendCases: BackendCase[] = await response.json();
            // Combine with localStorage cases, avoiding duplicates
            const backendIds = new Set(savedReports.map((r: RealCaseData) => r.id));
            const newBackendCases = backendCases.filter((bc: BackendCase) => !backendIds.has(bc.caseId));
            allCases = [...allCases, ...newBackendCases.map((bc: BackendCase) => ({
              id: bc.caseId,
              type: bc.type,
              region: bc.region,
              description: bc.description,
              location: bc.location,
              isAnonymous: bc.reporter?.isAnonymous,
              fullName: bc.reporter?.isAnonymous ? undefined : `${bc.reporter?.profile?.firstName} ${bc.reporter?.profile?.lastName}`,
              submittedAt: bc.createdAt,
              evidence: bc.evidence || []
            }))];
          }
        }
      } catch {
        console.log('Backend not available, using localStorage only');
      }
      
      // Convert real case data to UnverifiedCase format
      const convertedCases: UnverifiedCase[] = allCases
        .filter(caseData => caseData.evidence && caseData.evidence.length > 0) // Only cases with images
        .map((caseData, index) => {
          const reportDate = caseData.submittedAt ? new Date(caseData.submittedAt) : new Date();
          
          return {
            id: caseData.id || `CASE-${Date.now()}-${index}`,
            title: `${caseData.type} - ${caseData.region}`,
            region: caseData.region || 'Unknown',
            type: caseData.type || 'Environmental Incident',
            status: (caseData.verificationStatus || 'Pending Verification') as 'Pending Verification' | 'Under Review' | 'Verified' | 'Rejected',
            priority: determinePriority(caseData.type),
            reportedDate: reportDate.toISOString().split('T')[0],
            reporter: caseData.isAnonymous ? 'Anonymous Reporter' : (caseData.fullName || 'Community Member'),
            description: caseData.description || 'No description provided',
            images: caseData.evidence?.filter(e => e.type === 'Photo').map(e => e.fileName) || [],
            hasLocation: !!(caseData.location?.coordinates || caseData.location?.address),
            metadata: caseData.evidence?.filter(e => e.type === 'Photo').map(evidence => ({
              fileName: evidence.fileName,
              fileSize: '2.1 MB', // Default value since not tracked
              dimensions: '1920x1080', // Default value since not tracked
              dateTime: reportDate.toISOString().replace('T', ' ').substring(0, 19),
              location: caseData.location?.coordinates ? {
                latitude: caseData.location.coordinates.latitude,
                longitude: caseData.location.coordinates.longitude,
                address: caseData.location.address || `${caseData.region}, Ghana`
              } : undefined,
              camera: {
                make: 'Unknown',
                model: 'Unknown',
                settings: 'Unknown'
              },
              verified: false,
              caseId: caseData.id || `CASE-${Date.now()}-${index}`
            }))
          };
        });
      
      console.log('Converted cases for image analysis:', convertedCases.length);
      setUnverifiedCases(convertedCases);
      return convertedCases.length; // Return count for refresh notification
    } catch (error) {
      console.error('Error loading real case data:', error);
      setUnverifiedCases([]);
      return 0;
    }
  }, []);
  
  // Helper function to determine priority based on case type
  const determinePriority = (caseType: string): 'Low' | 'Medium' | 'High' | 'Critical' => {
    const highPriorityTypes = ['water pollution', 'water contamination', 'toxic waste'];
    const criticalPriorityTypes = ['chemical spill', 'radiation'];
    
    const lowerCaseType = caseType.toLowerCase();
    
    if (criticalPriorityTypes.some(type => lowerCaseType.includes(type))) return 'Critical';
    if (highPriorityTypes.some(type => lowerCaseType.includes(type))) return 'High';
    if (lowerCaseType.includes('illegal mining') || lowerCaseType.includes('deforestation')) return 'Medium';
    return 'Low';
  };

  // Load real case data on component mount
  useEffect(() => {
    loadRealCaseData();
  }, [loadRealCaseData]);

  // Handler for refresh button
  const handleRefreshCases = async () => {
    console.log('Refresh Cases button clicked');
    setIsRefreshing(true);
    try {
      const casesCount = await loadRealCaseData();
      console.log('Cases refreshed successfully, total cases:', casesCount);
      addNotification(
        `Cases refreshed successfully! Found ${casesCount} case${casesCount !== 1 ? 's' : ''} with images.`,
        'success'
      );
    } catch (error) {
      console.error('Error refreshing cases:', error);
      addNotification('Error refreshing cases. Please try again.', 'error');
    } finally {
      setIsRefreshing(false);
    }
  };

  // Sidebar items from admin-dashboard
  const sidebarItems = [
    { id: "dashboard", label: "Dashboard", href: "/admin-dashboard", icon: LayoutDashboard },
    { id: "cases", label: "Cases", href: "/cases", icon: Briefcase },
    { id: "imageanalysis", label: "Image Analysis", href: "/imageanalysis", icon: Eye },
    { id: "management", label: "Management", href: "/management", icon: Users },
    { id: "settings", label: "Settings", href: "/settings", icon: Settings },
    { id: "logout", label: "Logout", href: "#", icon: LogOut, action: () => {
      // Clear admin session
      localStorage.removeItem('goldguard_admin_session');
      localStorage.removeItem('goldguard_admin_timestamp');
      // Redirect to main page instead of admin login
      router.push("/");
    }},
  ];

  // Notification helper functions
  const addNotification = (message: string, type: 'success' | 'error' | 'info' = 'success') => {
    const id = Date.now();
    setNotifications(prev => [...prev, { id, message, type, timestamp: id }]);
    
    // Auto-remove notification after 5 seconds
    setTimeout(() => {
      setNotifications(prev => prev.filter(notif => notif.id !== id));
    }, 5000);
  };

  const removeNotification = (id: number) => {
    setNotifications(prev => prev.filter(notif => notif.id !== id));
  };

  // Dummy handleFileUpload function
  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (ev) => {
        setImagePreview(ev.target?.result as string);
        setIsAnalyzing(true);
        // Simulate analysis
        setTimeout(() => {
          setExtractedMetadata({
            fileName: file.name,
            fileSize: `${(file.size / 1024 / 1024).toFixed(2)} MB`,
            dimensions: "4032x3024",
            dateTime: "2024-01-18 14:30:22",
            location: {
              latitude: 6.6885,
              longitude: -1.6244,
              address: "Near Kumasi, Ashanti Region"
            },
            camera: {
              make: "Canon",
              model: "EOS R5",
              settings: "f/8, 1/250s, ISO 200"
            }
          });
          setIsAnalyzing(false);
          addNotification('Image metadata extracted successfully! Location and camera data found.', 'success');
        }, 1500);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleVerifyCase = (caseId: string, status: 'Verified' | 'Rejected') => {
    setUnverifiedCases(prev => 
      prev.map(c => 
        c.id === caseId ? { ...c, status } : c
      )
    );
    
    // Also update the verification status in localStorage/backend
    try {
      // Update localStorage reports
      const savedReports = JSON.parse(localStorage.getItem('goldguard_reports') || '[]');
      const updatedReports = savedReports.map((report: RealCaseData) => {
        if (report.id === caseId) {
          return {
            ...report,
            verificationStatus: status,
            verifiedAt: new Date().toISOString()
          };
        }
        return report;
      });
      localStorage.setItem('goldguard_reports', JSON.stringify(updatedReports));
      
      // TODO: Also send verification status to backend API if available
      
    } catch (error) {
      console.error('Error updating verification status:', error);
    }
    
    // Show notification
    const message = status === 'Verified' 
      ? `Case ${caseId} has been verified successfully!` 
      : `Case ${caseId} has been rejected.`;
    addNotification(message, status === 'Verified' ? 'success' : 'info');
  };

  const handleVerifyLocation = () => {
    if (extractedMetadata?.location) {
      // Create a new case entry with verified location
      const newCase: UnverifiedCase = {
        id: `CASE-${new Date().getFullYear()}-${String(Date.now()).slice(-6)}`,
        title: `Location Verified: ${extractedMetadata.fileName}`,
        region: extractedMetadata.location.address || 'Unknown Region',
        type: 'Location Verification',
        status: 'Verified',
        priority: 'Medium',
        reportedDate: new Date().toISOString().split('T')[0],
        reporter: 'System Admin',
        description: `Location verified from image metadata. GPS coordinates: ${extractedMetadata.location.latitude.toFixed(6)}, ${extractedMetadata.location.longitude.toFixed(6)}`,
        images: [extractedMetadata.fileName],
        hasLocation: true,
        metadata: [{
          fileName: extractedMetadata.fileName,
          fileSize: extractedMetadata.fileSize,
          dimensions: extractedMetadata.dimensions,
          dateTime: extractedMetadata.dateTime,
          location: extractedMetadata.location,
          camera: extractedMetadata.camera,
          verified: true,
          caseId: `CASE-${new Date().getFullYear()}-${String(Date.now()).slice(-6)}`
        }]
      };

      // Add the new case to unverified cases
      setUnverifiedCases(prev => [...prev, newCase]);
      
      // Show success notification
      addNotification('Location verified successfully! A new case has been created with the verified location data.', 'success');
    } else {
      addNotification('No location data available to verify. Please upload an image with GPS coordinates.', 'error');
    }
  };

  const handleExportReport = () => {
    if (extractedMetadata) {
      // Create comprehensive report data
      const reportData = {
        reportGenerated: new Date().toISOString(),
        reportType: 'Gold Guard - Image Metadata Analysis Report',
        generatedBy: 'Gold Guard Admin System',
        imageAnalysis: {
          fileName: extractedMetadata.fileName,
          fileSize: extractedMetadata.fileSize,
          dimensions: extractedMetadata.dimensions,
          dateTime: extractedMetadata.dateTime,
        },
        locationData: extractedMetadata.location ? {
          status: 'Location Available',
          latitude: extractedMetadata.location.latitude,
          longitude: extractedMetadata.location.longitude,
          address: extractedMetadata.location.address || 'Address not available',
          coordinatesPrecision: 'GPS'
        } : {
          status: 'No Location Data',
          message: 'No GPS coordinates found in image metadata'
        },
        cameraData: extractedMetadata.camera ? {
          status: 'Camera Information Available',
          make: extractedMetadata.camera.make,
          model: extractedMetadata.camera.model,
          settings: extractedMetadata.camera.settings
        } : {
          status: 'No Camera Data',
          message: 'No camera information found in image metadata'
        },
        verification: {
          locationVerified: extractedMetadata.location ? true : false,
          verificationTimestamp: new Date().toISOString(),
          verificationMethod: 'EXIF Metadata Analysis'
        }
      };

      // Create human-readable text report
      const textReport = `
GOLD GUARD - IMAGE ANALYSIS REPORT
==================================

Report Generated: ${new Date().toLocaleString()}
Generated By: Gold Guard Admin System

IMAGE INFORMATION:
-----------------
File Name: ${extractedMetadata.fileName}
File Size: ${extractedMetadata.fileSize}
Dimensions: ${extractedMetadata.dimensions}
Date/Time: ${extractedMetadata.dateTime}

LOCATION ANALYSIS:
-----------------
${extractedMetadata.location ? `
Status: ✅ Location Available
Latitude: ${extractedMetadata.location.latitude.toFixed(6)}
Longitude: ${extractedMetadata.location.longitude.toFixed(6)}
Address: ${extractedMetadata.location.address || 'Address not available'}
Coordinates Source: GPS/EXIF Data
` : `
Status: ❌ No Location Data
Details: No GPS coordinates found in image metadata
`}

CAMERA INFORMATION:
------------------
${extractedMetadata.camera ? `
Status: ✅ Camera Data Available
Make: ${extractedMetadata.camera.make}
Model: ${extractedMetadata.camera.model}
Settings: ${extractedMetadata.camera.settings}
` : `
Status: ❌ No Camera Data
Details: No camera information found in image metadata
`}

VERIFICATION SUMMARY:
-------------------
Location Verified: ${extractedMetadata.location ? '✅ Yes' : '❌ No'}
Verification Method: EXIF Metadata Analysis
Verification Time: ${new Date().toLocaleString()}

---
This report was generated by the Gold Guard Environmental Monitoring System.
For questions or additional analysis, contact the system administrator.
      `.trim();

      // Export JSON report
      const jsonBlob = new Blob([JSON.stringify(reportData, null, 2)], { type: 'application/json' });
      const jsonUrl = window.URL.createObjectURL(jsonBlob);
      const jsonLink = document.createElement('a');
      jsonLink.href = jsonUrl;
      jsonLink.download = `GoldGuard_Analysis_${extractedMetadata.fileName.replace(/\.[^/.]+$/, '')}_${Date.now()}.json`;
      document.body.appendChild(jsonLink);
      jsonLink.click();
      document.body.removeChild(jsonLink);
      window.URL.revokeObjectURL(jsonUrl);

      // Export text report
      const textBlob = new Blob([textReport], { type: 'text/plain' });
      const textUrl = window.URL.createObjectURL(textBlob);
      const textLink = document.createElement('a');
      textLink.href = textUrl;
      textLink.download = `GoldGuard_Report_${extractedMetadata.fileName.replace(/\.[^/.]+$/, '')}_${Date.now()}.txt`;
      document.body.appendChild(textLink);
      textLink.click();
      document.body.removeChild(textLink);
      window.URL.revokeObjectURL(textUrl);

      // Show success notification
      addNotification('Reports exported successfully! Both JSON and text format reports have been downloaded.', 'success');
    } else {
      addNotification('No metadata available to export. Please upload and analyze an image first.', 'error');
    }
  };

  const filteredCases = unverifiedCases.filter(caseItem => {
    const matchesSearch = caseItem.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         caseItem.id.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         caseItem.description.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = statusFilter === 'All' || caseItem.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'Pending Verification': return 'bg-yellow-100 text-yellow-800';
      case 'Under Review': return 'bg-blue-100 text-blue-800';
      case 'Verified': return 'bg-green-100 text-green-800';
      case 'Rejected': return 'bg-red-100 text-red-800';
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

  return (
    <AdminProtection>
      <div className={`min-h-screen ${theme === "dark" ? "bg-gray-900 text-white" : theme === "taupe" ? "bg-[#f5f3ef] text-gray-800" : "bg-white text-gray-800"}`}>
      <AdminNavBar adminInitials={currentAdmin.initials} />
      <div className="flex pt-16">
        {/* Sidebar - exact match to management page */}
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
                    className={`w-full flex items-center space-x-3 px-3 py-2 rounded-lg transition-colors font-semibold ${
                      activeSection === item.id
                        ? "bg-[#b8b0a1] text-[#2a260f] shadow-md"
                        : "hover:bg-[#e6e0d6] text-[#2a260f]"
                    }`}
                    title={item.label}
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
                    onClick={() => setActiveSection(item.id)}
                    title={item.label}
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
        <div className="flex-1 p-8 bg-white/80 rounded-xl shadow-lg mx-4 my-6">
          {/* Header */}
          <div className="space-y-6">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-2xl font-bold text-gray-800 mb-1">Image Analysis & Verification</h2>
                <p className="text-gray-600 text-base mb-4">Extract metadata from images and verify reported cases</p>
              </div>
              <button
                onClick={handleRefreshCases}
                disabled={isRefreshing}
                className={`px-4 py-2 rounded-lg transition-colors flex items-center gap-2 ${
                  isRefreshing 
                    ? 'bg-gray-400 cursor-not-allowed text-white' 
                    : 'bg-blue-600 hover:bg-blue-700 text-white'
                }`}
                title="Refresh Cases"
              >
                <Search className={`w-4 h-4 ${isRefreshing ? 'animate-spin' : ''}`} />
                {isRefreshing ? 'Refreshing...' : 'Refresh Cases'}
              </button>
            </div>
          </div>

          {/* Tab Navigation */}
          <div className="bg-white rounded-lg shadow-sm mb-8">
            <div className="border-b border-gray-200">
              <nav className="flex space-x-8 px-6">
                {[
                  { id: 'upload', label: 'Image Analysis', icon: Upload },
                  { id: 'cases', label: 'Unverified Cases', icon: AlertTriangle }
                ].map(({ id, label, icon: Icon }) => (
                  <button
                    key={id}
                    onClick={() => setActiveTab(id)}
                    className={`flex items-center py-4 px-2 border-b-2 font-medium text-sm ${
                      activeTab === id
                        ? 'border-amber-500 text-amber-600'
                        : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                    }`}
                    title={label}
                  >
                    <Icon className="w-5 h-5 mr-2" />
                    {label}
                  </button>
                ))}
              </nav>
            </div>
          </div>

          {/* Image Analysis Tab */}
          {activeTab === 'upload' && (
            <div className="space-y-8">
              {/* Upload Section */}
              <div className="bg-white rounded-lg shadow-sm p-6">
                <h2 className="text-xl font-semibold text-gray-900 mb-4">Upload Image for Analysis</h2>
                
                <div 
                  className="border-2 border-dashed border-gray-300 rounded-lg p-8 text-center hover:border-amber-400 transition-colors cursor-pointer"
                  onClick={() => fileInputRef.current?.click()}
                >
                  <Upload className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                  <p className="text-lg font-medium text-gray-700 mb-2">
                    Drop image here or click to upload
                  </p>
                  <p className="text-gray-500">
                    Supports JPG, PNG, HEIC files with EXIF data
                  </p>
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept="image/*"
                    onChange={handleFileUpload}
                    className="hidden"
                    title="Upload image file"
                  />
                </div>
              </div>

              {/* Image Preview and Metadata */}
              {imagePreview && (
                <div className="bg-white rounded-lg shadow-lg p-6 relative">
                  <button
                    className="absolute top-4 right-4 text-gray-400 hover:text-gray-600"
                    title="Close Preview & Metadata"
                    aria-label="Close Preview & Metadata"
                    onClick={() => { setImagePreview(null); setExtractedMetadata(null); }}
                  >
                    <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  </button>
                  <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                    {/* Image Preview */}
                    <div>
                      <h3 className="text-lg font-semibold text-gray-900 mb-4">Image Preview</h3>
                      <div className="aspect-video bg-gray-100 rounded-lg overflow-hidden">
                        <Image
                          src={imagePreview}
                          alt="Uploaded preview"
                          width={800}
                          height={450}
                          className="w-full h-full object-cover"
                          priority
                        />
                      </div>
                    </div>
                    {/* Metadata Extraction */}
                    <div>
                      <h3 className="text-lg font-semibold text-gray-900 mb-4">Extracted Metadata</h3>
                      {isAnalyzing ? (
                        <div className="flex items-center justify-center py-8">
                          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-amber-600"></div>
                          <span className="ml-3 text-gray-600">Analyzing image...</span>
                        </div>
                      ) : extractedMetadata ? (
                        <div className="space-y-4">
                          {/* File Information */}
                          <div className="border-b border-gray-200 pb-4">
                            <h4 className="font-medium text-gray-900 mb-2 flex items-center">
                              <FileText className="w-4 h-4 mr-2" />
                              File Information
                            </h4>
                            <div className="space-y-1 text-sm">
                              <p><span className="font-medium">Name:</span> {extractedMetadata.fileName}</p>
                              <p><span className="font-medium">Size:</span> {extractedMetadata.fileSize}</p>
                              <p><span className="font-medium">Dimensions:</span> {extractedMetadata.dimensions}</p>
                            </div>
                          </div>
                          {/* Date/Time */}
                          {extractedMetadata.dateTime && (
                            <div className="border-b border-gray-200 pb-4">
                              <h4 className="font-medium text-gray-900 mb-2 flex items-center">
                                <Calendar className="w-4 h-4 mr-2" />
                                Date & Time
                              </h4>
                              <p className="text-sm">{extractedMetadata.dateTime}</p>
                            </div>
                          )}
                          {/* Location */}
                          {extractedMetadata.location ? (
                            <div className="border-b border-gray-200 pb-4">
                              <h4 className="font-medium text-gray-900 mb-2 flex items-center">
                                <MapPin className="w-4 h-4 mr-2 text-green-600" />
                                GPS Location
                              </h4>
                              <div className="space-y-1 text-sm">
                                <p><span className="font-medium">Latitude:</span> {extractedMetadata.location.latitude.toFixed(6)}</p>
                                <p><span className="font-medium">Longitude:</span> {extractedMetadata.location.longitude.toFixed(6)}</p>
                                {extractedMetadata.location.address && (
                                  <p><span className="font-medium">Address:</span> {extractedMetadata.location.address}</p>
                                )}
                              </div>
                            </div>
                          ) : (
                            <div className="border-b border-gray-200 pb-4">
                              <h4 className="font-medium text-gray-900 mb-2 flex items-center">
                                <MapPin className="w-4 h-4 mr-2 text-red-600" />
                                GPS Location
                              </h4>
                              <p className="text-sm text-red-600">No location data found in image</p>
                            </div>
                          )}
                          {/* Camera Information */}
                          {extractedMetadata.camera && (
                            <div className="pb-4">
                              <h4 className="font-medium text-gray-900 mb-2 flex items-center">
                                <Camera className="w-4 h-4 mr-2" />
                                Camera Information
                              </h4>
                              <div className="space-y-1 text-sm">
                                <p><span className="font-medium">Make:</span> {extractedMetadata.camera.make}</p>
                                <p><span className="font-medium">Model:</span> {extractedMetadata.camera.model}</p>
                                <p><span className="font-medium">Settings:</span> {extractedMetadata.camera.settings}</p>
                              </div>
                            </div>
                          )}
                          {/* Action Buttons */}
                          <div className="flex flex-col sm:flex-row gap-3 pt-4">
                            <button 
                              className="w-full sm:w-auto bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-lg flex items-center justify-center transition-colors" 
                              title="Verify Location"
                              onClick={handleVerifyLocation}
                            >
                              <CheckCircle className="w-4 h-4 mr-2" />
                              <span className="text-sm sm:text-base">Verify Location</span>
                            </button>
                            <button 
                              className="w-full sm:w-auto bg-amber-600 hover:bg-amber-700 text-white px-4 py-2 rounded-lg flex items-center justify-center transition-colors" 
                              title="Export Report"
                              onClick={handleExportReport}
                            >
                              <Download className="w-4 h-4 mr-2" />
                              <span className="text-sm sm:text-base">Export Report</span>
                            </button>
                          </div>
                        </div>
                      ) : (
                        <div className="text-center py-8 text-gray-500">
                          Upload an image to extract metadata
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Unverified Cases Tab */}
          {activeTab === 'cases' && (
            <div className="space-y-6">
              {/* Filters */}
              <div className="bg-white rounded-lg shadow-sm p-6">
                <div className="flex flex-col md:flex-row gap-4">
                  <div className="flex-1 relative">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                    <input
                      type="text"
                      placeholder="Search cases..."
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-amber-500"
                      aria-label="Search cases"
                    />
                  </div>
                  
                  <select
                    value={statusFilter}
                    onChange={(e) => setStatusFilter(e.target.value)}
                    className="px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-amber-500"
                    aria-label="Filter by status"
                  >
                    <option value="All">All Status</option>
                    <option value="Pending Verification">Pending Verification</option>
                    <option value="Under Review">Under Review</option>
                    <option value="Verified">Verified</option>
                    <option value="Rejected">Rejected</option>
                  </select>
                </div>
              </div>

              {/* Cases Grid */}
              <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6">
                {filteredCases.map((caseItem) => (
                  <div key={caseItem.id} className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 hover:shadow-md transition-shadow">
                    <div className="flex items-start justify-between mb-4">
                      <div className="flex-1">
                        <h3 className="font-semibold text-gray-900 mb-2 line-clamp-2">{caseItem.title}</h3>
                        <p className="text-sm text-gray-600 mb-2">ID: {caseItem.id}</p>
                      </div>
                      <div className="flex items-center space-x-1 ml-2">
                        <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getPriorityColor(caseItem.priority)}`}>
                          {caseItem.priority}
                        </span>
                      </div>
                    </div>
                    
                    <div className="space-y-2 mb-4">
                      <div className="flex items-center text-sm text-gray-600">
                        <Calendar className="w-4 h-4 mr-2" />
                        {new Date(caseItem.reportedDate).toLocaleDateString()}
                      </div>
                      <div className="flex items-center text-sm text-gray-600">
                        <User className="w-4 h-4 mr-2" />
                        {caseItem.reporter}
                      </div>
                      <div className="flex items-center text-sm text-gray-600">
                        <ImageIcon className="w-4 h-4 mr-2" />
                        {caseItem.images.length} image(s)
                      </div>
                      <div className="flex items-center text-sm">
                        <MapPin className="w-4 h-4 mr-2" />
                        <span className={caseItem.hasLocation ? 'text-green-600' : 'text-red-600'}>
                          {caseItem.hasLocation ? 'Location Available' : 'No Location Data'}
                        </span>
                      </div>
                    </div>
                    
                    <div className="flex items-center justify-between mb-4">
                      <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getStatusColor(caseItem.status)}`}>
                        {caseItem.status}
                      </span>
                    </div>
                    
                    <p className="text-sm text-gray-600 mb-4 line-clamp-2">
                      {caseItem.description}
                    </p>
                    
                    {/* Image Preview */}
                    {caseItem.images && caseItem.images.length > 0 && (
                      <div className="mb-4">
                        <p className="text-xs text-gray-500 mb-2">Evidence Images:</p>
                        <div className="flex space-x-2 overflow-x-auto">
                          {caseItem.metadata?.slice(0, 3).map((metadata, index) => (
                            <div key={index} className="flex-shrink-0">
                              <div className="w-16 h-16 bg-gray-200 rounded border flex items-center justify-center">
                                <ImageIcon className="w-6 h-6 text-gray-400" />
                              </div>
                              <p className="text-xs text-gray-500 mt-1 text-center truncate w-16">{metadata.fileName}</p>
                            </div>
                          ))}
                          {caseItem.images.length > 3 && (
                            <div className="flex-shrink-0 w-16 h-16 bg-gray-100 rounded border flex items-center justify-center">
                              <span className="text-xs text-gray-600">+{caseItem.images.length - 3}</span>
                            </div>
                          )}
                        </div>
                      </div>
                    )}
                    
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-2">
                        <button
                          onClick={() => setSelectedCase(caseItem)}
                          className="text-amber-600 hover:text-amber-900"
                          title="View Details"
                        >
                          <Eye className="w-4 h-4" />
                        </button>
                        <button
                          className="text-blue-600 hover:text-blue-900"
                          title="Analyze Images"
                        >
                          <ImageIcon className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => handleVerifyCase(caseItem.id, 'Verified')}
                          className="text-green-600 hover:text-green-900"
                          title="Verify Case"
                        >
                          <CheckCircle className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => handleVerifyCase(caseItem.id, 'Rejected')}
                          className="text-red-600 hover:text-red-900"
                          title="Reject Case"
                        >
                          <XCircle className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Case Detail Modal */}
          {selectedCase && (
            <div className="absolute inset-0 flex bg-opacity-50 items-center justify-center pt-100">
              <div className="bg-white rounded-lg shadow-xl p-6 max-w-3xl w-full mx-4 ml-68 max-h-[90vh] overflow-y-auto pointer-events-auto">
                <div className="flex items-center justify-between mb-6">
                  <h3 className="text-2xl font-semibold text-[#2a260f]">Case Details</h3>
                  <button
                    onClick={() => setSelectedCase(null)}
                    className="text-gray-400 hover:text-gray-600"
                    title="Close Details"
                    aria-label="Close Details"
                  >
                    <XCircle className="w-6 h-6" />
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
                      <label className="block text-sm font-medium text-[#6b5e36] mb-1">Reporter</label>
                      <p className="text-sm text-[#2a260f]">{selectedCase.reporter}</p>
                    </div>
                  </div>
                  <div className="space-y-4">
                    <div>
                      <label className="block text-sm font-medium text-[#6b5e36] mb-1">Type</label>
                      <p className="text-sm text-[#2a260f]">{selectedCase.type}</p>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-[#6b5e36] mb-1">Status</label>
                      <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getStatusColor(selectedCase.status)}`}>{selectedCase.status}</span>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-[#6b5e36] mb-1">Priority</label>
                      <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getPriorityColor(selectedCase.priority)}`}>{selectedCase.priority}</span>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-[#6b5e36] mb-1">Reported Date</label>
                      <p className="text-sm text-[#2a260f]">{new Date(selectedCase.reportedDate).toLocaleDateString()}</p>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-[#6b5e36] mb-1">Location Status</label>
                      <p className={`text-sm font-medium ${selectedCase.hasLocation ? 'text-green-600' : 'text-red-600'}`}>{selectedCase.hasLocation ? 'Location Available' : 'No Location Data'}</p>
                    </div>
                  </div>
                </div>
                
                {/* Images Section */}
                {selectedCase.images && selectedCase.images.length > 0 && (
                  <div className="mt-6 pt-6 border-t border-gray-200">
                    <label className="block text-sm font-medium text-[#6b5e36] mb-4">Evidence Images ({selectedCase.images.length})</label>
                    <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
                      {selectedCase.metadata?.map((metadata, index) => (
                        <div key={index} className="bg-gray-50 rounded-lg p-4">
                          <div className="aspect-w-16 aspect-h-12 mb-3">
                            {metadata.fileUrl ? (
                              <div className="w-full h-32 bg-gray-200 rounded-lg flex items-center justify-center">
                                <ImageIcon className="w-8 h-8 text-gray-400" />
                                <span className="ml-2 text-sm text-gray-600">Image: {metadata.fileName}</span>
                              </div>
                            ) : (
                              <div className="w-full h-32 bg-gray-200 rounded-lg flex items-center justify-center">
                                <ImageIcon className="w-8 h-8 text-gray-400" />
                                <span className="ml-2 text-sm text-gray-600">{metadata.fileName}</span>
                              </div>
                            )}
                          </div>
                          <div className="space-y-1 text-xs text-gray-600">
                            <p><span className="font-medium">File:</span> {metadata.fileName}</p>
                            {metadata.location && (
                              <>
                                <p><span className="font-medium">GPS:</span> {metadata.location.latitude.toFixed(6)}, {metadata.location.longitude.toFixed(6)}</p>
                              </>
                            )}
                            {metadata.camera && (
                              <p><span className="font-medium">Camera:</span> {metadata.camera.make} {metadata.camera.model}</p>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
                
                <div className="flex space-x-3 mt-6 pt-6 border-t border-gray-200">
                  <button className="bg-amber-600 hover:bg-amber-700 text-white px-4 py-2 rounded-lg transition-colors" title="Analyze Images" aria-label="Analyze Images">
                    Analyze Images
                  </button>
                  <button className="bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-lg transition-colors" title="Verify Case" aria-label="Verify Case">
                    Verify Case
                  </button>
                  <button className="bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded-lg transition-colors" title="Reject Case" aria-label="Reject Case">
                    Reject Case
                  </button>
                  <button className="bg-gray-600 hover:bg-gray-700 text-white px-4 py-2 rounded-lg transition-colors" title="Download Report" aria-label="Download Report">
                    Download Report
                  </button>
                </div>
              </div>
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
                    <CheckCircle className="h-8 w-8 text-green-400" />
                  )}
                  {notification.type === 'error' && (
                    <XCircle className="h-8 w-8 text-red-400" />
                  )}
                  {notification.type === 'info' && (
                    <AlertTriangle className="h-8 w-8 text-blue-400" />
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
};

export default ImageAnalysis;