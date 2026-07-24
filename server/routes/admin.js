const express = require('express');
const router = express.Router();

const db = require('../services/db');
const appsScript = require('../services/appsScript');
const emailService = require('../services/email');
const excelExport = require('../services/excelExport');

// ==================== MIDDLEWARE: Admin check ====================
function adminAuth(req, res, next) {
    const adminKey = req.headers['x-admin-key'];
    if (adminKey !== 'admin-secret-2024') {
        return res.status(401).json({ error: 'Unauthorized admin access' });
    }
    next();
}

// ==================== GET ALL PENDING APPROVALS ====================
router.get('/approvals', async (req, res) => {
    try {
        const approvals = await db.getPendingApprovalRows();

        const pendingApprovals = (
            await Promise.all(
                approvals.map(async (approval) => {
                    const user = approval.type === 'developer'
                        ? await db.findDeveloperById(approval.id)
                        : await db.findClientById(approval.id);
                    if (!user) return null;

                    const { password, ...safeUser } = user;
                    return { approval, user: safeUser };
                })
            )
        ).filter(item => item !== null);

        res.json({ approvals: pendingApprovals });
    } catch (error) {
        console.error('Get approvals error:', error);
        res.status(500).json({ error: 'Failed to fetch approvals: ' + error.message });
    }
});

// ==================== APPROVE USER ====================
router.post('/approve/:userId', async (req, res) => {
    try {
        const { userId } = req.params;
        const { type } = req.body;

        let user = null;

        if (type === 'developer') {
            user = await db.approveDeveloper(userId);
        } else if (type === 'client') {
            user = await db.approveClient(userId);
        }

        if (!user) {
            return res.status(404).json({ error: 'User not found' });
        }

        // Update approval status
        await db.setApprovalStatus(userId, 'approved');

        // Sync approval status via Apps Script (non-blocking)
        try {
            await appsScript.approveUser(userId, type, 'approved');
        } catch (syncError) {
            console.error('Apps Script sync failed (non-blocking):', syncError.message);
        }

        // Send approval email (link back to whatever host actually served this request)
        const appUrl = `${req.protocol}://${req.get('host')}`;
        await emailService.sendApprovalEmail(user.email, user.name, user.role, appUrl);

        res.json({
            message: 'User approved successfully!',
            user: {
                id: user.id,
                name: user.name,
                email: user.email,
                role: user.role
            }
        });
    } catch (error) {
        console.error('Approve user error:', error);
        res.status(500).json({ error: 'Failed to approve user: ' + error.message });
    }
});

// ==================== REJECT USER ====================
router.post('/reject/:userId', async (req, res) => {
    try {
        const { userId } = req.params;
        const { type } = req.body;

        let user = null;

        if (type === 'developer') {
            user = await db.rejectDeveloper(userId);
        } else if (type === 'client') {
            user = await db.rejectClient(userId);
        }

        if (!user) {
            return res.status(404).json({ error: 'User not found' });
        }

        // Update approval status
        await db.setApprovalStatus(userId, 'rejected');

        // Sync rejection status via Apps Script (non-blocking)
        try {
            await appsScript.approveUser(userId, type, 'rejected');
        } catch (syncError) {
            console.error('Apps Script sync failed (non-blocking):', syncError.message);
        }

        res.json({ message: 'User rejected and removed from system.' });
    } catch (error) {
        console.error('Reject user error:', error);
        res.status(500).json({ error: 'Failed to reject user: ' + error.message });
    }
});

// ==================== GET ALL USERS (Admin only) ====================
router.get('/users', async (req, res) => {
    try {
        const developers = await db.getAllDevelopers();
        const clients = await db.getAllClients();

        const safeDevs = developers.map(d => {
            const { password, ...rest } = d;
            return rest;
        });

        const safeClients = clients.map(c => {
            const { password, ...rest } = c;
            return rest;
        });

        const approvals = await db.getAllApprovals();

        res.json({
            developers: safeDevs,
            clients: safeClients,
            approvals
        });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// ==================== DASHBOARD STATS ====================
router.get('/stats', async (req, res) => {
    try {
        const developers = await db.getAllDevelopers();
        const clients = await db.getAllClients();
        const jobs = await db.getAllJobs();
        const approvals = await db.getAllApprovals();

        res.json({
            stats: {
                totalDevelopers: developers.length,
                approvedDevelopers: developers.filter(d => d.approved).length,
                pendingDevelopers: developers.filter(d => !d.approved).length,
                totalClients: clients.length,
                approvedClients: clients.filter(c => c.approved).length,
                pendingClients: clients.filter(c => !c.approved).length,
                totalJobs: jobs.length,
                pendingApprovals: approvals.filter(a => a.status === 'pending').length,
                pendingJobApprovals: jobs.filter(j => j.status === 'pending').length
            }
        });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// ==================== EXPORT ALL DATA TO EXCEL ====================
router.get('/export-excel', async (req, res) => {
    try {
        const buffer = await excelExport.generateExcelBuffer();
        const timestamp = new Date().toISOString().replace(/[:.]/g, '-').substring(0, 19);
        const fileName = `ProDevelopers_Data_${timestamp}.xlsx`;

        res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
        res.setHeader('Content-Disposition', `attachment; filename="${fileName}"`);
        res.send(buffer);
    } catch (error) {
        console.error('Excel export error:', error);
        res.status(500).json({ error: 'Failed to export data: ' + error.message });
    }
});

// ==================== DOWNLOAD EXCEL FILE (alias of export, buffer-based) ====================
router.get('/download-excel', async (req, res) => {
    try {
        const buffer = await excelExport.generateExcelBuffer();
        const timestamp = new Date().toISOString().replace(/[:.]/g, '-').substring(0, 19);
        const fileName = `ProDevelopers_Data_${timestamp}.xlsx`;

        res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
        res.setHeader('Content-Disposition', `attachment; filename="${fileName}"`);
        res.send(buffer);
    } catch (error) {
        console.error('Excel download error:', error);
        res.status(500).json({ error: 'Failed to download Excel: ' + error.message });
    }
});

module.exports = router;
