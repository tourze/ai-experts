import { describe } from "vitest";
import "./component-build.test-context";
import { registerComponentBuildCoreTests } from "./component-build.core-tests";
import { registerComponentBuildGeneratedContentTests } from "./component-build.generated-content-tests";
import { registerComponentBuildRepresentativeTests } from "./component-build.representative-tests";
import { registerComponentBuildProcedureBundleTests } from "./component-build.procedure-bundle-tests";
import { registerComponentBuildScriptHookTests } from "./component-build.script-hook-tests";
import { registerComponentBuildMarkdownLinkTests } from "./component-build.markdown-link-tests";

describe("component build integration", () => {
  registerComponentBuildCoreTests();
  registerComponentBuildGeneratedContentTests();
  registerComponentBuildRepresentativeTests();
  registerComponentBuildProcedureBundleTests();
  registerComponentBuildScriptHookTests();
  registerComponentBuildMarkdownLinkTests();
});
