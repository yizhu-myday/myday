import { Link, Route, Routes } from 'react-router-dom';
import { HomePage } from './pages/Home';
import { SettingsPage } from './pages/Settings';
import './App.css';

function App() {
  return (
    <div className="myday-shell">
      <header className="myday-topbar">
        <Link to="/" className="brand">MyDay</Link>
        <nav className="topbar-nav">
          <Link to="/settings" className="topbar-link">设置</Link>
        </nav>
      </header>
      <Routes>
        <Route path="/" element={<HomePage />} />
        <Route path="/settings" element={<SettingsPage />} />
      </Routes>
    </div>
  );
}

export default App;