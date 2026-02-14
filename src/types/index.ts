export interface PRDetails {
  number: number;
  title: string;
  description: string;
  author: string;
  files: PRFile[];
  baseBranch: string;
  headBranch: string;
}

export interface PRFile {
  filename: string;
  status: string;
  additions: number;
  deletions: number;
  changes: number;
  patch?: string;
}

export interface ReviewComment {
  file: string;
  line?: number;
  body: string;
  severity: 'critical' | 'major' | 'minor' | 'suggestion';
}

export interface ReviewReport {
  prNumber: number;
  repository: string;
  summary: string;
  overallScore: number;
  critical: ReviewComment[];
  warnings: ReviewComment[];
  good: string[];
}

export interface CLIOptions {
  repository: string;
  prNumber: number;
  output: 'console' | 'file' | 'github';
  outputFile?: string;
}

export interface Config {
  githubToken: string;
  openaiApiKey: string;
}
