/** 题库元数据 */
export interface BankMetadata {
  name: string;
  course: string;
  author: string;
  source?: string;
}

/** 题目类型 */
export type QuestionType = 'single' | 'multiple' | 'indeterminate' | 'judge';

/** 题目基础字段 */
export interface QuestionBase {
  type: QuestionType;
  stem: string;
  analysis?: string;
  difficulty?: string;
}

/** 单项选择题 */
export interface SingleChoice extends QuestionBase {
  type: 'single';
  options: string[];
  answer: number;
}

/** 多项选择题 */
export interface MultipleChoice extends QuestionBase {
  type: 'multiple';
  options: string[];
  answer: number[];
}

/** 不定项选择题 */
export interface IndeterminateChoice extends QuestionBase {
  type: 'indeterminate';
  options: string[];
  answer: number[];
}

/** 判断题 */
export interface JudgeQuestion extends QuestionBase {
  type: 'judge';
  answer: boolean;
}

/** 题目联合类型 */
export type Question =
  | SingleChoice
  | MultipleChoice
  | IndeterminateChoice
  | JudgeQuestion;

/** 题库根对象 */
export interface Bank {
  $schema?: string;
  metadata: BankMetadata;
  questions: Question[];
}

/** 题目数量统计 */
export interface QuestionCount {
  single: number;
  multiple: number;
  indeterminate: number;
  judge: number;
}

/** 题库索引条目 */
export interface BankIndex {
  metadata: BankMetadata;
  count: QuestionCount;
  url: string;
}

/** 题库索引根对象 */
export interface IndexFile {
  $schema: string;
  banks: BankIndex[];
  updatedAt: string;
}

/** 处理错误信息 */
export interface ProcessError {
  file: string;
  errors: string[];
}
