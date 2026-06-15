# Cloud Deployment Guide (Vercel + Render + MongoDB Atlas)

This guide walks you through deploying the **Dynamic Form Builder** application to the cloud using free hosting services.

---

## Step 1: Push Code to GitHub

First, initialize Git and push the codebase to a new private or public GitHub repository.

1. **Initialize Git at the workspace root**:
   Make sure you are at `c:\Users\dell\Documents\OneDrive\Desktop\dynamic form builder`. Open a terminal and run:
   ```bash
   git init
   ```
2. **Create a global `.gitignore` at the root** to exclude local build assets and credentials:
   Create a `.gitignore` file at the workspace root with:
   ```text
   # Dependencies
   node_modules/
   
   # Builds
   dist/
   .next/
   out/
   
   # Environments & Credentials
   .env
   .env.local
   .env.production
   
   # Debug logs
   npm-debug.log*
   yarn-debug.log*
   ```
3. **Commit and push to GitHub**:
   - Create a repository on GitHub (e.g., `dynamic-form-builder`).
   - Run the following commands:
     ```bash
     git add .
     git commit -m "feat: initial commit of dynamic form builder"
     git branch -M main
     git remote add origin <your-github-repo-url>
     git push -u origin main
     ```

---

## Step 2: Set Up MongoDB Atlas (Cloud Database)

1. Go to [MongoDB Atlas](https://www.mongodb.com/cloud/atlas) and register for a free account.
2. **Create a Free Cluster**:
   - Choose the Shared/M0 FREE tier.
   - Choose your preferred cloud provider (e.g., AWS) and region close to you.
   - Click **Create**.
3. **Configure Database Access**:
   - Create a database user (e.g., `db_admin`).
   - Set a strong password (remember to copy it).
4. **Configure Network Access**:
   - Go to **Network Access** in the left sidebar.
   - Click **Add IP Address**.
   - Select **Allow Access from Anywhere** (`0.0.0.0/0`) since Render's free tier uses dynamic outgoing IPs.
   - Click **Confirm**.
5. **Get Connection String**:
   - Go to **Database** (clusters overview).
   - Click **Connect** on your cluster.
   - Choose **Drivers** (Node.js).
   - Copy the connection string. It will look like:
     `mongodb+srv://db_admin:<password>@cluster0.xxxx.mongodb.net/?retryWrites=true&w=majority&appName=Cluster0`
   - Replace `<password>` with your database user password.

---

## Step 3: Deploy Backend on Render

1. Go to [Render](https://render.com/) and sign in with your GitHub account.
2. Click **New +** in the dashboard and select **Web Service**.
3. Link your GitHub repository.
4. Configure the Web Service:
   - **Name**: `dynamic-form-builder-backend`
   - **Root Directory**: `backend`
   - **Runtime**: `Node`
   - **Build Command**: `npm install && npm run build`
   - **Start Command**: `npm start`
   - **Plan**: `Free`
5. **Add Environment Variables**:
   Click **Advanced** and add these variables:
   - `MONGODB_URI` = `<Your MongoDB Atlas connection string>`
   - `JWT_SECRET` = `<Create a random strong secret string>`
   - `CLIENT_URL` = `<Your Vercel URL, e.g., https://dynamic-form-builder-seven.vercel.app>` *(You can update this after Step 4)*
   - `NODE_ENV` = `production`
6. Click **Create Web Service**. Render will build the TypeScript files and start listening. Note your backend URL (e.g., `https://dynamic-form-builder-backend.onrender.com`).

---

## Step 4: Deploy Frontend on Vercel

1. Go to [Vercel](https://vercel.com/) and sign in with your GitHub account.
2. Click **Add New** and select **Project**.
3. Import your GitHub repository.
4. Configure the Project:
   - **Framework Preset**: `Next.js`
   - **Root Directory**: Click edit and select `frontend`
   - **Build and Output Settings**: Default (Next.js automatically handles compilation)
5. **Add Environment Variables**:
   In the Environment Variables section, add:
   - `NEXT_PUBLIC_API_URL` = `https://<your-render-backend-subdomain>.onrender.com/api`
6. Click **Deploy**. Vercel will optimize your assets and deploy the frontend.

---

## Step 5: Final Handshake (CORS alignment)

Once Vercel finishes deploying, copy the URL of your live site (e.g., `https://dynamic-form-builder-seven.vercel.app`).
1. Go back to your **Render Backend Web Service dashboard**.
2. Click **Environment**.
3. Update the `CLIENT_URL` variable to your new Vercel URL.
4. Save changes. Render will automatically redeploy the backend with the new CORS policy.

Your application is now fully live and accessible!
