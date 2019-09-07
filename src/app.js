'use strict';

const express = require('express');
const app = express();

const bodyParser = require('body-parser');
const jsonParser = bodyParser.json();

app.use(express.urlencoded({ extended: false }))

module.exports = (db) => {
    db.getAsync = (query) => {
        return new Promise((resolve, reject) => {
            db.all(query, (err, rows) => {
                if (err) {
                    reject(err)
                }
                else {
                    resolve(rows)
                }
            })
        })
    }

    db.postAsync = function (query, value) {
        return new Promise((resolve, reject) => {
            db.run(query, value, function (err) {
                if (err) {
                    reject(err)
                }
                else {
                    db.all('SELECT * FROM Rides WHERE rideID = ?', this.lastID, function (err, rows) {
                        if (err) {
                            reject(err)
                        }
                        else {
                            resolve(rows)
                        }
                    })
                }
            })
        })
    }

    app.get('/health', (req, res) => res.send('Healthy'));

    app.post('/rides', jsonParser, async (req, res) => {
        const startLatitude = Number(req.body.start_lat);
        const startLongitude = Number(req.body.start_long);
        const endLatitude = Number(req.body.end_lat);
        const endLongitude = Number(req.body.end_long);
        const riderName = req.body.rider_name;
        const driverName = req.body.driver_name;
        const driverVehicle = req.body.driver_vehicle;

        try {
            if (startLatitude < -90 || startLatitude > 90 || startLongitude < -180 || startLongitude > 180) {
                return res.send({
                    error_code: 'VALIDATION_ERROR',
                    message: 'Start latitude and longitude must be between -90 - 90 and -180 to 180 degrees respectively'
                });
            }

            if (endLatitude < -90 || endLatitude > 90 || endLongitude < -180 || endLongitude > 180) {
                return res.send({
                    error_code: 'VALIDATION_ERROR',
                    message: 'End latitude and longitude must be between -90 - 90 and -180 to 180 degrees respectively'
                });
            }

            if (typeof riderName !== 'string' || riderName.length < 1) {
                return res.send({
                    error_code: 'VALIDATION_ERROR',
                    message: 'Rider name must be a non empty string'
                });
            }

            if (typeof driverName !== 'string' || driverName.length < 1) {
                return res.send({
                    error_code: 'VALIDATION_ERROR',
                    message: 'Rider name must be a non empty string'
                });
            }

            if (typeof driverVehicle !== 'string' || driverVehicle.length < 1) {
                return res.send({
                    error_code: 'VALIDATION_ERROR',
                    message: 'Rider name must be a non empty string'
                });
            }

            var values = [req.body.start_lat, req.body.start_long, req.body.end_lat, req.body.end_long, req.body.rider_name, req.body.driver_name, req.body.driver_vehicle];

            const result = await db.postAsync('INSERT INTO Rides(startLat, startLong, endLat, endLong, riderName, driverName, driverVehicle) VALUES (?, ?, ?, ?, ?, ?, ?)', values)
            res.send(result)

        } catch (error) {
            return res.send({
                error_code: 'SERVER_ERROR',
                message: 'Unknown error'
            });
        }
    });

    app.get('/rides', async (req, res) => {
        try {
            const result = await db.getAsync('SELECT * FROM Rides')
            if (result.length === 0) {
                res.send({
                    error_code: 'RIDES_NOT_FOUND_ERROR',
                    message: 'Could not find any rides'
                });
            } else {
                // add pagination
                const maxRides = 5
                const page = req.query.page || 1
                if (result.length < maxRides) {
                    res.send(result)
                } else {
                    res.send(result.slice(page * maxRides - maxRides, maxRides * page))
                }
            }
        } catch (error) {
            return res.send({
                error_code: 'SERVER_ERROR',
                message: 'Unknown error'
            });
        }
    });

    app.get('/rides/:id', async (req, res) => {
        try {
            const result = db.getAsync(`SELECT * FROM Rides WHERE rideID='${req.params.id}'`)
            if(result.length === 0) {
                return res.send({
                    error_code: 'RIDES_NOT_FOUND_ERROR',
                    message: 'Could not find any rides'
                });
            }
            res.send(result)
        } catch (error) {
            return res.send({
                error_code: 'SERVER_ERROR',
                message: 'Unknown error'
            });
        }
    });
    return app;
};
