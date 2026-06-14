#!/usr/bin/env node
/**
 * AMC Dashboard — Standalone Cron Runner
 *
 * Run directly: node scripts/cron.js
 * Or via node-cron: this script is imported by the Next.js server on startup
 *
 * For Hostinger Node hosting (no Docker), you can:
 *   1. Add this as a scheduled task in the Hostinger control panel
 *   2. Or call the /api/cron endpoint from an external cron service
 */

const APP_URL = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'
const CRON_SECRET = process.env.CRON_SECRET

if (!CRON_SECRET) {
  console.error('❌ CRON_SECRET environment variable not set')
  process.exit(1)
}

async function runCron() {
  const start = Date.now()
  console.log(`[${new Date().toISOString()}] Running AMC cron job...`)

  try {
    const res = await fetch(`${APP_URL}/api/cron`, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${CRON_SECRET}`,
        'Content-Type': 'application/json',
      },
    })

    if (!res.ok) {
      const text = await res.text()
      throw new Error(`HTTP ${res.status}: ${text}`)
    }

    const data = await res.json()
    const elapsed = Date.now() - start

    console.log(`✅ Cron completed in ${elapsed}ms`)
    console.log(`   Domains checked: ${data.results?.domainsChecked ?? 0}`)
    console.log(`   AMCs checked:    ${data.results?.amcsChecked ?? 0}`)
    console.log(`   Emails sent:     ${data.results?.emailsSent ?? 0}`)
    console.log(`   Emails failed:   ${data.results?.emailsFailed ?? 0}`)
  } catch (err) {
    console.error(`❌ Cron failed:`, err instanceof Error ? err.message : err)
    process.exit(1)
  }
}

// If run directly, execute immediately
if (require.main === module) {
  runCron()
}

module.exports = { runCron }
