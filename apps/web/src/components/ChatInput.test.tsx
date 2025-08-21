import { render, screen } from '@testing-library/react';
import { describe, it, expect } from 'vitest';
import { ChatInput } from './ChatInput';

describe('ChatInput', () => {
  it('renders input field', () => {
    render(<ChatInput />);
    expect(screen.getByPlaceholderText(/Ask anything/)).toBeInTheDocument();
  });

  it('renders send button', () => {
    render(<ChatInput />);
    expect(screen.getByRole('button')).toBeInTheDocument();
  });
});
