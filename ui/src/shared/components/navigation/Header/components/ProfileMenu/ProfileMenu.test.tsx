import { describe, expect, it, vi } from 'vitest';
import { fireEvent, render, screen } from '@testing-library/react';
import { ProfileMenu } from './ProfileMenu';

const PROFILE = {
    id: 'u1',
    fullName: 'Ana Lovelace',
    email: 'ana@example.com',
    avatar: 'owl',
    role: 'ADMIN',
    bio: ''
};

const renderMenu = () => {
    const changeView = vi.fn();
    const signOut = vi.fn().mockResolvedValue(undefined);
    render(<ProfileMenu profile={PROFILE} changeView={changeView} signOut={signOut} />);
    return { changeView, signOut, trigger: screen.getByRole('button', { name: 'Account menu' }) };
};

describe('ProfileMenu', () => {
    it('shows who is signed in, from real profile data', () => {
        const { trigger } = renderMenu();
        fireEvent.click(trigger);

        expect(trigger).toHaveAttribute('aria-expanded', 'true');
        expect(screen.getByText('Ana Lovelace')).toBeInTheDocument();
        expect(screen.getByText('ana@example.com')).toBeInTheDocument();
        expect(screen.getByText('Admin')).toBeInTheDocument();
    });

    /** The sidebar already has these; the placeholders went nowhere. */
    it('carries no duplicate or placeholder entries', () => {
        const { trigger } = renderMenu();
        fireEvent.click(trigger);

        expect(screen.getAllByRole('menuitem').map(item => item.textContent)).toEqual([
            'Profile & privacyName, avatar, consents and your data',
            'Privacy notice',
            'Sign out'
        ]);
        for (const gone of [/Dashboard/, /Progress/, /Settings/, /subscription/i, /Terms/]) {
            expect(screen.queryByText(gone)).not.toBeInTheDocument();
        }
    });

    it('navigates and closes', () => {
        const { trigger, changeView } = renderMenu();
        fireEvent.click(trigger);
        fireEvent.click(screen.getByRole('menuitem', { name: /Profile & privacy/ }));

        expect(changeView).toHaveBeenCalledWith('PROFILE');
        expect(screen.queryByRole('menu')).not.toBeInTheDocument();
    });

    it('signs out', () => {
        const { trigger, signOut } = renderMenu();
        fireEvent.click(trigger);
        fireEvent.click(screen.getByRole('menuitem', { name: 'Sign out' }));
        expect(signOut).toHaveBeenCalled();
    });

    it('is usable from the keyboard', () => {
        const { trigger } = renderMenu();
        fireEvent.keyDown(trigger, { key: 'ArrowDown' });

        const items = screen.getAllByRole('menuitem');
        expect(items[0]).toHaveFocus();

        fireEvent.keyDown(items[0], { key: 'ArrowUp' });
        expect(items[items.length - 1]).toHaveFocus();

        fireEvent.keyDown(items[items.length - 1], { key: 'Escape' });
        expect(screen.queryByRole('menu')).not.toBeInTheDocument();
        expect(trigger).toHaveFocus();
    });

    it('closes on a click outside', () => {
        const { trigger } = renderMenu();
        fireEvent.click(trigger);
        fireEvent.mouseDown(document.body);
        expect(screen.queryByRole('menu')).not.toBeInTheDocument();
    });
});
