import fs from 'fs';

export async function loadPage(page, url, cacheFilePath) {
  if (fs.existsSync(cacheFilePath)) {
    await page.setContent(fs.readFileSync(cacheFilePath, 'utf-8'), {
      waitUntil: 'domcontentloaded'
    });
  } else {
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