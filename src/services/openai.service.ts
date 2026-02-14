import OpenAI from 'openai';
import { PRDetails, ReviewComment } from '../types';

export class OpenAIService {
  private client: OpenAI;

  constructor(apiKey: string) {
    this.client = new OpenAI({ apiKey });
  }

  async reviewPR(prDetails: PRDetails): Promise<{
    summary: string;
    comments: ReviewComment[];
    strengths: string[];
    concerns: string[];
    recommendations: string[];
    score: number;
  }> {
    const prompt = this.buildReviewPrompt(prDetails);

    const response = await this.client.chat.completions.create({
      model: 'gpt-5.2',
      messages: [
        {
          role: 'system',
          content: 'You are an expert code reviewer. Provide thorough, constructive feedback on pull requests.',
        },
        {
          role: 'user',
          content: prompt,
        },
      ],
      temperature: 0.3,
    });

    const content = response.choices[0].message.content || '';
    return this.parseReviewResponse(content, prDetails);
  }

  private buildReviewPrompt(prDetails: PRDetails): string {
    let prompt = `Review the following pull request:\n\n`;
    prompt += `Title: ${prDetails.title}\n`;
    prompt += `Description: ${prDetails.description}\n`;
    prompt += `Author: ${prDetails.author}\n\n`;
    prompt += `Files changed (${prDetails.files.length}):\n\n`;

    for (const file of prDetails.files) {
      prompt += `\n### File: ${file.filename}\n`;
      prompt += `Status: ${file.status} (+${file.additions}/-${file.deletions})\n`;
      if (file.patch) {
        prompt += `\`\`\`diff\n${file.patch}\n\`\`\`\n`;
      }
    }

    prompt += `\n\nProvide a comprehensive code review including:\n`;
    prompt += `1. SUMMARY: Brief overview of the changes\n`;
    prompt += `2. STRENGTHS: What's good about this PR (list 2-4 points)\n`;
    prompt += `3. CONCERNS: Issues found (list with severity: critical/major/minor/suggestion)\n`;
    prompt += `4. RECOMMENDATIONS: Actionable improvements\n`;
    prompt += `5. SCORE: Rate from 1-10\n\n`;
    prompt += `Format your response clearly with these sections.`;

    return prompt;
  }

  private parseReviewResponse(
    content: string,
    prDetails: PRDetails
  ): {
    summary: string;
    comments: ReviewComment[];
    strengths: string[];
    concerns: string[];
    recommendations: string[];
    score: number;
  } {
    const sections = {
      summary: '',
      strengths: [] as string[],
      concerns: [] as string[],
      recommendations: [] as string[],
      score: 7,
    };

    const summaryMatch = content.match(/SUMMARY:?(.*?)(?=STRENGTHS:|$)/is);
    if (summaryMatch) {
      sections.summary = summaryMatch[1].trim();
    }

    const strengthsMatch = content.match(/STRENGTHS:?(.*?)(?=CONCERNS:|$)/is);
    if (strengthsMatch) {
      sections.strengths = this.extractListItems(strengthsMatch[1]);
    }

    const concernsMatch = content.match(/CONCERNS:?(.*?)(?=RECOMMENDATIONS:|$)/is);
    if (concernsMatch) {
      sections.concerns = this.extractListItems(concernsMatch[1]);
    }

    const recommendationsMatch = content.match(/RECOMMENDATIONS:?(.*?)(?=SCORE:|$)/is);
    if (recommendationsMatch) {
      sections.recommendations = this.extractListItems(recommendationsMatch[1]);
    }

    const scoreMatch = content.match(/SCORE:?\s*(\d+)/i);
    if (scoreMatch) {
      sections.score = parseInt(scoreMatch[1], 10);
    }

    const comments: ReviewComment[] = sections.concerns.map((concern) => ({
      file: prDetails.files[0]?.filename || 'general',
      body: concern,
      severity: this.determineSeverity(concern),
    }));

    return { ...sections, comments };
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

  private determineSeverity(concern: string): 'critical' | 'major' | 'minor' | 'suggestion' {
    const lowerConcern = concern.toLowerCase();
    if (lowerConcern.includes('critical') || lowerConcern.includes('security')) {
      return 'critical';
    }
    if (lowerConcern.includes('major') || lowerConcern.includes('bug')) {
      return 'major';
    }
    if (lowerConcern.includes('minor')) {
      return 'minor';
    }
    return 'suggestion';
  }
}
