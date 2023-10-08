# Doctor Appointment Application

A user-friendly application built using Node.js and Sequelize to help users book doctor appointments with ease.

## Features

- **User Authentication**: Register and log in.
- **Doctor's Schedule Viewer**: View available time slots.
- **Appointment Booking**: Book, reschedule, or cancel appointments.
- **Notifications**: Reminders for upcoming appointments.
- **Admin Panel**: Manage doctors and their schedules.

## Prerequisites

- [Node.js](https://nodejs.org/)
- [npm](https://www.npmjs.com/)
- [Sequelize CLI](https://github.com/sequelize/cli)
- A relational database (e.g., MySQL, PostgreSQL)

## Installation

1. **Clone the Repository**:
        git clone https://github.com/KrishnaRishi2208/Appoint-Booking

3. **Install Dependencies**:
        npm install package.json

5. **Setup Database**:
- Update the `.env` file with your database details.
- Run migrations:
  ```
  sequelize db:migrate
  ```

4. **Start the Application**:

Visit `http://localhost:3000` to access the application.

## Usage

1. **Registration and Login**: Register as a new user or log in if you're already registered.
2. **Browse Doctor Schedules**: View available time slots and choose a convenient time.
3. **Manage Appointments**: View, book, reschedule, or cancel your appointments.

## Contributing

Contributions are welcomed. Here's how to contribute:

- Fork the repo.
- Create a new feature branch.
- Make changes and commit them.
- Push to your branch.
- Open a pull request.

## License

This project is licensed under the MIT License. Refer to the `LICENSE` file for more details.

