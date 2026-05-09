import {
  InvocationPolicy,
  Platform,
  defineAntiPattern,
  defineSkill,
  defineSkillOutputs,
  defineWorkflow,
  defineWorkflowStep,
} from "../../sdk";
import { embeddingStrategiesSkill } from "../embedding-strategies/index";
import { ragAuditorSkill } from "../rag-auditor/index";
import { similaritySearchPatternsSkill } from "../similarity-search-patterns/index";

export const vectorIndexTuningSkill = defineSkill({
  id: "vector-index-tuning",
  fullName: "向量索引调优",
  description: "当用户要调优 HNSW、IVF、PQ、量化、召回-延迟-内存权衡，或排查向量索引性能问题时使用。",
  useCases: [
    "检索结果“够准但太慢”，或“够快但召回掉得离谱”。",
    "需要选择 HNSW / IVF / PQ / DiskANN 一类索引或量化路线。",
    "需要围绕 `M`、`efConstruction`、`efSearch`、压缩率、内存占用做取舍。",
  ],
  constraints: [
    "优化目标要先排序：优先保延迟、保召回还是省内存。",
    "调索引参数前先冻结 embedding、distance metric 和评测集。",
    "所有调参必须依赖固定 benchmark，不接受“感觉更快了”。",
    "如果真正的问题在 chunking 或 embedding 质量，不要误用索引参数掩盖。",
  ],
  checklist: [
    "是否定义了基线 recall、p95 latency、内存占用和写入成本。",
    "是否保证每轮只改一个主要参数。",
    "benchmark query 是否与真实线上流量接近。",
  ],
  relatedSkills: [
    {
      get id() {
        return ragAuditorSkill.id;
      },
      reason: "如果问题已经扩散到整条 RAG 链路，是否交给 `rag-auditor`。",
    },
    {
      get id() {
        return similaritySearchPatternsSkill.id;
      },
      reason: "需要重选检索架构、引擎、过滤策略或 hybrid/rerank 方案时联动。",
    },
    {
      get id() {
        return embeddingStrategiesSkill.id;
      },
      reason: "基准显示索引不是主因，问题来自 embedding、chunking 或距离度量时联动。",
    },
  ],
  antiPatterns: [
    defineAntiPattern({
      fail: "单次查询拍板",
      pass: "固定 benchmark",
    }),
    defineAntiPattern({
      fail: "同时改三个参数",
      pass: "单变量调参",
    }),
    defineAntiPattern({
      fail: "用压缩掩盖向量质量差",
      pass: "先排除上游问题",
    }),
  ],
  invocation: InvocationPolicy.ImplicitAndExplicit,
  platforms: [Platform.Claude, Platform.Codex],
  sourceDir: new URL("./", import.meta.url),
  workflow: defineWorkflow({
    steps: [
      defineWorkflowStep({
        id: "step-1",
        label: "先按优先级排序优化目标：延迟、召回、内存或写入成本；冻结 embedding、distance metric 和 benchmark query。",
      }),
      defineWorkflowStep({
        id: "step-2",
        label: "记录基线 recall、p95 latency、内存占用、写入成本和线上相似 workload；不要用单次查询拍板。",
      }),
      defineWorkflowStep({
        id: "step-3",
        label: "按 HNSW/IVF/PQ/DiskANN 等索引路线单变量调参，例如 M、efConstruction、efSearch、nlist、probe、压缩率。",
      }),
      defineWorkflowStep({
        id: "step-4",
        label: "每轮只改一个主要参数并做回归验证；如果召回问题来自 chunking/embedding 或 RAG 链路，转对应 skill。",
      }),
    ],
  }),
  outputs: defineSkillOutputs({
    items: [
      "优化目标排序、固定 benchmark、冻结的 embedding/distance/index 基线。",
      "每轮参数变更、recall、p95 latency、memory、write cost 和回归结果。",
      "推荐参数、风险、未解决上游问题和需要联动的检索/embedding/RAG 审计点。",
    ],
  }),
});
