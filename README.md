# Appointment Booking Web Application(All 6 features)
A website built using Nodejs, Express and sequelize for Postgresql for booking appointments. There are 2 types of users - Organizer(who hosts events) and Guest (who books appointments)

# Organizer
* Should sign up to get a unique ID and link using which guests can  book appointments.
* Will have to set working hours.
* Can see all upcoming and past appointment details - title, user who booked it, description/purpose, date and time

# Guest
* Should sign up first to book any appointment
* Enter unique ID shared by the Organizer or visit the URL of the Organizer to be able to book appointments for that organizer.
* Time slot and duration is customizable by the guest.
* Cannot book an appointment outside the working hours of an Organizer.
* If there is clash with any of the Organizer's appointments with other people, then the nearest time slot after the guest's required slot which has the same duration as required by that guest is suggested.
* If there is any clash in timeslot with other appointments of the guest, then the guest is shown the conflicts and given an option to replace all the conflicting appointments with the new one. Also he is suggested with the nearest timeslot with same duration based on availability of both the Organizer and the Guest to chose it or the guest can proceed to chose some other slot
* Can edit an appointment except timings
* Can delete an appointment