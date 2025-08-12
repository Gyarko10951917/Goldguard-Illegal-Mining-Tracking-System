import { NextRequest, NextResponse } from 'next/server';

interface ReportSubmission {
  fullName: string;
  phoneNumber: string;
  email: string;
  region: string;
  subject: string;
  message: string;
  isAnonymous: boolean;
}

interface Case {
  id: string;
  title: string;
  region: string;
  type: string;
  status: 'Open' | 'In Progress' | 'Resolved' | 'Closed';
  priority: 'Low' | 'Medium' | 'High' | 'Critical';
  assignedTo: string;
  reportedDate: string;
  lastUpdated: string;
  description: string;
  location?: string;
  reporter?: {
    name?: string;
    phone?: string;
    email?: string;
    anonymous: boolean;
  };
}

function generateCaseId(): string {
  const timestamp = Date.now().toString(36);
  const randomStr = Math.random().toString(36).substr(2, 5);
  return `CASE-${timestamp}-${randomStr}`.toUpperCase();
}

function determinePriority(subject: string, message: string): Case['priority'] {
  const highPriorityKeywords = ['urgent', 'emergency', 'immediate', 'danger', 'toxic', 'health', 'contamination'];
  const criticalKeywords = ['death', 'poison', 'severe', 'massive', 'widespread'];
  
  const content = (subject + ' ' + message).toLowerCase();
  
  if (criticalKeywords.some(keyword => content.includes(keyword))) {
    return 'Critical';
  }
  
  if (highPriorityKeywords.some(keyword => content.includes(keyword))) {
    return 'High';
  }
  
  if (subject.includes('Illegal Mining') || subject.includes('Water Pollution')) {
    return 'High';
  }
  
  return 'Medium';
}

function mapSubjectToType(subject: string): string {
  const typeMapping: { [key: string]: string } = {
    'Illegal Mining': 'Illegal Mining',
    'Environmental Damage': 'Environmental',
    'Water Pollution': 'Water Pollution',
    'Forest Destruction': 'Environmental',
    'Land Degradation': 'Environmental',
    'Community Impact': 'Community',
    'Safety Concerns': 'Safety',
    'General Inquiry': 'General',
    'Technical Support': 'Technical',
    'Other': 'General'
  };
  
  return typeMapping[subject] || 'General';
}

export async function POST(request: NextRequest) {
  try {
    const body: ReportSubmission = await request.json();
    
    // Validate required fields
    if (!body.region || !body.subject || !body.message) {
      return NextResponse.json(
        { error: 'Region, subject, and message are required' },
        { status: 400 }
      );
    }

    // Create new case from submission
    const newCase: Case = {
      id: generateCaseId(),
      title: `${body.subject} - ${body.region}`,
      region: body.region,
      type: mapSubjectToType(body.subject),
      status: 'Open',
      priority: determinePriority(body.subject, body.message),
      assignedTo: 'Unassigned',
      reportedDate: new Date().toISOString(),
      lastUpdated: new Date().toISOString(),
      description: body.message,
      location: body.region,
      reporter: {
        name: body.fullName || undefined,
        phone: body.phoneNumber || undefined,
        email: body.email || undefined,
        anonymous: body.isAnonymous
      }
    };

    // In a real application, you would save this to a database
    // For now, we'll store it in localStorage on the client side
    // and return success
    
    return NextResponse.json({
      success: true,
      message: 'Report submitted successfully',
      caseId: newCase.id,
      case: newCase
    });

  } catch (error) {
    console.error('Error processing report submission:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
