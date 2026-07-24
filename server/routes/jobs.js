const express = require('express');
const router = express.Router();
const { v4: uuidv4 } = require('uuid');

const localStorage = require('../services/localStorage');
const appsScript = require('../services/appsScript');

// ==================== POST A JOB ====================
router.post('/', (req, res) => {
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
            likes: 0,
            status: 'pending',
            postedAt: new Date().toISOString()
        };

        // Save to local storage
        const jobs = localStorage.readData('jobs');
        jobs.push(job);
        localStorage.writeData('jobs', jobs);

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

        res.status(201).json({ message: 'Job posted! Waiting for admin approval.', job });
    } catch (error) {
        console.error('Post job error:', error);
        res.status(500).json({ error: 'Failed to post job: ' + error.message });
    }
});

// ==================== GET ALL JOBS (public feed: approved only) ====================
router.get('/', (req, res) => {
    try {
        const jobs = localStorage.readData('jobs');
        const likes = localStorage.readData('likes');

        // Only approved jobs are visible in the public feed
        const jobsWithLikes = jobs
            .filter(job => job.status === 'approved')
            .map(job => ({
                ...job,
                likes: likes.filter(l => l.jobId === job.id).length
            }));

        // Sort by newest first
        jobsWithLikes.sort((a, b) => new Date(b.postedAt) - new Date(a.postedAt));

        res.json({ jobs: jobsWithLikes });
    } catch (error) {
        console.error('Get jobs error:', error);
        res.status(500).json({ error: 'Failed to fetch jobs: ' + error.message });
    }
});

// ==================== GET PENDING JOBS (admin moderation queue) ====================
router.get('/pending', (req, res) => {
    try {
        const jobs = localStorage.readData('jobs');

        const pendingJobs = jobs
            .filter(job => job.status === 'pending')
            .sort((a, b) => new Date(a.postedAt) - new Date(b.postedAt));

        res.json({ jobs: pendingJobs });
    } catch (error) {
        console.error('Get pending jobs error:', error);
        res.status(500).json({ error: 'Failed to fetch pending jobs: ' + error.message });
    }
});

// ==================== APPROVE A JOB POST ====================
router.post('/approve/:jobId', (req, res) => {
    try {
        const { jobId } = req.params;
        const jobs = localStorage.readData('jobs');
        const jobIndex = jobs.findIndex(j => j.id === jobId);

        if (jobIndex === -1) {
            return res.status(404).json({ error: 'Job not found' });
        }

        jobs[jobIndex].status = 'approved';
        localStorage.writeData('jobs', jobs);

        res.json({ message: 'Job approved and is now visible to everyone!', job: jobs[jobIndex] });
    } catch (error) {
        console.error('Approve job error:', error);
        res.status(500).json({ error: 'Failed to approve job: ' + error.message });
    }
});

// ==================== REJECT A JOB POST ====================
router.post('/reject/:jobId', (req, res) => {
    try {
        const { jobId } = req.params;
        const jobs = localStorage.readData('jobs');
        const jobIndex = jobs.findIndex(j => j.id === jobId);

        if (jobIndex === -1) {
            return res.status(404).json({ error: 'Job not found' });
        }

        jobs[jobIndex].status = 'rejected';
        localStorage.writeData('jobs', jobs);

        res.json({ message: 'Job rejected.', job: jobs[jobIndex] });
    } catch (error) {
        console.error('Reject job error:', error);
        res.status(500).json({ error: 'Failed to reject job: ' + error.message });
    }
});

// ==================== GET CLIENT'S JOBS ====================
router.get('/client/:clientId', (req, res) => {
    try {
        const { clientId } = req.params;
        const jobs = localStorage.readData('jobs');
        const likes = localStorage.readData('likes');

        const clientJobs = jobs
            .filter(j => j.clientId === clientId)
            .map(job => ({
                ...job,
                likes: likes.filter(l => l.jobId === job.id).length
            }))
            .sort((a, b) => new Date(b.postedAt) - new Date(a.postedAt));

        res.json({ jobs: clientJobs });
    } catch (error) {
        console.error('Get client jobs error:', error);
        res.status(500).json({ error: 'Failed to fetch client jobs: ' + error.message });
    }
});

// ==================== LIKE / UNLIKE A JOB ====================
router.post('/like', (req, res) => {
    try {
        const { jobId, userId } = req.body;

        if (!jobId || !userId) {
            return res.status(400).json({ error: 'Job ID and User ID are required' });
        }

        const likes = localStorage.readData('likes');
        const existingLikeIndex = likes.findIndex(
            l => l.jobId === jobId && l.userId === userId
        );

        let liked = true;
        if (existingLikeIndex > -1) {
            // Unlike
            likes.splice(existingLikeIndex, 1);
            liked = false;
        } else {
            // Like
            likes.push({
                jobId,
                userId,
                likedAt: new Date().toISOString()
            });
        }

        localStorage.writeData('likes', likes);

        const likeCount = likes.filter(l => l.jobId === jobId).length;

        res.json({
            message: liked ? 'Job liked!' : 'Job unliked!',
            liked,
            likes: likeCount
        });
    } catch (error) {
        console.error('Like toggle error:', error);
        res.status(500).json({ error: 'Failed to toggle like: ' + error.message });
    }
});

// ==================== CHECK IF USER LIKED A JOB ====================
router.get('/liked/:jobId/:userId', (req, res) => {
    try {
        const { jobId, userId } = req.params;
        const likes = localStorage.readData('likes');
        const liked = likes.some(l => l.jobId === jobId && l.userId === userId);
        const likeCount = likes.filter(l => l.jobId === jobId).length;

        res.json({ liked, likes: likeCount });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// ==================== DELETE A JOB ====================
router.delete('/:jobId/:clientId', (req, res) => {
    try {
        const { jobId, clientId } = req.params;
        let jobs = localStorage.readData('jobs');

        const jobIndex = jobs.findIndex(j => j.id === jobId && j.clientId === clientId);
        if (jobIndex === -1) {
            return res.status(404).json({ error: 'Job not found or unauthorized' });
        }

        jobs.splice(jobIndex, 1);
        localStorage.writeData('jobs', jobs);

        res.json({ message: 'Job deleted successfully' });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

module.exports = router;