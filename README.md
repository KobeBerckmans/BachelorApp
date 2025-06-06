# BachelorApp

BachelorApp is a mobile application and backend developed for the organization **Buren voor Buren Tienen**. The app supports the management of volunteers, help requests, and coordinators. This project is open source, but its use is **strictly limited to the organization Buren voor Buren Tienen**.

## 📱 Features
- Volunteers can register, log in, and accept help requests.
- Coordinators can manage help requests, promote volunteers to coordinator, and contact volunteers and help requesters.
- Dashboard with an overview of requests, contacts, volunteers, and coordinators.
- Push notifications for new help requests (if configured).

## 🏢 For whom?
This project is developed exclusively for **Buren voor Buren Tienen** and their volunteers/coordinators.

## ⚡ Installation
### Requirements
- Node.js (recommended: v18 or higher)
- npm or yarn
- MongoDB database (cloud or local)

### 1. Clone the repository
```bash
git clone <repo-url>
cd BachelorApp
```

### 2. Install dependencies
Frontend (Expo/React Native):
```bash
cd bachelorapp
npm install
```
Backend:
```bash
cd ../backend
npm install
```

### 3. Configure environment variables
Create a `.env` file in the `backend/` folder with:
```
MONGODB_URI=<your-mongodb-connection-string>
```

### 4. Start the application
Backend:
```bash
cd backend
npm start
```
Frontend (Expo):
```bash
cd bachelorapp
npx expo start
```

## 📁 Project structure
```
BachelorApp/
  bachelorapp/        # Frontend (Expo/React Native)
    app/              # Screens, navigation, UI components
    assets/           # Images, fonts
    components/       # Reusable components
    constants/        # API urls, colors, etc.
    hooks/            # Custom React hooks
    scripts/          # Utility scripts
  backend/            # Node.js/Express backend
```

## 🛠️ Important scripts
- `npm start` (backend): Start the backend server
- `npx expo start` (frontend): Start the mobile app in Expo

## 🧑‍💻 Code style & conventions
- Use ESLint and Prettier for consistent code style
- Commit messages preferably follow [Conventional Commits](https://www.conventionalcommits.org/)
- File names: camelCase for JS/TS, PascalCase for components
- Use async/await for all asynchronous backend code

## 🤝 Contributing & Code of Conduct
This project is not open for public contributions. All users and contributors must adhere to the [Code of Conduct](CODE_OF_CONDUCT.md).

## 📝 License
This project and the accompanying website are open source **exclusively for the organization Buren voor Buren Tienen**. Only this organization is permitted to use, modify, and distribute the code, **provided that the original author, Kobe Berckmans, is always credited**. The code is not intended for general public or commercial use. See [LICENSE](LICENSE) for details.

## 👤 Author & Contact
- **Kobe Berckmans**
- Contact: kobe.berckmans@hotmail.com

---
For questions, contact Kobe Berckmans. Enjoy using the app!

## 📚 Sources

Below are some of the most relevant resources and documentation used during the development of this project:

1. [React Native Documentation](https://reactnative.dev/docs/getting-started)
2. [Expo Documentation](https://docs.expo.dev/)
3. [MongoDB Node.js Driver Documentation](https://mongodb.github.io/node-mongodb-native/)
4. [Express.js Documentation](https://expressjs.com/)
5. [React Navigation Documentation](https://reactnavigation.org/docs/getting-started)
6. [AsyncStorage for React Native](https://react-native-async-storage.github.io/async-storage/docs/install/)
7. [Node.js Official Documentation](https://nodejs.org/en/docs)
8. [TypeScript Handbook](https://www.typescriptlang.org/docs/handbook/intro.html)
9. [Expo Push Notifications Guide](https://docs.expo.dev/push-notifications/overview/)
10. [Material Icons Reference](https://fonts.google.com/icons)
11. [Stack Overflow: How to use AsyncStorage in React Native](https://stackoverflow.com/questions/55399548/how-to-use-asyncstorage-in-react-native)
12. [Stack Overflow: How to connect to MongoDB with Node.js](https://stackoverflow.com/questions/13405129/how-do-i-connect-to-mongodb-with-node-js)
13. [Stack Overflow: How to use React Navigation with TypeScript](https://stackoverflow.com/questions/61214337/how-to-use-react-navigation-with-typescript)
14. [Stack Overflow: How to send push notifications with Expo](https://stackoverflow.com/questions/50269538/how-to-send-push-notifications-with-expo)
15. [ChatGPT by OpenAI](https://chat.openai.com/) — Used for code generation, debugging, and architectural advice throughout the project.

These resources were essential for implementing authentication, navigation, database integration, push notifications, and UI/UX best practices in the BachelorApp project. 