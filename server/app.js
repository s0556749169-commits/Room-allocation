const express = require('express');
const app = express();
const PORT = 3000;

app.get('/', (req, res) => {
  res.send('Server for Seminar Room Placement is up and running!');
});

app.listen(PORT, () => {
  console.log(`Server is running on http://localhost:${PORT}`);
});
// דוגמה לנתיב בשרת
app.get('/api/test', (req, res) => {
  res.json({ message: "החיבור מקצה לקצה עובד בהצלחה!", status: "success" });
});