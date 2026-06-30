import React, { useState } from 'react';
import styles from './Paths.module.css';

interface PathActivity {
    id: number;
    title: string;
    tags: string[];
    duration: string;
    description: string;
}

interface PathItem {
    id: number;
    title: string;
    category: string;
    managedBy: string;
    description: string;
    modules: number;
    duration: string;
    activitiesCount: number;
    lastUpdated: string;
    activities: PathActivity[];
}

const PATHS_DATA: PathItem[] = [
    {
        id: 1,
        title: "DevSecOps",
        category: "Security",
        managedBy: "Google Cloud",
        description: "Integrate security practices into your DevOps pipeline. Learn container security, vulnerability scanning, and secure deployments on Google Cloud.",
        modules: 4,
        duration: "12 hours",
        activitiesCount: 12,
        lastUpdated: "Last updated 2 days ago",
        activities: [
            {
                id: 101,
                title: "Introduction to DevSecOps on Google Cloud",
                tags: ["Course"],
                duration: "2 hours",
                description: "Understand the core principles of DevSecOps and how Google Cloud tools facilitate security automation throughout the development lifecycle."
            },
            {
                id: 102,
                title: "Configuring Cloud Build for Secure Deployments",
                tags: ["Lab"],
                duration: "1 hour",
                description: "In this hands-on lab, you will configure a Cloud Build pipeline to scan container images for vulnerabilities before deploying."
            },
            {
                id: 103,
                title: "Vulnerability Scanning with Artifact Registry",
                tags: ["Course", "Skill badge"],
                duration: "2 hours",
                description: "Learn how to use Artifact Registry to store and automatically scan container images for security vulnerabilities."
            },
            {
                id: 104,
                title: "Secure Kubernetes Containers with GKE",
                tags: ["Course", "Skill badge"],
                duration: "7 hours",
                description: "Implement security best practices on Google Kubernetes Engine (GKE), including role-based access control and network policies."
            }
        ]
    },
    {
        id: 2,
        title: "Vertex AI Search for Retail",
        category: "AI / ML",
        managedBy: "Google Cloud",
        description: "Build advanced retail search engines using Vertex AI. Learn query understanding, personalized recommendations, and semantic search.",
        modules: 3,
        duration: "8 hours",
        activitiesCount: 9,
        lastUpdated: "Last updated 1 week ago",
        activities: [
            {
                id: 201,
                title: "Introduction to Vertex AI Search",
                tags: ["Course"],
                duration: "2 hours",
                description: "Explore the capabilities of Vertex AI Search and how it enables search engines optimized for retail products and customer queries."
            },
            {
                id: 202,
                title: "Setting Up Retail Data Stores & Search Engines",
                tags: ["Lab"],
                duration: "1.5 hours",
                description: "Learn to ingest retail catalog data into Vertex AI Search, configure schema mappings, and run search queries in Google Cloud."
            },
            {
                id: 203,
                title: "Configuring Recommendations and Personalization",
                tags: ["Course", "Skill badge"],
                duration: "4.5 hours",
                description: "Implement personalization algorithms and product recommendations based on search histories and customer behavior."
            }
        ]
    },
    {
        id: 3,
        title: "Professional Cloud Architect Certification Renewal",
        category: "Infrastructure",
        managedBy: "Google Cloud",
        description: "Refresh and renew your Google Cloud Architect certification. Deepen your knowledge of HA design, migrations, and cost optimization.",
        modules: 5,
        duration: "16 hours",
        activitiesCount: 15,
        lastUpdated: "Last updated 5 days ago",
        activities: [
            {
                id: 301,
                title: "Cloud Architecture Best Practices",
                tags: ["Course"],
                duration: "4 hours",
                description: "Review core architecture principles on GCP: reliability, operational excellence, security, performance, and cost optimization."
            },
            {
                id: 302,
                title: "Designing for High Availability on Compute Engine",
                tags: ["Lab"],
                duration: "2 hours",
                description: "Hands-on implementation of managed instance groups, autoscaling, and global load balancing for high-availability apps."
            },
            {
                id: 303,
                title: "Designing Secure and Cost-Optimized Architectures",
                tags: ["Course", "Skill badge"],
                duration: "10 hours",
                description: "Review advanced cost management practices, resource optimization tools, identity management, and compliance on Google Cloud."
            }
        ]
    },
    {
        id: 4,
        title: "Professional Machine Learning Engineer Certification",
        category: "AI / ML",
        managedBy: "Google Cloud",
        description: "A Machine Learning Engineer designs, builds, and productionizes ML systems to solve business challenges. This certification learning path provides the advanced knowledge and practical skills required for this role, preparing you to successfully operate and maintain ML systems on Google Cloud.\n\nThrough a curated collection of on-demand courses, labs, and skill badges, you will gain real-world, applied experience with Google Cloud technologies. This path focuses on the essential skills for the ML Engineer role, from designing and building ML systems to optimizing and maintaining them in production.\n\nUpon completion, you will be equipped with the skills validated by the Professional Machine Learning Engineer certification. Take the next step in your professional journey and demonstrate your expertise by preparing for the Google Cloud Professional Machine Learning Engineer exam.\n#googlecloudcertified",
        modules: 6,
        duration: "24 hours",
        activitiesCount: 18,
        lastUpdated: "Last updated 4 days ago",
        activities: [
            {
                id: 401,
                title: "Build a Certification Study Guide: PMLE",
                tags: ["Course"],
                duration: "1 hour",
                description: "Learn how to use NotebookLM to create a personalized study guide for the Professional Machine Learning Engineer certification exam."
            },
            {
                id: 402,
                title: "A Tour of Google Cloud Hands-on Labs",
                tags: ["Lab"],
                duration: "45 minutes",
                description: "In this first hands-on lab you will access the Google Cloud console and use these basic Google Cloud features: Projects, Resources, IAM."
            },
            {
                id: 403,
                title: "Introduction to AI and Machine Learning on Google Cloud",
                tags: ["Course"],
                duration: "8 hours",
                description: "This course introduces Google Cloud's AI and machine learning (ML) capabilities, with a focus on developing both generative and predictive ML workflows."
            },
            {
                id: 404,
                title: "Prepare Data for ML APIs on Google Cloud",
                tags: ["Course", "Skill badge"],
                duration: "45 minutes",
                description: "Complete the introductory Prepare Data for ML APIs on Google Cloud skill badge to demonstrate skills in the following: cleaning data, API usage, and pipeline setup."
            },
            {
                id: 405,
                title: "Create ML Models with BigQuery ML",
                tags: ["Course", "Skill badge"],
                duration: "30 minutes",
                description: "Complete the intermediate Create ML Models with BigQuery ML skill badge to demonstrate skills in creating and evaluating machine learning models using standard SQL."
            },
            {
                id: 406,
                title: "Engineer Data for Predictive Modeling with BigQuery ML",
                tags: ["Course", "Skill badge"],
                duration: "30 minutes",
                description: "Complete the intermediate Engineer Data for Predictive Modeling with BigQuery ML skill badge to demonstrate skills in the following: feature engineering and hyperparameter tuning."
            },
            {
                id: 407,
                title: "[Deprecated] Build, Train and Deploy ML Models with Keras on Google Cloud",
                tags: ["Course"],
                duration: "3 hours",
                description: "This course covers building ML models with Keras on Google Cloud, training models, and deploying them to Vertex AI endpoints for online predictions."
            },
            {
                id: 408,
                title: "Production Machine Learning Systems",
                tags: ["Course"],
                duration: "4 hours",
                description: "This course covers how to implement the various flavors of production ML systems—static, dynamic, batch, and online inference."
            },
            {
                id: 409,
                title: "Machine Learning Operations (MLOps): Getting Started",
                tags: ["Course"],
                duration: "5 hours",
                description: "This course introduces participants to MLOps tools and best practices for deploying, evaluating, monitoring, and operating production ML systems."
            }
        ]
    },
    {
        id: 5,
        title: "Agentic AI on Google Cloud",
        category: "Agents",
        managedBy: "Google Cloud",
        description: "Develop autonomous AI agents using Gemini and LangChain on GCP. Implement tools, agent orchestration, and memory systems.",
        modules: 4,
        duration: "10 hours",
        activitiesCount: 12,
        lastUpdated: "Last updated 3 days ago",
        activities: [
            {
                id: 501,
                title: "Fundamentals of Agentic AI",
                tags: ["Course"],
                duration: "2 hours",
                description: "Explore the core definitions, designs, and use cases of agentic workflows, function calling, and reasoning loops."
            },
            {
                id: 502,
                title: "Building Agents using LangChain & Gemini",
                tags: ["Lab"],
                duration: "1.5 hours",
                description: "Build an interactive chatbot agent using Gemini Pro and LangChain. Implement memory, web search tools, and routing."
            },
            {
                id: 503,
                title: "Agent Orchestration with GCP Tools",
                tags: ["Course"],
                duration: "3 hours",
                description: "Deploy complex Multi-Agent architectures using Vertex AI Agent Builder, Cloud Functions, and firewalls."
            },
            {
                id: 504,
                title: "Evaluating and Monitoring Agent Behaviour",
                tags: ["Course", "Skill badge"],
                duration: "3.5 hours",
                description: "Integrate evaluation frameworks to verify safety guidelines, trace steps, monitor execution costs, and optimize agent actions."
            }
        ]
    },
    {
        id: 6,
        title: "Professional Cloud Architect Certification",
        category: "Infrastructure",
        managedBy: "Google Cloud",
        description: "Master Google Cloud solutions architecture. Study compute, networking, storage, databases, and DevOps automation from the ground up.",
        modules: 8,
        duration: "32 hours",
        activitiesCount: 24,
        lastUpdated: "Last updated 1 week ago",
        activities: [
            {
                id: 601,
                title: "Google Cloud Fundamentals: Core Infrastructure",
                tags: ["Course"],
                duration: "6 hours",
                description: "Get started with the fundamentals of computing, virtual networking, IAM, databases, and containers on Google Cloud."
            },
            {
                id: 602,
                title: "Architecting with Google Compute Engine",
                tags: ["Course"],
                duration: "8 hours",
                description: "Deep dive into virtual machines, disks, auto-scaling, resource monitoring, load balancing, and design patterns."
            },
            {
                id: 603,
                title: "Configuring VPC Networks and Load Balancing",
                tags: ["Lab"],
                duration: "2 hours",
                description: "Configure custom VPC networks, establish firewall rules, implement internal load balancer and global HTTP(S) load balancer."
            },
            {
                id: 604,
                title: "Architecting with Google Kubernetes Engine",
                tags: ["Course", "Skill badge"],
                duration: "16 hours",
                description: "Develop containerized application architectures. Learn cluster administration, deployments, services, storage, and secrets."
            }
        ]
    },
    {
        id: 7,
        title: "BigQuery and Data Analytics Fundamentals",
        category: "Data",
        managedBy: "Google Cloud",
        description: "Dive into cloud data warehousing. Master SQL queries, data modeling, ingestion, and real-time visualization with BigQuery.",
        modules: 4,
        duration: "10 hours",
        activitiesCount: 12,
        lastUpdated: "Last updated 6 days ago",
        activities: [
            {
                id: 701,
                title: "Google Cloud Big Data and Machine Learning Fundamentals",
                tags: ["Course"],
                duration: "4 hours",
                description: "An overview of data pipelines, streaming architectures, managed databases, and analytical tools on GCP."
            },
            {
                id: 702,
                title: "Writing Optimized SQL Queries in BigQuery",
                tags: ["Lab"],
                duration: "2 hours",
                description: "Implement partitioning, clustering, nested fields, and explain plan analysis to optimize large scale BigQuery storage."
            },
            {
                id: 703,
                title: "Building BI Dashboards using Looker Studio",
                tags: ["Course", "Skill badge"],
                duration: "4 hours",
                description: "Connect BigQuery datasets to Looker Studio. Create interactive tables, charts, filters, and share findings."
            }
        ]
    },
    {
        id: 8,
        title: "Modern DevTools and CI/CD on GCP",
        category: "Dev Tools",
        managedBy: "Google Cloud",
        description: "Automate code deployments. Learn how to configure Cloud Build, Artifact Registry, and Google Cloud Deploy pipelines.",
        modules: 3,
        duration: "7 hours",
        activitiesCount: 9,
        lastUpdated: "Last updated 4 days ago",
        activities: [
            {
                id: 801,
                title: "Continuous Integration on GCP",
                tags: ["Course"],
                duration: "2 hours",
                description: "Automate tests and builds. Configure source code repositories, triggers, and integrations with Cloud Source Repositories."
            },
            {
                id: 802,
                title: "Creating Automated Build Pipelines with Cloud Build",
                tags: ["Lab"],
                duration: "1.5 hours",
                description: "Write `cloudbuild.yaml` files, configure multi-step builds, pass environment variables, and manage artifact outputs."
            },
            {
                id: 803,
                title: "Automated Deployments with Cloud Deploy",
                tags: ["Course", "Skill badge"],
                duration: "3.5 hours",
                description: "Deploy to GKE or Cloud Run using Cloud Deploy. Learn promotions, approvals, rollbacks, and release verification."
            }
        ]
    },
    {
        id: 9,
        title: "Google Workspace Administration & Automation",
        category: "Productivity",
        managedBy: "Google Cloud",
        description: "Streamline enterprise workflows. Learn AppSheet integrations, Apps Script automation, and Workspace admin controls.",
        modules: 3,
        duration: "6 hours",
        activitiesCount: 9,
        lastUpdated: "Last updated 3 days ago",
        activities: [
            {
                id: 901,
                title: "Google Workspace Administration Fundamentals",
                tags: ["Course"],
                duration: "3 hours",
                description: "Understand user provisioning, organizational units, custom email routing, calendar sharing, and mobile management."
            },
            {
                id: 902,
                title: "Writing Automated Apps Scripts for Sheets",
                tags: ["Lab"],
                duration: "1 hour",
                description: "Use Javascript-based Google Apps Script to automate calculations, spreadsheet tasks, and trigger custom emails."
            },
            {
                id: 903,
                title: "Building No-Code Apps with AppSheet",
                tags: ["Course", "Skill badge"],
                duration: "2 hours",
                description: "Create customized enterprise mobile applications using spreadsheets and database sources without coding."
            }
        ]
    }
];

