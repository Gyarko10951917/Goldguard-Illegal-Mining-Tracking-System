import Case from '../models/Case.js';
import Report from '../models/Report.js';
import { logger } from './logger.js';

/**
 * Creates a case from a report automatically
 * @param {Object} report - The report object from MongoDB
 * @returns {Object} The created case or null if failed
 */
export async function createCaseFromReport(report) {
  try {
    // Check if a case already exists for this report
    const existingCase = await Case.findOne({ reportId: report._id });
    if (existingCase) {
      logger.info(`Case already exists for report ${report.reportId}: ${existingCase.caseId}`);
      return existingCase;
    }

    // Create case data from report
    const caseData = new Case({
      reportId: report._id,
      title: `${report.type} - ${report.region}`,
      region: report.region,
      type: report.type,
      priority: report.priority,
      description: report.description,
      location: report.location,
      reporter: {
        fullName: report.isAnonymous ? null : report.fullName,
        phoneNumber: report.isAnonymous ? null : report.phoneNumber,
        email: report.isAnonymous ? null : report.email,
        isAnonymous: report.isAnonymous
      },
      evidence: report.evidence.map(evidence => ({
        type: evidence.type,
        description: evidence.description,
        fileUrl: evidence.fileUrl,
        fileName: evidence.fileName,
        uploadedBy: null, // Will be set by the system
        uploadedAt: new Date()
      })),
      timeline: [{
        action: 'created',
        description: 'Case automatically created from citizen report',
        performedBy: null, // System generated
        timestamp: new Date()
      }],
      createdAt: new Date()
    });

    // Save the case
    const savedCase = await caseData.save();

    // Update the report to reference the case
    await Report.findByIdAndUpdate(report._id, {
      caseId: savedCase.caseId,
      status: 'Under Review'
    });

    logger.info(`Case ${savedCase.caseId} created from report ${report.reportId}`);
    return savedCase;

  } catch (error) {
    logger.error('Error creating case from report:', error);
    return null;
  }
}

/**
 * Processes all pending reports and creates cases for them
 * This function can be run periodically or triggered manually
 */
export async function processPendingReports() {
  try {
    // Find all reports without associated cases
    const pendingReports = await Report.find({
      caseId: { $exists: false },
      status: 'Submitted'
    }).limit(50); // Process in batches

    logger.info(`Processing ${pendingReports.length} pending reports`);

    const results = {
      processed: 0,
      successful: 0,
      failed: 0,
      errors: []
    };

    for (const report of pendingReports) {
      results.processed++;
      
      const createdCase = await createCaseFromReport(report);
      
      if (createdCase) {
        results.successful++;
      } else {
        results.failed++;
        results.errors.push(`Failed to create case for report ${report.reportId}`);
      }
    }

    logger.info('Report processing completed:', results);
    return results;

  } catch (error) {
    logger.error('Error processing pending reports:', error);
    throw error;
  }
}

/**
 * Auto-assigns cases based on priority and region
 * @param {Object} caseData - The case to auto-assign
 * @returns {Object} Updated case with assignment or null if no suitable officer
 */
export async function autoAssignCase(caseData) {
  try {
    const User = (await import('../models/User.js')).default;
    
    // Find available officers in the same region or general officers
    const availableOfficers = await User.find({
      role: { $in: ['officer', 'admin'] },
      status: 'active',
      $or: [
        { 'profile.region': caseData.region },
        { 'profile.region': { $exists: false } } // Officers without specific region
      ]
    }).select('_id username profile');

    if (availableOfficers.length === 0) {
      logger.warn(`No available officers found for case ${caseData.caseId} in region ${caseData.region}`);
      return null;
    }

    // Simple assignment logic: assign to officer with least active cases
    const assignmentPromises = availableOfficers.map(async (officer) => {
      const activeCases = await Case.countDocuments({
        assignedTo: officer._id,
        status: { $in: ['Open', 'In Progress'] }
      });
      return { officer, activeCases };
    });

    const officerWorkloads = await Promise.all(assignmentPromises);
    
    // Sort by workload (ascending) and prioritize officers in same region
    officerWorkloads.sort((a, b) => {
      const aInRegion = a.officer.profile.region === caseData.region;
      const bInRegion = b.officer.profile.region === caseData.region;
      
      if (aInRegion && !bInRegion) return -1;
      if (!aInRegion && bInRegion) return 1;
      
      return a.activeCases - b.activeCases;
    });

    const selectedOfficer = officerWorkloads[0].officer;

    // Update case with assignment
    caseData.assignedTo = selectedOfficer._id;
    caseData.status = 'In Progress';
    caseData.timeline.push({
      action: 'assigned',
      description: `Case automatically assigned to ${selectedOfficer.profile.firstName} ${selectedOfficer.profile.lastName}`,
      performedBy: null, // System generated
      newValue: selectedOfficer._id.toString()
    });

    await caseData.save();

    logger.info(`Case ${caseData.caseId} auto-assigned to ${selectedOfficer.username}`);
    return caseData;

  } catch (error) {
    logger.error('Error auto-assigning case:', error);
    return null;
  }
}

/**
 * Escalates high priority cases that have been open too long
 */
export async function escalateOverdueCases() {
  try {
    const twentyFourHoursAgo = new Date(Date.now() - 24 * 60 * 60 * 1000);
    const seventyTwoHoursAgo = new Date(Date.now() - 72 * 60 * 60 * 1000);

    // Find critical cases open for more than 24 hours
    const criticalOverdue = await Case.find({
      priority: 'Critical',
      status: { $in: ['Open', 'In Progress'] },
      createdAt: { $lt: twentyFourHoursAgo }
    });

    // Find high priority cases open for more than 72 hours
    const highOverdue = await Case.find({
      priority: 'High',
      status: { $in: ['Open', 'In Progress'] },
      createdAt: { $lt: seventyTwoHoursAgo }
    });

    const overdueCases = [...criticalOverdue, ...highOverdue];

    for (const caseData of overdueCases) {
      // Add escalation timeline entry
      caseData.timeline.push({
        action: 'escalated',
        description: `Case escalated due to ${caseData.priority} priority timeout`,
        performedBy: null // System generated
      });

      // You could also reassign to a supervisor or send notifications here
      await caseData.save();
    }

    logger.info(`Escalated ${overdueCases.length} overdue cases`);
    return overdueCases.length;

  } catch (error) {
    logger.error('Error escalating overdue cases:', error);
    throw error;
  }
}
