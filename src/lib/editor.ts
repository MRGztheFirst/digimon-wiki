import "server-only";

export function editorEnabled() {
  return process.env.EDITOR_ENABLED === "true";
}

export function assertEditor() {
  if (!editorEnabled()) throw new Error("Edição desativada neste servidor.");
}
