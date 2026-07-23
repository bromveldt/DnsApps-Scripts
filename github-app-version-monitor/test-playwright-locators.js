import { chromium } from 'playwright';
import { expect } from 'playwright/test';
import { fileURLToPath } from 'url';
import fs from 'fs';
import Path from 'path';
import { propertiesReader } from 'properties-reader';

import {toCacheFilename, toPrevRunFilename, asPath, countDiff, toTreeFilename} from './cache-file-utils.js';
import { loadPage, loadPrevResFromPath } from './page-loader.js';
import {inspectPage, inspectTreePage} from './page-parser.js';

// ---- Define constants ----
//const property = properties.get('some.property.name');

// lazily evaluated nested object path
//const property = properties.path().some?.property?.name;

// flatten all properties into an object
//const obj = Object.from(properties.entries())
//const property = obj['some.property.name'];

//const __dirname = Path.dirname(fileURLToPath(import.meta.url));
const props = propertiesReader({
  sourceFile: 'prop.toml'
});
const cacheFilepath = asPath(toCacheFilename('mkcert'));
const prevRunResultFilepath = asPath(toPrevRunFilename('mkcert'));
const ghHostUrl = 'https://github.com';
const url = ghHostUrl + '/FiloSottile/mkcert/releases';


console.log('props  test  :', props['test']);
console.log('cacheFilepath:', cacheFilepath);

// Read in the results of the previous run
console.log('prevRunResultFilepath:', prevRunResultFilepath);
let prevRes = await loadPrevResFromPath(prevRunResultFilepath);
console.log('Past readFile method callback - prevRes:', prevRes);

// ---- Start

const browser = await chromium.launch({
  // Circumvent the GitHub bot-detection issue that is likely in play since browser.newPage() is still used (no user agent set yet).
  args: ['--disable-blink-features=AutomationControlled'],
});
const context = await browser.newContext({
  userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/125.0.0.0 Safari/537.36',
  viewport: { width: 1280, height: 900 },
});
const page = await context.newPage();

await loadPage(page, url, cacheFilepath);
const currRes = await inspectPage(page); // page-parser.js - this is where we test the locators in isolation and print out counts and some content for debugging

console.log('Final currRes:', currRes);

expect(currRes.error).toBeNull();
expect(currRes.version).toMatch(/^v\d+\.\d+\.\d+$/);
expect(currRes.href).toMatch(/^\/FiloSottile\/mkcert\/tree\/v\d+\.\d+\.\d+$/);
expect(currRes.href).toContain(currRes.version);

// Test hack
// Pretend the value was different at the time of the last run
// Comment out to test the atime and mtime setting on prevRunResultFilepath
if (prevRes['version'] !== '1.4.3') {
  prevRes['version'] = 'v1.4.3';
}

let countResDiff = await countDiff(prevRes, currRes);
console.log('countDiff ', countDiff);

if (countResDiff === 0) {
  // Get the current datetime to pass to fs.utimes as atime and mtime values
  if (fs.existsSync(prevRunResultFilepath)) {
    const lastModified = (await fs.stat(prevRunResultFilepath)).mtime;
    console.log('lastModified:', lastModified);

    let now = new Date();
    // Update the file timestamp - so we know when the script last ran -
    // but do not write the same content to the file
    // atime and mtime argument values can be either
    // numbers representing Unix epoch time in seconds, Dates, or a numeric string like '123456789.0'.
    fs.utimes(prevRunResultFilepath, now, now, err => {
      if (err) {
        console.error(err);
        return false;
      }
      console.log('Cool! utimes ', filePath);
      return true;
    });
  }
} else {
  console.log('Have found some differences');
  // href : /FiloSottile/mkcert/tree/v1.4.4
  const treeUrl = ghHostUrl + currRes['href'];
  console.log('       treeUrl:', treeUrl);
  const treeFilepath = asPath(toTreeFilename('mkcert'));
  console.log(' treeFilpath:', treeFilepath);
  const treePage = await context.newPage();
  await loadPage(treePage, treeUrl, treeFilepath, err => {
    console.error('Tree loadPage err:', err);
  });
  await inspectTreePage(treePage)
      .then(script => {
        console.log('SCRIPT type:', typeof script);
        console.log('call:', Object.prototype.toString.call(script));
        console.log('SCRIPT html:', JSON.stringify(script));
      });
}