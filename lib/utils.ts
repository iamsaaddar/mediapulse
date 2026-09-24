export function isNonEmptyString(value: unknown): value is string {
	return typeof value === "string" && value.trim().length > 0;
}

type ClassNameValue = string | false | null | undefined;

export function cx(...classNames: ClassNameValue[]): string {
	return classNames.filter(Boolean).join(" ");
}
