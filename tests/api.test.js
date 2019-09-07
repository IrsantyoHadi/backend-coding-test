'use strict';

const request = require('supertest');

const sqlite3 = require('sqlite3').verbose();
const db = new sqlite3.Database(':memory:');

const app = require('../src/app')(db);
const buildSchemas = require('../src/schemas');

const chai = require("chai");
const chaiExpect = chai.expect;

describe('API tests', () => {
    before((done) => {
        db.serialize((err) => {
            if (err) {
                return done(err);
            }

            buildSchemas(db);

            done();
        });
    });

    describe('GET /health', () => {
        it('should return health', (done) => {
            request(app)
                .get('/health')
                .expect('Content-Type', /text/)
                .expect(200, done);
        });
    });

    describe("GET /rides before post", () => {
        it("should return an error message when no rides are found", (done) => {
            request(app)
                .get("/rides")
                .expect(500, done)
        })
    })

    describe("POST /rides", () => {
        var data = {
            "start_lat": 88,
            "start_long": 88,
            "end_lat": 88,
            "end_long": 88,
            "rider_name": "Selow",
            "driver_name": "Daps",
            "driver_vehicle": "Interfet"
        }
        it("should post a new ride if data correct", () => {
            request(app)
                .post("/rides")
                .send(data)
                .expect(201)
                .then(response => {
                    // console.log(response, 'ini responsenya');
                    var newRide = response.body[0];
                    chaiExpect(newRide).to.be.an("object");
                    chaiExpect(newRide).to.have.property("rideID");
                    chaiExpect(newRide).to.have.property("startLat");
                    chaiExpect(newRide).to.have.property("startLong");
                    chaiExpect(newRide).to.have.property("endLat");
                    chaiExpect(newRide).to.have.property("endLong");
                    chaiExpect(newRide).to.have.property("riderName");
                    chaiExpect(newRide).to.have.property("driverName");
                    chaiExpect(newRide).to.have.property("driverVehicle");
                    chaiExpect(newRide).to.have.property("created");
                })
                .catch(err => {
                    console.log(err);
                })
        })
        var wrongData1 = {
            "start_lat": 1000,
            "start_long": 1000,
            "end_lat": 1000,
            "end_long": 1000,
            "rider_name": "Selow",
            "driver_name": "Daps",
            "driver_vehicle": "Interfet"
        }
        it("should return validation error message when lat and long invalid (must be between -90 - 90 and -180 to 180 degrees)", () => {
            request(app)
                .post("/rides")
                .send(wrongData1)
                .expect(404)
                .then(response => {
                    var error = response.body
                    chaiExpect(error).to.be.an("object");
                    chaiExpect(error).to.have.property("error_code");
                    chaiExpect(error.error_code).to.be.a("string", "VALIDATION_ERROR")
                })
                .catch(err => {
                    console.log(err);
                })
        })
        var wrongData2 = {
            "start_lat": 88,
            "start_long": 88,
            "end_lat": 88,
            "end_long": 88,
            "rider_name": "",
            "driver_name": 123123,
            "driver_vehicle": ""
        }
        it("should return validation error message when rider OR driver OR vehicle invalid (name must be a non empty string)", () => {
            request(app)
                .post("/rides")
                .send(wrongData2)
                .expect(404)
                .then(response => {
                    var error2 = response.body
                    chaiExpect(error2).to.be.an("object");
                    chaiExpect(error2).to.have.property("error_code");
                    chaiExpect(error2.error_code).to.be.a("string", "VALIDATION_ERROR")
                })
                .catch(err => {
                    console.log(err);
                })
        })
    })

    describe("GET /rides", () => {
        it("should get data rides from the database", (done) => {
            request(app)
                .get("/rides")
                .expect(200, done)
        })
    })

    describe("GET /rides/:id", () => {
        it("should get one ride match the id", (done) => {
            request(app)
                .get("/rides/1")
                .expect(200, done)
        })
        it("should return an error message when the id is not found", (done) => {
            request(app)
                .get("/rides/100")
                .expect(400, done)
        })
    })

});