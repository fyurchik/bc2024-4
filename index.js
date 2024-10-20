const fs = require("fs").promises;
const http = require("http");
const { Command } = require("commander");
const path = require("path");
const superagent = require("superagent");

const program = new Command();

program
  .requiredOption("-h, --host <host>", "адреса сервера")
  .requiredOption("-p, --port <port>", "порт сервера")
  .requiredOption(
    "-c, --cache <path>",
    "шлях до директорії, яка міститиме закешовані файли"
  );

program.parse(process.argv);

const { host, port, cache } = program.opts();

function getCacheFilePath(code) {
  return path.join(cache, `${code}.jpg`);
}

const fetchFromHttpCat = async (httpCode) => {
  try {
    const response = await superagent.get(`https://http.cat/${httpCode}`);
    return response.body;
  } catch (err) {
    throw new Error("Картинка не знайдена на сервері http.cat");
  }
};

const server = http.createServer(async (req, res) => {
  const urlParts = req.url.split("/");
  const httpCode = urlParts[1];

  if (!httpCode) {
    res.writeHead(400, { "Content-Type": "text/plain" });
    res.end("Невірний запит");
    return;
  }

  const cacheFilePath = getCacheFilePath(httpCode);

  switch (req.method) {
    case "GET": {
      try {
        const imageData = await fs.readFile(cacheFilePath);
        res.writeHead(200, { "Content-Type": "image/jpeg" });
        console.log("взято з кешу");
        res.end(imageData);
      } catch (err) {
        try {
          const httpCatImage = await fetchFromHttpCat(httpCode);
          console.log("взято з сайту");
          await fs.writeFile(cacheFilePath, httpCatImage);
          res.writeHead(200, { "Content-Type": "image/jpeg" });
          res.end(httpCatImage);
        } catch (fetchError) {
          res.writeHead(404, { "Content-Type": "text/plain" });
          res.end("картинка не знайдена на http.cat");
        }
      }
      break;
    }

    case "PUT": {
      let imageData = [];

      req.on("data", (chunk) => {
        imageData.push(chunk);
      });
      req.on("end", async () => {
        imageData = Buffer.concat(imageData);
        try {
          await fs.writeFile(cacheFilePath, imageData);
          res.writeHead(201, { "Content-Type": "text/plain" });
          res.end("Картинка збережена");
        } catch (err) {
          res.writeHead(500, { "Content-Type": "text/plain" });
          res.end("Помилка при записі файлу");
        }
      });
      break;
    }

