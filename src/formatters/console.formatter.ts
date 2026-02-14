import chalk from "chalk";
import { ReviewReport } from "../types";

export class ConsoleFormatter {
  format(report: ReviewReport): void {
    console.log("\n" + chalk.bold.cyan("═".repeat(80)));
    console.log(chalk.bold.cyan("  🤖 AI PR CODE REVIEW REPORT"));
    console.log(chalk.bold.cyan("═".repeat(80)) + "\n");

    console.log(chalk.bold("Repository:"), chalk.white(report.repository));
    console.log(chalk.bold("PR Number:"), chalk.white(`#${report.prNumber}`));
    console.log(
      chalk.bold("Overall Score:"),
      this.formatScore(report.overallScore),
    );
    console.log("");

    // Summary
    console.log(chalk.bold.blue("━".repeat(80)));
    console.log(chalk.bold.blue("📋 SUMMARY"));
    console.log(chalk.bold.blue("━".repeat(80)));
    console.log(chalk.white(report.summary));
    console.log("");

    // Critical Issues
    if (report.critical.length > 0) {
      console.log(chalk.bold.red("━".repeat(80)));
      console.log(chalk.bold.red("🚨 CRITICAL ISSUES (Must fix before merge)"));
      console.log(chalk.bold.red("━".repeat(80)));
      report.critical.forEach((issue, index) => {
        console.log(
          chalk.red.bold(
            `  ${index + 1}. ${issue.file}${issue.line ? `:${issue.line}` : ""}`,
          ),
        );
        console.log(chalk.red(`     ${issue.body}`));
        console.log("");
      });
    } else {
      console.log(chalk.bold.green("━".repeat(80)));
      console.log(chalk.bold.green("🚨 CRITICAL ISSUES"));
      console.log(chalk.bold.green("━".repeat(80)));
      console.log(chalk.green("  ✓ No critical issues found"));
      console.log("");
    }

    // Warnings
    if (report.warnings.length > 0) {
      console.log(chalk.bold.yellow("━".repeat(80)));
      console.log(chalk.bold.yellow("⚠️  WARNINGS (Should be addressed)"));
      console.log(chalk.bold.yellow("━".repeat(80)));
      report.warnings.forEach((warning, index) => {
        console.log(
          chalk.yellow(
            `  ${index + 1}. ${warning.file}${warning.line ? `:${warning.line}` : ""}`,
          ),
        );
        console.log(chalk.white(`     ${warning.body}`));
        console.log("");
      });
    } else {
      console.log(chalk.bold.green("━".repeat(80)));
      console.log(chalk.bold.green("⚠️  WARNINGS"));
      console.log(chalk.bold.green("━".repeat(80)));
      console.log(chalk.green("  ✓ No warnings found"));
      console.log("");
    }

    // Good Points
    if (report.good.length > 0) {
      console.log(chalk.bold.green("━".repeat(80)));
      console.log(chalk.bold.green("✅ GOOD PRACTICES"));
      console.log(chalk.bold.green("━".repeat(80)));
      report.good.forEach((item, index) => {
        console.log(chalk.green(`  ✓ ${item}`));
      });
      console.log("");
    }

    console.log(chalk.bold.cyan("═".repeat(80)) + "\n");
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
      case "critical":
        return chalk.red.bold;
      case "major":
        return chalk.red;
      case "minor":
        return chalk.yellow;
      case "suggestion":
        return chalk.blue;
      default:
        return chalk.white;
    }
  }
}
