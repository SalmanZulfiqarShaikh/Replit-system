export interface RoadmapEpisode {
  id: string;
  title: string;
  phase: string;
}

export interface RoadmapPhase {
  id: string;
  title: string;
  duration: string;
  skills: string[];
  resources: { name: string; url: string }[];
  episodes: RoadmapEpisode[];
  isBlackout?: boolean;
}

export const ROADMAP_PHASES: RoadmapPhase[] = [
  {
    id: "phase-1",
    title: "Backend + Voice AI Foundations",
    duration: "~6.5 weeks (Mar 29 - May 13)",
    skills: ["Node.js", "Express", "MongoDB", "JWT", "WebSockets", "Voice AI Agents"],
    resources: [
      { name: "Piyush Episodes 23-41", url: "https://youtube.com/playlist?list=PLinedj3B30sDby4Al-i13hQJGQoRQDfPo" },
      { name: "Udemy Voice AI Course", url: "https://www.udemy.com/course/master-ai-voice-agents-automate-calls-with-ai-and-no-code/" }
    ],
    episodes: Array.from({ length: 19 }, (_, i) => ({
      id: `ep-${i + 23}`,
      title: `Episode ${i + 23}`,
      phase: "phase-1"
    }))
  },
  {
    id: "phase-blackout",
    title: "BLACKOUT: 3rd Semester Exams",
    duration: "May 14 - Jun 19",
    skills: ["ZERO CODING"],
    resources: [],
    episodes: [],
    isBlackout: true
  },
  {
    id: "phase-2",
    title: "Next.js + Postgres Basics",
    duration: "~1.5 weeks (Jun 20)",
    skills: ["Next.js 15", "Server Actions", "PostgreSQL", "Prisma"],
    resources: [],
    episodes: [
      { id: "ep-next-1", title: "Next.js Routing & Actions", phase: "phase-2" },
      { id: "ep-next-2", title: "Postgres Setup & Prisma", phase: "phase-2" }
    ]
  },
  {
    id: "phase-3",
    title: "Hyper-Vibe Coding",
    duration: "~1 week",
    skills: ["Cursor AI", "Claude Code", "Supabase", "Stripe"],
    resources: [
      { name: "Vibe Coding Course", url: "https://youtu.be/gcuR_-rzlDw" }
    ],
    episodes: [
      { id: "ep-vibe-1", title: "Vibe Coding Masterclass", phase: "phase-3" }
    ]
  },
  {
    id: "phase-4",
    title: "SHIP THE STARTUP",
    duration: "~1.5 weeks",
    skills: ["Multi-tenant SaaS", "n8n Webhooks", "Stripe Billing", "Production Deploy"],
    resources: [],
    episodes: [
      { id: "ep-ship-1", title: "SaaS Architecture", phase: "phase-4" },
      { id: "ep-ship-2", title: "Billing Integration", phase: "phase-4" },
      { id: "ep-ship-3", title: "Launch Day", phase: "phase-4" }
    ]
  },
  {
    id: "phase-5",
    title: "Python Foundation",
    duration: "~2 weeks (Jul 20)",
    skills: ["Python Syntax", "OOP", "Async/Await"],
    resources: [
      { name: "CampusX Python Days 1-45", url: "https://www.youtube.com/playlist?list=PLGjplNEQ1it8-0CmoljS5yeV-GlKSUEt0" }
    ],
    episodes: Array.from({ length: 15 }, (_, i) => ({
      id: `ep-py-${i + 1}`,
      title: `Python Day ${(i * 3) + 1}-${(i * 3) + 3}`,
      phase: "phase-5"
    }))
  },
  {
    id: "phase-6a",
    title: "FastAPI",
    duration: "~1 week",
    skills: ["FastAPI", "Pydantic", "Docker"],
    resources: [
      { name: "CampusX FastAPI", url: "https://www.youtube.com/playlist?list=PLKnIA16_RmvZ41tjbKB2ZnwchfniNsMuQ" }
    ],
    episodes: [
      { id: "ep-fast-1", title: "FastAPI Basics", phase: "phase-6a" },
      { id: "ep-fast-2", title: "Advanced FastAPI", phase: "phase-6a" }
    ]
  },
  {
    id: "phase-6b",
    title: "LangChain + RAG Systems",
    duration: "~4 weeks",
    skills: ["LangChain", "ChromaDB", "RAG Pipelines"],
    resources: [],
    episodes: [
      { id: "ep-rag-1", title: "Vector DBs Intro", phase: "phase-6b" },
      { id: "ep-rag-2", title: "Building RAG", phase: "phase-6b" },
      { id: "ep-rag-3", title: "Advanced Retrieval", phase: "phase-6b" }
    ]
  },
  {
    id: "phase-7",
    title: "Agentic AI",
    duration: "~4 weeks",
    skills: ["LangGraph", "AutoGen", "CrewAI"],
    resources: [],
    episodes: [
      { id: "ep-agent-1", title: "Agent Concepts", phase: "phase-7" },
      { id: "ep-agent-2", title: "Multi-Agent Systems", phase: "phase-7" },
      { id: "ep-agent-3", title: "Real-world Agents", phase: "phase-7" }
    ]
  }
];

export const LEADERBOARD = [
  { rank: 1, name: "Ahmad K.", hours: 47, isUser: false },
  { rank: 2, name: "You", hours: 0, isUser: true }, // Hours will be dynamically updated
  { rank: 3, name: "Raza M.", hours: 31, isUser: false },
  { rank: 4, name: "Sara J.", hours: 28, isUser: false },
  { rank: 5, name: "Ali B.", hours: 19, isUser: false },
];
