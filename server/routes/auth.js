const express = require('express');
const router = express.Router();
const bcrypt = require('bcryptjs');
const { v4: uuidv4 } = require('uuid');

const db = require('../services/db');
const appsScript = require('../services/appsScript');
const emailService = require('../services/email');

const SALT_ROUNDS = 10;

// ==================== DEVELOPER REGISTRATION ====================
router.post('/register/developer', async (req, res) => {
    try {
        const { name, email, phone, password, confirmPassword, image, jobID, nid } = req.body;

        // Validation
        if (!name || !email || !phone || !password || !confirmPassword) {
            return res.status(400).json({ error: 'All required fields must be filled' });
        }

        if (password !== confirmPassword) {
            return res.status(400).json({ error: 'Passwords do not match' });
        }

        if (password.length < 6) {
            return res.status(400).json({ error: 'Password must be at least 6 characters' });
        }

        // Check if phone or email already exists
        const existingDev = await db.findDeveloperByPhoneOrEmail(phone, email);
        if (existingDev) {
            return res.status(400).json({ error: 'Phone number or email already registered' });
        }

        // Hash password
        const hashedPassword = await bcrypt.hash(password, SALT_ROUNDS);

        const id = uuidv4();
        const registeredAt = new Date().toISOString();
        const developerToSave = {
            id,
            name,
            email,
            phone,
            image: image || null,
            jobID: jobID || null,
            nid: nid || null,
            password: hashedPassword,
            approved: false,
            registeredAt,
        };

        // Save to database (images stored as their original data URLs)
        await db.insertDeveloper(developerToSave);

        // Add to approvals
        await db.addApproval({
            id: developerToSave.id,
            type: 'developer',
            name: developerToSave.name,
            email: developerToSave.email,
            phone: developerToSave.phone,
            status: 'pending',
            createdAt: registeredAt,
        });

        // Sync to Drive folder + Sheet via Apps Script (non-blocking)
        try {
            const syncResult = await appsScript.registerDeveloper({
                name: developerToSave.name,
                email: developerToSave.email,
                phone: developerToSave.phone,
                image,
                jobID,
                nid
            });
            console.log('Apps Script sync OK (developer):', JSON.stringify(syncResult));
        } catch (syncError) {
            console.error('Apps Script sync FAILED (developer, non-blocking):', syncError.message);
        }

        res.status(201).json({
            message: 'Registration successful! Please wait for admin approval.',
            user: {
                id: developerToSave.id,
                name: developerToSave.name,
                email: developerToSave.email,
                phone: developerToSave.phone,
                role: 'developer',
                approved: false
            }
        });
    } catch (error) {
        console.error('Developer registration error:', error);
        res.status(500).json({ error: 'Registration failed: ' + error.message });
    }
});

// ==================== CLIENT REGISTRATION ====================
router.post('/register/client', async (req, res) => {
    try {
        const { name, email, phone, password, confirmPassword, image } = req.body;

        // Validation
        if (!name || !email || !phone || !password || !confirmPassword) {
            return res.status(400).json({ error: 'All required fields must be filled' });
        }

        if (password !== confirmPassword) {
            return res.status(400).json({ error: 'Passwords do not match' });
        }

        if (password.length < 6) {
            return res.status(400).json({ error: 'Password must be at least 6 characters' });
        }

        // Check if phone or email already exists
        const existingClient = await db.findClientByPhoneOrEmail(phone, email);
        if (existingClient) {
            return res.status(400).json({ error: 'Phone number or email already registered' });
        }

        // Hash password
        const hashedPassword = await bcrypt.hash(password, SALT_ROUNDS);

        const id = uuidv4();
        const registeredAt = new Date().toISOString();
        const clientToSave = {
            id,
            name,
            email,
            phone,
            image: image || null,
            password: hashedPassword,
            approved: false,
            registeredAt,
        };

        // Save to database
        await db.insertClient(clientToSave);

        // Add to approvals
        await db.addApproval({
            id: clientToSave.id,
            type: 'client',
            name: clientToSave.name,
            email: clientToSave.email,
            phone: clientToSave.phone,
            status: 'pending',
            createdAt: registeredAt,
        });

        // Sync to Drive folder + Sheet via Apps Script (non-blocking)
        try {
            const syncResult = await appsScript.registerClient({
                name: clientToSave.name,
                email: clientToSave.email,
                phone: clientToSave.phone,
                image
            });
            console.log('Apps Script sync OK (client):', JSON.stringify(syncResult));
        } catch (syncError) {
            console.error('Apps Script sync FAILED (client, non-blocking):', syncError.message);
        }

        res.status(201).json({
            message: 'Registration successful! Please wait for admin approval.',
            user: {
                id: clientToSave.id,
                name: clientToSave.name,
                email: clientToSave.email,
                phone: clientToSave.phone,
                role: 'client',
                approved: false
            }
        });
    } catch (error) {
        console.error('Client registration error:', error);
        res.status(500).json({ error: 'Registration failed: ' + error.message });
    }
});

