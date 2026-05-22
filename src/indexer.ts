import { writeFile } from 'node:fs/promises';
import { join } from 'node:path';
import { reportInfo } from './summary.js';
import type { BankIndex, IndexFile } from './schema.js';

/**
 * 生成 index.json 并写入到输出目录
 */
export async function writeIndexFile(
  indexEntries: BankIndex[],
  outputDir: string,
): Promise<void> {
  const indexFile: IndexFile = {
    $schema:
      'https://course-quiz-lab.github.io/json-schema/v1/index.schema.json',
    banks: indexEntries,
    updatedAt: new Date().toISOString(),
  };

  const outputPath = join(outputDir, 'index.json');
  await writeFile(outputPath, JSON.stringify(indexFile), 'utf-8');

  reportInfo(`索引文件已生成: ${outputPath}`);
}
