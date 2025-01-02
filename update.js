const axios = require('axios');
const fs = require('fs-extra');
const path = require('path');
const execSync = require('child_process').execSync;


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

async function getLatestCommitSha() {
  try {
    const response = await axios.get(`${REPO_URL}/commits/${MAIN_BRANCH}`);
    return response.data.commit.tree.sha;
  } catch (error) {
    console.error('Failed to get the latest commit SHA:', error.message);
    return null;
  }
}

async function getChangedFiles(sha) {
  try {
    const response = await axios.get(`${REPO_URL}/git/trees/${sha}?recursive=1`);
    return response.data.tree;
  } catch (error) {
    console.error('Failed to get changed files:', error.message);
    return [];
  }
}

async function backupFile(filePath, version) {
  const relativePath = path.relative(PROJECT_PATH, filePath);
  const backupDir = path.join(BACKUP_PATH, version, path.dirname(relativePath));

  await fs.ensureDir(backupDir);
  const backupFilePath = path.join(backupDir, path.basename(filePath));
  await fs.copy(filePath, backupFilePath);
}

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

  console.log(`Backing up current version: ${currentVersion || 'initial'}...`);
  for (const file of changedFiles) {
    if (file.type === 'blob') {
      const localPath = path.join(PROJECT_PATH, file.path);
      if (fs.existsSync(localPath)) {
        console.log(`Backing up: ${localPath}`);
        await backupFile(localPath, currentVersion || 'initial');
      }
    }
  }

  console.log('Updating files...');
  for (const file of changedFiles) {
    if (file.type === 'blob') {
      const localPath = path.join(PROJECT_PATH, file.path);
      const rawUrl = `https://raw.githubusercontent.com/xnil6x404/Telebot-v1/${MAIN_BRANCH}/${file.path}`;

      console.log(`Updating file: ${file.path}`);
      await fs.ensureDir(path.dirname(localPath));
      await updateFile(localPath, rawUrl);
    }
  }

  console.log('Saving new version...');
  fs.writeFileSync(versionFile, latestSha);

  console.log('Project updated successfully!');
}

updateProject().catch((error) => {
  console.error('Something went wrong during the update process:', error.message);
});