/* eslint-disable semi */
/* eslint-disable quotes */
/* eslint-disable no-unused-vars */
const express = require("express");
// eslint-disable-next-line prefer-const
let csrf = require("tiny-csrf");
const app = express();
const { Organizer, Guest, Appointment } = require("./models");
const bodyParser = require("body-parser");
// eslint-disable-next-line prefer-const
let cookieParser = require("cookie-parser");

const passport = require("passport");
const connectEnsureLogin = require("connect-ensure-login");
const session = require("express-session");
const flash = require("connect-flash");
const LocalStrategy = require("passport-local");
const bcrypt = require("bcrypt");

const saltRounds = 10;

app.use(bodyParser.json());
const path = require("path");
app.use(express.urlencoded({ extended: false }));
app.use(cookieParser("A secret string"));
app.use(csrf("this_should_be_32_character_long", ["POST", "PUT", "DELETE"]));

// Setting EJS as view engine
app.set("view engine", "ejs");

// Location of static html and CSS files to render our application
app.use(express.static(path.join(__dirname, "public")));
app.set("views", path.join(__dirname, "views"));

app.use(
  session({
    secret: "secret-key for session 123abc",
    cookie: {
      maxAge: 24 * 60 * 60 * 1000, // in milli seconds
    },
  })
);

app.use(passport.initialize());
app.use(passport.session());
app.use(flash());

passport.use(
  "OrganizerAuthenticate",
  new LocalStrategy(
    {
      usernameField: "email",
      passwordField: "password",
    },
    (username, password, done) => {
      Organizer.findOne({ where: { email: username } })
        .then(async function (user) {
          const result = await bcrypt.compare(password, user.password);
          if (result) {
            return done(null, user);
          } else {
            return done(null, false, { message: "Invalid password" });
          }
        })
        .catch(() => {
          return done(null, false, { message: "Doctor does not exist" });
        });
    }
  )
);

passport.use(
  "GuestAuthenticate",
  new LocalStrategy(
    {
      usernameField: "email",
      passwordField: "password",
    },
    (username, password, done) => {
      Guest.findOne({ where: { email: username } })
        .then(async function (user) {
          const result = await bcrypt.compare(password, user.password);
          if (result) {
            return done(null, user);
          } else {
            return done(null, false, { message: "Invalid password" });
          }
        })
        .catch(() => {
          return done(null, false, { message: "User does not exist" });
        });
    }
  )
);

passport.serializeUser((user, done) => {
  console.log("Serialising user in session", user);
  done(null, user);
});

passport.deserializeUser((user, done) => {
  done(null, user);
});

app.use(function (request, response, next) {
  response.locals.messages = request.flash();
  next();
});

app.get("/", async (request, response) => {
  if (request.user !== undefined) {
    if (request.user.userType === "organizer") {
      return response.redirect("/organizer/dashboard");
    } else if (request.user.userType === "guest") {
      return response.redirect("/dashboard");
    }
  }
  response.render("index", {
    csrfToken: request.csrfToken(),
  });
});

app.get(
  "/organizer/signup",
  connectEnsureLogin.ensureLoggedOut({ redirectTo: "/elections" }),
  async (request, response) => {
    response.render("organizerSignup", {
      title: "Signup",
      csrfToken: request.csrfToken(),
    });
  }
);

app.get(
  "/signup",
  connectEnsureLogin.ensureLoggedOut({ redirectTo: "/elections" }),
  async (request, response) => {
    response.render("signup", {
      title: "Signup",
      csrfToken: request.csrfToken(),
    });
  }
);

