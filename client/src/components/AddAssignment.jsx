import React, { useState } from 'react';
import axios from 'axios';

const AddAssignment = ({ roomId }) => {
    const [formData, setFormData] = useState({
        type: 'permanent',
        dayOfWeek: 0,
        startTime: '',
        endTime: '',
        notes: ''
    });
    const [message, setMessage] = useState('');

    const handleSubmit = async (e) => {
        e.preventDefault();
        try {
            const response = await axios.post(`http://localhost:5000/api/rooms/${roomId}/assignments`, formData);
            setMessage("✅ השיבוץ נוסף בהצלחה!");
            console.log(response.data);
        } catch (error) {
            // כאן נכנסת הלוגיקה של ההתנגשות מהשרת!
            const errorMsg = error.response?.data?.message || "שגיאה בשיבוץ";
            setMessage(`❌ שגיאה: ${errorMsg}`);
        }
    };

    return (
        <div style={{ border: '1px solid #ccc', padding: '20px', borderRadius: '8px' }}>
            <h3>הוספת שיבוץ קבוע</h3>
            <form onSubmit={handleSubmit}>
                <label>יום בשבוע: </label>
                <select onChange={(e) => setFormData({...formData, dayOfWeek: parseInt(e.target.value)})}>
                    <option value="0">ראשון</option>
                    <option value="1">שני</option>
                    <option value="2">שלישי</option>
                    <option value="3">רביעי</option>
                    <option value="4">חמישי</option>
                </select>
                <br /><br />
                
                <label>שעת התחלה: </label>
                <input type="time" required onChange={(e) => setFormData({...formData, startTime: e.target.value})} />
                <br /><br />

                <label>שעת סיום: </label>
                <input type="time" required onChange={(e) => setFormData({...formData, endTime: e.target.value})} />
                <br /><br />

                <button type="submit">שמור שיבוץ</button>
            </form>
            {message && <p>{message}</p>}
        </div>
    );
};

export default AddAssignment;