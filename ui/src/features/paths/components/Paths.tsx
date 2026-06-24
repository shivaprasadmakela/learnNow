import React, { useState } from 'react';
import styles from './Paths.module.css';

interface PathsProps {
    searchQuery: string;
}

interface PathItem {
    id: number;
    title: string;
    category: string;
    managedBy: string;
    description: string;
    modules: number;
    duration: string;
}

const PATHS_DATA: PathItem[] = [
    {
        id: 1,
        title: "DevSecOps",
        category: "Security",
        managedBy: "Google Cloud",
        description: "Integrate security practices into your DevOps pipeline. Learn container security, vulnerability scanning, and secure deployments.",
        modules: 4,
        duration: "12 hours"
    },
    {
        id: 2,
        title: "Vertex AI Search for Retail",
        category: "AI / ML",
        managedBy: "Google Cloud",
        description: "Build advanced retail search engines using Vertex AI. Learn query understanding, personalized recommendations, and semantic search.",
        modules: 3,
        duration: "8 hours"
    },
    {
        id: 3,
        title: "Professional Cloud Architect Certification Renewal",
        category: "Infrastructure",
        managedBy: "Google Cloud",
        description: "Refresh and renew your Google Cloud Architect certification. Deepen your knowledge of HA design, migrations, and cost optimization.",
        modules: 5,
        duration: "16 hours"
    },
    {
        id: 4,
        title: "Professional Machine Learning Engineer Certification",
        category: "AI / ML",
        managedBy: "Google Cloud",
        description: "Prepare for the Professional ML Engineer certification. Master TensorFlow, Vertex AI pipelines, and operationalizing ML models at scale.",
        modules: 6,
        duration: "24 hours"
    },
    {
        id: 5,
        title: "Agentic AI on Google Cloud",
        category: "Agents",
        managedBy: "Google Cloud",
        description: "Develop autonomous AI agents using Gemini and LangChain on GCP. Implement tools, agent orchestration, and memory systems.",
        modules: 4,
        duration: "10 hours"
    },
    {
        id: 6,
        title: "Professional Cloud Architect Certification",
        category: "Infrastructure",
        managedBy: "Google Cloud",
        description: "Master Google Cloud solutions architecture. Study compute, networking, storage, databases, and DevOps automation from the ground up.",
        modules: 8,
        duration: "32 hours"
    },
    {
        id: 7,
        title: "BigQuery and Data Analytics Fundamentals",
        category: "Data",
        managedBy: "Google Cloud",
        description: "Dive into cloud data warehousing. Master SQL queries, data modeling, ingestion, and real-time visualization with BigQuery.",
        modules: 4,
        duration: "10 hours"
    },
    {
        id: 8,
        title: "Modern DevTools and CI/CD on GCP",
        category: "Dev Tools",
        managedBy: "Google Cloud",
        description: "Automate code deployments. Learn how to configure Cloud Build, Artifact Registry, and Google Cloud Deploy pipelines.",
        modules: 3,
        duration: "7 hours"
    },
    {
        id: 9,
        title: "Google Workspace Administration & Automation",
        category: "Productivity",
        managedBy: "Google Cloud",
        description: "Streamline enterprise workflows. Learn AppSheet integrations, Apps Script automation, and Workspace admin controls.",
        modules: 3,
        duration: "6 hours"
    }
];

// SVG Icons for categories
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

export const Paths: React.FC<PathsProps> = ({ searchQuery }) => {
    const [selectedFilter, setSelectedFilter] = useState<string | null>(null);
    const [activePathDetail, setActivePathDetail] = useState<PathItem | null>(null);

    const handleFilterClick = (filter: string) => {
        if (selectedFilter === filter) {
            setSelectedFilter(null); // Deselect if clicked again
        } else {
            setSelectedFilter(filter);
        }
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

            {/* Details Modal */}
            {activePathDetail && (
                <div className={styles.modalOverlay} onClick={() => setActivePathDetail(null)}>
                    <div className={styles.modalContent} onClick={(e) => e.stopPropagation()}>
                        <button className={styles.closeModal} onClick={() => setActivePathDetail(null)}>×</button>
                        
                        <div className={styles.modalBadge}>
                            <PathBadgeIcon />
                            <span>{activePathDetail.category} Pathway</span>
                        </div>
                        
                        <h2 className={styles.modalTitle}>{activePathDetail.title}</h2>
                        <p className={styles.modalSubtitle}>Managed by {activePathDetail.managedBy}</p>
                        
                        <div className={styles.metaGrid}>
                            <div className={styles.metaItem}>
                                <span className={styles.metaLabel}>Duration</span>
                                <span className={styles.metaValue}>{activePathDetail.duration}</span>
                            </div>
                            <div className={styles.metaItem}>
                                <span className={styles.metaLabel}>Modules</span>
                                <span className={styles.metaValue}>{activePathDetail.modules} Chapters</span>
                            </div>
                        </div>

                        <p className={styles.modalDesc}>{activePathDetail.description}</p>
                        
                        <div className={styles.modalActions}>
                            <button className={styles.enrollBtn} onClick={() => setActivePathDetail(null)}>
                                Start Learning Path
                            </button>
                            <button className={styles.secondaryBtn} onClick={() => setActivePathDetail(null)}>
                                Close
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default Paths;
