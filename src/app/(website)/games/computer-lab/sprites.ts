import type { SpriteData } from "./types";
import DATA from "./sprites.json";

const S = DATA as Record<string, SpriteData>;

export const PALETTE: string[] = [
  "#000000", "#4A90D9", "#FFFFFF", "#888888", "#222222",
  "#F5A623", "#D0021B", "#7ED321", "#F8E71C", "#50E3C2",
  "#9013FE", "#4A4A4A", "#E0E0E0", "#143d1f",
];

export const SPRITE_MAP: Record<string, SpriteData> = {
  cpu: S.CPU_SPRITE, monitor: S.MONITOR_SPRITE, keyboard: S.KEYBOARD_SPRITE,
  ram: S.RAM_SPRITE, hdd: S.HDD_SPRITE, mouse: S.MOUSE_SPRITE,
  star_filled: S.STAR_FILLED, star_empty: S.STAR_EMPTY,
  heart: S.HEART, lock: S.LOCK, lightbulb: S.LIGHTBULB,
  magnify: S.MAGNIFY, checkmark: S.CHECKMARK, computer: S.COMPUTER,
  gear: S.GEAR, card: S.CARD, input_icon: S.INPUT_ICON,
  output_icon: S.OUTPUT_ICON, proc_icon: S.PROC_ICON, mem_icon: S.MEM_ICON,
  clipboard: S.CLIPBOARD, pccase: S.PCCASE, microphone: S.MICROPHONE,
  scanner: S.SCANNER, webcam: S.WEBCAM, joystick: S.JOYSTICK,
  printer: S.PRINTER, speaker: S.SPEAKER, projector: S.PROJECTOR,
  headphones: S.HEADPHONES, robot_arm: S.ROBOT_ARM, gpu: S.GPU,
  motherboard: S.MOTHERBOARD, ssd: S.SSD, usb_drive: S.USB_DRIVE,
  sd_card: S.SD_CARD, psu: S.PSU, fan: S.FAN, cables: S.CABLES,
  cpu_cooler: S.CPU_COOLER,
  professor_idle: S.PROFESSOR_IDLE, professor_blink: S.PROFESSOR_BLINK,
  professor_wave: S.PROFESSOR_WAVE, professor_sign: S.PROFESSOR_SIGN,
  pong_paddle: S.PONG_PADDLE, pong_ball: S.PONG_BALL,
  cat: S.CAT, magnifier_icon: S.MAGNIFIER_ICON,
  checklist_icon: S.CHECKLIST_ICON, guide_arrow_icon: S.GUIDE_ARROW_ICON,
  certificate_bg: S.CERTIFICATE_BG, os_icon: S.OS_ICON, app_icon: S.APP_ICON,
  sw_windows: S.SW_WINDOWS, sw_macos: S.SW_MACOS, sw_linux: S.SW_LINUX,
  sw_android: S.SW_ANDROID, sw_ios: S.SW_IOS, sw_chromeos: S.SW_CHROMEOS,
  sw_word: S.SW_WORD, sw_excel: S.SW_EXCEL, sw_photoshop: S.SW_PHOTOSHOP,
  sw_vscode: S.SW_VSCODE, sw_chrome: S.SW_CHROME, sw_spotify: S.SW_SPOTIFY,
  sw_zoom: S.SW_ZOOM, sw_calculator: S.SW_CALCULATOR,
  sw_calendar: S.SW_CALENDAR, sw_clock: S.SW_CLOCK,
  sw_minecraft: S.SW_MINECRAFT, sw_roblox: S.SW_ROBLOX,
  sw_youtube: S.SW_YOUTUBE, sw_discord: S.SW_DISCORD,
  sw_powerpoint: S.SW_POWERPOINT, sw_instagram: S.SW_INSTAGRAM,
  sw_tiktok: S.SW_TIKTOK, sw_whatsapp: S.SW_WHATSAPP,
  sw_fortnite: S.SW_FORTNITE,
};

