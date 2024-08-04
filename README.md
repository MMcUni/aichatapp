# AI Chat Application

AI Chat Application is a sophisticated, real-time messaging platform built with React and Firebase. It integrates multiple AI agents, speech recognition, text-to-speech capabilities, news summarization, weather forecasting, and medication reminders.

## Live Demo

A live version of the application is available at: [https://aichatapp-5849538d3387.herokuapp.com/](https://aichatapp-5849538d3387.herokuapp.com/)

## Features

- User authentication (sign up, login, logout)
- Real-time messaging with other users
- Real-time messaging with AI agents
- Voice interaction with speech-to-text and text-to-speech
- AI-generated Weather forecasting
- AI-generated News summarization
- Medication reminders
- Responsive design

## Technologies Used

### Frontend
- React.js
- Vite (build tool and development server)
- Zustand (state management)
- CSS Modules (component-scoped styling)
- React-Toastify (notifications)
- TimeAgo.js (timestamp formatting)

### Backend
- Firebase (Authentication, Firestore, Storage)
- Express.js (production server)

### APIs
- OpenAI GPT (AI agents)
- Deepgram (Speech recognition and transcription)
- ElevenLabs (Text-to-speech)
- Open-Meteo (Weather data)
- TheNewsAPI (News data)

## Prerequisites

Before you begin, ensure you have met the following requirements:
- Node.js (v14.0.0 or later)
- npm (v6.0.0 or later)
- A Firebase account and project
- API keys for OpenAI, Deepgram, ElevenLabs, and TheNewsAPI

## Installation

1. Clone the repository:
   ```
   git clone https://github.com/MMcUni/ai-chat-app.git
   cd ai-chat-app
   ```

2. Install the dependencies:
   ```
   npm install
   ```

3. Create a `.env` file in the root directory and add your configuration:
   ```
   VITE_API_KEY=your_firebase_api_key
   VITE_AUTH_DOMAIN=your_firebase_auth_domain
   VITE_PROJECT_ID=your_firebase_project_id
   VITE_STORAGE_BUCKET=your_firebase_storage_bucket
   VITE_MESSAGING_SENDER_ID=your_firebase_messaging_sender_id
   VITE_APP_ID=your_firebase_app_id
   VITE_OPENAI_API_KEY=your_openai_api_key
   VITE_DEEPGRAM_API_KEY=your_deepgram_api_key
   VITE_ELEVENLABS_API_KEY=your_elevenlabs_api_key
   VITE_NEWS_API_KEY=your_newsapi_key
   ```

## Usage

To run the application in development mode:
```
npm run dev
```

To build the application for production:
```
npm run build
```

To preview the production build:
```
npm run preview
```

## Deployment

This application is deployed on Heroku. To deploy your own instance:

1. Create a new Heroku app
2. Set up the Heroku CLI and login
3. Add the Heroku remote to your git repository
4. Set the environment variables in Heroku (use `heroku config:set`)
5. Deploy by pushing to the Heroku remote:
   ```
   git push heroku main
   ```

Ensure that your Heroku app has the necessary buildpacks and that all environment variables are set correctly.

## AI Agents

The application features several AI agents, each specialized in different areas:

1. Doctor Tom (medical advice)
2. Walter Weather (weather forecasting)
3. Dave the Entertainer (entertainment)
4. MedRemind (medication reminders)
5. NewsBot (news summarization)

These agents are powered by OpenAI's GPT models external API's and provide specialized assistance in their respective domains.

## Contributing

Contributions to the AI Chat Application are welcome. Please follow these steps:

1. Fork the repository
2. Create a new branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add some amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## License

This project is licensed under the MIT License - see the `LICENSE.md` file for details.

## Contact

Martin McCurley - mmccur300@caledonian.ac.uk

Project Link: https://github.com/MMcUni/aichatapp
Live Demo: https://aichatapp-5849538d3387.herokuapp.com/
