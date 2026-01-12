# API 检索功能交接文档

## 1. 项目概述 (Project Overview)

本项目中的 "API 检索" (API Retrieval) 模块旨在为 Agent 提供动态工具发现能力。当用户输入自定义任务请求或进行多轮对话时，系统通过语义检索技术，从 ToolBench 数据集中查找最相关的 API 工具，从而构建 Agent 的执行环境。

该功能主要服务于以下场景：
1.  **自定义会话初始化 (`/api/init_custom`)**: 用户输入任意 Prompt，系统检索 TOP-K 工具并启动会话。
2.  **会话延续 (`/api/continue`)**: 在多轮对话中，根据用户的新指令检索补充工具。

## 2. 核心组件 (Core Components)

### 2.1 后端检索器 (`dashboard/server/retriever.py`)

这是核心实现类 `ToolBenchRetriever` 的所在位置。

*   **技术栈**: `sentence-transformers`, `PyTorch`。
*   **默认模型**: 优先加载 `ToolBench/ToolBench_IR_bert_based_uncased`，若失败则回退至 `all-MiniLM-L6-v2`。
*   **数据源**: `experiments/toolbench/data/data/toolenv/tools` 目录下的 JSON 文件。
*   **缓存机制**: 支持将计算好的 Embedding 缓存为 `retriever_cache.pt`，加速启动。

### 2.2 后端服务集成 (`dashboard/server/app.py`)

*   **异步初始化**: App 启动时通过 `startup_event` 触发 `init_retriever()`，在后台线程加载模型和建立索引，避免阻塞主进程启动。
*   **状态管理**: 通过 `retriever_loading` 全局变量标识加载状态。
*   **接口调用**:
    *   `/api/init_custom`: 调用 `retriever.retrieve(query)` 获取初始工具列表。
    *   `/api/continue`: 调用 `retriever.retrieve(prompt)` 获取新工具并动态更新 `AgentState`。

### 2.3 前端交互 (`dashboard/src/services/api.ts`)

*   **`initCustomSession`**: 发送自定义 Query 以触发检索。
*   **`continueSession`**: 发送新的 Prompt 以触发检索。

### 2.4 验证脚本 (`dashboard/verify_retrieval.py`)

*   用于独立测试检索相关接口的连通性和基本逻辑。
*   模拟完整的 "初始化 -> 等待加载 -> 发送指令 -> 检查检索结果" 流程。

## 3. 数据流向 (Data Flow)

1.  **启动阶段**:
    *   `app.py` 启动 -> `ToolBenchRetriever` 初始化。
    *   遍历 `TOOL_DATA_ROOT` -> 解析 JSON -> `Text Encoding` -> 存入内存/缓存。

2.  **检索阶段 (用户请求)**:
    *   用户请求 (Query/Prompt) -> `app.py` 接口。
    *   `retriever.retrieve(query)` -> 计算 Query Embedding。
    *   `Cosine Similarity` -> 排序 -> 取 TOP-K。
    *   返回 `tool_definitions` (JSON) 给 Agent Adapter。
    *   Agent Adapter 更新 Prompt Context，Agent 获得新工具的使用能力。

## 4. 部署与维护 (Deployment & Operations)

### 4.1 依赖环境
确保 Python 环境安装了以下库：
```bash
pip install sentence-transformers torch numpy
```

### 4.2 配置路径
在 `dashboard/server/app.py` 中确认 `TOOL_DATA_ROOT` 指向正确的 ToolBench 数据集路径：
```python
TOOL_DATA_ROOT = PROJECT_ROOT / "experiments/toolbench/data/data/toolenv/tools"
```

### 4.3 缓存管理
首次运行会较慢（构建索引）。构建完成后会在数据目录下生成 `retriever_cache.pt`。
*   **清除缓存**: 如果更新了工具数据集，请手动删除 `retriever_cache.pt` 以触发重建。

## 5. 验证方法 (Verification)

使用提供的验证脚本进行端到端测试：

```bash
# 1. 启动后端服务
cd dashboard/server
python app.py

# 2. 在另一个终端运行验证脚本
cd dashboard
python verify_retrieval.py
```

**预期输出**:
*   Session ID 成功生成。
*   "VERIFICATION RESULT: Retrieved X new tools." (其中 X > 0)。
*   如果没有检索到工具，脚本会发出警告。

## 6. 已知问题与注意事项 (Known Issues)

1.  **冷启动时间**: 模型加载和全量工具 Embedding 计算需要时间（视 CPU/GPU 而定）。目前的异步加载机制可能导致服务刚启动的前几秒内检索结果为空或报错，前端需做好 loading 处理或重试机制。
2.  **内存占用**: 加载 BERT 类模型和存储 Embedding 会占用显存/内存。若部署在资源受限环境，考虑使用更小的模型（如 `paraphrase-MiniLM-L3-v2`）。
3.  **并发性能**: 目前 `retrieve` 方法是同步调用的（虽然在 `app.py` 中是 `async def`，但内部计算是密集型的）。高并发下建议将计算密集型任务放入独立进程或使用专门的向量数据库（如 Milvus/FAISS）。

## 7. 下一步建议 (Next Steps)

*   **引入向量库**: 对于大规模工具集，当前的线性扫描 (`util.cos_sim`) 效率较低，建议迁移至 FAISS。
*   **模型微调**: 当前使用通用语义模型，针对 API 文档描述进行 Fine-tuning 可提高检索准确率。
*   **混合检索**: 结合关键词检索 (BM25) 和语义检索以提升效果。