export const CPU_SPRITE = S.CPU_SPRITE;
export const MONITOR_SPRITE = S.MONITOR_SPRITE;
export const KEYBOARD_SPRITE = S.KEYBOARD_SPRITE;
export const RAM_SPRITE = S.RAM_SPRITE;
export const HDD_SPRITE = S.HDD_SPRITE;
export const MOUSE_SPRITE = S.MOUSE_SPRITE;
export const STAR_FILLED = S.STAR_FILLED;
export const STAR_EMPTY = S.STAR_EMPTY;
export const HEART = S.HEART;
export const LOCK = S.LOCK;
export const LIGHTBULB = S.LIGHTBULB;
export const MAGNIFY = S.MAGNIFY;
export const CHECKMARK = S.CHECKMARK;
export const COMPUTER = S.COMPUTER;
export const GEAR = S.GEAR;
export const CARD = S.CARD;
export const INPUT_ICON = S.INPUT_ICON;
export const OUTPUT_ICON = S.OUTPUT_ICON;
export const PROC_ICON = S.PROC_ICON;
export const MEM_ICON = S.MEM_ICON;
export const CLIPBOARD = S.CLIPBOARD;
export const PCCASE = S.PCCASE;
export const MICROPHONE = S.MICROPHONE;
export const SCANNER = S.SCANNER;
export const WEBCAM = S.WEBCAM;
export const JOYSTICK = S.JOYSTICK;
export const PRINTER = S.PRINTER;
export const SPEAKER = S.SPEAKER;
export const PROJECTOR = S.PROJECTOR;
export const HEADPHONES = S.HEADPHONES;
export const ROBOT_ARM = S.ROBOT_ARM;
export const GPU = S.GPU;
export const MOTHERBOARD = S.MOTHERBOARD;
export const SSD = S.SSD;
export const USB_DRIVE = S.USB_DRIVE;
export const SD_CARD = S.SD_CARD;
export const PSU = S.PSU;
export const FAN = S.FAN;
export const CABLES = S.CABLES;
export const CPU_COOLER = S.CPU_COOLER;
export const PROFESSOR_IDLE = S.PROFESSOR_IDLE;
export const PROFESSOR_BLINK = S.PROFESSOR_BLINK;
export const PROFESSOR_WAVE = S.PROFESSOR_WAVE;
export const PROFESSOR_SIGN = S.PROFESSOR_SIGN;
export const PONG_PADDLE = S.PONG_PADDLE;
export const PONG_BALL = S.PONG_BALL;
export const CAT = S.CAT;
export const MAGNIFIER_ICON = S.MAGNIFIER_ICON;
export const CHECKLIST_ICON = S.CHECKLIST_ICON;
export const GUIDE_ARROW_ICON = S.GUIDE_ARROW_ICON;
export const CERTIFICATE_BG = S.CERTIFICATE_BG;
export const OS_ICON = S.OS_ICON;
export const APP_ICON = S.APP_ICON;
export const SW_WINDOWS = S.SW_WINDOWS;
export const SW_MACOS = S.SW_MACOS;
export const SW_LINUX = S.SW_LINUX;
export const SW_ANDROID = S.SW_ANDROID;
export const SW_IOS = S.SW_IOS;
export const SW_CHROMEOS = S.SW_CHROMEOS;
export const SW_WORD = S.SW_WORD;
export const SW_EXCEL = S.SW_EXCEL;
export const SW_PHOTOSHOP = S.SW_PHOTOSHOP;
export const SW_VSCODE = S.SW_VSCODE;
export const SW_CHROME = S.SW_CHROME;
export const SW_SPOTIFY = S.SW_SPOTIFY;
export const SW_ZOOM = S.SW_ZOOM;
export const SW_CALCULATOR = S.SW_CALCULATOR;
export const SW_CALENDAR = S.SW_CALENDAR;
export const SW_CLOCK = S.SW_CLOCK;
export const SW_MINECRAFT = S.SW_MINECRAFT;
export const SW_ROBLOX = S.SW_ROBLOX;
export const SW_YOUTUBE = S.SW_YOUTUBE;
export const SW_DISCORD = S.SW_DISCORD;
export const SW_POWERPOINT = S.SW_POWERPOINT;
export const SW_INSTAGRAM = S.SW_INSTAGRAM;
export const SW_TIKTOK = S.SW_TIKTOK;
export const SW_WHATSAPP = S.SW_WHATSAPP;
export const SW_FORTNITE = S.SW_FORTNITE;
