## PdfServer for Responsive Paper

### Installation

User this to set up site:

https://www.howtoforge.com/tutorial/how-to-deploy-nodejs-applications-with-pm2-and-nginx-on-ubuntu/


except:
 - for chrome dependencies: sudo apt-get install libpangocairo-1.0-0 libx11-xcb1 libxcomposite1 libxcursor1 libxdamage1 libxi6 libxtst6 libnss3 libcups2 libxss1 libxrandr2 libgconf2-4 libasound2 libatk1.0-0 libgtk-3-0
- git clone
- git config credential.helper store 
- git pull 
- pm2 save after pm2 start ./bin/www

ln -s /etc/nginx/sites-available/pdfserver /etc/nginx/sites-enabled/