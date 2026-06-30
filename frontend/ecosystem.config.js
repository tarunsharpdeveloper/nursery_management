module.exports = {
  apps: [
    {
      name: 'nursery-frontend',
      script: 'node_modules/next/dist/bin/next',
      args: 'start -p 3000',
      cwd: '/home/jyada/public_html/nursery.jyada.in',
      instances: 1,
      exec_mode: 'fork',
      autorestart: true,
      watch: false,
      max_memory_restart: '1G',
      env: {
        NODE_ENV: 'production',
        PORT: 3000
      },
      error_file: '/home/jyada/logs/nursery-frontend-error.log',
      out_file: '/home/jyada/logs/nursery-frontend-out.log',
      log_file: '/home/jyada/logs/nursery-frontend-combined.log',
      time: true
    }
  ]
};
