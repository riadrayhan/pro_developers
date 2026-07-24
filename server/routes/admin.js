const express = require('express');
const path = require('path');
const router = express.Router();

const localStorage = require('../services/localStorage');
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
router.get('/approvals', (req, res) => {
    try {
        const approvals = localStorage.readData('approvals');
        const developers = localStorage.readData('developers');
        const clients = localStorage.readData('clients');

        const pendingApprovals = approvals
            .filter(a => a.status === 'pending')
            .map(approval => {
                let user = null;
                if (approval.type === 'developer') {
                    user = developers.find(d => d.id === approval.id);
                } else {
                    user = clients.find(c => c.id === approval.id);
                }
                if (!user) return null;

                const { password, ...safeUser } = user;
                return {
                    approval: approval,
                    user: safeUser
                };
            })
            .filter(item => item !== null);

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
            const developers = localStorage.readData('developers');
            const devIndex = developers.findIndex(d => d.id === userId);
            if (devIndex > -1) {
                developers[devIndex].approved = true;
                localStorage.writeData('developers', developers);
                user = developers[devIndex];
            }
        } else if (type === 'client') {
            const clients = localStorage.readData('clients');
            const clientIndex = clients.findIndex(c => c.id === userId);
            if (clientIndex > -1) {
                clients[clientIndex].approved = true;
                localStorage.writeData('clients', clients);
                user = clients[clientIndex];
            }
        }

        if (!user) {
            return res.status(404).json({ error: 'User not found' });
        }

        // Update approval status
        const approvals = localStorage.readData('approvals');
        const approvalIndex = approvals.findIndex(a => a.id === userId);
        if (approvalIndex > -1) {
            approvals[approvalIndex].status = 'approved';
            localStorage.writeData('approvals', approvals);
        }

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
router.post('/reject/:userId', (req, res) => {
    try {
        const { userId } = req.params;
        const { type } = req.body;

        let user = null;

        if (type === 'developer') {
            const developers = localStorage.readData('developers');
            const devIndex = developers.findIndex(d => d.id === userId);
            if (devIndex > -1) {
                user = developers[devIndex];
                developers.splice(devIndex, 1);
                localStorage.writeData('developers', developers);
            }
        } else if (type === 'client') {
            const clients = localStorage.readData('clients');
            const clientIndex = clients.findIndex(c => c.id === userId);
            if (clientIndex > -1) {
                user = clients[clientIndex];
                clients.splice(clientIndex, 1);
                localStorage.writeData('clients', clients);
            }
        }

        if (!user) {
            return res.status(404).json({ error: 'User not found' });
        }

        // Update approval status
        const approvals = localStorage.readData('approvals');
        const approvalIndex = approvals.findIndex(a => a.id === userId);
        if (approvalIndex > -1) {
            approvals[approvalIndex].status = 'rejected';
            localStorage.writeData('approvals', approvals);
        }

        res.json({ message: 'User rejected and removed from system.' });
    } catch (error) {
        console.error('Reject user error:', error);
        res.status(500).json({ error: 'Failed to reject user: ' + error.message });
    }
});

// ==================== GET ALL USERS (Admin only) ====================
router.get('/users', (req, res) => {
    try {
        const developers = localStorage.readData('developers');
        const clients = localStorage.readData('clients');

        const safeDevs = developers.map(d => {
            const { password, ...rest } = d;
            return rest;
        });

        const safeClients = clients.map(c => {
            const { password, ...rest } = c;
            return rest;
        });

        const approvals = localStorage.readData('approvals');

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
router.get('/stats', (req, res) => {
    try {
        const developers = localStorage.readData('developers');
        const clients = localStorage.readData('clients');
        const jobs = localStorage.readData('jobs');
        const approvals = localStorage.readData('approvals');

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
router.get('/export-excel', (req, res) => {
    try {
        const buffer = excelExport.generateExcelBuffer();
        const timestamp = new Date().toISOString().replace(/[:.]/g, '-').substring(0, 19);
        const fileName = `JobPortal_Data_${timestamp}.xlsx`;
        
        res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
        res.setHeader('Content-Disposition', `attachment; filename="${fileName}"`);
        res.send(buffer);
    } catch (error) {
        console.error('Excel export error:', error);
        res.status(500).json({ error: 'Failed to export data: ' + error.message });
    }
});

// ==================== DOWNLOAD EXCEL FILE ====================
router.get('/download-excel', (req, res) => {
    try {
        const result = excelExport.generateExcel();
        const fileName = path.basename(result.filePath);
        
        res.download(result.filePath, fileName);
    } catch (error) {
        console.error('Excel download error:', error);
        res.status(500).json({ error: 'Failed to download Excel: ' + error.message });
    }
});

module.exports = router;