/**
 * Client for the deployed Google Apps Script web app (server/apps-script/Code.gs).
 * Replaces the old service-account-based googleDrive.js/googleSheets.js —
 * the Apps Script itself creates the per-user Drive folder, saves uploaded
 * files, and writes to the "JobPortal Data" spreadsheet.
 */

async function callAppsScript(action, payload) {
    const url = process.env.APPS_SCRIPT_URL;
    if (!url) {
        throw new Error('APPS_SCRIPT_URL not configured');
    }

    const response = await fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'text/plain;charset=utf-8' },
        body: JSON.stringify({ action, ...payload }),
    });

    const result = await response.json();
    if (!result.success) {
        throw new Error(result.error || 'Apps Script returned an error');
    }
    return result.data;
}

function registerDeveloper({ name, email, phone, image, jobID, nid }) {
    return callAppsScript('registerDeveloper', { name, email, phone, image, jobID, nid });
}

function registerClient({ name, email, phone, image }) {
    return callAppsScript('registerClient', { name, email, phone, image });
}

function postJob({ clientId, clientName, title, details, phone, budget, duration }) {
    return callAppsScript('postJob', { clientId, clientName, title, details, phone, budget, duration });
}

function approveUser(id, type, status) {
    return callAppsScript('approveUser', { id, type, status });
}

module.exports = { registerDeveloper, registerClient, postJob, approveUser };
