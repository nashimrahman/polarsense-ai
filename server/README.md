## Local setup
1. cp .env.example .env  (fill in HiveMQ + DATABASE_URL)
2. npm install
3. npm run migrate
4. npm run dev

# Terminal 1 (backend — already running)
cd server && npm run dev

# Terminal 2 (frontend)
npm run dev   # visit http://localhost:5173/live → all OFFLINE

# Terminal 3 (simulate ESP32)
cd server && node test-publish.js   # PS-01 goes ONLINE; stop it → 15s later OFFLINE