app.post("/organizer", async (request, response) => {
  if (request.body.firstName.trim().length === 0) {
    request.flash("error", "First name is mandatory");
    return response.redirect("/organizer/signup");
  }
  if (request.body.email.trim().length === 0) {
    request.flash("error", "Email ID is a mandatory field");
    return response.redirect("/organizer/signup");
  }
  if (request.body.password.length < 5) {
    request.flash("error", "Password should be of atleast 5 characters");
    return response.redirect("/organizer/signup");
  }
  const hashedPassword = await bcrypt.hash(request.body.password, saltRounds);
  try {
    const existingEmail = await Organizer.findOne({
      where: { email: request.body.email },
    });
    if (existingEmail !== null) {
      // eslint-disable-next-line no-throw-literal
      throw "User already exists";
    }
    const user = await Organizer.create({
      firstName: request.body.firstName,
      lastName: request.body.lastName,
      email: request.body.email,
      password: hashedPassword,
      start: request.body.start,
      end: request.body.end,
    });
    request.login(user, (err) => {
      if (err) {
        console.log(err);
        response.redirect("/organizer/signup");
      }
      response.redirect("/organizer/dashboard");
    });
  } catch (error) {
    console.log(error);
    request.flash("error", "User already exists. Please Login");
    response.redirect("/organizer/login");
  }
});

app.post("/guest", async (request, response) => {
  if (request.body.firstName.trim().length === 0) {
    request.flash("error", "First name is mandatory");
    return response.redirect("/signup");
  }
  if (request.body.email.trim().length === 0) {
    request.flash("error", "Email ID is a mandatory field");
    return response.redirect("/signup");
  }
  if (request.body.password.length < 3) {
    request.flash("error", "Password should be of atleast 3 characters");
    return response.redirect("/signup");
  }
  const hashedPassword = await bcrypt.hash(request.body.password, saltRounds);
  try {
    const existingEmail = await Guest.findOne({
      where: { email: request.body.email },
    });
    if (existingEmail !== null) {
      // eslint-disable-next-line no-throw-literal
      throw "User already exists";
    }
    const user = await Guest.create({
      firstName: request.body.firstName,
      lastName: request.body.lastName,
      email: request.body.email,
      password: hashedPassword,
    });
    request.login(user, (err) => {
      if (err) {
        console.log(err);
        response.redirect("/signup");
      }
      response.redirect("/dashboard");
    });
  } catch (error) {
    console.log(error);
    request.flash("error", "User already exists. Please Login");
    response.redirect("/login");
  }
});

app.get(
  "/organizer/login",
  connectEnsureLogin.ensureLoggedOut({ redirectTo: "/organizer/dashboard" }),
  (request, response) => {
    response.render("login", {
      formAction: "/session",
      csrfToken: request.csrfToken(),
    });
  }
);

app.post(
  "/session",
  passport.authenticate("OrganizerAuthenticate", {
    failureRedirect: "/organizer/login",
    failureFlash: true,
  }),
  function (request, response) {
    request.user.dataValues.userType = "organizer";
    response.redirect("/organizer/dashboard");
  }
);

app.get("/login", connectEnsureLogin.ensureLoggedOut(), (request, response) => {
  response.render("login", {
    formAction: "/guestSession",
    csrfToken: request.csrfToken(),
  });
});

app.post(
  "/guestSession",
  passport.authenticate("GuestAuthenticate", {
    failureRedirect: "/login",
    failureFlash: true,
  }),
  function (request, response) {
    request.user.dataValues.userType = "guest";
    response.redirect("/dashboard");
  }
);

app.get("/signout", (request, response, next) => {
  request.logout((err) => {
    if (err) {
      return next(err);
    }
    response.redirect("/");
  });
});

