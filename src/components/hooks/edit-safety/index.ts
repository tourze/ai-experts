import type { HookDefinition } from "../../sdk";
import { debugStatementGuardHook } from "./debug-statement-guard";
import { devopsLintActionlintHook } from "./devops-lint-actionlint";
import { devopsLintKubeconformHook } from "./devops-lint-kubeconform";
import { devopsLintTerraformFmtHook } from "./devops-lint-terraform-fmt";
import { devopsLinuxLintShellcheckHook } from "./devops-linux-lint-shellcheck";
import { devopsLinuxSyntaxBashHook } from "./devops-linux-syntax-bash";
import { devopsLinuxSyntaxZshHook } from "./devops-linux-syntax-zsh";
import { devopsSyntaxDockerfileHook } from "./devops-syntax-dockerfile";
import { devopsSyntaxYamlHook } from "./devops-syntax-yaml";
import { editLoopDetectorHook } from "./edit-loop-detector";
import { encodingGuardHook } from "./encoding-guard";
import { fileBudgetGuardHook } from "./file-budget-guard";
import { frontendSyntaxTaroDomHook } from "./frontend-syntax-taro-dom";
import { frontendSyntaxWxmlHook } from "./frontend-syntax-wxml";
import { frontendSyntaxWxssHook } from "./frontend-syntax-wxss";
import { garbledTextGuardHook } from "./garbled-text-guard";
import { generatedDistGuard } from "./generated-dist-guard";
import { goSyntaxHook } from "./go-syntax";
import { iosLintSwiftConcurrencyHook } from "./ios-lint-swift-concurrency";
import { javaSyntaxHook } from "./java-syntax";
import { javascriptLintEslintHook } from "./javascript-lint-eslint";
import { javascriptSyntaxHook } from "./javascript-syntax";
import { largeEditChunkGuardHook } from "./large-edit-chunk-guard";
import { markdownBudgetGuardHook } from "./markdown-budget-guard";
import { mergeConflictGuardHook } from "./merge-conflict-guard";
import { phpDebugStatementGuardHook } from "./php-debug-statement-guard";
import { phpLintPhpstanHook } from "./php-lint-phpstan";
import { phpProtectedPathsHook } from "./php-protected-paths";
import { phpSymfonyProtectedPathsHook } from "./php-symfony-protected-paths";
import { phpSymfonySyntaxDoctrineEntityHook } from "./php-symfony-syntax-doctrine-entity";
import { phpSymfonySyntaxTwigHook } from "./php-symfony-syntax-twig";
import { phpSyntaxComposerHook } from "./php-syntax-composer";
import { phpSyntaxHook } from "./php-syntax";
import { pythonLintRuffHook } from "./python-lint-ruff";
import { pythonSyntaxHook } from "./python-syntax";
import { rustDebugStatementGuardHook } from "./rust-debug-statement-guard";
import { securitySecretWriteGuardHook } from "./security-secret-write-guard";
import { suppressionGuardHook } from "./suppression-guard";
import { syntaxCppHook } from "./syntax-cpp";
import { syntaxJsonHook } from "./syntax-json";
import { syntaxXmlHook } from "./syntax-xml";
import { typescriptLintEslintHook } from "./typescript-lint-eslint";
import { typescriptSyntaxHook } from "./typescript-syntax";

export { debugStatementGuardHook, devopsLintActionlintHook, devopsLintKubeconformHook, devopsLintTerraformFmtHook, devopsLinuxLintShellcheckHook, devopsLinuxSyntaxBashHook, devopsLinuxSyntaxZshHook, devopsSyntaxDockerfileHook, devopsSyntaxYamlHook, editLoopDetectorHook, encodingGuardHook, fileBudgetGuardHook, frontendSyntaxTaroDomHook, frontendSyntaxWxmlHook, frontendSyntaxWxssHook, garbledTextGuardHook, generatedDistGuard, goSyntaxHook, iosLintSwiftConcurrencyHook, javaSyntaxHook, javascriptLintEslintHook, javascriptSyntaxHook, largeEditChunkGuardHook, markdownBudgetGuardHook, mergeConflictGuardHook, phpDebugStatementGuardHook, phpLintPhpstanHook, phpProtectedPathsHook, phpSymfonyProtectedPathsHook, phpSymfonySyntaxDoctrineEntityHook, phpSymfonySyntaxTwigHook, phpSyntaxComposerHook, phpSyntaxHook, pythonLintRuffHook, pythonSyntaxHook, rustDebugStatementGuardHook, securitySecretWriteGuardHook, suppressionGuardHook, syntaxCppHook, syntaxJsonHook, syntaxXmlHook, typescriptLintEslintHook, typescriptSyntaxHook };

export const editSafetyHooks: readonly HookDefinition[] = [
  debugStatementGuardHook,
  devopsLintActionlintHook,
  devopsLintKubeconformHook,
  devopsLintTerraformFmtHook,
  devopsLinuxLintShellcheckHook,
  devopsLinuxSyntaxBashHook,
  devopsLinuxSyntaxZshHook,
  devopsSyntaxDockerfileHook,
  devopsSyntaxYamlHook,
  editLoopDetectorHook,
  encodingGuardHook,
  fileBudgetGuardHook,
  frontendSyntaxTaroDomHook,
  frontendSyntaxWxmlHook,
  frontendSyntaxWxssHook,
  garbledTextGuardHook,
  generatedDistGuard,
  goSyntaxHook,
  iosLintSwiftConcurrencyHook,
  javaSyntaxHook,
  javascriptLintEslintHook,
  javascriptSyntaxHook,
  largeEditChunkGuardHook,
  markdownBudgetGuardHook,
  mergeConflictGuardHook,
  phpDebugStatementGuardHook,
  phpLintPhpstanHook,
  phpProtectedPathsHook,
  phpSymfonyProtectedPathsHook,
  phpSymfonySyntaxDoctrineEntityHook,
  phpSymfonySyntaxTwigHook,
  phpSyntaxComposerHook,
  phpSyntaxHook,
  pythonLintRuffHook,
  pythonSyntaxHook,
  rustDebugStatementGuardHook,
  securitySecretWriteGuardHook,
  suppressionGuardHook,
  syntaxCppHook,
  syntaxJsonHook,
  syntaxXmlHook,
  typescriptLintEslintHook,
  typescriptSyntaxHook,
];
