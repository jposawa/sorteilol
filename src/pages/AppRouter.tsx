import { Route, Routes } from "react-router-dom";

export const AppRouter = () => {
	return (
		<Routes>
			<Route path="/" />
			<Route path="*" element={<div>404 - Página não encontrada</div>} />
		</Routes>
	);
}
