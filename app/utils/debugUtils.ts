// Debug utility to check localStorage reports
export function checkLocalStorageReports() {
  try {
    const savedReports = JSON.parse(localStorage.getItem('goldguard_reports') || '[]');
    console.log('=== localStorage Debug ===');
    console.log('Total reports found:', savedReports.length);
    
    savedReports.forEach((report, index) => {
      console.log(`Report ${index + 1}:`, {
        id: report.id,
        type: report.type,
        region: report.region,
        hasEvidence: !!report.evidence,
        evidenceCount: report.evidence?.length || 0,
        evidenceTypes: report.evidence?.map(e => ({ type: e.type, fileName: e.fileName, hasFileUrl: !!e.fileUrl })) || []
      });
    });
    
    return savedReports;
  } catch (error) {
    console.error('Error reading localStorage:', error);
    return [];
  }
}

// Function to generate a test report with image for testing
export function generateTestReport() {
  const testImage = 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8/5+hHgAHggJ/PchI7wAAAABJRU5ErkJggg==';
  
  const testReport = {
    id: `TEST-CASE-${Date.now()}`,
    type: 'Water Pollution',
    region: 'Ashanti',
    description: 'Test report with image evidence for debugging purposes',
    isAnonymous: false,
    fullName: 'Test Reporter',
    submittedAt: new Date().toISOString(),
    evidence: [
      {
        type: 'Photo',
        description: 'Test evidence photo',
        fileUrl: testImage,
        fileName: 'test_evidence.png'
      }
    ],
    location: {
      coordinates: {
        latitude: 6.6885,
        longitude: -1.6244
      },
      address: 'Test Location, Kumasi, Ashanti'
    }
  };
  
  try {
    const savedReports = JSON.parse(localStorage.getItem('goldguard_reports') || '[]');
    savedReports.push(testReport);
    localStorage.setItem('goldguard_reports', JSON.stringify(savedReports));
    console.log('Test report added successfully:', testReport);
    return testReport;
  } catch (error) {
    console.error('Error adding test report:', error);
    return null;
  }
}

// Make functions available globally for console debugging
if (typeof window !== 'undefined') {
  (window as any).checkLocalStorageReports = checkLocalStorageReports;
  (window as any).generateTestReport = generateTestReport;
}