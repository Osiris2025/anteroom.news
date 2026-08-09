import { NextResponse } from "next/server";

const catboyStory = {
  episode: 1,
  title: "THE RETURN OF CATBOY: Grainy Photo Confirms Half-Cat, Half-Boy Cryptid Spotted at 7-Eleven in Tuscaloosa",
  date: "August 8, 2026",
  author: "Weekly Weird News Staff",
  tldr: 'A grainy security camera image from a Tuscaloosa 7-Eleven has captured what experts call "the clearest evidence yet" that CATBOY has returned.',
  key_points: [
    "Security footage at 2:47 AM shows a bipedal cat-like figure purchasing snacks",
    "Three witnesses described the creature as definitely part cat, definitely part boy",
    "Cryptozoologist Dr. Meowton rates the sighting 9.5/10 on the Weird-o-Meter",
    "The creature was last seen heading toward the interstate clutching its Slurpee",
  ],
  commentary: "In an exclusive interview with Weekly Weird News, Dr. Meowton stated: \"This is not a man in a costume. A man in a costume would not purchase a Slurpee.\"\n\nSkeptics claim the image is a viral marketing stunt. But they said the same about Batboy in 1992.\n\nCATBOY is back, and he appears to be in the mood for a snack.",
  why_this_matters: "If CATBOY is real, everything we thought about cryptid migration patterns is wrong. His return suggests a breeding population in the southeastern US.",
  discussion_prompts: [
    "Have YOU seen CATBOY? Share your sighting!",
    "Cryptid or marketing stunt? What's your theory?",
    "What's the weirdest thing you have ever bought at a 7-Eleven?",
  ],
};

export async function GET() {
  return NextResponse.json(catboyStory);
}
