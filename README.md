# AI PR Reviewer

AI-powered GitHub Pull Request code reviewer using OpenAI and GitHub REST API.

## Features

- 🤖 AI-powered code review using OpenAI GPT-4
- 📊 Multiple output formats: Console, File, GitHub comments
- 🎯 Structured review with strengths, concerns, and recommendations
- 📝 Detailed line-by-line comments
- ⭐ Overall PR quality scoring

## Installation

```bash
npm install
```

## Configuration

Create a `.env` file in the root directory:

```env
GITHUB_TOKEN=your_github_token_here
OPENAI_API_KEY=your_openai_api_key_here
```

## Usage

### Build the project

```bash
npm run build
```

### Run a review

**Console output:**
```bash
npm run review -- -r owner/repo -p 123
```

**File output:**
```bash
npm run review -- -r owner/repo -p 123 -o file -f ./my-review.md
```

**GitHub comments:**
```bash
npm run review -- -r owner/repo -p 123 -o github
```

### Command Options

- `-r, --repository <repo>` - Repository in format: owner/repo (required)
- `-p, --pr-number <number>` - Pull request number (required)
- `-o, --output <type>` - Output format: console, file, or github (default: console)
- `-f, --output-file <path>` - Output file path when using file output (default: ./review-report.md)

## Project Structure

```
src/
├── cli/              # CLI command setup
│   ├── commander.ts
│   └── index.ts
├── config/           # Configuration management
│   └── index.ts
├── formatters/       # Output formatters
│   ├── console.formatter.ts
│   ├── file.formatter.ts
│   ├── github.formatter.ts
│   └── index.ts
├── services/         # Core business logic
│   ├── github.service.ts
│   ├── openai.service.ts
│   ├── review.service.ts
│   └── index.ts
├── types/            # TypeScript type definitions
│   └── index.ts
├── utils/            # Utility functions
│   ├── parser.ts
│   └── index.ts
└── index.ts          # Main entry point
```

## License

MIT