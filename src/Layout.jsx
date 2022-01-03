import "./Layout.css";
import Header from "./components/Header";
import { Outlet } from "react-router-dom";

export default function Layout(props) {
	return (
		<div className="layout">
			<Header />
			<main className="main">
				<Outlet />
			</main>
		</div>
	);
}
