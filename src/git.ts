import { dirname, relative } from 'node:path';
import simpleGit from 'simple-git';

/**
 * 尝试获取文件在其所属 GitHub 仓库上的远程链接。
 * 从文件所在目录向上查找 git 仓库，获取 remote origin URL 和当前分支，
 * 构造形如 https://github.com/{owner}/{repo}/blob/{branch}/{relative-path} 的链接。
 * 如果无法获取（非 git 仓库、无 remote 等），返回 null。
 */
export async function getRemoteFileUrl(
  filePath: string,
): Promise<string | null> {
  try {
    const git = simpleGit({ baseDir: dirname(filePath) });

    // 检查文件所在目录是否属于 git 仓库
    const isRepo = await git.checkIsRepo();
    if (!isRepo) return null;

    // 获取该仓库的 remote origin URL
    const remotes = await git.getRemotes(true);
    const origin = remotes.find((r) => r.name === 'origin');
    if (!origin?.refs?.fetch) return null;

    const repoUrl = origin.refs.fetch;
    const { owner, repo } = parseGitHubUrl(repoUrl);
    if (!owner || !repo) return null;

    // 获取当前分支名
    const branch = await git.revparse(['--abbrev-ref', 'HEAD']);

    // 获取该仓库根目录，计算文件相对路径
    const gitRoot = (await git.revparse(['--show-toplevel'])).trim();
    const relPath = relative(gitRoot, filePath).replace(/\\/g, '/');

    return `https://github.com/${owner}/${repo}/blob/${branch}/${relPath}`;
  } catch {
    return null;
  }
}

/**
 * 解析 GitHub remote URL，提取 owner 和 repo。
 * 支持格式：
 *   https://github.com/owner/repo.git
 *   https://github.com/owner/repo
 *   git@github.com:owner/repo.git
 */
function parseGitHubUrl(
  url: string,
): { owner: string | null; repo: string | null } {
  const match =
    /(?:https:\/\/github\.com\/|git@github\.com:)([^/]+)\/([^/.]+)(?:\.git)?/.exec(
      url,
    );
  return match
    ? { owner: match[1], repo: match[2] }
    : { owner: null, repo: null };
}
