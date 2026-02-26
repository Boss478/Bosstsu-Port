import mongoose from "mongoose";
import Game from "../src/models/Game";

const MONGODB_URI = process.env.MONGODB_URI || "mongodb://user:password@localhost:27017/boss478?authSource=admin"; // Update as needed if using local

async function main() {
  try {
    const uri = process.env.MONGODB_URI;
    if (!uri) throw new Error("MONGODB_URI is not defined");
    
    await mongoose.connect(uri);
    console.log("Connected to MongoDB.");

    const existingGame = await Game.findOne({ playUrl: "/games/flashcard" });
    if (existingGame) {
      console.log("Game already exists!");
    } else {
      await Game.create({
        title: "Is it spelled correctly? / เขียนถูกหรือผิด?",
        description: "Test your spelling skills in Thai and English (US). / ฝึกทักษะการสะกดคำภาษาไทยและภาษาอังกฤษ",
        genre: "Native",
        playUrl: "/games/flashcard",
        thumbnail: "https://cdn-icons-png.flaticon.com/512/3592/3592837.png", // Example flaticon placeholder for flashcards
        tags: ["Vocabulary", "Flashcard", "Spelling"],
        published: true,
      });
      console.log("Flashcard Game seeded successfully!");
    }
  } catch (error) {
    console.error("Error seeding:", error);
  } finally {
    await mongoose.disconnect();
  }
}

main();
