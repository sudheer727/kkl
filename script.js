document.addEventListener("DOMContentLoaded", loadVehicles);

function loadVehicles() {
    let users = JSON.parse(localStorage.getItem("users")) || [];
    updateAvailability(users);
    removeExpiredRequests(users);
    displayVehicles(users);
}

// ✅ Update vehicle availability based on bookings
function updateAvailability(users) {
    let now = new Date();
    let next24hrs = new Date();
    next24hrs.setHours(next24hrs.getHours() + 24);

    users.forEach(user => {
        let isBooked = user.confirmedBookings?.some(req => {
            let bookingTime = new Date(`${req.date}T${req.startTime}`);
            return bookingTime >= now && bookingTime <= next24hrs;
        });

        user.available = !isBooked;
    });

    localStorage.setItem("users", JSON.stringify(users));
}

// ✅ Remove expired booking requests (older than 10 minutes)
function removeExpiredRequests(users) {
    let now = new Date();
    users.forEach(user => {
        if (!user.bookingRequests) return;
        user.bookingRequests = user.bookingRequests.filter(req => {
            let requestTime = new Date(req.timestamp);
            return (now - requestTime) / 60000 < 10; // Keep requests within 10 min
        });
    });

    localStorage.setItem("users", JSON.stringify(users));
}

// ✅ Request a booking
function requestBooking(index) {
    let users = JSON.parse(localStorage.getItem("users")) || [];
    let user = users[index];

    let name = document.getElementById(`booking-name-${index}`).value.trim();
    let date = document.getElementById(`booking-date-${index}`).value;
    let startTime = document.getElementById(`booking-start-time-${index}`).value;
    let endTime = document.getElementById(`booking-end-time-${index}`).value;
    let zone = document.getElementById(`booking-zone-${index}`).value;

    if (!name || !date || !startTime || !endTime || !zone) {
        alert("Please fill all booking details.");
        return;
    }

    let newRequest = {
        name,
        date,
        startTime,
        endTime,
        zone,
        timestamp: new Date().toISOString()
    };

    user.bookingRequests = user.bookingRequests || [];
    user.bookingRequests.push(newRequest);

    localStorage.setItem("users", JSON.stringify(users));
    alert("Booking request sent!");
    loadVehicles();
}

// ✅ Confirm a booking
function confirmBooking(ownerIndex, requesterName) {
    let users = JSON.parse(localStorage.getItem("users")) || [];
    let owner = users[ownerIndex];

    let enteredPassword = prompt("Enter your password to confirm this booking:");
    if (enteredPassword !== owner.password) {
        alert("Incorrect password.");
        return;
    }

    let requestIndex = owner.bookingRequests.findIndex(req => req.name === requesterName);
    if (requestIndex === -1) {
        alert("Booking request not found.");
        return;
    }

    let confirmedBooking = owner.bookingRequests.splice(requestIndex, 1)[0]; // Remove from requests
    owner.confirmedBookings = owner.confirmedBookings || [];
    owner.confirmedBookings.push(confirmedBooking); // Add to confirmed bookings

    localStorage.setItem("users", JSON.stringify(users));
    alert("Booking confirmed!");
    loadVehicles();
}

