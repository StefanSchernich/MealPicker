import "./Recipe.css";
import React from "react";
import { useDispatch, useSelector } from "react-redux";
import { Link, useNavigate } from "react-router-dom";
import { deleteRecipe } from "./recipeSlice";

export default function Recipe(props) {
	const navigate = useNavigate();
	const dispatch = useDispatch();
	const recipe = useSelector((state) => state.recipe.recipe);
	const queryStatus = useSelector((state) => state.recipe.recipeQueryStatus);
	const { title, imgUrl, category, calories, difficulty, ingredients, _id: recipeId } = recipe;
	const ingredientList = ingredients.map((ingredient, index) => {
		return <li key={index}>{ingredient}</li>;
	});

	function handleRecipeDelete() {
		dispatch(deleteRecipe(recipeId))
			.then(() => navigate("/"))
			.catch((err) => console.error(err));
	}

	if (queryStatus === "loading") {
		return <p>Lade...</p>;
	}
	if (queryStatus === "success") {
		return (
			<div className='recipe' id='recipe'>
				<h2 className='recipeTitle'>{title}</h2>
				{imgUrl && <img className='recipeImg' src={imgUrl} alt={title} />}
				<div className='descriptionContainer'>
					<p className='recipeDescription'>{category}</p>
					<p className='recipeDescription'>{calories}</p>
					<p className='recipeDescription'>{difficulty}</p>
				</div>
				<ul>{ingredientList}</ul>
				<a href={`https://www.chefkoch.de/rs/s0/${title}/Rezepte.html`} rel='noreferrer' target='_blank'>
					Passende Rezepte auf Chefkoch finden 🔎
				</a>
				<Link className='edit' to={`/editRecipe/${recipeId}`}>
					Rezept editieren ✏️
				</Link>
				<p
					className='delete'
					onClick={(e) => {
						if (window.confirm("Möchtest du dieses Rezept wirklich löschen?")) handleRecipeDelete();
					}}>
					Rezept löschen ❌
				</p>
			</div>
		);
	}

	if (queryStatus === "fail") {
		return <p className='warning'>Kein Rezept gefunden! Bitte Filterkriterien ändern.</p>;
	}

	return null;
}
