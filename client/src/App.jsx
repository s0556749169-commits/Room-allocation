import RoomList from './RoomList'; // ייבוא הרכיב
import { useEffect, useState } from 'react';
function App() {
  return (
    <div style={{ textAlign: 'center', marginTop: '50px', fontFamily: 'Arial' }}>
      <h1>פרויקט שיבוץ חדרים</h1>
      <p>המערכת הוקמה בהצלחה - דף נקי להתחלת עבודה.</p>
      <hr />
      <RoomList /> {/* הצגת הרשימה כאן */}
    </div>
  );
}


function TestConnection() {
  const [data, setData] = useState(null);

  useEffect(() => {
    // החליפי את הכתובת בכתובת השרת המקומי שלך (למשל http://localhost:5000)
    fetch('http://localhost:5000/api/test')
      .then(response => response.json())
      .then(json => setData(json))
      .catch(err => console.error("Error fetching data:", err));
  }, []);

  return (
    <div>
      <h2>בדיקת חיבור לשרת:</h2>
      {data ? <p>{data.message}</p> : <p>טוען נתונים...</p>}
    </div>
  );
}
export default App;