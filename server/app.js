const express = require('express');
const mongoose = require('mongoose');

const cors = require('cors'); 
const app = express();
const PORT = 3000;

// Middleware - מאפשר לשרת לקבל נתונים ולעבוד מול דפדפנים
app.use(cors());
app.use(express.json());

// החיבור למסד הנתונים של יהודית באטלס
// שימי לב: החליפי את <password> בסיסמה שהגדרת הרגע ב-Atlas
const mongoURI = 'mongodb://Yehudit-Arieli:j1hbJBHCX1gWolLa@ac-spiiwli-shard-00-00.spiiwli.mongodb.net:27017,ac-spiiwli-shard-00-01.spiiwli.mongodb.net:27017,ac-spiiwli-shard-00-02.spiiwli.mongodb.net:27017/?ssl=true&replicaSet=atlas-spiiwli-shard-0&authSource=admin&retryWrites=true&w=majority&appName=seminarRooms';
mongoose.connect(mongoURI)
  .then(() => console.log('✅ Connected to MongoDB Atlas Successfully!'))
  .catch(err => console.error('❌ MongoDB Connection Error:', err));

// חיבור הראוטים שכבר יצרת
app.use('/api/rooms', require('./routes/roomRoutes'));

// נתיב ברירת מחדל לבדיקה שהשרת למעלה
app.get('/', (req, res) => {
  res.send('Server for Seminar Room Placement is up and running!');
});

app.listen(PORT, () => {
  console.log(`🚀 Server is running on http://localhost:${PORT}`);
});