SmartRoom - Management System
A Full-stack application designed for efficient institutional room management, tracking recurring assignments, and handling real-time availability updates.

Project Overview
The SmartRoom system provides a centralized solution for managing classroom resources. It allows administrators to define room attributes, manage permanent weekly schedules, and track temporary cancellations to maximize space utilization.

Core Features
Resource Management: Tracking physical room properties such as wing, floor, capacity, and available equipment (e.g., projectors).

Dynamic Scheduling: Managing recurring assignments for courses and lectures with precise day and time slots.

Availability Tracking: Handling class cancellations and updates to reflect real-time room status.

Conflict Prevention: Integrated logic to ensure no overlapping assignments occur within the same space.

Database Logic
The system uses a relational MongoDB structure via Mongoose, centered around three main entities:

Rooms: The core entity containing physical data and references to associated schedules.

Assignments: Defines the permanent weekly occupancy of a room.

Cancellations: Tracks specific instances where a room becomes vacant, allowing for temporary re-assignment.

Technology Stack
Backend: Node.js & Express.js

Frontend: React.js

Database: MongoDB (Mongoose)

Version Control: Git & GitHub

Installation & Setup
Clone the repository:

Bash
git clone [repository-link]
Install Dependencies:
Navigate to both the server and client directories and run:

Bash
npm install
Environment Configuration:
Ensure a .env file is created in the server directory with the necessary MongoDB connection string and Port configuration.

Running the Application:
Start the backend and frontend servers using:

Bash
npm start
