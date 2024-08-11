import React from 'react';
import { render, screen } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import List from './List';
import { useChatStore } from '../../store/chatStore';
import { useUserStore } from '../../store/userStore';

// Mock the stores
vi.mock('../../store/chatStore');
vi.mock('../../store/userStore');

describe('List', () => {
  it('renders ChatList and UserInfo components', () => {
    // Mock the store values
    useChatStore.mockReturnValue({});
    useUserStore.mockReturnValue({ currentUser: { id: '1', username: 'Test User' } });

    render(<List />);
    
    // Check if UserInfo is rendered
    expect(screen.getByText('Test User')).toBeInTheDocument();
    
    // Check if ChatList is rendered (assuming it has a search input)
    expect(screen.getByPlaceholderText('Search')).toBeInTheDocument();
  });
});