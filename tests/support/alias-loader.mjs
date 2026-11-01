// Resuelve "@/..." y rutas relativas sin extensión hacia src/*.ts para ejecutar pruebas con node --test.
import { existsSync } from "node:fs";
import { fileURLToPath, pathToFileURL } from "node:url";
import path from "node:path";

const SRC = path.resolve(fileURLToPath(new URL("../../src/", import.meta.url)));
const EXTENSIONS = [".ts", ".tsx", "/index.ts"];

function withExtension(filePath) {
  if (path.extname(filePath) && existsSync(filePath)) return filePath;
  return EXTENSIONS.map((ext) => filePath + ext).find((candidate) => existsSync(candidate)) ?? null;
}

export async function resolve(specifier, context, nextResolve) {
  if (specifier.startsWith("@/")) {
    const target = withExtension(path.join(SRC, specifier.slice(2)));
    if (target) return { url: pathToFileURL(target).href, shortCircuit: true };
  }
  if ((specifier.startsWith("./") || specifier.startsWith("../")) && context.parentURL?.startsWith("file:")) {
    const target = withExtension(path.resolve(path.dirname(fileURLToPath(context.parentURL)), specifier));
    if (target) return { url: pathToFileURL(target).href, shortCircuit: true };
  }
  return nextResolve(specifier, context);
}
