const pool = require('../db');

// Add School API
exports.addSchool = async (req, res) => {
    try {
        const { name, address, latitude, longitude } = req.body;

        // Validation
        if (!name || !address || !latitude || !longitude) {
            return res.status(400).json({ message: 'All fields are required' });
        }

        const sql = 'INSERT INTO schools (name, address, latitude, longitude) VALUES (?, ?, ?, ?)';
        await pool.query(sql, [name, address, latitude, longitude]);

        res.status(201).json({ message: 'School added successfully' });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// List Schools API (sorted by proximity)
exports.listSchools = async (req, res) => {
    try {
        const { latitude, longitude } = req.query;

        if (!latitude || !longitude) {
            return res.status(400).json({ message: 'Latitude and longitude are required' });
        }

        const [schools] = await pool.query('SELECT * FROM schools');

        // Haversine formula for calculating distance
        const calculateDistance = (lat1, lon1, lat2, lon2) => {
            const toRad = (angle) => (Math.PI * angle) / 180;
            const R = 6371; // Radius of Earth in km

            const dLat = toRad(lat2 - lat1);
            const dLon = toRad(lon2 - lon1);

            const a =
                Math.sin(dLat / 2) * Math.sin(dLat / 2) +
                Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) *
                Math.sin(dLon / 2) * Math.sin(dLon / 2);

            const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
            return R * c; // Distance in km
        };

        // Sort schools by proximity
        const sortedSchools = schools.map((school) => ({
            ...school,
            distance: calculateDistance(latitude, longitude, school.latitude, school.longitude)
        })).sort((a, b) => a.distance - b.distance);

        res.status(200).json(sortedSchools);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};
