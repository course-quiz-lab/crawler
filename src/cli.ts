import { Command } from 'commander';

export interface CliOptions {
  dir: string;
}

/**
 * 解析命令行参数
 */
export function parseCliArgs(): CliOptions {
  const program = new Command();

  program
    .name('crawler')
    .description('题库文件抓取与索引生成工具')
    .option('--dir <path>', '题库 JSON 文件所在目录', './data');

  program.parse(process.argv);

  const options = program.opts<{ dir: string }>();
  return { dir: options.dir };
}
