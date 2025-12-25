import app from './app';

const PORT = process.env.PORT || 3005;

app.listen(PORT, () => {
  console.log(`\x1b[32m[Production Service]\x1b[0m Running on port ${PORT}`);
});