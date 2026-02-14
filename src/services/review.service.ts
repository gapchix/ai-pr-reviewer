import { GitHubService } from './github.service';
import { OpenAIService } from './openai.service';
import { ReviewReport } from '../types';

export class ReviewService {
  constructor(
    private githubService: GitHubService,
    private openaiService: OpenAIService
  ) {}

  async reviewPullRequest(owner: string, repo: string, prNumber: number): Promise<ReviewReport> {
    const prDetails = await this.githubService.getPRDetails(owner, repo, prNumber);

    const review = await this.openaiService.reviewPR(prDetails);

    const report: ReviewReport = {
      prNumber,
      repository: `${owner}/${repo}`,
      summary: review.summary,
      overallScore: review.score,
      comments: review.comments,
      strengths: review.strengths,
      concerns: review.concerns,
      recommendations: review.recommendations,
    };

    return report;
  }
}
