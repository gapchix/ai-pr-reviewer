import { GitHubService } from "./github.service";
import { OpenAIService } from "./openai.service";
import { ReviewReport, PRDetails } from "../types";

export class ReviewService {
  constructor(
    private githubService: GitHubService,
    private openaiService: OpenAIService,
  ) {}

  async reviewPullRequest(
    owner: string,
    repo: string,
    prNumber: number,
  ): Promise<{ report: ReviewReport; prDetails: PRDetails }> {
    const prDetails = await this.githubService.getPRDetails(
      owner,
      repo,
      prNumber,
    );

    const review = await this.openaiService.reviewPR(prDetails);

    const report: ReviewReport = {
      prNumber,
      repository: `${owner}/${repo}`,
      summary: review.summary,
      overallScore: review.score,
      critical: review.critical,
      warnings: review.warnings,
      good: review.good,
    };

    return { report, prDetails };
  }
}
