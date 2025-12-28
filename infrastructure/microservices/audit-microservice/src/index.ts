import dotenv from 'dotenv';
import app from './app';

dotenv.config({ quiet: true });

const PORT = process.env.PORT || 3004;

app.listen(PORT, () => {
  console.log(`\x1b[32m[Audit Service]\x1b[0m Running on port ${PORT}`);
  console.log(`\x1b[32m[Audit Service]\x1b[0m CORS Origin: ${process.env.CORS_ORIGIN || "http://localhost:4000"}`);
});