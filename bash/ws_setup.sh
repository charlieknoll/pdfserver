#!/bin/bash
while getopts p:g: option
do
case "${option}"
in
p) PASSWORD=${OPTARG};;
g) GITHUBPASSWORD=${OPTARG};;
esac
done
if [ "$PASSWORD" == "" ]; then
  printf "***************************\n"
  printf "* Error: Please supply rp_user password using p param (-p password).*\n"
  printf "***************************\n"
  exit 1
fi
if [ "$GITHUBPASSWORD" == "" ]; then
  printf "***************************\n"
  printf "* Error: Please supply charlieknoll github password using p param (-g password).*\n"
  printf "***************************\n"
  exit 1
fi
apt-get update && apt-get upgrade -y
sudo ufw allow 3000
adduser rp_user --disabled-password --gecos ""
echo "rp_user:$PASSWORD" | chpasswd
sudo apt install build-essential -y
sudo curl -sL https://deb.nodesource.com/setup_12.x -o nodesource_setup.sh && sudo bash nodesource_setup.sh && sudo apt install -y nodejs
rm nodesource_setup.sh -y
sudo apt-get install gconf-service libasound2 libatk1.0-0 libatk-bridge2.0-0 libc6 libcairo2 libcups2 libdbus-1-3 libexpat1 libfontconfig1 libgcc1 libgconf-2-4 libgdk-pixbuf2.0-0 libglib2.0-0 libgtk-3-0 libnspr4 libpango-1.0-0 libpangocairo-1.0-0 libstdc++6 libx11-6 libx11-xcb1 libxcb1 libxcomposite1 libxcursor1 libxdamage1 libxext6 libxfixes3 libxi6 libxrandr2 libxrender1 libxss1 libxtst6 ca-certificates fonts-liberation libappindicator1 libnss3 lsb-release xdg-utils wget -y
sudo npm install pm2 -g
sudo -i -u rp_user bash << EOF
cd /home/rp_user
git clone https://charlieknoll:$GITHUBPASSWORD@github.com/charlieknoll/pdfserver.git
cd pdfserver
git config credential.helper store
git pull
git config credential.helper store
npm install --production
EOF
sudo cp ./.env /home/rp_user/pdfserver/
sudo chown -R rp_user:rp_user /home/rp_user/pdfserver/.env
sudo -i -u rp_user bash << EOF
cd pdfserver
env $(cat .env) && pm2 start ./app/server.js -i max
pm2 save
EOF
sudo env PATH=$PATH:/usr/bin /usr/lib/node_modules/pm2/bin/pm2 startup systemd -u rp_user --hp /home/rp_user
sudo -i -u rp_user bash << EOF
cd pdfserver
pm2 kill && env $(cat .env) pm2 start ./app/server.js -i max && pm2 save
EOF


