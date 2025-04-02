import { Actor } from 'apify';
import { launchPuppeteer } from 'crawlee';

await Actor.init();

const input = await Actor.getInput();
const asin = input.asin;

const starCounts = {};
let total = 0;
let sum = 0;

const browser = await launchPuppeteer();
const page = await browser.newPage();

try {
    for (const [label, param] of Object.entries({
        "5": "five_star",
        "4": "four_star",
        "3": "three_star",
        "2": "two_star",
        "1": "one_star"
    })) {
        const url = `https://www.amazon.com/product-reviews/${asin}/ref=cm_cr_arp_d_viewopt_sr?ie=UTF8&formatType=current_format&filterByStar=${param}`;
        console.log(`Visiting: ${url}`);
        await page.goto(url, { waitUntil: 'networkidle2', timeout: 30000 });

        const countText = await page.evaluate(() => {
            const el = document.querySelector('.cr-filter-info-review-count');
            return el ? el.innerText : null;
        });

        console.log(`Star ${label}: Raw text → ${countText}`);

        const match = countText?.match(/([\d,]+)\s+global/);
        const count = match ? parseInt(match[1].replace(/,/g, '')) : 0;

        starCounts[label] = count;
        total += count;
        sum += count * parseInt(label);

        await new Promise(r => setTimeout(r, 1000 + Math.random() * 1000));
    }

    await browser.close();

    const average = total ? (sum / total).toFixed(2) : null;

    await Actor.setValue('OUTPUT', {
        asin,
        starBreakdown: starCounts,
        totalReviewCount: total,
        calculatedAverageRating: average ? parse
