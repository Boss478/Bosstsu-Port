import mongoose from "mongoose";
import Game from "../src/models/Game";

async function main() {
  await mongoose.connect(process.env.MONGODB_URI as string);
  const game = await Game.findOne({ "playUrl": { $regex: /spellchecker/ }});
  console.log("Game inside DB:", game?.title, game?.playUrl);
  process.exit(0);
}
main();
