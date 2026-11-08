# Hollow Knight and Silksong Companion

[![Get the theme](https://img.shields.io/badge/Get_the-Hallownest_theme-9fd3ff)](https://github.com/abdullahhasan42/hollow-knight-and-silksong-theme)
![Version](https://img.shields.io/badge/version-1.0.0-d8b25a)
![Obsidian](https://img.shields.io/badge/Obsidian-1.5%2B-7c3aed)
![License](https://img.shields.io/badge/license-MIT-lightgrey)

The companion to the [Hollow Knight and Silksong theme](https://github.com/abdullahhasan42/hollow-knight-and-silksong-theme). It turns empty tabs into a game title screen, fades in an area card whenever you open a note, adds a soul vessel HUD to the status bar, and rests at a bench when you save. It works without the theme, but it is drawn to match it.

<table>
<tr>
<td width="50%"><img src="screenshots/title-hallownest-inventory.jpg" alt="Hallownest title screen, Inventory panel"><br><sub><b>Hallownest, Inventory panel</b></sub></td>
<td width="50%"><img src="screenshots/title-pharloom-ring.jpg" alt="Pharloom title screen, Crest ring"><br><sub><b>Pharloom, Crest ring</b></sub></td>
</tr>
</table>

> [!TIP]
> **Pair it with the theme.** The colours, fonts, ornaments, callout icons and both kingdoms' styling come from the [Hollow Knight and Silksong](https://github.com/abdullahhasan42/hollow-knight-and-silksong-theme) theme. The plugin works with any theme, but it is drawn to match this one.

## Contents

- [Title screen](#title-screen)
- [Configure the menu](#configure-the-menu)
- [Area title cards](#area-title-cards)
- [HUD](#hud)
- [Bench](#bench)
- [Install](#install)
- [Privacy](#privacy)
- [Commands](#commands)

## Title screen

Every empty tab shows the title screen: the title (your vault name by default), the date and time, a game menu, and your recent notes and bookmarks side by side. Soul motes drift in Hallownest; silk threads and embers fall in Pharloom.

<table>
<tr>
<td width="50%"><img src="screenshots/title-hallownest-inventory.jpg" alt="Inventory panel"><br><sub><b>Inventory panel</b> (Hallownest default)</sub></td>
<td width="50%"><img src="screenshots/title-pharloom-ring.jpg" alt="Crest ring"><br><sub><b>Crest ring</b> (Pharloom default)</sub></td>
</tr>
<tr>
<td><img src="screenshots/title-hallownest-arc.jpg" alt="Medallion arc"><br><sub><b>Medallion arc</b> (Hallownest)</sub></td>
<td><img src="screenshots/title-pharloom-bells.jpg" alt="Hanging bells"><br><sub><b>Hanging bells</b> (Pharloom)</sub></td>
</tr>
<tr>
<td><img src="screenshots/title-hallownest-classic.jpg" alt="Classic Hallownest"><br><sub><b>Classic</b> (Hallownest)</sub></td>
<td><img src="screenshots/title-pharloom-classic.jpg" alt="Classic Pharloom"><br><sub><b>Classic</b> (Pharloom)</sub></td>
</tr>
</table>

Pick the style in **Style Settings, Hollow Knight and Silksong, Kingdom**. Move with the mouse or the arrow keys; press Enter or click to open.

## Configure the menu

In **Settings, Hollow Knight and Silksong Companion**:

- **Title**: starts as your vault name. Type anything else, or clear it to show the kingdom name. "Use vault name" puts the default back.
- **Wallpaper**: any image in your vault, behind the title screen.
- **Each menu entry**: show or hide it; its label; what it opens (last note, a note, a folder or any command, with autocomplete); its icon from the game icon set; its description line.

<table>
<tr>
<td width="50%"><img src="screenshots/settings-plugin-title.jpg" alt="Title and wallpaper settings"><br><sub>Title, wallpaper and the first menu entries.</sub></td>
<td width="50%"><img src="screenshots/settings-plugin-entry.jpg" alt="Menu entry settings"><br><sub>One entry: show, label, opens, icon, description.</sub></td>
</tr>
</table>

| Entry | Opens by default |
| --- | --- |
| Continue | Your last note |
| Journal | Today's daily note |
| Map | The graph |
| Charms / Crests | The command palette |
| Inventory / Tools | The quick switcher |
| Pilgrimage / Wishes | A free slot, hidden until you give it a target |

## Area title cards

Opening a note in a pane dims the pane and fades in the note's name, with its folder above it. The card stays fully visible for exactly the hold time set in Style Settings (default 0.8 seconds). Switching between panes that already show their notes does not show a card.

<table>
<tr>
<td width="50%"><img src="screenshots/card-hallownest.jpg" alt="Hallownest card"><br><sub>Hallownest</sub></td>
<td width="50%"><img src="screenshots/card-pharloom.jpg" alt="Pharloom card"><br><sub>Pharloom</sub></td>
</tr>
</table>

## HUD

| Part | Meaning |
| --- | --- |
| Soul vessel (silk spool in Pharloom) | Fills toward your daily word goal |
| Masks | One for each day in a row you wrote |
| Geo (Rosaries in Pharloom) | Words in your whole vault |

![Hallownest HUD](screenshots/ui-hallownest-hud.jpg)
![Pharloom HUD](screenshots/ui-pharloom-hud.jpg)

Click the HUD for a tally. Words count when you add them; deleting text does not drain the vessel.

<table>
<tr>
<td width="50%"><img src="screenshots/ui-hallownest-hud-tally.jpg" alt="Hunter's tally"><br><sub>Hunter's tally</sub></td>
<td width="50%"><img src="screenshots/ui-pharloom-hud-tally.jpg" alt="Pilgrim's tally"><br><sub>Pilgrim's tally</sub></td>
</tr>
</table>

## Bench

Every save, with Ctrl+S or the command, sends a glow up the pane and shows "Rested".

<table>
<tr>
<td width="50%"><img src="screenshots/ui-hallownest-bench.jpg" alt="Bench in Hallownest"><br><sub>Hallownest</sub></td>
<td width="50%"><img src="screenshots/ui-pharloom-bench.jpg" alt="Bench in Pharloom"><br><sub>Pharloom</sub></td>
</tr>
</table>

## Install

**From Obsidian** (recommended):
1. Open **Settings, Community plugins**, then select **Browse**.
2. Search for **Hollow Knight and Silksong Companion**, then select **Install** and **Enable**.

**With BRAT** (beta builds):
1. Install **BRAT** from Community plugins.
2. Run "BRAT: Add a beta plugin" with `abdullahhasan42/hollow-knight-and-silksong-plugin`.
3. Enable **Hollow Knight and Silksong Companion** under Community plugins.

**By hand:**
1. Download `main.js`, `manifest.json` and `styles.css` from the latest release.
2. Put them in `<your vault>/.obsidian/plugins/hollow-knight-hallownest/`.
3. Reload Obsidian and enable the plugin under Community plugins.

Install **Style Settings** too: the kingdom, the menu style and the visual switches live there.

<table>
<tr>
<td width="50%"><img src="screenshots/settings-style-kingdom.jpg" alt="Kingdom settings"><br><sub>Kingdom and menu styles</sub></td>
<td width="50%"><img src="screenshots/settings-style-companion-plugin.jpg" alt="Plugin switches"><br><sub>Particles, cards, HUD and bench switches</sub></td>
</tr>
</table>

## Privacy

The plugin makes no network requests and collects no data. It only reads your vault to count words, list recent notes and open the targets you choose.

## Performance

Particles draw at 30 frames a second (15 under Low power) and stop while Obsidian is in the background or the title tab is hidden. Animations follow your system's reduced motion setting and the theme's Still air switch.

## Commands

- Return to the title screen
- Rest at bench (save)
- Show the area title card

## License

MIT, see [LICENSE](LICENSE). The icons and ornaments are original drawings.

> [!WARNING]
> This is an unofficial fan project, made because the author loves these games. It is not affiliated with or endorsed by Team Cherry.
