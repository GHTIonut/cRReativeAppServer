import { julian, sidereal } from "astronomia";

const date = new Date();

// Convertim data în Julian Date
const jd = julian.CalendarGregorianToJD(
  date.getFullYear(),
  date.getMonth() + 1,
  date.getDate(),
);

// Calculăm timpul sideral
const gst = sidereal.mean(jd);

console.log("Greenwich Sidereal Time:", gst);
