import app from './app.js';

const PORT = Number(process.env.SERVER_PORT) || 3000;

app.listen(PORT, () => {
  // eslint-disable-next-line no-console
  console.log(`Campus Rental API listening on port ${PORT}`);
});