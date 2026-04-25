#!/usr/bin/env node
/**
 * spring-boot-layering 技能辅助脚本
 */

const args = process.argv.slice(2);
if (args.includes('--help')) {
  console.log(`
spring-boot-layering 技能辅助脚本

用法：
  node main.mjs --list     列出当前技能入口
  node main.mjs --help     显示帮助

说明：
  提供 spring-boot-layering 技能的最小自检入口，便于本地确认脚本可执行。
`);
  process.exit(0);
}

if (args.includes('--list')) {
  console.log('可用技能：');
  ['spring-boot-layering'].forEach((skill) => console.log(`  - ${skill}`));
  process.exit(0);
}

console.log('spring-boot-layering 技能脚本可用；请通过 Claude 按需触发该 skill。');
