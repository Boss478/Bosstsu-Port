import ComputerLabClient from "./ComputerLabClient";

export const dynamic = "force-dynamic";

export const metadata = {
  title: "Computer Lab | เรียนรู้โลกของคอมพิวเตอร์",
  description: "Learn about computer hardware, software, and workflow through 5 interactive stages. Build a PC and diagnose faults in this educational game.",
  openGraph: {
    title: "Computer Lab | Boss478 Games",
    description: "5 interactive stages teaching computer hardware, software, and workflow. Build a PC and diagnose faults!",
    type: "website",
  },
};

export default function ComputerLabPage() {
  return <ComputerLabClient />;
}
