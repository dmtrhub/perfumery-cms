import app from './app';

const port = process.env.PORT || 6503;

app.listen(port, () => {
  console.log(`\x1b[32m[Processing Service]\x1b[0m Running on port ${port}`);
  console.log(`\x1b[36m[Processing Service]\x1b[0m Ready to process plants into perfumes`);
  console.log(`\x1b[33m[Processing Service]\x1b[0m API available at http://localhost:${port}/api/v1`);
});