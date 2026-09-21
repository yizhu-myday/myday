import { useNavigate } from 'react-router-dom';
import { useModuleConfig } from '../hooks/useModuleConfig';
import { moduleMeta } from '../config/meta';

export function SettingsPage() {
  const { configs, toggle, moveUp, moveDown, reset } = useModuleConfig();
  const navigate = useNavigate();

  return (
    <div className="settings">
      <header className="settings-header">
        <button type="button" className="back-btn" onClick={() => navigate('/')}>
          ← 返回
        </button>
        <h1>模块设置</h1>
        <button type="button" className="reset-btn" onClick={reset}>
          恢复默认
        </button>
      </header>

      <p className="settings-hint">
        关闭不再需要的模块。顺序即主页的展示顺序。
      </p>

      <ul className="settings-list">
        {configs.map((cfg, idx) => {
          const meta = moduleMeta[cfg.id];
          return (
            <li
              key={cfg.id}
              className="settings-item"
              style={{ borderLeftColor: meta.accent }}
            >
              <div className="settings-item-info">
                <div className="settings-item-name">{meta.name}</div>
                <div className="settings-item-sub">{meta.subtitle}</div>
              </div>
              <div className="settings-item-controls">
                <button
                  type="button"
                  onClick={() => moveUp(cfg.id)}
                  disabled={idx === 0}
                  aria-label="上移"
                >
                  ↑
                </button>
                <button
                  type="button"
                  onClick={() => moveDown(cfg.id)}
                  disabled={idx === configs.length - 1}
                  aria-label="下移"
                >
                  ↓
                </button>
                <label className="switch">
                  <input
                    type="checkbox"
                    checked={cfg.enabled}
                    onChange={() => toggle(cfg.id)}
                  />
                  <span className="switch-slider" />
                </label>
              </div>
            </li>
          );
        })}
      </ul>
    </div>
  );
}