const express = require("express");
const app = express();
const path = require("path");
const mongoose = require("mongoose");
require("dotenv").config({ path: path.join(__dirname, "..", ".env") });
const cors = require("cors");
const aws = require("aws-sdk");
aws.config.region = "eu-central-1";

app.use(cors());
app.use(express.urlencoded({ extended: true }));
app.use(express.json());
app.use(express.static(path.resolve(__dirname, "../client/build")));

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

app.get("/sign-s3", (req, res) => {
	const s3 = new aws.S3();
	const fileName = req.query["file-name"];
	const fileType = req.query["file-type"];
	const s3Params = {
		Bucket: process.env.S3_BUCKET_NAME,
		Key: fileName,
		Expires: 60,
		ContentType: fileType,
		ACL: "public-read",
	};

	s3.getSignedUrl("putObject", s3Params, (err, data) => {
		if (err) {
			console.log(err);
			return res.end();
		}
		const returnData = {
			signedRequest: data,
			url: `https://${process.env.S3_BUCKET_NAME}.s3.amazonaws.com/${fileName}`,
		};
		console.log("S3 return data: ", returnData);
		res.write(JSON.stringify(returnData));
		res.end();
	});
});

app.post("/addRecipe", async (req, res) => {
	console.log("ADD Req Body: ", req.body);
	// req.body contains all required recipe data --> use copy
	const recipeData = { ...req.body };
	console.log("recipeData to be handed to document creation:", recipeData);
	const newRecipe = await Recipe.create(recipeData);
	return res.status(200).json(newRecipe);
});

app.patch("/editRecipe/:id", async (req, res) => {
	// req.body enthält editiertes Rezept (title, category, calories, difficulty, ingredients)
	const { id } = req.params;
	const patchData = { ...req.body };
	const editedRecipe = await Recipe.findByIdAndUpdate(id, patchData, { returnDocument: "after" }).exec();
	return res.status(200).json(editedRecipe);
});

app.delete("/deleteRecipe/:id", async (req, res) => {
	console.log("DELETE TRIGGERED");
	const { id } = req.params;
	const recipeToBeDeleted = await Recipe.findByIdAndDelete(id).exec();
	const previousImgUrl = recipeToBeDeleted.imgUrl;
	if (previousImgUrl) {
		let previousImgPath = ""; // path to previous image
		if (process.env.NODE_ENV === "development") {
			previousImgPath = path.join(__dirname, "..", "client", "public", previousImgUrl);
		} else {
			previousImgPath = path.join(__dirname, "..", "client", "build", previousImgUrl);
		}
		console.log("typeof previousImgUrl (DELETE): ", typeof previousImgUrl);
		console.log("previousImgUrl (DELETE): ", previousImgUrl);
		deleteFile(previousImgPath);
	}
	return res.status(200).json({ deletedRecipe: recipeToBeDeleted });
});

app.get("*", (req, res) => {
	res.sendFile(path.join(__dirname, "../client/build", "index.html"));
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
