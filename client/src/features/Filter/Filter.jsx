import "./Filter.css";
import React, { useState, useEffect } from "react";
import { fetchRandomRecipe } from "../Recipe/recipeSlice";
import { useDispatch } from "react-redux";
import { Outlet, useNavigate } from "react-router-dom";
import RadioFilterSection from "../../components/subcomponents/RadioFilterSection";
import FilterOptionCheckbox from "../../components/subcomponents/FilterOptionCheckbox";
import { categoryOptions, caloryOptions, difficultyOptions, ingredientOptions } from "../../app/data/data";
import { markCheckedInputs } from "../../app/utilityFunctions";

export default function Filter(props) {
	const dispatch = useDispatch();
	const navigate = useNavigate();

	const [category, setCategory] = useState("");
	const [calories, setCalories] = useState("");
	const [difficulty, setDifficulty] = useState("");
	const [ingrFilterVisible, setIngrFilterVisible] = useState(false);
	const [ingSearchTerm, setIngSearchTerm] = useState("");
	const [ingredients, setIngredients] = useState([]);

	function handleCategoryChange(e) {
		setCategory(e.target.value);
	}
	function handleCaloriesChange(e) {
		setCalories(e.target.value);
	}
	function handleDifficultyChange(e) {
		setDifficulty(e.target.value);
	}

	function handleIngredientChange({ target: { value } }) {
		setIngredients((prevState) => {
			// handle ingredient change --> if ingredient not in array -> include it, otherwise remove it (= toggle ingredient)
			return !prevState.includes(value) ? [...prevState, value] : prevState.filter((ingredient) => ingredient !== value);
		});
	}

	function handleTextSearchChange({ target: { value } }) {
		setIngSearchTerm(value);
	}

	function handleIngFilterVisibility(e) {
		e.preventDefault();
		setIngrFilterVisible((prevState) => !prevState);
	}

	function handleFilterFormReset(e) {
		e.preventDefault();
		setCategory("");
		setCalories("");
		setDifficulty("");
		setIngredients([]);
		setIngSearchTerm("");
	}

	const handleSubmit = (e) => {
		e.preventDefault();
		let checkedAndTextIngredients = [...ingredients, capitalizeString(ingSearchTerm)];
		const filter = {
			category,
			calories,
			difficulty,
			ingredients: ingSearchTerm ? checkedAndTextIngredients : ingredients,
		};
		const sanitizedFilterObj = sanitizeObj(filter);
		dispatch(fetchRandomRecipe(sanitizedFilterObj))
			.then(() => {
				navigate("/recipe");
				const recipeElem = document.querySelector(".recipe");
				recipeElem?.scrollIntoView({ block: "start", behavior: "smooth" });
				const warningElem = document.querySelector(".warning"); // will render if no recipe found
				warningElem?.scrollIntoView({ behavior: "smooth" });
			})
			.catch((err) => console.error(err.message));
	};

	// Background der Input-Felder resetten, wenn sich State geändert hat
	useEffect(() => {
		markCheckedInputs();
	}, [category, calories, difficulty, ingredients]);

	// Event-Listener für "Enter"
	useEffect(() => {
		function handleEnter(e) {
			if (e.key === "Enter") {
				handleSubmit(e);
			}
		}

		document.addEventListener("keydown", handleEnter);
		return () => document.removeEventListener("keydown", handleEnter);
	});

	// Resette Filter beim Mounting / Rückkehr von Rezeptseiten
	useEffect(() => {
		setCategory("");
		setCalories("");
		setDifficulty("");
		setIngredients([]);
		setIngSearchTerm("");
	}, []);

	return (
		<>
			<div className='filter'>
				<form onSubmit={handleSubmit}>
					<fieldset>
						<RadioFilterSection
							sectionName='category'
							state={category}
							dataArr={categoryOptions}
							changeHandler={handleCategoryChange}
							isRequired={false}>
							{" "}
							Kategorie
						</RadioFilterSection>
						<RadioFilterSection
							sectionName='calories'
							state={calories}
							dataArr={caloryOptions}
							changeHandler={handleCaloriesChange}
							isRequired={false}>
							{" "}
							Kalorien
						</RadioFilterSection>
						<RadioFilterSection
							sectionName='difficulty'
							state={difficulty}
							dataArr={difficultyOptions}
							changeHandler={handleDifficultyChange}
							isRequired={false}>
							{" "}
							Schwierigkeit
						</RadioFilterSection>
						<button id='ingFilterVisibilityBtn' onClick={handleIngFilterVisibility}>
							{ingrFilterVisible ? "Zutatenfilter ausblenden" : "Zutatenfilter einblenden"}
						</button>
						<div className='filterSection ingFilter' style={ingrFilterVisible ? { maxHeight: 10000 } : { maxHeight: 0 }}>
							<span className='filterHeading'>Zutaten</span>
							<div className='textSearchContainer'>
								<input id='ingTextSearch' type='text' placeholder='Zutat' value={ingSearchTerm} onChange={handleTextSearchChange} />
								<i className='fa-solid fa-magnifying-glass'></i>
							</div>

							<div className='filterOptions'>
								{ingredientOptions.map(({ id, value, icon }) => {
									return (
										<FilterOptionCheckbox
											sectionName='ingredients'
											key={id}
											value={value}
											icon={icon}
											state={ingredients}
											changeHandler={handleIngredientChange}
										/>
									);
								})}
							</div>
						</div>
						<input type='submit' value='Rezept suchen' />
						<button className='resetBtn' onClick={handleFilterFormReset}>
							Reset Filter
						</button>
					</fieldset>
				</form>
			</div>
			<Outlet />
		</>
	);
}

/**
 * @param {Object} filterObj - obj to be sanitized
 * @returns input object w/o falsy values and empty arrays
 */
function sanitizeObj(filterObj) {
	let preparedFilterObj = {};
	for (let filterProp in filterObj) {
		if (
			(filterObj[filterProp] && !Array.isArray(filterObj[filterProp])) ||
			(Array.isArray(filterObj[filterProp]) && filterObj[filterProp].length > 0)
		) {
			preparedFilterObj[filterProp] = filterObj[filterProp];
		}
	}
	return preparedFilterObj;
}

function capitalizeString(str) {
	return str ? (str[0].toUpperCase() + str.slice(1)).trim() : "";
}

/* User Story Textsuche:
  1. Es gibt ein Input-Feld, in welches ich Text eintragen kann.
  2. Beim Suchen eines Rezepts werden nur solche vorgeschlagen, die die Zutat enthalten.
  3. Mit dem gleichen Button ("Zutatenfilter ausblenden") kann der Filter wieder ausgeblendet werden.
*/