// SVGs and Icons
const HomeBreadcrumbIcon = () => (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ display: 'block' }}>
        <path d="m3 9 9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" />
        <polyline points="9 22 9 12 15 12 15 22" />
    </svg>
);

const AIMLIcon = () => (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
        <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" />
    </svg>
);

const AgentsIcon = () => (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
        <path d="M12 2v20M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6" />
    </svg>
);

const DataIcon = () => (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
        <line x1="18" y1="20" x2="18" y2="10" />
        <line x1="12" y1="20" x2="12" y2="4" />
        <line x1="6" y1="20" x2="6" y2="14" />
    </svg>
);

const DevToolsIcon = () => (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
        <polyline points="16 18 22 12 16 6" />
        <polyline points="8 6 2 12 8 18" />
    </svg>
);

const InfrastructureIcon = () => (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
        <rect x="2" y="2" width="20" height="8" rx="2" />
        <rect x="2" y="14" width="20" height="8" rx="2" />
        <line x1="6" y1="6" x2="6.01" y2="6" />
        <line x1="6" y1="18" x2="6.01" y2="18" />
    </svg>
);

const ProductivityIcon = () => (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
        <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
        <polyline points="14 2 14 8 20 8" />
        <line x1="16" y1="13" x2="8" y2="13" />
        <line x1="16" y1="17" x2="8" y2="17" />
        <polyline points="10 9 9 9 8 9" />
    </svg>
);

