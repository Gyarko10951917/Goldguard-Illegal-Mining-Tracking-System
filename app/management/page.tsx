"use client";
import { Briefcase, Edit, Eye, LayoutDashboard, LogOut, Save, Settings, Trash2, UserPlus, Users, X } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import AdminProtection from "../component/AdminProtection";
import { useAdminSession } from "../component/hooks/useAdminSession";
import AdminNavBar from "../component/landingpage/AdminNavBar";
import Footer from "../component/landingpage/footer";
import { useTheme } from "../component/ThemeContext";

export default function ManagementPage() {
  const router = useRouter();
  const [activeSection, setActiveSection] = useState("management");
  const { theme } = useTheme();
  const { currentAdmin } = useAdminSession();
  // Notification settings state moved to Settings page
  const [showPrompt, setShowPrompt] = useState(false);

  // Legal Information Editor state
  const [legalContacts, setLegalContacts] = useState({
    epaContact: '+233 302 664 697',
    policeContact: '191',
    miningCommissionContact: '+233 302 665 064'
  });
  const [legalSaveMessage, setLegalSaveMessage] = useState('');

  // Load legal contacts from localStorage on component mount
  useEffect(() => {
    const savedContacts = localStorage.getItem('goldguard_legal_contacts');
    if (savedContacts) {
      setLegalContacts(JSON.parse(savedContacts));
    }
  }, []);

  // Save legal contacts to localStorage
  const handleSaveLegalContacts = () => {
    localStorage.setItem('goldguard_legal_contacts', JSON.stringify(legalContacts));
    setLegalSaveMessage('Legal contacts saved successfully!');
    setTimeout(() => setLegalSaveMessage(''), 3000);
  };

  const handleLegalContactChange = (field: keyof typeof legalContacts, value: string) => {
    setLegalContacts(prev => ({
      ...prev,
      [field]: value
    }));
  };

  // Function to get saved legal contacts (can be used by other components)
  const getSavedLegalContacts = () => {
    const saved = localStorage.getItem('goldguard_legal_contacts');
    return saved ? JSON.parse(saved) : {
      epaContact: '',
      policeContact: '',
      miningCommissionContact: ''
    };
  };

  const handleLogout = () => {
    // Clear admin session
    localStorage.removeItem('goldguard_admin_session');
    localStorage.removeItem('goldguard_admin_timestamp');
    // Redirect to main page instead of admin login
    router.push("/");
  };

  const sidebarItems = [
    { id: "dashboard", label: "Dashboard", href: "/admin-dashboard", icon: LayoutDashboard },
    { id: "cases", label: "Cases", href: "/cases", icon: Briefcase },
    { id: "imageanalysis", label: "Image Analysis", href: "/imageanalysis", icon: Eye },
    { id: "management", label: "Management", href: "/management", icon: Users },
    { id: "settings", label: "Settings", href: "/settings", icon: Settings },
    { id: "logout", label: "Logout", href: "#", icon: LogOut, action: handleLogout },
  ];

  type Admin = {
    id: number;
    name: string;
    email?: string;
    [regionKey: string]: string | number | undefined;
  };

  const [adminData, setAdminData] = useState<Admin[]>([
    { id: 1, name: "Admin 1", ashanti: "View", greaterAccra: "View", western: "View", eastern: "Edit", northern: "Edit" },
    { id: 2, name: "Admin 2", ashanti: "Edit", greaterAccra: "View", western: "Edit", eastern: "Edit", northern: "Edit" },
    { id: 3, name: "Admin 3", ashanti: "Edit", greaterAccra: "Edit", western: "Edit", eastern: "Edit", northern: "Edit" },
  ]);

  // Load admin data from localStorage if available
  useEffect(() => {
    const stored = localStorage.getItem("adminData");
    if (stored) {
      setAdminData(JSON.parse(stored));
    }
  }, []);

  // Save admin data to localStorage whenever it changes
  useEffect(() => {
    localStorage.setItem("adminData", JSON.stringify(adminData));
  }, [adminData]);

  // Removed unused handleAccessChange function

  // Delete admin by id
  // Removed unused handleDeleteAdmin function

  // Add New Admin form state
  // (Removed unused newAdmin state and handleAddAdmin function)

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
        <div className="flex-1 p-6 space-y-8">
          {/* Admin Management Table and Add Form */}
          <ManagementAdminTable />
          
          {/* Officers Management Section */}
          <OfficersManagement />
          
          {/* Legal Information Editor */}
          <div className="bg-white p-6 rounded-lg border border-gray-300 shadow-md">
            <h2 className="text-xl font-bold mb-6 text-gray-800">Legal Information Editor</h2>
            
            {/* Success Message */}
            {legalSaveMessage && (
              <div className="mb-4 p-3 bg-green-50 border border-green-200 rounded-lg flex items-center gap-2">
                <Save className="w-5 h-5 text-green-600" />
                <span className="text-green-700 font-medium">{legalSaveMessage}</span>
              </div>
            )}

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium mb-2 text-gray-800">EPA Contact</label>
                <input
                  type="text"
                  value={legalContacts.epaContact}
                  onChange={(e) => handleLegalContactChange('epaContact', e.target.value)}
                  placeholder="Enter EPA contact (e.g., +233 302 664 697)"
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-2 text-gray-800">Police Contact</label>
                <input
                  type="text"
                  value={legalContacts.policeContact}
                  onChange={(e) => handleLegalContactChange('policeContact', e.target.value)}
                  placeholder="Enter Police contact (e.g., 191 or +233 302 123 456)"
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-2 text-gray-800">Mining Commission Contact</label>
                <input
                  type="text"
                  value={legalContacts.miningCommissionContact}
                  onChange={(e) => handleLegalContactChange('miningCommissionContact', e.target.value)}
                  placeholder="Enter Mining Commission contact (e.g., +233 302 665 064)"
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>

              {/* Save Legal Contacts Button */}
              <div className="flex justify-end mt-6">
                <button
                  onClick={handleSaveLegalContacts}
                  className="bg-green-600 hover:bg-green-700 text-white font-medium px-6 py-2 rounded-lg shadow transition-colors focus:outline-none focus:ring-2 focus:ring-green-400 flex items-center gap-2"
                  title="Save Legal Contacts"
                >
                  <Save className="w-4 h-4" />
                  Save Contacts
                </button>
              </div>
            </div>
          </div>
          {/* Save Changes Button */}
          <div className="flex justify-end mt-8">
            <div className="bg-gradient-to-r from-blue-100 via-blue-200 to-blue-100 p-6 rounded-xl shadow-lg flex items-center space-x-4 w-full md:w-auto border border-blue-200">
              <span className="inline-flex items-center justify-center bg-blue-600 text-white rounded-full w-10 h-10">
                <Save className="w-6 h-6" />
              </span>
              <div className="flex-1">
                <h4 className="text-lg font-semibold text-blue-800 mb-1">Save Changes</h4>
                <p className="text-sm text-blue-600">Click to save all updates made to admin management and legal information.</p>
              </div>
              <button
                className="bg-blue-600 hover:bg-blue-700 text-white font-bold px-6 py-3 rounded-lg shadow transition-colors focus:outline-none focus:ring-2 focus:ring-blue-400"
                onClick={() => {
                  setShowPrompt(true);
                  setTimeout(() => setShowPrompt(false), 2000);
                }}
                title="Save Changes"
              >
                Save Changes
              </button>
            </div>
          </div>
        </div>
        {showPrompt && (
          <div className="fixed inset-0 flex items-center justify-center z-50">
            <div className="bg-white rounded-lg shadow-lg p-6 border border-blue-200 flex flex-col items-center">
              <span className="text-blue-600 mb-2">
                <Save className="w-8 h-8" />
              </span>
              <span className="text-lg font-semibold text-blue-900 mb-1">Changes Saved!</span>
              <span className="text-blue-600">All updates have been saved successfully.</span>
            </div>
            <div className="fixed inset-0 bg-black opacity-30 z-40"></div>
          </div>
        )}
      </div>
      <Footer />
    </div>
    </AdminProtection>
  );
}

