import * as dotenv from 'dotenv';
import { Config } from '../types';

dotenv.config();

export function getConfig(): Config {
  const githubToken = process.env.GITHUB_TOKEN;
  const openaiApiKey = process.env.OPENAI_API_KEY;

  if (!githubToken) {
    throw new Error('GITHUB_TOKEN is required in .env file');
  }

  if (!openaiApiKey) {
    throw new Error('OPENAI_API_KEY is required in .env file');
  }

  return {
    githubToken,
    openaiApiKey,
  };
}

export * from '../types';