const SecurityIcon = () => (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
        <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
    </svg>
);

const ArrowRightIcon = () => (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
        <line x1="5" y1="12" x2="19" y2="12"></line>
        <polyline points="12 5 19 12 12 19"></polyline>
    </svg>
);

const PathBadgeIcon = () => (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor" style={{ marginRight: '6px' }}>
        <path d="M4 11h5V5H4v6zm0 7h5v-6H4v6zm6 0h5v-6h-5v6zm6 0h5v-6h-5v6zm-6-7h5V5h-5v6zm6-6v6h5V5h-5z" />
    </svg>
);

// Card badge specific icons
const CourseTagIcon = () => (
    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ marginRight: '4px' }}>
        <path d="M4 19.5V15a2.5 2.5 0 0 1 2.5-2.5H20" />
        <path d="M6 2v17.5a2.5 2.5 0 0 0 2.5 2.5H20" />
        <path d="M20 6H9" />
        <path d="M20 10H9" />
    </svg>
);

const LabTagIcon = () => (
    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ marginRight: '4px' }}>
        <path d="M10 2v7.31" />
        <path d="M14 2v7.31" />
        <path d="M8.5 2h7" />
        <path d="M14 11.5a1.5 1.5 0 0 0-1.5-1.5h-1a1.5 1.5 0 0 0-1.5 1.5v.71l-4.76 8.52A1.5 1.5 0 0 0 5.06 22h13.88a1.5 1.5 0 0 0 1.32-2.21l-4.76-8.52v-.71Z" />
    </svg>
);

