import mongoose from "mongoose";
import Game from "../src/models/Game";

async function main() {
  try {
    const uri = process.env.MONGODB_URI;
    if (!uri) throw new Error("MONGODB_URI is not defined");
    
    await mongoose.connect(uri);
    console.log("Connected to MongoDB.");

    // Update title for the game with the new playUrl
    const result = await Game.updateOne(
      { playUrl: "/games/spellchecker" },
      { $set: { title: "SpellChecker" } }
    );
    
    console.log("Update result:", result);
    
    if (result.matchedCount === 0) {
      console.log("No game found with playUrl '/games/spellchecker'. Checking for old playUrl...");
      const oldResult = await Game.updateOne(
        { playUrl: "/games/is-it-spelled-correctly" },
        { $set: { title: "SpellChecker", playUrl: "/games/spellchecker" } }
      );
      console.log("Old playUrl update result:", oldResult);
    }

  } catch (error) {
    console.error("Error updating:", error);
  } finally {
    await mongoose.disconnect();
  }
}

main();
