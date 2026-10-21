# Project notes: My Semester, in Scenes

Saved 21 October 2026. This is the agreed final state of the site. Read this before changing anything.

## The assignment

- Class: Digital Platforms, ESSEC Business School, Singapore. Professor: Madina Kalyayeva.
- Individual project, graded every week.
- One website. Each guest speaker session gets its own episode page with an interactive game and my notes.
- Built with Claude chat, Claude Design, Claude Code, GitHub and Vercel.

## Links

- Live site (share this one): https://semesterinscenes.vercel.app/
- GitHub: https://github.com/b00836169-hub/GuestSpeaker
- Vercel publishes the `main` branch to the live link on every push. Other branches only get preview links. Never share those.
- Do not rename the Vercel domain or delete or disconnect the project or repo. That would change or break the link.

## What is live now

Home page (`index.html`), in this order:
1. Hero: scroll-scrubbed trailer, title "My Semester, in Scenes"
2. Episodes (p. 02): featured Episode 01 card, then a rail with E01 and "Coming soon" cards for E02 to E05
3. Thank you, Madina (p. 03): her photo with "Our professor" sticker, LinkedIn button (https://www.linkedin.com/in/madinak/), and this text:
   "Thank you, Madina, for encouraging us to look beyond the textbook. After just one session, I’m already looking forward to the next. Every great series has someone who brings the cast together, and for us, that’s you, keeping us curious and connected to the market."
4. Editor's letter (p. 04): my portrait with "Your narrator" sticker, "A note before we begin.", signed "Suditi Mandal"
5. Footer: "To be continued…"

Episode 01 page (`episode-01-vibe-coding.html`): Vibe Coding, 9 October 2026, with Rishabh Modi, Nirvan Anand and Yibo Yang (LaunchLab team, Singapore American School).
- Opener with session photo, guest stars, the "Launch Day Run" game, "What I took home" notes, next-episode card.

## Style

- Original palette only: navy background #0d0f1a, orange-red accent #ff5a36, yellow #ffc94a, cream text #f2eee6. Do not change colours.
- Fonts: Bricolage Grotesque, Newsreader (italic accents), JetBrains Mono.
- Photos have 12px rounded corners and are kept small. Text sizes were reduced on purpose.
- Game: one interactive game per episode, story or simulation style, cinematic motion-graphics look. No quizzes or matching games. Original characters only, no Powerpuff, GTA, Minions or brand mascots.

## Open item

- The LinkedIn buttons for Rishabh, Nirvan and Yibo on the Episode 01 page are still placeholders (href="#"). Add their links or remove the buttons.

## How to work on this site

- Always run git pull on main first.
- Build each change on a separate branch, show screenshots, and push to main only after I approve.
- Do not restore older versions or redesign sections unless I ask.
- Write in plain, simple English. No em dashes.

## Adding a new episode each week

1. Get the speaker name(s), roles, date, deck, photos, LinkedIn links and my notes.
2. Copy `episode-01-vibe-coding.html` to `episode-0N-<title>.html` and fill it in.
3. Design one new game for that session in the same style as Launch Day Run.
4. On the home page, turn that episode's "Coming soon" card into a real card, and make it the featured episode.
5. In the previous episode, link the "Next episode" card to the new page.
6. Test on desktop and phone, show me, then push to main.