// ==================== LOGIN ====================
router.post('/login', async (req, res) => {
    try {
        const { phone, password, role } = req.body;

        if (!phone || !password) {
            return res.status(400).json({ error: 'Phone number and password are required' });
        }

        // Check admin login
        if (phone === 'admin' && password === 'admin123') {
            return res.json({
                message: 'Admin login successful',
                user: {
                    id: 'admin',
                    role: 'admin',
                    name: 'Admin'
                }
            });
        }

        let user = null;

        if (!role || role === 'developer') {
            user = await db.findDeveloperByPhone(phone);
        }

        if (!user && (!role || role === 'client')) {
            user = await db.findClientByPhone(phone);
        }

        if (!user) {
            return res.status(401).json({ error: 'Invalid phone number or password' });
        }

        // Verify password
        const passwordValid = await bcrypt.compare(password, user.password);
        if (!passwordValid) {
            return res.status(401).json({ error: 'Invalid phone number or password' });
        }

        if (!user.approved) {
            return res.status(403).json({ error: 'Your account is waiting for admin approval.' });
        }

        res.json({
            message: 'Login successful',
            user: {
                id: user.id,
                name: user.name,
                email: user.email,
                phone: user.phone,
                role: user.role,
                image: user.image,
                approved: user.approved
            }
        });
    } catch (error) {
        console.error('Login error:', error);
        res.status(500).json({ error: 'Login failed: ' + error.message });
    }
});

// ==================== FORGOT PASSWORD ====================
router.post('/forgot-password', async (req, res) => {
    try {
        const { email } = req.body;

        if (!email) {
            return res.status(400).json({ error: 'Email is required' });
        }

        // Search for user in both developers and clients
        let user = await db.findDeveloperByEmail(email);

        if (!user) {
            user = await db.findClientByEmail(email);
        }

        if (!user) {
            return res.status(404).json({ error: 'Email not found in our system.' });
        }

        // Generate reset code
        const resetCode = Math.random().toString(36).substring(2, 8).toUpperCase();
        const expiresAt = new Date(Date.now() + 15 * 60 * 1000).toISOString(); // 15 minutes

        // Store reset code
        await db.addResetCode({
            email,
            code: resetCode,
            expiresAt,
            used: false,
            createdAt: new Date().toISOString(),
        });

        // Send email with reset code
        const emailResult = await emailService.sendResetCode(email, user.name, resetCode);

        if (emailResult.success) {
            res.json({
                message: 'Password reset code has been sent to your email.',
                code: resetCode // In production, remove this. It's here for fallback testing.
            });
        } else {
            res.json({
                message: `Password reset code sent via console (email not configured). Code: ${resetCode}`,
                code: resetCode,
                note: 'In production, this would be sent via email. For now, use the code above.'
            });
        }
    } catch (error) {
        console.error('Forgot password error:', error);
        res.status(500).json({ error: 'Failed to process request: ' + error.message });
    }
});

// ==================== RESET PASSWORD ====================
router.post('/reset-password', async (req, res) => {
    try {
        const { email, code, newPassword, confirmPassword } = req.body;

        if (!email || !code || !newPassword || !confirmPassword) {
            return res.status(400).json({ error: 'All fields are required' });
        }

        if (newPassword !== confirmPassword) {
            return res.status(400).json({ error: 'Passwords do not match' });
        }

        if (newPassword.length < 6) {
            return res.status(400).json({ error: 'Password must be at least 6 characters' });
        }

        // Verify reset code
        const resetEntry = await db.findValidResetCode(email, code);

        if (!resetEntry) {
            return res.status(400).json({ error: 'Invalid or expired reset code' });
        }

        if (new Date(resetEntry.expiresAt) < new Date()) {
            return res.status(400).json({ error: 'Reset code has expired' });
        }

        // Mark code as used
        await db.markResetCodeUsed(resetEntry.id);

        // Update password
        const hashedPassword = await bcrypt.hash(newPassword, SALT_ROUNDS);

        const dev = await db.findDeveloperByEmail(email);
        if (dev) {
            await db.updateDeveloperPassword(email, hashedPassword);
        }

        const client = await db.findClientByEmail(email);
        if (client) {
            await db.updateClientPassword(email, hashedPassword);
        }

        res.json({ message: 'Password has been reset successfully. You can now login.' });
    } catch (error) {
        console.error('Reset password error:', error);
        res.status(500).json({ error: 'Failed to reset password: ' + error.message });
    }
});

// ==================== GET USER PROFILE ====================
router.get('/profile/:id', async (req, res) => {
    try {
        const { id } = req.params;

        const dev = await db.findDeveloperById(id);
        if (dev) {
            const { password, ...safeUser } = dev;
            return res.json({ user: safeUser });
        }

        const client = await db.findClientById(id);
        if (client) {
            const { password, ...safeUser } = client;
            return res.json({ user: safeUser });
        }

        res.status(404).json({ error: 'User not found' });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

module.exports = router;
