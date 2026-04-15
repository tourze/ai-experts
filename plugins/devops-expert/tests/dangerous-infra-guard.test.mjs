import test from "node:test";
import assert from "node:assert/strict";
import { run } from "../hooks/pre-tool-use/bash/dangerous-infra-guard.mjs";

function payload(command) {
  return { tool_input: { command } };
}

// ── Kubernetes ──

test("拦截 kubectl delete namespace", async () => {
  const result = await run(payload("kubectl delete namespace production"));
  assert.equal(result?.decision, "block");
  assert.match(result.reason, /namespace/);
});

test("拦截 kubectl delete ns", async () => {
  const result = await run(payload("kubectl delete ns staging"));
  assert.equal(result?.decision, "block");
});

test("拦截 kubectl delete --all", async () => {
  const result = await run(payload("kubectl delete pods --all"));
  assert.equal(result?.decision, "block");
  assert.match(result.reason, /--all/);
});

test("拦截 kubectl delete deployments --all", async () => {
  const result = await run(payload("kubectl delete deployments --all -n default"));
  assert.equal(result?.decision, "block");
});

// ── Terraform ──

test("拦截 terraform destroy", async () => {
  const result = await run(payload("terraform destroy"));
  assert.equal(result?.decision, "block");
  assert.match(result.reason, /destroy/);
});

test("拦截 terraform apply -auto-approve", async () => {
  const result = await run(payload("terraform apply -auto-approve"));
  assert.equal(result?.decision, "block");
  assert.match(result.reason, /auto-approve/);
});

test("拦截 terraform apply 带 var 文件和 -auto-approve", async () => {
  const result = await run(payload("terraform apply -var-file=prod.tfvars -auto-approve"));
  assert.equal(result?.decision, "block");
});

// ── Docker ──

test("拦截 docker system prune -a", async () => {
  const result = await run(payload("docker system prune -a"));
  assert.equal(result?.decision, "block");
  assert.match(result.reason, /prune/);
});

test("拦截 docker system prune -a --force", async () => {
  const result = await run(payload("docker system prune -a --force"));
  assert.equal(result?.decision, "block");
});

test("拦截 docker rm -f $()", async () => {
  const result = await run(payload("docker rm -f $(docker ps -aq)"));
  assert.equal(result?.decision, "block");
  assert.match(result.reason, /批量/);
});

test("拦截 docker-compose down -v", async () => {
  const result = await run(payload("docker-compose down -v"));
  assert.equal(result?.decision, "block");
  assert.match(result.reason, /数据卷/);
});

test("拦截 docker compose down -v（无连字符）", async () => {
  const result = await run(payload("docker compose down -v"));
  assert.equal(result?.decision, "block");
});

// ── Helm ──

test("拦截 helm uninstall", async () => {
  const result = await run(payload("helm uninstall my-release"));
  assert.equal(result?.decision, "block");
  assert.match(result.reason, /helm uninstall/);
});

// ── AWS ──

test("拦截 aws s3 rb", async () => {
  const result = await run(payload("aws s3 rb s3://my-bucket"));
  assert.equal(result?.decision, "block");
  assert.match(result.reason, /S3/);
});

test("拦截 aws s3 rm --recursive", async () => {
  const result = await run(payload("aws s3 rm s3://my-bucket/ --recursive"));
  assert.equal(result?.decision, "block");
  assert.match(result.reason, /递归/);
});

// ── GCP ──

test("拦截 gcloud projects delete", async () => {
  const result = await run(payload("gcloud projects delete my-project"));
  assert.equal(result?.decision, "block");
  assert.match(result.reason, /GCP/);
});

// ── Azure ──

test("拦截 az group delete", async () => {
  const result = await run(payload("az group delete --name my-rg"));
  assert.equal(result?.decision, "block");
  assert.match(result.reason, /资源组/);
});

// ── 允许：安全命令 ──

test("允许 kubectl get pods", async () => {
  const result = await run(payload("kubectl get pods"));
  assert.equal(result, null);
});

test("允许 kubectl apply -f local.yaml", async () => {
  const result = await run(payload("kubectl apply -f deployment.yaml"));
  assert.equal(result, null);
});

test("允许 terraform plan", async () => {
  const result = await run(payload("terraform plan"));
  assert.equal(result, null);
});

test("允许 terraform apply（无 -auto-approve）", async () => {
  const result = await run(payload("terraform apply"));
  assert.equal(result, null);
});

test("允许 docker ps", async () => {
  const result = await run(payload("docker ps"));
  assert.equal(result, null);
});

test("允许 docker-compose up", async () => {
  const result = await run(payload("docker-compose up -d"));
  assert.equal(result, null);
});

test("允许 docker-compose down（无 -v）", async () => {
  const result = await run(payload("docker-compose down"));
  assert.equal(result, null);
});

test("允许 helm install", async () => {
  const result = await run(payload("helm install my-release ./chart"));
  assert.equal(result, null);
});

test("允许 aws s3 ls", async () => {
  const result = await run(payload("aws s3 ls s3://my-bucket"));
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
