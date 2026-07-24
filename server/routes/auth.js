const express = require('express');
const router = express.Router();
const bcrypt = require('bcryptjs');
const { v4: uuidv4 } = require('uuid');

const localStorage = require('../services/localStorage');
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
        const developers = localStorage.readData('developers');
        const existingDev = developers.find(d => d.phone === phone || d.email === email);
        if (existingDev) {
            return res.status(400).json({ error: 'Phone number or email already registered' });
        }

        // Hash password
        const hashedPassword = await bcrypt.hash(password, SALT_ROUNDS);

        const id = uuidv4();
        const developer = {
            id,
            role: 'developer',
            name,
            email,
            phone,
            image: image || null,
            jobID: jobID || null,
            nid: nid || null,
            password: hashedPassword,
            approved: false,
            registeredAt: new Date().toISOString()
        };

        // Save images locally
        const localImage = image ? localStorage.saveBase64Image(image, id, 'photo') : null;
        const localJobID = jobID ? localStorage.saveBase64Image(jobID, id, 'jobid') : null;
        const localNID = nid ? localStorage.saveBase64Image(nid, id, 'nid') : null;

        const developerToSave = {
            ...developer,
            image: localImage || image,
            jobID: localJobID || jobID,
            nid: localNID || nid
        };

        // Save to local storage
        developers.push(developerToSave);
        localStorage.writeData('developers', developers);

        // Add to approvals
        const approvals = localStorage.readData('approvals');
        approvals.push({
            id: developerToSave.id,
            type: 'developer',
            name: developerToSave.name,
            email: developerToSave.email,
            phone: developerToSave.phone,
            status: 'pending',
            createdAt: new Date().toISOString()
        });
        localStorage.writeData('approvals', approvals);

        // Sync to Drive folder + Sheet via Apps Script (non-blocking)
        try {
            await appsScript.registerDeveloper({
                name: developerToSave.name,
                email: developerToSave.email,
                phone: developerToSave.phone,
                image,
                jobID,
                nid
            });
        } catch (syncError) {
            console.error('Apps Script sync failed (non-blocking):', syncError.message);
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
        const clients = localStorage.readData('clients');
        const existingClient = clients.find(c => c.phone === phone || c.email === email);
        if (existingClient) {
            return res.status(400).json({ error: 'Phone number or email already registered' });
        }

        // Hash password
        const hashedPassword = await bcrypt.hash(password, SALT_ROUNDS);

        const id = uuidv4();
        const client = {
            id,
            role: 'client',
            name,
            email,
            phone,
            image: image || null,
            password: hashedPassword,
            approved: false,
            registeredAt: new Date().toISOString()
        };

        // Save images locally
        const localImage = image ? localStorage.saveBase64Image(image, id, 'photo') : null;

        const clientToSave = {
            ...client,
            image: localImage || image
        };

        // Save to local storage
        clients.push(clientToSave);
        localStorage.writeData('clients', clients);

        // Add to approvals
        const approvals = localStorage.readData('approvals');
        approvals.push({
            id: clientToSave.id,
            type: 'client',
            name: clientToSave.name,
            email: clientToSave.email,
            phone: clientToSave.phone,
            status: 'pending',
            createdAt: new Date().toISOString()
        });
        localStorage.writeData('approvals', approvals);

        // Sync to Drive folder + Sheet via Apps Script (non-blocking)
        try {
            await appsScript.registerClient({
                name: clientToSave.name,
                email: clientToSave.email,
                phone: clientToSave.phone,
                image
            });
        } catch (syncError) {
            console.error('Apps Script sync failed (non-blocking):', syncError.message);
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

        let users;
        let user = null;

        if (!role || role === 'developer') {
            users = localStorage.readData('developers');
            user = users.find(d => d.phone === phone);
        }

        if (!user && (!role || role === 'client')) {
            users = localStorage.readData('clients');
            user = users.find(c => c.phone === phone);
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
        const developers = localStorage.readData('developers');
        const clients = localStorage.readData('clients');

        let user = developers.find(d => d.email === email);
        let userType = 'developer';

        if (!user) {
            user = clients.find(c => c.email === email);
            userType = 'client';
        }

        if (!user) {
            return res.status(404).json({ error: 'Email not found in our system.' });
        }

        // Generate reset code
        const resetCode = Math.random().toString(36).substring(2, 8).toUpperCase();
        const expiresAt = new Date(Date.now() + 15 * 60 * 1000).toISOString(); // 15 minutes

        // Store reset code
        const resetCodes = localStorage.readData('resetCodes');
        resetCodes.push({
            email,
            code: resetCode,
            expiresAt,
            used: false,
            createdAt: new Date().toISOString()
        });
        localStorage.writeData('resetCodes', resetCodes);

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
        const resetCodes = localStorage.readData('resetCodes');
        const resetEntry = resetCodes.find(
            r => r.email === email && r.code === code && !r.used
        );

        if (!resetEntry) {
            return res.status(400).json({ error: 'Invalid or expired reset code' });
        }

        if (new Date(resetEntry.expiresAt) < new Date()) {
            return res.status(400).json({ error: 'Reset code has expired' });
        }

        // Mark code as used
        resetEntry.used = true;
        localStorage.writeData('resetCodes', resetCodes);

        // Update password
        const hashedPassword = await bcrypt.hash(newPassword, SALT_ROUNDS);

        const developers = localStorage.readData('developers');
        const devIndex = developers.findIndex(d => d.email === email);
        if (devIndex > -1) {
            developers[devIndex].password = hashedPassword;
            localStorage.writeData('developers', developers);
        }

        const clients = localStorage.readData('clients');
        const clientIndex = clients.findIndex(c => c.email === email);
        if (clientIndex > -1) {
            clients[clientIndex].password = hashedPassword;
            localStorage.writeData('clients', clients);
        }

        res.json({ message: 'Password has been reset successfully. You can now login.' });
    } catch (error) {
        console.error('Reset password error:', error);
        res.status(500).json({ error: 'Failed to reset password: ' + error.message });
    }
});

// ==================== GET USER PROFILE ====================
router.get('/profile/:id', (req, res) => {
    try {
        const { id } = req.params;

        const developers = localStorage.readData('developers');
        const dev = developers.find(d => d.id === id);
        if (dev) {
            const { password, ...safeUser } = dev;
            return res.json({ user: safeUser });
        }

        const clients = localStorage.readData('clients');
        const client = clients.find(c => c.id === id);
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