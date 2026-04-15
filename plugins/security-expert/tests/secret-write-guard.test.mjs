import test from "node:test";
import assert from "node:assert/strict";
import { run } from "../hooks/pre-tool-use/edit-write/secret-write-guard.mjs";

function payload(file_path) {
  return { tool_input: { file_path } };
}

// ── Block 级：.env 文件 ──

test("拦截写入 .env 文件", async () => {
  const result = await run(payload("/app/.env"));
  assert.equal(result?.decision, "block");
  assert.match(result.reason, /\.env/);
});

test("拦截写入 .env.production 文件", async () => {
  const result = await run(payload("/app/.env.production"));
  assert.equal(result?.decision, "block");
});

test("拦截写入 .env.local 文件", async () => {
  const result = await run(payload("/app/.env.local"));
  assert.equal(result?.decision, "block");
});

// ── 白名单：.env 模板文件放行 ──

test("放行 .env.example 文件", async () => {
  const result = await run(payload("/app/.env.example"));
  assert.equal(result, null);
});

test("放行 .env.template 文件", async () => {
  const result = await run(payload("/app/.env.template"));
  assert.equal(result, null);
});

test("放行 .env.sample 文件", async () => {
  const result = await run(payload("/app/.env.sample"));
  assert.equal(result, null);
});

// ── Block 级：私钥和证书 ──

test("拦截写入 .pem 文件", async () => {
  const result = await run(payload("/etc/ssl/private/server.pem"));
  assert.equal(result?.decision, "block");
  assert.match(result.reason, /\.pem/);
});

test("拦截写入 .key 文件", async () => {
  const result = await run(payload("/etc/ssl/private/server.key"));
  assert.equal(result?.decision, "block");
});

test("拦截写入 .p12 文件", async () => {
  const result = await run(payload("/certs/client.p12"));
  assert.equal(result?.decision, "block");
});

test("拦截写入 .pfx 文件", async () => {
  const result = await run(payload("/certs/client.pfx"));
  assert.equal(result?.decision, "block");
});

test("拦截写入 .jks 文件", async () => {
  const result = await run(payload("/opt/java/keystore.jks"));
  assert.equal(result?.decision, "block");
});

test("拦截写入 .keystore 文件", async () => {
  const result = await run(payload("/opt/java/app.keystore"));
  assert.equal(result?.decision, "block");
});

// ── Block 级：SSH 密钥 ──

test("拦截写入 id_rsa", async () => {
  const result = await run(payload("/home/user/.ssh/id_rsa"));
  assert.equal(result?.decision, "block");
  assert.match(result.reason, /SSH/);
});

test("拦截写入 id_ed25519", async () => {
  const result = await run(payload("/home/user/.ssh/id_ed25519"));
  assert.equal(result?.decision, "block");
});

test("拦截写入 .ssh 目录下的文件", async () => {
  const result = await run(payload("/home/user/.ssh/config"));
  assert.equal(result?.decision, "block");
  assert.match(result.reason, /\.ssh/);
});

// ── Block 级：凭据文件 ──

test("拦截写入 credentials.json", async () => {
  const result = await run(payload("/app/credentials.json"));
  assert.equal(result?.decision, "block");
});

test("拦截写入 .aws/credentials", async () => {
  const result = await run(payload("/home/user/.aws/credentials"));
  assert.equal(result?.decision, "block");
});

test("拦截写入 .docker/config.json", async () => {
  const result = await run(payload("/home/user/.docker/config.json"));
  assert.equal(result?.decision, "block");
});

test("拦截写入 .npmrc", async () => {
  const result = await run(payload("/home/user/.npmrc"));
  assert.equal(result?.decision, "block");
});

test("拦截写入 .pypirc", async () => {
  const result = await run(payload("/home/user/.pypirc"));
  assert.equal(result?.decision, "block");
});

test("拦截写入 .netrc", async () => {
  const result = await run(payload("/home/user/.netrc"));
  assert.equal(result?.decision, "block");
});

test("拦截写入 .git-credentials", async () => {
  const result = await run(payload("/home/user/.git-credentials"));
  assert.equal(result?.decision, "block");
});

test("拦截写入 htpasswd", async () => {
  const result = await run(payload("/etc/nginx/htpasswd"));
  assert.equal(result?.decision, "block");
});

test("拦截写入 service_account_key", async () => {
  const result = await run(payload("/app/service_account_key.json"));
  assert.equal(result?.decision, "block");
});

// ── Report 级：文件名含敏感关键词 ──

test("报告写入含 secret 的文件", async () => {
  const result = await run(payload("/app/config/db-secret.yaml"));
  assert.equal(result?.decision, "report");
  assert.match(result.reason, /secret/);
});

test("报告写入含 credential 的文件", async () => {
  const result = await run(payload("/app/user-credential.txt"));
  assert.equal(result?.decision, "report");
});

test("报告写入含 token 的文件", async () => {
  const result = await run(payload("/app/auth-token.json"));
  assert.equal(result?.decision, "report");
});

test("报告写入含 password 的文件", async () => {
  const result = await run(payload("/app/password.txt"));
  assert.equal(result?.decision, "report");
});

test("报告写入含 apikey 的文件", async () => {
  const result = await run(payload("/app/apikey.conf"));
  assert.equal(result?.decision, "report");
});

test("报告写入含 api_key 的文件", async () => {
  const result = await run(payload("/app/api_key.json"));
  assert.equal(result?.decision, "report");
});

// ── 白名单：测试/文档/模板目录放行 ──

test("放行 tests/ 目录下的 .env 文件", async () => {
  const result = await run(payload("/app/tests/.env"));
  assert.equal(result, null);
});

test("放行 __tests__/ 目录下的敏感文件", async () => {
  const result = await run(payload("/app/__tests__/fixtures/.env"));
  assert.equal(result, null);
});

test("放行 fixtures/ 目录下的密钥文件", async () => {
  const result = await run(payload("/app/fixtures/test.pem"));
  assert.equal(result, null);
});

test("放行 examples/ 目录下的文件", async () => {
  const result = await run(payload("/app/examples/.env"));
  assert.equal(result, null);
});

test("放行 docs/ 目录下的文件", async () => {
  const result = await run(payload("/app/docs/credentials.json"));
  assert.equal(result, null);
});

test("放行 .md 文档文件", async () => {
  const result = await run(payload("/app/secret.md"));
  assert.equal(result, null);
});

test("放行 templates/ 目录下的文件", async () => {
  const result = await run(payload("/app/templates/.env"));
  assert.equal(result, null);
});

// ── 允许：普通文件 ──

test("允许写入普通 TypeScript 文件", async () => {
  const result = await run(payload("/app/src/index.ts"));
  assert.equal(result, null);
});

test("允许写入 package.json", async () => {
  const result = await run(payload("/app/package.json"));
  assert.equal(result, null);
});

test("允许写入普通 YAML 配置", async () => {
  const result = await run(payload("/app/config/database.yaml"));
  assert.equal(result, null);
});

// ── 边界情况 ──

test("空 payload 不崩溃", async () => {
  const result = await run({});
  assert.equal(result, null);
});

test("无 file_path 不崩溃", async () => {
  const result = await run({ tool_input: {} });
  assert.equal(result, null);
});

test("null payload 不崩溃", async () => {
  const result = await run(null);
  assert.equal(result, null);
});
