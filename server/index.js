const express = require('express');
const cors = require('cors');
const path = require('path');
const fs = require('fs-extra');

// Load environment variables from .env file
try {
    const envPath = path.join(__dirname, '.env');
    if (fs.existsSync(envPath)) {
        const envContent = fs.readFileSync(envPath, 'utf8');
        envContent.split('\n').forEach(line => {
            const trimmed = line.trim();
            if (trimmed && !trimmed.startsWith('#')) {
                const eqIndex = trimmed.indexOf('=');
                if (eqIndex > 0) {
                    const key = trimmed.substring(0, eqIndex).trim();
                    const value = trimmed.substring(eqIndex + 1).trim();
                    if (!process.env[key]) {
                        process.env[key] = value;
                    }
                }
            }
        });
        console.log('✅ Environment variables loaded');
    } else {
        console.log('⚠️ No .env file found. Using default settings.');
    }
} catch (e) {
    console.log('⚠️ Could not load .env file:', e.message);
}

const emailService = require('./services/email');
const localStorage = require('./services/localStorage');

const authRoutes = require('./routes/auth');
const jobsRoutes = require('./routes/jobs');
const adminRoutes = require('./routes/admin');

const app = express();
const PORT = process.env.PORT || 5000;

// Middleware
app.use(cors({
    origin: '*',
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH'],
    allowedHeaders: ['Content-Type', 'Authorization']
}));
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ extended: true, limit: '50mb' }));

// Ensure storage directories exist
localStorage.ensureDataDir();

// Initialize services
console.log('\n=== Initializing Services ===');
const appsScriptReady = Boolean(process.env.APPS_SCRIPT_URL);
console.log(appsScriptReady
    ? '✅ Apps Script URL configured (Drive/Sheets sync enabled)'
    : '⚠️ APPS_SCRIPT_URL not set — Drive/Sheets sync disabled');
const emailReady = emailService.initEmail();
console.log('==============================\n');

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/jobs', jobsRoutes);
app.use('/api/admin', adminRoutes);

// Health check
app.get('/api/health', (req, res) => {
    res.json({ 
        status: 'ok', 
        timestamp: new Date().toISOString(),
        services: {
            appsScript: appsScriptReady ? 'configured' : 'not configured',
            email: emailReady ? 'connected' : 'not configured'
        }
    });
});

// Serve uploaded files
app.use('/uploads', express.static(path.join(__dirname, 'storage', 'uploads')));

// Serve frontend static files (public/index.html)
const publicPath = path.join(__dirname, '..', 'public');
app.use(express.static(publicPath));

// Fallback: serve index.html for any unmatched route (SPA support)
app.get('*', (req, res) => {
    // Don't catch API routes
    if (req.path.startsWith('/api/')) {
        return res.status(404).json({ error: 'API endpoint not found' });
    }
    res.sendFile(path.join(publicPath, 'index.html'));
});

// Error handling middleware
app.use((err, req, res, next) => {
    console.error('Server Error:', err);
    res.status(500).json({ error: err.message || 'Internal server error' });
});

app.listen(PORT, () => {
    console.log(`\n================================================`);
    console.log(`  🚀 JobPortal Server is running!`);
    console.log(`  🌐 API: http://localhost:${PORT}/api`);
    console.log(`  ❤️  Health: http://localhost:${PORT}/api/health`);
    console.log(`================================================\n`);
});
