import nextDynamic from "next/dynamic";
const ComputerLabClient = nextDynamic(() => import("./ComputerLabClient"), {
  loading: () => <div className="min-h-screen bg-slate-950 animate-pulse" />,
});

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
