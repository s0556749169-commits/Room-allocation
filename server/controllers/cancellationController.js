const Cancellation = require('../models/Cancellation');

// הוספת ביטול חד פעמי (Create)
exports.addCancellation = async (req, res) => {
    try {
        const newCancel = new Cancellation(req.body);
        await newCancel.save();
        res.status(201).json({ message: "הביטול נוסף בהצלחה", data: newCancel });
    } catch (err) {
        res.status(400).json({ error: err.message });
    }
};

// מחיקת ביטול חד פעמי (Delete)
exports.deleteCancellation = async (req, res) => {
    try {
        await Cancellation.findByIdAndDelete(req.params.id);
        res.json({ message: "הביטול נמחק בהצלחה" });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
};