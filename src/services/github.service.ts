import { Octokit } from '@octokit/rest';
import { PRDetails, PRFile } from '../types';

export class GitHubService {
  private octokit: Octokit;

  constructor(token: string) {
    this.octokit = new Octokit({ auth: token });
  }

  async getPRDetails(owner: string, repo: string, prNumber: number): Promise<PRDetails> {
    const { data: pr } = await this.octokit.pulls.get({
      owner,
      repo,
      pull_number: prNumber,
    });

    const { data: files } = await this.octokit.pulls.listFiles({
      owner,
      repo,
      pull_number: prNumber,
    });

    const prFiles: PRFile[] = files.map((file) => ({
      filename: file.filename,
      status: file.status,
      additions: file.additions,
      deletions: file.deletions,
      changes: file.changes,
      patch: file.patch,
    }));

    return {
      number: pr.number,
      title: pr.title,
      description: pr.body || '',
      author: pr.user?.login || 'unknown',
      files: prFiles,
      baseBranch: pr.base.ref,
      headBranch: pr.head.ref,
    };
  }

  async postReviewComments(
    owner: string,
    repo: string,
    prNumber: number,
    comments: Array<{ body: string; path: string; line?: number }>
  ): Promise<void> {
    const { data: pr } = await this.octokit.pulls.get({
      owner,
      repo,
      pull_number: prNumber,
    });

    for (const comment of comments) {
      if (comment.line) {
        try {
          await this.octokit.pulls.createReviewComment({
            owner,
            repo,
            pull_number: prNumber,
            body: comment.body,
            path: comment.path,
            commit_id: pr.head.sha,
            line: comment.line,
          });
        } catch (error) {
          console.error(`Failed to post comment on ${comment.path}:${comment.line}`, error);
        }
      }
    }
  }

  async postReviewSummary(owner: string, repo: string, prNumber: number, summary: string): Promise<void> {
    await this.octokit.pulls.createReview({
      owner,
      repo,
      pull_number: prNumber,
      body: summary,
      event: 'COMMENT',
    });
  }
}
