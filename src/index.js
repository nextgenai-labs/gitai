#!/usr/bin/env node

require("dotenv").config();

const simpleGit = require("simple-git");
const axios = require("axios");

function generateCommitMessage(files) {
  const names = files.map((f) => f.path || f);

  if (names.some((f) => f.includes("README"))) {
    return "docs(readme): update README";
  }

  if (
    names.some(
      (f) =>
        f.includes("package.json") ||
        f.includes("package-lock.json")
    )
  ) {
    return "chore(deps): update dependencies";
  }

  if (names.some((f) => f.startsWith("src/"))) {
    return "feat(core): update application code";
  }

  if (names.some((f) => f.includes("test"))) {
    return "test(unit): update tests";
  }

  return `chore(repo): update ${names.length} file(s)`;
}

async function generateGeminiCommitMessage(diff) {
  try {
    const apiKey = process.env.GEMINI_API_KEY;

    if (!apiKey) {
      return null;
    }

    const response = await axios.post(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${apiKey}`,
      {
        contents: [
          {
            parts: [
              {
                text: `
Generate a short Conventional Commit message.

Rules:
- Return ONLY the commit message
- Use conventional commits format
- Keep under 80 characters

Git Diff:
${diff.slice(0, 8000)}
`,
              },
            ],
          },
        ],
      },
      {
        timeout: 15000,
      }
    );

    return (
      response.data?.candidates?.[0]?.content?.parts?.[0]?.text?.trim() ||
      null
    );
  } catch {
    return null;
  }
}

async function generateOllamaCommitMessage(diff) {
  try {
    const response = await axios.post(
      "http://127.0.0.1:11434/api/generate",
      {
        model: "qwen3:0.6b",
        prompt: `
Generate a short Conventional Commit message.

Rules:
- Return ONLY the commit message
- Use conventional commits format
- Keep under 80 characters

Git Diff:
${diff.slice(0, 8000)}
`,
        stream: false,
      },
      {
        timeout: 10000,
      }
    );

    return response.data?.response?.trim() || null;
  } catch {
    return null;
  }
}

async function main() {
  const git = simpleGit();

  try {
    const status = await git.status();

    if (status.files.length === 0) {
      console.log("No changes detected.");
      return;
    }

    const diff = await git.diff();

    let commitMessage = await generateGeminiCommitMessage(diff);

    if (!commitMessage) {
      console.log("Gemini unavailable, trying Ollama...");
      commitMessage = await generateOllamaCommitMessage(diff);
    }

    if (!commitMessage) {
      console.log("AI unavailable, using fallback generator...");
      commitMessage = generateCommitMessage(status.files);
    }

    console.log("");
    console.log("Suggested commit message:");
    console.log("");
    console.log(commitMessage);
  } catch (err) {
    console.error("Git operation failed:", err.message);
    process.exit(1);
  }
}

