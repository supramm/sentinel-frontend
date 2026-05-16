# SentinelAI Frontend

<p align="center">
  <strong>Production React/Vite frontend for the SentinelAI predictive maintenance platform.</strong>
</p>

<p align="center">
  <a href="https://sentinel-frontend-delta.vercel.app/">Live Frontend</a>
  ·
  <a href="https://sentinel-if-engine.streamlit.app/?embed=true">IF Engine</a>
  ·
  <a href="https://sentinel-lstm-engine.streamlit.app/?embed=true">LSTM AE Engine</a>
  ·
  <a href="https://sentinel-rul-engine.streamlit.app/?embed=true">RUL Engine</a>
</p>

<p align="center">
  <img alt="React" src="https://img.shields.io/badge/React-Frontend-20232A?style=for-the-badge&logo=react&logoColor=61DAFB">
  <img alt="Vite" src="https://img.shields.io/badge/Vite-Build-646CFF?style=for-the-badge&logo=vite&logoColor=FFD62E">
  <img alt="TypeScript" src="https://img.shields.io/badge/TypeScript-App-3178C6?style=for-the-badge&logo=typescript&logoColor=white">
  <img alt="Vercel" src="https://img.shields.io/badge/Vercel-Deployed-000000?style=for-the-badge&logo=vercel&logoColor=white">
  <img alt="Streamlit" src="https://img.shields.io/badge/Streamlit-Embedded_Runtime-FF4B4B?style=for-the-badge&logo=streamlit&logoColor=white">
</p>

---

## Overview

SentinelAI Frontend is the deployed web interface for the SentinelAI predictive maintenance system.

It acts as the presentation and interaction layer for multiple machine learning runtime engines. The frontend itself is a static React/Vite application deployed on Vercel. Model execution is handled separately by Streamlit Cloud apps, which are embedded into the frontend through production-safe iframe URLs.

This separation keeps the system modular:

- the frontend handles the user interface
- Streamlit apps handle model-specific runtime interaction
- each runtime engine can be deployed, updated, and debugged independently
- the frontend provides a unified dashboard experience

---

## Live System

| Component | Deployment |
|---|---|
| Frontend | https://sentinel-frontend-delta.vercel.app/ |
| Isolation Forest Engine | https://sentinel-if-engine.streamlit.app/?embed=true |
| LSTM Autoencoder Engine | https://sentinel-lstm-engine.streamlit.app/?embed=true |
| RUL Engine | https://sentinel-rul-engine.streamlit.app/?embed=true |

---

## Deployed Site Screenshots

> Add final screenshots of the deployed Vercel site below.

### 1. Landing / Hero View

<p align="center">
  <img src="./docs/screenshots/landing.png" alt="SentinelAI Landing Page" width="900">
</p>

### 2. Dashboard View

<p align="center">
  <img src="./docs/screenshots/dashboard.png" alt="SentinelAI Dashboard" width="900">
</p>

### 3. Neural Reactor View

<p align="center">
  <img src="./docs/screenshots/neural-reactor.png" alt="SentinelAI Neural Reactor" width="900">
</p>

### 4. Embedded Runtime Engines

<p align="center">
  <img src="./docs/screenshots/runtime-engines.png" alt="SentinelAI Runtime Engines" width="900">
</p>

---

## Architecture

```txt
SentinelAI Frontend
React + Vite + TypeScript
Deployed on Vercel
        |
        | iframe embeds
        |
        |-- Isolation Forest Engine
        |   Streamlit Cloud
        |
        |-- LSTM Autoencoder Engine
        |   Streamlit Cloud
        |
        |-- RUL Prediction Engine
            Streamlit Cloud
````

The frontend is intentionally lightweight. It does not run Python, Streamlit, model inference, or backend services directly.

---

## Runtime Flow

```txt
index.html
    |
    v
src/main.tsx
    |
    v
src/app/App.tsx
    |
    |-- Dashboard section
    |-- Neural reactor section
    |-- Model runtime iframe section
