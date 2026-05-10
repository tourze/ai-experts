import {
  InvocationPolicy,
  Platform,
  defineReference,
  defineAntiPattern,
  defineSkill,
  defineSkillOutputs,
  defineWorkflow,
  defineWorkflowStep,
} from "../../sdk";
import { redisDataModelingSkill } from "../redis-data-modeling/index";

export const redisClusterHaSkill = defineSkill({
  id: "redis-cluster-ha",
  fullName: "Redis Cluster & High Availability",
  description: "当用户要部署、运维或排查 Redis Sentinel、Cluster 或持久化策略时使用。适用于高可用架构与容量规划。",
  useCases: [
    "高可用架构选型：Sentinel vs Cluster。",
    "持久化策略配置（RDB / AOF / 混合），平衡数据安全与性能。",
    "maxmemory 和淘汰策略制定，防止 OOM。",
    "慢查询监控和运维基线建立。",
    "完整配置和监控脚本见 [references/code-patterns.md](references/code-patterns.md)。",
  ],
  constraints: [
    "Sentinel 至少 3 节点，quorum = `(N/2)+1`（3 节点时 quorum=2）。",
    "Cluster multi-key 操作要求所有 key 在同一 hash slot，用 `{hashtag}` 保证。",
    "生产环境必须开启持久化（至少 AOF），纯内存模式仅用于可丢失缓存。",
    "maxmemory 预留系统内存 20-30%（fork copy-on-write 开销），不设为物理内存 100%。",
    "SLOWLOG 阈值建议 10ms（10000 微秒），定期巡检并优化。",
  ],
  checklist: [
    "Sentinel 是否至少 3 节点，quorum 是否为多数派。",
    "Cluster multi-key 操作是否用了 `{hashtag}`。",
    "持久化是否开启，AOF fsync 是否满足 RPO 要求。",
    "maxmemory 是否预留 fork 开销，淘汰策略是否匹配业务场景。",
    "是否配置 SLOWLOG 监控，是否有定期巡检机制。",
  ],
  relatedSkills: [
    {
      get id() {
        return redisDataModelingSkill.id;
      },
      reason: "分布式锁在集群下的考量参考 `redis-data-modeling`，键分布和锁模式见该 skill。",
    },
  ],
  antiPatterns: [
    defineAntiPattern({
      fail: "maxmemory = 物理内存",
      pass: "留 20-30% fork 余量",
    }),
    defineAntiPattern({
      fail: "Sentinel 2 节点",
      pass: "至少 3 节点",
    }),
    defineAntiPattern({
      fail: "Cluster 跨 slot MGET",
      pass: "hashtag 同 slot",
    }),
  ],
  invocation: InvocationPolicy.ImplicitAndExplicit,
  platforms: [Platform.Claude, Platform.Codex],
  sourceDir: new URL("./", import.meta.url),
  workflow: defineWorkflow({
    steps: [
      defineWorkflowStep({
        id: "step-1",
        label: "先按业务目标选择 Sentinel 还是 Cluster：高可用主从切换用 Sentinel，容量水平扩展和 slot 分片用 Cluster。",
      }),
      defineWorkflowStep({
        id: "step-2",
        label: "Sentinel 至少 3 节点并设置多数派 quorum；Cluster multi-key 操作必须用 `{hashtag}` 保证同 slot。",
      }),
      defineWorkflowStep({
        id: "step-3",
        label: "生产至少开启 AOF，并根据 RPO/RTO 选择 RDB/AOF 混合策略；`maxmemory` 预留 20-30% fork copy-on-write 余量。",
      }),
      defineWorkflowStep({
        id: "step-4",
        label: "配置 `slowlog-log-slower-than`、`slowlog-max-len` 和周期巡检；完整配置模板读取 code-patterns reference。",
      }),
    ],
  }),
  outputs: defineSkillOutputs({
    items: [
      "Sentinel 或 Cluster 拓扑、quorum/slot/hash tag 约束和故障切换说明。",
      "持久化策略、`maxmemory`、淘汰策略、fork 余量和 RPO/RTO 取舍。",
      "SLOWLOG/监控基线、容量风险、multi-key 风险和需要进一步验证的命令清单。",
    ],
  }),
  references: [
    defineReference({
      id: "code-patterns",
      source: new URL("./references/code-patterns.md", import.meta.url),
      target: "references/code-patterns.md",
      title: "code-patterns.md",
      summary: "Sentinel 节点部署、Cluster hashtag、持久化配置、maxmemory 预留与 SLOWLOG 监控脚本。",
      loadWhen: "需要部署 Sentinel/Cluster、配置持久化或制定 maxmemory 淘汰策略时读取。",
    }),
  ],
});
