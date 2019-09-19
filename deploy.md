### Deployment

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
- As rp_user: Git pull, npm install --production to that server (pm2 stop 0 && git pull && npm install --production)
- Restart pm2 on updated instance (pm2 restart 0)
- Run script to shutdown next server
- Deploy to that server
- Bring up server