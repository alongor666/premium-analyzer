import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import App from './App';

describe('App', () => {
  it('renders headline', () => {
    render(<App />);
    expect(screen.getByText('保费收入多维度分析系统 - React版本')).toBeInTheDocument();
  });

  it('renders count button', () => {
    render(<App />);
    expect(screen.getByRole('button')).toBeInTheDocument();
  });
});
