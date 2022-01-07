const express = require("express");
const app = express();
const path = require("path");
const mongoose = require("mongoose");
require("dotenv").config({ path: path.join(__dirname, "..", ".env") });
const cors = require("cors");
const multer = require("multer");
const { v4: uuid4 } = require("uuid");
const fs = require("fs").promises;

app.use(cors());
app.use(express.urlencoded({ extended: true }));
app.use(express.json());
app.use(express.static(path.resolve(__dirname, '../client/build/static')));
const storage = multer.diskStorage({
	destination: function (req, file, cb) {
    let imageDest = ""
    if (process.env.NODE_ENV === "development") {
      imageDest = path.join(__dirname, "..", "client", "public", "images")
    } else {
      imageDest = path.join(__dirname, "..", "client", "build", "static", "images")
    }
    console.log("imageDest: ", imageDest)
		cb(null, imageDest);
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

mongoose
	.connect(`mongodb+srv://${process.env.DB_USER}:${process.env.DB_PASS}@cluster0.87bkb.mongodb.net/RecipeDB?retryWrites=true&w=majority`)
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
	console.log("file in ADD: ", req.file);
	// Deal with remaining formData
	const { title, category, calories, difficulty } = req.body;

	// Create ingredient array: populate only with formData entries whose key starts with "ingredients" and whose value is not ""
	const ingredientArr = [];
	for (let prop in req.body) {
		if (prop.startsWith("ingredient") && req.body[prop]) {
			ingredientArr.push(req.body[prop]);
		}
	}
	let recipeData = {
		title,
		category,
		calories,
		difficulty,
		ingredients: ingredientArr,
	};
	if (req.file) {
		recipeData = updateImgUrl(req, recipeData);
	}
	console.log("recipeData to be handed to document creation:", recipeData);
	const newRecipe = await Recipe.create(recipeData);
	return res.status(200).json(newRecipe);
});

app.patch("/editRecipe/:id", upload.single("mealImage"), async (req, res) => {
	// req.body enthält editiertes Rezept (title, category, calories, difficulty, ingredients)
	console.log("file in EDIT: ", req.file);
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
	let patchData = {
		title,
		category,
		calories,
		difficulty,
		ingredients: ingredientArr,
	};

	if (req.file) {
		// add new imgUrl to patch data
		patchData = updateImgUrl(req, patchData);
		// console.log("finalizedValues: ", patchData);

		// query for previous recipe in db, look for "imgUrl"-field
		const previousImg = await Recipe.findById(id, "imgUrl").exec();
		console.log("previousImg (EDIT): ", previousImg);
		if (previousImg.imgUrl) {
      let previousImgPath = ""    // path to previous image
      if (process.env.NODE_ENV === "development") {
        previousImgPath = path.join(__dirname, "..", "client", "public", previousImg.imgUrl)
      } else {
        previousImgPath = path.join(__dirname, "..", "client", "build", "static", previousImg.imgUrl)
      }
			deleteFile(previousImgPath);
		}
	}
	const editedRecipe = await Recipe.findByIdAndUpdate(id, patchData, { returnDocument: "after" }).exec();
	return res.status(200).json(editedRecipe);
});

app.delete("/deleteRecipe/:id", async (req, res) => {
	console.log("DELETE TRIGGERED");
	const { id } = req.params;
	const recipeToBeDeleted = await Recipe.findByIdAndDelete(id).exec();
	const previousImgUrl = recipeToBeDeleted.imgUrl;
	if (previousImgUrl) {
    let previousImgPath = ""    // path to previous image
    if (process.env.NODE_ENV === "development") {
      previousImgPath = path.join(__dirname, "..", "client", "public", previousImgUrl)
    } else {
      previousImgPath = path.join(__dirname, "..", "client", "build", "static", previousImgUrl)
    }
		console.log("typeof previousImgUrl (DELETE): ", typeof previousImgUrl);
		console.log("previousImgUrl (DELETE): ", previousImgUrl);
		deleteFile(previousImgPath);
	}
	return res.status(200).json({ deletedRecipe: recipeToBeDeleted });
});

app.get('*', (req, res) => {
  res.sendFile(path.resolve(__dirname, '../client/build', 'index.html'));
});

const PORT = process.env.PORT || 5000;
app.listen(PORT, () =>
	console.log(`Server is listening on port ${PORT},
__dirname: ${__dirname}
process.cwd(): ${process.cwd()},
NODE_ENV: ${process.env.NODE_ENV}`)
);

/**
 * Checks if prop "ingredients" is present in argument obj. If so, MongoDB cmd "$all" is prepended to "ingredient" value -> modifies filter to only show
 * db entries that include *all* of the selected incredients
 * @param {Object} reqFilterObj - object containing filter parameters for db query
 * @returns modified filter obj with "$all" prepended in "ingredients" value
 */
function generateFilter(reqFilterObj) {
	const filterObj = { ...reqFilterObj };
	if ("ingredients" in filterObj) {
		filterObj["ingredients"] = { $all: filterObj["ingredients"] };
	}
	return filterObj;
}

/**
 * Creates new object with added imgUrl property & value (URL string created by Multer w/ UUIDv4) from req.file
 * @param {Object} req - request object with image in req.file
 * @param {Object} patchData - modified object with imgUrl property & value
 * @returns void
 */
function updateImgUrl(req, patchData) {
	const updatedData = JSON.parse(JSON.stringify(patchData));
	// console.log("before: ", updatedData)
	const { filename } = req.file;
	const imgUrl = `/images/${filename}`;
	updatedData["imgUrl"] = imgUrl;
	// console.log("after: ", updatedData)
	return updatedData;
}

/**
 * Deletes file from "/images/[filename].[ext]"
 * @param {string} url - URL of file to be deleted
 * @returns void
 */
async function deleteFile(url) {
	try {
		await fs.unlink(url);
	} catch (err) {
		console.error(err);
	}
}
