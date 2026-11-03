/**
 * 数据版本号工具
 *
 * 用法：
 *   node ai-gen/scripts/gen-version.js           # 查看当前版本号 + 下一个版本号
 *   node ai-gen/scripts/gen-version.js --apply   # 生成新版本号并写入数据文件（data/ + public/）
 *
 * 版本号格式：YYYYMMDDNN（日期 + 当日序号），例如 2026110301
 */

import { readFileSync, writeFileSync, existsSync, copyFileSync } from 'fs'
import { nextDataVersion, readDataVersion, parseDataVersion, formatDataVersionLabel } from '../lib/data-version.js'

const ROOT = 'D:/code/cook'
const DATA_FILE = `${ROOT}/data/import-data.json`
const PUBLIC_FILE = `${ROOT}/public/import-data.json`

const apply = process.argv.includes('--apply')

function describe(label, v) {
  if (v == null) return `${label}: （无）`
  const parsed = parseDataVersion(v)
  return parsed
    ? `${label}: ${v}  (${formatDataVersionLabel(v)})`
    : `${label}: ${v}  (旧格式，将重置为今日 01)`
}

const current = readDataVersion(DATA_FILE)
const next = nextDataVersion(current)

console.log('数据版本号')
console.log('  ' + describe('当前', current))
console.log('  ' + describe('下一个', next))

if (!apply) {
  console.log('\n（加 --apply 可将新版本号写入数据文件）')
  process.exit(0)
}

if (!existsSync(DATA_FILE)) {
  console.error(`\n✗ 找不到数据文件: ${DATA_FILE}`)
  process.exit(1)
}

const raw = JSON.parse(readFileSync(DATA_FILE, 'utf8'))
raw.dataVersion = next
raw.exportedAt = new Date().toISOString()
writeFileSync(DATA_FILE, JSON.stringify(raw), 'utf8')

let synced = ''
if (existsSync(PUBLIC_FILE)) {
  copyFileSync(DATA_FILE, PUBLIC_FILE)
  synced = '，已同步到 public/'
}

console.log(`\n✓ 已写入新版本号 ${next}${synced}`)
