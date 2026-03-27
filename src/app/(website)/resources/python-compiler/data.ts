export interface PythonMetadataItem {
  desc: { en: string; th: string };
  params?: string;
  params_study?: string;
  example?: string;
  isKeyword?: boolean;
}

export const PYTHON_METADATA: Record<string, PythonMetadataItem> = {
  "print": {
    desc: {
      en: "Prints the specified message to the screen.",
      th: "แสดงข้อความหรือค่าของตัวแปรออกทางหน้าจอ"
    },
    params: "print(value, ..., sep=' ', end='\\n')",
    params_study: "print(ข้อความ/ชุดตัวเลข)",
    example: "print('Hello World')\nprint('A', 'B', sep='-')"
  },
  "len": {
    desc: {
      en: "Returns the number of items in an object.",
      th: "คืนค่าจำนวนสมาชิกใน Object (เช่น ความยาวของ String หรือจำนวนใน List)"
    },
    params: "len(obj)",
    params_study: "len(สิ่งที่ต้องการนับ)",
    example: "len('Hello') # 5\nlen([1, 2, 3]) # 3"
  },
  "int": {
    desc: {
      en: "Converts a value to an integer.",
      th: "แปลงค่าให้เป็นจำนวนเต็ม (Integer)"
    },
    params: "int(value)\nint(value, base)",
    params_study: "int(ค่าที่ต้องการแปลง)\nint(ค่า, ฐานเลข)",
    example: "int('10')\nint('FF', 16) # 255"
  },
  "str": {
    desc: {
      en: "Converts a value to a string.",
      th: "แปลงค่าให้เป็นตัวอักษร (String)"
    },
    params: "str(object='')",
    params_study: "str(ค่าที่ต้องการแปลง)",
    example: "str(100) # '100'"
  },
  "input": {
    desc: {
      en: "Allows user to input data.",
      th: "รับค่าข้อมูลจากคีย์บอร์ด"
    },
    params: "input(prompt='')",
    params_study: "input(ข้อความคำสั่ง)",
    example: "name = input('Enter name: ')"
  },
  "range": {
    desc: {
      en: "Returns a sequence of numbers.",
      th: "สร้างชุดข้อมูลตัวเลขตามช่วงที่กำหนด"
    },
    params: "range(stop)\nrange(start, stop)\nrange(start, stop, step)",
    params_study: "range(จบที่เลข)\nrange(เริ่มที่, จนถึงเลข)\nrange(เริ่ม, จบ, ขยับทีละหลาก)",
    example: "range(5) # 0 to 4\nrange(1, 6) # 1 to 5\nrange(0, 10, 2) # 0, 2, 4, 6, 8"
  },
  "pow": {
    desc: {
      en: "Returns the value of x to the power of y.",
      th: "คืนค่า x ยกกำลัง y"
    },
    params: "pow(base, exp)\npow(base, exp, mod)",
    params_study: "pow(ฐาน, เลขชี้กำลัง)\npow(ฐาน, เลขชี้กำลัง, ตัวหารเอาเศษ)",
    example: "pow(4, 3) # 64\npow(4, 3, 5) # 4"
  },
  "round": {
    desc: {
      en: "Rounds a number to a specified number of decimals.",
      th: "ปัดเศษตัวเลขตามจำนวนทศนิยมที่กำหนด"
    },
    params: "round(number)\nround(number, ndigits)",
    params_study: "round(ตัวเลข)\nround(ตัวเลข, จำนวนทศนิยม)",
    example: "round(3.14159, 2) # 3.14\nround(4.6) # 5"
  },
  "def": {
    desc: {
      en: "Defines a new function.",
      th: "คำสั่งสำหรับสร้างฟังก์ชันใหม่"
    },
    isKeyword: true,
    params: "def name(parameters):",
    params_study: "def ชื่อฟังก์ชัน(ตัวแปรรับค่า):",
    example: "def my_function():\n    print('Hello')"
  },
  "if": {
    desc: {
      en: "Conditional statement.",
      th: "ตรวจสอบเงื่อนไข ถ้าเป็นจริงจะทำงานในบล็อกนี้"
    },
    isKeyword: true,
    params: "if condition:",
    params_study: "if เงื่อนไขเป็นจริง:",
    example: "if x > 0:\n    print('Positive')"
  },
  "else": {
    desc: {
      en: "Executes if the 'if' condition is false.",
      th: "ทำงานเมื่อเงื่อนไขใน if และ elif เป็นเท็จทั้งหมด"
    },
    isKeyword: true,
    params: "else:",
    params_study: "else: (ถ้าเงื่อนไขก่อนหน้าผิดทั้งหมด)",
    example: "if x > 0:\n    ...\nelse:\n    print('Negative or Zero')"
  },
  "elif": {
    desc: {
      en: "Short for 'else if'.",
      th: "ตรวจสอบเงื่อนไขเพิ่มเติม ถ้าเงื่อนไขก่อนหน้าเป็นเท็จ"
    },
    isKeyword: true,
    params: "elif condition:",
    params_study: "elif เงื่อนไขเพิ่มเติม:",
    example: "if x > 0:\n    ...\nelif x == 0:\n    ..."
  },
  "for": {
    desc: {
      en: "Starts a for loop.",
      th: "การวนลูปตามจำนวนสมาชิกในชุดข้อมูล"
    },
    isKeyword: true,
    params: "for variable in sequence:",
    params_study: "for ตัวแปร in ข้อมูลหลายชิ้น/range():",
    example: "for item in [1, 2, 3]:\n    print(item)"
  },
  "while": {
    desc: {
      en: "Starts a while loop.",
      th: "การวนลูปตราบใดที่เงื่อนไขยังเป็นจริง"
    },
    isKeyword: true,
    params: "while condition:",
    params_study: "while ทำตราบเท่าที่เงื่อนไขเป็นจริง:",
    example: "while x < 5:\n    x += 1"
  },
  "math": {
    desc: {
      en: "Mathematical functions library.",
      th: "ไลบรารีที่รวมฟังก์ชันทางคณิตศาสตร์"
    },
    params: "import math",
    example: "import math\nprint(math.sqrt(16))"
  },
  "import": {
    desc: {
      en: "Imports a module.",
      th: "คำสั่งสำหรับนำเข้าไลบรารีหรือมอดูลภายนอก"
    },
    isKeyword: true,
    params: "import module_name",
    params_study: "import ชื่อไลบรารี",
    example: "import math\nimport random"
  }
};
