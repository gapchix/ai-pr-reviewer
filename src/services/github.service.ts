import { Octokit } from "@octokit/rest";
import { PRDetails, PRFile } from "../types";

export class GitHubService {
  private octokit: Octokit;

  constructor(token: string) {
    this.octokit = new Octokit({ auth: token });
  }

  async getPRDetails(
    owner: string,
    repo: string,
    prNumber: number,
  ): Promise<PRDetails> {
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

    const prFiles: PRFile[] = files.map((file) => {
      // Extract valid line numbers from patch for commenting
      const validLines = this.extractValidLinesFromPatch(file.patch);

      return {
        filename: file.filename,
        status: file.status,
        additions: file.additions,
        deletions: file.deletions,
        changes: file.changes,
        patch: file.patch,
        validLines,
      };
    });

    return {
      number: pr.number,
      title: pr.title,
      description: pr.body || "",
      author: pr.user?.login || "unknown",
      files: prFiles,
      baseBranch: pr.base.ref,
      headBranch: pr.head.ref,
    };
  }

  private extractValidLinesFromPatch(patch?: string): number[] {
    if (!patch) return [];

    const validLines: number[] = [];
    const lines = patch.split('\n');
    let currentLine = 0;

    for (const line of lines) {
      // Match diff header like @@ -1,4 +1,5 @@
      const headerMatch = line.match(/^@@ -\d+,?\d* \+(\d+),?\d* @@/);
      if (headerMatch) {
        currentLine = parseInt(headerMatch[1], 10);
        continue;
      }

      // Lines starting with + or space are valid for commenting
      if (line.startsWith('+') || line.startsWith(' ')) {
        validLines.push(currentLine);
        currentLine++;
      } else if (line.startsWith('-')) {
        // Deleted lines don't increment the new line counter
        continue;
      }
    }

    return validLines;
  }

  async postReviewComments(
    owner: string,
    repo: string,
    prNumber: number,
    comments: Array<{ body: string; path: string; line?: number }>,
    prDetails: PRDetails,
  ): Promise<void> {
    const { data: pr } = await this.octokit.pulls.get({
      owner,
      repo,
      pull_number: prNumber,
    });

    const commentsPosted: string[] = [];
    const commentsFailed: string[] = [];

    for (const comment of comments) {
      if (comment.line) {
        // Check if the line is valid for this file
        const file = prDetails.files.find((f) => f.filename === comment.path);
        const isValidLine = file?.validLines?.includes(comment.line);

        if (!isValidLine) {
          commentsFailed.push(`${comment.path}:${comment.line} (line not in diff)`);
          continue;
        }

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
          commentsPosted.push(`${comment.path}:${comment.line}`);
        } catch (error) {
          const errorMessage =
            error instanceof Error ? error.message : "Unknown error";
          commentsFailed.push(`${comment.path}:${comment.line}`);
          console.warn(
            `⚠️  Failed to post comment on ${comment.path}:${comment.line}`,
          );
          console.warn(`   Reason: ${errorMessage}`);
          console.warn(`   Comment body: ${comment.body.substring(0, 100)}...`);
        }
      }
    }

    if (commentsPosted.length > 0) {
      console.log(`✓ Posted ${commentsPosted.length} inline comment(s)`);
    }
    if (commentsFailed.length > 0) {
      console.log(`⚠️  Skipped ${commentsFailed.length} comment(s) (lines not in diff)`);
    }
  }

  async postReviewSummary(
    owner: string,
    repo: string,
    prNumber: number,
    summary: string,
  ): Promise<void> {
    await this.octokit.pulls.createReview({
      owner,
      repo,
      pull_number: prNumber,
      body: summary,
      event: "COMMENT",
    });
  }
}
