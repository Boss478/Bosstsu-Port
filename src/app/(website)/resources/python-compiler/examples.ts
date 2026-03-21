export const PYTHON_EXAMPLES = [
  {
    title: "Hello World",
    description: "ลองพิมพ์ข้อความแรกของคุณ",
    code: 'print("Hello world")',
  },
  {
    title: "ตัวแปร (Variables)",
    description: "การสร้างและใช้ตัวแปร",
    code: 'name = "Boss478"\nage = 20\n\nprint(f"ชื่อ: {name}, อายุ: {age} ปี")\nprint(f"ปีหน้าคุณจะอายุ {age + 1} ปี")',
  },
  {
    title: "เงื่อนไข (If-Else)",
    description: "การตัดสินใจด้วย if-else",
    code: 'score = int(input("กรุณาใส่คะแนน (0-100): "))\n\nif score >= 80:\n    print("คุณได้เกรด A")\nelif score >= 70:\n    print("คุณได้เกรด B")\nelif score >= 60:\n    print("คุณได้เกรด C")\nelse:\n    print("พยายามอีกนิดนะ!")',
  },
  {
    title: "วนลูป (For Loop)",
    description: "การวนซ้ำและการสร้าง List",
    code: 'fruits = ["แอปเปิ้ล", "กล้วย", "ส้ม", "มังคุด"]\n\nprint("ผลไม้ที่ฉันชอบ:")\nfor i, fruit in enumerate(fruits):\n    print(f"{i+1}. {fruit}")',
  },
  {
    title: "วนลูป (While Loop)",
    description: "การวนซ้ำแบบประเมินเงื่อนไข",
    code: 'count = 5\n\nprint("นับถอยหลัง...")\nwhile count > 0:\n    print(count)\n    count -= 1\n\nprint("เริ่มได้!")',
  },
  {
    title: "ฟังก์ชัน (Function)",
    description: "การสร้างและเรียกใช้งานฟังก์ชัน",
    code: 'def calculate_area(width, height):\n    return width * height\n\nw = 5\nh = 10\narea = calculate_area(w, h)\n\nprint(f"พื้นที่สี่เหลี่ยม กว้าง {w} ยาว {h}")\nprint(f"มีขนาดเท่ากับ = {area} ตารางหน่วย")',
  },
  {
    title: "คณิตศาสตร์ (Math)",
    description: "ใช้งานไลบรารีคณิตศาสตร์",
    code: 'import math\n\nradius = 7\narea = math.pi * (radius ** 2)\n\nprint(f"วงกลมรัศมี {radius} หน่วย")\nprint(f"มีพื้นที่ประมาณ {area:.2f} ตารางหน่วย")\nprint(f"ค่าของ Pi คือ {math.pi}")',
  }
];
