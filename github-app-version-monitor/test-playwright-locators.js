import { chromium } from 'playwright';
import { expect } from 'playwright/test';
import { fileURLToPath } from 'url';
import fs from 'fs';
import Path from 'path';

import { toCacheFilename, toPrevRunFilename, asPath, pathExists, countDiff } from './cache-file-utils.js';
import { loadPage } from './page-loader.js';
import { inspectPage } from './page-parser.js';

// ---- Define constants ----

const __dirname = Path.dirname(fileURLToPath(import.meta.url));
const cacheReleaseFilepath = asPath(toCacheFilename('mkcert'));
const prevRunResultFilepath = asPath(toPrevRunFilename('mkcert'));
const url = 'https://github.com/FiloSottile/mkcert/releases';
// /FiloSottile/mkcert/tree/v1.4.4


console.log('cacheReleaseFilepath:', cacheReleaseFilepath);
console.log('prevRunResultFilepath:', prevRunResultFilepath);

// Read in the results of the previous run
let prevRes = '';
fs.readFile(prevRunResultFilepath, 'utf-8', (err, data) => {
  console.log('JSON data present in the file:', data);

  if (typeof data === 'undefined') {
    console.log('No previously obtained results found');
    // Init dummy object to pass to function inspectPage
    prevRes = { version: 'v0.0.1', releaseDate: '1.1.1970', releaseDateText: 'yesterday', href: '/', error: null }
  } else {
    prevRes = JSON.parse(data);
    console.log('Read in previously obtained results as json:', prevRes);
  }
});
console.log('Exited readFile method callback - prevRes:', prevRes);

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

await loadPage(page, url, cacheReleaseFilepath); // page-loader.js
const currRes = await inspectPage(page, prevRes); // page-parser.js - this is where we test the locators in isolation and print out counts and some content for debugging

console.log('Final currRes:', currRes);
await browser.close();

expect(currRes.error).toBeNull();
expect(currRes.version).toMatch(/^v\d+\.\d+\.\d+$/);
expect(currRes.href).toMatch(/^\/FiloSottile\/mkcert\/tree\/v\d+\.\d+\.\d+$/);
expect(currRes.href).toContain(currRes.version);

// Pretend the value was different at the time of the last run
// Comment out to test the atime and mtime setting on prevRunResultFilepath 
prevRes['version'] = '1.4.3';

if (countDiff(prevRes, currRes) === 0) {
  //const lastModified = (await fs.stat(prevRunResultFilepath)).mtime;
  //console.log('lastModified:', lastModified);

  // Get the current datetime to pass to fs.utimes as atime and mtime values
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
    console.log('Cool! utimes ' + filePath);
    return true;
  });
} else {
  // TODO: Save the data and offer to download the last installation zip file
}
