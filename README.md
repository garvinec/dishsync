# DishSync - Dishwasher Status Tracker

A React Native app that allows roommates to track and sync the status of their dishwasher across all devices in real-time.

## Features

- 🏠 **Room Management**: Create rooms with custom names and join existing rooms
- 🔗 **Room Invites**: Share room codes or links to invite roommates
- 🔄 **Real-time Sync**: Dishwasher status updates instantly across all devices
- 🎯 **Default Rooms**: Set a default room that opens when the app launches
- 📱 **Multi-room Support**: Users can be in multiple rooms but have one default
- 🎨 **Clean UI**: Intuitive toggle interface for clean/dirty status

## Database Schema

### Tables

1. **`rooms`** - Stores room information

   - `name`: Room name (string)
   - `code`: Unique 6-character room code (string)
   - `dishwasherStatus`: Current status - "clean" or "dirty" (string)

2. **`userRooms`** - Manages user-room relationships
   - `userId`: User identifier (string)
   - `roomId`: Reference to room (Id)
   - `isDefault`: Whether this is the user's default room (boolean)

### Indexes

- `rooms.by_code`: For fast room lookup by code
- `userRooms.by_userId`: For finding all rooms a user belongs to
- `userRooms.by_userId_and_roomId`: For checking if user is in a specific room
- `userRooms.by_userId_and_isDefault`: For finding user's default room

## Setup Instructions

### Prerequisites

- Node.js (v16 or higher)
- npm or yarn
- Expo CLI
- Convex account (for backend)

### 1. Install Dependencies

```bash
npm install
```

### 2. Set up Convex Backend

1. **Create a Convex project**:

   ```bash
   npx convex dev
   ```

   This will prompt you to create a new Convex project or connect to an existing one.

2. **Deploy your schema and functions**:

   ```bash
   npx convex deploy
   ```

3. **Get your Convex URL**:
   After deployment, Convex will provide you with a URL. Copy this URL.

4. **Set environment variable**:
   Create a `.env` file in your project root:
   ```
   EXPO_PUBLIC_CONVEX_URL=your_convex_url_here
   ```

### 3. Run the App

```bash
# Start the development server
npm start

# Run on iOS
npm run ios

# Run on Android
npm run android

# Run on web
npm run web
```

## API Functions

### Queries (Read Operations)

- `getUserRooms(userId)`: Get all rooms a user belongs to
- `getDefaultRoom(userId)`: Get user's default room
- `getRoomByCode(code)`: Find room by its unique code

### Mutations (Write Operations)

- `createRoom(name, userId)`: Create a new room and add user
- `joinRoom(code, userId)`: Join an existing room using code
- `setDefaultRoom(roomId, userId)`: Set a room as user's default
- `updateDishwasherStatus(roomId, status)`: Update dishwasher status

## App Flow

1. **First Launch**: User generates a unique ID stored locally
2. **No Rooms**: App shows welcome screen with option to create/join room
3. **Default Room**: App opens to user's default room with dishwasher toggle
4. **Room Management**: Users can view all their rooms and switch defaults
5. **Real-time Updates**: Status changes sync instantly across all devices

## Development

### Project Structure

```
dishsync/
├── convex/           # Backend functions and schema
│   ├── schema.ts     # Database schema
│   ├── rooms.ts      # Room-related API functions
│   └── _generated/   # Auto-generated files
├── screens/          # React Native screens
│   ├── HomeScreen.tsx
│   └── RoomsList.tsx
├── App.tsx           # Main app component
└── package.json      # Dependencies and scripts
```

### Key Technologies

- **Frontend**: React Native with Expo
- **Backend**: Convex (real-time database)
- **Navigation**: React Navigation
- **State Management**: Convex hooks for real-time data
- **UI**: Custom components with React Native
