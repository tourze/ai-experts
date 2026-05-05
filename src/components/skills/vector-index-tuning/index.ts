import {
  InvocationPolicy,
  KnownTool,
  Platform,
  defineSkill,
} from "../../sdk";
import { embeddingStrategiesSkill } from "../embedding-strategies/index";
import { ragAuditorSkill } from "../rag-auditor/index";
import { similaritySearchPatternsSkill } from "../similarity-search-patterns/index";

export const vectorIndexTuningSkill = defineSkill({
  id: "vector-index-tuning",
  fullName: "vector-index-tuning",
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
      reason: "相关 skill：`similarity-search-patterns`、`embedding-strategies`、`rag-auditor`。",
    },
    {
      get id() {
        return embeddingStrategiesSkill.id;
      },
      reason: "相关 skill：`similarity-search-patterns`、`embedding-strategies`、`rag-auditor`。",
    },
  ],
  invocation: InvocationPolicy.ImplicitAndExplicit,
  platforms: [Platform.Claude, Platform.Codex],
  body: new URL("./SKILL.body.md", import.meta.url),
  tools: [],
});
