import { Command } from 'commander';
import { CLIOptions } from '../types';

export function setupCLI(): CLIOptions {
  const program = new Command();

  program
    .name('ai-pr-review')
    .description('AI-powered GitHub PR code reviewer')
    .version('1.0.0')
    .requiredOption('-r, --repository <repo>', 'Repository in format: owner/repo')
    .requiredOption('-p, --pr-number <number>', 'Pull request number', parseInt)
    .option(
      '-o, --output <type>',
      'Output format: console, file, or github',
      'console'
    )
    .option(
      '-f, --output-file <path>',
      'Output file path (when using file output)',
      './review-report.md'
    );

  program.parse(process.argv);

  const options = program.opts();

  if (!['console', 'file', 'github'].includes(options.output)) {
    console.error('Error: Output must be one of: console, file, github');
    process.exit(1);
  }

  const [owner, repo] = options.repository.split('/');
  if (!owner || !repo) {
    console.error('Error: Repository must be in format: owner/repo');
    process.exit(1);
  }

  return {
    repository: options.repository,
    prNumber: options.prNumber,
    output: options.output as 'console' | 'file' | 'github',
    outputFile: options.outputFile,
  };
}
