# Maths Quest - S1 Revision 🚀

An interactive, browser-based revision game built for S1 Mathematics. Designed to make studying the Summer Exam Revision Pack fun and engaging!

## Features 🎮
- **Topic Map:** 10 "worlds" covering numeracy, algebra, geometry, and statistics.
- **Procedural Questions:** No two questions are the same. Generates combinations based on real exam patterns.
- **Adaptive Difficulty:** Choose from Foundation, Standard, or Challenge tiers.
- **Gamification:** Earn XP, build up answer streaks, and level up your player profile.
- **Persistent Progress:** Saves strengths, weaknesses, and stats locally so you can pick up where you left off.
- **Mobile Ready:** Responsive design so it plays beautifully on a phone or iPad!

## Playing the Game 📱
This game runs entirely in the browser (HTML, CSS, JS). No server or database is required! 

1. **Locally:** Just open `index.html` in your web browser.
2. **On a Phone (via GitHub Pages):** Since the Progress dashboard saves everything using your browser's `localStorage`, you can host this repository on GitHub Pages for free! Note that progress is device-specific (progress on phone won't sync to iPad).

## How to publish to GitHub Pages 🌐
1. Create a new public repository on your GitHub account (e.g., named `maths-quest`). do not initialize it with a README.
2. Open terminal in this project folder and run:
   ```bash
   git remote add origin https://github.com/YOUR_USERNAME/maths-quest.git
   git branch -M main
   git push -u origin main
   ```
3. On GitHub, go to your repository's **Settings** > **Pages** (on the left sidebar).
4. Under **Build and deployment**, set the Source to **Deploy from a branch**.
5. Select the `main` branch, keep the folder as `/ (root)`, and click **Save**.
6. Wait 1-2 minutes, then refresh the page. At the top, it will tell you your live URL (e.g., `https://your-username.github.io/maths-quest/`).
7. Give that URL to Hugo to open on his phone!

## Resetting Progress ♻️
To wipe the slate clean, simply open the game, click **My Progress** on the home screen, and select the **Reset All Progress** button at the bottom.

## Project Structure 📁
- `index.html` - The UI and layout for all screens.
- `styles.css` - The dark theme, layout grids, and CSS animations.
- `app.js` - The core game engine with the score tracker and question generators.
- `S1 Summer Exam Revision Pack.pdf` - The original source material the game topics are based entirely on.
