# StudyFlow

StudyFlow is a lightweight study app focused on two things:

- `Focus`: a 25-minute countdown timer for deep work
- `Plans`: quick task capture with completion tracking

The app is built with React + Vite for web and Capacitor for Android packaging.

## Features

- 25-minute focus timer with start/pause/reset
- Daily plan list (create, complete, delete)
- Local persistence with `localStorage`
- Mobile-first interface
- Android container support via Capacitor

## Tech Stack

- React 19
- Vite 7
- Tailwind CSS 4
- Capacitor 8
- Lucide React icons

## Getting Started

### 1) Install dependencies

```bash
npm install
```

### 2) Start development server

```bash
npm run dev
```

### 3) Build for production

```bash
npm run build
```

### 4) Preview production build

```bash
npm run preview
```

## Android (Capacitor)

```bash
npm run build
npm run android:sync
npm run android:open
```

Notes:

- Ensure Android Studio is installed.
- `android/local.properties` is machine-specific and should not be committed.

## Scripts

- `npm run dev`: start Vite dev server
- `npm run build`: build web app into `dist/`
- `npm run lint`: run ESLint
- `npm run preview`: preview production build
- `npm run android:sync`: sync web assets and plugins to Android
- `npm run android:open`: open Android project in Android Studio

## Project Structure

```text
src/
  App.jsx        # Main UI and state
  main.jsx       # App entry
android/         # Capacitor Android project
public/          # Static assets
```

## Open Source

- License: MIT (`LICENSE`)
- Contribution guide: `CONTRIBUTING.md`

## Roadmap

- Configurable focus duration
- Optional session history
- Data export/import
- iOS target via Capacitor