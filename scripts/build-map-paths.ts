/** Serializes the shared map geometry to public/map-paths.json for the
 *  Data Lab's client-side Map mode. Runs in prebuild; markers cover every
 *  mapped economy so any dataset's small countries stay hoverable. */
import { writeFileSync } from "node:fs";
import { join } from "node:path";
import { buildGeometry } from "../src/lib/map-geometry";

const geo = buildGeometry(() => true);
const out = join(import.meta.dirname, "..", "public", "map-paths.json");
const body = JSON.stringify(geo);
writeFileSync(out, body);
console.log(
  `build-map-paths: ${geo.features.length} features, ${geo.markers.length} markers, ${(Buffer.byteLength(body) / 1024).toFixed(0)}KB`,
);
