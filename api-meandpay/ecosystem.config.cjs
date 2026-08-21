module.exports = {
  apps: [
    {
      name: 'apihrisbackend',
      script: 'src/server.js',
      instances: 1,
      exec_mode: 'fork',
      node_args: '--experimental-strip-types',
      env: {
        NODE_ENV: 'production',
        PORT: 3000
      },
      max_memory_restart: '500M',
      restart_delay: 3000,
      max_restarts: 10,
      error_file: '/root/.pm2/logs/apihrisbackend-error.log',
      out_file: '/root/.pm2/logs/apihrisbackend-out.log',
      log_date_format: 'YYYY-MM-DD HH:mm:ss',
      merge_logs: true,
      watch: false,
      kill_timeout: 10000,
      listen_timeout: 10000,
    }
  ]
};
