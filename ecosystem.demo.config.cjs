module.exports = {
  apps: [
    {
      name: 'backend',
      cwd: '/app',
      script: './dist/apps/backend/src/main.js',
      interpreter: 'node',
      node_args: '--experimental-require-module',
      autorestart: true,
      max_restarts: 20,
      exp_backoff_restart_delay: 2000,
      env: {
        NODE_ENV: 'production',
        PORT: '3000',
      },
    },
    {
      name: 'frontend',
      cwd: '/app',
      script: './node_modules/next/dist/bin/next',
      args: 'start -p 4200',
      interpreter: 'node',
      autorestart: true,
      max_restarts: 20,
      exp_backoff_restart_delay: 2000,
      env: {
        NODE_ENV: 'production',
      },
    },
    {
      name: 'orchestrator',
      cwd: '/app',
      script: './dist/apps/orchestrator/src/main.js',
      interpreter: 'node',
      node_args: '--experimental-require-module',
      autorestart: true,
      max_restarts: 20,
      exp_backoff_restart_delay: 2000,
      env: {
        NODE_ENV: 'production',
      },
    },
  ],
};
