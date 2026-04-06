import NumberGameClient from "./NumberGameClient";

export const metadata = {
  title: "Number Game | ผจญภัยโลกตัวเลข",
  description: "เรียนรู้ตัวเลขภาษาอังกฤษ 1-100 แสนสนุก พร้อมความท้าทายหลายระดับ สำหรับนักเรียนชั้น G.1",
};

export default function NumberGamePage() {
  return <NumberGameClient />;
}
