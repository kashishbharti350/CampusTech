import fs from "node:fs";

const dir = "src/lib/";
const read = (f) => fs.readFileSync(dir + f, "utf8");
const write = (f, t) => fs.writeFileSync(dir + f, t);
const DECL = /^(async\s+function|function|const|class)\s+([A-Za-z_$][\w$]*)/gm;

function addExports(text) {
  const names = [];
  const out = text.replace(DECL, (m, kw, name) => { names.push(name); return "export " + kw + " " + name; });
  return { out, names };
}

const events = addExports(read("events.js"));
write("events.js", events.out);
const storage = addExports(read("storage.js"));
write("storage.js", storage.out);

const feat = addExports(read("features.js"));
const used = events.names.filter((n) => new RegExp("\\b" + n + "\\b").test(feat.out));
write("features.js", "import { " + used.join(", ") + ' } from "./events.js";\n' + feat.out);

console.log("events.js   exports:", events.names.length);
console.log("storage.js  exports:", storage.names.length);
console.log("features.js exports:", feat.names.length, "| imports from events.js:", used.join(", "));