app.get(
  "/organizer/dashboard",
  connectEnsureLogin.ensureLoggedIn({ redirectTo: "/organizer/Login" }),
  async (request, response) => {
    if (request.user.userType === "guest") {
      request.flash("error", "Appointees cannot access that page");
      return response.redirect(request.headers.referer);
    }
    const appointments = await Appointment.findAll({
      where: { organizerId: request.user.id },
    });
    const guestNames1 = [];
    const guestNames2 = [];
    const now = new Date();
    const upcoming = [];
    const completed = [];
    let apptDate;
    appointments.sort(function (a, b) {
      return a.start < b.start ? -1 : a.start > b.start ? 1 : 0;
    });
    for (let i = 0; i < appointments.length; i++) {
      const guest = await Guest.findByPk(appointments[i].guestId);
      apptDate = new Date(appointments[i].date + "T" + appointments[i].start);
      if (apptDate.getTime() >= now.getTime()) {
        upcoming.push(appointments[i]);
        guestNames1.push(guest.firstName + " " + guest.lastName);
      } else {
        completed.push(appointments[i]);
        guestNames2.push(guest.firstName + " " + guest.lastName);
      }
    }
    response.render("organizer", {
      organizerId: request.user.id,
      upcoming,
      completed,
      guestNames1,
      guestNames2,
      host: request.headers.host,
      name: request.user.firstName,
      csrfToken: request.csrfToken(),
    });
  }
);

app.get(
  "/dashboard",
  connectEnsureLogin.ensureLoggedIn(),
  async (request, response) => {
    if (request.user.userType === "organizer") {
      request.flash("error", "Appointers cannot access that page");
      return response.redirect(request.headers.referer);
    }
    const appointments = await Appointment.findAll({
      where: { guestId: request.user.id },
    });
    const organizerNames1 = [];
    const organizerNames2 = [];
    const now = new Date();
    const upcoming = [];
    const completed = [];
    let apptDate;
    appointments.sort(function (a, b) {
      return a.start < b.start ? -1 : a.start > b.start ? 1 : 0;
    });
    for (let i = 0; i < appointments.length; i++) {
      const organizer = await Organizer.findByPk(appointments[i].organizerId);
      apptDate = new Date(appointments[i].date + "T" + appointments[i].start);
      if (apptDate.getTime() >= now.getTime()) {
        upcoming.push(appointments[i]);
        organizerNames1.push(organizer.firstName + " " + organizer.lastName);
      } else {
        completed.push(appointments[i]);
        organizerNames2.push(organizer.firstName + " " + organizer.lastName);
      }
    }
    response.render("guest", {
      upcoming,
      completed,
      organizerNames1,
      organizerNames2,
      name: request.user.firstName,
      csrfToken: request.csrfToken(),
    });
  }
);

app.get(
  "/appointment/:id",
  connectEnsureLogin.ensureLoggedIn(),
  async (request, response) => {
    if (request.user.userType === "organizer") {
      request.flash("error", "Appointers cannot access that page");
      return response.redirect(request.headers.referer);
    }
    const organizer = await Organizer.findByPk(request.params.id);
    if (organizer === null) {
      request.flash("error", "Wrong ID or no person found at that link");
      return response.redirect("/dashboard");
    }
    response.render("addAppointment", {
      organizer,
      name: request.user.firstName,
      csrfToken: request.csrfToken(),
    });
  }
);

