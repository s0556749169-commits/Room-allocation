// const express = require('express');
// const app = express();
// const PORT = 3000;

// app.get('/', (req, res) => {
//   res.send('Server for Seminar Room Placement is up and running!');
// });

// app.listen(PORT, () => {
//   console.log(`Server is running on http://localhost:${PORT}`);
// });
// // דוגמה לנתיב בשרת
// app.get('/api/test', (req, res) => {
//   res.json({ message: "החיבור מקצה לקצה עובד בהצלחה!", status: "success" });
// });




const express = require('express');
const mongoose = require('mongoose'); // הוספנו את החיבור למסד הנתונים
const app = express();
const PORT = 3000;

// מאפשר לשרת לקרוא מידע בפורמט JSON (חשוב מאוד להוספת נתונים!)
app.use(express.json());

// 1. חיבור למסד הנתונים (MongoDB)
// כאן צריך להופיע הקישור שקיבלתן מהמדריכה/תמר. דוגמה:
const mongoURI = 'mongodb+srv://Yehudit-Arieli:1700707050@seminarrooms.spiiw1i.mongodb.net/?appName=seminarRooms'; 
mongoose.connect(mongoURI)
  .then(() => console.log('Connected to MongoDB successfully!'))
  .catch(err => console.error('MongoDB connection error:', err));

// 2. ייבוא הנתיבים של הביטולים שיצרת
const cancellationRoutes = require('./routes/cancellationRoutes');
app.use('/api/cancellations', cancellationRoutes);

app.get('/', (req, res) => {
  res.send('Server for Seminar Room Placement is up and running!');
});

// נתיב הבדיקה שלך
app.get('/api/test', (req, res) => {
  res.json({ message: "החיבור מקצה לקצה עובד בהצלחה!", status: "success" });
});

app.listen(PORT, () => {
  console.log(`Server is running on http://localhost:${PORT}`);
});