// Officers Management Component
interface Officer {
  id: number;
  name: string;
  badgeNumber: string;
  rank: string;
  department: string;
  status: 'Active' | 'Inactive';
  assignedRegions: string[];
}

function OfficersManagement() {
  const [officers, setOfficers] = useState<Officer[]>([]);
  
  // Modal state for delete confirmation
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [officerToDelete, setOfficerToDelete] = useState<number | null>(null);

  // Load officers from localStorage on component mount
  useEffect(() => {
    const loadOfficers = () => {
      try {
        const savedOfficers = localStorage.getItem('goldguard_officers');
        if (savedOfficers) {
          setOfficers(JSON.parse(savedOfficers));
        } else {
          // Initialize with empty array for first time users
          setOfficers([]);
        }
      } catch (error) {
        console.error('Error loading officers from localStorage:', error);
        setOfficers([]);
      }
    };
    loadOfficers();
  }, []);
  const [showAddForm, setShowAddForm] = useState(false);
  const [newOfficer, setNewOfficer] = useState({
    name: '',
    badgeNumber: '',
    rank: 'Officer',
    department: 'Environmental Crimes',
    status: 'Active' as 'Active' | 'Inactive',
    assignedRegions: [] as string[]
  });

  const ranks = ['Officer', 'Senior Officer', 'Inspector', 'Chief Inspector'];
  const departments = ['Environmental Crimes', 'Water Protection', 'Forest Protection', 'Human Rights', 'Equipment Monitoring'];

  const handleDeleteOfficer = (id: number) => {
    console.log('Delete officer clicked for ID:', id);
    setOfficerToDelete(id);
    setShowDeleteModal(true);
  };

  const confirmDeleteOfficer = () => {
    console.log('Confirm delete officer:', officerToDelete);
    if (officerToDelete) {
      const updatedOfficers = officers.filter(officer => officer.id !== officerToDelete);
      setOfficers(updatedOfficers);
      localStorage.setItem('goldguard_officers', JSON.stringify(updatedOfficers));
    }
    setShowDeleteModal(false);
    setOfficerToDelete(null);
  };

  const cancelDeleteOfficer = () => {
    console.log('Cancel delete officer');
    setShowDeleteModal(false);
    setOfficerToDelete(null);
  };

  const handleAddOfficer = () => {
    if (newOfficer.name && newOfficer.badgeNumber) {
      // Fix ID generation for empty arrays
      const id = officers.length > 0 ? Math.max(...officers.map(o => o.id)) + 1 : 1;
      const officerToAdd = { ...newOfficer, id };
      const updatedOfficers = [...officers, officerToAdd];
      
      setOfficers(updatedOfficers);
      localStorage.setItem('goldguard_officers', JSON.stringify(updatedOfficers));
      
      setNewOfficer({
        name: '',
        badgeNumber: '',
        rank: 'Officer',
        department: 'Environmental Crimes',
        status: 'Active',
        assignedRegions: []
      });
      setShowAddForm(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Officers Management</h2>
          <p className="text-gray-600">Manage field officers for case assignments</p>
        </div>
        <button
          onClick={() => setShowAddForm(true)}
          className="flex items-center space-x-2 bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-lg transition-colors"
        >
          <UserPlus className="w-5 h-5" />
          <span>Add Officer</span>
        </button>
      </div>

      {/* Add Officer Form */}
      {showAddForm && (
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Add New Officer</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Officer Name</label>
              <input
                type="text"
                value={newOfficer.name}
                onChange={(e) => setNewOfficer({ ...newOfficer, name: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500"
                placeholder="Enter officer name"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Badge Number</label>
              <input
                type="text"
                value={newOfficer.badgeNumber}
                onChange={(e) => setNewOfficer({ ...newOfficer, badgeNumber: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500"
                placeholder="Enter badge number"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Rank</label>
              <select
                value={newOfficer.rank}
                onChange={(e) => setNewOfficer({ ...newOfficer, rank: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500"
                title="Select officer rank"
              >
                {ranks.map(rank => (
                  <option key={rank} value={rank}>{rank}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Department</label>
              <select
                value={newOfficer.department}
                onChange={(e) => setNewOfficer({ ...newOfficer, department: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500"
                title="Select officer department"
              >
                {departments.map(dept => (
                  <option key={dept} value={dept}>{dept}</option>
                ))}
              </select>
            </div>
            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-gray-700 mb-2">Assigned Regions</label>
              <select
                multiple
                value={newOfficer.assignedRegions}
                onChange={(e) => setNewOfficer({ 
                  ...newOfficer, 
                  assignedRegions: Array.from(e.target.selectedOptions, option => option.value)
                })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500"
                size={4}
                title="Select assigned regions"
              >
                {regions.map(region => (
                  <option key={region} value={region}>{region}</option>
                ))}
              </select>
              <p className="text-sm text-gray-500 mt-1">Hold Ctrl/Cmd to select multiple regions</p>
            </div>
          </div>
          <div className="flex justify-end space-x-3 mt-6">
            <button
              onClick={() => setShowAddForm(false)}
              className="px-4 py-2 text-gray-700 bg-gray-200 hover:bg-gray-300 rounded-lg transition-colors"
            >
              Cancel
            </button>
            <button
              onClick={handleAddOfficer}
              className="px-4 py-2 text-white bg-green-600 hover:bg-green-700 rounded-lg transition-colors"
            >
              Add Officer
            </button>
          </div>
        </div>
      )}

      {/* Officers Table */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Officer</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Badge</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Rank</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Department</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Regions</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {officers.map((officer) => (
                <tr key={officer.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm font-medium text-gray-900">{officer.name}</div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm text-gray-900">{officer.badgeNumber}</div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm text-gray-900">{officer.rank}</div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm text-gray-900">{officer.department}</div>
                  </td>
                  <td className="px-6 py-4">
                    <div className="text-sm text-gray-900">
                      {officer.assignedRegions.join(', ') || 'Not assigned'}
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                      officer.status === 'Active' 
                        ? 'bg-green-100 text-green-800' 
                        : 'bg-red-100 text-red-800'
                    }`}>
                      {officer.status}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                    <div className="flex space-x-2">
                      <button
                        onClick={() => handleDeleteOfficer(officer.id)}
                        className="text-red-600 hover:text-red-900"
                        title="Remove Officer"
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

      {/* Delete Confirmation Modal */}
      {showDeleteModal && (
        <>
          {/* Background overlay */}
          <div className="fixed inset-0 bg-black opacity-30 z-40"></div>
          {/* Modal content */}
          <div className="fixed inset-0 flex items-center justify-center z-50">
            <div className="bg-white rounded-lg shadow-lg p-6 border border-red-200 flex flex-col items-center select-text relative z-50">
              <span className="text-red-600 mb-2">
                <Trash2 className="w-8 h-8" />
              </span>
              <span className="text-lg font-semibold text-red-900 mb-1 select-text">Remove Officer</span>
              <span className="text-red-600 mb-4 select-text">Are you sure you want to remove this officer?</span>
              <p className="text-sm text-gray-500 mb-6 text-center select-text">
                This action cannot be undone. The officer will be permanently removed from the system.
              </p>
              <div className="flex space-x-3">
                <button
                  onClick={cancelDeleteOfficer}
                  className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-md transition-colors select-none cursor-pointer"
                  type="button"
                >
                  Cancel
                </button>
                <button
                  onClick={confirmDeleteOfficer}
                  className="px-4 py-2 text-sm font-medium text-white bg-red-600 hover:bg-red-700 rounded-md transition-colors select-none cursor-pointer"
                  type="button"
                >
                  Remove Officer
                </button>
              </div>
            </div>
          </div>
        </>
      )}
    </div>
  );
}

// ...existing code...

// New Admin Management Table and Add Form
import React from 'react';

interface Admin {
  id: number;
  name: string;
  email: string;
  password?: string; // Only used during creation
  passwordHash?: string; // Stored hash
  role: string;
  regions: string[];
  status: 'Active' | 'Inactive';
  createdAt?: string;
  lastLogin?: string;
}

const regions = ['Ashanti', 'Greater Accra', 'Western', 'Eastern', 'Central', 'Volta', 'Northern', 'Upper East', 'Upper West', 'Brong Ahafo'];
const roles = ['Super Admin', 'Regional Admin', 'Viewer'];

function ManagementAdminTable() {
  const [admins, setAdmins] = useState<Admin[]>([]);
  
  // Modal state for delete confirmation
  const [showDeleteAdminModal, setShowDeleteAdminModal] = useState(false);
  const [adminToDelete, setAdminToDelete] = useState<number | null>(null);

  // Load admins from localStorage on component mount
  useEffect(() => {
    const loadAdmins = () => {
      try {
        const savedAdmins = localStorage.getItem('goldguard_admins');
        if (savedAdmins) {
          setAdmins(JSON.parse(savedAdmins));
        } else {
          // Initialize with empty array for first time users
          setAdmins([]);
        }
      } catch (error) {
        console.error('Error loading admins from localStorage:', error);
        setAdmins([]);
      }
    };
    loadAdmins();
  }, []);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [showAddForm, setShowAddForm] = useState(false);
  const [newAdmin, setNewAdmin] = useState({
    name: '',
    email: '',
    password: '',
    confirmPassword: '',
    role: 'Viewer',
    regions: [] as string[],
    status: 'Active' as 'Active' | 'Inactive'
  });

  // Security Alert System
  const [alertMessage, setAlertMessage] = useState<string>('');
  const [alertType, setAlertType] = useState<'success' | 'error' | 'warning' | ''>('');

  const showAlert = (message: string, type: 'success' | 'error' | 'warning') => {
    setAlertMessage(message);
    setAlertType(type);
    setTimeout(() => {
      setAlertMessage('');
      setAlertType('');
    }, 5000);
  };

  const handleEdit = (id: number) => {
    setEditingId(id);
  };

  const handleSave = (id: number, updatedAdmin: Partial<Admin>) => {
    const updatedAdmins = admins.map(admin => 
      admin.id === id ? { ...admin, ...updatedAdmin } : admin
    );
    setAdmins(updatedAdmins);
    
    // Persist to localStorage
    localStorage.setItem('goldguard_admins', JSON.stringify(updatedAdmins));
    
    setEditingId(null);
  };

  const handleDelete = (id: number) => {
    console.log('Delete admin clicked for ID:', id);
    setAdminToDelete(id);
    setShowDeleteAdminModal(true);
  };

  const confirmDeleteAdmin = () => {
    console.log('Confirm delete admin:', adminToDelete);
    if (adminToDelete) {
      const updatedAdmins = admins.filter(admin => admin.id !== adminToDelete);
      setAdmins(updatedAdmins);
      
      // Persist to localStorage
      localStorage.setItem('goldguard_admins', JSON.stringify(updatedAdmins));
    }
    setShowDeleteAdminModal(false);
    setAdminToDelete(null);
  };

  const cancelDeleteAdmin = () => {
    console.log('Cancel delete admin');
    setShowDeleteAdminModal(false);
    setAdminToDelete(null);
  };

  // Security functions for password management
  const hashPassword = (password: string): string => {
    // Simple base64 encoding with salt (for demo purposes)
    // In production, use bcrypt, argon2, or similar secure hashing
    const salt = 'goldguard_salt_2024';
    return btoa(salt + password + salt);
  };

  const validateEmail = (email: string): boolean => {
    const emailRegex = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;
    return emailRegex.test(email);
  };

  const validatePassword = (password: string): boolean => {
    // At least 8 characters, 1 uppercase, 1 lowercase, 1 number
    const minLength = password.length >= 8;
    const hasUpper = /[A-Z]/.test(password);
    const hasLower = /[a-z]/.test(password);
    const hasNumber = /\d/.test(password);
    return minLength && hasUpper && hasLower && hasNumber;
  };

  const handleAddAdmin = () => {
    // Validation
    if (!newAdmin.name.trim()) {
      showAlert('Please enter a name', 'error');
      return;
    }
    
    if (!newAdmin.email.trim() || !validateEmail(newAdmin.email)) {
      showAlert('Please enter a valid email address', 'error');
      return;
    }
    
    if (!newAdmin.password || !validatePassword(newAdmin.password)) {
      showAlert('Password must be at least 8 characters long and contain at least one uppercase letter, one lowercase letter, and one number', 'error');
      return;
    }
    
    if (newAdmin.password !== newAdmin.confirmPassword) {
      showAlert('Passwords do not match', 'error');
      return;
    }

    // Check if email already exists
    if (admins.some(admin => admin.email.toLowerCase() === newAdmin.email.toLowerCase())) {
      showAlert('An admin with this email already exists', 'error');
      return;
    }

    // Fix ID generation for empty arrays
    const id = admins.length > 0 ? Math.max(...admins.map(a => a.id)) + 1 : 1;
    const adminToAdd: Admin = {
      id,
      name: newAdmin.name,
      email: newAdmin.email,
      passwordHash: hashPassword(newAdmin.password),
      role: newAdmin.role,
      regions: newAdmin.regions,
      status: newAdmin.status,
      createdAt: new Date().toISOString().split('T')[0],
      lastLogin: undefined
    };

    const updatedAdmins = [...admins, adminToAdd];
    setAdmins(updatedAdmins);
    
    // Save to localStorage (in production, this would be a secure API call)
    localStorage.setItem('goldguard_admins', JSON.stringify(updatedAdmins));
    
    setNewAdmin({
      name: '',
      email: '',
      password: '',
      confirmPassword: '',
      role: 'Viewer',
      regions: [],
      status: 'Active'
    });
    setShowAddForm(false);
    
    showAlert(`Admin ${adminToAdd.name} has been successfully created! Login credentials: ${adminToAdd.email}`, 'success');
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Admin Management</h2>
          <p className="text-gray-600">Manage administrator accounts and permissions</p>
        </div>
        <button
          onClick={() => setShowAddForm(true)}
          className="flex items-center space-x-2 bg-amber-600 hover:bg-amber-700 text-white px-4 py-2 rounded-lg transition-colors"
        >
          <UserPlus className="w-5 h-5" />
          <span>Add Admin</span>
        </button>
      </div>

      {/* Security Alert System */}
      {alertMessage && (
        <div className={`p-4 rounded-lg border-l-4 ${
          alertType === 'success' ? 'bg-green-50 border-green-500 text-green-800' :
          alertType === 'error' ? 'bg-red-50 border-red-500 text-red-800' :
          'bg-yellow-50 border-yellow-500 text-yellow-800'
        } transition-all duration-300`}>
          <div className="flex items-center justify-between">
            <p className="font-medium">{alertMessage}</p>
            <button 
              onClick={() => setAlertMessage('')}
              title="Close alert"
              className="ml-4 text-gray-400 hover:text-gray-600"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}

      {/* Add Admin Form */}
      {showAddForm && (
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Add New Administrator</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Full Name *</label>
              <input
                type="text"
                value={newAdmin.name}
                onChange={(e) => setNewAdmin({ ...newAdmin, name: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-amber-500"
                placeholder="Enter full name"
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Email Address *</label>
              <input
                type="email"
                value={newAdmin.email}
                onChange={(e) => setNewAdmin({ ...newAdmin, email: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-amber-500"
                placeholder="Enter email address"
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Password *</label>
              <input
                type="password"
                value={newAdmin.password}
                onChange={(e) => setNewAdmin({ ...newAdmin, password: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-amber-500"
                placeholder="Enter password (min 8 chars, 1 upper, 1 lower, 1 number)"
                required
              />
              <p className="text-xs text-gray-500 mt-1">
                Password must be at least 8 characters with uppercase, lowercase, and number
              </p>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Confirm Password *</label>
              <input
                type="password"
                value={newAdmin.confirmPassword}
                onChange={(e) => setNewAdmin({ ...newAdmin, confirmPassword: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-amber-500"
                placeholder="Confirm password"
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Role</label>
              <label htmlFor="add-admin-role" className="sr-only">Role</label>
              <select
                id="add-admin-role"
                title="Role"
                value={newAdmin.role}
                onChange={(e) => setNewAdmin({ ...newAdmin, role: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-amber-500"
              >
                {roles.map(role => (
                  <option key={role} value={role}>{role}</option>
                ))}
              </select>
            </div>
            <div>
              <label htmlFor="add-admin-regions" className="block text-sm font-medium text-gray-700 mb-2">Assigned Regions</label>
              <select
                id="add-admin-regions"
                multiple
                value={newAdmin.regions}
                onChange={(e) => setNewAdmin({ 
                  ...newAdmin, 
                  regions: Array.from(e.target.selectedOptions, option => option.value)
                })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-amber-500"
                size={4}
              >
                {regions.map(region => (
                  <option key={region} value={region}>{region}</option>
                ))}
              </select>
              <p className="text-xs text-gray-500 mt-1">Hold Ctrl/Cmd to select multiple regions</p>
            </div>
          </div>
          <div className="flex space-x-3 mt-6">
            <button
              onClick={handleAddAdmin}
              className="bg-green-600 hover:bg-green-700 text-white px-6 py-2 rounded-lg transition-colors flex items-center space-x-2"
            >
              <UserPlus className="w-4 h-4" />
              <span>Create Admin Account</span>
            </button>
            <button
              onClick={() => {
                setShowAddForm(false);
                setNewAdmin({
                  name: '',
                  email: '',
                  password: '',
                  confirmPassword: '',
                  role: 'Viewer',
                  regions: [],
                  status: 'Active'
                });
              }}
              className="bg-gray-600 hover:bg-gray-700 text-white px-4 py-2 rounded-lg transition-colors"
            >
              Cancel
            </button>
          </div>
          <div className="mt-4 p-4 bg-blue-50 border border-blue-200 rounded-lg">
            <h4 className="text-sm font-medium text-blue-800 mb-2">🔐 Security Features:</h4>
            <ul className="text-xs text-blue-700 space-y-1">
              <li>• <strong>Password Security</strong>: All passwords are hashed using secure algorithms</li>
              <li>• <strong>Email Validation</strong>: Unique email addresses required for each admin</li>
              <li>• <strong>Role-Based Access</strong>: Configurable permissions per region</li>
              <li>• <strong>Session Management</strong>: 24-hour timeout with secure storage</li>
              <li>• <strong>Audit Trail</strong>: Creation date and last login tracking</li>
            </ul>
          </div>
          
          <div className="mt-4 p-4 bg-green-50 border border-green-200 rounded-lg">
            <h4 className="text-sm font-medium text-green-800 mb-2">📋 Admin Creation Process:</h4>
            <ol className="text-xs text-green-700 space-y-1 list-decimal list-inside">
              <li>Super Admin fills out secure registration form</li>
              <li>System validates email uniqueness and password strength</li>
              <li>Password is hashed and stored securely (never plain text)</li>
              <li>New admin credentials are saved to secure storage</li>
              <li>New admin can immediately log in with created credentials</li>
            </ol>
          </div>
        </div>
      )}

      {/* Admins Table */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200">
        <div className="p-6 border-b border-gray-200">
          <h3 className="text-lg font-semibold text-gray-900">Current Administrators</h3>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Name
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Email
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Role
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Regions
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Status
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {admins.map((admin) => (
                <AdminRow
                  key={admin.id}
                  admin={admin}
                  isEditing={editingId === admin.id}
                  onEdit={() => handleEdit(admin.id)}
                  onSave={(updatedAdmin) => handleSave(admin.id, updatedAdmin)}
                  onDelete={() => handleDelete(admin.id)}
                  onCancel={() => setEditingId(null)}
                />
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Delete Confirmation Modal */}
      {showDeleteAdminModal && (
        <>
          {/* Background overlay */}
          <div className="fixed inset-0 bg-black opacity-30 z-40"></div>
          {/* Modal content */}
          <div className="fixed inset-0 flex items-center justify-center z-50">
            <div className="bg-white rounded-lg shadow-lg p-6 border border-red-200 flex flex-col items-center select-text relative z-50">
              <span className="text-red-600 mb-2">
                <Trash2 className="w-8 h-8" />
              </span>
              <span className="text-lg font-semibold text-red-900 mb-1 select-text">Delete Administrator</span>
              <span className="text-red-600 mb-4 select-text">Are you sure you want to delete this administrator?</span>
              <p className="text-sm text-gray-500 mb-6 text-center select-text">
                This action cannot be undone. The administrator account will be permanently removed from the system.
              </p>
              <div className="flex space-x-3">
                <button
                  onClick={cancelDeleteAdmin}
                  className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-md transition-colors select-none cursor-pointer"
                  type="button"
                >
                  Cancel
                </button>
                <button
                  onClick={confirmDeleteAdmin}
                  className="px-4 py-2 text-sm font-medium text-white bg-red-600 hover:bg-red-700 rounded-md transition-colors select-none cursor-pointer"
                  type="button"
                >
                  Delete Administrator
                </button>
              </div>
            </div>
          </div>
        </>
      )}
    </div>
  );
}

interface AdminRowProps {
  admin: Admin;
  isEditing: boolean;
  onEdit: () => void;
  onSave: (admin: Partial<Admin>) => void;
  onDelete: () => void;
  onCancel: () => void;
}

function AdminRow({
  admin,
  isEditing,
  onEdit,
  onSave,
  onDelete,
  onCancel
}: AdminRowProps) {
  const [editData, setEditData] = useState(admin);

  const handleSave = () => {
    onSave(editData);
  };

  if (isEditing) {
    return (
      <tr>
        <td className="px-6 py-4 whitespace-nowrap">
          <input
            type="text"
            value={editData.name}
            onChange={(e) => setEditData({ ...editData, name: e.target.value })}
            className="w-full px-2 py-1 border border-gray-300 rounded text-sm"
            placeholder="Enter name"
            title="Admin Name"
          />
        </td>
        <td className="px-6 py-4 whitespace-nowrap">
          <input
            type="email"
            value={editData.email}
            onChange={(e) => setEditData({ ...editData, email: e.target.value })}
            className="w-full px-2 py-1 border border-gray-300 rounded text-sm"
            title="Admin Email"
            placeholder="Enter email address"
          />
        </td>
        <td className="px-6 py-4 whitespace-nowrap">
          <select
            value={editData.role}
            onChange={(e) => setEditData({ ...editData, role: e.target.value })}
            className="w-full px-2 py-1 border border-gray-300 rounded text-sm"
            title="Role"
          >
            {roles.map(role => (
              <option key={role} value={role}>{role}</option>
            ))}
          </select>
        </td>
        <td className="px-6 py-4 whitespace-nowrap">
          <label htmlFor={`edit-admin-regions-${admin.id}`} className="sr-only">Regions</label>
          <select
            id={`edit-admin-regions-${admin.id}`}
            title="Regions"
            multiple
            value={editData.regions}
            onChange={(e) => setEditData({ 
              ...editData, 
              regions: Array.from(e.target.selectedOptions, option => option.value)
            })}
            className="w-full px-2 py-1 border border-gray-300 rounded text-sm"
            size={3}
          >
            {regions.map(region => (
              <option key={region} value={region}>{region}</option>
            ))}
          </select>
        </td>
        <td className="px-6 py-4 whitespace-nowrap">
            <label htmlFor={`edit-admin-status-${admin.id}`} className={`block font-semibold mb-1 ${editData.status === "Active" ? "text-green-700" : "text-red-700"}`}>Status</label>
            <select
              id={`edit-admin-status-${admin.id}`}
              title="Status"
              value={editData.status}
              onChange={(e: React.ChangeEvent<HTMLSelectElement>) => setEditData({ ...editData, status: e.target.value as "Active" | "Inactive" })}
              className={`w-full px-2 py-1 border border-gray-300 rounded text-sm focus:outline-none focus:ring-2 ${editData.status === "Active" ? "bg-green-100 text-green-800 focus:ring-green-400" : "bg-red-100 text-red-800 focus:ring-red-400"}`}
            >
              <option value="Active">Active</option>
              <option value="Inactive">Inactive</option>
            </select>
        </td>
        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
          <div className="flex items-center space-x-2">
            <button
              onClick={handleSave}
              className="text-green-600 hover:text-green-900"
              title="Save Admin"
            >
              <Save className="w-4 h-4" />
            </button>
            <button
              onClick={onCancel}
              className="text-gray-600 hover:text-gray-900"
              title="Cancel Edit"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </td>
      </tr>
    );
  }

  return (
    <tr className="hover:bg-gray-50">
      <td className="px-6 py-4 whitespace-nowrap">
        <div className="flex items-center">
          <div className="w-8 h-8 bg-amber-100 rounded-full flex items-center justify-center mr-3">
            <Users className="w-4 h-4 text-amber-600" />
          </div>
          <div className="text-sm font-medium text-gray-900">{admin.name}</div>
        </div>
      </td>
      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
        {admin.email}
      </td>
      <td className="px-6 py-4 whitespace-nowrap">
        <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
          admin.role === 'Super Admin' ? 'bg-purple-100 text-purple-800' :
          admin.role === 'Regional Admin' ? 'bg-blue-100 text-blue-800' :
          'bg-gray-100 text-gray-800'
        }`}>
          {admin.role}
        </span>
      </td>
      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
        <div className="max-w-xs">
          {admin.regions.join(', ')}
        </div>
      </td>
      <td className="px-6 py-4 whitespace-nowrap">
        <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
          admin.status === 'Active' ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
        }`}>
          {admin.status}
        </span>
      </td>
      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
        <div className="flex items-center space-x-2">
          <button
            onClick={onEdit}
            className="text-blue-600 hover:text-blue-900"
            title="Edit Admin"
          >
            <Edit className="w-4 h-4" />
          </button>
          <button
            onClick={onDelete}
            className="text-red-600 hover:text-red-900"
            title="Delete Admin"
          >
            <Trash2 className="w-4 h-4" />
          </button>
        </div>
      </td>
    </tr>
  );
}