```

Primary application file:

```txt
src/app/App.tsx
```

This file controls the main page hierarchy and the embedded Streamlit runtime URLs.

---

## Streamlit Runtime Integration

The frontend embeds three Streamlit Cloud apps.

All Streamlit URLs must include:

```txt
?embed=true
```

Production URLs:

```txt
https://sentinel-if-engine.streamlit.app/?embed=true
https://sentinel-lstm-engine.streamlit.app/?embed=true
https://sentinel-rul-engine.streamlit.app/?embed=true
```

The `?embed=true` flag is required for stable Streamlit iframe behavior. Without it, Streamlit Cloud can redirect repeatedly inside the iframe.

---

## Features

### Unified Frontend Interface

A single deployed web interface presents the complete SentinelAI system.

### Predictive Maintenance Dashboard

The dashboard section presents project-level diagnostics and system information using frontend-side assets and analytics data.

### Neural Reactor Visualization

A custom visual component provides a futuristic neural-system interface for the presentation layer.

### Embedded Model Engines

The frontend integrates three independent runtime apps:

| Engine           | Role                                     |
| ---------------- | ---------------------------------------- |
| Isolation Forest | anomaly detection runtime                |
| LSTM Autoencoder | temporal reconstruction anomaly runtime  |
| RUL Prediction   | remaining useful life prediction runtime |

### Static Vercel Deployment

The app is deployed as a static Vite build on Vercel.

---

## Tech Stack

| Layer           | Technology                            |
| --------------- | ------------------------------------- |
| Frontend        | React                                 |
| Build Tool      | Vite                                  |
| Language        | TypeScript                            |
| Styling         | CSS / utility-style component styling |
| Runtime Embeds  | Streamlit Cloud                       |
| Hosting         | Vercel                                |
| Version Control | GitHub                                |

---

## Repository Structure

```txt
sentinel-frontend/
|
|-- Dashboard/
|   |-- hero.css
|   |-- results.json
|
|-- NeuralReactor/
|   |-- src/
|       |-- app/
|           |-- components/
|               |-- NeuralCognitionReactorMid.tsx
|
|-- src/
|   |-- app/
|   |   |-- App.tsx
|   |   |-- components/
|   |   |-- dashboard/
|   |   |-- data/
|   |   |-- hooks/
|   |
|   |-- imports/
|   |-- styles/
|   |-- main.tsx
|
|-- index.html
|-- package.json
|-- package-lock.json
|-- vite.config.ts
|-- .gitignore
|-- README.md
```

---

## Local Development

Install dependencies:

```bash
npm install
```

Start development server:

```bash
npm run dev
```

Build production bundle:

```bash
npm run build
```

Preview production build:

```bash
npm run preview
```

---

## Vercel Deployment Settings

The project is deployed on Vercel with the following settings:

| Setting          | Value         |
| ---------------- | ------------- |
| Framework Preset | Vite          |
| Root Directory   | ./            |
| Build Command    | npm run build |
| Output Directory | dist          |
| Install Command  | npm install   |

No environment variables are required for the current frontend deployment.

---

## Important Deployment Notes

### Do not commit build artifacts

The following folders/files should remain ignored:

```txt
node_modules/
dist/
.env
.env.*
*.log
.vscode/
```

### Do not add broad Vercel rewrites

This project does not require a broad `vercel.json` rewrite.

A previous rewrite configuration caused Vite JavaScript assets to be served as HTML, resulting in a blank page and the browser error:

```txt
Expected a JavaScript-or-Wasm module script but the server responded with a MIME type of "text/html".
```

The deployed app works correctly without `vercel.json`.

### Keep Streamlit embed mode enabled

All Streamlit iframe URLs must keep:

```txt
?embed=true
```

Removing this can cause repeated redirects inside the iframe.

---

## Deployment Status

| Component                | Status   |
| ------------------------ | -------- |
| React/Vite frontend      | Deployed |
| Vercel production build  | Working  |
| Dashboard section        | Working  |
| Neural reactor section   | Working  |
| IF Streamlit iframe      | Working  |
| LSTM AE Streamlit iframe | Working  |
| RUL Streamlit iframe     | Working  |

---

## Project Role

This repository contains only the frontend layer of SentinelAI.

The complete deployed system is composed of:

```txt
sentinel-frontend
+
sentinel-runtime
```

The runtime repository contains the model-specific Streamlit apps and ML artifacts. This repository contains the Vercel-deployed user interface that embeds and presents those runtime engines.

---

## Future Improvements

Potential next steps:

* add final deployed-site screenshots
* add a short demo GIF
* add a custom domain
* add iframe loading skeletons
* add fallback messages for sleeping Streamlit apps
* add web analytics
* add responsive polish for smaller screens
* add a project walkthrough video

---

## License

License information can be added here if required.

