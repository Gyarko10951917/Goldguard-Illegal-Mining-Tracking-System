import { NextRequest, NextResponse } from 'next/server';

interface ImageMetadata {
  fileName: string;
  fileSize: number;
  mimeType: string;
  dimensions?: {
    width: number;
    height: number;
  };
  format: string;
  quality?: string;
  colorProfile?: string;
  created?: string;
  modified?: string;
  compression?: string;
  dataUrl: string;
}

interface MetadataExtractionRequest {
  caseId: string;
  imageData: string; // base64 data URL
  fileName: string;
}

// Helper function to extract image metadata from base64 data
function extractImageMetadata(dataUrl: string, fileName: string): ImageMetadata {
  // Parse the data URL
  const [header, base64Data] = dataUrl.split(',');
  const mimeType = header.match(/data:([^;]+)/)?.[1] || 'image/jpeg';
  
  // Calculate file size from base64
  const sizeInBytes = Math.ceil((base64Data.length * 3) / 4);
  
  // Determine format from mime type
  const format = mimeType.split('/')[1].toUpperCase();
  
  const metadata: ImageMetadata = {
    fileName,
    fileSize: sizeInBytes,
    mimeType,
    format,
    dataUrl,
    created: new Date().toISOString(),
    modified: new Date().toISOString()
  };

  // For JPEG images, we can try to extract additional metadata
  if (mimeType.includes('jpeg') || mimeType.includes('jpg')) {
    metadata.compression = 'JPEG';
    
    // Try to determine quality level (rough estimate)
    const compressionRatio = sizeInBytes / (1024 * 1024); // rough estimate
    if (compressionRatio < 0.1) {
      metadata.quality = 'High Compression (Low Quality)';
    } else if (compressionRatio < 0.5) {
      metadata.quality = 'Medium Compression';
    } else {
      metadata.quality = 'Low Compression (High Quality)';
    }
  }

  return metadata;
}

// Helper function to extract dimensions from image data URL
async function getImageDimensions(dataUrl: string): Promise<{width: number, height: number} | null> {
  try {
    // This would normally require a proper image processing library
    // For now, we'll return null and suggest using a proper backend solution
    return null;
  } catch (error) {
    console.error('Error extracting image dimensions:', error);
    return null;
  }
}

export async function POST(request: NextRequest) {
  try {
    const body: MetadataExtractionRequest = await request.json();
    
    if (!body.caseId || !body.imageData || !body.fileName) {
      return NextResponse.json({
        success: false,
        error: 'Missing required fields: caseId, imageData, fileName'
      }, { status: 400 });
    }

    // Validate that imageData is a proper data URL
    if (!body.imageData.startsWith('data:image/')) {
      return NextResponse.json({
        success: false,
        error: 'Invalid image data format. Expected data URL.'
      }, { status: 400 });
    }

    // Extract basic metadata
    const metadata = extractImageMetadata(body.imageData, body.fileName);
    
    // Try to get image dimensions (this would require proper image processing in a real backend)
    const dimensions = await getImageDimensions(body.imageData);
    if (dimensions) {
      metadata.dimensions = dimensions;
    }

    // Store metadata in the case record (in a real backend, this would go to a database)
    const caseMetadata = {
      caseId: body.caseId,
      extractedAt: new Date().toISOString(),
      metadata,
      analysis: {
        isValidImage: true,
        estimatedFileSize: `${(metadata.fileSize / 1024).toFixed(2)} KB`,
        format: metadata.format,
        compressionInfo: metadata.quality || 'Unknown',
        potentialIssues: []
      }
    };

    // In a real implementation, you would:
    // 1. Save this to a database
    // 2. Use proper image processing libraries (like sharp, jimp, etc.)
    // 3. Extract EXIF data if available
    // 4. Perform image analysis for evidence validation

    return NextResponse.json({
      success: true,
      caseId: body.caseId,
      metadata: caseMetadata,
      message: 'Image metadata extracted successfully'
    });

  } catch (error) {
    console.error('Error extracting image metadata:', error);
    return NextResponse.json({
      success: false,
      error: 'Failed to extract image metadata',
      details: error instanceof Error ? error.message : String(error)
    }, { status: 500 });
  }
}

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const caseId = searchParams.get('caseId');
  
  if (!caseId) {
    return NextResponse.json({
      success: false,
      error: 'Missing caseId parameter'
    }, { status: 400 });
  }

  try {
    // In a real implementation, you would fetch from database
    // For now, we'll return a mock response
    return NextResponse.json({
      success: true,
      caseId,
      message: 'Use POST method to extract metadata from image data',
      usage: {
        method: 'POST',
        endpoint: '/api/metadata/extract',
        body: {
          caseId: 'string',
          imageData: 'data:image/jpeg;base64,...',
          fileName: 'string'
        }
      }
    });
    
  } catch (error) {
    console.error('Error retrieving metadata:', error);
    return NextResponse.json({
      success: false,
      error: 'Failed to retrieve metadata'
    }, { status: 500 });
  }
}