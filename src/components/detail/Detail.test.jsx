import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import Detail from './Detail';
import { useChatStore } from '../../store/chatStore';
import { useUserStore } from '../../store/userStore';

vi.mock('../../store/chatStore');
vi.mock('../../store/userStore');

describe('Detail', () => {
  it('renders user details and logout button', () => {
    useChatStore.mockReturnValue({
      user: { username: 'Test User', avatar: '/test-avatar.png' },
      isCurrentUserBlocked: false,
      isReceiverBlocked: false,
      changeBlock: vi.fn(),
    });
    useUserStore.mockReturnValue({ currentUser: { id: '1' } });

    const handleLogout = vi.fn();
    render(<Detail handleLogout={handleLogout} />);
    
    expect(screen.getByText('Test User')).toBeInTheDocument();
    expect(screen.getByAltText('Test User')).toHaveAttribute('src', '/test-avatar.png');
    
    const logoutButton = screen.getByText('Logout');
    expect(logoutButton).toBeInTheDocument();
    fireEvent.click(logoutButton);
    expect(handleLogout).toHaveBeenCalled();
  });
});