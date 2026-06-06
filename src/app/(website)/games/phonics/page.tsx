import type { Metadata } from "next";
import PhonicsClient from "./PhonicsClient";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Phonics Island | Boss478",
  description: "Master English phonemes, spelling, and vocabulary through a retro pixel-art island adventure.",
};

export default function PhonicsPage() {
  return <PhonicsClient />;
}
