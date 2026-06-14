import assert from 'assert';
import { loadPage } from './page-loader.js';

export async function inspectPage(page,
    // Dummy result object to satisfy the return type of this function, which will eventually be used to return the extracted version info. The actual values will be replaced with the real extracted data once the locators are working correctly.
    result = { version: 'v0.0.0', releaseDate: '1.1.1970', releaseDateText: 'yesterday', href: '/', error: null }) {
    // Test each locator in isolation
    const turbo_frames = page.locator('xpath=//turbo-frame');
    //const turbo_frameCount = 
    await turbo_frames.count()
        .then(count => {
            console.log('turbo_frames count:', count);
            assert.strictEqual(count, 1);
        }).catch(error => {
            console.error('Error counting turbo_frames:', error);
            result['error'] = error.toString();
        });
    await inspectTurboFrame(turbo_frames.first(), result).catch(error => {
        console.error('Error inspecting content:', error);
        result['error'] = error.toString();
    });

    return result;
}

async function inspectTurboFrame(turbo_frame, result) {
    // Find sections
    const sections = turbo_frame.locator('xpath=.//section');
    await sections.count().then(count => {
        console.log('sections count:', count);
        assert.notEqual(count, 0);
        assert.notEqual(count, 1);
    });
    // All we need is the first section
    await inspectSection(sections.first(), result);
}

async function inspectSection(section, result) {
    console.log('section count: ', await section.count());
    //console.log('section innerHTML: ', await section.innerHTML());
    const divs = section.locator('xpath=.//div/div');
    await divs.count().then(count => {
        console.log('divs count:', count);
        assert.notEqual(count, 0);
    });

    await inspectDiv(divs.first(), result);
}
/**
 * First div has relative-time, second div has avatar, third div has the link with the version number in a span
 * @param {Promise<import('playwright').ElementHandle>} div 
 */
async function inspectDiv(div, result) {
    await inspectDivForRelativeTime(div, result);
    await inspectDivForLinkAnchor(div, result);
}
/**
 * Extract the release date from the first div, which is in a <relative-time> element. 
 * The datetime attribute contains the ISO date, and the text content contains the relative time (e.g. "3 days ago").
 * @param {Promise<import('playwright').ElementHandle>} div 
 */
async function inspectDivForRelativeTime(div, result) {
    // The release date — in a <relative-time> element
    const relTimes = div.locator('xpath=.//div//relative-time');
    await relTimes.count().then(count => {
        console.log('relative-time count:', count);
        assert.notEqual(count, 0);
    });

    await inspectRelativeTime(relTimes.first(), result);
}
/**
 * Extract the datetime attribute and text content from a <relative-time> element.
 * Example:
 * datetime attr: 2022-04-26T17:51:05Z -> result['releaseDate']
 * datetime text: 26 Apr 17:51 -> result['releaseDateText'] 
 * @param {Promise<import('playwright').ElementHandle>} relTime 
 */
async function inspectRelativeTime(relTime, result) {
    await relTime.getAttribute('datetime')
        .then(attr => {
            assert.notEqual(attr, null); return attr.trim();
        })
        .then(attr => {
            console.log('datetime attr:', attr);
            result['releaseDate'] = attr;
        });

    await relTime.textContent()
        .then(text => {
            assert.notEqual(text, null); return text.trim();
        })
        .then(text => {
            console.log('datetime text:', text);
            result['releaseDateText'] = text;
        });
}

async function inspectDivForLinkAnchor(div, result) {
    // Find Links in 3rd div
    const linkAnchors = div.locator('xpath=.//div/a[contains(@class, "Link")]');
    await inspectLinkAnchorSpans(linkAnchors, result);
    await inspectLinkAnchor(linkAnchors.first(), result);
}
async function inspectLinkAnchors(linkAnchors, result) {
    const count = await linkAnchors.count()
        .then(count => {
            console.log('linkAnchors count:', count);
            return count;
        });
    // Print out the class attribute of each link anchor for debugging
    /*for (let i = 0; i < await linkAnchors.count(); i++) {
        const linkAnchor0 = linkAnchors.nth(i);
        console.log('linkAnchor ' + i, await linkAnchor0.getAttribute('class'));
    }*/
    assert.notEqual(count, 0);
    assert.equal(count, 2);
}
/**
 * Looks at a "a[@class='Link]", sets version and href
 * @param {import('playwright').Locator} linkAnchor 
 * @param {*} result 
 */
async function inspectLinkAnchor(linkAnchor, result) {
    const spans = linkAnchor.locator('xpath=.//span');
    await inspectLinkAnchorSpans(spans);

    // Retrieve the version number from the span and set it in the result object for later assertions. The version number is expected to be in the format "vX.Y.Z" (e.g. "v1.4.4").
    await inspectVersionSpan(spans.first(), result);

    // Reads the version number from the span, then looks for the href attribute in the anchor tag that contains that version number, and sets it in the result object for later assertions. The href is expected to be in the format "/FiloSottile/mkcert/tree/vX.Y.Z" (e.g. "/FiloSottile/mkcert/tree/v1.4.4").
    // Look for href="/FiloSottile/mkcert/tree/v1.4.4" in the anchor tag above the span that contains the version number
    await inspectHrefAttribute(linkAnchor, result);
}
async function inspectLinkAnchorSpans(spans) {
    await spans.count()
        .then(count => {
            console.log('spans count:', count)
            assert.notEqual(count, 0);
        });
}
/**
 * 
 * @param {import('playwright').ElementHandle} span 
 * @param {Map} result 
 */
async function inspectVersionSpan(span, result) {
    await span.textContent()
        .then(text => {
            console.log('version span text:', text);
            assert.notEqual(text, null);
            assert.ok(text?.length > 0);
            return text.trim();
        }).then(text => {
            console.log('version trimmed text:', text);
            let re = new RegExp('^(v\\d+\.\\d+\.\\d+)$');
            // The matched string is placed at index 2, even though there are no capture groups in the object, e.g.
            // let re = new RegExp('^v(\\d+\.\\d+\.\\d+)$');
            // linkAnchor o1:  [ 'v1.4.4', '1.4.4', index: 0, input: 'v1.4.4', groups: undefined ]
            let o1 = re.exec(text); // returns an object with the matched string and capture groups, or null if no match
            console.log('linkAnchor o1: ', o1);
            // linkAnchor o2:  true
            //let o2 = re.test(text); // returns a boolean
            assert.ok(re.test(text), `text [${text}] does not match expected pattern [${re}]`);
            return text;
        }).then(text => result['version'] = text);
}

async function inspectHrefAttribute(linkAnchor, result) {
    let re = new RegExp('^\/FiloSottile\/mkcert\/tree\/(v\\d+\.\\d+\.\\d+)$');
    await linkAnchor.getAttribute('href')
        .then(href => {
            console.log('linkAnchor href: ', href);
            assert.notEqual(href, null);
            assert.ok(href?.length > 0);

            let out = re.exec(href);
            console.log('linkAnchor out: ', out);
            assert.ok(re.test(href), `href [${href}] does not match expected pattern [${re}]`);
            assert.ok(href.includes(result['version']), `href [${href}] does not include version [${result['version']}]`);  ;
            assert.equal(out.at(1), result['version']);
            return href.trim();
        })
        .then(href => result['href'] = href);
}