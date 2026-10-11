# My Semester, in Scenes

Plain HTML, CSS and JavaScript. No build step.

## Files

- `episode-01-vibe-coding.html`: the Episode 01 page
- `css/styles.css`: colours, fonts, header, buttons, scroll reveal (shared by every page)
- `css/episode.css`: the episode page layout (shared by every episode)
- `css/launch-day-game.css`, `js/launch-day-game.js`: the "Launch Day" game
- `js/episode.js`: progress bar, key art parallax, scroll reveals
- `assets/`: images

## Run it locally

Open `episode-01-vibe-coding.html` in a browser, or run `npx serve .` from the repo root.

## Deploy on Vercel

Import the GitHub repository and set the framework to "Other". There is no build command.

There is no home page yet, so the site root shows nothing. Open `/episode-01-vibe-coding.html` until `index.html` exists.

## Add a new episode

1. Copy `episode-01-vibe-coding.html` to `episode-02-<title>.html`.
2. Edit the blocks marked with `<!-- ===== ... ===== -->` comments.
3. For the game, copy `js/launch-day-game.js` and its CSS, then rewrite the story data and scene views.
4. In Episode 01, turn the "Next episode" card into a link to the new page.

## Colours and motion

- Palette: change `data-palette` on `<html>` to `midnight-reel` (default), `paper-cobalt`, `cream-tomato` or `ink-lime`.
- Reveal style: change `data-reveal-style` on `<html>` to `rise` (default), `blur` or `fade`.
