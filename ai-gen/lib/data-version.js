/**
 * 数据版本号工具
 *
 * 版本号格式：YYYYMMDDNN —— 8 位日期 + 2 位当日序号，例如 2026110301
 * 规则：
 *   - 同一天内多次生成数据，序号自动 +1（…01 → …02 → …03）
 *   - 跨到新的一天，序号从 01 重新开始
 *   - 兼容旧的毫秒时间戳版本号：遇到旧格式视为「新的一天」，从 01 起算
 *
 * 用法：
 *   import { nextDataVersion } from '../lib/data-version.js'
 *   mainData.dataVersion = nextDataVersion(mainData.dataVersion)
 */

import { readFileSync, existsSync } from 'fs'

const SEQ_MAX = 99

// 生成日期段：YYYYMMDD
export function formatStamp(date = new Date()) {
  const p = n => String(n).padStart(2, '0')
  return `${date.getFullYear()}${p(date.getMonth() + 1)}${p(date.getDate())}`
}

// 解析版本号；非新格式（如旧时间戳）返回 null
export function parseDataVersion(v) {
  const m = String(v ?? '').trim().match(/^(\d{8})(\d{2})$/)
  if (!m) return null
  const seq = Number(m[2])
  if (seq < 1 || seq > SEQ_MAX) return null
  return { stamp: m[1], seq }
}

// 由当前版本号推导下一个版本号（返回数字，便于直接比较/存储）
export function nextDataVersion(current, date = new Date()) {
  const stamp = formatStamp(date)
  const parsed = parseDataVersion(current)
  const seq = parsed && parsed.stamp === stamp ? Math.min(parsed.seq + 1, SEQ_MAX) : 1
  return Number(`${stamp}${String(seq).padStart(2, '0')}`)
}

// 读取数据文件中的当前版本号（读取失败/文件不存在返回 null）
export function readDataVersion(filePath) {
  try {
    if (!existsSync(filePath)) return null
    return JSON.parse(readFileSync(filePath, 'utf8')).dataVersion ?? null
  } catch {
    return null
  }
}

// 直接依据数据文件推导下一个版本号
export function nextDataVersionForFile(filePath, date = new Date()) {
  return nextDataVersion(readDataVersion(filePath), date)
}

// 展示用：2026110301 → 2026-11-03 · 01
export function formatDataVersionLabel(v) {
  const parsed = parseDataVersion(v)
  if (!parsed) return v == null ? '' : String(v)
  const s = parsed.stamp
  return `${s.slice(0, 4)}-${s.slice(4, 6)}-${s.slice(6, 8)} · ${String(parsed.seq).padStart(2, '0')}`
}
