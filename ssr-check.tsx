import { renderToString } from "react-dom/server";
import Landing from "./src/pages/Landing";

try {
  const html = renderToString(<Landing />);
  console.log("RENDER_OK htmlLength=" + html.length);
  const sample = html.replace(/\s+/g, " ").slice(0, 200);
  console.log("SAMPLE: " + sample);
} catch (err) {
  console.error("RENDER_FAILED");
  console.error(err instanceof Error ? err.stack : String(err));
  process.exit(1);
}
