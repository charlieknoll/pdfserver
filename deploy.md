### Deployment

New server

Install node:

curl -sL https://deb.nodesource.com/setup_12.x | sudo -E bash -
sudo apt-get install -y nodejs
rm -rf node_modules


Check for npm updates

- ncu, then ncu -u
- npm install
- npm audit

- Run tests
- Run build scripts on reportsjs (gulp scripts, gulp less)
- Copy css and js to app/resources (copy.bat)
- Copy designer.css to app/public
- Git check in and push
- Backup db (cd ~/backup && pg_dump rp > backup.txt)
- Restore to test db if necessary ()
- Deploy db migration
- Run script to shutdown a server:
  - sudo cp upstream-devonly.conf upstream.conf && systemctl restart nginx
  - sudo cp upstream-testonly.conf upstream.conf && systemctl restart nginx
  - sudo cp upstream-default.conf upstream.conf && systemctl restart nginx
- NOTE if updating pm2 dump file, first pm2 kill and check dump.pm2 after pm2 save
- env $(cat .env) pm2 start ./app/server.js -i max
- Or  to do it all
- cd pdfserver && git pull && npm install --production && pm2 kill && env $(cat .env) pm2 start ./app/server.js -i max && pm2 save
- su - rp_user: Git pull, npm install --production to that server (pm2 stop 0 && git pull && npm install --production)
***NOTES: Puppeteer v3.0.2 will not run for some reason
https://github.com/puppeteer/puppeteer/issues/5290
- Restart pm2 on updated instance (pm2 restart 0)
- Run script to shutdown next server
- Deploy to that server
- Bring up server