import RoomList from './RoomList'; // ייבוא הרכיב

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

export default App;