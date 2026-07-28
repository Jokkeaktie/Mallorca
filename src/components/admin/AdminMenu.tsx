'use client';

import { useEffect, useRef, useState } from 'react';
import Link from 'next/link';

interface AdminMenuProps {
  onLogout: () => void;
}

const LINKS = [
  { href: '/admin/indstillinger', label: 'Indstillinger' },
  { href: '/admin/billeder', label: 'Billeder' },
  { href: '/admin/info', label: 'Praktisk info' },
  { href: '/admin/fejlrapporter', label: 'Fejlrapporter' },
  { href: '/admin/vejledning', label: 'Kort vejledning' },
] as const;

/** Samler alle sekundære admin-handlinger (indstillinger, undersider, log ud) i én menu. */
export function AdminMenu({ onLogout }: AdminMenuProps) {
  const [isOpen, setIsOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!isOpen) return;
    function handleClickOutside(event: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [isOpen]);

  return (
    <div ref={containerRef} className="relative">
      <button
        type="button"
        onClick={() => setIsOpen((v) => !v)}
        aria-expanded={isOpen}
        aria-haspopup="true"
        className="flex items-center gap-1.5 rounded-xl2 border border-line bg-white px-4 py-2.5 text-sm font-medium text-ink hover:bg-canvas"
      >
        <span aria-hidden="true">☰</span> Menu
      </button>

      {isOpen && (
        <div className="absolute right-0 z-30 mt-2 flex w-56 flex-col overflow-hidden rounded-xl2 border border-line bg-white py-1 shadow-lg">
          {LINKS.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              onClick={() => setIsOpen(false)}
              className="px-4 py-3 text-sm text-ink hover:bg-canvas"
            >
              {link.label}
            </Link>
          ))}
          <div className="my-1 border-t border-line" />
          <button
            type="button"
            onClick={() => {
              setIsOpen(false);
              onLogout();
            }}
            className="px-4 py-3 text-left text-sm text-red-700 hover:bg-red-50"
          >
            Log ud
          </button>
        </div>
      )}
    </div>
  );
}
