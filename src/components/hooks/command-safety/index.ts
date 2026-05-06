import type { HookDefinition } from "../../sdk";
import { catWriteGuardHook } from "./cat-write-guard";
import { dangerousCommandGuardHook } from "./dangerous-command-guard";
import { databaseRedisCliRiskGuardHook } from "./database-redis-cli-risk-guard";
import { dbDangerousSqlGuardHook } from "./db-dangerous-sql-guard";
import { devopsDangerousInfraGuardHook } from "./devops-dangerous-infra-guard";
import { devopsProductionKubectlGuardHook } from "./devops-production-kubectl-guard";
import { errorRetryGuardHook } from "./error-retry-guard";
import { gitAddGuardHook } from "./git-add-guard";
import { gitBranchNamingGuardHook } from "./git-branch-naming-guard";
import { gitCommitHeredocGuardHook } from "./git-commit-heredoc-guard";
import { gitCommitMessageGuardHook } from "./git-commit-message-guard";
import { gitCommitScopeGuardHook } from "./git-commit-scope-guard";
import { gitDestructiveCommandGuardHook } from "./git-destructive-command-guard";
import { gitPartialStagingGuardHook } from "./git-partial-staging-guard";
import { gitStaleLockGuardHook } from "./git-stale-lock-guard";
import { phpHeavyCommandRepeatGuardHook } from "./php-heavy-command-repeat-guard";
import { phpTestOutputTruncationGuardHook } from "./php-test-output-truncation-guard";
import { securitySecretLeakGuardHook } from "./security-secret-leak-guard";
import { sedInplaceGuardHook } from "./sed-inplace-guard";
import { svnBulkOperationGuardHook } from "./svn-bulk-operation-guard";
import { svnCommitMessageGuardHook } from "./svn-commit-message-guard";

export { catWriteGuardHook, dangerousCommandGuardHook, databaseRedisCliRiskGuardHook, dbDangerousSqlGuardHook, devopsDangerousInfraGuardHook, devopsProductionKubectlGuardHook, errorRetryGuardHook, gitAddGuardHook, gitBranchNamingGuardHook, gitCommitHeredocGuardHook, gitCommitMessageGuardHook, gitCommitScopeGuardHook, gitDestructiveCommandGuardHook, gitPartialStagingGuardHook, gitStaleLockGuardHook, phpHeavyCommandRepeatGuardHook, phpTestOutputTruncationGuardHook, securitySecretLeakGuardHook, sedInplaceGuardHook, svnBulkOperationGuardHook, svnCommitMessageGuardHook };

export const commandSafetyHooks: readonly HookDefinition[] = [
  catWriteGuardHook,
  dangerousCommandGuardHook,
  databaseRedisCliRiskGuardHook,
  dbDangerousSqlGuardHook,
  devopsDangerousInfraGuardHook,
  devopsProductionKubectlGuardHook,
  errorRetryGuardHook,
  gitAddGuardHook,
  gitBranchNamingGuardHook,
  gitCommitHeredocGuardHook,
  gitCommitMessageGuardHook,
  gitCommitScopeGuardHook,
  gitDestructiveCommandGuardHook,
  gitPartialStagingGuardHook,
  gitStaleLockGuardHook,
  phpHeavyCommandRepeatGuardHook,
  phpTestOutputTruncationGuardHook,
  securitySecretLeakGuardHook,
  sedInplaceGuardHook,
  svnBulkOperationGuardHook,
  svnCommitMessageGuardHook,
];
