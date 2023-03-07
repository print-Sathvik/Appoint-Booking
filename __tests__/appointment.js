const request = require("supertest");
var cheerio = require("cheerio");
const db = require("../models/index");
const { Appointment, Organizer, Guest } = require("../models");
const app = require("../app");

let server, agent;

function extractCsrfToken(res) {
  var $ = cheerio.load(res.text);
  return $("[name=_csrf]").val();
}

const login = async (agent, username, password) => {
  let res = await agent.get("/login");
  let csrfToken = extractCsrfToken(res);
  res = await agent.post("/guestSession").send({
    email: username,
    password: password,
    _csrf: csrfToken,
  });
};

describe("Appointment Booking Tests", function () {
  beforeAll(async () => {
    await db.sequelize.sync({ force: true });
    server = app.listen(3000, () => {});
    agent = request.agent(server);
  });

  afterAll(async () => {
    try {
      await db.sequelize.close();
      await server.close();
    } catch (error) {
      console.log(error);
    }
  });

  test("Organizer Sign up", async () => {
    let res = await agent.get("/organizer/signup");
    const csrfToken = extractCsrfToken(res);
    res = await agent.post("/organizer").send({
      firstName: "Organizer First Name",
      lastName: "Organizer Last Name",
      email: "testOrg@testmail.com",
      password: "testOrgpassword123",
      start: "08:00",
      end: "21:00",
      _csrf: csrfToken,
    });
    expect(res.statusCode).toBe(302);
  });

  test("Organizer Sign out", async () => {
    let response = await agent.get("/organizer/dashboard");
    expect(response.statusCode).toBe(200);
    response = await agent.get("/signout");
    expect(response.statusCode).toBe(302);
    response = await agent.get("/organizer/dashboard");
    expect(response.statusCode).toBe(302);
  });

  test("Guest Sign up", async () => {
    let res = await agent.get("/signup");
    const csrfToken = extractCsrfToken(res);
    res = await agent.post("/guest").send({
      firstName: "Test First Name",
      lastName: "Test Last Name",
      email: "testuser@testmail.com",
      password: "testpassword123",
      _csrf: csrfToken,
    });
    expect(res.statusCode).toBe(302);
  });

  test("Guest Sign out", async () => {
    let response = await agent.get("/dashboard");
    expect(response.statusCode).toBe(200);
    response = await agent.get("/signout");
    expect(response.statusCode).toBe(302);
    response = await agent.get("/dashboard");
    expect(response.statusCode).toBe(302);
  });

  test("Creates a NON CONFLICTING appointment at /appointment POST endpoint", async () => {
    const agent = request.agent(server);
    await login(agent, "testuser@testmail.com", "testpassword123");
    let res = await agent.get("/dashboard");
    let csrfToken = extractCsrfToken(res);
    const guest = await Guest.findOne({
      where: { email: "testuser@testmail.com" },
    });
    const organizer = await Organizer.findOne();
    const appointmentCount = await Appointment.count();
    const response = await agent.post("/appointment").send({
      title: "Appointment 1",
      description: "Anything about the appointment",
      organizerId: organizer.id,
      guestId: guest.id,
      date: new Date().toISOString().slice(0, 10),
      start: "09:00",
      end: "09:30",
      _csrf: csrfToken,
    });
    const newCount = await Appointment.count();
    expect(newCount).toBe(appointmentCount + 1);
    expect(response.statusCode).toBe(302);
  });

  test("Creates a CLASHING appointment and expecting to fail", async () => {
    const agent = request.agent(server);
    await login(agent, "testuser@testmail.com", "testpassword123");
    let res = await agent.get("/dashboard");
    let csrfToken = extractCsrfToken(res);
    const guest = await Guest.findOne({
      where: { email: "testuser@testmail.com" },
    });
    const organizer = await Organizer.findOne();
    const appointmentCount = await Appointment.count();
    const response = await agent.post("/appointment").send({
      title: "Appointment 3",
      description: "Anything about the appointment",
      organizerId: organizer.id,
      guestId: guest.id,
      date: new Date().toISOString().slice(0, 10),
      start: "09:10",
      end: "09:30",
      _csrf: csrfToken,
    });
    const newCount = await Appointment.count();
    expect(newCount).toBe(appointmentCount);
    expect(response.statusCode).toBe(302);
  });

  test("Creates an appointment beyond organizer's timings and expecting to fail", async () => {
    const agent = request.agent(server);
    await login(agent, "testuser@testmail.com", "testpassword123");
    let res = await agent.get("/dashboard");
    let csrfToken = extractCsrfToken(res);
    const guest = await Guest.findOne({
      where: { email: "testuser@testmail.com" },
    });
    const organizer = await Organizer.findOne();
    const appointmentCount = await Appointment.count();
    const response = await agent.post("/appointment").send({
      title: "Appointment 4",
      description: "Anything about the appointment",
      organizerId: organizer.id,
      guestId: guest.id,
      date: new Date().toISOString().slice(0, 10),
      start: "04:30",
      end: "09:40",
      _csrf: csrfToken,
    });
    const newCount = await Appointment.count();
    expect(newCount).toBe(appointmentCount);
    expect(response.statusCode).toBe(302);
  });

  test("Editing an appointment", async () => {
    const agent = request.agent(server);
    await login(agent, "testuser@testmail.com", "testpassword123");
    let res = await agent.get("/dashboard");
    let csrfToken = extractCsrfToken(res);
    const guest = await Guest.findOne({
      where: { email: "testuser@testmail.com" },
    });
    const organizer = await Organizer.findOne();
    const appointmentCount = await Appointment.count();
    await agent.post("/appointment").send({
      title: "Old title",
      description: "Old sescription",
      organizerId: organizer.id,
      guestId: guest.id,
      date: new Date().toISOString().slice(0, 10),
      start: "11:30",
      end: "11:45",
      _csrf: csrfToken,
    });
    const newCount = await Appointment.count();
    expect(newCount).toBe(appointmentCount + 1);

    let appointments = await Appointment.findAll();
    let appointment = appointments[newCount - 1];
    res = await agent.get("/dashboard");
    csrfToken = extractCsrfToken(res);
    const DeleteResponse = await agent
      .post(`/appointment/edit/${appointment.id}`)
      .send({
        title: "Edited Title",
        description: "Edited Description",
        _csrf: csrfToken,
      });
    const countAfterEdit = await Appointment.count();
    appointment = await Appointment.findByPk(appointment.id);
    expect(countAfterEdit).toBe(newCount);
    expect(appointment.title).toBe("Edited Title");
    expect(appointment.description).toBe("Edited Description");
  });

  test("Delete an appointment", async () => {
    const agent = request.agent(server);
    await login(agent, "testuser@testmail.com", "testpassword123");
    let res = await agent.get("/dashboard");
    let csrfToken = extractCsrfToken(res);
    const guest = await Guest.findOne({
      where: { email: "testuser@testmail.com" },
    });
    const organizer = await Organizer.findOne();
    const appointmentCount = await Appointment.count();
    await agent.post("/appointment").send({
      title: "Appointment 2",
      description: "Anything about the appointment",
      organizerId: organizer.id,
      guestId: guest.id,
      date: new Date().toISOString().slice(0, 10),
      start: "09:30",
      end: "09:45",
      _csrf: csrfToken,
    });
    const newCount = await Appointment.count();
    expect(newCount).toBe(appointmentCount + 1);

    const appointment = await Appointment.findOne();
    res = await agent.get("/dashboard");
    csrfToken = extractCsrfToken(res);
    const DeleteResponse = await agent.delete("/appointment").send({
      id: appointment.id,
      _csrf: csrfToken,
    });
    const countAfterDelete = await Appointment.count();
    expect(countAfterDelete).toBe(newCount - 1);
  });
});
