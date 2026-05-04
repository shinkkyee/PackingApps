# Packing Pal Mobile (Expo)

## Environment Setup
1. Create a file `mobile/.env`.
2. Add your computer's local IP address:
   `EXPO_PUBLIC_API_URL=http://<your_computer_ip>:3000/api`
   *(Example: EXPO_PUBLIC_API_URL=http://192.168.1.10:3000/api)*
3. To find your IP:
   - **Windows**: Run `ipconfig` in PowerShell.
   - **Mac/Linux**: Run `ifconfig` in Terminal.
4. Restart Expo with cache clear: `npx expo start -c`.

## Testing the Weather Integration
1. **Start Backend**: `npm run dev` in the root folder.
2. **Start Mobile**: `cd mobile && npx expo start`.
3. **Open Expo Go**: Scan the QR code on your phone.
4. **Flow**:
   - Go to "New Trip".
   - Type a city (e.g., "London").
   - Observe the weather preview loading.
   - Create the trip and view the "5-Day Forecast" on the trip details page.
   - If rain is forecasted, look for the ☔ icon and the rain warning.
