import { AppRouter } from "./pages/";

import "./App.css";

function App() {
	return (
		<div className="app">
			<header className="app-header">
				<h1 className="title">Web App</h1>
			</header>

			<main className="main-container">
				<AppRouter />
			</main>

			<footer className="app-footer">
			</footer>
		</div>
	);
}

export default App;
