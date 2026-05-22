import { existsSync } from 'node:fs';
import { mkdir, readFile, readdir, writeFile } from 'node:fs/promises';
import { join } from 'node:path';
import { generateBankId } from './hasher.js';
import type {
  Bank,
  BankIndex,
  ProcessError,
  QuestionCount
} from './schema.js';
import { reportError } from './summary.js';
import { validateBank } from './validator.js';

export interface ProcessResult {
  indexEntries: BankIndex[];
  totalQuestions: number;
  errors: ProcessError[];
}

/**
 * 递归获取目录下所有 .json 文件
 */
async function findJsonFiles(dir: string): Promise<string[]> {
  const results: string[] = [];

  async function walk(currentPath: string): Promise<void> {
    const entries = await readdir(currentPath, { withFileTypes: true });
    for (const entry of entries) {
      const fullPath = join(currentPath, entry.name);
      if (entry.isDirectory()) {
        await walk(fullPath);
      } else if (entry.isFile() && entry.name.endsWith('.json')) {
        results.push(fullPath);
      }
    }
  }

  await walk(dir);
  return results;
}

/**
 * 统计各题型数量
 */
function countQuestions(questions: Bank['questions']): QuestionCount {
  const count: QuestionCount = {
    single: 0,
    multiple: 0,
    indeterminate: 0,
    judge: 0,
  };

  for (const q of questions) {
    switch (q.type) {
      case 'single':
        count.single++;
        break;
      case 'multiple':
        count.multiple++;
        break;
      case 'indeterminate':
        count.indeterminate++;
        break;
      case 'judge':
        count.judge++;
        break;
    }
  }

  return count;
}

/**
 * 处理单个 JSON 文件
 */
async function processFile(
  filePath: string,
  outputDir: string,
  errors: ProcessError[],
): Promise<BankIndex | null> {
  // 读取文件
  let raw: string;
  try {
    raw = await readFile(filePath, 'utf-8');
  } catch (err) {
    const msg = `无法读取文件: ${err instanceof Error ? err.message : String(err)}`;
    reportError(msg, filePath);
    errors.push({ file: filePath, errors: [msg] });
    return null;
  }

  // 解析 JSON
  let data: unknown;
  try {
    data = JSON.parse(raw);
  } catch (err) {
    const msg = `JSON 解析错误: ${err instanceof Error ? err.message : String(err)}`;
    reportError(msg, filePath);
    errors.push({ file: filePath, errors: [msg] });
    return null;
  }

  // Schema 校验
  const validation = await validateBank(data);
  if (!validation.valid) {
    const msg = `Schema 校验失败`;
    reportError(`${msg}: ${validation.errors.join('; ')}`, filePath);
    errors.push({ file: filePath, errors: validation.errors });
    return null;
  }

  const bank = data as Bank;

  // 先生成 ID（基于原始数据，不含 $schema 注入带来的影响），确保 ID 稳定
  const id = generateBankId(data as Record<string, unknown>);
  const prefix = id.slice(0, 2);

  // 确保输出文件包含 $schema 字段
  bank.$schema =
    'https://course-quiz-lab.github.io/json-schema/v1/bank.schema.json';

  // 输出目录
  const targetDir = join(outputDir, prefix);
  if (!existsSync(targetDir)) {
    await mkdir(targetDir, { recursive: true });
  }

  // 写入无缩进序列化结果
  const outputPath = join(targetDir, `${id}.json`);
  await writeFile(outputPath, JSON.stringify(bank), 'utf-8');

  // 统计题目数量
  const count = countQuestions(bank.questions);

  // 构建索引条目
  const indexEntry: BankIndex = {
    metadata: bank.metadata,
    count,
    url: `${prefix}/${id}.json`,
  };

  return indexEntry;
}

/**
 * 核心处理逻辑：
 * 1. 读取目录下所有 JSON 文件
 * 2. 对每个文件进行校验+处理
 * 3. 收集索引条目和错误信息
 */
export async function processAll(options: {
  dir: string;
  outputDir: string;
}): Promise<ProcessResult> {
  const { dir, outputDir } = options;

  // 确保输出目录存在
  if (!existsSync(outputDir)) {
    await mkdir(outputDir, { recursive: true });
  }

  // 检查输入目录
  if (!existsSync(dir)) {
    const msg = `输入目录不存在: ${dir}`;
    reportError(msg);
    return {
      indexEntries: [],
      totalQuestions: 0,
      errors: [{ file: dir, errors: [msg] }],
    };
  }

  // 查找所有 JSON 文件
  const files = await findJsonFiles(dir);

  if (files.length === 0) {
    reportError(`目录 "${dir}" 下未找到任何 JSON 文件`);
    return { indexEntries: [], totalQuestions: 0, errors: [] };
  }

  const indexEntries: BankIndex[] = [];
  const errors: ProcessError[] = [];
  let totalQuestions = 0;

  for (const filePath of files) {
    const entry = await processFile(filePath, outputDir, errors);
    if (entry) {
      indexEntries.push(entry);
      totalQuestions +=
        entry.count.single +
        entry.count.multiple +
        entry.count.indeterminate +
        entry.count.judge;
    }
  }

  return { indexEntries, totalQuestions, errors };
}
