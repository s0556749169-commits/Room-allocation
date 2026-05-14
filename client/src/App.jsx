import React from 'react';
import { useEffect, useState } from 'react';
import Navbar from './Navbar';
import RoomList from './RoomList';
import AddAssignment from './components/AddAssignment';
function App() {
  // שימי לב: לצורך הבדיקה כרגע אנחנו משתמשים ב-ID הקבוע שיצרת ב-Seed
  // בהמשך, כשנלחץ על חדר ברשימה, ה-ID הזה ישתנה דינמית
  const testRoomId = "69f1e451a5d49d9f00099602"; 

  return (
    <div style={{ direction: 'rtl', fontFamily: 'Arial' }}>

      {/* סרגל ניווט */}
      <Navbar />

      {/* תוכן הדף */}
      <main style={{ textAlign: 'center', marginTop: '40px' }}>
        <h1>פרויקט שיבוץ חדרים</h1>
        <p>המערכת הוקמה בהצלחה - דף נקי להתחלת עבודה.</p>

        <hr style={{ margin: '30px 0' }} />

        {/* שלב 3: הצגת טופס השיבוץ שבנית */}
        <div style={{ maxWidth: '500px', margin: '0 auto', backgroundColor: '#f9f9f9', padding: '10px', borderRadius: '10px' }}>
          <AddAssignment roomId={testRoomId} />
        </div>

        <hr style={{ margin: '30px 0' }} />

        {/* רשימת החדרים (המשימה של בת 1/2) */}
        <RoomList />
        
        {/* בדיקת חיבור לשרת (אופציונלי) */}
        <TestConnection />
      </main>

    </div>
  );
}

// קומפוננטת בדיקה לוודא שה-Backend מגיב
function TestConnection() {
  const [data, setData] = useState(null);

  useEffect(() => {
    // שיניתי ל-api/status כי זה מה שכתבנו ב-Room.js
    fetch('http://localhost:5000/api/status')
      .then(response => response.json())
      .then(json => setData(json))
      .catch(err => console.error("Error fetching data:", err));
  }, []);

  return (
    <div style={{ marginTop: '30px', color: '#666' }}>
      <h4>סטטוס חיבור לשרת:</h4>
      {data ? <p style={{ color: 'green' }}>✅ {data.message}</p> : <p>טוען נתונים...</p>}
    </div>
  );
}

export default App;