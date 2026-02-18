# GitHub Pages – Setup Guide

Your project is ready to be published online with **GitHub Pages**. These are the steps that only you can do (GitHub account and browser).

---

## What is already done in this repo

- **`.gitignore`** – Ignores OS/editor files so they are not committed.
- **Git repository** – Initialized locally; you can commit and push.
- **Static site** – `index.html` at the root is suitable for “Deploy from a branch” (no build step).

---

## What you need to do

### 1. Create a repository on GitHub

1. Go to [github.com](https://github.com) and sign in.
2. Click **“New repository”** (or **+** → **New repository**).
3. Choose a name (e.g. `svedese` or `green-fence-offert`).
4. Set visibility to **Public** (required for free GitHub Pages).
5. **Do not** add a README, .gitignore, or license (they already exist or we use a local .gitignore).
6. Click **“Create repository”**.

### 2. Connect this folder to GitHub and push

In a terminal, from this project folder (`svedese`), run (replace `YOUR_USERNAME` and `REPO_NAME` with your GitHub username and repo name):

```bash
git remote add origin https://github.com/YOUR_USERNAME/REPO_NAME.git
git add .
git commit -m "Initial commit – Green Fence offert app"
git branch -M main
git push -u origin main
```

When prompted, sign in with your GitHub account (or use a Personal Access Token if you use 2FA).

### 3. Enable GitHub Pages

1. On GitHub, open your repository.
2. Go to **Settings** → **Pages** (left sidebar).
3. Under **“Build and deployment”**:
   - **Source**: **Deploy from a branch**.
   - **Branch**: `main` (or the branch you push to).
   - **Folder**: **/ (root)**.
4. Click **Save**.

After a short while, your site will be available at:

- **https://YOUR_USERNAME.github.io/REPO_NAME/**

Example: if the repo is `green-fence-offert`, the URL is  
`https://YOUR_USERNAME.github.io/green-fence-offert/`.

---

## If the site uses a subpath (e.g. `/green-fence-offert/`)

GitHub Pages serves the site under `https://USERNAME.github.io/REPO_NAME/`, so all links must work with that path. If you use relative paths (e.g. `href="css/style.css"`), they usually work. If something breaks (e.g. CSS or JS not loading), you may need to add a base tag or use a path prefix in your HTML/JS. You can fix that after the first deploy.

---

## Optional: custom domain

In **Settings** → **Pages** you can add a **Custom domain** (e.g. `offert.greenfence.se`). GitHub will show the DNS records to add at your domain provider.

---

## Summary – what was done here vs. what you do

| Done in this repo | You do |
|-------------------|--------|
| `.gitignore` added | Create repo on GitHub |
| `git init` run | Add remote and push |
| Project ready for static deploy | Enable Pages in Settings → Pages |

After you push and enable Pages, the site will go online automatically on every push to the selected branch.
