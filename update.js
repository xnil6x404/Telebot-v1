const axios = require('axios');
const fs = require('fs-extra');
const path = require('path');
const execSync = require('child_process').execSync;

// Ensure necessary packages are installed
function ensurePackageInstalled(packageName) {
  try {
    require.resolve(packageName);
  } catch (e) {
    console.log(`Installing missing package: ${packageName}`);
    execSync(`npm install ${packageName}`, { stdio: 'inherit' });
  }
}
ensurePackageInstalled('axios');
ensurePackageInstalled('fs-extra');

const REPO_URL = 'https://api.github.com/repos/xnil6x404/Telebot-v1';
const MAIN_BRANCH = 'main';

const PROJECT_PATH = path.resolve(__dirname);
const BACKUP_PATH = path.resolve(__dirname, 'backup');

// Fetch the latest commit SHA
async function getLatestCommitSha() {
  try {
    const response = await axios.get(`${REPO_URL}/commits/${MAIN_BRANCH}`);
    return response.data.commit.tree.sha;
  } catch (error) {
    console.error('Failed to get the latest commit SHA:', error.message);
    return null;
  }
}

// Get list of changed files
async function getChangedFiles(sha) {
  try {
    const response = await axios.get(`${REPO_URL}/git/trees/${sha}?recursive=1`);
    return response.data.tree;
  } catch (error) {
    console.error('Failed to get changed files:', error.message);
    return [];
  }
}

// Backup a specific file
async function backupFile(filePath, version) {
  const relativePath = path.relative(PROJECT_PATH, filePath);
  const backupDir = path.join(BACKUP_PATH, version, path.dirname(relativePath));

  await fs.ensureDir(backupDir);
  const backupFilePath = path.join(backupDir, path.basename(filePath));
  await fs.copy(filePath, backupFilePath);
}

// Update a specific file
async function updateFile(filePath, rawUrl) {
  try {
    const response = await axios.get(rawUrl, { responseType: 'stream' });
    const writer = fs.createWriteStream(filePath);

    response.data.pipe(writer);

    return new Promise((resolve, reject) => {
      writer.on('finish', resolve);
      writer.on('error', reject);
    });
  } catch (error) {
    console.error(`Failed to update ${filePath}:`, error.message);
  }
}

// Update only changed or new files
async function updateChangedFiles(changedFiles, currentVersion) {
  console.log('Updating only changed or new files...');

  for (const file of changedFiles) {
    if (file.type === 'blob') {
      const localPath = path.join(PROJECT_PATH, file.path);
      const rawUrl = `https://raw.githubusercontent.com/xnil6x404/Telebot-v1/${MAIN_BRANCH}/${file.path}`;

      // Check if the file exists locally
      if (fs.existsSync(localPath)) {
        const localContent = fs.readFileSync(localPath, 'utf-8');
        try {
          const response = await axios.get(rawUrl);
          const remoteContent = response.data;

          // Compare file content
          if (localContent === remoteContent) {
            console.log(`No changes in: ${file.path}`);
            continue; // Skip unchanged files
          } else {
            console.log(`File changed: ${file.path}`);
            await backupFile(localPath, currentVersion || 'initial'); // Backup the file
          }
        } catch (error) {
          console.error(`Failed to fetch remote content for ${file.path}:`, error.message);
          continue;
        }
      } else {
        console.log(`New file detected: ${file.path}`);
      }

      console.log(`Updating file: ${file.path}`);
      await fs.ensureDir(path.dirname(localPath));
      await updateFile(localPath, rawUrl);
    }
  }
}

// Main update function
async function updateProject() {
  console.log('Checking for updates...');

  const latestSha = await getLatestCommitSha();
  if (!latestSha) return;

  const versionFile = path.join(PROJECT_PATH, 'version.txt');
  let currentVersion = '';

  if (fs.existsSync(versionFile)) {
    currentVersion = fs.readFileSync(versionFile, 'utf-8').trim();
  }

  console.log('Current Version:', currentVersion);
  console.log('Latest SHA:', latestSha);

  if (currentVersion === latestSha) {
    console.log('Your project is already up to date.');
    return;
  }

  console.log('Fetching changes from GitHub...');
  const changedFiles = await getChangedFiles(latestSha);

  console.log(`Backing up and updating files from version: ${currentVersion || 'initial'}...`);
  await updateChangedFiles(changedFiles, currentVersion);

  console.log('Saving new version...');
  fs.writeFileSync(versionFile, latestSha);

  console.log('Project updated successfully!');
}

// Execute the update process
updateProject().catch((error) => {
  console.error('Something went wrong during the update process:', error.message);
});
