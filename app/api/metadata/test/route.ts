import { NextRequest, NextResponse } from 'next/server';

// Simple test endpoint to verify metadata extraction works
export async function GET(_request: NextRequest) {
  // Create a small test image (1x1 pixel red image) in base64 format
  const testImageBase64 = 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8/5+hHgAHggJ/PchI7wAAAABJRU5ErkJggg==';
  
  try {
    const response = await fetch('http://localhost:3001/api/metadata/extract', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        caseId: 'TEST-2025-001',
        imageData: testImageBase64,
        fileName: 'test_image.png'
      })
    });

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const result = await response.json();
    
    return NextResponse.json({
      success: true,
      testResult: result,
      message: 'Metadata extraction test completed successfully',
      testImage: {
        description: '1x1 pixel red PNG image',
        dataUrl: testImageBase64,
        expectedMetadata: {
          format: 'PNG',
          size: 'Very small',
          type: 'image/png'
        }
      }
    });

  } catch (error) {
    console.error('Metadata extraction test failed:', error);
    return NextResponse.json({
      success: false,
      error: 'Metadata extraction test failed',
      details: error instanceof Error ? error.message : String(error)
    }, { status: 500 });
  }
}