const BadgeTagIcon = () => (
    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ marginRight: '4px' }}>
        <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
        <circle cx="12" cy="11" r="3" />
    </svg>
);

const ClockIcon = () => (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ marginRight: '6px' }}>
        <circle cx="12" cy="12" r="10" />
        <polyline points="12 6 12 12 16 14" />
    </svg>
);

const FeedbackIcon = () => (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ marginRight: '8px' }}>
        <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
    </svg>
);

const GridIcon = () => (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <rect x="3" y="3" width="7" height="7" />
        <rect x="14" y="3" width="7" height="7" />
        <rect x="14" y="14" width="7" height="7" />
        <rect x="3" y="14" width="7" height="7" />
    </svg>
);

const ListIcon = () => (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <line x1="8" y1="6" x2="21" y2="6" />
        <line x1="8" y1="12" x2="21" y2="12" />
        <line x1="8" y1="18" x2="21" y2="18" />
        <line x1="3" y1="6" x2="3.01" y2="6" />
        <line x1="3" y1="12" x2="3.01" y2="12" />
        <line x1="3" y1="18" x2="3.01" y2="18" />
    </svg>
);

const DecorativePattern = () => (
    <svg width="100" height="100" viewBox="0 0 120 120" fill="none" className={styles.decorativePattern}>
        <circle cx="30" cy="30" r="14" fill="currentColor" fillOpacity="0.1" />
        <circle cx="54" cy="30" r="14" fill="currentColor" fillOpacity="0.2" />
        <circle cx="78" cy="30" r="14" fill="currentColor" fillOpacity="0.2" />
        <circle cx="102" cy="30" r="14" fill="currentColor" fillOpacity="0.1" />
        
        <circle cx="30" cy="54" r="14" fill="currentColor" fillOpacity="0.2" />
        <circle cx="54" cy="54" r="14" fill="currentColor" fillOpacity="0.35" />
        <circle cx="78" cy="54" r="14" fill="currentColor" fillOpacity="0.35" />
        <circle cx="102" cy="54" r="14" fill="currentColor" fillOpacity="0.2" />
        
        <circle cx="30" cy="78" r="14" fill="currentColor" fillOpacity="0.2" />
        <circle cx="54" cy="78" r="14" fill="currentColor" fillOpacity="0.35" />
        <circle cx="78" cy="78" r="14" fill="currentColor" fillOpacity="0.35" />
        <circle cx="102" cy="78" r="14" fill="currentColor" fillOpacity="0.2" />
        
        <circle cx="30" cy="102" r="14" fill="currentColor" fillOpacity="0.1" />
        <circle cx="54" cy="102" r="14" fill="currentColor" fillOpacity="0.2" />
        <circle cx="78" cy="102" r="14" fill="currentColor" fillOpacity="0.2" />
        <circle cx="102" cy="102" r="14" fill="currentColor" fillOpacity="0.1" />
    </svg>
);

