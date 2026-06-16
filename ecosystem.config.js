module.exports = {
  apps: [
    {
      name: 'amc-dashboard',
      script: 'node_modules/.bin/next',
      args: 'start',
      instances: 1,
      exec_mode: 'fork',
      env: {
        PORT: 3000,
        NODE_ENV: 'production',
      },
    },
  ],
}
