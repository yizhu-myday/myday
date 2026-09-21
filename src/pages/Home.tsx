import { useModuleConfig } from '../hooks/useModuleConfig';
import { moduleComponents } from '../modules/registry';
import { ModuleCard } from '../components/ModuleCard';

export function HomePage() {
  const { configs } = useModuleConfig();
  const enabled = configs.filter((c) => c.enabled);

  if (enabled.length === 0) {
    return (
      <div className="empty-state">
        <p>所有模块都已关闭。</p>
        <p className="empty-hint">进入设置页 → 开启需要的模块。</p>
      </div>
    );
  }

  return (
    <div className="module-stack">
      {enabled.map((cfg) => {
        const Component = moduleComponents[cfg.id];
        return (
          <ModuleCard key={cfg.id} id={cfg.id}>
            <Component />
          </ModuleCard>
        );
      })}
    </div>
  );
}