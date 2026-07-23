import fs from 'fs';
import { pathExists } from "./cache-file-utils.js";

export async function loadPage(page, url, cacheFilePath) {
  if (fs.existsSync(cacheFilePath)) {
    console.log('Loading from file', cacheFilePath);
    await page.setContent(fs.readFileSync(cacheFilePath, 'utf-8'), {
      waitUntil: 'domcontentloaded'
    });
  } else {
    console.log('Loading from URL', page);
    await page.goto(url, { waitUntil: 'load' });
    const html = await page.content();
    checkContent(html);
    fs.writeFileSync(cacheFilePath, html);
  }
}
// Light checks to STDOUT to confirm we got the expected page content before caching it
// The page content will be saved regardless
function checkContent(rawHtml) {
  console.log('Raw HTML length:', rawHtml.length);
  for (let includeStr of ['Box-row', 'section']) {
    console.log(`Contains "${includeStr}":`, rawHtml.includes(includeStr));
  }
}
// Sync read
export async function loadPrevResFromPath(filepath) {
  //let prevRes = '';
  if (pathExists(filepath)) {
    await fs.readFile(filepath, 'utf-8', (err, data) => {
      if (err) {
        console.log('err:', err);
      } else {
        console.log('JSON data present in the file:', data);

        if (typeof data === 'undefined') {
          console.log('No previously obtained results found; making a dummy object');
          // Init dummy object to pass to function inspectPage
        } else {
          let prevRes = JSON.parse(data);
          console.log('Read in previously obtained results as json:', prevRes);
          return prevRes;
        }
      }
    });
  } else {
    console.log('Path does not exist:', filepath);
  }
  return { version: 'v0.0.1', releaseDate: '1.1.1970', releaseDateText: 'yesterday', href: '/', error: null };
}