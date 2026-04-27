import React, { useState, useEffect } from 'react';

function RoomList() {
  const [rooms, setRooms] = useState([]);

  useEffect(() => {
    // שליפת הנתונים מה-API שיצרת
    fetch('/api/rooms')
      .then(res => res.json())
      .then(data => setRooms(data))
      .catch(err => console.error("Error:", err));
  }, []);

  return (
    <div>
      <h2>רשימת חדרים קיימים:</h2>
      {rooms.length === 0 ? <p>טוען נתונים או שאין חדרים...</p> : (
        <ul>
          {rooms.map(room => (
            <li key={room._id}>
              אגף: {room.wing}, קומה: {room.floor}, גודל: {room.size}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

export default RoomList;