app.post(
  "/appointment",
  connectEnsureLogin.ensureLoggedIn(),
  async (request, response) => {
    if (request.user.userType === "organizer") {
      request.flash("error", "Appointers cannot access that page");
      return response.redirect(request.headers.referer);
    }
    try {
      const organizerId = request.body.organizerId;
      if (request.body.start >= request.body.end) {
        request.flash("error", "End time should be after start time");
        return response.redirect(`/appointment/${organizerId}`);
      }
      const organizer = await Organizer.findByPk(organizerId);
      if (
        request.body.start < organizer.start.slice(0, 5) ||
        request.body.end > organizer.end.slice(0, 5)
      ) {
        request.flash(
          "error",
          "The organizer does not take appointments at that time. Please select from the working hours specified."
        );
        return response.redirect(`/appointment/${organizerId}`);
      }
      const organizerClashes = await Appointment.getOrganizerClashes(
        organizerId,
        request.body.date,
        request.body.start,
        request.body.end
      );
      console.log("Came to org clash", organizerClashes);
      if (organizerClashes.length > 0) {
        // Finding free slot
        const organizerAppts = await Appointment.findAll({
          attributes: ["start", "end"],
          where: { organizerId, date: request.body.date },
        });
        const guestAppts = await Appointment.findAll({
          attributes: ["start", "end"],
          where: { guestId: request.user.id, date: request.body.date },
        });
        let temp = [];
        const allSlots = [];
        for (let i = 0; i < organizerAppts.length; i++) {
          temp = [
            organizerAppts[i].start.slice(0, 5),
            organizerAppts[i].end.slice(0, 5),
          ];
          allSlots.push(temp);
        }
        for (let i = 0; i < guestAppts.length; i++) {
          temp = [
            guestAppts[i].start.slice(0, 5),
            guestAppts[i].end.slice(0, 5),
          ];
          allSlots.push(temp);
        }
        allSlots.push([organizer.end.slice(0, 5), organizer.end.slice(0, 5)]);
        allSlots.sort(function (a, b) {
          return a[0] < b[0] ? -1 : a[0] > b[0] ? 1 : 0;
        });
        const duration =
          new Date("2023-03-06" + "T" + request.body.end).getTime() -
          new Date("2023-03-06" + "T" + request.body.start).getTime();
        console.log("#########################", duration, allSlots);
        const freeSlot = await Appointment.freeSlot(duration, allSlots);
        let message;
        if (freeSlot) {
          message = `The closest slot available after your selected slot is ${freeSlot.start} - ${freeSlot.end}`;
        } else {
          message = "There are no free slots available today after your slot.";
        }
        request.flash(
          "error",
          "The organizer has some other appointments at this slot. Please choose a different slot. " +
            message
        );
        return response.redirect(`/appointment/${request.body.organizerId}`);
      }

      const guestClashes = await Appointment.getGuestClashes(
        request.user.id,
        request.body.date,
        request.body.start,
        request.body.end
      );
      console.log("**************", guestClashes);
      if (guestClashes.length > 0) {
        global.clashObj = {
          title: request.body.title,
          description: request.body.description,
          date: request.body.date,
          start: request.body.start,
          end: request.body.end,
          organizerId: request.body.organizerId,
        };
        return response.redirect("/clash");
      }
      await Appointment.addAppointment(
        request.body.organizerId,
        request.user.id,
        request.body.title,
        request.body.description,
        request.body.date,
        request.body.start,
        request.body.end
      );
      request.flash("success", "Appointment confirmed");
      return response.redirect("/dashboard");
    } catch (error) {
      console.log(error);
      return response.status(422).json(error);
    }
  }
);

app.get(
  "/clash",
  connectEnsureLogin.ensureLoggedIn(),
  async (request, response) => {
    if (request.user.userType === "organizer") {
      request.flash("error", "Appointers cannot access that page");
      return response.redirect(request.headers.referer);
    }
    const organizerId = global.clashObj.organizerId;
    const organizer = await Organizer.findByPk(organizerId);
    const guestClashes = await Appointment.getGuestClashes(
      request.user.id,
      global.clashObj.date,
      global.clashObj.start,
      global.clashObj.end
    );
    const organizerAppts = await Appointment.findAll({
      attributes: ["start", "end"],
      where: { organizerId, date: global.clashObj.date },
    });
    const guestAppts = await Appointment.findAll({
      attributes: ["start", "end"],
      where: { guestId: request.user.id, date: global.clashObj.date },
    });
    let temp = [];
    const allSlots = [];
    for (let i = 0; i < organizerAppts.length; i++) {
      temp = [
        organizerAppts[i].start.slice(0, 5),
        organizerAppts[i].end.slice(0, 5),
      ];
      allSlots.push(temp);
    }
    for (let i = 0; i < guestAppts.length; i++) {
      temp = [guestAppts[i].start.slice(0, 5), guestAppts[i].end.slice(0, 5)];
      allSlots.push(temp);
    }
    allSlots.push([organizer.end.slice(0, 5), organizer.end.slice(0, 5)]);
    allSlots.sort(function (a, b) {
      return a[0] < b[0] ? -1 : a[0] > b[0] ? 1 : 0;
    });
    const duration =
      new Date("2023-03-06" + "T" + global.clashObj.end).getTime() -
      new Date("2023-03-06" + "T" + global.clashObj.start).getTime();
    const freeSlot = await Appointment.freeSlot(duration, allSlots);
    let message;
    if (freeSlot) {
      message = `The closest slot available after your selected slot is ${freeSlot.start} - ${freeSlot.end}`;
    } else {
      message = "There are no free slots available today after your slot.";
    }
    console.log("**************", guestClashes);
    const organizerNames = [];
    for (let i = 0; i < guestClashes.length; i++) {
      const organizer = await Organizer.findByPk(guestClashes[i].organizerId);
      organizerNames.push(organizer.firstName + " " + organizer.lastName);
    }
    let appointmentsStr = "";
    for (let i = 0; i < guestClashes.length; i++) {
      appointmentsStr = appointmentsStr + " " + guestClashes[i].id;
    }
    return response.render("clash", {
      appointments: guestClashes,
      organizerNames,
      clashedIdsStr: appointmentsStr,
      organizerId: global.clashObj.organizerId,
      message,
      csrfToken: request.csrfToken(),
    });
  }
);

