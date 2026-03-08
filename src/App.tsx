import { MatchStepsTracker } from "./fragments";
import { TeamCreation } from "./pages";

import "./App.css";

function App() {
	return (
		<div className="app">
			<header className="app-header">
				<h1 className="title">Sorteio LoL</h1>
			</header>

			<main>
				<TeamCreation />
			</main>

			<footer className="app-footer">
				<MatchStepsTracker />
			</footer>
		</div>
	);
}

export default App;
