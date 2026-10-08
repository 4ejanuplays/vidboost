const express = require("express");
const multer = require("multer");
const path = require("path");
const fs = require("fs");
const { execFile } = require("child_process");

const app = express();
const PORT = process.env.PORT || 3000;

const uploadsDir = path.join(__dirname, "uploads");
const outputsDir = path.join(__dirname, "outputs");

fs.mkdirSync(uploadsDir, { recursive: true });
fs.mkdirSync(outputsDir, { recursive: true });

const upload = multer({ dest: uploadsDir });

app.use(express.static(path.join(__dirname, "public")));

app.post("/process", upload.single("video"), (req, res) => {
  if (!req.file) {
    return res.status(400).json({ error: "No video uploaded" });
  }

  const input = req.file.path;
  const output = path.join(outputsDir, `${Date.now()}.mp4`);

  execFile(
    "ffmpeg",
    [
      "-y",
      "-i", input,
      "-vf", "minterpolate=fps=60:mi_mode=mci:mc_mode=aobmc:me_mode=bidir:vsbmc=1",
      "-c:v", "libx264",
      "-preset", "veryfast",
      "-crf", "20",
      "-c:a", "aac",
      "-b:a", "192k",
      "-movflags", "+faststart",
      output
    ],
    (error) => {
      fs.unlink(input, () => {});

      if (error) {
        console.error(error);
        return res.status(500).json({ error: "Video processing failed" });
      }

      res.download(output, "vidboost-enhanced.mp4", () => {
        fs.unlink(output, () => {});
      });
    }
  );
});

app.get("/health", (req, res) => {
  res.json({ status: "VidBoost server is running" });
});

app.listen(PORT, () => {
  console.log(`VidBoost running on port ${PORT}`);
});
