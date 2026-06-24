import React from 'react';
import { 
    HomeIcon, 
    UserIcon, 
    CatalogIcon, 
    PathsIcon, 
    CollectionsIcon, 
    SubscriptionsIcon, 
    OrganizationsIcon,
    ChevronDownIcon
} from '../Icons';
import styles from './Navigation.module.css';

interface SidebarProps {
    isExpanded: boolean;
    setIsExpanded: (val: boolean) => void;
    isCollectionsExpanded: boolean;
    setIsCollectionsExpanded: (val: boolean) => void;
    activeView: string;
    changeView: (view: any) => void;
    isLoggedIn: boolean;
}

export const Sidebar: React.FC<SidebarProps> = ({
    isExpanded,
    setIsExpanded,
    isCollectionsExpanded,
    setIsCollectionsExpanded,
    activeView,
    changeView,
    isLoggedIn
}) => {
    return (
        <aside className={`${styles.sidebar} ${isExpanded ? styles.sidebarExpanded : styles.sidebarCollapsed}`}>
            {isExpanded ? (
                <nav className={styles.navContainer}>
                    {/* Logged Out view: show Home */}
                    {!isLoggedIn && (
                        <div 
                            className={`${styles.navItemExpanded} ${(activeView === 'HOME' || activeView === 'COURSE_DETAIL') ? styles.navItemActive : ''}`}
                            onClick={() => changeView('HOME')}
                            title="Home"
                        >
                            <HomeIcon size={20} />
                            <span className={styles.navLabelExpanded}>Home</span>
                        </div>
                    )}

                    {/* Logged In view: show Dashboard */}
                    {isLoggedIn && (
                        <div 
                            className={`${styles.navItemExpanded} ${(activeView === 'DASHBOARD' || activeView === 'CERTIFICATE') ? styles.navItemActive : ''}`}
                            onClick={() => changeView('DASHBOARD')}
                            title="Dashboard"
                        >
                            <UserIcon size={20} />
                            <span className={styles.navLabelExpanded}>Dashboard</span>
                        </div>
                    )}

                    {/* Catalog is always visible */}
                    <div 
                        className={styles.navItemExpanded}
                        onClick={() => {
                            changeView(isLoggedIn ? 'DASHBOARD' : 'HOME');
                            setTimeout(() => {
                                document.getElementById('catalog-section')?.scrollIntoView({ behavior: 'smooth' });
                            }, 100);
                        }}
                        title="Catalog"
                    >
                        <CatalogIcon size={20} />
                        <span className={styles.navLabelExpanded}>Catalog</span>
                    </div>

                    {/* Authenticated-only sections */}
                    {isLoggedIn && (
                        <>
                            <div 
                                className={`${styles.navItemExpanded} ${activeView === 'PATHS' ? styles.navItemActive : ''}`}
                                onClick={() => changeView('PATHS')}
                                title="Paths"
                            >
                                <PathsIcon size={20} />
                                <span className={styles.navLabelExpanded}>Paths</span>
                            </div>
                            
                            {/* Collections Expandable Menu */}
                            <div className={styles.collectionsWrapper}>
                                <div 
                                    className={`${styles.navItemExpanded} ${isCollectionsExpanded ? styles.collectionsActive : ''}`}
                                    onClick={() => setIsCollectionsExpanded(!isCollectionsExpanded)}
                                    title="Collections"
                                >
                                    <div className={styles.navItemLeft}>
                                        <CollectionsIcon size={20} />
                                        <span className={styles.navLabelExpanded}>Collections</span>
                                    </div>
                                    <ChevronDownIcon 
                                        size={16} 
                                        className={`${styles.caretIcon} ${isCollectionsExpanded ? styles.caretRotated : ''}`} 
                                    />
                                </div>
                                {isCollectionsExpanded && (
                                    <div className={styles.submenu}>
                                        <div className={styles.submenuItem} onClick={() => { changeView('DASHBOARD'); setTimeout(() => document.getElementById('catalog-section')?.scrollIntoView({ behavior: 'smooth' }), 100); }}>AI Boost Bites</div>
                                        <div className={styles.submenuItem} onClick={() => { changeView('DASHBOARD'); setTimeout(() => document.getElementById('catalog-section')?.scrollIntoView({ behavior: 'smooth' }), 100); }}>Career Certificates</div>
                                        <div className={styles.submenuItem} onClick={() => { changeView('DASHBOARD'); setTimeout(() => document.getElementById('catalog-section')?.scrollIntoView({ behavior: 'smooth' }), 100); }}>Cloud</div>
                                        <div className={styles.submenuItem} onClick={() => { changeView('DASHBOARD'); setTimeout(() => document.getElementById('catalog-section')?.scrollIntoView({ behavior: 'smooth' }), 100); }}>DeepMind</div>
                                    </div>
                                )}
                            </div>

                            <div className={styles.navItemExpanded} title="Subscriptions">
                                <SubscriptionsIcon size={20} />
                                <span className={styles.navLabelExpanded}>Subscriptions</span>
                            </div>
                            <div className={styles.navItemExpanded} title="Organizations">
                                <OrganizationsIcon size={20} />
                                <span className={styles.navLabelExpanded}>Organizations</span>
                            </div>
                        </>
                    )}
                </nav>
            ) : (
                <nav className={styles.navContainerCentered}>
                    {/* Logged Out View: show Home */}
                    {!isLoggedIn && (
                        <div 
                            className={styles.navItemCollapsed}
                            onClick={() => changeView('HOME')}
                            title="Home"
                        >
                            <div className={`${styles.iconPill} ${(activeView === 'HOME' || activeView === 'COURSE_DETAIL') ? styles.iconPillActive : ''}`}>
                                <HomeIcon size={20} />
                            </div>
                            <span className={styles.navLabelCollapsed}>Home</span>
                        </div>
                    )}

                    {/* Logged In View: show Dashboard */}
                    {isLoggedIn && (
                        <div 
                            className={styles.navItemCollapsed}
                            onClick={() => changeView('DASHBOARD')}
                            title="Dashboard"
                        >
                            <div className={`${styles.iconPill} ${(activeView === 'DASHBOARD' || activeView === 'CERTIFICATE') ? styles.iconPillActive : ''}`}>
                                <UserIcon size={20} />
                            </div>
                            <span className={styles.navLabelCollapsed}>Dashboard</span>
                        </div>
                    )}

                    {/* Catalog is always visible */}
                    <div 
                        className={styles.navItemCollapsed}
                        onClick={() => {
                            changeView(isLoggedIn ? 'DASHBOARD' : 'HOME');
                            setTimeout(() => {
                                document.getElementById('catalog-section')?.scrollIntoView({ behavior: 'smooth' });
                            }, 100);
                        }}
                        title="Catalog"
                    >
                        <div className={styles.iconPill}>
                            <CatalogIcon size={20} />
                        </div>
                        <span className={styles.navLabelCollapsed}>Catalog</span>
                    </div>

                    {/* Authenticated-only collapsed sections */}
                    {isLoggedIn && (
                        <>
                            <div 
                                className={styles.navItemCollapsed}
                                onClick={() => changeView('PATHS')}
                                title="Paths"
                            >
                                <div className={`${styles.iconPill} ${activeView === 'PATHS' ? styles.iconPillActive : ''}`}>
                                    <PathsIcon size={20} />
                                </div>
                                <span className={styles.navLabelCollapsed}>Paths</span>
                            </div>

                            <div 
                                className={styles.navItemCollapsed}
                                onClick={() => {
                                    setIsExpanded(true);
                                    setIsCollectionsExpanded(true);
                                }}
                                title="Collections"
                            >
                                <div className={styles.iconPill}>
                                    <div className={styles.collectionsIconContainer}>
                                        <CollectionsIcon size={20} />
                                        <ChevronDownIcon size={10} className={styles.collapsedCaret} />
                                    </div>
                                </div>
                                <span className={styles.navLabelCollapsed}>Collections</span>
                            </div>

                            <div 
                                className={styles.navItemCollapsed}
                                title="Subscriptions"
                            >
                                <div className={styles.iconPill}>
                                    <SubscriptionsIcon size={20} />
                                </div>
                                <span className={styles.navLabelCollapsed}>Subscriptions</span>
                            </div>

                            <div 
                                className={styles.navItemCollapsed}
                                title="Organizations"
                            >
                                <div className={styles.iconPill}>
                                    <OrganizationsIcon size={20} />
                                </div>
                                <span className={styles.navLabelCollapsed}>Organizations</span>
                            </div>
                        </>
                    )}
                </nav>
            )}
        </aside>
    );
};
