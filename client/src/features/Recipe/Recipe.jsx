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
                <img className='recipeImg' src={imgUrl} alt={title} />
                <p className='recipeDescription'>
                    <b>Kategorie:</b> {category}
                </p>
                <p className='recipeDescription'>
                    <b>Kalorien:</b> {calories}
                </p>
                <p className='recipeDescription'>
                    <b>Schwierigkeit:</b> {difficulty}
                </p>
                <ul>{ingredientList}</ul>
                <Link to={`/editRecipe/${recipeId}`}>Rezept editieren ✏️</Link>
                <p
                    className='delete'
                    onClick={(e) => {
                        if (window.confirm("Möchtest du dieses Rezept wirklich löschen?")) handleRecipeDelete(e);
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
