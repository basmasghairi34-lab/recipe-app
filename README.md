# GourmetBox - Recipe Manager 🍳

A modern, full-stack recipe management application built with Python (FastAPI) and Vanilla JavaScript.

## Features
- **Recipe Management**: Create, view, and delete recipes.
- **AI-Powered Suggestions**: Input ingredients you have, and get recipe ideas dynamically.
- **Modern UI**: Clean, responsive design with a premium feel.
- **FastAPI Backend**: High-performance REST API with SQLite storage.

## Project Structure
- `/backend`: Python FastAPI application and database logic.
- `/frontend`: HTML, CSS, and Vanilla JavaScript for the user interface.

## Getting Started

### 1. Prerequisites
- Python 3.7+ installed.
- A modern web browser.

### 2. Backend Setup
1. Navigate to the backend directory:
   ```bash
   cd backend
   ```
2. Install dependencies:
   ```bash
   pip install fastapi uvicorn sqlalchemy pydantic
   ```
3. Run the server:
   ```bash
   python main.py
   ```
   The API will be available at `http://localhost:8000`.

### 3. Frontend Setup
1. Simply open `frontend/index.html` in your web browser.
2. (Optional) Use a "Live Server" extension if you're using VS Code for a better experience.

## Usage
1. **Add Recipe**: Fill out the form on the left to add your favorite recipes to the database.
2. **AI Suggestion**: Type ingredients you have (e.g., "Tomato, Pasta") into the top box and click "Suggest".
3. **Delete**: Manage your collection by deleting recipes you no longer need.

## Design Notes
- **Typography**: Uses 'Outfit' for a modern feel and 'Playfair Display' for headings.
- **Colors**: A light, clean palette with #ff6b6b (coral) as the primary action color.
- **Responsiveness**: The layout adjusts automatically for mobile and desktop screens.
