import "server-only";

export function editorEnabled() {
  return process.env.NODE_ENV !== "production" && process.env.EDITOR_ENABLED === "true";
}

export function assertEditor() {
  if (!editorEnabled()) throw new Error("Edição desativada neste servidor.");
}
