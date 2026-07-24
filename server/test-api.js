// Quick test script for the API
const http = require('http');

const API_HOST = 'localhost';
const API_PORT = 5000;

function apiRequest(endpoint, method = 'GET', body = null) {
    return new Promise((resolve, reject) => {
        const options = {
            hostname: API_HOST,
            port: API_PORT,
            path: endpoint,
            method: method,
            headers: {
                'Content-Type': 'application/json'
            }
        };

        const req = http.request(options, (res) => {
            let data = '';
            res.on('data', chunk => data += chunk);
            res.on('end', () => {
                try {
                    const json = JSON.parse(data);
                    resolve({ status: res.statusCode, data: json });
                } catch (e) {
                    resolve({ status: res.statusCode, data: data });
                }
            });
        });

        req.on('error', (error) => {
            reject(error);
        });

        if (body) {
            req.write(JSON.stringify(body));
        }
        req.end();
    });
}

async function runTests() {
    console.log('=== Testing JobPortal API ===\n');

    // Test 1: Health check
    try {
        const health = await apiRequest('/api/health');
        console.log(`✅ Health Check: Status ${health.status}`);
        console.log(`   ${JSON.stringify(health.data)}\n`);
    } catch (e) {
        console.log(`❌ Health Check: ${e.message}\n`);
        console.log('⚠️  Server not running. Start with: cd server && node index.js');
        process.exit(1);
    }

    // Test 2: Register developer
    try {
        const devData = {
            name: 'Test Developer',
            email: 'dev@example.com',
            phone: '01711111111',
            password: 'password123',
            confirmPassword: 'password123'
        };
        const reg = await apiRequest('/api/auth/register/developer', 'POST', devData);
        console.log(`✅ Register Developer: Status ${reg.status}`);
        console.log(`   ${reg.data.message}`);
        console.log(`   User ID: ${reg.data.user.id}\n`);
    } catch (e) {
        console.log(`❌ Register Developer: ${e.message}\n`);
    }

    // Test 3: Register client
    try {
        const clientData = {
            name: 'Test Client',
            email: 'client@example.com',
            phone: '01722222222',
            password: 'password123',
            confirmPassword: 'password123'
        };
        const reg = await apiRequest('/api/auth/register/client', 'POST', clientData);
        console.log(`✅ Register Client: Status ${reg.status}`);
        console.log(`   ${reg.data.message}`);
        const clientId = reg.data.user.id;

        // Test 4: Login client
        const login = await apiRequest('/api/auth/login', 'POST', { 
            phone: '01722222222', 
            password: 'password123',
            role: 'client' 
        });
        console.log(`✅ Client Login: Status ${login.status}`);
        console.log(`   ${login.data.message}\n`);

        // Test 5: Post job (will fail since client isn't approved)
        console.log(`ℹ️  Note: Login will be blocked until admin approves.`);

    } catch (e) {
        console.log(`❌ Client Registration: ${e.message}\n`);
    }

    // Test 6: Admin check
    try {
        const adminLogin = await apiRequest('/api/auth/login', 'POST', { 
            phone: 'admin', 
            password: 'admin123' 
        });
        console.log(`✅ Admin Login: Status ${adminLogin.status}`);
        console.log(`   ${adminLogin.data.message}\n`);

        // Test 7: Get pending approvals
        const approvals = await apiRequest('/api/admin/approvals');
        console.log(`✅ Pending Approvals: Status ${approvals.status}`);
        console.log(`   ${approvals.data.approvals.length} pending approvals\n`);

        // Test 8: Stats
        const stats = await apiRequest('/api/admin/stats');
        console.log(`✅ Admin Stats: Status ${stats.status}`);
        console.log(`   ${JSON.stringify(stats.data.stats, null, 2)}\n`);

    } catch (e) {
        console.log(`❌ Admin: ${e.message}\n`);
    }

    console.log('=== Tests Complete ===');
}

runTests();