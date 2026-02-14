import chalk from 'chalk';
import { ReviewReport } from '../types';

export class ConsoleFormatter {
  format(report: ReviewReport): void {
    console.log('\n' + chalk.bold.cyan('═'.repeat(80)));
    console.log(chalk.bold.cyan('  AI PR CODE REVIEW REPORT'));
    console.log(chalk.bold.cyan('═'.repeat(80)) + '\n');

    console.log(chalk.bold('Repository:'), chalk.white(report.repository));
    console.log(chalk.bold('PR Number:'), chalk.white(`#${report.prNumber}`));
    console.log(chalk.bold('Overall Score:'), this.formatScore(report.overallScore));
    console.log('');

    console.log(chalk.bold.yellow('━'.repeat(80)));
    console.log(chalk.bold.yellow('SUMMARY'));
    console.log(chalk.bold.yellow('━'.repeat(80)));
    console.log(chalk.white(report.summary));
    console.log('');

    if (report.strengths.length > 0) {
      console.log(chalk.bold.green('━'.repeat(80)));
      console.log(chalk.bold.green('STRENGTHS'));
      console.log(chalk.bold.green('━'.repeat(80)));
      report.strengths.forEach((strength, index) => {
        console.log(chalk.green(`  ✓ ${strength}`));
      });
      console.log('');
    }

    if (report.concerns.length > 0) {
      console.log(chalk.bold.red('━'.repeat(80)));
      console.log(chalk.bold.red('CONCERNS'));
      console.log(chalk.bold.red('━'.repeat(80)));
      report.concerns.forEach((concern, index) => {
        console.log(chalk.red(`  ✗ ${concern}`));
      });
      console.log('');
    }

    if (report.recommendations.length > 0) {
      console.log(chalk.bold.blue('━'.repeat(80)));
      console.log(chalk.bold.blue('RECOMMENDATIONS'));
      console.log(chalk.bold.blue('━'.repeat(80)));
      report.recommendations.forEach((rec, index) => {
        console.log(chalk.blue(`  → ${rec}`));
      });
      console.log('');
    }

    if (report.comments.length > 0) {
      console.log(chalk.bold.magenta('━'.repeat(80)));
      console.log(chalk.bold.magenta('DETAILED COMMENTS'));
      console.log(chalk.bold.magenta('━'.repeat(80)));
      report.comments.forEach((comment, index) => {
        const severityColor = this.getSeverityColor(comment.severity);
        console.log(severityColor(`  [${comment.severity.toUpperCase()}] ${comment.file}`));
        console.log(chalk.white(`    ${comment.body}`));
        if (comment.line) {
          console.log(chalk.gray(`    Line: ${comment.line}`));
        }
        console.log('');
      });
    }

    console.log(chalk.bold.cyan('═'.repeat(80)) + '\n');
  }

  private formatScore(score: number): string {
    if (score >= 8) {
      return chalk.green.bold(`${score}/10 ⭐`);
    } else if (score >= 6) {
      return chalk.yellow.bold(`${score}/10`);
    } else {
      return chalk.red.bold(`${score}/10`);
    }
  }

  private getSeverityColor(severity: string): (text: string) => string {
    switch (severity) {
      case 'critical':
        return chalk.red.bold;
      case 'major':
        return chalk.red;
      case 'minor':
        return chalk.yellow;
      case 'suggestion':
        return chalk.blue;
      default:
        return chalk.white;
    }
  }
}
