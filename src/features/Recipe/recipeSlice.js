import { createAsyncThunk, createSlice } from "@reduxjs/toolkit";
const axios = require("axios");

const initialState = {
	recipe: {
		_id: null,
		title: "",
		imgUrl: "",
		calories: "",
		difficulty: "",
		ingredients: [],
	},
	recipeQueryStatus: null,
	status: null,
};

export const fetchRandomRecipe = createAsyncThunk("/recipe/fetchRandomRecipe", async (preparedFilterObj) => {
	const response = await axios.get("http://localhost:9000/fetchRandomRecipe", { params: preparedFilterObj });
	if (!response.data) throw new Error("Kein Rezept gefunden!");
	return response.data;
});

export const addRecipe = createAsyncThunk("/recipe/addRecipe", async ({ formData: newRecipe }) => {
	const response = await axios.post("http://localhost:9000/addRecipe", newRecipe);
	return response.data;
});

export const editRecipe = createAsyncThunk("/recipe/editRecipe", async ({ recipeId, formData: editedRecipe }) => {
	const response = await axios.patch(`http://localhost:9000/editRecipe/${recipeId}`, editedRecipe);
	return response.data;
});

export const deleteRecipe = createAsyncThunk("/recipe/deleteRecipe", async (recipeId) => {
	const response = await axios.delete(`http://localhost:9000/deleteRecipe/${recipeId}`);
	return response.data;
});

export const recipeSlice = createSlice({
	name: "recipe",
	initialState,
	reducers: {
		resetStatus: {
			reducer(state, action) {
				state.status = null;
			}
		}
	},
	extraReducers(builder) {
		builder
      .addCase(fetchRandomRecipe.pending, (state, action) => {
        state.recipeQueryStatus = "loading";
      })
			.addCase(fetchRandomRecipe.fulfilled, (state, action) => {
				state.recipe.title = action.payload.title;
				state.recipe.imgUrl = action.payload.imgUrl;
				state.recipe.category = action.payload.category;
				state.recipe.calories = action.payload.calories;
				state.recipe.difficulty = action.payload.difficulty;
				state.recipe.ingredients = action.payload.ingredients;
				state.recipe._id = action.payload._id;
				state.recipeQueryStatus = "success";
			})
			.addCase(fetchRandomRecipe.rejected, (state, action) => {
				state.recipeQueryStatus = "fail";
			})
			.addCase(addRecipe.pending, (state, action) => {
				state.status = "pending";
			})
			.addCase(addRecipe.fulfilled, (state, action) => {
				// action.payload contains the new recipe
				state.status = "addSucceeded";
        state.recipeQueryStatus = "success"
				state.recipe.title = action.payload.title;
				state.recipe.imgUrl = action.payload.imgUrl;
				state.recipe.category = action.payload.category;
				state.recipe.calories = action.payload.calories;
				state.recipe.difficulty = action.payload.difficulty;
				state.recipe.ingredients = action.payload.ingredients;
				state.recipe._id = action.payload._id;
			})
			.addCase(addRecipe.rejected, (state, action) => {
				state.status = "addFailed";
			})
			.addCase(editRecipe.pending, (state, action) => {
				state.status = "pending";
			})
			.addCase(editRecipe.fulfilled, (state, action) => {
				// action.payload contains the edited recipe
				state.status = "editSucceeded";
				state.recipe.title = action.payload.title;
				state.recipe.imgUrl = action.payload.imgUrl;
				state.recipe.category = action.payload.category;
				state.recipe.calories = action.payload.calories;
				state.recipe.difficulty = action.payload.difficulty;
				state.recipe.ingredients = action.payload.ingredients;
				state.recipe._id = action.payload._id;
			})
			.addCase(editRecipe.rejected, (state, action) => {
				state.status = "editFailed";
			});
	},
});

// TO DO: add action exports
export default recipeSlice.reducer;
export const { resetStatus } = recipeSlice.actions;
