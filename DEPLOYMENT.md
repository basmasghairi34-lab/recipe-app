# 🚀 Deployment Guide for Recipe Manager

This project is now configured for a dual-deployment setup: **Frontend on Netlify** and **Backend on Render/Railway**.

## 1. Deploy the Backend (Python FastAPI)

Since Netlify is optimized for static sites and serverless functions, the easiest way to host your FastAPI server with a database is using **Render** or **Railway**.

### Steps for Render:
1.  Create a free account on [Render.com](https://render.com).
2.  Click **New +** and select **Web Service**.
3.  Connect your GitHub repository.
4.  Set the following:
    -   **Root Directory:** `backend`
    -   **Runtime:** `Python 3`
    -   **Build Command:** `pip install -r requirements.txt`
    -   **Start Command:** `uvicorn main:app --host 0.0.0.0 --port $PORT`
5.  Add your **Environment Variables** (click the "Env Vars" tab):
    -   `OPENAI_API_KEY`: Your real OpenAI key.
6.  Once deployed, copy the URL (e.g., `https://recipe-backend.onrender.com`).

---

## 2. Deploy the Frontend (Netlify)

1.  Create an account on [Netlify.com](https://netlify.com).
2.  Add a **New Site** and connect your GitHub repository.
3.  Netlify will automatically detect the `netlify.toml` file in the root.
4.  **Important:** Open your `netlify.toml` in this project.
5.  Replace `https://YOUR_BACKEND_URL.onrender.com` with your actual Render URL.
6.  Commit and push the change to GitHub.
7.  Netlify will build and deploy your site!

---

## 3. How the Proxy Works
-   The frontend calls `/api/recipes`.
-   Netlify sees `/api/*` and redirects it to your Render backend automatically.
-   This avoids **CORS errors** and makes your code cleaner.

## 4. Note on the Database
This version uses **SQLite** (`recipes.db`). 
-   On Render's "Free" tier, the database will reset whenever the server restarts (at least once a day).
-   To keep your recipes permanently, you can upgrade to a "Persistence Disk" on Render or migrate to a hosted database like **Supabase** or **MongoDB**.
