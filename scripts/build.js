/* eslint-disable no-console */

const {
  execSync
} = require('child_process')

function exec (command, env, header, footer) {
  if (header) {
    console.info(header)
  }
  execSync(
    command,
    {
      stdio: 'inherit',
      env: Object.assign({}, process.env, env)
    }
  )
  if (footer) {
    console.info(footer)
  }
}

const divider = `
-------------------------------------------------------
`
exec(
  'babel src -d lib --ignore __tests__',
  {
    BABEL_ENV: 'cjs',
    NODE_ENV: 'production'
  },
  'Building CommonJS modules ...',
  divider
)

exec(
  'babel src -d es --ignore __tests__',
  {
    BABEL_ENV: 'es',
    NODE_ENV: 'production'
  },
  'Building ES modules ...',
  divider
)
