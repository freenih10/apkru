const express = require("express");
const cheerio = require("cheerio");
const axios = require("axios");

const app = express();
app.get("/", (req, res) => res.json({ message: "Hello World!" }));
app.get("/apkru", async (req, res) => {
  try {
    const response = await axios.get("https://androeed.store/");
    const $ = cheerio.load(response.data);
    const items = $(".apps_list .item").toArray();
    const scrapedData = [];

    for (let element of items) {
      const dopy = $(element).find(".dopy");
      const size = dopy.find(".size").text();
      const versionText = dopy.find(".version").text();
      const versionMatch = versionText.match(/Version: ([\d.]+)/);
      const version = versionMatch ? versionMatch[1] : null;

      const date = dopy.find(".date").text();
      const title = $(element).find(".title").text();
      const hrefAttr = $(element).parent().attr("href");
      const url = hrefAttr ? `https://androeed.store${hrefAttr}` : null;

      if (url) {
        // Melakukan request ke halaman detail
        const getDownload = await axios.get(url);
        const $$ = cheerio.load(getDownload.data);

        // Mengambil informasi download
        const downloads = [];
        $$(".download_div a").each((j, link) => {
          const downloadTitle = $$(link).find(".title").text();
          const downloadSize = $$(link).find(".size").text();
          const downloadHref = "https://androeed.store" + $$(link).attr("href");
          // Memeriksa apakah judul download mengandung versi yang sama
          if (downloadTitle.includes(version) && downloadSize && downloadHref) {
            downloads.push({
              title: downloadTitle,
              size: downloadSize,
              href: downloadHref,
            });
          }
        });

        // Hanya menambahkan data jika semua nilai ada
        if (size && version && date) {
          scrapedData.push({
            title,
            size,
            version: versionText, // Menyimpan teks versi lengkap
            date,
            url,
            download: downloads,
          });
        }
      }
    }

    res.json(scrapedData);
  } catch (error) {
    console.error(error);
    res.status(500).json({
      message: "Terjadi kesalahan saat scraping",
      error: error.message,
    });
  }
});

// const PORT = 3000;
// app.listen(PORT, () => {
//   console.log(`Server berjalan di port ${PORT}`);
// });

module.exports = app;
