// Round 19: Full C-Suite may say the same thing as a deadpan joke instead of the plain wording.
// An L3 line passes a plain-wording check if it matches the plain wording, or if it is one of the
// round-19 joke shapes and still passes the meaning check (no's, numbers, names, dates kept).
import { checkMeaning } from "../site/meaning.js";
export const L3_JOKE = /\b(?:strategic upside in|synergy in|long-term value in|growth opportunity in|unplanned maintenance window|non-linear timeline|watchful waiting|deeply committed to|audience of zero|total-rewards strategy|stress test of our organizational resilience|patient holding pattern|discretionary effort|strategic agility|stealth mode|intended recipient|energy reserves|enthusiasm runway|minimum viable effort|flexible availability model|unscheduled exit|record-breaking growth|strategic recharge PTO)\b/;
export const l3ok = (input, out, re) => re.test(out) || (L3_JOKE.test(out) && checkMeaning(input, out).ok);
