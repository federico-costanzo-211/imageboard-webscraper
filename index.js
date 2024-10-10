const puppeteer = require('puppeteer');
const fs = require('node:fs');
const path = require('path');

const websiteArray = [
    'https://safebooru.org'
];
const query = 'eren_jaeger';
const downloadFilepath = path.join(__dirname, 'images');
const pageSearchNumber = 3; //W.I.P.

//----------------------------------------------------------

async function downloadImageFromBooruPage(page, filepath){
    if (!fs.existsSync(filepath)){
        fs.mkdirSync(filepath);
    };
    
    const imageUrl = await page.evaluate(() => {
        let image = document.querySelector("#image");
        return [image.src, image.alt];
    });

    const imageArrayBuffer = await fetch(imageUrl[0], {
        method: "GET",
        mode: "no-cors"
    })
    .then(async (response) => await response.blob())
    .then(async (response) => await response.arrayBuffer());
    const imageBuffer = Buffer.from(imageArrayBuffer);
    
    const filename = imageUrl[1].replace(/\. \s \\{2}/g, "-").substring(0, 250) + ".png";
    console.log(filename);
    fs.writeFileSync(path.join(filepath, filename), imageBuffer, {flag: 'a+'});
};

//----------------------------------------------------------------

//todo: page browsing
//todo: add error catching
    //todo: add retry in case of error 404
    //todo: add catch for timeout error


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
    
        for (let link of linkList){
            await page.goto(link);
            await downloadImageFromBooruPage(page, downloadFilepath);
        };
    };

    await browser.close();
};

main();