'use client';

import { useState } from 'react';
import { BugReportForm } from '@/components/bugReports/BugReportForm';
import { BugReportsList } from '@/components/admin/BugReportsList';

export function AdminBugReportsSection() {
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [listKey, setListKey] = useState(0);

  return (
    <div className="flex flex-col gap-6">
      {showCreateForm ? (
        <div className="flex flex-col gap-3 rounded-xl2 border border-line bg-white p-4">
          <div className="flex items-center justify-between">
            <h2 className="text-base font-medium text-ink">Opret ny fejlrapport</h2>
            <button
              type="button"
              onClick={() => setShowCreateForm(false)}
              className="text-sm text-accent underline underline-offset-2"
            >
              Annullér
            </button>
          </div>
          <BugReportForm
            onSubmitted={() => {
              setListKey((k) => k + 1);
              setShowCreateForm(false);
            }}
          />
        </div>
      ) : (
        <button
          type="button"
          onClick={() => setShowCreateForm(true)}
          className="self-start rounded-xl2 border border-line px-4 py-2 text-sm font-medium hover:bg-canvas"
        >
          + Opret ny fejlrapport
        </button>
      )}

      <BugReportsList key={listKey} />
    </div>
  );
}
