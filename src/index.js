import "./index.css"
import React from "react";
import ReactDOM from "react-dom";
import { Provider } from "react-redux";
import { store } from "./app/store";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import Layout from "./Layout";
import Filter from "./features/Filter/Filter";
import Recipe from "./features/Recipe/Recipe";
import AddEditRecipe from "./components/AddEditRecipe";

ReactDOM.render(
	<BrowserRouter>
		<Provider store={store}>
			<Routes>
				<Route element={<Layout />}>
					<Route path="/" element={<Filter />}>
						<Route index element={<p className="noRecipePlaceholder">Kein Rezept ausgewählt</p>} />
						<Route path="recipe" element={<Recipe />} />
					</Route>
					<Route path="/addRecipe" element={<AddEditRecipe task="add" />} />
					<Route path="/editRecipe/:recipeId" element={<AddEditRecipe task="edit" />} />
				</Route>
        <Route path="*" element={<div>404 - Page not found</div>} />
			</Routes>
		</Provider>
	</BrowserRouter>,
	document.getElementById("root")
);
