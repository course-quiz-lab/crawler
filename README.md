# Crawler — 题库抓取与索引生成工具

扫描指定目录下的 JSON 题库文件，按 [bank.schema.json](https://course-quiz-lab.github.io/json-schema/v1/bank.schema.json) 校验后，生成摘要 ID 并输出到 `dist/`，同时生成符合 [index.schema.json](https://course-quiz-lab.github.io/json-schema/v1/index.schema.json) 的索引文件。

## 快速开始

```bash
pnpm start
# 或指定目录
pnpm start --dir ./my-banks
```

## 命令行参数

| 参数    | 说明                   | 默认值   |
| ------- | ---------------------- | -------- |
| `--dir` | 题库 JSON 文件所在目录 | `./data` |

## 工作流程

1. **读取参数** — 使用 `commander` 解析 `--dir`
2. **扫描文件** — 递归查找目录下所有 `.json` 文件
3. **Schema 校验** — 从远程获取最新 [bank schema](https://course-quiz-lab.github.io/json-schema/v1/bank.schema.json)，用 `ajv` 校验
4. **生成 ID** — 对 JSON 内容做稳定序列化（key 排序），取 MD5 摘要作为唯一 ID
5. **输出文件** — `dist/[ID前2位]/[ID].json`，无缩进序列化
6. **生成索引** — 收集所有题库的元数据和题目统计，写入 `dist/index.json`
7. **输出总结** — 显示已处理数量、总题数、错误详情

## 输出结构

```txt
dist/
├── index.json              # 索引文件
├── ab/
│   └── abc123....json      # 题库文件（按 ID 前缀分目录）
└── cd/
    └── cd4567....json
```
