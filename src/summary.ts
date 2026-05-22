import * as core from '@actions/core';
import type { ProcessError } from './schema.js';

/** 是否运行在 GitHub Actions 环境 */
const isGithubActions = () => Boolean(process.env.GITHUB_ACTIONS);

/**
 * 输出错误信息。
 * 在 GitHub Actions 环境下使用 core.error，否则使用 console.error。
 */
export function reportError(message: string, file?: string): void {
  if (isGithubActions()) {
    core.error(message);
  } else {
    if (file) {
      console.error(`[错误] ${file}: ${message}`);
    } else {
      console.error(`[错误] ${message}`);
    }
  }
}

/**
 * 输出普通信息。
 */
export function reportInfo(message: string): void {
  if (isGithubActions()) {
    core.info(message);
  } else {
    console.log(message);
  }
}

/**
 * 输出警告信息。
 */
export function reportWarning(message: string): void {
  if (isGithubActions()) {
    core.warning(message);
  } else {
    console.warn(`[警告] ${message}`);
  }
}

/**
 * 使用 core.summary 输出总结（非 GitHub Actions 环境则使用 console）。
 */
export async function writeSummary(params: {
  totalBanks: number;
  totalQuestions: number;
  errors: ProcessError[];
}): Promise<void> {
  const { totalBanks, totalQuestions, errors } = params;

  if (isGithubActions()) {
    // GitHub Actions 环境：使用 core.summary 的 API 方法
    core.summary.addHeading('题库处理总结', 2);
    core.summary.addTable([
      [
        { data: '项目', header: true },
        { data: '数值', header: true },
      ],
      ['已处理的题库数量', String(totalBanks)],
      ['总题数', String(totalQuestions)],
    ]);

    if (errors.length > 0) {
      core.summary.addHeading('错误详情', 3);
      core.summary.addTable([
        [
          { data: '文件', header: true },
          { data: '错误信息', header: true },
        ],
        ...errors.map((err) => [err.file, err.errors.join('; ')]),
      ]);
    }

    await core.summary.write();
  } else {
    // 非 GitHub Actions 环境：直接 console
    console.log('\n========== 处理总结 ==========');
    console.log(`已处理的题库数量: ${totalBanks}`);
    console.log(`总题数: ${totalQuestions}`);

    if (errors.length > 0) {
      console.log('\n--- 错误详情 ---');
      for (const err of errors) {
        console.log(`文件: ${err.file}`);
        for (const e of err.errors) {
          console.log(`  - ${e}`);
        }
      }
    }

    console.log('==============================\n');
  }
}
