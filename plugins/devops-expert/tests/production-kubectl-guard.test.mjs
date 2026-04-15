import test from "node:test";
import assert from "node:assert/strict";
import { run } from "../hooks/pre-tool-use/bash/production-kubectl-guard.mjs";

function payload(command) {
  return { tool_input: { command } };
}

// ── 无条件 block：kubectl drain ──

test("拦截 kubectl drain（任何环境）", async () => {
  const result = await run(payload("kubectl drain node-1"));
  assert.equal(result?.decision, "block");
  assert.match(result.reason, /drain/);
});

test("拦截 kubectl drain 带 --ignore-daemonsets", async () => {
  const result = await run(payload("kubectl drain node-1 --ignore-daemonsets"));
  assert.equal(result?.decision, "block");
});

// ── 无条件 block：kubectl cordon ──

test("拦截 kubectl cordon（任何环境）", async () => {
  const result = await run(payload("kubectl cordon node-2"));
  assert.equal(result?.decision, "block");
  assert.match(result.reason, /cordon/);
});

// ── 无条件 block：kubectl apply -f URL ──

test("拦截 kubectl apply -f https URL", async () => {
  const result = await run(payload("kubectl apply -f https://raw.githubusercontent.com/k8s/deploy.yaml"));
  assert.equal(result?.decision, "block");
  assert.match(result.reason, /远程/);
});

test("拦截 kubectl apply -f http URL", async () => {
  const result = await run(payload("kubectl apply -f http://example.com/manifest.yaml"));
  assert.equal(result?.decision, "block");
});

// ── 生产上下文 block：kubectl exec -it ──

test("拦截生产环境 kubectl exec -it", async () => {
  const result = await run(payload("kubectl -n production exec -it pod/web-1 -- bash"));
  assert.equal(result?.decision, "block");
  assert.match(result.reason, /exec/);
  assert.match(result.reason, /生产/);
});

test("拦截 prod 上下文 kubectl exec -ti", async () => {
  const result = await run(payload("kubectl --context prod exec -ti deploy/api -- sh"));
  assert.equal(result?.decision, "block");
});

test("允许非生产环境 kubectl exec -it", async () => {
  const result = await run(payload("kubectl -n staging exec -it pod/web-1 -- bash"));
  assert.equal(result, null);
});

// ── 生产上下文 block：kubectl rollout undo ──

test("拦截生产环境 kubectl rollout undo", async () => {
  const result = await run(payload("kubectl -n production rollout undo deploy/api"));
  assert.equal(result?.decision, "block");
  assert.match(result.reason, /rollout undo/);
});

test("允许非生产环境 kubectl rollout undo", async () => {
  const result = await run(payload("kubectl -n dev rollout undo deploy/api"));
  assert.equal(result, null);
});

// ── 生产上下文 block：kubectl scale --replicas=0 ──

test("拦截生产环境 kubectl scale --replicas=0", async () => {
  const result = await run(payload("kubectl -n prod scale deploy/web --replicas=0"));
  assert.equal(result?.decision, "block");
  assert.match(result.reason, /replicas/);
});

test("拦截 live 上下文 kubectl scale --replicas 0", async () => {
  const result = await run(payload("kubectl --context live scale deploy/web --replicas 0"));
  assert.equal(result?.decision, "block");
});

test("允许非生产环境 kubectl scale --replicas=0", async () => {
  const result = await run(payload("kubectl -n dev scale deploy/web --replicas=0"));
  assert.equal(result, null);
});

// ── 生产上下文 block：kubectl patch replicas:0 ──

test("拦截生产环境 kubectl patch replicas:0", async () => {
  const result = await run(payload('kubectl -n production patch deploy/web -p \'{"spec":{"replicas": 0}}\''));
  assert.equal(result?.decision, "block");
});

// ── 生产上下文 block：kubectl label --overwrite ──

test("拦截生产环境 kubectl label --overwrite", async () => {
  const result = await run(payload("kubectl -n prod label pod web-1 env=test --overwrite"));
  assert.equal(result?.decision, "block");
  assert.match(result.reason, /overwrite/);
});

// ── 生产上下文 block：kubectl delete pod ──

test("拦截生产环境 kubectl delete pod", async () => {
  const result = await run(payload("kubectl -n production delete pod web-abc123"));
  assert.equal(result?.decision, "block");
  assert.match(result.reason, /删除.*Pod/);
});

test("允许非生产环境 kubectl delete pod", async () => {
  const result = await run(payload("kubectl -n staging delete pod web-abc123"));
  assert.equal(result, null);
});

// ── 生产上下文 block：kubectl replace --force ──

test("拦截生产环境 kubectl replace --force", async () => {
  const result = await run(payload("kubectl -n prod replace --force -f deploy.yaml"));
  assert.equal(result?.decision, "block");
  assert.match(result.reason, /replace --force/);
});

// ── 生产上下文 report：kubectl edit ──

test("报告生产环境 kubectl edit", async () => {
  const result = await run(payload("kubectl -n production edit deploy/api"));
  assert.equal(result?.decision, "report");
  assert.match(result.reason, /edit/);
});

test("允许非生产环境 kubectl edit", async () => {
  const result = await run(payload("kubectl -n dev edit deploy/api"));
  assert.equal(result, null);
});

// ── 生产上下文 report：kubectl set image ──

test("报告生产环境 kubectl set image", async () => {
  const result = await run(payload("kubectl -n production set image deploy/api api=api:v2"));
  assert.equal(result?.decision, "report");
  assert.match(result.reason, /set image/);
});

// ── 生产上下文检测 ──

test("识别 prd 为生产上下文", async () => {
  const result = await run(payload("kubectl -n prd exec -it pod/web -- bash"));
  assert.equal(result?.decision, "block");
});

test("识别 live 为生产上下文", async () => {
  const result = await run(payload("kubectl --context live exec -it pod/web -- bash"));
  assert.equal(result?.decision, "block");
});

// ── 允许：安全命令 ──

test("允许 kubectl get pods", async () => {
  const result = await run(payload("kubectl get pods -n production"));
  assert.equal(result, null);
});

test("允许 kubectl logs", async () => {
  const result = await run(payload("kubectl -n production logs pod/web-1"));
  assert.equal(result, null);
});

test("允许 kubectl describe", async () => {
  const result = await run(payload("kubectl -n prod describe deploy/api"));
  assert.equal(result, null);
});

test("允许 kubectl apply -f 本地文件", async () => {
  const result = await run(payload("kubectl apply -f deploy.yaml"));
  assert.equal(result, null);
});

test("允许 kubectl rollout status", async () => {
  const result = await run(payload("kubectl -n production rollout status deploy/api"));
  assert.equal(result, null);
});

// ── 边界情况 ──

test("空 payload 不崩溃", async () => {
  const result = await run({});
  assert.equal(result, null);
});

test("空 command 不崩溃", async () => {
  const result = await run({ tool_input: { command: "" } });
  assert.equal(result, null);
});
