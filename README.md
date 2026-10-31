# Axolotl Adventure 🦎

A 2D side-scrolling game for kids, made for playing on an iPad. You're an axolotl in an aquarium:
suck up every fish in the tank to light the portal, then swim through it to the next tank.

It's a Progressive Web App with no build step and no asset files. All art is drawn in code and all
sound is synthesized, so once it's installed it works offline.

## How to play

| Control | What it does |
| --- | --- |
| **D-pad** (bottom left) | Swim up, down, left and right |
| **SUCK** (middle of the d-pad) | Hold it to suck up fish in front of you |
| **Axolotl faces** (top right) | Change color any time: orange, black, blue, pink, gold |
| **Predator** button (tank 3) | Shape shift into a spiky axolotl predator |
| ❚❚ | Pause, restart the tank, go home, sound on/off |

You can hold SUCK with one finger and steer with another. On a computer, use the arrow keys or WASD,
**Space** to suck, **F** to shape shift and **P** to pause.

- **Piranha plants** pop out of their pots and snap at you. Getting bitten costs health.
- After you get hurt, a **magic pizza** appears. Catch it to heal.
- If your health runs out you start that tank over. Every tank starts with full health.
- Once every fish is gone, the **portal** on the right side of the tank lights up. Swim into it!

### The five tanks

1. **Minnow Meadow**: quick little minnows that dart away from you.
2. **Big Fish Reef**: big fish that wriggle and fight the suction.
3. **Evil Axolotl Cave**: evil axolotls chase and bite you. They're too strong to suck, so tap
   **Predator**, shape shift, and they'll run away scared.
4. **Rubber Ducky Bath**: rubber duckies float on the surface. Swim to the top and suck them down.
5. **The Giant Hand**: a kid's hand reaches into the tank and slams down. If it smushes you, it picks
   you up and drops you back in. When it lands on the sand, suck it! The hand yanks out and yells
   **"OW!"**. Do that 5 times to win, and you spit out every critter you ate as fireworks.

Tanks you've reached are unlocked on the title screen, and your color choice is saved.

## Put it on an iPad

1. Host the folder somewhere served over HTTPS (see GitHub Pages below).
2. On the iPad, open the URL in **Safari**.
3. Tap **Share**, then **Add to Home Screen**.
4. Launch it from the home screen. It runs full screen in landscape and works offline.

### GitHub Pages

`.github/workflows/pages.yml` deploys the game whenever `main` is pushed. One-time setup:
**Settings → Pages → Build and deployment → Source: GitHub Actions**. The game will then be at
`https://<user>.github.io/Axolotl-Adventure/`.

## Run it locally

```sh
python3 -m http.server 8123
# open http://localhost:8123
```

ES modules and the service worker need a real HTTP server, so opening `file://` won't work. To try
it on an iPad on the same Wi-Fi, open `http://<your-computer-ip>:8123`. The service worker only runs
on HTTPS or localhost, though, so offline mode needs the hosted version.

## Project layout

```
index.html            page shell: HUD, d-pad, overlays, iOS PWA meta tags
styles.css            touch-friendly layout using safe-area insets
manifest.webmanifest  PWA manifest (fullscreen, landscape)
sw.js                 offline cache (bump VERSION when files change)
js/main.js            boot, game loop, buttons, service worker registration
js/game.js            game state: suction, damage, portal, smush, fireworks finale
js/entities.js        player, fish/ducks/evil axolotls, piranha plants, pizza, portal
js/boss.js            the giant hand (tank 5)
js/levels.js          the five tanks and their color themes
js/draw.js            axolotl art (swim + suck animation) and the color-picker faces
js/art.js             fish, ducks, pizza, piranha plant, portal, hand
js/scene.js           tank scenery: water, light rays, sand, seaweed, decorations
js/particles.js       bubbles, suction streaks, sparkles, fireworks
js/audio.js           synthesized sound effects and music (WebAudio)
js/input.js           multi-touch d-pad and keyboard input
js/ui.js              HUD, toasts, title/pause/win screens
tools/                regenerates icons/*.png from the game's own art
```

To regenerate the icons, start the local server and run `node tools/make-icons.cjs` (needs Playwright).
