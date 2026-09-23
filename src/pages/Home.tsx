import { useEffect, useState } from 'react';
import { useModuleConfig } from '../hooks/useModuleConfig';
import { moduleComponents } from '../modules/registry';
import { TodayModule } from '../modules/today';
import { ModuleCard } from '../components/ModuleCard';
import { moduleMeta } from '../config/meta';
import type { ModuleId } from '../types';

const ACTIVE_KEY = 'myday:active-module';

function loadActiveModule(): ModuleId | null {
  try {
    return (localStorage.getItem(ACTIVE_KEY) as ModuleId | null) ?? null;
  } catch {
    return null;
  }
}

export function HomePage() {
  const { configs } = useModuleConfig();
  // 「今日」固定在顶部，始终显示；其余模块进侧边栏
  const sidebarModules = configs.filter((c) => c.enabled && c.id !== 'today');

  const [activeId, setActiveId] = useState<ModuleId | null>(loadActiveModule);

  // 选中的模块被关闭/不存在时，回落到侧边栏第一个
  useEffect(() => {
    if (sidebarModules.length === 0) {
      if (activeId !== null) setActiveId(null);
      return;
    }
    if (!sidebarModules.some((c) => c.id === activeId)) {
      setActiveId(sidebarModules[0].id);
    }
  }, [sidebarModules, activeId]);

  // 记住上次浏览的模块
  useEffect(() => {
    try {
      if (activeId) localStorage.setItem(ACTIVE_KEY, activeId);
    } catch {
      /* ignore */
    }
  }, [activeId]);

  const ActiveComponent = activeId ? moduleComponents[activeId] : null;

  return (
    <div className="home">
      {/* 顶部固定：公历 + 玛雅历 */}
      <ModuleCard id="today">
        <TodayModule />
      </ModuleCard>

      {sidebarModules.length === 0 ? (
        <div className="empty-state">
          <p>侧边栏没有可用模块。</p>
          <p className="empty-hint">进入设置页 → 开启需要的模块。</p>
        </div>
      ) : (
        <div className="home-layout">
          <aside className="module-sidebar">
            <nav className="sidebar-nav">
              {sidebarModules.map((cfg) => {
                const meta = moduleMeta[cfg.id];
                const active = cfg.id === activeId;
                return (
                  <button
                    key={cfg.id}
                    type="button"
                    className={`sidebar-item${active ? ' active' : ''}`}
                    onClick={() => setActiveId(cfg.id)}
                  >
                    <span
                      className="sidebar-dot"
                      style={{ background: meta.accent }}
                    />
                    <span className="sidebar-name">{meta.name}</span>
                  </button>
                );
              })}
            </nav>
          </aside>

          <main className="module-content">
            {ActiveComponent && activeId && (
              <ModuleCard key={activeId} id={activeId}>
                <ActiveComponent />
              </ModuleCard>
            )}
          </main>
        </div>
      )}
    </div>
  );
}
