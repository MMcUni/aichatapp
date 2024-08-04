import express from 'express';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import { log, error, warn, info } from './src/utils/logger.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const app = express();

app.use(express.static(join(__dirname, 'dist')));

app.get('*', (req, res) => {
  res.sendFile(join(__dirname, 'dist', 'index.html'));
});

const port = process.env.PORT || 3000;
app.listen(port, () => {
  log(`Server is running on port ${port}`);
});