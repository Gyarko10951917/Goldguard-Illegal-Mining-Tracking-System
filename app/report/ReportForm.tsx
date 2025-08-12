"use client";
import dynamic from 'next/dynamic';
import Image from 'next/image';
import React, { useEffect, useState } from "react";
import Footer from '../component/landingpage/footer';
import NavBar from '../component/landingpage/NavBar';

// Dynamically import the map component to avoid SSR issues
const ReportMapLeaflet = dynamic(() => import('./ReportMapLeaflet'), { ssr: false });

const regions = [
  "Ashanti",
  "Greater Accra",
  "Western",
  "Eastern",
  "Brong Ahafo",
  "Central",
  "Volta",
  "Northern",
  "Upper East",
  "Upper West",
  "Oti",
  "Bono",
  "Bono East",
  "Ahafo",
  "Savannah",
  "North East",
];

const reportTypes = [
  "Water Pollution",
  "Deforestation",
  "Mercury Use",
  "Child Labor",
  "Other",
];

const ReportForm: React.FC = () => {
  const [selectedRegion, setSelectedRegion] = useState("");
  const [selectedReportTypes, setSelectedReportTypes] = useState<string[]>([]);
  const [details, setDetails] = useState("");
  const [latitude, setLatitude] = useState("");
  const [longitude, setLongitude] = useState("");
  const [autoTimestamp, setAutoTimestamp] = useState(false);
  const [isMultiple, setIsMultiple] = useState(true);
  const [selectedTab, setSelectedTab] = useState<"Images" | "Video" | "Audio" | "Documents">("Images");
  const [imagePreviews, setImagePreviews] = useState<string[]>([]);
  const [reporterName, setReporterName] = useState("");
  const [reporterContact, setReporterContact] = useState("");
  const [incidentDate, setIncidentDate] = useState("");
  const [incidentTime, setIncidentTime] = useState("");
  const [severity, setSeverity] = useState("");
  const [witnessCount, setWitnessCount] = useState("");
  const [mapPosition, setMapPosition] = useState<[number, number]>([7.9465, -1.0232]); // Center of Ghana
  const [showSuccessMessage, setShowSuccessMessage] = useState(false);
  const [caseId, setCaseId] = useState<string>("");
  const [currentDateTime, setCurrentDateTime] = useState<string>("");

  useEffect(() => {
    // Only run on client
    if (typeof window !== "undefined") {
      setCaseId(generateCaseId());
      setCurrentDateTime(getCurrentDateTime());
    }
  }, []);

  useEffect(() => {
    // Only run on client
    if (typeof window !== "undefined") {
      const handleResize = () => {
        setIsMultiple(window.innerWidth >= 768);
      };
      handleResize();
      window.addEventListener("resize", handleResize);
      return () => window.removeEventListener("resize", handleResize);
    }
    // SSR: do nothing
    return undefined;
  }, []);

  const toggleReportType = (type: string) => {
    setSelectedReportTypes((prev) =>
      prev.includes(type) ? prev.filter((t) => t !== type) : [...prev, type]
    );
  };

  // Update latitude and longitude when map position changes
  useEffect(() => {
    setLatitude(mapPosition[0].toFixed(6));
    setLongitude(mapPosition[1].toFixed(6));
  }, [mapPosition]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Validate required fields
    if (!selectedRegion || selectedReportTypes.length === 0 || !details || !latitude || !longitude) {
      alert("Please fill in all required fields including location on the map.");
      return;
    }

    // Determine if contact is email or phone
    const isEmailContact = reporterContact.includes('@');
    
    // Prepare report data for backend submission
    const reportData = {
      fullName: reporterName || undefined,
      phoneNumber: !isEmailContact ? reporterContact : undefined,
      email: isEmailContact ? reporterContact : undefined,
      isAnonymous: !reporterName && !reporterContact, // Auto-detect anonymous reports
      region: selectedRegion,
      location: {
        latitude: parseFloat(latitude),
        longitude: parseFloat(longitude),
        address: `${selectedRegion}, Ghana` // Basic address info
      },
      type: selectedReportTypes[0], // Use first selected type
      description: details,
      affectedArea: `${selectedRegion} region - ${details.substring(0, 100)}...`,
      evidence: imagePreviews.map((url, index) => ({
        type: 'Photo',
        description: `Evidence photo ${index + 1}`,
        fileUrl: url,
        fileName: `evidence_${index + 1}.jpg`
      }))
    };

    try {
      // Try to submit to backend API first
      const response = await fetch('http://localhost:5000/api/reports/submit', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(reportData)
      });

      if (response.ok) {
        const result = await response.json();
        console.log('Report submitted successfully to backend:', result);
        setShowSuccessMessage(true);
        
        // Reset form after 5 seconds
        setTimeout(() => {
          setShowSuccessMessage(false);
          // Reset form fields
          setSelectedRegion("");
          setSelectedReportTypes([]);
          setDetails("");
          setReporterName("");
          setReporterContact("");
          setIncidentDate("");
          setIncidentTime("");
          setSeverity("");
          setWitnessCount("");
          setImagePreviews([]);
          setMapPosition([7.9465, -1.0232]);
          setLatitude("");
          setLongitude("");
        }, 5000);
        return;
      } else {
        const errorData = await response.json();
        console.error('Backend error:', errorData);
        throw new Error(errorData.message || 'Backend submission failed');
      }
    } catch (error) {
      console.warn('Backend not available, falling back to localStorage:', error);
      
      // Fallback: Store in localStorage for now
      try {
        const savedReports = JSON.parse(localStorage.getItem('goldguard_reports') || '[]');
        const newReport = {
          id: generateCaseId(),
          ...reportData,
          submittedAt: new Date().toISOString(),
          status: 'pending_backend_sync'
        };
        savedReports.push(newReport);
        localStorage.setItem('goldguard_reports', JSON.stringify(savedReports));
        
        console.log('Report saved to localStorage:', newReport);
        setShowSuccessMessage(true);
        alert('Report submitted successfully! (Note: Backend server is currently unavailable, your report is saved locally and will be synced when the server is back online)');
        
        // Reset form after 3 seconds
        setTimeout(() => {
          setShowSuccessMessage(false);
          // Reset form fields
          setSelectedRegion("");
          setSelectedReportTypes([]);
          setDetails("");
          setReporterName("");
          setReporterContact("");
          setIncidentDate("");
          setIncidentTime("");
          setSeverity("");
          setWitnessCount("");
          setImagePreviews([]);
          setMapPosition([7.9465, -1.0232]);
          setLatitude("");
          setLongitude("");
        }, 3000);
      } catch (storageError) {
        console.error('Failed to save to localStorage:', storageError);
        alert('Failed to submit report. Please try again or contact support if the issue persists.');
      }
    }
  };

  const generateCaseId = () => {
    // Get the next sequential case number (in a real app, this would come from a database)
    // For now, we'll simulate the next case number based on current statistics
    // Total cases currently: 5 (matching the cases in cases/page.tsx: CASE-2024-374 to CASE-2024-378)
    // This should be synchronized with the database in production
    // Format: CASE-YYYY-NNN (where NNN is zero-padded sequential number)
    const currentCaseCount = 5;
    const nextCaseNumber = currentCaseCount + 1;
    const year = new Date().getFullYear();
    return `CASE-${year}-${nextCaseNumber.toString().padStart(3, '0')}`;
  };

  const getCurrentDateTime = () => {
    return new Date().toLocaleString('en-GB', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  return (
    <div className="min-h-screen bg-white">
      <NavBar />
      {/* Add extra space below navbar */}
      <div className="mt-20"></div>
      {/* Success Message Modal (not overlay) */}
      {showSuccessMessage && (
        <div className="fixed left-0 right-0 top-0 flex items-center justify-center z-50 pointer-events-none">
          <div className="bg-white rounded-lg shadow-xl p-8 max-w-md mx-4 text-center border-2 border-green-600 mt-24 pointer-events-auto">
            <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <svg className="w-8 h-8 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
            </div>
            <h3 className="text-xl font-bold text-gray-900 mb-2">Report Submitted Successfully!</h3>
            <p className="text-gray-600 mb-4">
              Your report has been received and assigned case ID: <strong>{caseId}</strong>
            </p>
            <p className="text-sm text-gray-500">
              Thank you for helping protect Ghana&#39;s natural resources. This message will close automatically.
            </p>
          </div>
        </div>
      )}
      
      <div className="min-h-screen bg-amber-50 py-8 px-4 sm:px-6 lg:px-8">
        <div className="max-w-4xl mx-auto">
          <header className="mb-8 bg-white rounded-lg shadow-sm p-6">
            <h1 className="text-2xl sm:text-3xl font-bold mb-4 text-gray-900 ">Report Illegal Mining Activity</h1>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-sm text-gray-600">
              <p><span className="font-medium">Case ID:</span> {caseId}</p>
              <p><span className="font-medium">Date/Time:</span> {currentDateTime}</p>
            </div>
          </header>

          <form onSubmit={handleSubmit} className="space-y-8">
            {/* Reporter Information */}
            <div className="bg-white rounded-lg shadow-sm p-6">
              <h2 className="text-xl font-semibold mb-4 text-gray-900">Reporter Information (Optional)</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label htmlFor="reporterName" className="block mb-2 text-gray-700 font-medium">Full Name</label>
                  <input
                    type="text"
                    id="reporterName"
                    value={reporterName}
                    onChange={(e) => setReporterName(e.target.value)}
                    className="w-full p-3 rounded-lg bg-gray-50 border border-gray-300 text-gray-900 focus:outline-none focus:ring-2 focus:ring-amber-500"
                    placeholder="Your full name (optional)"
                  />
                </div>
                <div>
                  <label htmlFor="reporterContact" className="block mb-2 text-gray-700 font-medium">Contact Information</label>
                  <input
                    type="text"
                    id="reporterContact"
                    value={reporterContact}
                    onChange={(e) => setReporterContact(e.target.value)}
                    className="w-full p-3 rounded-lg bg-gray-50 border border-gray-300 text-gray-900 focus:outline-none focus:ring-2 focus:ring-amber-500"
                    placeholder="Phone or email (optional)"
                  />
                </div>
              </div>
            </div>

            {/* Incident Details */}
            <div className="bg-white rounded-lg shadow-sm p-6">
              <h2 className="text-xl font-semibold mb-4 text-gray-900">Incident Details</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mb-6">
                <div>
                  <label htmlFor="region" className="block mb-2 text-gray-700 font-medium">Region </label>
                  <select
                    id="region"
                    value={selectedRegion}
                    onChange={(e) => setSelectedRegion(e.target.value)}
                    className="w-full p-3 rounded-lg bg-gray-50 border border-gray-300 text-gray-900 focus:outline-none focus:ring-2 focus:ring-amber-500"
                    required
                  >
                    <option value="">Select Region</option>
                    {regions.map((region) => (
                      <option key={region} value={region}>
                        {region}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label htmlFor="incidentDate" className="block mb-2 text-gray-700 font-medium">Incident Date</label>
                  <input
                    type="date"
                    id="incidentDate"
                    value={incidentDate}
                    onChange={(e) => setIncidentDate(e.target.value)}
                    className="w-full p-3 rounded-lg bg-gray-50 border border-gray-300 text-gray-900 focus:outline-none focus:ring-2 focus:ring-amber-500"
                  />
                </div>
                <div>
                  <label htmlFor="incidentTime" className="block mb-2 text-gray-700 font-medium">Incident Time</label>
                  <input
                    type="time"
                    id="incidentTime"
                    value={incidentTime}
                    onChange={(e) => setIncidentTime(e.target.value)}
                    className="w-full p-3 rounded-lg bg-gray-50 border border-gray-300 text-gray-900 focus:outline-none focus:ring-2 focus:ring-amber-500"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
                <div>
                  <label htmlFor="severity" className="block mb-2 text-gray-700 font-medium">Severity Level</label>
                  <select
                    id="severity"
                    value={severity}
                    onChange={(e) => setSeverity(e.target.value)}
                    className="w-full p-3 rounded-lg bg-gray-50 border border-gray-300 text-gray-900 focus:outline-none focus:ring-2 focus:ring-amber-500"
                  >
                    <option value="">Select Severity</option>
                    <option value="low">Low - Minor environmental impact</option>
                    <option value="medium">Medium - Moderate environmental damage</option>
                    <option value="high">High - Severe environmental destruction</option>
                    <option value="critical">Critical - Immediate threat to life/environment</option>
                  </select>
                </div>
                <div>
                  <label htmlFor="witnessCount" className="block mb-2 text-gray-700 font-medium">Number of Witnesses</label>
                  <input
                    type="number"
                    id="witnessCount"
                    value={witnessCount}
                    onChange={(e) => setWitnessCount(e.target.value)}
                    className="w-full p-3 rounded-lg bg-gray-50 border border-gray-300 text-gray-900 focus:outline-none focus:ring-2 focus:ring-amber-500"
                    placeholder="Approximate number"
                    min="0"
                  />
                </div>
              </div>

              <div className="mb-6">
                <p className="mb-3 font-medium text-gray-700">Type of Illegal Activity </p>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                  {reportTypes.map((type) => (
                    <label key={type} className="flex items-center p-3 bg-gray-50 rounded-lg hover:bg-gray-100 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={selectedReportTypes.includes(type)}
                        onChange={() => toggleReportType(type)}
                        className="mr-3 accent-amber-500"
                      />
                      <span className="text-gray-700">{type}</span>
                    </label>
                  ))}
                </div>
              </div>

              <div>
                <label htmlFor="details" className="block mb-2 text-gray-700 font-medium">Detailed Description </label>
                <textarea
                  id="details"
                  value={details}
                  onChange={(e) => setDetails(e.target.value)}
                  rows={6}
                  className="w-full p-3 rounded-lg bg-gray-50 border border-gray-300 text-gray-900 focus:outline-none focus:ring-2 focus:ring-amber-500"
                  placeholder="Please provide detailed information about what you observed, including specific activities, equipment used, number of people involved, environmental damage, etc."
                  required
                />
              </div>
            </div>

            {/* Location */}
            <div className="bg-white rounded-lg shadow-sm p-6">
              <h2 className="text-xl font-semibold mb-4 text-gray-900">Location Information</h2>
              <div className="rounded-lg bg-gray-100 border border-gray-300 shadow-sm w-full mb-4 mt-8 h-[300px] relative z-0">
                <ReportMapLeaflet 
                  center={mapPosition}
                  markerPos={mapPosition}
                  setMarkerPos={setMapPosition}
                />
              </div>
              <div className="flex flex-col sm:flex-row gap-4 mb-4">
                <button
                  type="button"
                  className="bg-amber-100 text-amber-800 px-4 py-2 rounded-lg border border-amber-300 hover:bg-amber-200 transition-colors"
                  onClick={() => setMapPosition([7.9465, -1.0232])}
                >
                  Reset to Ghana Center
                </button>
                <button
                  type="button"
                  className="bg-amber-100 text-amber-800 px-4 py-2 rounded-lg border border-amber-300 hover:bg-amber-200 transition-colors"
                  onClick={() => {
                    if (typeof navigator !== "undefined" && navigator.geolocation) {
                      navigator.geolocation.getCurrentPosition((position) => {
                        setMapPosition([position.coords.latitude, position.coords.longitude]);
                      });
                    }
                  }}
                >
                  Use My Location
                </button>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-4">
                <div>
                  <label htmlFor="latitude" className="block mb-2 text-gray-700 font-medium">Latitude</label>
                  <input
                    type="text"
                    id="latitude"
                    value={latitude}
                    onChange={(e) => setLatitude(e.target.value)}
                    className="w-full p-3 rounded-lg bg-gray-50 border border-gray-300 text-gray-900 focus:outline-none focus:ring-2 focus:ring-amber-500"
                    placeholder="Latitude"
                  />
                </div>
                <div>
                  <label htmlFor="longitude" className="block mb-2 text-gray-700 font-medium">Longitude</label>
                  <input
                    type="text"
                    id="longitude"
                    value={longitude}
                    onChange={(e) => setLongitude(e.target.value)}
                    className="w-full p-3 rounded-lg bg-gray-50 border border-gray-300 text-gray-900 focus:outline-none focus:ring-2 focus:ring-amber-500"
                  />
                </div>
              </div>
              <label className="flex items-center space-x-3 text-gray-700">
                <input
                  type="checkbox"
                  checked={autoTimestamp}
                  onChange={() => setAutoTimestamp(!autoTimestamp)}
                  className="accent-amber-500"
                />
                <span>Auto-timestamp location data</span>
              </label>
            </div>

            {/* Evidence Upload */}
            <div className="bg-white rounded-lg shadow-sm p-6">
              <h2 className="text-xl font-semibold mb-4 text-gray-900">Evidence Upload</h2>
              <div className="border-b border-gray-200 mb-6">
                <div className="flex flex-wrap gap-2 sm:gap-4">
                  {(["Images", "Video", "Audio", "Documents"] as const).map((tab) => (
                    <button
                      key={tab}
                      type="button"
                      className={`pb-3 px-2 text-sm sm:text-base font-medium border-b-2 transition-colors ${
                        selectedTab === tab
                          ? "border-amber-500 text-amber-600"
                          : "border-transparent text-gray-500 hover:text-gray-700"
                      }`}
                      onClick={() => setSelectedTab(tab)}
                    >
                      {tab}
                    </button>
                  ))}
                </div>
              </div>

              <div className="border-2 border-dashed border-gray-300 rounded-lg p-8 text-center bg-gray-50 hover:bg-gray-100 transition-colors">
                <div className="mb-4">
                  <svg className="mx-auto h-12 w-12 text-gray-400" stroke="currentColor" fill="none" viewBox="0 0 48 48">
                    <path d="M28 8H12a4 4 0 00-4 4v20m32-12v8m0 0v8a4 4 0 01-4 4H12a4 4 0 01-4-4v-4m32-4l-3.172-3.172a4 4 0 00-5.656 0L28 28M8 32l9.172-9.172a4 4 0 015.656 0L28 28m0 0l4 4m4-24h8m-4-4v8m-12 4h.02" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" />
                  </svg>
                </div>
                <p className="mb-2 font-semibold text-gray-700">Upload {selectedTab}</p>
                <p className="mb-4 text-gray-600">Drag and drop files here or browse to upload</p>
                <input
                  type="file"
                  multiple={isMultiple}
                  accept={
                    selectedTab === "Images" ? "image/*" :
                    selectedTab === "Video" ? "video/*" :
                    selectedTab === "Audio" ? "audio/*" :
                    ".pdf,.doc,.docx,.xls,.xlsx,.txt"
                  }
                  className="hidden"
                  id={`${selectedTab.toLowerCase()}-upload`}
                  onChange={async (event: React.ChangeEvent<HTMLInputElement>) => {
                    if (selectedTab === "Images" && event?.target?.files) {
                      // Only run on client
                      if (typeof window !== "undefined" && typeof document !== "undefined") {
                        const files = Array.from(event.target.files);
                        const compressedPromises = files.map(file => {
                          return new Promise<string>((resolve, reject) => {
                            const reader = new FileReader();
                            reader.onload = () => {
                              const img = new window.Image();
                              img.onload = () => {
                                const canvas = document.createElement('canvas');
                                const maxDim = 800;
                                let width = img.width;
                                let height = img.height;
                                if (width > maxDim || height > maxDim) {
                                  if (width > height) {
                                    height = Math.round(height * (maxDim / width));
                                    width = maxDim;
                                  } else {
                                    width = Math.round(width * (maxDim / height));
                                    height = maxDim;
                                  }
                                }
                                canvas.width = width;
                                canvas.height = height;
                                const ctx = canvas.getContext('2d');
                                ctx?.drawImage(img, 0, 0, width, height);
                                // Compress to JPEG, quality 0.6
                                const dataUrl = canvas.toDataURL('image/jpeg', 0.6);
                                resolve(dataUrl);
                              };
                              img.onerror = reject;
                              img.src = reader.result as string;
                            };
                            reader.onerror = reject;
                            reader.readAsDataURL(file);
                          });
                        });
                        const compressedUrls = await Promise.all(compressedPromises);
                        setImagePreviews(prev => [...prev, ...compressedUrls]);
                      }
                    } else if (event?.target?.files) {
                      if (typeof window !== "undefined") {
                        alert(`${event.target.files.length} ${selectedTab.toLowerCase()} file(s) selected`);
                      }
                    }
                  }}
                />
                <label
                  htmlFor={`${selectedTab.toLowerCase()}-upload`}
                  className="cursor-pointer bg-amber-600 hover:bg-amber-700 px-6 py-3 rounded-lg text-white font-semibold inline-block transition-colors"
                >
                  Browse {selectedTab}
                </label>

                {/* Image Previews and Delete */}
                {selectedTab === "Images" && imagePreviews.length > 0 && (
                  <div className="flex flex-wrap gap-4 justify-center mt-6">
                    {imagePreviews.map((src, idx) => (
                      <div key={idx} className="relative group">
                        {/* Use Next.js Image for optimized preview */}
                        <Image src={src} alt={`Preview ${idx + 1}`} width={80} height={80} className="object-cover rounded-lg border border-gray-300 shadow" unoptimized placeholder="empty" />
                        <button
                          type="button"
                          onClick={() => setImagePreviews(prev => prev.filter((_, i) => i !== idx))}
                          className="absolute top-2 right-2 bg-red-600 text-white rounded-full p-1 opacity-80 hover:opacity-100 transition-opacity"
                          title="Delete"
                        >
                          <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                            <path fillRule="evenodd" d="M6.293 6.293a1 1 0 011.414 0L10 8.586l2.293-2.293a1 1 0 111.414 1.414L11.414 10l2.293 2.293a1 1 0 01-1.414 1.414L10 11.414l-2.293 2.293a1 1 0 01-1.414-1.414L8.586 10 6.293 7.707a1 1 0 010-1.414z" clipRule="evenodd" />
                          </svg>
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>

            {/* Legal Notice */}
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-6">
              <h3 className="font-semibold text-blue-900 mb-2">Legal Protection Notice</h3>
              <p className="text-blue-800 text-sm">
                Your report is protected under Ghana&#39;s Whistleblower Act, 2006 (Act 720). You can report anonymously 
                and are protected from retaliation. All information will be handled confidentially and shared only 
                with relevant law enforcement agencies.
              </p>
            </div>

            {/* Submit Button */}
            <div className="text-center">
              <button
                className="bg-amber-600 hover:bg-amber-700 text-white font-semibold py-4 px-8 rounded-lg shadow-lg transition-colors text-lg w-2/5 h-12"
              >
                Submit Report
              </button>
            </div>
          </form>
        </div>
      </div>
      <Footer />
    </div>
  );
};

export default ReportForm;