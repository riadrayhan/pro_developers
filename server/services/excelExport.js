const XLSX = require('xlsx');
const path = require('path');
const fs = require('fs-extra');

const localStorage = require('./localStorage');

/**
 * Generate an Excel file with all application data
 * Creates separate sheets for:
 * - Developers
 * - Clients
 * - Jobs
 * - Likes/Interests
 * - Approvals
 */
function generateExcel() {
    // Read all data
    const developers = localStorage.readData('developers');
    const clients = localStorage.readData('clients');
    const jobs = localStorage.readData('jobs');
    const likes = localStorage.readData('likes');
    const approvals = localStorage.readData('approvals');

    // Create a new workbook
    const wb = XLSX.utils.book_new();

    // ==================== DEVELOPERS SHEET ====================
    const devData = developers.map(d => ({
        'ID': d.id || '',
        'Name': d.name || '',
        'Email': d.email || '',
        'Phone': d.phone || '',
        'Role': 'Developer',
        'Approved': d.approved ? 'Yes' : 'No',
        'Registered At': d.registeredAt || '',
        'Has Image': d.image ? 'Yes' : 'No',
        'Has Job ID Card': d.jobID ? 'Yes' : 'No',
        'Has NID Card': d.nid ? 'Yes' : 'No'
    }));
    const devSheet = XLSX.utils.json_to_sheet(devData);

    // Set column widths for better readability
    devSheet['!cols'] = [
        { wch: 40 }, // ID
        { wch: 25 }, // Name
        { wch: 30 }, // Email
        { wch: 20 }, // Phone
        { wch: 12 }, // Role
        { wch: 10 }, // Approved
        { wch: 25 }, // Registered At
        { wch: 12 }, // Has Image
        { wch: 18 }, // Has Job ID Card
        { wch: 16 }  // Has NID Card
    ];
    XLSX.utils.book_append_sheet(wb, devSheet, 'Developers');

    // ==================== CLIENTS SHEET ====================
    const clientData = clients.map(c => ({
        'ID': c.id || '',
        'Name': c.name || '',
        'Email': c.email || '',
        'Phone': c.phone || '',
        'Role': 'Client',
        'Approved': c.approved ? 'Yes' : 'No',
        'Registered At': c.registeredAt || '',
        'Has Image': c.image ? 'Yes' : 'No'
    }));
    const clientSheet = XLSX.utils.json_to_sheet(clientData);
    clientSheet['!cols'] = [
        { wch: 40 }, { wch: 25 }, { wch: 30 }, { wch: 20 },
        { wch: 10 }, { wch: 10 }, { wch: 25 }, { wch: 12 }
    ];
    XLSX.utils.book_append_sheet(wb, clientSheet, 'Clients');

    // ==================== JOBS SHEET ====================
    const jobData = jobs.map(j => ({
        'Job ID': j.id || '',
        'Title': j.title || '',
        'Description': (j.details || '').substring(0, 200),
        'Client ID': j.clientId || '',
        'Client Name': j.clientName || '',
        'WhatsApp': j.phone || '',
        'Budget': j.budget || '',
        'Duration': j.duration || '',
        'Posted At': j.postedAt || '',
        'Total Interests': likes.filter(l => l.jobId === j.id).length || 0
    }));
    const jobSheet = XLSX.utils.json_to_sheet(jobData);
    jobSheet['!cols'] = [
        { wch: 40 }, { wch: 30 }, { wch: 50 }, { wch: 40 },
        { wch: 25 }, { wch: 20 }, { wch: 15 }, { wch: 20 },
        { wch: 25 }, { wch: 16 }
    ];
    XLSX.utils.book_append_sheet(wb, jobSheet, 'Jobs');

    // ==================== LIKES / INTERESTS SHEET ====================
    const likeData = likes.map(l => {
        const job = jobs.find(j => j.id === l.jobId);
        const user = developers.find(d => d.id === l.userId) || clients.find(c => c.id === l.userId);
        return {
            'Job ID': l.jobId || '',
            'Job Title': job ? job.title : 'Unknown',
            'User ID': l.userId || '',
            'User Name': user ? user.name : 'Unknown',
            'User Role': user ? user.role : 'Unknown',
            'Liked At': l.likedAt || ''
        };
    });
    const likeSheet = XLSX.utils.json_to_sheet(likeData);
    likeSheet['!cols'] = [
        { wch: 40 }, { wch: 30 }, { wch: 40 },
        { wch: 25 }, { wch: 12 }, { wch: 25 }
    ];
    XLSX.utils.book_append_sheet(wb, likeSheet, 'Interests');

    // ==================== APPROVALS SHEET ====================
    const approvalData = approvals.map(a => ({
        'User ID': a.id || '',
        'User Name': a.name || '',
        'Type': a.type || '',
        'Email': a.email || '',
        'Phone': a.phone || '',
        'Status': a.status || '',
        'Created At': a.createdAt || ''
    }));
    const approvalSheet = XLSX.utils.json_to_sheet(approvalData);
    approvalSheet['!cols'] = [
        { wch: 40 }, { wch: 25 }, { wch: 12 },
        { wch: 30 }, { wch: 20 }, { wch: 12 }, { wch: 25 }
    ];
    XLSX.utils.book_append_sheet(wb, approvalSheet, 'Approvals');

    // ==================== SUMMARY SHEET ====================
    const summaryData = [{
        'Metric': 'Total Developers',
        'Value': developers.length
    }, {
        'Metric': 'Approved Developers',
        'Value': developers.filter(d => d.approved).length
    }, {
        'Metric': 'Pending Developers',
        'Value': developers.filter(d => !d.approved).length
    }, {
        'Metric': 'Total Clients',
        'Value': clients.length
    }, {
        'Metric': 'Approved Clients',
        'Value': clients.filter(c => c.approved).length
    }, {
        'Metric': 'Pending Clients',
        'Value': clients.filter(c => !c.approved).length
    }, {
        'Metric': 'Total Jobs',
        'Value': jobs.length
    }, {
        'Metric': 'Total Interests (Likes)',
        'Value': likes.length
    }, {
        'Metric': 'Pending Approvals',
        'Value': approvals.filter(a => a.status === 'pending').length
    }, {
        'Metric': 'Approved',
        'Value': approvals.filter(a => a.status === 'approved').length
    }, {
        'Metric': 'Rejected',
        'Value': approvals.filter(a => a.status === 'rejected').length
    }];
    const summarySheet = XLSX.utils.json_to_sheet(summaryData);
    summarySheet['!cols'] = [{ wch: 30 }, { wch: 15 }];
    XLSX.utils.book_append_sheet(wb, summarySheet, 'Summary');

    // Write to file
    const exportDir = path.join(__dirname, '..', 'storage', 'exports');
    fs.ensureDirSync(exportDir);
    
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-').substring(0, 19);
    const fileName = `JobPortal_Data_${timestamp}.xlsx`;
    const filePath = path.join(exportDir, fileName);
    
    XLSX.writeFile(wb, filePath);
    
    return { filePath, fileName };
}

