import "../features/Filter/Filter.css";
import { useState, useEffect } from "react";
import { useSelector, useDispatch } from "react-redux";
import { addRecipe, editRecipe, resetStatus } from "../features/Recipe/recipeSlice";
import IngredientInput from "./subcomponents/IngredientInput";
import { categoryOptions, caloryOptions, difficultyOptions } from "../app/data/data";
import RadioFilterSection from "./subcomponents/RadioFilterSection";
import { useNavigate, useParams } from "react-router-dom";
import { markCheckedInputs } from "../app/utilityFunctions";
import axios from "axios";

export default function AddEditRecipe({ task }) {
	// recipeId only required for Edit
	const { recipeId } = useParams();

	const navigate = useNavigate();
	const dispatch = useDispatch();

	const recipeData = useSelector((state) => state.recipe.recipe);
	const {
		title: titleFromDb,
		imgUrl,
		category: categoryFromDb,
		calories: caloriesFromDb,
		difficulty: diffcultyFromDb,
		ingredients: ingredientsFromDb,
	} = recipeData;

	const initTitle = task === "add" ? "" : titleFromDb;
	const initPreviewVisibility = task === "add" || !imgUrl ? false : true; // falls entweder Add-Formular oder kein Bild hinterlegt --> false
	const initCategory = task === "add" ? null : categoryFromDb;
	const initCalories = task === "add" ? null : caloriesFromDb;
	const initDifficulty = task === "add" ? null : diffcultyFromDb;
	const initIngredients = task === "add" ? [""] : ingredientsFromDb.length > 0 ? ingredientsFromDb : [""];

	const status = useSelector((state) => state.recipe.status);

	const [title, setTitle] = useState(initTitle);
	const [mealImg, setMealImg] = useState();
	const [category, setCategory] = useState(initCategory);
	const [calories, setCalories] = useState(initCalories);
	const [difficulty, setDifficulty] = useState(initDifficulty);
	const [ingredients, setIngredients] = useState(initIngredients);
	const [previewVisible, setPreviewVisible] = useState(initPreviewVisibility);
	const [imgSrc, setImgSrc] = useState(imgUrl);

	function handleTitleChange(e) {
		setTitle(e.target.value);
	}
	function handleMealImgChange(e) {
		const imgFile = e.target.files[0];
		getSignedRequest(imgFile);
		setMealImg(imgFile);

		function getSignedRequest(file) {
			axios
				.get(`/sign-s3?file-name=${file.name}&file-type=${file.type}`)
				.then((res) => {
					// console.log("sign-s3 response: ", res.data);
					uploadFile(file, res.data.signedRequest, res.data.url);
				})
				.catch((err) => console.error("Could not get signed URL."));

			function uploadFile(file, signedRequest, url) {
				// console.log("arguments of 'uploadFile' Fn: ", file, signedRequest, url);
				axios
					.put(signedRequest, file)
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
		const sanitizedIngredients = ingredients.map((ingredient) => ingredient.trim());
		const formData = {
			title,
			imgUrl: imgSrc,
			category,
			calories,
			difficulty,
			ingredients: sanitizedIngredients,
		};

		// get correct ThunkFn for Adding or Editing
		const thunkFn = task === "add" ? addRecipe({ formData }) : editRecipe({ recipeId, formData });
		dispatch(thunkFn)
			.then(() => {
				if (task === "add") {
					setTitle("");
					setMealImg(null);
					setCategory(null);
					setCalories(null);
					setDifficulty(null);
					setIngredients([""]);
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

	useEffect(() => {
		if (mealImg) {
			setPreviewVisible(true);
			setImgSrc(URL.createObjectURL(mealImg));
		}
	}, [mealImg]);

	// Background der Input-Felder resetten, wenn sich State geändert hat
	useEffect(() => {
		markCheckedInputs();
	}, [category, calories, difficulty]);

	const titleText = task === "add" ? "Neues Rezept hinzufügen" : "Rezept editieren";
	const successVerb = task === "add" ? "hinzugefügt" : "editiert";

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
					<input type='text' className='titleInput' id='title' name='title' value={title} onChange={handleTitleChange} autoFocus></input>
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

// Helper, um bestehendes Rezeptbild für Edit-Fomular aus DB zu holen. Wieder-Hochladen hat nicht funktioniert --> on hold
// async function fetchMealImg(filePath) {
//   try {
//     const mealImg = await axios.get("http://localhost:9000/fetchMealImg", {
//       params: {
//         "filePath": filePath
//       }
//     })
//     return mealImg.data
//   } catch (error) {
//     console.error(error.message)
//   }
// }
