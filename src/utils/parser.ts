export function parseRepository(repoString: string): { owner: string; repo: string } {
  const [owner, repo] = repoString.split('/');

  if (!owner || !repo) {
    throw new Error('Repository must be in format: owner/repo');
  }

  return { owner, repo };
}

export function validatePRNumber(prNumber: number): void {
  if (!Number.isInteger(prNumber) || prNumber <= 0) {
    throw new Error('PR number must be a positive integer');
  }
}
