let requestCounts = new Map(); // Temporary in-memory request tracking

const ipBanMiddleware = (req, res, next) => {
    const ip = req.ip;

    console.log(`[IP Ban Middleware] Incoming request from IP: ${ip}`);

    // Check if IP exists in the database
    req.app.locals.db.query('SELECT * FROM visitors WHERE ip_address = ?', [ip], (err, results) => {
        if (err) {
            console.error("[IP Ban Middleware] Database query error:", err);
            return res.status(500).send('Internal Server Error');
        }

        if (results.length === 0) {
            // If IP is not in the database, insert it with 'unbanned' status
            req.app.locals.db.query(
                'INSERT INTO visitors (ip_address, status) VALUES (?, ?)',
                [ip, 'unbanned'],
                (insertErr) => {
                    if (insertErr) {
                        console.error("[IP Ban Middleware] Error inserting new IP:", insertErr);
                        return res.status(500).send('Internal Server Error');
                    }
                    console.log(`[IP Ban Middleware] New IP added: ${ip}`);
                }
            );
        } else if (results[0].status === 'banned') {
            // If IP is banned, block the request
            console.log(`[IP Ban Middleware] IP ${ip} is banned.`);
            return res.status(403).send('Your IP has been banned. Contact support for assistance.');
        }

        // Track request counts in memory
        if (!requestCounts.has(ip)) {
            requestCounts.set(ip, { count: 1, timestamp: Date.now() });
        } else {
            const data = requestCounts.get(ip);
            if (Date.now() - data.timestamp < 10 * 1000) { // Within 10 seconds
                data.count += 1;

                console.log(`[IP Ban Middleware] IP ${ip} request count: ${data.count}`);

                if (data.count > 5) {
                    // Ban this IP in the database
                    console.log(`[IP Ban Middleware] Banning IP: ${ip}`);
                    req.app.locals.db.query(
                        'UPDATE visitors SET status = ? WHERE ip_address = ?',
                        ['banned', ip],
                        (updateErr) => {
                            if (updateErr) {
                                console.error("[IP Ban Middleware] Error banning IP:", updateErr);
                            } else {
                                console.log(`[IP Ban Middleware] Successfully banned IP: ${ip}`);
                            }
                        }
                    );
                    requestCounts.delete(ip); // Remove from memory
                    return res.status(403).send('Your IP has been banned due to excessive requests.');
                }
            } else {
                // Reset counter after 10 seconds
                data.count = 1;
                data.timestamp = Date.now();
            }
        }
        next();
    });
};

module.exports = ipBanMiddleware;
