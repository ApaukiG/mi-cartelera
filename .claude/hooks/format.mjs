// Hook PostToolUse: formatea con Prettier el archivo que Claude acaba de crear o editar.
import { execSync } from "node:child_process";

let input = "";
process.stdin.on("data", (chunk) => (input += chunk));
process.stdin.on("end", () => {
  const filePath = JSON.parse(input).tool_input?.file_path;
  if (!filePath) return;
  try {
    execSync(`npx prettier --write --ignore-unknown "${filePath}"`, { stdio: "inherit" });
  } catch {
    // Si Prettier falla, no se bloquea el trabajo del agente.
  }
});