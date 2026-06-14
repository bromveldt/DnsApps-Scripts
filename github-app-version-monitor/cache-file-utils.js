import { fileURLToPath } from 'url';
import Path from 'path';

const __dirname = Path.dirname(fileURLToPath(import.meta.url));
//const cacheReleaseFile = Path.join(__dirname, '4test_mkcert.htm');
//const cacheDownloadFile = Path.join(__dirname, '4test_mkcert_latest.htm');

export function asPath(cacheFilePath) {
    console.log('asPath __dirname=' + __dirname);
    return Path.join(__dirname, cacheFilePath);
}
/**
 * Construct a name for a file the HTML will be saved to, based in the `location`, e.g. mkcert
 * @param {String} location 
 * @returns a leafname of the output file, e.g. /4test_mkcert.htm
 */
export function toCacheFilename(location) {
    let chunks = location.split('/');
    let name = chunks.pop() || chunks.pop();  // handle potential trailing slash

    console.log('toCacheFilepath:', name);
    return `4test_${name}.htm`;
}
export function toPrevRunFilename(location) {
    let chunks = location.split('/');
    let name = chunks.pop() || chunks.pop();  // handle potential trailing slash
    console.log('toPrevRunFilename:', name);
    return `prev_run_${name}.json`;
}
// Not needed
export function toPrevRunFilepath(location) {
    console.log('toPrevRunFilepath location:', location);
    let name = toPrevRunFilename(location);
    console.log('toPrevRunFilepath name:', name);
    return asPath(filename);
}

/**
 * Verify if a path exists
 * Is this really way better than fs.existsSync? I'm not so sure.
 * @param {string} path 
 * @returns 
 */
export async function pathExists(filePath) {
    return await fs.promises.access(filePath, fs.constants.F_OK)
        .then(() => true)
        .catch(() => false)
}
export async function countDiff(prevRes, currRes) {
    console.log('Now    | currRes:', currRes);
    console.log('Before | prevRes:', prevRes);
    let count = 0;
    Object.keys(prevRes).forEach(function (key) {
        // It is easier to spot the differences if you print one value underneath another
        console.log('countDiff prev key:', key);
        console.log('countDiff prev   val:', prevRes[key]);
        console.log('countDiff curr   val:', currRes[key]);
        if (prevRes[key] !== currRes[key]) count++;
    });
    console.log('countDiff count:', count);
    return count;
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
 * Convert file contents to a Page object
 * @param {fs.ReadStream} filePath 
 * @returns a Page
 */
export async function readFile(filePath, page) {
    try {
        const html = await text(fs.createReadStream(filePath));
        await page.setContent(html);
        console.log('Done reading the file as page');
        return true;
    } catch (error) {
        console.error(`Error reading file: ${error.message}`);
        return false;
    }
}

export async function readFromFile(filePath) {
    try {
        const rs = fs.createReadStream(filePath);
        rs.re
        console.log('Done reading the file as page');
        return true;
    } catch (error) {
        console.error(`Error reading file: ${error.message}`);
        return false;
    }
}
/**
 * Dumps the html as a write stream to a file
 * @param {string} filePath 
 * @param {import('playwright').Page} page 
 * @returns 
 */
export async function writeFile(filePath, page) {
    try {
        const html = await page.content();
        writeToFile(html, filePath);
    } catch (error) {
        console.error('Error retrieving content from Page:');
        console.error(error);
        return false;
    }
}

/**
 * Dumps the html as a write stream to a file
 * @param {string} str
 * @param {string} filePath 
 * @returns 
 */
export async function writeToFile(str, filePath) {
    try {
        console.log('Saving to file:', filePath);
        const ws = fs.createWriteStream(filePath, err => {
            if (err) {
                console.error(err);
                return false;
            }
            console.log('Cool! Wrote to ' + filePath);
            return true;
        });
        ws.end(str);
    } catch (error) {
        console.error('Error retrieving content from Page:');
        console.error(error);
        return false;
    }
}