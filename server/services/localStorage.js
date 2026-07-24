const fs = require('fs-extra');
const path = require('path');

const DATA_DIR = path.join(__dirname, '..', 'storage', 'data');
const UPLOAD_DIR = path.join(__dirname, '..', 'storage', 'uploads');

/**
 * Ensure data directory exists
 */
function ensureDataDir() {
    fs.ensureDirSync(DATA_DIR);
    fs.ensureDirSync(UPLOAD_DIR);
}

/**
 * Read data from a JSON file
 */
function readData(filename) {
    const filePath = path.join(DATA_DIR, `${filename}.json`);
    if (fs.existsSync(filePath)) {
        try {
            return JSON.parse(fs.readFileSync(filePath, 'utf8'));
        } catch (error) {
            console.error(`Error reading ${filename}.json:`, error.message);
            return [];
        }
    }
    return [];
}

/**
 * Write data to a JSON file
 */
function writeData(filename, data) {
    const filePath = path.join(DATA_DIR, `${filename}.json`);
    fs.writeFileSync(filePath, JSON.stringify(data, null, 2), 'utf8');
}

/**
 * Save a base64 image to local storage and return the URL
 */
function saveBase64Image(base64Data, userId, type) {
    if (!base64Data) return null;

    const userDir = path.join(UPLOAD_DIR, userId);
    fs.ensureDirSync(userDir);

    // Extract mime type and data
    const matches = base64Data.match(/^data:([A-Za-z-+\/]+);base64,(.+)$/);
    let buffer;
    let ext = 'png';

    if (matches && matches.length === 3) {
        const mimeType = matches[1];
        buffer = Buffer.from(matches[2], 'base64');
        ext = mimeType.split('/')[1] || 'png';
    } else {
        buffer = Buffer.from(base64Data, 'base64');
    }

    const fileName = `${type}_${Date.now()}.${ext}`;
    const filePath = path.join(userDir, fileName);
    fs.writeFileSync(filePath, buffer);

    return `/uploads/${userId}/${fileName}`;
}

/**
 * Delete a file from local storage
 */
function deleteFile(fileUrl) {
    if (!fileUrl) return;
    const filePath = path.join(__dirname, '..', 'storage', fileUrl);
    if (fs.existsSync(filePath)) {
        fs.unlinkSync(filePath);
    }
}

/**
 * Reset all data (for testing)
 */
function resetAllData() {
    const files = ['developers', 'clients', 'jobs', 'likes', 'approvals', 'resetCodes'];
    files.forEach(file => {
        const filePath = path.join(DATA_DIR, `${file}.json`);
        if (fs.existsSync(filePath)) {
            fs.writeFileSync(filePath, '[]', 'utf8');
        }
    });
}

module.exports = {
    ensureDataDir,
    readData,
    writeData,
    saveBase64Image,
    deleteFile,
    resetAllData
};