/**
 * Generate Excel and return as buffer for download
 */
function generateExcelBuffer() {
    // Read all data
    const developers = localStorage.readData('developers');
    const clients = localStorage.readData('clients');
    const jobs = localStorage.readData('jobs');
    const likes = localStorage.readData('likes');
    const approvals = localStorage.readData('approvals');

    const wb = XLSX.utils.book_new();

    // Developers sheet
    const devData = developers.map(d => ({
        'ID': d.id, 'Name': d.name, 'Email': d.email, 'Phone': d.phone,
        'Role': 'Developer', 'Approved': d.approved ? 'Yes' : 'No',
        'Registered At': d.registeredAt
    }));
    XLSX.utils.book_append_sheet(wb, XLSX.utils.json_to_sheet(devData), 'Developers');

    // Clients sheet
    const clientData = clients.map(c => ({
        'ID': c.id, 'Name': c.name, 'Email': c.email, 'Phone': c.phone,
        'Role': 'Client', 'Approved': c.approved ? 'Yes' : 'No',
        'Registered At': c.registeredAt
    }));
    XLSX.utils.book_append_sheet(wb, XLSX.utils.json_to_sheet(clientData), 'Clients');

    // Jobs sheet
    const jobData = jobs.map(j => ({
        'Job ID': j.id, 'Title': j.title,
        'Description': (j.details || '').substring(0, 200),
        'Client': j.clientName, 'WhatsApp': j.phone,
        'Budget': j.budget, 'Duration': j.duration,
        'Posted At': j.postedAt,
        'Interests': likes.filter(l => l.jobId === j.id).length
    }));
    XLSX.utils.book_append_sheet(wb, XLSX.utils.json_to_sheet(jobData), 'Jobs');

    // Summary sheet
    const summaryData = [
        { 'Metric': 'Total Developers', 'Value': developers.length },
        { 'Metric': 'Approved Developers', 'Value': developers.filter(d => d.approved).length },
        { 'Metric': 'Total Clients', 'Value': clients.length },
        { 'Metric': 'Approved Clients', 'Value': clients.filter(c => c.approved).length },
        { 'Metric': 'Total Jobs', 'Value': jobs.length },
        { 'Metric': 'Total Interests', 'Value': likes.length },
        { 'Metric': 'Pending Approvals', 'Value': approvals.filter(a => a.status === 'pending').length }
    ];
    XLSX.utils.book_append_sheet(wb, XLSX.utils.json_to_sheet(summaryData), 'Summary');

    return XLSX.write(wb, { type: 'buffer', bookType: 'xlsx' });
}

module.exports = { generateExcel, generateExcelBuffer };