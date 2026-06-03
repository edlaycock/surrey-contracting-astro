// PM2 process config for the Astro Node (standalone) server on the VPS.
// Start:  pm2 start deploy/ecosystem.config.cjs && pm2 save
// Secrets (SMTP_*, CONTACT_*) live in a server-only env file that is NOT in git:
//   /var/www/surrey-contracting/shared/.env   (chmod 600, owned by the app user)
// Node 22 loads it via --env-file.
module.exports = {
  apps: [
    {
      name: 'surrey-contracting',
      cwd: '/var/www/surrey-contracting/current',
      script: 'dist/server/entry.mjs',
      node_args: '--env-file=/var/www/surrey-contracting/shared/.env',
      env: {
        HOST: '127.0.0.1',
        PORT: '4321',
      },
      instances: 1,
      exec_mode: 'fork',
      max_memory_restart: '300M',
      autorestart: true,
    },
  ],
};
