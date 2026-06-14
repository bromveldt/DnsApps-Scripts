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
import Path from 'path';

import { toCacheFilename } from './cache-file-utils.js';
import { loadPage } from './page-loader.js';
import { inspectPage } from './page-parser.js';

const url = 'https://github.com/FiloSottile/mkcert/releases';
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

// https://github.com/FiloSottile/mkcert/releases/download/v1.4.4/mkcert-v1.4.4-windows-amd64.exe


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
    await page.goto(url, {
      waitUntil: "networkidle",
    });
    fs.writeFileSync(cacheFilePath, await page.content());
  }
}

/**
 * Scrapes the Playwright Page content:
 * Looks up various elements
 * @param {import('playwright').Page} page 
 * @returns 
 */
async function scrapePageContent(page) {
  console.log('Scraping... ' + page.url());
  await page.content().then(html => {
    console.log('HTML content length: ' + html.length);
  }).catch(error => {
    console.error('Error getting HTML content: ' + error.message);
  }).finally(() => {
    console.log('Done getting HTML content');
  });

  try {
    //let applicationMain0 = await page.waitForSelector('div.application-main');
    //console.log('applicationMain ' + applicationMain0.innerHTML());
    console.log('applicationMain');
    let applicationMain = page.locator('xpath=//div[@class="application-main"]//main[1]');
    console.log('applicationMain ' + await applicationMain.innerHTML());
    //const main = applicationMain.locator('xpath=//main');
    let turboFrame = applicationMain.locator('xpath=//turbo-frame[@id="repo-content-turbo-frame"]');
    console.log('turboFrame ' + await turboFrame.innerHTML());
    //console.log('turboFrame html ' + turboFrame.getHTML());
    let repoContent = turboFrame.locator('xpath=//div[@class="repository-content"]');
    console.log('repoContent ' + repoContent.length);
    let div = repoContent.locator('xpath=//div[data-turbo-frame="repo-content-turbo-frame"]');
    console.log('div ' + div.length);
    if (isDefined(div)) {
      let link = div.locator('xpath=/a[@class="Link"]');
      console.log('--- link ' + link.length);
      if (isDefined(link)) {
        // Get release version
        let versionSpan = link.locator('xpath=/div[@data-view-component="true"]/span');
        console.log('--- versionSpan ' + await versionSpan.innerHTML());
        let versionSpanText = await versionSpan.textContent();
        console.log('--- versionSpanText ' + versionSpanText);
        // Get release date out of element <relative-time datetime="2022-04-26T17:51:05Z">s
        let datetimeEl = div.locator('xpath=/preceding-sibling::div/relative-time[datetime]]');
        console.log('--- datetimeEl ' + datetimeEl.length);
        let datetimeText = await datetimeEl.getAttribute('datetime');
        console.log('--- datetimeText ' + datetimeText.length);

        console.log('Scraped OK... ');
        return new Map()
          .set("version", versionSpanText)
          .set("datetime", datetimeText);
      }
    }
  } catch (error) {
    console.error(`Error parsing file: ${error.message}`);
  }
  console.log('Scraped... ');
  return new Map()
    .set("version", "n/a")
    .set("datetime", "n/a");
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
  const outfile = toCacheFilename(location);
  console.log('--- releasesUri=' + releasesUri);
  console.log('---      outfile=' + outfile);

  const outputFilePath = asPath(outfile);
  const isFile = await pathExists(outputFilePath);
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
    await readFile(outputFilePath, page);
  } else {
    console.log('Not saving the HTML');
  }

  console.log('--- Getting Info from page');
  const info = await scrapePageContent(page);
  console.log('--- Info: ' + info);
  for (const a of info) {
    console.log('Info kv:', a);
  }
}
await browser.close();
console.log('--- Done ---');

