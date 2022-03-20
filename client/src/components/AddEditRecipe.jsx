import "../features/Filter/Filter.css";
import { useState, useEffect, useRef } from "react";
import { useSelector, useDispatch } from "react-redux";
import { addRecipe, editRecipe, resetStatus } from "../features/Recipe/recipeSlice";
import IngredientInput from "./subcomponents/IngredientInput";
import { categoryOptions, caloryOptions, difficultyOptions } from "../app/data/data";
import RadioFilterSection from "./subcomponents/RadioFilterSection";
import { useNavigate, useParams } from "react-router-dom";
import { markCheckedInputs } from "../app/utilityFunctions";
import axios from "axios";

export default function AddEditRecipe({ purpose }) {
	// recipeId only required for Edit
	const { recipeId } = useParams();

	const navigate = useNavigate();
	const dispatch = useDispatch();
	const titleRef = useRef();

	const recipeData = useSelector((state) => state.recipe.recipe);
	const status = useSelector((state) => state.recipe.status);
	const {
		title: titleFromDb,
		imgUrl: imgUrlFromDb,
		category: categoryFromDb,
		calories: caloriesFromDb,
		difficulty: difficultyFromDb,
		ingredients: ingredientsFromDb,
	} = recipeData;

	// Prepare initial values for useState depending on whether purpose of component is to 'edit' or 'add' recipe
	function purposeIsAdd(purpose) {
		return purpose === "add";
	}
	const initTitle = purposeIsAdd(purpose) ? "" : titleFromDb;
	const initImgUrl = purposeIsAdd(purpose) ? "" : imgUrlFromDb;
	const initPreviewVisibility = !!initImgUrl; // false, falls kein bild vorhanden
	const initCategory = purposeIsAdd(purpose) ? null : categoryFromDb;
	const initCalories = purposeIsAdd(purpose) ? null : caloriesFromDb;
	const initDifficulty = purposeIsAdd(purpose) ? null : difficultyFromDb;
	const initIngredients = purposeIsAdd(purpose) || ingredientsFromDb.length === 0 ? [""] : ingredientsFromDb;

	const [title, setTitle] = useState(initTitle);
	const [category, setCategory] = useState(initCategory);
	const [calories, setCalories] = useState(initCalories);
	const [difficulty, setDifficulty] = useState(initDifficulty);
	const [ingredients, setIngredients] = useState(initIngredients);
	const [previewVisible, setPreviewVisible] = useState(initPreviewVisibility);
	const [imgSrc, setImgSrc] = useState(initImgUrl);

	function handleTitleChange(e) {
		setTitle(e.target.value);
	}
	function handleMealImgChange(e) {
		const imgFile = e.target.files[0];
		getSignedRequest(imgFile);

		function getSignedRequest(file) {
			axios
				.get(`/sign-s3?file-name=${file.name}&file-type=${file.type}`)
				.then((res) => {
					uploadFile(file, res.data.signedRequest, res.data.url);
				})
				.catch((err) => console.error("Could not get signed URL."));

			function uploadFile(file, signedRequest, url) {
				axios
					.put(signedRequest, file) // signedRequest is an AWS S3 URL with embedded credentials
					.then(() => {
						setImgSrc(url);
					})
					.catch((err) => console.error("Could not upload file. " + err));
			}
		}
	}
	function handleCategoryChange(e) {
		setCategory(e.target.value);
	}
	function handleCaloriesChange(e) {
		setCalories(e.target.value);
	}
	function handleDifficultyChange(e) {
		setDifficulty(e.target.value);
	}
	function handleIngredientAdd() {
		setIngredients((prevState) => [...prevState, ""]);
	}
	function handleIngredientRemove(e, index) {
		e.preventDefault(); // ALL buttons in forms are by default submit buttons --> submit needs to be prevented
		setIngredients((prevState) => {
			const newIngredientsList = [...prevState];
			newIngredientsList.splice(index, 1);
			return newIngredientsList;
		});
	}
	function handleIngredientChange(e, index) {
		setIngredients((prevState) => {
			const newIngredientsList = [...prevState];
			newIngredientsList[index] = e.target.value;
			return newIngredientsList;
		});
	}

	function handleSubmit(e) {
		e.preventDefault(); // default: refresh of entire page
		const sanitizedIngredients = ingredients.reduce((acc, ingredient) => {
			if (ingredient) {
				acc.push(ingredient.trim());
			}
			return acc;
		}, []);
		const formData = {
			title,
			imgUrl: imgSrc,
			category,
			calories,
			difficulty,
			ingredients: sanitizedIngredients,
		};

		// get correct ThunkFn for Adding or Editing
		const thunkFn = purposeIsAdd(purpose) ? addRecipe({ formData }) : editRecipe({ recipeId, formData });
		dispatch(thunkFn)
			.then(() => {
				if (purposeIsAdd(purpose)) {
					setTitle("");
					setCategory(null);
					setCalories(null);
					setDifficulty(null);
					setIngredients([""]);
					setImgSrc("");
				}
				const feedbackElem = document.getElementById("successMsg") || document.querySelector("p.addEditFail");
				feedbackElem.scrollIntoView({ behavior: "smooth" });
			})
			.catch((err) => console.error(err.message));
	}

	const ingredientListLength = ingredients.length;
	const ingredientItems = ingredients.map((ingredient, index) => (
		<IngredientInput
			key={index}
			index={index}
			listLength={ingredientListLength}
			handleIngredientAdd={handleIngredientAdd}
			handleRemoveClick={handleIngredientRemove}
			handleIngredientChange={handleIngredientChange}
			value={ingredient}
		/>
	));

	// "status" in recipeSlice beim Verlassen des Edit/Add-Formulars zurücksetzen
	useEffect(() => {
		return () => {
			dispatch(resetStatus());
		};
	}, [dispatch]);

	// Einblenden von Preview nur, wenn ein Bild vorhanden ist
	useEffect(() => {
		if (imgSrc) {
			setPreviewVisible(true);
		}
	}, [imgSrc]);

	// Title-Input nach Mounting fokussieren
	useEffect(() => {
		titleRef.current.focus();
	}, []);

	// Background der Input-Felder resetten, wenn sich State geändert hat
	useEffect(() => {
		markCheckedInputs();
	}, [category, calories, difficulty]);

	const titleText = purposeIsAdd(purpose) ? "Neues Rezept hinzufügen" : "Rezept editieren";
	const successVerb = purposeIsAdd(purpose) ? "hinzugefügt" : "editiert";

	return (
		<>
			<h2 className='heading'>{titleText}</h2>
			<form
				id='recipeForm'
				onSubmit={handleSubmit}
				onKeyDown={(e) => {
					// Enter soll neue Input-Zeile erzeugen, nicht Formular submitten
					if (e.key === "Enter") {
						e.preventDefault();
						return false;
					}
				}}>
				<div className='filterSection'>
					<label className='filterHeading' htmlFor='title'>
						Titel
					</label>
					<input
						type='text'
						ref={titleRef}
						className='titleInput'
						id='title'
						name='title'
						value={title}
						onChange={handleTitleChange}
						autoFocus></input>
				</div>
				<div className='filterSection'>
					<label className='filterHeading' htmlFor='mealImage'>
						Bild
					</label>
					<input type='file' id='mealImage' onChange={handleMealImgChange} accept='image/*'></input>
				</div>
				<div className='filterSection' style={previewVisible ? { display: "inline-block" } : { display: "none" }}>
					<label className='filterHeading' htmlFor='mealImagePreview'>
						Preview
					</label>
					<img src={imgSrc} alt='Preview' id='mealImagePreview' />
				</div>
				<RadioFilterSection sectionName='category' state={category} dataArr={categoryOptions} changeHandler={handleCategoryChange} isRequired={true}>
					Kategorie
				</RadioFilterSection>
				<RadioFilterSection sectionName='calories' state={calories} dataArr={caloryOptions} changeHandler={handleCaloriesChange} isRequired={true}>
					Kalorien
				</RadioFilterSection>
				<RadioFilterSection
					sectionName='difficulty'
					state={difficulty}
					dataArr={difficultyOptions}
					changeHandler={handleDifficultyChange}
					isRequired={true}>
					Schwierigkeit
				</RadioFilterSection>
				{ingredientItems}
				<input type='submit' value='Hochladen' />
			</form>
			{status === "pending" && <p>Lade...</p>}
			{status === "addFailed" && <p className='addEditFail'>Hinzufügen fehlgeschlagen, bitte erneut versuchen!</p>}
			{status === "editFailed" && <p className='addEditFail'>Editieren fehlgeschlagen, bitte erneut versuchen!</p>}
			{(status === "addSucceeded" || status === "editSucceeded") && (
				<div className='feedbackContainer'>
					<p className='addEditSuccess' id='successMsg'>
						Rezept erfolgreich {successVerb}.
					</p>
					<p className='successRedirectPrompt'>
						Möchtest du es ansehen?{" "}
						<button
							className='confirmBtn'
							onClick={() => {
								navigate("/recipe");
								const recipeElem = document.querySelector(".recipe");
								recipeElem?.scrollIntoView({ behavior: "smooth" });
							}}>
							Ja
						</button>
					</p>
				</div>
			)}
		</>
	);
}
