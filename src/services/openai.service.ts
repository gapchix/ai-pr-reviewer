import OpenAI from 'openai';
import { PRDetails, ReviewComment } from '../types';

export class OpenAIService {
  private client: OpenAI;

  constructor(apiKey: string) {
    this.client = new OpenAI({ apiKey });
  }

  async reviewPR(prDetails: PRDetails): Promise<{
    summary: string;
    critical: ReviewComment[];
    warnings: ReviewComment[];
    good: string[];
    score: number;
  }> {
    const prompt = this.buildReviewPrompt(prDetails);

    const response = await this.client.chat.completions.create({
      model: process.env.OPENAI_MODEL || 'gpt-4o-mini',
      messages: [
        {
          role: 'system',
          content: 'You are a senior software engineer conducting a thorough code review. Focus on identifying critical issues, potential bugs, and highlighting good practices.',
        },
        {
          role: 'user',
          content: prompt,
        },
      ],
      temperature: 0.2,
    });

    const content = response.choices[0].message.content || '';
    return this.parseReviewResponse(content, prDetails);
  }

  private buildReviewPrompt(prDetails: PRDetails): string {
    let prompt = `Conduct a thorough code review for the following pull request.\n\n`;
    prompt += `Title: ${prDetails.title}\n`;
    prompt += `Description: ${prDetails.description}\n`;
    prompt += `Author: ${prDetails.author}\n`;
    prompt += `Base: ${prDetails.baseBranch} → Head: ${prDetails.headBranch}\n\n`;
    prompt += `Files changed: ${prDetails.files.length}\n\n`;

    for (const file of prDetails.files) {
      prompt += `\n### File: ${file.filename}\n`;
      prompt += `Status: ${file.status} | Changes: +${file.additions}/-${file.deletions}\n`;
      if (file.patch) {
        prompt += `\`\`\`diff\n${file.patch}\n\`\`\`\n`;
      }
    }

    prompt += `\n\n## Review Instructions\n\n`;
    prompt += `Analyze this PR and provide feedback in the following structure:\n\n`;

    prompt += `1. SUMMARY (2-3 sentences)\n`;
    prompt += `   - Brief overview of what this PR accomplishes\n`;
    prompt += `   - Overall assessment of code quality\n\n`;

    prompt += `2. 🚨 CRITICAL (Must be fixed before merge)\n`;
    prompt += `   - Security vulnerabilities\n`;
    prompt += `   - Critical bugs or logic errors\n`;
    prompt += `   - Breaking changes without proper migration\n`;
    prompt += `   - Data loss risks\n`;
    prompt += `   Format: "- [FILE:LINE] Description of critical issue"\n\n`;

    prompt += `3. ⚠️ WARNINGS (Should be addressed)\n`;
    prompt += `   - Potential bugs or edge cases\n`;
    prompt += `   - Performance issues\n`;
    prompt += `   - Code smells or anti-patterns\n`;
    prompt += `   - Missing error handling\n`;
    prompt += `   - Poor naming or unclear logic\n`;
    prompt += `   Format: "- [FILE:LINE] Description of warning"\n\n`;

    prompt += `4. ✅ GOOD (Positive aspects)\n`;
    prompt += `   - Well-implemented features\n`;
    prompt += `   - Good test coverage\n`;
    prompt += `   - Clean code practices\n`;
    prompt += `   - Proper documentation\n`;
    prompt += `   Format: "- Description of what's good"\n\n`;

    prompt += `5. SCORE (1-10)\n`;
    prompt += `   - Rate the overall quality of this PR\n\n`;

    prompt += `Be specific, actionable, and constructive. If a section has no items, write "None found."\n`;

    return prompt;
  }

  private parseReviewResponse(
    content: string,
    prDetails: PRDetails
  ): {
    summary: string;
    critical: ReviewComment[];
    warnings: ReviewComment[];
    good: string[];
    score: number;
  } {
    const sections = {
      summary: '',
      critical: [] as ReviewComment[],
      warnings: [] as ReviewComment[],
      good: [] as string[],
      score: 7,
    };

    // Extract summary
    const summaryMatch = content.match(/SUMMARY[:\s]*(.*?)(?=🚨|CRITICAL|$)/is);
    if (summaryMatch) {
      sections.summary = summaryMatch[1].trim();
    }

    // Extract critical issues
    const criticalMatch = content.match(/🚨\s*CRITICAL[:\s]*(.*?)(?=⚠️|WARNINGS|$)/is);
    if (criticalMatch) {
      const items = this.extractListItems(criticalMatch[1]);
      sections.critical = items.map((item) => this.parseCommentItem(item, 'critical', prDetails));
    }

    // Extract warnings
    const warningsMatch = content.match(/⚠️\s*WARNINGS[:\s]*(.*?)(?=✅|GOOD|$)/is);
    if (warningsMatch) {
      const items = this.extractListItems(warningsMatch[1]);
      sections.warnings = items.map((item) => this.parseCommentItem(item, 'major', prDetails));
    }

    // Extract good points
    const goodMatch = content.match(/✅\s*GOOD[:\s]*(.*?)(?=SCORE|$)/is);
    if (goodMatch) {
      sections.good = this.extractListItems(goodMatch[1]);
    }

    // Extract score
    const scoreMatch = content.match(/SCORE[:\s]*(\d+)/i);
    if (scoreMatch) {
      sections.score = parseInt(scoreMatch[1], 10);
    }

    return sections;
  }

  private extractListItems(text: string): string[] {
    const lines = text
      .split('\n')
      .map((line) => line.trim())
      .filter((line) => line.length > 0);

    return lines
      .filter((line) => /^[-*•\d.]/.test(line))
      .map((line) => line.replace(/^[-*•\d.]+\s*/, '').trim());
  }

  private parseCommentItem(
    item: string,
    severity: 'critical' | 'major',
    prDetails: PRDetails
  ): ReviewComment {
    // Try to extract [FILE:LINE] format
    const fileLineMatch = item.match(/\[([^\]]+):(\d+)\]\s*(.*)/);
    if (fileLineMatch) {
      return {
        file: fileLineMatch[1],
        line: parseInt(fileLineMatch[2], 10),
        body: fileLineMatch[3].trim(),
        severity,
      };
    }

    // Try to extract [FILE] format
    const fileMatch = item.match(/\[([^\]]+)\]\s*(.*)/);
    if (fileMatch) {
      return {
        file: fileMatch[1],
        body: fileMatch[2].trim(),
        severity,
      };
    }

    // No file specified, use first file or general
    return {
      file: prDetails.files[0]?.filename || 'general',
      body: item,
      severity,
    };
  }
}
