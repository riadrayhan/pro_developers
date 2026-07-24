/**
 * JobPortal — Google Apps Script Web App
 *
 * Deploy this as a Web App (see README.md in this folder) to store client
 * and developer data in a Google Sheet, with each person's uploaded files
 * (photo, Job ID card, NID card) saved into their own Drive folder — no
 * server or service-account key required, since it runs as your own
 * Google account.
 *
 * Writes directly into the specific Drive folder and Spreadsheet below
 * (rather than auto-creating new ones) so data always lands in the exact
 * place you're already looking at. The account that deploys this script
 * must own — or have edit access to — both.
 *
 * Folder layout inside ROOT_FOLDER_ID:
 *   Developers/<name> (<id>)/Photos, /Job ID Cards, /NID Cards
 *   Clients/<name> (<id>)/Photos
 *
 * Sheet layout inside SPREADSHEET_ID:
 *   Developers, Clients, Jobs, Approvals
 */

// https://drive.google.com/drive/folders/1w7tx-1AVb7lvaweVtjfD5ke-aG8qlpEC
const ROOT_FOLDER_ID = '1w7tx-1AVb7lvaweVtjfD5ke-aG8qlpEC';
// https://docs.google.com/spreadsheets/d/1Gw06MF5APAgiQJ2cP1f_8-BVu7tbTfoZna1mQQvFszE
const SPREADSHEET_ID = '1Gw06MF5APAgiQJ2cP1f_8-BVu7tbTfoZna1mQQvFszE';

const SHEETS = {
  DEVELOPERS: 'Developers',
  CLIENTS: 'Clients',
  JOBS: 'Jobs',
  APPROVALS: 'Approvals',
};

// ==================== ENTRY POINTS ====================

function doPost(e) {
  try {
    const body = JSON.parse(e.postData.contents);
    let result;

    switch (body.action) {
      case 'registerDeveloper':
        result = registerDeveloper(body);
        break;
      case 'registerClient':
        result = registerClient(body);
        break;
      case 'postJob':
        result = postJob(body);
        break;
      case 'approveUser':
        result = approveUser(body);
        break;
      default:
        throw new Error('Unknown action: ' + body.action);
    }

    return jsonResponse({ success: true, data: result });
  } catch (err) {
    return jsonResponse({ success: false, error: err.message });
  }
}

function doGet() {
  return jsonResponse({ status: 'ok', message: 'JobPortal Apps Script is running' });
}

// ==================== ACTIONS ====================

function registerDeveloper(data) {
  const id = Utilities.getUuid();
  const registeredAt = new Date().toISOString();
  const folder = getUserFolder('developer', data.name, id);

  const photoUrl = saveBase64File(folder, 'Photos', data.image, 'profile');
  const jobIdUrl = saveBase64File(folder, 'Job ID Cards', data.jobID, 'job-id');
  const nidUrl = saveBase64File(folder, 'NID Cards', data.nid, 'nid');

  const sheet = getOrCreateSheet(SHEETS.DEVELOPERS, [
    'ID', 'Name', 'Email', 'Phone', 'Approved', 'Registered At', 'Photo', 'Job ID Card', 'NID Card', 'Folder',
  ]);
  sheet.appendRow([id, data.name, data.email, data.phone, false, registeredAt, photoUrl, jobIdUrl, nidUrl, folder.getUrl()]);

  addApproval(id, data.name, 'developer', data.email, data.phone, registeredAt);

  return { id, folderUrl: folder.getUrl() };
}

function registerClient(data) {
  const id = Utilities.getUuid();
  const registeredAt = new Date().toISOString();
  const folder = getUserFolder('client', data.name, id);

  const logoUrl = saveBase64File(folder, 'Photos', data.image, 'logo');

  const sheet = getOrCreateSheet(SHEETS.CLIENTS, [
    'ID', 'Name', 'Email', 'Phone', 'Approved', 'Registered At', 'Logo', 'Folder',
  ]);
  sheet.appendRow([id, data.name, data.email, data.phone, false, registeredAt, logoUrl, folder.getUrl()]);

  addApproval(id, data.name, 'client', data.email, data.phone, registeredAt);

  return { id, folderUrl: folder.getUrl() };
}

