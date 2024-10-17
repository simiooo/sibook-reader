import favicons from "favicons";
import fs from "fs/promises";
import path from "path";

const src = "./squirrelsoLogo.png"; // Icon source file path.
const dest = "./public/icon"; // Output directory path.
const htmlBasename = "index.html"; // HTML file basename.

// Configuration (see above in the README file).
const configuration = {
  path: "/icon",
  appName: "Squirrel Reader",
  appShortName: "S Reader",
  appDescription: "A pdf Reader With AI in cloud",
  // Extra options...
};

// Below is the processing.
const response = await favicons(src, configuration);
await fs.mkdir(dest, { recursive: true });
await Promise.all(
  response.images.map(
    async (image) =>
      await fs.writeFile(path.join(dest, image.name), image.contents),
  ),
);
await Promise.all(
  response.files.map(
    async (file) =>
      await fs.writeFile(path.join(dest, file.name), file.contents),
  ),
);
await fs.writeFile(path.join(dest, htmlBasename), response.html.join("\n"));