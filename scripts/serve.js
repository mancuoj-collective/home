// Minimal static file server for local preview: `bun run preview`.
import { join } from "node:path";

const root = join(import.meta.dir, "..", "dist");
const port = Number(process.env.PORT || 4321);

Bun.serve({
  port,
  async fetch(req) {
    const path = new URL(req.url).pathname;
    const file = Bun.file(join(root, path === "/" ? "index.html" : path));
    if (!(await file.exists())) return new Response("Not found", { status: 404 });
    return new Response(file);
  },
});

console.log(`preview → http://localhost:${port}`);