function postJob(data) {
  const id = Utilities.getUuid();
  const postedAt = new Date().toISOString();

  const sheet = getOrCreateSheet(SHEETS.JOBS, [
    'Job ID', 'Client ID', 'Client Name', 'Title', 'Description', 'Phone', 'Budget', 'Duration', 'Posted At',
  ]);
  sheet.appendRow([id, data.clientId, data.clientName, data.title, data.details, data.phone, data.budget, data.duration || '', postedAt]);

  return { id };
}

function approveUser(data) {
  const sheetName = data.type === 'developer' ? SHEETS.DEVELOPERS : SHEETS.CLIENTS;
  setColumnById(sheetName, data.id, 'Approved', true);
  setColumnById(SHEETS.APPROVALS, data.id, 'Status', data.status || 'approved');
  return { id: data.id, status: data.status || 'approved' };
}

// ==================== DRIVE HELPERS ====================

function getRootFolder() {
  return DriveApp.getFolderById(ROOT_FOLDER_ID);
}

function getOrCreateSubfolder(parent, name) {
  const folders = parent.getFoldersByName(name);
  return folders.hasNext() ? folders.next() : parent.createFolder(name);
}

function getUserFolder(role, name, id) {
  const root = getRootFolder();
  const typeFolder = getOrCreateSubfolder(root, role === 'developer' ? 'Developers' : 'Clients');
  const userFolder = getOrCreateSubfolder(typeFolder, `${name} (${id})`);
  const subfolders = role === 'developer' ? ['Photos', 'Job ID Cards', 'NID Cards'] : ['Photos'];
  subfolders.forEach((sub) => getOrCreateSubfolder(userFolder, sub));
  return userFolder;
}

/** Decodes a data:URL or raw base64 string and saves it into folder/subfolderName. */
function saveBase64File(folder, subfolderName, base64Data, fileNamePrefix) {
  if (!base64Data) return '';

  const match = base64Data.match(/^data:([A-Za-z0-9+/.-]+);base64,(.+)$/);
  const mimeType = match ? match[1] : 'image/png';
  const dataPart = match ? match[2] : base64Data;
  const ext = mimeType.split('/')[1] || 'png';

  const blob = Utilities.newBlob(Utilities.base64Decode(dataPart), mimeType, `${fileNamePrefix}.${ext}`);
  const subfolder = getOrCreateSubfolder(folder, subfolderName);
  return subfolder.createFile(blob).getUrl();
}

// ==================== SHEET HELPERS ====================

function getSpreadsheet() {
  return SpreadsheetApp.openById(SPREADSHEET_ID);
}

function getOrCreateSheet(name, headers) {
  const ss = getSpreadsheet();
  let sheet = ss.getSheetByName(name);
  if (!sheet) {
    sheet = ss.insertSheet(name);
    sheet.appendRow(headers);
    sheet.setFrozenRows(1);
  }
  return sheet;
}

function addApproval(id, name, type, email, phone, createdAt) {
  const sheet = getOrCreateSheet(SHEETS.APPROVALS, ['ID', 'Name', 'Type', 'Email', 'Phone', 'Status', 'Created At']);
  sheet.appendRow([id, name, type, email, phone, 'pending', createdAt]);
}

/** Finds the row where column "ID" equals id, and overwrites the given column's value. */
function setColumnById(sheetName, id, columnName, value) {
  const ss = getSpreadsheet();
  const sheet = ss.getSheetByName(sheetName);
  if (!sheet) return;

  const values = sheet.getDataRange().getValues();
  const headers = values[0];
  const idCol = headers.indexOf('ID');
  const targetCol = headers.indexOf(columnName);
  if (idCol === -1 || targetCol === -1) return;

  for (let row = 1; row < values.length; row++) {
    if (values[row][idCol] === id) {
      sheet.getRange(row + 1, targetCol + 1).setValue(value);
      break;
    }
  }
}

// ==================== RESPONSE HELPER ====================

function jsonResponse(obj) {
  return ContentService.createTextOutput(JSON.stringify(obj)).setMimeType(ContentService.MimeType.JSON);
}
