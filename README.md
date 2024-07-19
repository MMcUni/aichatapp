# AI Chat App
AI Chat App is a real-time messaging application built with React and Firebase. It allows users to create accounts, add contacts, and exchange messages in real-time.

## Features
User authentication (sign up, login, logout)
Real-time messaging
User profile management
Add and manage contacts
Responsive design for desktop and mobile devices

## Technologies Used
React.js
Firebase (Authentication, Firestore, Storage)
Vite
Zustand for state management
React-Toastify for notifications
TimeAgo.js for timestamp formatting

## Prerequisites
Before you begin, ensure you have met the following requirements:

Node.js (v14.0.0 or later)
npm (v6.0.0 or later)
A Firebase account and project

## Installation
Clone the repository:
Copygit clone https://github.com/MMcUni/ai-chat-app.git
cd ai-chat-app

### Install the dependencies:
Copynpm install

Create a .env file in the root directory and add your Firebase configuration:
CopyVITE_API_KEY=your_api_key
VITE_AUTH_DOMAIN=your_auth_domain
VITE_PROJECT_ID=your_project_id
VITE_STORAGE_BUCKET=your_storage_bucket
VITE_MESSAGING_SENDER_ID=your_messaging_sender_id
VITE_APP_ID=your_app_id


## Usage
To run the application in development mode:
Copynpm run dev
To build the application for production:
Copynpm run build
To preview the production build:
Copynpm run preview

## Deployment
This application is configured for deployment on Heroku. Make sure you have the Heroku CLI installed and are logged in. Then run:
Copyheroku create
git push heroku main
Contributing
Contributions to the AI Chat App are welcome. Please follow these steps:

### Fork the repository
Create a new branch (git checkout -b feature/amazing-feature)
Commit your changes (git commit -m 'Add some amazing feature')
Push to the branch (git push origin feature/amazing-feature)
Open a Pull Request

### License
This project is licensed under the MIT License - see the LICENSE.md file for details.
Contact
Martin McCurley - mmccur300@caledonian.ac.uk
Project Link: https://github.com/MMcUni/ai-chat-app