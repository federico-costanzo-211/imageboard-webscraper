const puppeteer = require('puppeteer');
const fs = require('node:fs');
const path = require('path');

const websiteArray = [
    'https://safebooru.org'
];
const query = 'morgana_(league_of_legends)';
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
        args: ["--no-startup-window", "--no-first-run", "--no-sandbox"],
        waitForInitialPage: false
    });
    const page = await browser.newPage();
    await page.setViewport({
        width: 1920,
        height: 1080
    });
    console.log('\nLaunch successful!');


    for (let website of websiteArray){
        
        //BUG: reload algorithm doesn't work

        for (let attempt_counter = 0; attempt_counter < 3; attempt_counter++){
            try {
                await page.goto(website);
                console.log(`\n------------------- ${website} -------------------`);

                //writes query in searchbar
                await page.locator('#tags').fill(query);

                //BUG: query sometimes isn't fully typed in search bar

                //clicks the search button
                await Promise.all([
                    page.locator("[type=submit]").click(),
                    page.waitForNavigation({
                        waitUntil: 'networkidle2'
                    })
                ]);
                
                //breaks attempt cycle
                break;

            } catch (err){
                if (err instanceof puppeteer.TimeoutError){
                    console.log(`\nAttempt ${attempt_counter + 1} of 3 failed, reloading page...`);
                } else {
                    console.error("\nError: site could not be reached. Please try again.")    
                    break;
                }
            
            } finally {
                //testing
                await page.screenshot({path: `testa${attempt_counter}.png`});
            }
        };
        
        for (let pageCounter = 0; pageCounter < pageSearchNumber; pageCounter++){
            const currentPage = page.url();
            
            //testing
            await page.screenshot({path: `testc${pageCounter}.png`});
            
            //gets each image's href (to get the higher quality download) and adds them to a list
            const linkList = await page.evaluate(() => {
                const nodeList = document.querySelectorAll('span > a, .post-preview-link > a');
                const linkList = [];
    
                nodeList.forEach((element) => {
                    linkList.push(element.href);
                });
    
                return linkList;
            });
            
            //iterates through the list and downloads the image from each link

            if (linkList.length === 0){
                console.log("\nNo posts found. Moving to next site...");
            } else {
                for (let link of linkList){
                    await page.goto(link);
                    await downloadImageFromBooruPage(page, downloadFilepath);
                };
                console.log("\nAll images in page downloaded!");
                
                await page.goto(currentPage);
                await page.evaluate(_ => {
                    window.scrollBy(0, window.innerHeight);
                });

                try {
                    await page.locator('div > a[id*="next"], div > a[alt*="next"]').click({timeout: 5000});

                    //testing
                    page.screenshot({path: `testd${pageCounter}.png`});
                } catch(error){
                    console.log(`Error - ${error}: Next page button not found. Moving to next site...`);
                    break;
                };

                
            };
        };

    await browser.close();
    };
};

main();