import { execSync } from 'child_process';
import { existsSync, mkdirSync, writeFileSync } from 'fs';
import { join } from 'path';

const NERDFONTS_RELEASE = 'https://api.github.com/repos/ryanoasis/nerd-fonts/releases/latest';
const DOWNLOAD_LOCATION = 'static/fonts/';
const ARCHIVE_NAME = 'CascadiaCode.tar.xz';
const EXIT_SUCCESS = 0;
const FONT_NAME = 'CaskaydiaCoveNerdFontMono-Regular.ttf';

type MockGitHubAPI = {
	assets: {
		name: string;
		browser_download_url: string;
	}[];
};

async function downloadFont() {
	const TARGET_PATH = join(DOWNLOAD_LOCATION, ARCHIVE_NAME);
	if (existsSync(TARGET_PATH)) {
		console.info('Font archive already downloaded, exiting...');
		process.exit(EXIT_SUCCESS);
	}
	console.info('Fetching latest Nerd Font release...');

	const releaseResponse = await fetch(NERDFONTS_RELEASE);
	if (!releaseResponse.ok)
		throw Error(`Could not fetch Nerd Fonts! Response status: ${releaseResponse.status}`);

	const releaseData: MockGitHubAPI = await releaseResponse.json();
	const releaseAsset = releaseData.assets.find((a) => a.name === ARCHIVE_NAME);
	if (!releaseAsset)
		throw Error(`Could not find font archive '${ARCHIVE_NAME}' in latest release assets!`);

	console.info(`Downloading font archive '${ARCHIVE_NAME}' from latest release assets...`);
	const downloadUrl = releaseAsset.browser_download_url;
	const fontResponse = await fetch(downloadUrl);
	if (!fontResponse.ok)
		throw Error(`Could not download requested font! Response status: ${fontResponse.status}`);

	// Create static fonts folder, if not exists
	if (!existsSync(DOWNLOAD_LOCATION)) mkdirSync(DOWNLOAD_LOCATION, { recursive: true });

	// Get archive as byte buffer from API
	const fontArchive = await fontResponse.arrayBuffer();

	// Write buffer to file
	writeFileSync(TARGET_PATH, Buffer.from(fontArchive));

	console.info(`Unpacking font archive into directory '${DOWNLOAD_LOCATION}'...`);
	execSync(`tar -xJf ${TARGET_PATH} -C ${DOWNLOAD_LOCATION}`);

	const FONT_PATH = join(DOWNLOAD_LOCATION, FONT_NAME);
	if (!existsSync(FONT_PATH))
		throw Error(`Could not find font file! Searching for: '${FONT_PATH}'`);

	console.info('Successfully installed font!');
}

downloadFont();
