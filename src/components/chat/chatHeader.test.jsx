import React from 'react';
import { render, screen } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import ChatHeader from './ChatHeader';

describe('ChatHeader', () => {
  it('renders user information correctly', () => {
    const mockUser = {
      username: 'Test User',
      isAI: false,
      avatar: '/test-avatar.png',
    };

    render(<ChatHeader user={mockUser} isAudioEnabled={true} />);

    expect(screen.getByText('Test User')).toBeInTheDocument();
    expect(screen.getByText('Online')).toBeInTheDocument();
    expect(screen.getByAltText('User avatar')).toHaveAttribute('src', '/test-avatar.png');
  });

  it('displays AI assistant information when user is AI', () => {
    const mockUser = {
      username: 'AI Assistant',
      isAI: true,
      specialization: 'medical',
      avatar: '/ai-avatar.png',
    };

    render(<ChatHeader user={mockUser} isAudioEnabled={true} />);

    expect(screen.getByText('AI Assistant')).toBeInTheDocument();
    expect(screen.getByText('AI medical Assistant')).toBeInTheDocument();
  });

  it('shows enable audio button when audio is not enabled', () => {
    const mockUser = { username: 'Test User' };
    const mockEnableAudio = vi.fn();

    render(<ChatHeader user={mockUser} isAudioEnabled={false} enableAudio={mockEnableAudio} />);

    const enableButton = screen.getByText('Enable Audio');
    expect(enableButton).toBeInTheDocument();
  });
});