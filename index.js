const puppeteer = require('puppeteer');
const fs = require('node:fs');
const path = require('path');

const websiteArray = [
    'https://safebooru.org'
];
const query = 'ishmael_(project_moon)';
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

    const imageBuffer = await fetch(imageUrl[0], {
        method: "GET",
        mode: "no-cors"
    })
    .then(async (response) => await response.arrayBuffer())
    .then((response) => Buffer.from(response))
    .catch((error) => console.error(error));
    
    const filename = imageUrl[1].replace(/\W/g, "").substring(0, 250) + ".png";
    console.log(filename);
    fs.writeFileSync(path.join(filepath, filename), imageBuffer, {flag: 'a+'});
};

//----------------------------------------------------------------

//todo: page browsing
//todo: imput from user

async function main(){
    const browser = await puppeteer.launch({
        headless: 'true'
    });
    const page = await browser.newPage();
    await page.setViewport({
        width: 1920,
        height: 1080
    });
    console.log('Launch successful!');


    for (let website of websiteArray){
        let attempt_counter = 0;
        while (attempt_counter < 3){
            try {
                await page.goto(website);
                console.log(`\n------------------- ${website} -------------------\n`);

                await page.locator('#tags').fill(query);

                await Promise.all([
                    page.click('input[type=submit]'),
                    page.waitForNavigation({
                        waitUntil: 'networkidle2'
                    })
                ]);
                break;
            } catch (err){
                if (err instanceof puppeteer.TimeoutError){
                    console.log(`Attempt ${attempt_counter + 1} of 3 failed, reloading page...`);
                    attempt_counter++;
                } else {
                    console.error("Error: site could not be reached. Please try again.")    
                    break;
                }
            };
        }; 
        
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
        
        if (linkList.length === 0) {
            console.log("No posts found. Moving to next site...");
            continue;
        };

        for (let link of linkList){
            await page.goto(link);
            await downloadImageFromBooruPage(page, downloadFilepath);
        };

        console.log("All images in page downloaded!");
    };

    await browser.close();
};

main();