interface FilterConfig {
    name: string;
    icon: React.ComponentType;
}

const FILTERS: FilterConfig[] = [
    { name: "AI / ML", icon: AIMLIcon },
    { name: "Agents", icon: AgentsIcon },
    { name: "Data", icon: DataIcon },
    { name: "Dev Tools", icon: DevToolsIcon },
    { name: "Infrastructure", icon: InfrastructureIcon },
    { name: "Productivity", icon: ProductivityIcon },
    { name: "Security", icon: SecurityIcon }
];

interface PathsProps {
    searchQuery: string;
}

export const Paths: React.FC<PathsProps> = ({ searchQuery }) => {
    const [selectedFilter, setSelectedFilter] = useState<string | null>(null);
    const [activePathDetail, setActivePathDetail] = useState<PathItem | null>(null);
    
    // UI states for details page
    const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
    const [enrolledPaths, setEnrolledPaths] = useState<Record<number, number>>({});

    const handleFilterClick = (filter: string) => {
        if (selectedFilter === filter) {
            setSelectedFilter(null);
        } else {
            setSelectedFilter(filter);
        }
    };

    const handleStartPath = (pathId: number) => {
        // Mock enrollment: set progress to 15% on first click, toggle state
        setEnrolledPaths(prev => ({
            ...prev,
            [pathId]: prev[pathId] !== undefined ? prev[pathId] : 15
        }));
    };

    // Filter paths by search query and category filter
    const filteredPaths = PATHS_DATA.filter(path => {
        const matchesSearch = searchQuery
            ? path.title.toLowerCase().includes(searchQuery.toLowerCase()) || 
              path.description.toLowerCase().includes(searchQuery.toLowerCase())
            : true;
        
        const matchesCategory = selectedFilter ? path.category === selectedFilter : true;
        
        return matchesSearch && matchesCategory;
    });

    // RENDER DETAILED VIEW
    if (activePathDetail) {
        const isEnrolled = enrolledPaths[activePathDetail.id] !== undefined;
        const progressPercentage = enrolledPaths[activePathDetail.id] || 0;

        return (
            <div className={styles.detailContainer}>
                {/* Breadcrumbs Row */}
                <div className={styles.breadcrumbsRow}>
                    <div className={styles.breadcrumbs}>
                        <button className={styles.breadcrumbHome} onClick={() => setActivePathDetail(null)} aria-label="Go to Home">
                            <HomeBreadcrumbIcon />
                        </button>
                        <span className={styles.breadcrumbSeparator}>&gt;</span>
                        <button className={styles.breadcrumbLink} onClick={() => setActivePathDetail(null)}>Paths</button>
                        <span className={styles.breadcrumbSeparator}>&gt;</span>
                        <span className={styles.breadcrumbActive}>{activePathDetail.title}</span>
                    </div>

                    <div className={styles.consolePromo}>
                        <span className={styles.consolePromoText}>Apply your skills in Google Cloud console</span>
                        <button className={styles.consoleBtn}>Get started</button>
                    </div>
                </div>

                {/* Hero Banner Section */}
                <div className={styles.heroBanner}>
                    <div className={styles.heroContent}>
                        <div className={styles.heroBadge}>
                            <PathBadgeIcon />
                            <span>Path</span>
                        </div>
                        <h1 className={styles.heroTitle}>{activePathDetail.title}</h1>
                        
                        <div className={styles.heroMetaCapsules}>
                            <span className={styles.heroMetaCapsule}>Managed by {activePathDetail.managedBy}</span>
                            <span className={styles.heroMetaCapsule}>{activePathDetail.activitiesCount} activities</span>
                            <span className={styles.heroMetaCapsule}>{activePathDetail.lastUpdated}</span>
                        </div>

                        <div className={styles.heroActionsRow}>
                            <button 
                                className={`${styles.heroStartBtn} ${isEnrolled ? styles.heroStartBtnEnrolled : ''}`}
                                onClick={() => handleStartPath(activePathDetail.id)}
                            >
                                <span className={styles.startArrow}>&rarr;</span>
                                <span>{isEnrolled ? 'In progress' : 'Start'}</span>
                            </button>
                            <div className={styles.progressBarWrapper}>
                                <div className={styles.progressBarTrack}>
                                    <div 
                                        className={styles.progressBarFill} 
                                        style={{ width: `${isEnrolled ? progressPercentage : 0}%` }}
                                    />
                                </div>
                            </div>
                        </div>
                    </div>

                    <div className={styles.heroPatternContainer}>
                        <DecorativePattern />
                    </div>
                </div>

                {/* Main Overview / Activities Control Section */}
                <div className={styles.overviewSection}>
                    <div className={styles.contentsSelectContainer}>
                        <fieldset className={styles.contentsSelectFieldset}>
                            <legend className={styles.contentsSelectLegend}>Contents</legend>
                            <div className={styles.contentsSelectBox}>
                                <span>Overview</span>
                                <span className={styles.chevronDownSymbol}>&#9662;</span>
                            </div>
                        </fieldset>
                    </div>

                    <div className={styles.pathLongDescription}>
                        {activePathDetail.description.split('\n\n').map((para, i) => (
                            <p key={i}>{para}</p>
                        ))}
                    </div>

                    {/* Feedback and Grid/List view switcher */}
                    <div className={styles.utilsRow}>
                        <button className={styles.feedbackBtn}>
                            <FeedbackIcon />
                            <span>Send feedback</span>
                        </button>

                        <div className={styles.viewToggleGroup}>
                            <button 
                                className={`${styles.toggleBtn} ${viewMode === 'grid' ? styles.toggleBtnActive : ''}`}
                                onClick={() => setViewMode('grid')}
                                aria-label="Grid View"
                            >
                                <GridIcon />
                                <span>Grid</span>
                            </button>
                            <button 
                                className={`${styles.toggleBtn} ${viewMode === 'list' ? styles.toggleBtnActive : ''}`}
                                onClick={() => setViewMode('list')}
                                aria-label="List View"
                            >
                                <ListIcon />
                                <span>List</span>
                            </button>
                        </div>
                    </div>
                </div>

                {/* Course Grid/List */}
                <div className={viewMode === 'grid' ? styles.activitiesGrid : styles.activitiesList}>
                    {activePathDetail.activities.map((activity) => (
                        <div key={activity.id} className={styles.activityCard}>
                            <div className={styles.cardHeaderArea}>
                                <div className={styles.activityTags}>
                                    {activity.tags.map((tag, tagIdx) => (
                                        <span key={tagIdx} className={`${styles.activityTag} ${tag === 'Lab' ? styles.tagLab : tag === 'Skill badge' ? styles.tagBadge : styles.tagCourse}`}>
                                            {tag === 'Course' && <CourseTagIcon />}
                                            {tag === 'Lab' && <LabTagIcon />}
                                            {tag === 'Skill badge' && <BadgeTagIcon />}
                                            {tag}
                                        </span>
                                    ))}
                                </div>
                            </div>

                            <h3 className={styles.activityCardTitle}>{activity.title}</h3>
                            <p className={styles.activityCardDesc}>{activity.description}</p>

                            <div className={styles.activityCardFooter}>
                                <div className={styles.activityDuration}>
                                    <ClockIcon />
                                    <span>{activity.duration}</span>
                                </div>
                                <button className={styles.activityArrowBtn} aria-label={`View details of ${activity.title}`}>
                                    <ArrowRightIcon />
                                </button>
                            </div>
                        </div>
                    ))}
                </div>
            </div>
        );
    }

    // RENDER PATHS LIST/GRID VIEW
    return (
        <div className={styles.pathsContainer}>
            {/* Background Accent Blob */}
            <div className={styles.backgroundBlob} />

            {/* Header Content */}
            <header className={styles.header}>
                <h1 className={styles.title}>
                    Shape <span className={styles.blueText}>your</span> <span className={styles.gradientText}>future</span> self
                </h1>
                <p className={styles.subtitle}>
                    Paths are collections of learnings designed to build deep skills in a particular area. 
                    Whether you're looking to earn achievements, build a collection of skill badges, or prepare for a 
                    certification, there are paths right for you. When you're done, share your accomplishments on 
                    social media and hiring platforms like LinkedIn and Credly.
                </p>
            </header>

            {/* Interactive Filters */}
            <div className={styles.filtersWrapper}>
                <div className={styles.filtersContainer}>
                    {FILTERS.map((f, i) => {
                        const IconComponent = f.icon;
                        const isActive = selectedFilter === f.name;
                        return (
                            <button
                                key={i}
                                className={`${styles.filterChip} ${isActive ? styles.filterChipActive : ''}`}
                                onClick={() => handleFilterClick(f.name)}
                            >
                                <span className={styles.filterIcon}><IconComponent /></span>
                                <span className={styles.filterText}>{f.name}</span>
                            </button>
                        );
                    })}
                </div>
            </div>

            {/* Grid of Path Cards */}
            <div className={styles.pathsGrid}>
                {filteredPaths.length > 0 ? (
                    filteredPaths.map((path) => (
                        <div key={path.id} className={styles.pathCard} onClick={() => setActivePathDetail(path)}>
                            <div className={styles.cardHeader}>
                                <div className={styles.pathBadge}>
                                    <PathBadgeIcon />
                                    <span>Path</span>
                                </div>
                            </div>
                            <h3 className={styles.cardTitle}>{path.title}</h3>
                            <div className={styles.cardFooter}>
                                <span className={styles.managedBy}>Managed by {path.managedBy}</span>
                                <button className={styles.arrowButton} aria-label={`View ${path.title}`}>
                                    <ArrowRightIcon />
                                </button>
                            </div>
                        </div>
                    ))
                ) : (
                    <div className={styles.noResults}>
                        <p>No learning paths found matching your criteria.</p>
                        <button className={styles.clearBtn} onClick={() => { setSelectedFilter(null); }}>
                            Reset Filters
                        </button>
                    </div>
                )}
            </div>
        </div>
    );
};

export default Paths;
