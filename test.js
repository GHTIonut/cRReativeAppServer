import { julian } from "astronomia";

function testJulian() {
  const jd = julian.CalendarGregorianToJD(1996, 5, 6, 6, 0, 10);
  console.log(jd);
}

testJulian();
