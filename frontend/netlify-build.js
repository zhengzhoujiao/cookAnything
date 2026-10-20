const { execSync } = require('child_process')
execSync('npm ci --no-audit --no-fund', { stdio: 'inherit' })
execSync('npm run build', { stdio: 'inherit' })
