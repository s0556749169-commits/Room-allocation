import RoomList from './RoomList';
import { useEffect, useState } from 'react';
import Navbar from './Navbar';

function App() {
  return (
    <div style={{ direction: 'rtl', fontFamily: 'Arial' }}>

      {/* סרגל ניווט */}
      <Navbar />

      {/* תוכן הדף */}
      <main style={{ textAlign: 'center', marginTop: '40px' }}>
        <h1>פרויקט שיבוץ חדרים</h1>
        <p>המערכת הוקמה בהצלחה - דף נקי להתחלת עבודה.</p>

        <hr style={{ margin: '30px 0' }} />

        <RoomList />
      </main>

    </div>
  );
}

// קומפוננטת בדיקה (לא חובה להציג כרגע)
function TestConnection() {
  const [data, setData] = useState(null);

  useEffect(() => {
    fetch('http://localhost:5000/api/test')
      .then(response => response.json())
      .then(json => setData(json))
      .catch(err => console.error("Error fetching data:", err));
  }, []);

  return (
    <div style={{ marginTop: '30px' }}>
      <h2>בדיקת חיבור לשרת:</h2>
      {data ? <p>{data.message}</p> : <p>טוען נתונים...</p>}
    </div>
  );
}

export default App;