// ✅ Cancel a booking
function cancelBooking(ownerIndex, requesterName) {
    let users = JSON.parse(localStorage.getItem("users")) || [];
    let owner = users[ownerIndex];

    let enteredPassword = prompt("Enter your password to cancel this booking:");
    if (enteredPassword !== owner.password) {
        alert("Incorrect password.");
        return;
    }

    let requestIndex = owner.bookingRequests.findIndex(req => req.name === requesterName);
    if (requestIndex === -1) {
        alert("Booking request not found.");
        return;
    }

    owner.bookingRequests.splice(requestIndex, 1); // Remove request
    localStorage.setItem("users", JSON.stringify(users));

    alert("Booking request canceled!");
    loadVehicles();
}
// ✅ Delete Confirmed Booking (asks for password)
function deleteConfirmedBooking(index, requesterName) {
    let users = JSON.parse(localStorage.getItem("users")) || [];
    let user = users[index];

    let enteredPassword = prompt("Enter your password to delete this confirmed booking:");
    if (enteredPassword !== user.password) {
        alert("Incorrect password. Cannot delete booking.");
        return;
    }

    let bookingIndex = user.confirmedBookings.findIndex(req => req.name === requesterName);
    if (bookingIndex === -1) {
        alert("Booking not found.");
        return;
    }

    user.confirmedBookings.splice(bookingIndex, 1); // Remove confirmed booking
    localStorage.setItem("users", JSON.stringify(users));

    alert("Confirmed booking deleted!");
    loadVehicles(); // Refresh UI
}
// ✅ Display vehicles dynamically
// ✅ Display vehicles dynamically (Fixed)
function displayVehicles(users) {
    let vehicleList = document.getElementById("vehicleList");
    vehicleList.innerHTML = "";

    if (users.length === 0) {
        vehicleList.innerHTML = "<p>No vehicles found.</p>";
        return;
    }

    users.sort((a, b) => b.available - a.available); // Sort available first

    users.forEach((user, index) => {
        let div = document.createElement("div");
        div.className = "vehicle-entry";
        div.innerHTML = `
            <p>
                <strong class="owner-name">${user.username}</strong> 
                <span id="status-${index}" class="${user.available ? 'green' : 'red'}">⬤</span> |
                <a href="tel:${user.phone}"><button>Call</button></a>
                <button onclick="showBookingForm(${index})">Book</button>
            </p>

            <div id="booking-form-${index}" class="hidden">
                <input type="text" id="booking-name-${index}" placeholder="Enter Your Name">
                <input type="date" id="booking-date-${index}">
                <input type="time" id="booking-start-time-${index}">
                <input type="time" id="booking-end-time-${index}">
                <select id="booking-zone-${index}">
                    <option value="Zone1">Zone1</option>
                    <option value="Zone2">Zone2</option>
                    <option value="Zone3">Zone3</option>
                </select>
                <button onclick="requestBooking(${index})">Request</button>
            </div>

            <p><strong>Booking Requests:</strong></p>
            <ul id="request-list-${index}">
                ${user.bookingRequests && user.bookingRequests.length > 0 ? 
                    user.bookingRequests.map(req => `
                        <li>
                            ${req.name}, ${req.date} (${getDay(req.date)}), ${req.startTime} - ${req.endTime}, ${req.zone} 
                            <button onclick="confirmBooking(${index}, '${req.name}')">Confirm</button>
                            <button onclick="cancelBooking(${index}, '${req.name}')">Cancel</button>
                        </li>
                    `).join('') : "<li>No booking requests yet.</li>"
                }
            </ul>

            <p><strong>Confirmed Bookings:</strong></p>
            <ul id="confirmed-list-${index}">
                ${user.confirmedBookings && user.confirmedBookings.length > 0 ? 
                    user.confirmedBookings.map(req => `
                        <li>
                            ${req.name}, ${req.date} (${getDay(req.date)}), ${req.startTime} - ${req.endTime}, ${req.zone} ✅ 
                            <button onclick="deleteConfirmedBooking(${index}, '${req.name}')">Delete</button>
                        </li>
                    `).join('') : "<li>No confirmed bookings yet.</li>"
                }
            </ul>
        `;
        vehicleList.appendChild(div);
    });
}


// ✅ Get the day of the week for a given date
function getDay(dateString) {
    let date = new Date(dateString);
    return date.toLocaleDateString('en-US', { weekday: 'long' });
}

// ✅ Filter vehicles
function filterVehicles() {
    let nameInput = document.getElementById("searchInput").value.toLowerCase();
    let dateInput = document.getElementById("searchDate").value;
    let startTimeInput = document.getElementById("searchStartTime").value;
    let endTimeInput = document.getElementById("searchEndTime").value;
    let users = JSON.parse(localStorage.getItem("users")) || [];

    let filteredUsers = users.filter(user => {
        let matchesName = nameInput ? user.username.toLowerCase().includes(nameInput) : true;
        let matchesDate = true;
        let matchesTime = true;

        if (dateInput) {
            matchesDate = !user.confirmedBookings?.some(req => req.date === dateInput);
        }

        if (dateInput && (startTimeInput || endTimeInput)) {
            matchesTime = user.confirmedBookings?.every(req => {
                if (req.date !== dateInput) return true;
                let bookingStart = new Date(`${req.date}T${req.startTime}`);
                let bookingEnd = new Date(`${req.date}T${req.endTime}`);
                let searchStart = startTimeInput ? new Date(`${dateInput}T${startTimeInput}`) : null;
                let searchEnd = endTimeInput ? new Date(`${dateInput}T${endTimeInput}`) : null;

                return (searchEnd && searchEnd <= bookingStart) || (searchStart && searchStart >= bookingEnd);
            }) ?? true;
        }

        return matchesName && matchesDate && matchesTime;
    });

    displayVehicles(filteredUsers);
}

// ✅ Register a new vehicle
function registerUser() {
    let users = JSON.parse(localStorage.getItem("users")) || [];
    let username = document.getElementById("username").value.trim();
    let phone = document.getElementById("phone").value.trim();
    let password = document.getElementById("password").value.trim();

    if (!username || !phone || !password) {
        alert("Please fill all details.");
        return;
    }

    users.push({ username, phone, password, available: true, bookingRequests: [], confirmedBookings: [] });
    localStorage.setItem("users", JSON.stringify(users));

    alert("Registration successful!");
    window.location.href = "main.html";
}
