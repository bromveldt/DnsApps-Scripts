/* Scrape GitHub locations looking for updates 
 * via Playwright (uses locator API)

 * Playwright needs to be installed in npx and the project:
 * npm install playwright
 * npx playwright install chromium
 * npm init -y
 * npm install playwright
 * 
 * Usage: <scriptname> [-gethtml | -usehtml]
 * See `const usageDetails` below
 * Author: brusam
 */
import { chromium } from 'playwright';
import { text } from 'node:stream/consumers';
import fs from 'fs';
import Path from 'path';

/**
 * Strings to display as a usage help
 */
const usageDetails = [
  // The first line will be inserted before printing the whole bunch
  'The two arguments may but should not be used together',
  '-usehtml should be used once -gethtml has executed and the file is present',
  'However, if the file is not present, the HTML content will be downloaded and saved into that file.',
  'It should be sufficient to only use -usehtml to download and read a local content file when testing.'
];

/**
 * Specify if ge need to get the page HTML to use in a test case for this script.
 * Returns a string with the leafname of the script inserted in it
 * @param {Array} array 
 */
function toUsageText(scriptPath) {
  return 'Usage: ' + Path.basename(scriptPath) + ' [-? | -gethtml | -usehtml]';
}
/**
 * Returns `true` if one of the script args is '-?'
 * @param {Array} array 
 */
function isQMark(array) {
  // There are always at least 2 arguments in process.argv
  console.log('array=' + array);
  return array.some(s => s === '-?');
}
/**
 * If we get a '-?' print the usage message and exit
 */
if (isQMark(process.argv)) {
  usageDetails.unshift(toUsageText(process.argv[1]));
  usageDetails.forEach((line) => console.log(line));
  process.exit(0);
}

/** ====================
 *  Otherwise on we go
 *  ====================
 */

/**
 * Looks for '-gethtml' in the array of arguments
 * @param {Array} array 
 * @returns `true` if one of the script args is '-?'
 */
function isGetHTML(array) {
  if (array.length === 2) return false;
  console.log('array=' + array);
  //files_.filter(s => s.includes(find)) 
  return array.some(s => s === '-gethtml');
}
/**
 * Looks for '-usehtml' in the array of arguments
 * @param {Array} array 
 * @returns `true` if one of the script args is '-?'
 */
function isUseHTML(array) {
  if (array.length === 2) return false;
  return array.some(s => s === '-usehtml');
}
/**
 * Checks if a value is undefined
 * @param {*} v 
 * @returns `true` if a value is undefined, `false` otherwise
 */
function isUndefined(v) {
  return typeof v == 'undefined' || v == null;
}
/**
 * Checks if a value is defined
 * @param {*} v 
 * @returns `true` if a value is defined, `false` otherwise
 */
function isDefined(v) {
  return !isUndefined(v);
}
/**
 * Construct a name for a file the HTML will be saved to, based in the `location`
 * @param {String} location 
 * @returns a leafname of the output file, e.g. /4test_mkcert.htm
 */
function toFilename(location) {
  let chunks = location.split('/');
  let name = chunks.pop() || chunks.pop();  // handle potential trailing slash

  console.log('Output filename=' + name);
  return `4test_${name}.htm`;
}
function accessLocation(location) { // DELETE
// https://github.com/FiloSottile/mkcert/releases/download/v1.4.4/mkcert-v1.4.4-windows-amd64.exe
}
/**
 * Verify if a path exists
 * Is this really way better than fs.existsSync? I'm not so sure.
 * @param {string} path 
 * @returns 
 */
async function pathExists(filePath) {
  return await fs.promises.access(filePath, fs.constants.F_OK)
    .then(() => true)
    .catch(() => false)
}
/**
 * Delete a filePath
 * @param {String} filePath 
 */
async function deleteFile(filePath) {
  await fs.unlink(filePath, err => {
    if (err) {
      console.error(err);
    } else {
      // File deleted successfully
      console.log('Cool! Unlinked ' + filePath);
    }
  });
}
/**
 * Dumps the html as a write stream to a file
 * @param {string} filePath 
 * @param {import('playwright').Page} page 
 * @returns 
 */
async function writeFile(filePath, page) {
  try {
    const html = await page.content();
    console.log(`Saving to file ${filePath}`);
    const ws = fs.createWriteStream(filePath, err => {
      if (err) {
        console.error(err);
        return false;
      }
      console.log('Cool! Wrote to ' + filePath);
      return true;
    });
    ws.end(html);
  } catch (error) {
    console.error('Error retrieving content from Page:');
    console.error(error);
    return false;
  }
}
/**
 * Convert file contents to a Page object
 * @param {fs.ReadStream} filePath 
 * @returns a Page
 */
