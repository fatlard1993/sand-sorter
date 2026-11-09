# Sand Sorter

![Sand pouring down a drawn line into its jar](screenshot.png)

Sand pours from the sky. Draw lines to catch it and roll it into the jar of its own color. Fill every jar to win, then watch the score count up: every grain in the right jar is a point.

Ben dreamed this game up and keeps deciding what it does next; Claude, by way of [paude](https://github.com/fatlard1993/paude), does the building.

## Playing

- **Draw** with a finger or the mouse: a line catches sand the moment it's drawn. The **sponge** rubs lines out.
- **Win** by filling every jar with as much of its own color as it asks for. If the sand runs out and sits still for five seconds with a jar still short, the round is lost (❌): tap 🔄 to try again.
- **The score** is counted grain by grain once a won round settles:
  - **+1** for each grain in the jar of its own color.
  - **+3** for gold, which a wish drops: tap a shooting star as it flies by.
  - **+10** for a gem, which turns up now and then in the pour.
  - Gold and gems count in any jar.
  - **-1** for each grain in a jar of the wrong color.
  - **-1** for each bit of line, as the lines are rubbed out at the end. Short lines score more.

  Each level keeps its best score, and beating it is a party. ⏳ at the top is the best of every level added up.
- **47 levels** across eight worlds, each opened by winning the one before; 🗺️ picks any level already reached. Along the way:
  - paint boxes that change sand's color, and wind
  - jars, spouts and walls that slide
  - big and tiny sand, with a sieve pen to split them
  - gray dirt that belongs in no jar, and water to wash it away
  - whirlwinds that mix colors
  - ice that sand skates along
  - lava that burns sand up, and turns to rock where water meets it
  - a volcano that shoots sand up
  - monsters that sneak in to eat a jar's sand until a tap bonks them home

  Some levels hand out extra tools too: water pools or whirlwinds of your own to drop in. The big final level throws a moving spout, wind, a moving wall and paint in all at once.
- **Play together**: anyone who joins draws in their own color on the same board. The ➕👫 button shows a QR code for a phone to join with.

## Running it

A multiplayer web game on [web-game-framework](https://github.com/fatlard1993/web-game-framework) and [@vanilla-bean/components](https://github.com/fatlard1993/vanilla-bean-components).

```sh
bun install
bun run dev
```

Then open http://localhost:3000, make a game, and join it from any device on the network. For production, `bun run build` then `bun start`.

- `sand.js` is the sand itself: how it falls, the levels, and the worlds they sit in.
- `Game.js` is one running game: its state and what each player's drawing does to it. The sand falls on the server, so every screen sees the same board.
- `server.js` runs the server and routes; `client/` is the page, with `Play.js` for the board.
- `data/games.json` holds the games between restarts.
