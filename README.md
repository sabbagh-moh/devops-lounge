# DevOps Lounge

**A free Discord community for developers and DevOps engineers, at every level.** [Join the server](https://discord.gg/XHtBz8rZp5) · [Website](https://sabbagh-moh.github.io/devops-lounge/) · [بالعربي](https://sabbagh-moh.github.io/devops-lounge/ar/)

Ask programming questions in forums with solved tags, get code reviews, share projects, and find people to build with. Ten tracks (AI, web, app, frontend, backend, mobile, data and ML, security, DevOps and cloud, game dev) and rooms in English, Arabic, Spanish, Portuguese, French and Russian.

This repository is the community's website, and the list below is the Vault: 249 free resources our members picked, each with a short note on why.

## Free tools

Developer tools that run in your browser, nothing uploaded: [Prompt Builder](https://sabbagh-moh.github.io/devops-lounge/tools/prompt-builder/) · [Token Counter](https://sabbagh-moh.github.io/devops-lounge/tools/token-counter/) · [AI Tool Schema Builder](https://sabbagh-moh.github.io/devops-lounge/tools/tool-schema/) · [JSON to TypeScript](https://sabbagh-moh.github.io/devops-lounge/tools/json-to-types/) · [cURL Converter](https://sabbagh-moh.github.io/devops-lounge/tools/curl-converter/) · [Text Diff](https://sabbagh-moh.github.io/devops-lounge/tools/diff/) · [Color and Contrast](https://sabbagh-moh.github.io/devops-lounge/tools/color-contrast/) · [Cron Builder](https://sabbagh-moh.github.io/devops-lounge/tools/cron/) · [Regex Tester](https://sabbagh-moh.github.io/devops-lounge/tools/regex/) · [JSON Formatter](https://sabbagh-moh.github.io/devops-lounge/tools/json/) · [JWT Decoder](https://sabbagh-moh.github.io/devops-lounge/tools/jwt/) · [Timestamp Converter](https://sabbagh-moh.github.io/devops-lounge/tools/timestamp/) · [Base64 and URL Encoder](https://sabbagh-moh.github.io/devops-lounge/tools/base64/) · [Password and UUID Generator](https://sabbagh-moh.github.io/devops-lounge/tools/password/) · [chmod Calculator](https://sabbagh-moh.github.io/devops-lounge/tools/chmod/)

## Contents
- [AI for developers](#ai-for-developers)
- [Core developer skills](#core-developer-skills)
- [Open source worth reading](#open-source-worth-reading)
- [Free ways to learn to code](#free-ways-to-learn-to-code)
- [Tools developers keep](#tools-developers-keep)

## AI for developers

Hand-picked talks, papers, courses and tools for building with large language models, from your first prompt to agents in production. Each one comes with a short note on why it is worth your time.

### LLMs

- [Intro to Large Language Models: Karpathy's one-hour talk](https://www.youtube.com/watch?v=zjkBMFhNj_g): A single free talk that explains an LLM as an artifact (a big parameter file plus a small program that runs it), how training and fine-tuning produce one, and where the security problems come from.
- [The Illustrated Transformer](https://jalammar.github.io/illustrated-transformer/): Jay Alammar's diagram-driven walkthrough of the architecture from the original transformer paper: self-attention, multi-head attention, positional encoding and the encoder and decoder stacks.
- [OWASP Top 10 for LLM Applications](https://genai.owasp.org/llm-top-10/): The community-maintained list of the main risks in LLM apps, led by prompt injection and including excessive agency, system prompt leakage and unbounded consumption.

### Papers

- [Attention Is All You Need, the original transformer paper](https://arxiv.org/abs/1706.03762): The 2017 paper that introduced the transformer and dropped recurrence in favour of attention.
- [Retrieval-Augmented Generation for Knowledge-Intensive NLP Tasks](https://arxiv.org/abs/2005.11401): The paper that named RAG: a generator combined with a dense vector index over Wikipedia, trained together.
- [ReAct: let the model think between tool calls](https://arxiv.org/abs/2210.03629): The ReAct paper (Yao et al.) proposes interleaving reasoning traces with actions, so the model plans, acts, looks at what came back, and adjusts.
- [Lost in the Middle: where you put evidence in a long prompt matters](https://arxiv.org/abs/2307.03172): This paper measured how models use long contexts and found performance tends to be best when the relevant information sits at the beginning or end, and worse when it is buried in the middle.
- [LLM-as-judge works, and it has biases you must control for](https://arxiv.org/abs/2306.05685): The MT-Bench paper (Zheng et al.) studied using strong models to grade other models' answers.
- [QLoRA: fine-tune a large model on modest hardware](https://arxiv.org/abs/2305.14314): QLoRA (Dettmers et al.) backpropagates through a frozen, 4-bit quantised base model into small LoRA adapters.
- [Indirect prompt injection: the attack arrives inside the data](https://arxiv.org/abs/2302.12173): Greshake et al.

### Courses

- [Hugging Face LLM Course](https://huggingface.co/learn/llm-course/chapter1/1): A free, hands-on course on using and fine-tuning transformer models with the Hugging Face libraries.
- [Hugging Face Agents Course](https://huggingface.co/learn/agents-course/unit0/introduction): A free course on building, running and evaluating AI agents, with practical units rather than only theory.
- [Practical Deep Learning for Coders (fast.ai)](https://course.fast.ai/): A free, code-first course that teaches deep learning top-down: you build working models early and learn the theory underneath as you go.
- [Neural Networks: Zero to Hero](https://karpathy.ai/zero-to-hero.html): Free video series by Andrej Karpathy that builds from backpropagation by hand up to a GPT-style language model in code.
- [Generative AI for Beginners from Microsoft](https://github.com/microsoft/generative-ai-for-beginners): A free, open-source 21-lesson course.

### Prompting

- [Prompt Engineering Guide by DAIR.AI](https://www.promptingguide.ai/): A free, community-maintained reference covering prompting techniques, with examples and links to the papers behind them.
- [Anthropic prompt engineering documentation](https://platform.claude.com/docs/en/build-with-claude/prompt-engineering/overview): Vendor docs, but the habits transfer to other models: be explicit, show examples, structure your inputs clearly, and iterate against a small set of test cases.
- [OpenAI prompt engineering guide](https://developers.openai.com/api/docs/guides/prompt-engineering): OpenAI's official guidance on writing prompts and structuring messages.
- [Simon Willison's prompt injection series](https://simonwillison.net/series/prompt-injection/): A running series of posts on prompt injection, the attack where untrusted text steers a model.
- [Chain-of-thought prompting: show your reasoning steps in the examples](https://arxiv.org/abs/2201.11903): The chain-of-thought paper (Wei et al.) showed that including worked, step-by-step reasoning in few-shot examples lets large models solve multi-step problems they otherwise miss.

### Agents

- [Building Effective Agents: workflows vs agents](https://www.anthropic.com/research/building-effective-agents): A calm essay that separates predefined workflows from model-directed agents and lays out five composable patterns.
- [LLM Powered Autonomous Agents by Lilian Weng](https://lilianweng.github.io/posts/2023-06-23-agent/): A thorough overview of agents built around a language model, organised around planning, memory and tool use, with pointers to the research behind each.
- [LangGraph: stateful, long-running agent orchestration](https://github.com/langchain-ai/langgraph): MIT-licensed, low-level framework for agents modelled as stateful graphs, with durable execution so a run can resume after a failure.
- [The tool-use loop in four steps, and the stop reason that drives it](https://platform.claude.com/docs/en/agents-and-tools/tool-use/overview): Tool use looks magical until you see the loop.
- [Write tool descriptions like an onboarding note for a new teammate](https://www.anthropic.com/research/writing-tools-for-agents): Agents fail on tools more often than on reasoning, and the fix is usually in the tool definition.
- [Context engineering: compaction, notes and sub-agents](https://www.anthropic.com/research/effective-context-engineering-for-ai-agents): Long agent runs fail when the context fills with stale detail.
- [The lethal trifecta: the three capabilities you must not combine carelessly](https://simonwillison.net/2025/Jun/16/the-lethal-trifecta/): Simon Willison names three capabilities that become dangerous together in an agent: access to your private data, exposure to untrusted content, and the ability to communicate externally in a way that could exfiltrate data.

### MCP

- [Model Context Protocol: the official introduction](https://modelcontextprotocol.io/): Home of the open protocol that lets AI applications connect to tools, data and prompts through a common interface.
- [MCP reference servers repository](https://github.com/modelcontextprotocol/servers): Reference implementations of MCP servers, including a filesystem server.
- [MCP in one picture: host, client, server and what each owns](https://modelcontextprotocol.io/docs/learn/architecture): MCP confuses people because three roles share one name.
- [Anatomy of an MCP tool: schema, results and the isError flag](https://modelcontextprotocol.io/specification/2026-07-28/server/tools): A tool in the MCP spec is a small contract: a unique name, a human-readable description, and an inputSchema written as JSON Schema.
- [Before you install an MCP server: a security checklist from the spec authors](https://modelcontextprotocol.io/docs/2026-07-28/tutorials/security/security_best_practices): The MCP project publishes its own security best practices, and one section should change how you install things: local servers run with your privileges.
- [Code execution with MCP: stop dragging every tool result through the model](https://www.anthropic.com/research/code-execution-with-mcp): Two costs appear when an agent talks to many MCP tools directly: every tool definition sits in context up front, and every intermediate result passes through the model.

### RAG

- [LlamaIndex documentation for building RAG over your data](https://developers.llamaindex.ai/python/framework/): Docs for an open-source framework that covers loading data, indexing, retrieval and query engines.
- [Sentence Transformers: embeddings, retrieval and reranking](https://www.sbert.net/): The standard open-source Python library for computing text embeddings and running rerankers, with thousands of pretrained models on the Hugging Face Hub.
- [Contextual retrieval: give every chunk a sentence of context before embedding](https://www.anthropic.com/research/contextual-retrieval): Chunking loses context: a chunk saying "revenue grew 3% over the previous quarter" no longer says which company or period.
- [Pick an embedding model with MTEB, then verify on your own queries](https://huggingface.co/spaces/mteb/leaderboard): The MTEB leaderboard on Hugging Face ranks embedding models across many tasks, which makes it a good place to build a shortlist.
- [Vector search in Postgres: your first pgvector query and index](https://github.com/pgvector/pgvector): If you already run Postgres, pgvector lets you keep embeddings next to your relational data.

### Local AI

- [Ollama: run open models locally with one command](https://github.com/ollama/ollama): Open-source runner that pulls a model and serves it with ollama run, plus a local REST API on port 11434.
- [llama.cpp: C/C++ inference for local models](https://github.com/ggml-org/llama.cpp): The engine behind much of the local-model ecosystem, running GGUF models on CPUs and GPUs.
- [Open WebUI: a self-hosted chat interface for local models](https://github.com/open-webui/open-webui): Open-source, self-hosted web interface designed to run fully offline.
- [Shape a local model with an Ollama Modelfile](https://docs.ollama.com/modelfile): Once Ollama is installed, a Modelfile lets you save a configured variant instead of retyping settings.
- [Serve a local model over an OpenAI-style API with llama-server](https://github.com/ggml-org/llama.cpp/blob/master/tools/server/README.md): llama.cpp ships llama-server, an HTTP server that exposes OpenAI-compatible endpoints such as /v1/chat/completions.
- [Run vLLM when one local user becomes many](https://docs.vllm.ai/en/latest/): Ollama and llama.cpp shine for one person on one machine.
- [Docker Model Runner: pull and run a model like an image](https://docs.docker.com/ai/model-runner/): If your team already lives in Docker, Docker Model Runner offers a familiar workflow for local models.

### Agent Skills

- [Anthropic's open skills repository](https://github.com/anthropics/skills): A repository of example Agent Skills: folders of instructions, scripts and resources that an agent loads when relevant.
- [Agent Skills: the open format](https://agentskills.io): Documentation for the open Agent Skills format, built around a SKILL.md file with a name and description plus optional scripts and references.
- [Write your first SKILL.md: a description that triggers, a body that guides](https://platform.claude.com/docs/en/agents-and-tools/agent-skills/overview): A skill is a folder with a SKILL.md file.
- [Skill hygiene from the open spec: size, structure, validation](https://agentskills.io/specification): The Agent Skills specification is the portable part: a directory with SKILL.md, plus optional scripts/, references/ and assets/.

### AI Coding

- [Aider: AI pair programming in your terminal](https://aider.chat/): Free, open-source terminal tool that edits code in your repository and works with git.
- [Continue: open-source coding agent for VS Code, JetBrains and the CLI](https://github.com/continuedev/continue): Apache-2.0 coding assistant available as a VS Code extension, JetBrains plugin and CLI.
- [Give your coding agent a way to check its own work](https://code.claude.com/docs/en/best-practices): The Claude Code best-practices page makes a point that applies to any coding agent: give it a check to run.
- [AGENTS.md: one instructions file for many coding agents](https://agents.md): AGENTS.md is a plain Markdown file at the repository root, described by its site as a README for agents.
- [Copilot custom instructions: repository-wide and path-specific](https://docs.github.com/en/copilot/how-tos/configure-custom-instructions/add-repository-instructions): GitHub's docs describe two levels of repository instructions for Copilot.

### MLOps

- [MLflow for tracing and evaluating AI applications](https://mlflow.org/docs/latest/): Open-source platform that covers experiment tracking for classic models and tracing, evaluation and monitoring for LLM apps and agents.
- [Langfuse: open-source LLM observability](https://langfuse.com/docs): MIT-licensed, self-hostable platform for tracing LLM calls and agent runs.
- [Evals begin with assertions: Hamel Husain's level-one tests](https://hamel.dev/blog/posts/evals/): Teams stall on evals because they imagine a platform.

### Tools

- [Typed outputs you can trust: validated results with Pydantic AI](https://github.com/pydantic/pydantic-ai): Free-form text is a poor interface between a model and your code.
- [A first prompt eval in a YAML file with promptfoo](https://www.promptfoo.dev/docs/intro/): Promptfoo is an open-source tool that treats prompts like testable code: you declare prompts, providers and test cases, run them, and compare.
- [Inspect AI: write an eval as a task, a solver and a scorer](https://inspect.aisi.org.uk/): Inspect is an open-source framework for LLM evaluations from the UK AI Security Institute.

## Core developer skills

The skills every developer leans on, whatever the stack: version control, the terminal, containers, databases, testing, security and the career side of the job.

### Git

- [Git Mistake First Aid: Plain-English Recovery Recipes](https://dangitgit.com/): A short, no-jargon page of recipes for the Git situations that make people panic: committed to the wrong branch, a bad commit message, an undo that went too far.
- [Atlassian Git Tutorials: Workflows, Merging and Rewriting History](https://www.atlassian.com/git/tutorials): Free, well-illustrated tutorials that go beyond commit and push: branching workflows, merge versus rebase, undoing changes and rewriting history.
- [Undo the Undo: Recovering Lost Commits With git reflog](https://git-scm.com/docs/git-reflog): Git rarely deletes work right away.
- [Challenge: Rescue a Branch You Just Deleted](https://git-scm.com/docs/git-branch): Ten minutes, a scratch repo, no risk.
- [Interactive Rebase: Tidy a Branch Before Asking for Review](https://git-scm.com/docs/git-rebase): A reviewer reads your history as a story, so make it readable.
- [Find the Commit That Broke It: Automated git bisect](https://git-scm.com/docs/git-bisect): When a regression appeared "sometime in the last 200 commits", binary search beats reading diffs.
- [Scrub a Leaked File From History With git filter-repo](https://github.com/newren/git-filter-repo): If a credentials file or a huge binary landed in history, deleting it in a new commit does not remove it from old ones.

### Linux

- [Linux Journey: A Gentle Path From First Command to Confident User](https://linuxjourney.com/): Free lessons in small chunks covering the command line, users and permissions, processes, networking and more.
- [explainshell: Paste a Command, See What Every Part Means](https://explainshell.com/): Paste any shell command and each flag and argument is matched to the relevant excerpt from its manual page.
- [BashPitfalls: The Shell Mistakes Everyone Makes Once](https://mywiki.wooledge.org/BashPitfalls): A catalogue of common Bash bugs, each with a short explanation and a safer pattern: unquoted variables, parsing ls output, misuse of test.
- [Challenge: Find What Is Filling the Disk in Five Minutes](https://man7.org/linux/man-pages/man1/du.1.html): A full disk takes services down quietly, so practice the hunt before you need it.
- [Inspect a Running Process Through /proc](https://man7.org/linux/man-pages/man5/proc.5.html): Linux exposes live process state as files, so you can answer many "what is this thing doing?" questions with cat and ls, even on a minimal container image without extra tools.
- [Make Bash Scripts Fail Loudly: set -euo pipefail Explained](https://www.gnu.org/software/bash/manual/html_node/The-Set-Builtin.html): A script that keeps going after an error can do real damage.
- [Trace a Hung Process With strace](https://man7.org/linux/man-pages/man1/strace.1.html): When a process is stuck and the logs are silent, strace shows what it asks the kernel to do.

### Debugging

- [Brendan Gregg on Linux Performance: Tools Mapped to the Stack](https://www.brendangregg.com/linuxperf.html): A reference page that maps observability and tracing tools to the parts of a Linux system they inspect, with diagrams and talks.
- [The USE Method: A Checklist for Finding Bottlenecks](https://www.brendangregg.com/usemethod.html): A simple method for performance problems: for every resource, check utilization, saturation and errors.
- [Debug Production With Logs, Metrics and Traces: Start With a Question](https://opentelemetry.io/docs/concepts/observability-primer/): Production debugging goes faster when you pick the right signal.

### Docker

- [Docker Build Best Practices: Smaller, Faster, Safer Images](https://docs.docker.com/build/building/best-practices/): The official guidance on writing Dockerfiles: choosing base images, multi-stage builds, layer caching, pinning and cleanup.
- [iximiuz Labs: Hands-On Container and Linux Playgrounds](https://labs.iximiuz.com/): Browser-based playgrounds and challenges for containers, Linux internals and Kubernetes, with a number of free ones.
- [Multi-Stage Docker Builds: Ship the Binary, Not the Toolchain](https://docs.docker.com/build/building/multi-stage/): Build tools, caches and source code have no business in your runtime image.
- [Challenge: Lock Down a Container and Prove It Worked](https://docs.docker.com/reference/cli/docker/container/run/): Run a container with fewer privileges, then verify each restriction yourself.

### SQL

- [Use The Index, Luke: A Free Book on SQL Indexing](https://use-the-index-luke.com/): A free online guide to how database indexes work and how to design them for real queries.
- [PostgreSQL Exercises: Practice SQL Against a Real Database](https://pgexercises.com/): Graded SQL exercises on a small club-membership schema, running in the browser with hints and worked answers.
- [Read a Postgres Query Plan Without Guessing](https://www.postgresql.org/docs/current/using-explain.html): The plan tells you what the database did, so you can stop guessing at indexes.
- [Challenge: Fix a Slow Query With the Right Composite Index](https://www.postgresql.org/docs/current/indexes-multicolumn.html): Build a million-row table, watch a query struggle, then fix it.
- [Isolation Levels in Plain Terms: Pick One on Purpose](https://www.postgresql.org/docs/current/transaction-iso.html): Transactions are not automatically safe from each other.

### APIs

- [Learn OpenAPI: The Official Introduction to Describing APIs](https://learn.openapis.org/): The official learning site from the OpenAPI Initiative explains how to describe an HTTP API in a machine-readable contract.
- [Microsoft Web API Design Best Practices: A Practical Checklist](https://learn.microsoft.com/en-us/azure/architecture/best-practices/api-design): A thorough guide to designing HTTP APIs: resource naming, methods and status codes, pagination, versioning and async operations.
- [Idempotency Keys: Make Retried POST Requests Safe](https://docs.stripe.com/api/idempotent_requests): Networks drop responses, not just requests.
- [Challenge: Replace Offset Pagination With a Keyset Cursor](https://use-the-index-luke.com/no-offset): OFFSET pagination gets slower the deeper you go, and it can skip or repeat rows when data changes between pages.
- [Change an API Without Breaking Anyone: Compatibility Rules](https://google.aip.dev/180): Clients you do not control will depend on every detail you expose.

### System Design

- [System Design Primer: A Map of Scaling Concepts and Trade-offs](https://github.com/donnemartin/system-design-primer): A large open-source study guide covering load balancers, caching, databases, queues and consistency, with diagrams and example designs.
- [Amazon Builders Library: How Large Systems Fail and Recover](https://aws.amazon.com/builders-library/): Articles by Amazon engineers on operating distributed systems, including timeouts, retries with backoff and jitter, and avoiding overload.
- [Cache-Aside Done Right: TTLs, Invalidation and Stampedes](https://learn.microsoft.com/en-us/azure/architecture/patterns/cache-aside): Cache-aside is the usual pattern: the application checks the cache, falls back to the database on a miss, and fills the cache itself.
- [At-Least-Once Queues Need Idempotent Consumers](https://docs.aws.amazon.com/AWSSimpleQueueService/latest/SQSDeveloperGuide/sqs-visibility-timeout.html): Most queues promise at-least-once delivery.

### Testing

- [The Practical Test Pyramid: Deciding What to Test Where](https://martinfowler.com/articles/practical-test-pyramid.html): A long, example-driven article on balancing unit, integration, contract and end-to-end tests.
- [Software Engineering at Google: The Testing Overview Chapter](https://abseil.io/resources/swe-book/html/ch11.html): A free chapter on why tests matter at scale, how test size relates to speed and reliability, and what makes tests maintainable.
- [Challenge: Test Your Code With Properties, Not Just Examples](https://hypothesis.readthedocs.io/en/latest/quickstart.html): Example-based tests check what you thought of.
- [Test Behavior, Not Implementation: Guiding Principles for UI Tests](https://testing-library.com/docs/guiding-principles/): Tests that break on every refactor teach teams to ignore them.

### Security

- [OWASP Top 10: The Standard Awareness List for Web Risks](https://owasp.org/www-project-top-ten/): The widely referenced list of the most critical web application security risks, with explanations and prevention advice for each.
- [Hacksplaining: Interactive Lessons on How Attacks Work](https://www.hacksplaining.com/lessons): Short, free, interactive lessons that walk through attacks such as SQL injection and cross-site scripting, then show how to prevent them in code.
- [Broken Access Control: Stop Users Reading Each Other's Data](https://owasp.org/Top10/A01_2021-Broken_Access_Control/): In the 2021 edition of the OWASP Top 10 this category ranked first, and the common form is simple: change an id in a URL and see someone else's record.
- [Challenge: Break and Fix a Query With SQL Injection](https://owasp.org/www-community/attacks/SQL_Injection): Run this on your own machine, in a throwaway file, to see the attack and the fix side by side.

### Cloud

- [AWS Well-Architected Framework: A Review Lens for Cloud Designs](https://aws.amazon.com/architecture/well-architected/): A set of questions and best practices across areas like security, reliability, cost and operations.
- [Microsoft Learn: Free Cloud Fundamentals and Role-Based Paths](https://learn.microsoft.com/en-us/training/): Free, structured modules and learning paths on cloud concepts, networking, identity and DevOps, many with sandbox environments.
- [IAM Least Privilege: Grant What the Job Needs, Nothing More](https://docs.aws.amazon.com/IAM/latest/UserGuide/best-practices.html): Broad permissions turn a small leak into a big incident.
- [Challenge: Audit Your Cloud Account for Public Storage](https://docs.aws.amazon.com/AmazonS3/latest/userguide/access-control-block-public-access.html): Accidentally public buckets are a classic cloud leak.

### Career

- [Tech Interview Handbook: Resume, Coding and Behavioral Prep](https://www.techinterviewhandbook.org/): A free, curated handbook on the whole job search: resumes, preparing for coding rounds, behavioral questions and negotiation.
- [StaffEng Guides: Growing Beyond Senior Engineer](https://staffeng.com/guides/): Practical guides on technical leadership at senior levels: scope, influence, working with leadership and writing for decisions.
- [Resume Basics: One Page That Survives a Quick Skim](https://www.techinterviewhandbook.org/resume/): A recruiter or engineer may spend under a minute on a first pass, so optimize for scanning.

### Interviews

- [NeetCode Roadmap: A Structured Path Through Coding Problems](https://neetcode.io/roadmap): A free roadmap that groups algorithm problems by pattern, such as two pointers, graphs and dynamic programming, with a visual map of dependencies.
- [Behavioral Interviews: Build a Story Bank Before You Need It](https://www.techinterviewhandbook.org/behavioral-interview/): Behavioral questions test judgment and teamwork.

### Soft Skills

- [Google Technical Writing Courses: Clearer Docs, Issues and Emails](https://developers.google.com/tech-writing): Free, short courses on writing clear technical prose: precise words, active voice, organizing documents and reviewing drafts.
- [Code Review That Helps: Habits for Authors and Reviewers](https://google.github.io/eng-practices/review/): Google's public engineering practices describe a simple standard: approve a change once it improves the overall health of the codebase, even if it is not how you would have written it.
- [Write a Design Doc That Surfaces Trade-offs Early](https://www.industrialempathy.com/posts/design-docs-at-google/): A design doc is for finding problems while changes are still cheap.

## Open source worth reading

Awesome lists, starter templates and complete applications on GitHub, sorted by area. Reading real code is the fastest way to learn how projects are put together.

### Web

- [awesome: the list that defines the format](https://github.com/sindresorhus/awesome): awesome is the meta-list behind the whole awesome-list convention, and it is the place to start when you want a curated index of anything from languages to tooling.
- [create-t3-app: opinionated TypeScript web scaffolding](https://github.com/t3-oss/create-t3-app): A CLI that scaffolds a typed Next.js project, letting you opt into pieces like tRPC, Prisma or Drizzle and Tailwind.
- [epic-stack: a full web app foundation with decisions explained](https://github.com/epicweb-dev/epic-stack): A production-minded starter for a React Router app with Prisma, Playwright tests and Fly.io deployment config.
- [excalidraw: a whiteboard app and an embeddable library](https://github.com/excalidraw/excalidraw): A real, widely used React app that is also published as a component.
- [the-super-tiny-compiler: see a compiler in one file](https://github.com/jamiebuilds/the-super-tiny-compiler): A heavily commented JavaScript file that compiles a toy Lisp-like syntax into C-like calls, walking through tokenising, parsing, transforming and code generation.
- [cal.diy: a scheduling app as a TypeScript monorepo](https://github.com/calcom/cal.diy): A large Next.js scheduling application organised into apps/ (including web, api and docs) and shared packages/ such as prisma, trpc and emails.
- [Next-js-Boilerplate: a tidy starter with tests](https://github.com/ixartz/Next-js-Boilerplate): A Next.js and TypeScript starter that bundles Tailwind, a database layer with Drizzle, linting, Vitest and Playwright.
- [prisma-examples: ready-to-run TypeScript data layer samples](https://github.com/prisma/prisma-examples): A collection of example projects that pair Prisma with different frameworks and databases.

### DevOps

- [awesome-selfhosted: services you can run yourself](https://github.com/awesome-selfhosted/awesome-selfhosted): A long, well-sorted catalogue of free software you can host on your own machines, grouped by what it replaces: wikis, monitoring, chat, media, backups and much more.
- [kubernetes-the-hard-way: build a cluster by hand](https://github.com/kelseyhightower/kubernetes-the-hard-way): A classic tutorial that sets up Kubernetes step by step without installers, so you meet certificates, the API server, etcd and kubelet configuration directly.
- [awesome-compose: Docker Compose samples for common stacks](https://github.com/docker/awesome-compose): Ready-made Compose setups for pairings like Flask with Redis, Django, Nginx with Go and MySQL, Elasticsearch with Kibana, and more.
- [starter-workflows: GitHub Actions templates by use case](https://github.com/actions/starter-workflows): The official source of the workflow suggestions GitHub shows when you set up Actions.
- [microservices-demo: Online Boutique on Kubernetes](https://github.com/GoogleCloudPlatform/microservices-demo): A polyglot web shop split into small services that talk over gRPC, designed to demonstrate cloud-native tooling.
- [awesome-docker: containers, tooling and learning resources](https://github.com/veggiemonk/awesome-docker): A curated map of the Docker ecosystem: tooling, security scanners, orchestration, CI helpers and tutorials.
- [ansible-for-devops: playbooks that grow with the book](https://github.com/geerlingguy/ansible-for-devops): Example playbooks from a well-known Ansible book, from simple to multi-server setups.
- [opentelemetry-demo: a shop instrumented end to end](https://github.com/open-telemetry/opentelemetry-demo): A multi-language storefront built to show traces, metrics and logs in practice.
- [terraform-aws-vpc: a module worth copying habits from](https://github.com/terraform-aws-modules/terraform-aws-vpc): A widely used Terraform module for AWS networking.
- [podinfo: a small Go service for Kubernetes demos](https://github.com/stefanprodan/podinfo): A tiny web service used to try out deployment patterns.

### Backend

- [awesome-go: the Go ecosystem, categorised](https://github.com/avelino/awesome-go): If you write Go, this is the quickest way to find a library for routing, databases, CLIs, testing or concurrency without guessing.
- [rustlings: small exercises that teach Rust](https://github.com/rust-lang/rustlings): Tiny broken programs you fix until they compile, each one introducing a Rust idea such as ownership, enums or traits.
- [full-stack-fastapi-template: a deployable API and UI](https://github.com/fastapi/full-stack-fastapi-template): A complete starting point pairing a FastAPI backend with a React frontend, PostgreSQL and Docker Compose.
- [awesome-rust: where Rust projects are indexed](https://github.com/rust-unofficial/awesome-rust): A broad index of Rust libraries, applications and resources, organised by domain from web frameworks to embedded and games.
- [awesome-scalability: reading list for large-system design](https://github.com/binhnguyennus/awesome-scalability): A reading list of engineering write-ups on scalability, availability and stability, grouped by topic and by company.
- [TheAlgorithms/Python: algorithms with readable implementations](https://github.com/TheAlgorithms/Python): A large collection of algorithms and data structures written in plain Python for study.
- [mal: write a Lisp interpreter in small steps](https://github.com/kanaka/mal): A guided project to build a Lisp in numbered steps, with the same design implemented in dozens of languages under impls/.
- [cookiecutter-django: production defaults for Django](https://github.com/cookiecutter/cookiecutter-django): A project generator that outputs a Django app with Docker, settings per environment, testing, and optional extras.
- [ardanlabs/service: a layered Go service starter](https://github.com/ardanlabs/service): A reference layout for production Go web services with Kubernetes in mind.

### Mobile

- [awesome-ios: Swift and iOS libraries by topic](https://github.com/vsouza/awesome-ios): A large index of iOS and Swift projects grouped by purpose: networking, architecture, UI components, testing, tooling and learning material.
- [react-native-template-obytes: Expo app with good defaults](https://github.com/obytes/react-native-template-obytes): A mobile starter built on Expo and TypeScript with Maestro end-to-end flows in .maestro/, EAS build config in eas.json, and an organised src/ folder.
- [architecture-samples: Android app structure, compared](https://github.com/android/architecture-samples): Google's reference to-do app showing how to structure an Android project with Compose, Hilt and Room.
- [Now in Android: a full modern Android reference](https://github.com/android/nowinandroid): A working news app that Google uses to demonstrate current Android practice: modular layout, Compose UI, offline-first data and thorough testing.
- [awesome-android-ui: components worth studying](https://github.com/wasabeef/awesome-android-ui): A visual catalogue of Android UI libraries: animations, lists, dialogs, charts, transitions and more, with pointers to each repo.
- [Signal-Android: study a security-minded messenger](https://github.com/signalapp/Signal-Android): The Android client of a privacy-focused messenger, with a large modular Gradle layout (app/, lib/, core/) and a reproducible-builds/ folder explaining verifiable builds.
- [flutter/samples: small apps for each Flutter feature](https://github.com/flutter/samples): The Flutter team's collection of samples, each in its own folder: animations/, form_app/, compass_app/ and more.

### GameDev

- [magictools: a game developer's reference shelf](https://github.com/ellisonleao/magictools): One list that covers the practical side of making games: engines, art and audio tools, level editors, tutorials and communities.
- [godot-demo-projects: small Godot games to read and run](https://github.com/godotengine/godot-demo-projects): Official demos that each isolate one feature of the Godot engine, so you can open a project and see exactly how it is wired.
- [Godot Engine: read a real game engine's source](https://github.com/godotengine/godot): A full 2D and 3D engine and editor in C++.
- [raylib: a friendly C library for making games](https://github.com/raysan5/raylib): A small, readable graphics and game library with a simple API and almost no dependencies.
- [OpenRCT2: a C++ game rebuilt and maintained in the open](https://github.com/OpenRCT2/OpenRCT2): An open-source reimplementation of a classic park simulation game.
- [Mindustry: a complete Java game with desktop, Android and server](https://github.com/Anuken/Mindustry): A tower defence and factory game with its logic in core/, platform launchers in desktop/, android/ and ios/, and a headless server/ module.
- [Bevy: a data-driven game engine in Rust](https://github.com/bevyengine/bevy): A modular engine built around an entity component system.

### Data/ML

- [awesome-machine-learning: libraries by language](https://github.com/josephmisiti/awesome-machine-learning): A language-by-language index of machine learning libraries, which makes it easy to see what exists in, say, Go or Rust and not only Python.
- [ML-For-Beginners: a 12-week classical ML curriculum](https://github.com/microsoft/ML-For-Beginners): A lesson-based course built around classical machine learning: regression, classification, clustering, NLP and time series, with quizzes and notebooks.
- [cookiecutter-data-science: a sane layout for ML projects](https://github.com/drivendataorg/cookiecutter-data-science): A project template that gives data work a consistent structure for data, notebooks, source code and docs.
- [handson-ml3: notebooks for classical and deep learning](https://github.com/ageron/handson-ml3): The code companion to a popular machine learning book, delivered as Jupyter notebooks that move from the basics to neural networks with Keras.
- [DuckDB: an analytical database you can read](https://github.com/duckdb/duckdb): An in-process SQL engine for analytics, written in C++.

### Security

- [OWASP Cheat Sheet Series: concise security guidance](https://github.com/OWASP/CheatSheetSeries): Short, practical notes on how to build safely: authentication, session handling, input validation, secrets, REST security, Docker and many more.
- [Trivy: a vulnerability and misconfiguration scanner in Go](https://github.com/aquasecurity/trivy): A defensive scanner for container images, filesystems, IaC and dependencies.
- [age: a small, modern file encryption tool in Go](https://github.com/FiloSottile/age): A compact encryption library and CLI designed to be simple and hard to misuse.
- [OWASP Web Security Testing Guide: a methodical checklist](https://github.com/OWASP/wstg): A defensive guide for testing web applications you own or are authorised to assess, organised by area such as authentication, session management and input handling.
- [OpenSSF Scorecard: automated checks on repo security habits](https://github.com/ossf/scorecard): A Go tool that scores open source projects on practices such as branch protection, dependency updates and pinned workflows.
- [Falco: runtime threat detection for containers](https://github.com/falcosecurity/falco): A defensive runtime security tool that watches system activity and raises alerts based on rules.

### AI

- [LLMs-from-scratch: build a GPT-style model step by step](https://github.com/rasbt/LLMs-from-scratch): Code companion to a book on implementing a small language model in PyTorch, from tokenisation and attention to pretraining and fine-tuning.
- [chatbot: a Next.js AI chat app you can deploy](https://github.com/vercel/chatbot): A maintained reference for building a streaming chat product with the AI SDK, a database and authentication.
- [llama.cpp: LLM inference in plain C and C++](https://github.com/ggml-org/llama.cpp): A compact route to understanding how local language models actually run: quantised weights, a tensor library and efficient CPU and GPU backends.
- [generative-ai-for-beginners: lessons on building LLM apps](https://github.com/microsoft/generative-ai-for-beginners): A numbered course on building with large language models, covering prompts, text generation apps, chat, search, RAG and agents.
- [micrograd: backpropagation in a few hundred lines](https://github.com/karpathy/micrograd): A tiny automatic-differentiation engine plus a small neural network library, built to show what frameworks do under the hood.
- [openai-cookbook: worked examples for API-based apps](https://github.com/openai/openai-cookbook): A large set of notebooks and articles on building with LLM APIs: retrieval, function calling, evaluation, embeddings and more.
- [pydantic-ai: typed agents in Python](https://github.com/pydantic/pydantic-ai): An agent framework from the Pydantic team that leans on type hints for tools and structured outputs.

## Free ways to learn to code

Free courses, books, docs and practice sites, sorted by area and marked by level, so you can start where you are.

### General

- [CS50x](https://cs50.harvard.edu/x/): Harvard's free introduction to computer science.
- [The Missing Semester of Your CS Education](https://missing.csail.mit.edu/): MIT lectures on the tools most courses skip: the shell, editors, Git, debugging and more.
- [Devhints](https://devhints.io/): A big collection of short, readable cheatsheets for languages, frameworks and command-line tools.
- [GitHub Git Cheat Sheet](https://education.github.com/git-cheat-sheet-education.pdf): A one-page PDF of the Git commands you will use every day.
- [roadmap.sh](https://roadmap.sh/): Community-built learning roadmaps and guides for almost every developer role.
- [Pro Git](https://git-scm.com/book/en/v2): The complete Git book, free to read online, from the basics to how Git works internally.
- [The Python Tutorial](https://docs.python.org/3/tutorial/): The official Python tutorial.
- [Learn Git Branching](https://learngitbranching.js.org/): An interactive, visual way to learn branching and rebasing right in your browser.
- [freeCodeCamp on YouTube](https://www.youtube.com/c/Freecodecamp): Thousands of hours of free full-length programming courses on nearly every topic.

### Web

- [freeCodeCamp](https://www.freecodecamp.org/): A free interactive curriculum with projects and certifications, covering web development, Python, data and more.
- [The Odin Project](https://www.theodinproject.com/): A free, project-based full-stack web curriculum that teaches you to use real tools from the start.
- [Full Stack Open](https://fullstackopen.com/en/): The University of Helsinki's free course on modern web development with React, Node.js and testing.
- [MDN: Learn web development](https://developer.mozilla.org/en-US/docs/Learn_web_development): Mozilla's structured path through HTML, CSS and JavaScript, from one of the web's most trusted references.
- [Eloquent JavaScript](https://eloquentjavascript.net/): A well-loved book on JavaScript and programming in general, free to read online.

### Data/ML

- [Practical Deep Learning for Coders](https://course.fast.ai/): fast.ai's free course teaches deep learning by building working models first and explaining the theory after.
- [Kaggle Learn](https://www.kaggle.com/learn): Short, free, hands-on micro-courses on Python, pandas, SQL and machine learning that run in the browser.

### Mobile

- [Android Basics with Compose](https://developer.android.com/courses/android-basics-compose/course): Google's free course for building Android apps with Kotlin and Jetpack Compose, with no experience needed.
- [The Swift Programming Language](https://docs.swift.org/swift-book/): The official guide to Swift, free online.
- [Flutter documentation](https://docs.flutter.dev/): Official docs and learning paths for building iOS, Android, web and desktop apps from one codebase.

### Security

- [OWASP Cheat Sheet Series](https://cheatsheetseries.owasp.org/): Concise, practical guidance on specific application security topics such as authentication and input validation.
- [Web Security Academy](https://portswigger.net/web-security): Free, legal labs from PortSwigger that teach real web vulnerabilities and how to prevent them.
- [OverTheWire Wargames](https://overthewire.org/wargames/): Legal hacking games that teach Linux and security concepts.

### DevOps

- [tldr pages](https://tldr.sh/): Community-written command-line help with practical examples, instead of long man pages.
- [Site Reliability Engineering](https://sre.google/sre-book/table-of-contents/): Google's book on running production systems, free to read online.
- [Docker: Get started](https://docs.docker.com/get-started/): The official hands-on introduction to containers, images and Compose.
- [Kubernetes Basics](https://kubernetes.io/docs/tutorials/kubernetes-basics/): The official interactive tutorial for deploying, scaling and updating an app on Kubernetes.

### Frontend

- [web.dev Learn](https://web.dev/learn): Free courses from Chrome's developer relations team on CSS, performance, accessibility and more.

### Backend

- [The Twelve-Factor App](https://12factor.net/): A short, influential guide to building services that are easy to deploy, configure and scale.
- [The Rust Programming Language](https://doc.rust-lang.org/book/): The official Rust book, free online.
- [SQLBolt](https://sqlbolt.com/): Short interactive lessons that teach SQL by writing real queries in the browser.
- [A Tour of Go](https://go.dev/tour/): The official interactive introduction to Go.

### GameDev

- [Learn OpenGL](https://learnopengl.com/): A free, thorough guide to modern graphics programming, from your first triangle to advanced lighting.
- [Godot documentation](https://docs.godotengine.org/en/stable/): Official docs for the free, open-source Godot engine, including step-by-step first game tutorials.

## Tools developers keep

Command-line tools, frameworks and libraries that save time every week, from Kubernetes dashboards to infrastructure as code.

### DevOps

- [OpenTofu](https://opentofu.org/): An open-source, community-driven infrastructure-as-code tool that is a fork of Terraform.
- [Ansible](https://docs.ansible.com/): Agentless automation for configuring servers and deploying software using readable YAML playbooks.
- [Prometheus](https://prometheus.io/): A widely used open-source monitoring system and time-series database with its own query language.
- [Grafana](https://grafana.com/oss/grafana/): Open-source dashboards for your metrics, logs and traces from many data sources.
- [k9s](https://k9scli.io/): A terminal UI for managing Kubernetes clusters.
- [ShellCheck](https://www.shellcheck.net/): A linter that finds bugs in shell scripts, such as unquoted variables.
- [hadolint](https://github.com/hadolint/hadolint): A Dockerfile linter that catches bad practices and checks the shell code inside your RUN instructions.
- [dive](https://github.com/wagoodman/dive): Explore each layer of a Docker image and find wasted space, so you can make your images smaller.
- [act](https://github.com/nektos/act): Run your GitHub Actions workflows locally to test changes without pushing a commit every time.
- [Uptime Kuma](https://github.com/louislam/uptime-kuma): A self-hosted monitoring tool with a clean dashboard, status pages and many notification options.
- [tmux](https://github.com/tmux/tmux): A terminal multiplexer.
- [Renovate](https://github.com/renovatebot/renovate): Automates dependency updates by opening pull requests, so your projects do not silently fall behind.

### Security

- [Trivy](https://trivy.dev/): An open-source scanner for vulnerabilities and misconfigurations in containers, code and infrastructure.
- [Gitleaks](https://github.com/gitleaks/gitleaks): Finds passwords, API keys and tokens in your Git history.
- [Semgrep](https://github.com/semgrep/semgrep): Fast static analysis for many languages, with rules that look like the code you are searching for.
- [ZAP](https://www.zaproxy.org/): A free, open-source web application security scanner.
- [Wireshark](https://www.wireshark.org/): The classic network protocol analyzer.

### Backend

- [FastAPI](https://fastapi.tiangolo.com/): A modern Python web framework that uses type hints for validation and automatic API docs.
- [PostgreSQL](https://www.postgresql.org/): A powerful open-source relational database and a safe default for most applications.
- [Caddy](https://caddyserver.com/): A web server and reverse proxy that gets and renews HTTPS certificates automatically, with very little configuration.
- [Bruno](https://www.usebruno.com/): An open-source API client that stores your collections as plain files, so they can live in Git with your code.
- [SQLite](https://www.sqlite.org/): A small, reliable database stored in a single file, with no server required.
- [Hoppscotch](https://hoppscotch.io/): A lightweight, open-source API testing tool that runs in your browser and can also be self-hosted.
- [Valkey](https://valkey.io/): An open-source, high-performance key-value datastore, forked from Redis and backed by the Linux Foundation.
- [HTTPie](https://github.com/httpie/cli): A friendly command-line HTTP client with readable syntax and formatted output, made for working with APIs.

### Frontend

- [Vite](https://vite.dev/): A fast frontend build tool and dev server with instant updates as you edit.
- [htmx](https://htmx.org/): A small library that adds dynamic behaviour with HTML attributes.

### Web

- [Playwright](https://playwright.dev/): Reliable end-to-end browser testing across Chromium, Firefox and WebKit.

### Data/ML

- [scikit-learn](https://scikit-learn.org/): The standard Python library for classic machine learning, with excellent documentation.
- [Hugging Face Transformers](https://github.com/huggingface/transformers): An open-source library for using and training state-of-the-art machine learning models.
- [DuckDB](https://duckdb.org/): An in-process analytical database.

### Mobile

- [Flutter](https://flutter.dev/): Google's open-source UI toolkit for building mobile, web and desktop apps from a single codebase.

### App

- [Tauri](https://tauri.app/): Build small, secure desktop and mobile apps with a web frontend and a Rust backend.

### GameDev

- [Godot Engine](https://godotengine.org/): A free and open-source 2D and 3D game engine with no royalties.

### General

- [ripgrep](https://github.com/BurntSushi/ripgrep): An extremely fast tool for searching code that respects your .gitignore by default.
- [jq](https://jqlang.org/): A small command-line tool for slicing, filtering and transforming JSON.
- [lazygit](https://github.com/jesseduffield/lazygit): A simple terminal UI for Git.
- [fzf](https://github.com/junegunn/fzf): A general-purpose fuzzy finder for the command line.
- [pre-commit](https://pre-commit.com/): A framework for managing Git hooks, so linters and formatters run automatically before every commit.
- [bat](https://github.com/sharkdp/bat): A cat replacement with syntax highlighting, line numbers and Git integration.
- [MkDocs](https://www.mkdocs.org/): Turn a folder of Markdown files into a clean documentation site, with very little setup.
- [Excalidraw](https://excalidraw.com/): A free, open-source whiteboard with a hand-drawn style.

## Join

Talk about any of these with other developers: **[join DevOps Lounge on Discord](https://discord.gg/XHtBz8rZp5)**.
