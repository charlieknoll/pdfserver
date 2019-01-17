## PdfServer for Responsive Paper

### Installation

Initial ubuntu:

https://www.linuxtechi.com/ubuntu-18-04-server-installation-guide/

Use this to set up site:



https://www.howtoforge.com/tutorial/how-to-deploy-nodejs-applications-with-pm2-and-nginx-on-ubuntu/

additional servers:

Install vm with secure boot off, 2048 mem (max limit set), devswitch
ifconfig to show ip then putty into machine

sudo apt update -y && sudo apt upgrade -y && sudo apt-get install openssh-server -y
copy ssh key from putty to ~/.ssh/authorized_keys
Set static ip in /etc/netplan/ yaml file

sudo netplan apply
sudo netplan --debug apply

reconnect putty

set up hosts files in /etc/hosts

Set up node:

sudo curl -sL https://deb.nodesource.com/setup_10.x -o nodesource_setup.sh && sudo bash nodesource_setup.sh && sudo apt install -y nodejs

Puppetteer:

sudo apt-get install gconf-service libasound2 libatk1.0-0 libatk-bridge2.0-0 libc6 libcairo2 libcups2 libdbus-1-3 libexpat1 libfontconfig1 libgcc1 libgconf-2-4 libgdk-pixbuf2.0-0 libglib2.0-0 libgtk-3-0 libnspr4 libpango-1.0-0 libpangocairo-1.0-0 libstdc++6 libx11-6 libx11-xcb1 libxcb1 libxcomposite1 libxcursor1 libxdamage1 libxext6 libxfixes3 libxi6 libxrandr2 libxrender1 libxss1 libxtst6 ca-certificates fonts-liberation libappindicator1 libnss3 lsb-release xdg-utils wget -y

Set up postgres

test postgres connection to testing from dev 
test ip connection from pgadmin to dev






- git clone
- git config credential.helper store 
- git pull 
- pm2 save after pm2 start ./bin/www

ln -s /etc/nginx/sites-available/pdfserver /etc/nginx/sites-enabled/

Certbot and https support:

TESTING ENVIRONMENT

- set static ip
- update hosts file to resolve static ip to test.responsivepaper.com
- generatel ssl testing cert in /etc/testssl

first generate root:
add root to trusted root certificate authorities
generate csr
issue cert from root CA to server

https://medium.freecodecamp.org/how-to-get-https-working-on-your-local-development-environment-in-5-minutes-7af615770eec

# New install for Ubuntu 18.04

https://www.digitalocean.com/community/tutorials/how-to-set-up-a-node-js-application-for-production-on-ubuntu-18-04

https://www.digitalocean.com/community/tutorials/how-to-install-git-on-ubuntu-18-04

Install node:
https://linuxize.com/post/how-to-install-node-js-on-ubuntu-18.04/

Puppeteer dependencies:
https://github.com/GoogleChrome/puppeteer/issues/3443

sudo apt-get install gconf-service libasound2 libatk1.0-0 libatk-bridge2.0-0 libc6 libcairo2 libcups2 libdbus-1-3 libexpat1 libfontconfig1 libgcc1 libgconf-2-4 libgdk-pixbuf2.0-0 libglib2.0-0 libgtk-3-0 libnspr4 libpango-1.0-0 libpangocairo-1.0-0 libstdc++6 libx11-6 libx11-xcb1 libxcb1 libxcomposite1 libxcursor1 libxdamage1 libxext6 libxfixes3 libxi6 libxrandr2 libxrender1 libxss1 libxtst6 ca-certificates fonts-liberation libappindicator1 libnss3 lsb-release xdg-utils wget

TODO:

Install postgresql 11
https://websiteforstudents.com/how-to-install-postgresql-11-on-ubuntu-16-04-18-04-servers/

wget --quiet -O - https://www.postgresql.org/media/keys/ACCC4CF8.asc | sudo apt-key add -
sudo sh -c 'echo "deb http://apt.postgresql.org/pub/repos/apt/ $(lsb_release -sc)-pgdg main" > /etc/apt/sources.list.d/PostgreSQL.list'

sudo apt update && sudo apt-get install postgresql-11 -y

update postgres system and postgres password

sudo passwd postgres
sudo su -l postgres
psql
\password postgres
\q
exit

Perform initial config network config:

https://pgdash.io/blog/postgres-11-getting-started.html

sudo nano /etc/postgresql/11/main/pg_hba.conf

sudo nano /etc/postgresql/11/main/postgresql.conf
sudo systemctl restart postgresql


TODO: 

Test pdf conversion


sudo apt install build-essential
(optional?) sudo apt-get install g++

#### Set up app user in linux, pull latest repo
- useradd -m -s /bin/bash rp_user
- passwd rp_user
- git clone
- git config credential.helper store 
- git pull 
- npm install
- npm install puppeteer (for some reason chrome doesn't install when doing npm install)
- touch .env
- nano .env (enter all vars from sample.env) point rp-dev to use rp-test's db
- set up db on rp-test
- env $(cat .env) ./app/server.js to run node with env vars




Configure pm2 with proper environment variables

https://www.digitalocean.com/community/questions/passing-environment-variables-to-node-js-using-pm2
https://github.com/freeCodeCamp/freeCodeCamp/blob/master/sample.env

Build landing
Build backup process to blockstorage
Add server 2 to Digital Ocean
Do rolling upgrade script
https://www.digitalocean.com/community/tutorials/how-to-use-a-simple-bash-script-to-restart-server-programs
https://stackoverflow.com/questions/6147203/automating-running-command-on-linux-from-windows-using-putty

Build restore process

Landing page example:
https://www.autumnleavesproject.org/stay-tuned-landing-page/

Make background a picture of a screen with a portrait letter sized printout and a legal landscape printout with vscode in the background and a web page open
add twitter and github links
Create twitter and github org accounts
"A new way to design html reports for pdf conversion"