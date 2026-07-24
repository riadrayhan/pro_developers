const express = require('express');
const router = express.Router();
const { v4: uuidv4 } = require('uuid');

const db = require('../services/db');
const appsScript = require('../services/appsScript');

// ==================== POST A JOB ====================
router.post('/', async (req, res) => {
    try {
        const { clientId, clientName, clientImage, title, details, phone, budget, duration } = req.body;

        if (!clientId || !title || !details || !phone || !budget) {
            return res.status(400).json({ error: 'Client ID, title, details, phone, and budget are required' });
        }

        const job = {
            id: uuidv4(),
            clientId,
            clientName: clientName || 'Unknown Client',
            clientImage: clientImage || null,
            title,
            details,
            phone,
            budget: parseFloat(budget),
            duration: duration || 'Not specified',
            status: 'pending',
            postedAt: new Date().toISOString()
        };

        await db.insertJob(job);

        // Sync to Sheet via Apps Script (non-blocking)
        appsScript.postJob({
            clientId: job.clientId,
            clientName: job.clientName,
            title: job.title,
            details: job.details,
            phone: job.phone,
            budget: job.budget,
            duration: job.duration
        }).catch(err => console.error('Apps Script sync failed:', err.message));

        res.status(201).json({ message: 'Job posted! Waiting for admin approval.', job: { ...job, likes: 0 } });
    } catch (error) {
        console.error('Post job error:', error);
        res.status(500).json({ error: 'Failed to post job: ' + error.message });
    }
});

// ==================== GET ALL JOBS (public feed: approved only) ====================
router.get('/', async (req, res) => {
    try {
        const jobs = await db.getApprovedJobs();
        const likeCounts = await db.countLikesByJob();

        const jobsWithLikes = jobs.map(job => ({
            ...job,
            likes: likeCounts[job.id] || 0
        }));

        res.json({ jobs: jobsWithLikes });
    } catch (error) {
        console.error('Get jobs error:', error);
        res.status(500).json({ error: 'Failed to fetch jobs: ' + error.message });
    }
});

// ==================== GET PENDING JOBS (admin moderation queue) ====================
router.get('/pending', async (req, res) => {
    try {
        const pendingJobs = await db.getPendingJobs();
        res.json({ jobs: pendingJobs });
    } catch (error) {
        console.error('Get pending jobs error:', error);
        res.status(500).json({ error: 'Failed to fetch pending jobs: ' + error.message });
    }
});

// ==================== APPROVE A JOB POST ====================
router.post('/approve/:jobId', async (req, res) => {
    try {
        const { jobId } = req.params;
        const job = await db.approveJob(jobId);

        if (!job) {
            return res.status(404).json({ error: 'Job not found' });
        }

        res.json({ message: 'Job approved and is now visible to everyone!', job });
    } catch (error) {
        console.error('Approve job error:', error);
        res.status(500).json({ error: 'Failed to approve job: ' + error.message });
    }
});

// ==================== REJECT A JOB POST ====================
router.post('/reject/:jobId', async (req, res) => {
    try {
        const { jobId } = req.params;
        const job = await db.rejectJob(jobId);

        if (!job) {
            return res.status(404).json({ error: 'Job not found' });
        }

        res.json({ message: 'Job rejected.', job });
    } catch (error) {
        console.error('Reject job error:', error);
        res.status(500).json({ error: 'Failed to reject job: ' + error.message });
    }
});

// ==================== GET CLIENT'S JOBS ====================
router.get('/client/:clientId', async (req, res) => {
    try {
        const { clientId } = req.params;
        const jobs = await db.getClientJobs(clientId);
        const likeCounts = await db.countLikesByJob();

        const clientJobs = jobs.map(job => ({
            ...job,
            likes: likeCounts[job.id] || 0
        }));

        res.json({ jobs: clientJobs });
    } catch (error) {
        console.error('Get client jobs error:', error);
        res.status(500).json({ error: 'Failed to fetch client jobs: ' + error.message });
    }
});

// ==================== LIKE / UNLIKE A JOB ====================
router.post('/like', async (req, res) => {
    try {
        const { jobId, userId } = req.body;

        if (!jobId || !userId) {
            return res.status(400).json({ error: 'Job ID and User ID are required' });
        }

        const { liked, likes } = await db.toggleLike(jobId, userId);

        res.json({
            message: liked ? 'Job liked!' : 'Job unliked!',
            liked,
            likes
        });
    } catch (error) {
        console.error('Like toggle error:', error);
        res.status(500).json({ error: 'Failed to toggle like: ' + error.message });
    }
});

// ==================== CHECK IF USER LIKED A JOB ====================
router.get('/liked/:jobId/:userId', async (req, res) => {
    try {
        const { jobId, userId } = req.params;
        const liked = await db.isLiked(jobId, userId);
        const likes = await db.countLikesForJob(jobId);

        res.json({ liked, likes });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// ==================== DELETE A JOB ====================
router.delete('/:jobId/:clientId', async (req, res) => {
    try {
        const { jobId, clientId } = req.params;
        const job = await db.deleteJob(jobId, clientId);

        if (!job) {
            return res.status(404).json({ error: 'Job not found or unauthorized' });
        }

        res.json({ message: 'Job deleted successfully' });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

module.exports = router;
