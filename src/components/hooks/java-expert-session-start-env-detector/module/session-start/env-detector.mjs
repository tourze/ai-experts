/**
 * env-detector (SessionStart) — 探测 Java 项目环境
 *
 * 检测构建工具 (Maven/Gradle)、JDK 版本约束与 Spring Boot 版本，
 * 帮助 Claude 从第一条消息起就使用正确的构建命令和语言特性。
 */

import { existsSync, readFileSync } from "node:fs";
import { dirname, join, parse } from "node:path";

function findUp(name, from) {
  let dir = from;
  const { root } = parse(dir);
  while (dir !== root) {
    if (existsSync(join(dir, name))) return join(dir, name);
    dir = dirname(dir);
  }
  return null;
}

function readText(p) {
  try {
    return readFileSync(p, "utf-8").trim();
  } catch {
    return "";
  }
}

export async function run(payload) {
  const cwd = payload?.cwd;
  if (typeof cwd !== "string" || !cwd) return null;

  const pomPath = findUp("pom.xml", cwd);
  const gradlePath = findUp("build.gradle", cwd);
  const gradleKtsPath = findUp("build.gradle.kts", cwd);

  if (!pomPath && !gradlePath && !gradleKtsPath) return null;

  const facts = [];

  if (pomPath) {
    facts.push("构建工具: Maven");
    const pom = readText(pomPath);

    // Java 版本
    const javaVerMatch =
      pom.match(/<java\.version>([^<]+)</) ||
      pom.match(/<maven\.compiler\.source>([^<]+)</);
    if (javaVerMatch) facts.push(`Java 版本: ${javaVerMatch[1]}`);

    // Spring Boot
    const springMatch = pom.match(
      /<artifactId>spring-boot-starter-parent<\/artifactId>[\s\S]*?<version>([^<]+)</,
    );
    if (springMatch) facts.push(`Spring Boot: ${springMatch[1]}`);

    // wrapper
    const projectRoot = dirname(pomPath);
    if (existsSync(join(projectRoot, "mvnw"))) {
      facts.push("Maven Wrapper: 有 (用 ./mvnw)");
    }
  } else {
    const gPath = gradleKtsPath || gradlePath;
    const isKts = !!gradleKtsPath;
    facts.push(`构建工具: Gradle${isKts ? " (Kotlin DSL)" : ""}`);

    const gradle = readText(gPath);

    // Java 版本
    const javaMatch =
      gradle.match(/sourceCompatibility\s*=\s*['"]?([^'"\s]+)/) ||
      gradle.match(/JavaVersion\.VERSION_(\d+)/) ||
      gradle.match(/jvmTarget\s*=\s*['"]([^'"]+)/);
    if (javaMatch) facts.push(`Java 版本: ${javaMatch[1]}`);

    // Spring Boot
    const springMatch = gradle.match(
      /org\.springframework\.boot['")\s]+version\s*['"]([^'"]+)/,
    );
    if (springMatch) facts.push(`Spring Boot: ${springMatch[1]}`);

    // wrapper
    const projectRoot = dirname(gPath);
    if (existsSync(join(projectRoot, "gradlew"))) {
      facts.push("Gradle Wrapper: 有 (用 ./gradlew)");
    }
  }

  if (facts.length === 0) return null;

  return {
    decision: "context",
    reason: [
      "[Java Env] 项目环境探测",
      "",
      ...facts.map((f) => `  ${f}`),
    ].join("\n"),
  };
}
