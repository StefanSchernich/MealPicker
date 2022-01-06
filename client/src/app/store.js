import { configureStore } from "@reduxjs/toolkit";
import recipeReducer from "../features/Recipe/recipeSlice";

export const store = configureStore({
    reducer: {
        recipe: recipeReducer,
    },
});
