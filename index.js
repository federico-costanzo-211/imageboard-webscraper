const puppeteer = require('puppeteer');
const fs = require('node:fs');

const websiteArray = [
    'https://safebooru.org'
];
const query = 'ishmael_(project_moon)';

async function main(){
    const browser = await puppeteer.launch({
        headless: 'false'
    });
    const page = await browser.newPage();
    await page.setViewport({
        width: 1920,
        height: 1080
    });
    console.log('Launch successful!');

    for (let website of websiteArray){
        await page.goto(website);
        console.log(`------------------- ${website} -------------------\n`);

        await page.locator('#tags').fill(query);
        await Promise.all([
            page.click('input[type=submit]'),
            page.waitForNavigation({
                waitUntil: 'networkidle2'
            })
        ]);

        //todo: add retry in case of error 404
        //todo: add catch for timeout error

        //testing
        await page.screenshot({path: 'test.png'});

        const linkList = await page.evaluate(() => {
            const nodeList = document.querySelectorAll('.thumb > a');
            const linkList = [];

            nodeList.forEach((element) => {
                linkList.push(element.href);
            });

            return linkList;
        });

        await page.screenshot({path: 'test2.png'});

        //testing
        console.log("Array: \n");
        console.log(linkList);
    };

    await browser.close();
};

main();