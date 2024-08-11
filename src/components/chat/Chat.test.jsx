import React from 'react';
import { render, screen } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import Chat from './Chat';
import useChat from './useChat';

// Mock the custom hook
vi.mock('./useChat');

describe('Chat', () => {
  it('renders chat components when chatId is available', () => {
    useChat.mockReturnValue({
      messages: [],
      text: '',
      setText: vi.fn(),
      img: { file: null, url: '' },
      setImg: vi.fn(),
      open: false,
      setOpen: vi.fn(),
      isAudioEnabled: true,
      enableAudio: vi.fn(),
      playingMessageId: null,
      user: { username: 'Test User' },
      isCurrentUserBlocked: false,
      isReceiverBlocked: false,
      endRef: { current: null },
      chatContainerRef: { current: null },
      handleSend: vi.fn(),
      handleKeyPress: vi.fn(),
      handleImg: vi.fn(),
      handleEmoji: vi.fn(),
      toggleAudio: vi.fn(),
    });

    render(<Chat />);
    
    expect(screen.getByText('Test User')).toBeInTheDocument();
    expect(screen.getByPlaceholderText(/Ask .* a question/)).toBeInTheDocument();
  });
});