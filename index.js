const puppeteer = require('puppeteer');
const fs = require('fs');
const { PDFDocument } = require('pdf-lib');
const url = require('url');
const path = require('path');
const urlName = process.argv.slice(2);

  if (urlName.length === 0) {
    console.error('Please provide one or more URLs as command-line arguments.');
    process.exit(1);
  }

const parsedUrl = new URL(urlName);
console.log(parsedUrl.pathname);
  if(parsedUrl.pathname=="/ja-jp"){
    const urls=[];
    urls.push(`${parsedUrl.origin}${parsedUrl.pathname}/mounjaro`);
    urls.push(`${parsedUrl.origin}${parsedUrl.pathname}/taltz`);
    urls.push(`${parsedUrl.origin}${parsedUrl.pathname}/cyramza`);
    urls.push(`${parsedUrl.origin}${parsedUrl.pathname}/reyvow`);
    urls.push(`${parsedUrl.origin}${parsedUrl.pathname}/medical-education/neuroscience/headache-disorders`);
    console.log(urls);
    (async () => {
      const browser = await puppeteer.launch({
        headless: true, // Set to true for headless mode
      });
      const page = await browser.newPage();
    
      // Emulate a mobile user agent
     // const mobileUserAgent =
      //  'Mozilla/5.0 (iPhone; CPU iPhone OS 15_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/15.0 Mobile/15E148 Safari/604.1';
      const desktopUserAgent =
        'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/100.0.0.0 Safari/537.36';
    
    
      await page.setUserAgent(desktopUserAgent);
    
      // Define a list of URLs you want to capture screenshots of
      /*const urls = [
        'https://lusa-lillymedinfo-jp-stg.herokuapp.com/ja-jp/medical-education/neuroscience/alzheimers-disease',
        'https://www.lillymedical.jp/ja-jp/cyramza',
        'https://www.lillymedical.jp/ja-jp/mounjaro'
      ];*/
      const screenshots = [];
    
      for (const url of urls) {
        console.log(url);
        const parsedUrl = new URL(url);
        const urlWithoutProtocol = url.replace(/^https?:\/\//, '');
         console.log(urlWithoutProtocol);
      // Split the URL path by "/"
      const formattedUrl = urlWithoutProtocol.replace(/\./g, '_');
      console.log(formattedUrl);
      const pathSegments = formattedUrl.split('/');
      console.log(pathSegments);
      // Get the last two path segments
      const lastTwoSegments = pathSegments.slice(0,pathSegments.length-1);
      console.log(lastTwoSegments);
      // Join the last two segments with "\\" to create the folder name
      const folderName = lastTwoSegments.join('\\');
      console.log(folderName);
        /*const urlWithoutProtocol = url.replace(/^https?:\/\//, '');
        console.log(urlWithoutProtocol);
        // Replace all "." with "_"
        const formattedUrl = urlWithoutProtocol.replace(/\./g, '_');
        console.log(formattedUrl);
        // Replace "/" with "\\"
        const transformedUrl = formattedUrl.replace(/\//g, '\\');
        console.log(transformedUrl);*/
        const folderPath = path.join(__dirname, folderName);
        console.log(folderPath);
        // Create the directory (folder) with the specified name
        if (!fs.existsSync(folderPath)) {
          fs.mkdirSync(folderPath, { recursive: true });
        }
        await page.goto(url);
        await page.waitForSelector('.lds-side-nav-menu-container', { timeout: 10000 });
        // Wait for the page to load (you can adjust the timeout as needed)
        await page.waitForTimeout(5000);
    
        // Evaluate JavaScript in the page to hide specific elements (e.g., popups)
        await page.evaluate(() => {
          // Replace the following code with the selector(s) for the element(s) you want to hide
          const elementsToHide = document.querySelectorAll('.lds-modal');
          elementsToHide.forEach((element) => {
            element.style.display = 'none';
          });
          const htmlElement = document.querySelector('html');
          htmlElement.setAttribute('data-modal-active', 'false');
        });
    
        // Capture a full-page screenshot
        // await page.setViewport({ width: 1920, height: 2000 });
        const bodyHandle = await page.$('body');
        const { height } = await bodyHandle.boundingBox();
        console.log(height);
        const validViewportHeight = Math.round(height)+1;
        console.log(validViewportHeight);
        await page.setViewport({ width: 1280, height: validViewportHeight });
        const screenshotName = `${url.replace(/https?:\/\//, '').replace(/\./g, '_')}_fullpage.png`;
        await page.screenshot({ path: screenshotName, fullPage: true });
    
        console.log(`Full-page mobile screenshot saved as ${screenshotName}`);
    
        screenshots.push(screenshotName);
      }
    
      await browser.close();
    
      // Create a new PDF document
      const pdfDoc = await PDFDocument.create();
    
      // Iterate through the screenshots and add them to the PDF
      for (const screenshot of screenshots) {
        const imageBytes = fs.readFileSync(screenshot);
        const image = await pdfDoc.embedPng(imageBytes);
        const page = pdfDoc.addPage([image.width, image.height]);
        const { width, height } = page.getSize();
        page.drawImage(image, {
          x: 0,
          y: 0,
          width,
          height,
        });
      }
    
      // Save the PDF
      const pdfBytes = await pdfDoc.save();
      fs.writeFileSync('screenshots.pdf', pdfBytes);
      console.log('Mobile screenshots saved as screenshots.pdf');
    
      // Clean up: remove individual screenshot files
      for (const screenshot of screenshots) {
        fs.unlinkSync(screenshot);
      }
    })();
    
  }