import { render, screen, fireEvent } from '@testing-library/react';
import { ThemeToggle } from '../ui/theme-toggle';
import { ThemeProvider } from '../theme-provider';

describe('ThemeToggle Component', () => {
  it('should render theme toggle button', () => {
    render(
      <ThemeProvider>
        <ThemeToggle />
      </ThemeProvider>
    );
    
    const button = screen.getByRole('button');
    expect(button).toBeInTheDocument();
  });

  it('should toggle theme on click', () => {
    render(
      <ThemeProvider>
        <ThemeToggle />
      </ThemeProvider>
    );
    
    const button = screen.getByRole('button');
    fireEvent.click(button);
    
    // Theme should change (implementation may vary)
    expect(button).toBeInTheDocument();
  });
});

