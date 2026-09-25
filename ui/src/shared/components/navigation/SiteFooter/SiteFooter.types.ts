/**
 * The views the footer can navigate to.
 *
 * Spelled out rather than importing ViewState, which lives under features/ — the same convention
 * Header and Sidebar already follow in this folder, so that shared/ does not take a dependency on
 * a feature module.
 */
export type FooterView =
    | 'HOME'
    | 'LOGIN'
    | 'PATHS'
    | 'DSA'
    | 'COMPILER'
    | 'PRIVACY'
    | 'DASHBOARD'
    | 'PROFILE';

export interface SiteFooterProps {
    changeView: (view: FooterView) => void;
    /**
     * Drives the account column. The landing and login pages are only ever seen signed out — App
     * redirects a signed-in user off both — but the privacy notice is readable either way, so this
     * genuinely varies there.
     */
    isLoggedIn: boolean;
}
