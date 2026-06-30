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
        title: "HTML5, CSS3, & Web Layouts",
        category: "Frontend",
        managedBy: "Web Dev Skills",
        description: "Integrate semantic design practices into your frontend development. Learn CSS layout systems, responsive design, and accessible styling.",
        modules: 4,
        duration: "12 hours",
        activitiesCount: 12,
        lastUpdated: "Last updated 2 days ago",
        activities: [
            {
                id: 101,
                title: "Introduction to HTML5",
                tags: ["Course"],
                duration: "2 hours",
                description: "Understand the core syntax of modern HTML5 and how browsers render documents."
            },
            {
                id: 102,
                title: "Styling layouts with CSS Flexbox",
                tags: ["Lab"],
                duration: "1 hour",
                description: "In this hands-on lab, you will design responsive single-axis layouts using CSS Flexbox."
            },
            {
                id: 103,
                title: "Semantic Web & Accessibility",
                tags: ["Course", "Skill badge"],
                duration: "2 hours",
                description: "Learn how to use semantic elements to build pages accessible to screen readers."
            },
            {
                id: 104,
                title: "Responsive Design with CSS Grid",
                tags: ["Course", "Skill badge"],
                duration: "7 hours",
                description: "Implement complex grid interfaces, grid-areas, and media queries for mobile-first views."
            }
        ]
    },
    {
        id: 2,
        title: "Modern Web Development with React",
        category: "React",
        managedBy: "React Academy",
        description: "Build advanced Single Page Applications (SPAs) using React. Learn state management, components lifecycle, and standard hooks.",
        modules: 3,
        duration: "8 hours",
        activitiesCount: 9,
        lastUpdated: "Last updated 1 week ago",
        activities: [
            {
                id: 201,
                title: "React Fundamentals",
                tags: ["Course"],
                duration: "2 hours",
                description: "Explore React components, virtual DOM reconciliation, JSX syntax, and static page rendering."
            },
            {
                id: 202,
                title: "Building a React Todo Application",
                tags: ["Lab"],
                duration: "1.5 hours",
                description: "Create your first interactive app using states, props, event handlers, and lists key arrays."
            },
            {
                id: 203,
                title: "React Hooks & Custom Hooks",
                tags: ["Course", "Skill badge"],
                duration: "4.5 hours",
                description: "Understand useEffect, useRef, useMemo, and write custom reuse hooks for modular data fetching."
            }
        ]
    },
    {
        id: 3,
        title: "Relational Database Design & SQL Fundamentals",
        category: "Databases",
        managedBy: "SQL Academy",
        description: "Learn relational database design from scratch. Master SQL queries, data relationships, and optimization patterns.",
        modules: 5,
        duration: "16 hours",
        activitiesCount: 15,
        lastUpdated: "Last updated 5 days ago",
        activities: [
            {
                id: 301,
                title: "Introduction to Databases & SQL",
                tags: ["Course"],
                duration: "4 hours",
                description: "Review core database concepts: tables, primary keys, relational design, and basic SELECT queries."
            },
            {
                id: 302,
                title: "Writing SQL SELECT queries",
                tags: ["Lab"],
                duration: "2 hours",
                description: "Hands-on implementation of WHERE clauses, ORDER BY, GROUP BY, and basic SQL aggregates."
            },
            {
                id: 303,
                title: "Advanced SQL Joins and Aggregations",
                tags: ["Course", "Skill badge"],
                duration: "10 hours",
                description: "Review INNER JOIN, LEFT/RIGHT OUTER JOIN, subqueries, and database indexing for high performance."
            }
        ]
    },
    {
        id: 4,
        title: "Frontend Web Developer Certification",
        category: "Frontend",
        managedBy: "Web Dev Skills",
        description: "A Frontend Web Developer designs, builds, and optimizes web applications to solve client and business challenges. This certification learning path provides the advanced knowledge and practical skills required for this role, preparing you to successfully create and maintain modern websites and user interfaces.\n\nThrough a curated collection of on-demand courses, labs, and skill badges, you will gain real-world, applied experience with web technologies. This path focuses on the essential skills for the Frontend Developer role, from designing and styling layouts to optimizing performance and operationalizing React applications.\n\nUpon completion, you will be equipped with the skills validated by the Frontend Web Developer certification. Take the next step in your professional journey and demonstrate your expertise by preparing for the Frontend Web Developer exam.\n#webdevelopercertified",
        modules: 6,
        duration: "24 hours",
        activitiesCount: 18,
        lastUpdated: "Last updated 4 days ago",
        activities: [
            {
                id: 401,
                title: "Build a Certification Study Guide: Frontend Developer",
                tags: ["Course"],
                duration: "1 hour",
                description: "Learn how to use NotebookLM to create a personalized study guide for the Frontend Web Developer certification exam."
            },
            {
                id: 402,
                title: "A Tour of the Browser Developer Tools",
                tags: ["Lab"],
                duration: "45 minutes",
                description: "In this hands-on lab, you will explore Chrome DevTools, inspect elements, analyze network requests, and debug JS code."
            },
            {
                id: 403,
                title: "Introduction to HTML5 and CSS3",
                tags: ["Course"],
                duration: "8 hours",
                description: "This course introduces semantic HTML5 elements, CSS styling, flexbox, grid, responsive layouts, and basic accessibility practices."
            },
            {
                id: 404,
                title: "Intermediate JavaScript: DOM & Web APIs",
                tags: ["Course", "Skill badge"],
                duration: "2 hours",
                description: "Complete the intermediate JS course and earn a skill badge validating DOM manipulation, event loops, and asynchronous web requests."
            },
            {
                id: 405,
                title: "SQL Foundations for Web Developers",
                tags: ["Course", "Skill badge"],
                duration: "3 hours",
                description: "Complete the database fundamentals course. Learn schema design, SQL SELECT queries, joins, and indexing for fast performance."
            },
            {
                id: 406,
                title: "React Core Concepts: State, Props & Effects",
                tags: ["Course", "Skill badge"],
                duration: "4 hours",
                description: "Complete the React core course. Build custom components, handle user state, implement side effects with hooks, and manage forms."
            },
            {
                id: 407,
                title: "CSS Frameworks & Responsive Design Systems",
                tags: ["Course"],
                duration: "3 hours",
                description: "Explore popular CSS frameworks like Tailwind CSS, Bootstrap, and CSS modules to rapidly prototype responsive web interfaces."
            },
            {
                id: 408,
                title: "State Management in React: Redux & Zustand",
                tags: ["Course"],
                duration: "4 hours",
                description: "Learn how to manage global state in complex React applications using Redux Toolkit, Context API, and Zustand."
            },
            {
                id: 409,
                title: "Web Security Essentials: CORS, XSS & CSP",
                tags: ["Course"],
                duration: "5 hours",
                description: "Understand common web vulnerabilities, implement security headers, prevent Cross-Site Scripting (XSS), and configure CORS."
            }
        ]
    },
    {
        id: 5,
        title: "JavaScript Essentials & Advanced DOM",
        category: "JavaScript",
        managedBy: "JS Academy",
        description: "Develop interactive web applications using JavaScript. Implement event handling, asynchronous tasks, and ES6+ features.",
        modules: 4,
        duration: "10 hours",
        activitiesCount: 12,
        lastUpdated: "Last updated 3 days ago",
        activities: [
            {
                id: 501,
                title: "JavaScript Foundations",
                tags: ["Course"],
                duration: "2 hours",
                description: "Explore language primitives, scopes, closures, arrays, loops, and object prototypes."
            },
            {
                id: 502,
                title: "Creating Interactive Interfaces with DOM",
                tags: ["Lab"],
                duration: "1.5 hours",
                description: "Register click handlers, modify tag attributes, create dynamic elements, and handle key input."
            },
            {
                id: 503,
                title: "Asynchronous JavaScript: Promises & Async/Await",
                tags: ["Course"],
                duration: "3 hours",
                description: "Work with web APIs. Fetch JSON data, process async states, and resolve promise execution chains."
            },
            {
                id: 504,
                title: "Modern JS Syntax (ES6+)",
                tags: ["Course", "Skill badge"],
                duration: "3.5 hours",
                description: "Master destructuring, arrow functions, template literals, modules, and error-safe execution contexts."
            }
        ]
    },
    {
        id: 6,
        title: "Full Stack JavaScript Web Developer",
        category: "Backend",
        managedBy: "Web Dev Skills",
        description: "Master full stack solutions. Connect react frontends to database servers via Node and Express APIs.",
        modules: 8,
        duration: "32 hours",
        activitiesCount: 24,
        lastUpdated: "Last updated 1 week ago",
        activities: [
            {
                id: 601,
                title: "Full Stack Concepts & Client-Server Architecture",
                tags: ["Course"],
                duration: "6 hours",
                description: "Get started with servers, routing, backend architectures, databases, and client rendering flow."
            },
            {
                id: 602,
                title: "Server-side Development with Express",
                tags: ["Course"],
                duration: "8 hours",
                description: "Deep dive into Node.js server building, writing middleware, handling REST parameters, and parsing bodies."
            },
            {
                id: 603,
                title: "Connecting Express Backend to MySQL Database",
                tags: ["Lab"],
                duration: "2 hours",
                description: "Establish connections, setup schema queries, trigger data migrations, and resolve concurrent database threads."
            },
            {
                id: 604,
                title: "Deploying Full Stack Apps on Vercel and Render",
                tags: ["Course", "Skill badge"],
                duration: "16 hours",
                description: "Build production packages. Set environment keys, setup proxy paths, and launch full stack configurations."
            }
        ]
    },
    {
        id: 7,
        title: "UI/UX Design & CSS Methodologies",
        category: "Frontend",
        managedBy: "Web Dev Skills",
        description: "Learn web layout architectures. Master UI mockups, CSS styles isolation, and BEM/Modules rules.",
        modules: 4,
        duration: "10 hours",
        activitiesCount: 12,
        lastUpdated: "Last updated 6 days ago",
        activities: [
            {
                id: 701,
                title: "Introduction to Web Design & UI/UX",
                tags: ["Course"],
                duration: "4 hours",
                description: "Overview of colors, layout balance, web graphics, visual hierarchy, and basic prototype design."
            },
            {
                id: 702,
                title: "Figma Design to CSS Implementation",
                tags: ["Lab"],
                duration: "2 hours",
                description: "Extract spacing, typography weights, layout heights, and implement pixel-perfect CSS panels."
            },
            {
                id: 703,
                title: "CSS Architecture: BEM and CSS Modules",
                tags: ["Course", "Skill badge"],
                duration: "4 hours",
                description: "Learn how to write clean, maintainable CSS styles using BEM notation and React CSS module namespaces."
            }
        ]
    },
    {
        id: 8,
        title: "Git, GitHub & Modern Deployment Pipelines",
        category: "Dev Tools",
        managedBy: "Web Dev Skills",
        description: "Manage repository version history. Configure GitHub actions, build tasks, and automated static page releases.",
        modules: 3,
        duration: "7 hours",
        activitiesCount: 9,
        lastUpdated: "Last updated 4 days ago",
        activities: [
            {
                id: 801,
                title: "Version Control with Git & GitHub",
                tags: ["Course"],
                duration: "2 hours",
                description: "Learn stage commits, manage merge conflicts, create branches, and push codes to GitHub repositories."
            },
            {
                id: 802,
                title: "Configuring a GitHub Action CI/CD Workflow",
                tags: ["Lab"],
                duration: "1.5 hours",
                description: "Write deployment YAMLs, specify build dependencies, configure automated testing steps on repo triggers."
            },
            {
                id: 803,
                title: "Continuous Deployment to Netlify and Vercel",
                tags: ["Course", "Skill badge"],
                duration: "3.5 hours",
                description: "Link GitHub repositories directly to automated cloud host environments to launch updates on push commands."
            }
        ]
    },
    {
        id: 9,
        title: "Node.js & REST API Architecture",
        category: "Backend",
        managedBy: "Web Dev Skills",
        description: "Design robust backend systems. Learn HTTP handlers, database queries, and route authentication protocols.",
        modules: 3,
        duration: "6 hours",
        activitiesCount: 9,
        lastUpdated: "Last updated 3 days ago",
        activities: [
            {
                id: 901,
                title: "Introduction to Node.js Runtime",
                tags: ["Course"],
                duration: "3 hours",
                description: "Understand asynchronous event loops, require/import specifications, file systems, and Node process controls."
            },
            {
                id: 902,
                title: "Building REST Endpoints with HTTP Module",
                tags: ["Lab"],
                duration: "1 hour",
                description: "Create barebones HTTP servers, read URL queries, return custom JSON objects, and handle response headers."
            },
            {
                id: 903,
                title: "Authentication with JWT in Node.js",
                tags: ["Course", "Skill badge"],
                duration: "2 hours",
                description: "Design access control middlewares, verify login payloads, generate session keys, and store passwords safely."
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
    { name: "Frontend", icon: AIMLIcon },
    { name: "React", icon: AgentsIcon },
    { name: "Databases", icon: DataIcon },
    { name: "Dev Tools", icon: DevToolsIcon },
    { name: "Backend", icon: InfrastructureIcon },
    { name: "JavaScript", icon: ProductivityIcon },
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
