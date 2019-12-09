# Bash setup instructions

## Run initial script

Load charlieknollprivatekey into pagent

Paste initial script in user data

Add new droplet to firewall

## Setup charlie


## Run ws-setup.sh
Putty as charlie
 - charlie password

Create ./tmp/ws_setup.sh
Create ./tmp/.env
sudo bash -s ws_setup.sh ### copy from lastpass
curl http://localhost:3000
curl http://localhost:3000/user/signin
check messages, reboot and check server is up

## Nginx

Putty as charlie to nginx server
sudo nano /etc/nginx/upstream.conf
sudo nginx -t && sudo service nginx reload

To remove pm2 process from server:
sudo env PATH=$PATH:/usr/bin /usr/lib/node_modules/pm2/bin/pm2 unstartup systemd -u rp_user --hp /home/rp_user

