import { Metadata } from "next";
import PythonCompilerClient from "./PythonCompilerClient";

export const metadata: Metadata = {
  title: "Python Compiler [BETA] | Boss478",
  description: "เครื่องมือจำลองการเขียนโปรแกรมภาษา Python ออนไลน์",
};

export default function PythonCompilerPage() {
  return <PythonCompilerClient />;
}
