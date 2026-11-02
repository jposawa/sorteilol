import type { IconType } from "react-icons";
import { GiCrossedSwords } from "react-icons/gi";
import {
  MdCasino,
  MdDashboard,
  MdGavel,
  MdGroups,
  MdHelpOutline,
  MdHistory,
  MdNotifications,
  MdSearch,
  MdSettings,
  MdStadium,
} from "react-icons/md";

import { getChampionPortraitUrl } from "./helpers";
import { useDraftSession } from "./hooks";
import { useBackendSync } from "./hooks/useBackendSync";
import { Arena, Competition, Home, Randomizer, Sessions, Teams } from "./pages";

import "./App.css";

type AppScreen =
  | "home"
  | "teams"
  | "match"
  | "arena"
  | "sessions"
  | "competition";

type NavItem = {
  key: AppScreen;
  label: string;
  Icon: IconType;
};

const NAV_ITEMS: NavItem[] = [
  { key: "home", label: "Início", Icon: MdDashboard },
  { key: "teams", label: "Equipes", Icon: MdGroups },
  { key: "match", label: "Sorteio", Icon: MdCasino },
  { key: "arena", label: "Arena", Icon: MdStadium },
  { key: "sessions", label: "Draft", Icon: MdGavel },
  { key: "competition", label: "Competição", Icon: GiCrossedSwords },
];

const noop = () => {};

function App() {
  const { appScreen, setAppScreen } = useDraftSession();

  // Hidratar/espelhar as 12 tabelas do appbackend no boot do app.
  useBackendSync();

  return (
    <div className="app">
      <header className="hx-topbar">
        <button
          type="button"
          className="hx-brand"
          onClick={() => setAppScreen("home")}
        >
          Sorteio Protocol
        </button>

        <div className="hx-topbar-actions">
          <div className="hx-search" aria-hidden="true">
            <span className="hx-search-placeholder">Pesquisar sistema…</span>
            <MdSearch size={18} />
          </div>

          <button type="button" className="hx-icon-btn" title="Notificações (em breve)" aria-label="Notificações" onClick={noop}>
            <MdNotifications size={22} />
          </button>

          <button type="button" className="hx-icon-btn" title="Configurações (em breve)" aria-label="Configurações" onClick={noop}>
            <MdSettings size={22} />
          </button>

          <div className="hx-avatar">
            <img
              src={getChampionPortraitUrl("jinx")}
              alt="Perfil do invocador"
              loading="lazy"
            />
          </div>
        </div>
      </header>

      <aside className="hx-sidebar">
        <nav className="hx-side-nav" aria-label="Navegação principal">
          {NAV_ITEMS.map(({ key, label, Icon }) => (
            <button
              key={key}
              type="button"
              className={`hx-side-item${appScreen === key ? " hx-side-item--active" : ""}`}
              onClick={() => setAppScreen(key)}
            >
              <Icon size={22} />
              <span className="hx-side-item-name">{label}</span>
            </button>
          ))}
        </nav>

        <div className="hx-side-footer">
          <button
            type="button"
            className="hx-side-item"
            title="Ajuda (em breve)"
            aria-label="Ajuda"
            onClick={noop}
          >
            <MdHelpOutline size={18} />
          </button>

          <button
            type="button"
            className="hx-side-item"
            title="Histórico (em breve)"
            aria-label="Histórico"
            onClick={noop}
          >
            <MdHistory size={18} />
          </button>
        </div>
      </aside>

      <main className="main-container">
        {appScreen === "home" && <Home />}

        {appScreen === "teams" && <Teams />}

        {appScreen === "match" && <Randomizer />}

        {appScreen === "arena" && <Arena />}

        {appScreen === "sessions" && <Sessions />}

        {appScreen === "competition" && <Competition />}
      </main>

      <nav className="hx-bottom-nav" aria-label="Navegação principal">
        {NAV_ITEMS.map(({ key, label, Icon }) => (
          <button
            key={key}
            type="button"
            className={`hx-bottom-item${appScreen === key ? " hx-bottom-item--active" : ""}`}
            onClick={() => setAppScreen(key)}
          >
            <Icon size={22} />
            <span>{label}</span>
          </button>
        ))}
      </nav>
    </div>
  );
}

export default App;
