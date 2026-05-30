import { Metadata } from "next";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Python Compiler [BETA] | Boss478",
  description: "เครื่องมือจำลองการเขียนโปรแกรมภาษา Python ออนไลน์",
};

export default function PythonCompilerPage() {
  return (
    <div className="min-h-[60vh] flex items-center justify-center">
      <div className="text-center">
        <div className="w-12 h-12 border-4 border-sky-500 border-t-transparent rounded-full animate-spin mx-auto mb-4" />
        <p className="text-gray-600 dark:text-gray-400">Loading Python Compiler...</p>
      </div>
    </div>
  );
}
