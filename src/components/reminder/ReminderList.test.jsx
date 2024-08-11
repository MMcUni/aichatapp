import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import ReminderList from './ReminderList';
import { useReminderStore } from '../../store/reminderStore';
import { useUserStore } from '../../store/userStore';

vi.mock('../../store/reminderStore');
vi.mock('../../store/userStore');

describe('ReminderList', () => {
  it('renders reminders and handles actions', async () => {
    const mockReminders = [
      { id: '1', medication: 'Aspirin', dosage: '1 pill', time: '2023-08-10T09:00:00Z' },
    ];
    const mockDeleteReminder = vi.fn();
    const mockMarkReminderCompleted = vi.fn();
    const mockFetchReminders = vi.fn().mockResolvedValue(mockReminders);

    useReminderStore.mockReturnValue({
      reminders: mockReminders,
      fetchReminders: mockFetchReminders,
      deleteReminder: mockDeleteReminder,
      markReminderCompleted: mockMarkReminderCompleted,
    });
    useUserStore.mockReturnValue({ currentUser: { id: '1' } });

    render(<ReminderList />);

    // Wait for the reminders to load
    await waitFor(() => {
      expect(screen.getByText('Aspirin')).toBeInTheDocument();
    });

    expect(screen.getByText('Dosage: 1 pill')).toBeInTheDocument();

    fireEvent.click(screen.getByText('Delete'));
    expect(mockDeleteReminder).toHaveBeenCalledWith('1');

    fireEvent.click(screen.getByText('Mark Completed'));
    expect(mockMarkReminderCompleted).toHaveBeenCalledWith('1');
  });

  it('shows loading state', () => {
    useReminderStore.mockReturnValue({
      reminders: [],
      fetchReminders: vi.fn(),
      deleteReminder: vi.fn(),
      markReminderCompleted: vi.fn(),
    });
    useUserStore.mockReturnValue({ currentUser: { id: '1' } });

    render(<ReminderList />);

    expect(screen.getByText('Loading reminders...')).toBeInTheDocument();
  });
});