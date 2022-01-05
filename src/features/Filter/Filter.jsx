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
  };

  function handleFilterFormReset(e) {
    e.preventDefault();
    setCategory("");
    setCalories("");
    setDifficulty("");
    setIngredients([]);
  }

  const handleSubmit = (e) => {
    e.preventDefault();
    const filter = {
      category,
      calories,
      difficulty,
      ingredients,
    };
    const sanitizedFilterObj = sanitizeObj(filter);
    dispatch(fetchRandomRecipe(sanitizedFilterObj))
      .then(() => {
        navigate("/recipe")
        const recipeElem = document.querySelector(".recipe")
        recipeElem?.scrollIntoView({ behavior: "auto" })
        const warningElem = document.querySelector(".warning")  // will render if no recipe found
        warningElem?.scrollIntoView({ behavior: "smooth" })
      })
      .catch(err => console.log(err.message))
  };

  // Background der Input-Felder resetten, wenn sich State geändert hat
  useEffect(() => {
    markCheckedInputs()
  }, [category, calories, difficulty, ingredients])

  return (
    <>
      <div className="filter">
        <form onSubmit={handleSubmit}>
          <fieldset>
            <RadioFilterSection
              sectionName="category"
              state={category}
              dataArr={categoryOptions}
              changeHandler={handleCategoryChange}
              isRequired={false}
            > Kategorie
            </RadioFilterSection>
            <RadioFilterSection
              sectionName="calories"
              state={calories}
              dataArr={caloryOptions}
              changeHandler={handleCaloriesChange}
              isRequired={false}
            > Kalorien
            </RadioFilterSection>
            <RadioFilterSection
              sectionName="difficulty"
              state={difficulty}
              dataArr={difficultyOptions}
              changeHandler={handleDifficultyChange}
              isRequired={false}
            > Schwierigkeit
            </ RadioFilterSection>
            <div className="filterSection">
              <span className="filterHeading">Zutaten</span>
              <div className="filterOptions">
                {ingredientOptions.map(({ id, value, icon }) => {
                  return (
                    <FilterOptionCheckbox
                      sectionName="ingredients"
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
            <input type="submit" value="Rezept suchen" />
            <button className="resetBtn" onClick={handleFilterFormReset}>
              Reset
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
