#!/usr/bin/env node
import { spawnSync } from "node:child_process";
import { pathToFileURL } from "node:url";

export const QUERY = `query(
  $owner: String!,
  $repo: String!,
  $number: Int!,
  $commentsCursor: String,
  $reviewsCursor: String,
  $threadsCursor: String
) {
  repository(owner: $owner, name: $repo) {
    pullRequest(number: $number) {
      number
      url
      title
      state

      comments(first: 100, after: $commentsCursor) {
        pageInfo { hasNextPage endCursor }
        nodes {
          id
          body
          createdAt
          updatedAt
          author { login }
        }
      }

      reviews(first: 100, after: $reviewsCursor) {
        pageInfo { hasNextPage endCursor }
        nodes {
          id
          state
          body
          submittedAt
          author { login }
        }
      }

      reviewThreads(first: 100, after: $threadsCursor) {
        pageInfo { hasNextPage endCursor }
        nodes {
          id
          isResolved
          isOutdated
          path
          line
          diffSide
          startLine
          startDiffSide
          originalLine
          originalStartLine
          resolvedBy { login }
          comments(first: 100) {
            nodes {
              id
              body
              createdAt
              updatedAt
              author { login }
            }
          }
        }
      }
    }
  }
}
`;

function runCommand(args, { input = null } = {}) {
  const result = spawnSync(args[0], args.slice(1), {
    input,
    encoding: "utf-8",
  });
  if (result.status !== 0) {
    throw new Error(`Command failed: ${args.join(" ")}\n${result.stderr}`);
  }
  return result.stdout;
}

function runJson(args, options = {}) {
  const output = runCommand(args, options);
  try {
    return JSON.parse(output);
  } catch (error) {
    throw new Error(`Failed to parse JSON from command output: ${error.message}\nRaw:\n${output}`);
  }
}

export function buildGraphqlArgs(owner, repo, number, cursors = {}) {
  const args = [
    "gh",
    "api",
    "graphql",
    "-F",
    "query=@-",
    "-F",
    `owner=${owner}`,
    "-F",
    `repo=${repo}`,
    "-F",
    `number=${number}`,
  ];
  if (cursors.commentsCursor) {
    args.push("-F", `commentsCursor=${cursors.commentsCursor}`);
  }
  if (cursors.reviewsCursor) {
    args.push("-F", `reviewsCursor=${cursors.reviewsCursor}`);
  }
  if (cursors.threadsCursor) {
    args.push("-F", `threadsCursor=${cursors.threadsCursor}`);
  }
  return args;
}

export function ensureGhAuthenticated() {
  try {
    runCommand(["gh", "auth", "status"]);
  } catch {
    console.error("run `gh auth login` to authenticate the GitHub CLI");
    throw new Error("gh auth status failed; run `gh auth login` to authenticate the GitHub CLI");
  }
}

export function ghPrViewJson(fields) {
  return runJson(["gh", "pr", "view", "--json", fields]);
}

export function getCurrentPrRef() {
  const pr = ghPrViewJson("number,headRepositoryOwner,headRepository");
  return {
    owner: pr.headRepositoryOwner.login,
    repo: pr.headRepository.name,
    number: Number.parseInt(String(pr.number), 10),
  };
}

export function ghApiGraphql(owner, repo, number, cursors = {}) {
  return runJson(buildGraphqlArgs(owner, repo, number, cursors), { input: QUERY });
}

export function collectPrPage(payload, owner, repo, prMeta) {
  if (payload.errors?.length) {
    throw new Error(`GitHub GraphQL errors:\n${JSON.stringify(payload.errors, null, 2)}`);
  }
  const pr = payload.data.repository.pullRequest;
  return {
    prMeta: prMeta ?? {
      number: pr.number,
      url: pr.url,
      title: pr.title,
      state: pr.state,
      owner,
      repo,
    },
    comments: pr.comments,
    reviews: pr.reviews,
    reviewThreads: pr.reviewThreads,
  };
}

export function fetchAll(owner, repo, number) {
  const conversationComments = [];
  const reviews = [];
  const reviewThreads = [];

  let commentsCursor = null;
  let reviewsCursor = null;
  let threadsCursor = null;
  let prMeta = null;

  while (true) {
    const page = collectPrPage(
      ghApiGraphql(owner, repo, number, { commentsCursor, reviewsCursor, threadsCursor }),
      owner,
      repo,
      prMeta,
    );
    prMeta = page.prMeta;

    conversationComments.push(...(page.comments.nodes ?? []));
    reviews.push(...(page.reviews.nodes ?? []));
    reviewThreads.push(...(page.reviewThreads.nodes ?? []));

    commentsCursor = page.comments.pageInfo.hasNextPage ? page.comments.pageInfo.endCursor : null;
    reviewsCursor = page.reviews.pageInfo.hasNextPage ? page.reviews.pageInfo.endCursor : null;
    threadsCursor = page.reviewThreads.pageInfo.hasNextPage ? page.reviewThreads.pageInfo.endCursor : null;

    if (!commentsCursor && !reviewsCursor && !threadsCursor) {
      break;
    }
  }

  if (!prMeta) {
    throw new Error("No pull request metadata returned.");
  }
  return {
    pull_request: prMeta,
    conversation_comments: conversationComments,
    reviews,
    review_threads: reviewThreads,
  };
}

export function main() {
  ensureGhAuthenticated();
  const { owner, repo, number } = getCurrentPrRef();
  const result = fetchAll(owner, repo, number);
  console.log(JSON.stringify(result, null, 2));
  return 0;
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  try {
    process.exitCode = main();
  } catch (error) {
    console.error(error.message);
    process.exitCode = 1;
  }
}
