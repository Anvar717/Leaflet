const express = require("express");
const fs = require("fs");
const path = require("path");
const axios = require("axios");

const app = express();
const port = 3000;

const tileDir = path.join(__dirname, "tiles");
const opentoMaptileDir = path.join(__dirname, "opentomap");
const cartotileDir = path.join(__dirname, "carto");

const getTilePath = (z, x, y) => path.join(tileDir, z.toString(), x.toString(), `${y}.png`);
const getTilePathOpenToMap = (z, x, y) => path.join(opentoMaptileDir, z.toString(), x.toString(), `${y}.png`);
const getTilePathcarto = (z, x, y) => path.join(cartotileDir, z.toString(), x.toString(), `${y}.png`);

const downloadTile = async (url, tilePath) => {
  fs.mkdirSync(path.dirname(tilePath), { recursive: true });
  try {
    const response = await axios.get(url, { responseType: "arraybuffer" });
    fs.writeFileSync(tilePath, response.data);
    console.log(`Downloaded tile: ${tilePath}`);
    return tilePath;  
  } catch (error) {
    console.error(`Failed to download tile: ${tilePath}`, error.message);
    throw new Error(`Could not download tile from ${url}`);
  }
};

app.get("/tiles/:z/:x/:y.png", async (req, res) => {
  const { z, x, y } = req.params;
  const tilePath = getTilePath(z, x, y);
  const url = `https://a.tile.openstreetmap.org/${z}/${x}/${y}.png`;

  if (fs.existsSync(tilePath)) {
    return res.sendFile(tilePath);
  } else {
    try {
      await downloadTile(url, tilePath);
      return res.sendFile(tilePath);
    } catch (error) {
      return res.status(404).send("Tile not found and failed to download");
    }
  }
});

app.get("/opentopomaptiles/:z/:x/:y.png", async (req, res) => {
  const { z, x, y } = req.params;
  const tilePath = getTilePathOpenToMap(z, x, y);
  const url = `https://a.tile.opentopomap.org/${z}/${x}/${y}.png`;

  if (fs.existsSync(tilePath)) {
    return res.sendFile(tilePath);
  } else {
    try {
      await downloadTile(url, tilePath);
      return res.sendFile(tilePath);
    } catch (error) {
      return res.status(404).send("Tile not found and failed to download");
    }
  }
});

app.get("/cartotile/:z/:x/:y.png", async (req, res) => {
  const { z, x, y } = req.params;
  const tilePath = getTilePathcarto(z, x, y);
  const url = `https://a.basemaps.cartocdn.com/light_all/${z}/${x}/${y}.png`;

  if (fs.existsSync(tilePath)) {
    return res.sendFile(tilePath);
  } else {
    try {
      await downloadTile(url, tilePath);
      return res.sendFile(tilePath);
    } catch (error) {
      return res.status(404).send("Tile not found and failed to download");
    }
  }
});

// Start the server
app.listen(port, () => {
  console.log(`Server running at http://localhost:${port}`);
});
