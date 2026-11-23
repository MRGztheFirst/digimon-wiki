import type { Locale, Messages } from "../config";
import en from "./en";
import ja from "./ja";

export const uiMessages: Record<Locale, Messages | undefined> = { pt: undefined, en, ja };