app.get(
  "/appointment/edit/:id",
  connectEnsureLogin.ensureLoggedIn(),
  async (request, response) => {
    if (request.user.userType === "organizer") {
      request.flash("error", "Appointers cannot access that page");
      return response.redirect(request.headers.referer);
    }
    const appointment = await Appointment.findByPk(request.params.id);
    if (appointment === null) {
      request.flash("error", "Wrong link");
      return response.redirect("/dashboard");
    }
    const organizer = await Organizer.findByPk(appointment.organizerId);
    response.render("editAppointment", {
      appointment,
      name: organizer.firstName + " " + organizer.lastName,
      csrfToken: request.csrfToken(),
    });
  }
);

app.post(
  "/appointment/edit/:id",
  connectEnsureLogin.ensureLoggedIn(),
  async (request, response) => {
    if (request.user.userType === "organizer") {
      request.flash("error", "Appointers cannot access that page");
      return response.redirect(request.headers.referer);
    }
    try {
      await Appointment.edit(
        request.params.id,
        request.body.title,
        request.body.description
      );
    } catch (error) {
      console.log(error);
      return response.status(422).json(error);
    }
    response.redirect("/dashboard");
  }
);

app.delete(
  "/appointment",
  connectEnsureLogin.ensureLoggedIn(),
  async (request, response) => {
    if (request.user.userType === "organizer") {
      request.flash("error", "Appointers cannot access that page");
      return response.redirect(request.headers.referer);
    }
    try {
      await Appointment.delete(request.body.id);
      request.flash("success", "Appointment deleted");
      return response.send(200);
    } catch (error) {
      console.log(error);
      return response.status(422).json(error);
    }
  }
);

app.post(
  "/replace",
  connectEnsureLogin.ensureLoggedIn(),
  async (request, response) => {
    if (request.user.userType === "organizer") {
      request.flash("error", "Appointers cannot access that page");
      return response.redirect(request.headers.referer);
    }
    try {
      const clashedStr = request.body.clashedIdsStr.toString();
      const clashedIds = clashedStr.split(/\s+/);
      console.log("=========", clashedIds);
      clashedIds.forEach(async (id) => {
        if (id !== "") {
          await Appointment.delete(id);
        }
      });
      await Appointment.addAppointment(
        request.body.organizerId,
        request.user.id,
        global.clashObj.title,
        global.clashObj.description,
        global.clashObj.date,
        global.clashObj.start,
        global.clashObj.end
      );
      global.clashObj = null;
      request.flash(
        "success",
        "Replaced conflicting appointments with new appointment"
      );
      return response.redirect("/dashboard");
    } catch (error) {
      console.log(error);
      return response.status(422).json(error);
    }
  }
);

module.exports = app;
