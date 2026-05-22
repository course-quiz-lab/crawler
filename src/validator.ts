import Ajv, { type AnySchema, type ValidateFunction } from 'ajv';
import addFormats from 'ajv-formats';
import { get } from 'node:https';

const SCHEMA_URL =
  'https://course-quiz-lab.github.io/json-schema/v1/bank.schema.json';

let _validate: ValidateFunction<unknown> | null = null;

export interface ValidationResult {
  valid: boolean;
  errors: string[];
}

/**
 * 使用 node:https 获取远程 JSON，带重试逻辑。
 * fetch 在某些 Windows 环境存在 TLS 证书问题，改用 node:https。
 */
function fetchJson(url: string, retries = 3): Promise<unknown> {
  return new Promise((resolve, reject) => {
    const attempt = (remaining: number) => {
      get(url, (res) => {
        if (!res.statusCode || res.statusCode < 200 || res.statusCode >= 300) {
          reject(new Error(`HTTP ${res.statusCode}`));
          return;
        }
        const chunks: Buffer[] = [];
        res.on('data', (chunk: Buffer) => chunks.push(chunk));
        res.on('end', () => {
          try {
            resolve(JSON.parse(Buffer.concat(chunks).toString('utf-8')));
          } catch (e) {
            reject(e);
          }
        });
        res.on('error', (err) => {
          if (remaining > 0) {
            setTimeout(() => attempt(remaining - 1), 1000);
          } else {
            reject(err);
          }
        });
      }).on('error', (err) => {
        if (remaining > 0) {
          setTimeout(() => attempt(remaining - 1), 1000);
        } else {
          reject(err);
        }
      });
    };
    attempt(retries);
  });
}

/**
 * 获取编译好的 bank schema 校验函数。
 * 始终从远程 URL 获取以保证使用最新版本的 schema。
 */
async function getValidator(): Promise<ValidateFunction<unknown>> {
  if (_validate) return _validate;

  const schema = await fetchJson(SCHEMA_URL);

  const ajv = new Ajv({
    allErrors: true,
    strict: false,
    validateSchema: false, // 跳过 $schema 引用的外部 meta schema 校验
  });
  addFormats(ajv);
  _validate = ajv.compile(schema as AnySchema);
  return _validate;
}

/**
 * 校验数据是否符合 bank schema
 */
export async function validateBank(data: unknown): Promise<ValidationResult> {
  const validate = await getValidator();
  const valid = validate(data);

  if (!valid && validate.errors) {
    return {
      valid: false,
      errors: validate.errors.map(
        (e) => `路径 ${e.instancePath || '/'}: ${e.message}`,
      ),
    };
  }

  return { valid: true, errors: [] };
}
