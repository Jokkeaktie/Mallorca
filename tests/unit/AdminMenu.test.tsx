// @vitest-environment jsdom
import { describe, expect, it, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { AdminMenu } from '@/components/admin/AdminMenu';

describe('AdminMenu', () => {
  it('menuen er lukket som standard', () => {
    render(<AdminMenu onLogout={vi.fn()} />);
    expect(screen.queryByText('Indstillinger')).not.toBeInTheDocument();
  });

  it('viser alle links og log ud-knappen efter tryk på Menu', async () => {
    const user = userEvent.setup();
    render(<AdminMenu onLogout={vi.fn()} />);

    await user.click(screen.getByRole('button', { name: /Menu/ }));

    expect(screen.getByText('Indstillinger')).toBeInTheDocument();
    expect(screen.getByText('Praktisk info')).toBeInTheDocument();
    expect(screen.getByText('Fejlrapporter')).toBeInTheDocument();
    expect(screen.getByText('Kort vejledning')).toBeInTheDocument();
    expect(screen.getByText('Log ud')).toBeInTheDocument();
  });

  it('kalder onLogout ved tryk på Log ud', async () => {
    const user = userEvent.setup();
    const onLogout = vi.fn();
    render(<AdminMenu onLogout={onLogout} />);

    await user.click(screen.getByRole('button', { name: /Menu/ }));
    await user.click(screen.getByText('Log ud'));

    expect(onLogout).toHaveBeenCalled();
  });

  it('lukker menuen igen ved endnu et tryk på Menu-knappen', async () => {
    const user = userEvent.setup();
    render(<AdminMenu onLogout={vi.fn()} />);

    const menuButton = screen.getByRole('button', { name: /Menu/ });
    await user.click(menuButton);
    expect(screen.getByText('Indstillinger')).toBeInTheDocument();

    await user.click(menuButton);
    expect(screen.queryByText('Indstillinger')).not.toBeInTheDocument();
  });
});
