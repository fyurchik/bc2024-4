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

