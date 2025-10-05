/** @type {import('next').NextConfig} */
const nextConfig = {
  env: {
    SOLVED_AC_API_URL: process.env.SOLVED_AC_API_URL,
    OPENAI_API_KEY: process.env.OPENAI_API_KEY,
  },
}

module.exports = nextConfig
