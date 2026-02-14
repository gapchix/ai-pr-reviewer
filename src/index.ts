#!/usr/bin/env node

import { setupCLI } from './cli';
import { getConfig } from './config';
import { GitHubService, OpenAIService, ReviewService } from './services';
import { ConsoleFormatter, FileFormatter, GitHubFormatter } from './formatters';

async function main() {
  try {
    const options = setupCLI();
    const config = getConfig();

    console.log('🚀 Starting AI PR Review...\n');

    const githubService = new GitHubService(config.githubToken);
    const openaiService = new OpenAIService(config.openaiApiKey);
    const reviewService = new ReviewService(githubService, openaiService);

    const [owner, repo] = options.repository.split('/');

    console.log(`📋 Fetching PR #${options.prNumber} from ${options.repository}...`);

    const report = await reviewService.reviewPullRequest(owner, repo, options.prNumber);

    console.log('✅ Review completed!\n');

    switch (options.output) {
      case 'console': {
        const formatter = new ConsoleFormatter();
        formatter.format(report);
        break;
      }

      case 'file': {
        const formatter = new FileFormatter();
        formatter.format(report, options.outputFile || './review-report.md');
        break;
      }

      case 'github': {
        const formatter = new GitHubFormatter(githubService);
        await formatter.format(report);
        break;
      }

      default:
        console.error('Invalid output format');
        process.exit(1);
    }

    console.log('✨ Done!\n');
  } catch (error) {
    console.error('❌ Error:', error instanceof Error ? error.message : String(error));
    process.exit(1);
  }
}

main();
