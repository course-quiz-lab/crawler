import { resolve } from 'node:path';
import { rmSync } from 'node:fs';
import { parseCliArgs } from './cli.js';
import { processAll } from './processor.js';
import { writeIndexFile } from './indexer.js';
import { reportInfo, writeSummary } from './summary.js';

async function main(): Promise<void> {
  // 1. 解析命令行参数
  const { dir } = parseCliArgs();
  const inputDir = resolve(dir);
  const outputDir = resolve('dist');

  // 清除上次的输出
  rmSync(outputDir, { recursive: true, force: true });

  reportInfo(`输入目录: ${inputDir}`);
  reportInfo(`输出目录: ${outputDir}`);

  // 2. 处理所有题库文件
  const { indexEntries, totalQuestions, errors } = await processAll({
    dir: inputDir,
    outputDir,
  });

  // 3. 生成索引文件
  if (indexEntries.length > 0) {
    await writeIndexFile(indexEntries, outputDir);
  } else {
    reportInfo('没有有效的题库文件，跳过索引文件生成。');
  }

  // 4. 输出总结
  await writeSummary({
    totalBanks: indexEntries.length,
    totalQuestions,
    errors,
  });
}

main().catch((err) => {
  console.error('程序运行出错:', err);
  process.exit(1);
});
