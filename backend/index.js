const express = require("express");
const app = express();
const path = require("path");
const mongoose = require("mongoose");
const cors = require("cors");
const multer = require("multer");
const { v4: uuid4 } = require("uuid");
const fs = require("fs").promises;

app.use(cors());
app.use(express.urlencoded({ extended: true }));
app.use(express.json());
app.use(express.static("public"));
const storage = multer.diskStorage({
	destination: function (req, file, cb) {
		cb(null, path.join(__dirname, "..", "public", "images"));
	},
	filename: function (req, file, cb) {
		cb(null, `${uuid4()}${path.extname(file.originalname)}`);
	},
});

const upload = multer({
	storage,
	fileFilter: (req, file, cb) => {
		if (file.mimetype == "image/png" || file.mimetype == "image/jpg" || file.mimetype == "image/jpeg") {
			cb(null, true);
		} else {
			cb(null, false);
			return cb(new Error("Only .png, .jpg and .jpeg format allowed!"));
		}
	},
	limits: { fileSize: 2 * 1024 * 1024 },
});

const PORT = 9000;

mongoose
	.connect("mongodb+srv://admin-stefan:Hasenhase86@cluster0.87bkb.mongodb.net/RecipeDB?retryWrites=true&w=majority")
	.then(() => console.log("Successfully connected to DB"))
	.catch((err) => console.error(err));

const recipesSchema = new mongoose.Schema({
	title: { type: String, required: true },
	imgUrl: { type: String },
	category: { type: String, required: true, enum: ["Fleisch", "Fisch", "Vegetarisch"] },
	calories: { type: String, required: true, enum: ["Normal", "Diät"] },
	difficulty: { type: String, required: true, enum: ["Einfach", "Mittel", "Schwer"] },
	ingredients: [String],
});

const Recipe = mongoose.model("Recipe", recipesSchema);

// ROUTES
app.get("/fetchRandomRecipe", async (req, res) => {
	const filter = generateFilter(req.query);
	const count = await Recipe.count(filter);
	const random = Math.floor(Math.random() * count);
	const filteredRecipe = await Recipe.findOne(filter).skip(random).exec();
	// console.log(filteredRecipe);
	return res.json(filteredRecipe);
});

app.post("/addRecipe", upload.single("mealImage"), async (req, res) => {
	// Deal with file formData
	const { filename } = req.file;
	const imgUrl = `/images/${filename}`;
	// Deal with remaining formData
	const { title, category, calories, difficulty } = req.body;

	// Create ingredient array: populate only with formData entries whose key starts with "ingredients" and whose value is not ""
	const ingredientArr = [];
	for (let prop in req.body) {
		if (prop.startsWith("ingredient") && req.body[prop]) {
			ingredientArr.push(req.body[prop]);
		}
	}
	const newRecipe = await Recipe.create({
		title,
		imgUrl,
		category,
		calories,
		difficulty,
		ingredients: ingredientArr,
	});
	return res.status(200).json(newRecipe);
});

app.patch("/editRecipe/:id", upload.single("mealImage"), async (req, res) => {
	// req.body enthält editiertes Rezept (title, category, calories, difficulty, ingredients)
	console.log("file in EDIT: ", req.file);
  const { filename } = req.file;
	const imgUrl = `/images/${filename}`;
	const { id } = req.params;
	// Deal with formData
	const { title, category, calories, difficulty } = req.body;

	// Create ingredient array: populate only with formData entries whose key starts with "ingredients" and whose value is not ""
	const ingredientArr = [];
	for (let prop in req.body) {
		if (prop.startsWith("ingredient") && req.body[prop]) {
			ingredientArr.push(req.body[prop]);
		}
	}
	const newValues = {
		title,
    imgUrl,
		category,
		calories,
		difficulty,
		ingredients: ingredientArr,
	};
	const editedRecipe = await Recipe.findByIdAndUpdate(id, newValues, { returnDocument: "after" }).exec();
	return res.status(200).json(editedRecipe);
});

// app.get("/fetchMealImg", async (req, res) => {
// 	try {
//     const { filePath } = req.query   // /images/imgFilename.*
// 		const mealImgFromStorage = await fs.readFile(path.join(__dirname, "..", "public", filePath)); // public/images/imgFilename.*
//     console.log("imageData: ",mealImgFromStorage)
//     res.status(200).end(mealImgFromStorage)
// 	} catch (error) {
// 		console.error(`Got an error trying to read the file: ${error.message}`);
// 	}
// });

app.delete("/deleteRecipe/:id", async (req, res) => {
	const { id } = req.params;
	await Recipe.findByIdAndDelete(id).exec();
	return res.sendStatus(200);
});

app.listen(PORT, () => console.log(`Server is listening on port ${PORT}, __dirname: ${__dirname}`));

//  Helper function: If ingredients are provided as filter parameter via the request, '$all' is included in the filter --> modifies filter to only show
//  recipes that include ALL of the selected incredients
function generateFilter(requestFilterObj) {
	const filterObj = { ...requestFilterObj };
	if ("ingredients" in filterObj) {
		filterObj["ingredients"] = { $all: filterObj["ingredients"] };
	}
	return filterObj;
}
