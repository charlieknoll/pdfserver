# Setting up ln servers

## Initial setup on all servers
Login as root
Update packages:
apt-get update && apt-get upgrade -y

Set hostname:
hostnamectl set-hostname example_hostname

Create non root user (charlie):
adduser charlie
adduser charlie sudo
rsync --archive --chown=charlie:charlie ~/.ssh /home/charlie
ufw allow OpenSSH
ufw enable
reboot

Login as charlie


sudo nano /etc/ssh/sshd_config
set PermitRootLogin no
set PasswordAuthentication no
set AddressFamily inet
save file


sudo systemctl restart sshd



## Web Server
sudo ufw allow http
sudo adduser rp_user ****Answer questions
sudo apt install build-essential
sudo curl -sL https://deb.nodesource.com/setup_12.x -o nodesource_setup.sh && sudo bash nodesource_setup.sh && sudo apt install -y nodejs
sudo apt-get install gconf-service libasound2 libatk1.0-0 libatk-bridge2.0-0 libc6 libcairo2 libcups2 libdbus-1-3 libexpat1 libfontconfig1 libgcc1 libgconf-2-4 libgdk-pixbuf2.0-0 libglib2.0-0 libgtk-3-0 libnspr4 libpango-1.0-0 libpangocairo-1.0-0 libstdc++6 libx11-6 libx11-xcb1 libxcb1 libxcomposite1 libxcursor1 libxdamage1 libxext6 libxfixes3 libxi6 libxrandr2 libxrender1 libxss1 libxtst6 ca-certificates fonts-liberation libappindicator1 libnss3 lsb-release xdg-utils wget
sudo npm install pm2 -g
sudo su - rp_user
git clone https://github.com/charlieknoll/pdfserver.git  ***need to enter username and password here
cd pdfserver
git pull ***need to enter username and password here
git config credential.helper store
npm install --production
nano .env (enter config and correct ip addresses)
npm install --production && env $(cat .env) pm2 start ./app/server.js -i max && pm2 save
exit rp_user
sudo env PATH=$PATH:/usr/bin /usr/lib/node_modules/pm2/bin/pm2 startup systemd -u rp_user --hp /home/rp_user
sudo systemctl start pm2-rp_user



## Redis

https://www.digitalocean.com/community/tutorials/how-to-install-and-secure-redis-on-ubuntu-18-04
ufw redis

## Postgres

https://websiteforstudents.com/how-to-install-postgresql-11-on-ubuntu-16-04-18-04-servers/
https://computingforgeeks.com/install-postgresql-12-on-ubuntu/

wget --quiet -O - https://www.postgresql.org/media/keys/ACCC4CF8.asc | sudo apt-key add -
sudo sh -c 'echo "deb http://apt.postgresql.org/pub/repos/apt/ $(lsb_release -sc)-pgdg main" > /etc/apt/sources.list.d/PostgreSQL.list'
echo "deb http://apt.postgresql.org/pub/repos/apt/ `lsb_release -cs`-pgdg main" |sudo tee  /etc/apt/sources.list.d/pgdg.list
sudo apt update
sudo apt upgrade
sudo apt-get install postgresql-12


psql -c "alter user postgres with password 'PASSWORD'"

sudo -u postgres psql
create user rp_user password 'PASSWORD';
create database rp owner rp_user;


