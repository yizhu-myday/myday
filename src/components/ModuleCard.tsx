import type { ReactNode } from 'react';
import { moduleMeta } from '../config/meta';
import type { ModuleId } from '../types';

interface Props {
  id: ModuleId;
  children: ReactNode;
}

export function ModuleCard({ id, children }: Props) {
  const meta = moduleMeta[id];
  return (
    <article className="module-card" style={{ borderLeftColor: meta.accent }}>
      <header className="module-card-header">
        <h2 className="module-card-title">{meta.name}</h2>
        <p className="module-card-subtitle">{meta.subtitle}</p>
      </header>
      <div className="module-card-body">{children}</div>
    </article>
  );
}