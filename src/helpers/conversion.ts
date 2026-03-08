import { APP_PREFIX } from "@/constants";

const baseCapitalize = (baseString: string) => {
	if (!baseString) {
		console.warn("[baseCapitalize] Received empty string");
		return "";
	}

	const capitalizedString = `${baseString[0].toUpperCase()}${baseString.slice(1)}`;

	return capitalizedString;
};

export const capitalize = (
	baseString: string,
	options: {
		allWords?: boolean;
		separator?: string;
		showDebug?: boolean;
	} = {},
) => {
	if (!baseString) {
		console.warn("[stringCapitalize] Received empty string");
		return "";
	}

	const { allWords = false, separator = " ", showDebug = false } = options;

	if (!allWords) {
		return baseCapitalize(baseString);
	}

	const wordsList = baseString.split(separator);

	const capitalizedWordsList = wordsList.map((word) => baseCapitalize(word));

	const capitalizedString = capitalizedWordsList.join(separator);

	if (showDebug) {
		console.log("[stringCapitalize] results", {
			wordsList,
			capitalizedWordsList,
			capitalizedString,
			separator,
			allWords,
			baseString,
		});
	}

	return capitalizedString;
};

export const withPrefix = (
	baseString: string,
	options: { separator?: string } = {},
) => {
	const { separator = "_" } = options;
	const prefixedString = `${APP_PREFIX}${separator}${baseString}`;

	return prefixedString;
};
