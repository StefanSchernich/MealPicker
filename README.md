Meal Picker

Motivation
Sometimes (most of the time) we have trouble coming up with ideas on what to cook. Meal Picker provides ideas to fill that void.

Not in scope:
Detailed cooking instructions are not provided as the purpose of the app is to give you an idea on *what* to cook, not *how*.

How it works
Getting a recipe
The starting page holds several (optional) ways to filter meals:
1. Category
  meat, fish, vegeterian
2. Calories
  Normal or low-calory/diet
3. Difficulty
  Easy to cook, medium, hard
4. Ingredients
  Multiple ingredients can be selected. Note: a recipe must contain *all* checked ingredients to be shown.

After clicking the "search for meal", a database query is triggered that will return a random recipe matching the filter criteria.

Editing a recipe
You can edit a recipe by clicking "Edit recipe".

Deleting a recipe
You can delete a recipe by clicking "Delete recipe" und confirming the prompt.

Adding a new recipe
You can add a new recipe by clicking the "Create new recipe" link in the navigation bar at the top of the page.

Implementation
Meal Picker is a full-stack MERN application:
The backend is a NodeJS application with the "express" framework. Data is stored in an MongoDB Atlas online database.
The frontend is based on the React/Redux template of create-react-app. 
