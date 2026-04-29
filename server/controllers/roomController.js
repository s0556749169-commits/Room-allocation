const Room = require('../models/Room');

// פונקציה לחיפוש חדרים פנויים לפי פרמטרים
exports.searchAvailableRooms = async (req, res) => {
    try {
        // משיכת הנתונים שהמשתמש שלח בכתובת ה-URL
        const { wing, floor, size, hasProjector, date } = req.query;

        // 1. הגדרת מסנן התחלתי לפי התכונות הפיזיות של החדר
        let query = {};
        if (wing) query.wing = wing;
        if (floor) query.floor = Number(floor);
        if (size) query.size = { $gte: Number(size) }; // חפש חדר בגודל הזה או גדול יותר
        if (hasProjector) query.hasProjector = hasProjector === 'true';

        // 2. שליפת החדרים ממסד הנתונים, כולל "משיכה" של פרטי הביטולים
        let rooms = await Room.find(query).populate('cancellations');

        // 3. סינון מתקדם לפי תאריך (אם המשתמש הזין תאריך חיפוש)
        if (date) {
            // מאפסים את השעות כדי להשוות רק תאריך (יום, חודש, שנה)
            const searchDate = new Date(date).setHours(0, 0, 0, 0);

            rooms = rooms.filter(room => {
                // בודקים אם קיים ביטול בחדר הזה באותו תאריך
                const hasCancellation = room.cancellations.some(cancel => {
                    const cancelDate = new Date(cancel.date).setHours(0, 0, 0, 0);
                    return cancelDate === searchDate;
                });

                // משאירים רק את החדרים ש*אין* להם ביטול (כלומר, הם פנויים)
                return !hasCancellation;
            });
        }

        // 4. החזרת תשובה מוצלחת ללקוח
        res.status(200).json({
            success: true,
            count: rooms.length,
            data: rooms
        });

    } catch (error) {
        // טיפול בשגיאות במקרה של קריסה
        console.error("Error in searchAvailableRooms:", error);
        res.status(500).json({
            success: false,
            message: 'שגיאה בחיפוש חדרים פנויים',
            error: error.message
        });
    }
};