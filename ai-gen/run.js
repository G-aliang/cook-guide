/**
 * 菜谱数据处理总控脚本
 * 统一入口，串联所有数据处理步骤
 *
 * 使用：
 *   node ai-gen/run.js status     # 查看当前进度（含导出名单+提示词）
 *   node ai-gen/run.js export     # ① 导出名单 + 生成提示词
 *   node ai-gen/run.js parse      # ② 解析 AI 输出（放到 ai-output/ 后运行）
 *   node ai-gen/run.js merge      # ③ 合并进系统
 *   node ai-gen/run.js clean      # 清理目录（去重+修异常）
 *   node ai-gen/run.js version    # 查看数据版本号（--apply 可生成新版本号）
 *   node ai-gen/run.js check      # 流程自检
 *   node ai-gen/run.js build      # 构建生产版本
 */

import { execSync } from 'child_process'

const ROOT = 'D:/code/cook'
const NODE = `"${process.execPath}"`  // 用当前 Node 可执行文件，避免子进程 PATH 不一致

const commands = {
  status: {
    desc: '查看当前进度（导出名单 + 生成提示词）',
    run: () => execSync(`${NODE} ai-gen/scripts/export-list.js`, { cwd: ROOT, stdio: 'inherit' }),
  },
  export: {
    desc: '① 导出名单 + 生成提示词（dishes-list / dishes-todo / prompts.md）',
    run: () => execSync(`${NODE} ai-gen/scripts/export-list.js`, { cwd: ROOT, stdio: 'inherit' }),
  },
  parse: {
    desc: '② 解析 AI 输出（读取 ai-output/ 目录）',
    run: () => execSync(`${NODE} ai-gen/scripts/batch-generate.js`, { cwd: ROOT, stdio: 'inherit' }),
  },
  merge: {
    desc: '③ 合并进系统（写入 data/ 和 public/）',
    run: () => execSync(`${NODE} merge-dishes.js`, { cwd: ROOT, stdio: 'inherit' }),
  },
  clean: {
    desc: '清理目录（去重 + 修复异常菜名）',
    run: () => execSync(`${NODE} clean-dishes.js`, { cwd: ROOT, stdio: 'inherit' }),
  },
  version: {
    desc: '查看数据版本号（加 --apply 生成新版本号并写入）',
    run: () => {
      const extra = process.argv[3] === '--apply' ? ' --apply' : ''
      execSync(`${NODE} ai-gen/scripts/gen-version.js${extra}`, { cwd: ROOT, stdio: 'inherit' })
    },
  },
  check: {
    desc: '流程自检（验证各环节、文件、数据一致性）',
    run: () => execSync(`${NODE} ai-gen/scripts/check-pipeline.js`, { cwd: ROOT, stdio: 'inherit' }),
  },
  build: {
    desc: '构建生产版本',
    run: () => execSync(`${NODE} node_modules/vite/bin/vite.js build`, { cwd: ROOT, stdio: 'inherit' }),
  },
}

function printHelp() {
  console.log(`
菜谱数据处理总控脚本

用法: node ai-gen/run.js <命令>

命令:
`)
  for (const [name, cmd] of Object.entries(commands)) {
    console.log(`  ${name.padEnd(10)} ${cmd.desc}`)
  }
  console.log(`
完整流程:
  1. node ai-gen/run.js export    导出名单 + 生成提示词
  2. 【复制 ai-gen/prompts.md 的提示词到 AI 工具，保存 JSON 到 ai-gen/ai-output/】
  3. node ai-gen/run.js parse     解析 AI 输出
  4. node ai-gen/run.js merge     合并进系统
  5. node ai-gen/run.js build     构建并部署
`)
}

async function main() {
  const cmd = process.argv[2]

  if (!cmd || cmd === 'help' || cmd === '--help') {
    printHelp()
    return
  }

  if (cmd === 'all') {
    // 一键执行（AI 生成部分需人工）
    console.log('=== 1/3 导出名单 + 提示词 ===')
    commands.export.run()
    console.log('\n=== 2/3 解析 AI 输出 ===')
    try {
      commands.parse.run()
    } catch (e) {
      console.log('（暂无 AI 输出，跳过）')
    }
    console.log('\n=== 3/3 合并进系统 ===')
    try {
      commands.merge.run()
    } catch (e) {
      console.log('（无数据可合并，跳过）')
    }
    console.log('\n完成！')
    return
  }

  const command = commands[cmd]
  if (!command) {
    console.error(`未知命令: ${cmd}`)
    printHelp()
    process.exit(1)
  }

  command.run()
}

main()
