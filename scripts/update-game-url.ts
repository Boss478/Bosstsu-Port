import mongoose from "mongoose";
import Game from "../src/models/Game";

async function main() {
  try {
    const uri = process.env.MONGODB_URI;
    if (!uri) throw new Error("MONGODB_URI is not defined");
    
    await mongoose.connect(uri);
    console.log("Connected to MongoDB.");

    const result = await Game.updateOne(
      { playUrl: "/games/flashcard" },
      { $set: { playUrl: "/games/is-it-spelled-correctly" } }
    );
    
    console.log("Update result:", result);
  } catch (error) {
    console.error("Error updating:", error);
  } finally {
    await mongoose.disconnect();
  }
}

main();