async function readFile(filePath) {
  try {
    const html = await text(fs.createReadStream(filePath));
    await page.setContent(html);
    console.log('Done reading the file');
    return content;
  } catch (error) {
    console.error(`Error reading file: ${error.message}`);
    return null;
  }
}
/**
 * If a local copy is available, do not access the remote URL
 * @param {import('playwright').Page} page 
 * @param {string} url 
 * @param {string} cacheFilePath
 */
async function getPage(page, url, cacheFilePath) {
  if (fs.existsSync(cacheFilePath)) {
    await page.setContent(fs.readFileSync(cacheFilePath, 'utf-8'));
  } else {
    await page.goto(url);
    fs.writeFileSync(cacheFile, await page.content());
  }
}
/**
 * Scrapes the Playwright Page content:
 * Looks up various elements
 * @param {import('playwright').Page} page 
 * @returns 
 */
function scrapePageContent(page) {
  let applicationMain = page.locator('xpath=//div[@class="application-main"]//main[1]');
  //const main = applicationMain.locator('xpath=//main');
  let turboFrame = applicationMain.locator('xpath=//turbo-frame[@id="repo-content-turbo-frame"]');
  let repoContent = turboFrame.locator('xpath=//div[@class="repository-content"]');

  let div = repoContent.locator('xpath=//div[data-turbo-frame="repo-content-turbo-frame"]');
  if (isDefined(div)) {
    let link = div.locator('xpath=/a[@class="Link"]');
    link.
      if(isDefined(link)) {
      // Get release version
      let versionSpan = link.locator('xpath=/div[@data-view-component="true"]/span');
      let versionSpanText = await versionSpan.textContent();
      console.log('--- versionSpanText ' + versionSpanText);
      // Get release date out of element <relative-time datetime="2022-04-26T17:51:05Z">s
      let datetimeEl = div.locator('xpath=/preceding-sibling::div/relative-time[datetime]]');
      let datetimeText = await datetimeEl.getAttribute('datetime');
      console.log('--- datetimeText ' + datetimeText);

      return { "version": versionSpanText, "datetime": datetimeText };
    }

    return { "version": "n/a", "datetimeEl": "n/a" };
  }
}
/**
 * Define some constants
 */
const items = [
  "https://github.com/FiloSottile/mkcert",
  "https://github.com/DNSCrypt/dnscrypt-proxy",
  "cherry",
];
// Add more from above later and delete `items`
const locations = ["https://github.com/FiloSottile/mkcert"];

/*
  const dataViewComponentText = dataViewComponent.textContent();
  console.log('------------------');
  console.log(dataViewComponentText);
  */
const useHTML = isUseHTML(process.argv);
const getHTML = isGetHTML(process.argv);
console.log('useHTML?' + useHTML);
console.log('getHTML?' + getHTML);


const browser = await chromium.launch();
//locations.forEach(accessLocation, page);
for (const location of locations) {
  const tagsDest = location + '/tags';
  const releasesUri = location + '/releases';
  const outfile = toFilename(location);
  console.log('--- releasesUri=' + releasesUri);
  console.log('---      outfile=' + outfile);

  const outputFilePath = Path.join(process.cwd(), outfile);
  const isFile = pathExists(outputFilePath);
  console.log(`outputFilePath ${outputFilePath}? ${isFile}`);

  const page = await browser.newPage();
  /**
   * With getHTML the output file may exist or not.
   * If it exists, it will be deleted.
   */
  if (getHTML || useHTML && !isFile) {
    // Retrieve the Chromium-interpreted HTML
    await page.goto(releasesUri, {
      waitUntil: "networkidle",
    });
    if (isDefined(html)) {
      console.log('HTML defined');
      if (getHTML && isFile) { // Delete the file
        console.log('Deleting existing file ' + outputFilePath);
        await deleteFile(outputFilePath);
        console.log('Does file exist? ' + fileExists(outputFilePath));
      }
      await writeFile(outputFilePath, page);
    } else {
      console.log('HTML not defined');
    }
  } else if (useHTML && isFile) {
    console.log('Okay, got useHTML && isFile');
    // Read from file and set page content
    await readFile(outputFilePath);
  } else {
    console.log('Not saving the HTML');
  }
  console.log('--- Getting Info from page');
  const info = scrapePageContent(page);
  console.log('--- Info: ' + info);
  for (const [key, value] of info) {
    console.log('Info kv:', key, value);
  }
}
await browser.close();
console.log('--- Done ---');

