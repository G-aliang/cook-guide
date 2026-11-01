/**
 * 菜谱数据处理总控脚本
 * 统一入口，串联所有数据处理步骤
 *
 * 使用：
 *   node ai-gen/run.js status     # 查看当前进度
 *   node ai-gen/run.js export     # ① 导出菜品名单
 *   node ai-gen/run.js prompts    # ② 生成提示词文件
 *   node ai-gen/run.js parse      # ③ 解析 AI 输出（放到 ai-output/ 后运行）
 *   node ai-gen/run.js merge      # ④ 合并进系统
 *   node ai-gen/run.js clean      # 清理目录（去重+修异常）
 *   node ai-gen/run.js all        # 一键执行 export + prompts + parse + merge
 */

import { execSync } from 'child_process'

const ROOT = 'D:/code/cook'

const commands = {
  status: {
    desc: '查看当前生成进度',
    run: () => execSync('node ai-gen/scripts/export-list.js', { cwd: ROOT, stdio: 'inherit' }),
  },
  export: {
    desc: '① 导出菜品名单（data/dishes-list.json + data/dishes-todo.json）',
    run: () => execSync('node ai-gen/scripts/export-list.js', { cwd: ROOT, stdio: 'inherit' }),
  },
  prompts: {
    desc: '② 生成提示词文件（prompts.md，供 AI 使用）',
    run: () => execSync('node ai-gen/scripts/gen-prompts.js', { cwd: ROOT, stdio: 'inherit' }),
  },
  parse: {
    desc: '③ 解析 AI 输出（读取 ai-output/ 目录）',
    run: () => execSync('node ai-gen/scripts/batch-generate.js --manual', { cwd: ROOT, stdio: 'inherit' }),
  },
  merge: {
    desc: '④ 合并进系统（写入 data/ 和 public/）',
    run: () => execSync('node merge-dishes.js', { cwd: ROOT, stdio: 'inherit' }),
  },
  clean: {
    desc: '清理目录（去重 + 修复异常菜名）',
    run: () => execSync('node clean-dishes.js', { cwd: ROOT, stdio: 'inherit' }),
  },
  build: {
    desc: '构建生产版本',
    run: () => execSync('npm run build', { cwd: ROOT, stdio: 'inherit' }),
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
  1. node ai-gen/run.js export    导出待生成菜品名单
  2. node ai-gen/run.js prompts   生成提示词
  3. 【你把提示词拿去 AI 工具跑，保存 JSON 到 ai-gen/ai-output/】
  4. node ai-gen/run.js parse     解析 AI 输出
  5. node ai-gen/run.js merge     合并进系统
  6. node ai-gen/run.js build     构建并部署
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
    console.log('=== 1/4 导出名单 ===')
    commands.export.run()
    console.log('\n=== 2/4 生成提示词 ===')
    commands.prompts.run()
    console.log('\n=== 3/4 解析 AI 输出 ===')
    try {
      commands.parse.run()
    } catch (e) {
      console.log('（暂无 AI 输出，跳过）')
    }
    console.log('\n=== 4/4 合并进系统 ===')
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
