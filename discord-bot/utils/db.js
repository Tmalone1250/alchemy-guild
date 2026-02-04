const fs = require('fs');
const path = require('path');

const DB_PATH = path.join(__dirname, '../users.json');

// Initialize DB if not exists
if (!fs.existsSync(DB_PATH)) {
    fs.writeFileSync(DB_PATH, JSON.stringify({}));
}

const db = {
    getAll: () => {
        try {
            return JSON.parse(fs.readFileSync(DB_PATH, 'utf8'));
        } catch (e) {
            console.error("DB Read Error:", e);
            return {};
        }
    },

    get: (userId) => {
        const data = db.getAll();
        return data[userId];
    },

    set: (userId, walletAddress) => {
        const data = db.getAll();
        data[userId] = walletAddress;
        fs.writeFileSync(DB_PATH, JSON.stringify(data, null, 2));
    },

    delete: (userId) => {
        const data = db.getAll();
        delete data[userId];
        fs.writeFileSync(DB_PATH, JSON.stringify(data, null, 2));
    }
};

module.exports = db;
