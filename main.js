"use strict";

const {
	AbstractInputSuggest,
	ItemView,
	MarkdownView,
	Notice,
	Plugin,
	PluginSettingTab,
	Setting,
	TFile,
	TFolder,
	debounce,
	normalizePath,
} = require("obsidian");

const VIEW_TYPE = "hollow-knight-title";

/* -------------------------------------------------------------------------
   Menu entries
   ------------------------------------------------------------------------- */

const MENU = [
	{
		id: "continue",
		hallownest: "Continue",
		pharloom: "Continue",
		role: "Opens the last note you had open.",
		icon: { hallownest: "hallownest/bench", pharloom: "pharloom/bell" },
		lore: {
			hallownest: "The bench is cold now. Return to the last path you walked.",
			pharloom: "The bellway hums. Ride back to where you left off.",
		},
	},
	{
		id: "journal",
		hallownest: "Journal",
		pharloom: "Journal",
		role: "Opens today's daily note.",
		icon: { hallownest: "hallownest/journal", pharloom: "pharloom/journal" },
		lore: {
			hallownest: "Record what you hunted and what you learned today.",
			pharloom: "Stitch today's thoughts into the pilgrim's journal.",
		},
	},
	{
		id: "map",
		hallownest: "Map",
		pharloom: "Map",
		role: "Opens the graph.",
		icon: { hallownest: "hallownest/map", pharloom: "pharloom/compass" },
		lore: {
			hallownest: "Every tunnel you have walked, inked by a quiet hand.",
			pharloom: "The threads between your notes, drawn as a map.",
		},
	},
	{
		id: "charms",
		hallownest: "Charms",
		pharloom: "Crests",
		role: "Opens the command palette.",
		icon: { hallownest: "hallownest/charm", pharloom: "pharloom/crest" },
		lore: {
			hallownest: "Bind a new power to your shell.",
			pharloom: "Change your crest, and every skill it grants.",
		},
	},
	{
		id: "inventory",
		hallownest: "Inventory",
		pharloom: "Tools",
		role: "Opens the quick switcher.",
		icon: { hallownest: "hallownest/pouch", pharloom: "pharloom/spool" },
		lore: {
			hallownest: "Everything you carry, found in an instant.",
			pharloom: "Needle, thread and every tool you carry.",
		},
	},
	{
		id: "pilgrim",
		hallownest: "Pilgrimage",
		pharloom: "Wishes",
		role: "A free slot. It stays hidden until you give it a target.",
		icon: { hallownest: "hallownest/lantern", pharloom: "pharloom/wish" },
		lore: {
			hallownest: "A path of your own choosing, lit by a single lantern.",
			pharloom: "A wish pinned to the board, waiting to be answered.",
		},
	},
];

/* Menu styles per kingdom. The first one listed is the default. */
const MENU_STYLES = {
	hallownest: ["inventory", "arc", "classic"],
	pharloom: ["ring", "bells", "classic"],
};

const ICONS = {
	"hallownest/bench": "<svg xmlns=\"http://www.w3.org/2000/svg\" viewBox=\"0 0 24 24\" fill=\"none\" stroke=\"currentColor\" stroke-width=\"1.5\" stroke-linecap=\"round\" stroke-linejoin=\"round\"><path d=\"M5 10V6.5C5 5.1 6.1 4 7.5 4h9C17.9 4 19 5.1 19 6.5V10\"/><path d=\"M9 7.2c1-1 2 .9 3 0s2-1 3 0\"/><path d=\"M3.5 10h17M3 13.5h18M5.5 13.5V20M18.5 13.5V20M8 13.5v3M16 13.5v3\"/></svg>",
	"hallownest/charm": "<svg xmlns=\"http://www.w3.org/2000/svg\" viewBox=\"0 0 24 24\" fill=\"none\" stroke=\"currentColor\" stroke-width=\"1.5\" stroke-linecap=\"round\" stroke-linejoin=\"round\"><circle cx=\"12\" cy=\"12\" r=\"8\"/><path d=\"M12 3v2.5M12 18.5V21M3 12h2.5M18.5 12H21\"/><path d=\"M12 8l3.4 4-3.4 4-3.4-4z\" fill=\"currentColor\" stroke=\"none\"/></svg>",
	"hallownest/crest": "<svg xmlns=\"http://www.w3.org/2000/svg\" viewBox=\"0 0 24 24\" fill=\"none\" stroke=\"currentColor\" stroke-width=\"1.5\" stroke-linecap=\"round\" stroke-linejoin=\"round\"><path fill-rule=\"evenodd\" d=\"M12 2.5l5.5 9.5-5.5 9.5-5.5-9.5z M12 7.5l-2.6 4.5 2.6 4.5 2.6-4.5z\" fill=\"currentColor\" stroke=\"none\"/></svg>",
	"hallownest/dream": "<svg xmlns=\"http://www.w3.org/2000/svg\" viewBox=\"0 0 24 24\" fill=\"none\" stroke=\"currentColor\" stroke-width=\"1.5\" stroke-linecap=\"round\" stroke-linejoin=\"round\"><path d=\"M15.5 3.6a8.5 8.5 0 1 0 4.9 12.1 7 7 0 0 1-4.9-12.1z\"/><path d=\"M17 7.5l.7 1.6 1.6.7-1.6.7L17 12l-.7-1.5-1.6-.7 1.6-.7z\" fill=\"currentColor\" stroke=\"none\"/></svg>",
	"hallownest/infection": "<svg xmlns=\"http://www.w3.org/2000/svg\" viewBox=\"0 0 24 24\" fill=\"none\" stroke=\"currentColor\" stroke-width=\"1.5\" stroke-linecap=\"round\" stroke-linejoin=\"round\"><path d=\"M12 3.2c2.9 0 4.9 2.1 5 4.8 1.9.6 3 2.2 3 4.1 0 2.5-1.9 4.4-4.5 4.4H8.5C5.9 16.5 4 14.6 4 12.2c0-1.9 1.2-3.4 3-4 .2-2.8 2.2-5 5-5z\"/><path d=\"M9 16.5V19M12.8 16.5v4M16 16.5V18\"/><circle cx=\"10\" cy=\"10.2\" r=\"1.3\" fill=\"currentColor\" stroke=\"none\"/><circle cx=\"14.6\" cy=\"11.6\" r=\"1\" fill=\"currentColor\" stroke=\"none\"/></svg>",
	"hallownest/journal": "<svg xmlns=\"http://www.w3.org/2000/svg\" viewBox=\"0 0 24 24\" fill=\"none\" stroke=\"currentColor\" stroke-width=\"1.5\" stroke-linecap=\"round\" stroke-linejoin=\"round\"><path d=\"M5 19.5v-15C5 3.7 5.7 3 6.5 3H19v15H6.5C5.7 18 5 18.7 5 19.5S5.7 21 6.5 21H19v-3\"/><path fill-rule=\"evenodd\" d=\"M12 6.5l2.6 3.5-2.6 3.5-2.6-3.5z M12 8.6l-1 1.4 1 1.4 1-1.4z\" fill=\"currentColor\" stroke=\"none\"/></svg>",
	"hallownest/lantern": "<svg xmlns=\"http://www.w3.org/2000/svg\" viewBox=\"0 0 24 24\" fill=\"none\" stroke=\"currentColor\" stroke-width=\"1.5\" stroke-linecap=\"round\" stroke-linejoin=\"round\"><path d=\"M9 5h6M10.5 5V3h3v2M8 7h8l-1.2 11H9.2z\"/><path d=\"M8 7c-1.2.3-1.6 1.2-1.6 2.2M16 7c1.2.3 1.6 1.2 1.6 2.2M9.2 18h5.6v2.5H9.2z\"/><path d=\"M12 9.8c1.4 1.3 1.4 3.4 0 4.8-1.4-1.4-1.4-3.5 0-4.8z\" fill=\"currentColor\" stroke=\"none\"/></svg>",
	"hallownest/map": "<svg xmlns=\"http://www.w3.org/2000/svg\" viewBox=\"0 0 24 24\" fill=\"none\" stroke=\"currentColor\" stroke-width=\"1.5\" stroke-linecap=\"round\" stroke-linejoin=\"round\"><path d=\"M3 6.5l6-2.5 6 2.5 6-2.5v13.5L15 20l-6-2.5L3 20z\"/><path d=\"M9 4v13.5M15 6.5V20\"/><path d=\"M5 14c1.6-.6 2.6.6 4 0s2.4-2.6 4-2.2 2.4.8 4 .2\" stroke-dasharray=\"1.2 1.6\"/><path d=\"M17 8.5l1.5 1.5M18.5 8.5L17 10\"/></svg>",
	"hallownest/pin": "<svg xmlns=\"http://www.w3.org/2000/svg\" viewBox=\"0 0 24 24\" fill=\"none\" stroke=\"currentColor\" stroke-width=\"1.5\" stroke-linecap=\"round\" stroke-linejoin=\"round\"><path d=\"M12 21.5c-3.2-4.1-6.5-7.7-6.5-11.5a6.5 6.5 0 0 1 13 0c0 3.8-3.3 7.4-6.5 11.5z\"/><path d=\"M12 6.2l2.3 3.3L12 12.8 9.7 9.5z\" fill=\"currentColor\" stroke=\"none\"/></svg>",
	"hallownest/pouch": "<svg xmlns=\"http://www.w3.org/2000/svg\" viewBox=\"0 0 24 24\" fill=\"none\" stroke=\"currentColor\" stroke-width=\"1.5\" stroke-linecap=\"round\" stroke-linejoin=\"round\"><path d=\"M8.5 6h7l-1.3 2.4c3 1.4 4.6 4.3 4.3 7.4-.4 3.1-3.2 5.2-6.5 5.2s-6.1-2.1-6.5-5.2C5.2 12.7 6.8 9.8 9.8 8.4z\"/><path d=\"M8.5 6C9.3 4 10.6 3 12 3s2.7 1 3.5 3\"/><path d=\"M10.3 15.2l1.4-2.4 2.3.9-.4 2.7-2.4.5z\" fill=\"currentColor\" stroke=\"none\"/></svg>",
	"hallownest/radiance": "<svg xmlns=\"http://www.w3.org/2000/svg\" viewBox=\"0 0 24 24\" fill=\"none\" stroke=\"currentColor\" stroke-width=\"1.5\" stroke-linecap=\"round\" stroke-linejoin=\"round\"><circle cx=\"12\" cy=\"12\" r=\"3.4\"/><path d=\"M12 2.5v5M12 16.5v5M2.5 12h5M16.5 12h5M5.3 5.3l3 3M15.7 15.7l3 3M18.7 5.3l-3 3M8.3 15.7l-3 3\"/></svg>",
	"hallownest/scroll": "<svg xmlns=\"http://www.w3.org/2000/svg\" viewBox=\"0 0 24 24\" fill=\"none\" stroke=\"currentColor\" stroke-width=\"1.5\" stroke-linecap=\"round\" stroke-linejoin=\"round\"><path d=\"M7 5.5h10.5a1.75 1.75 0 0 1 0 3.5H17v9.5a2 2 0 0 1-2 2H6.3a2 2 0 0 1 0-4H7z\"/><path d=\"M7 16.5V5.5a1.75 1.75 0 0 0-3.5 0V7H7M10 10h4M10 13h4\"/></svg>",
	"hallownest/soul": "<svg xmlns=\"http://www.w3.org/2000/svg\" viewBox=\"0 0 24 24\" fill=\"none\" stroke=\"currentColor\" stroke-width=\"1.5\" stroke-linecap=\"round\" stroke-linejoin=\"round\"><circle cx=\"12\" cy=\"12\" r=\"8\"/><path d=\"M12 7.2a4.8 4.8 0 1 1-4.6 6.2\"/><circle cx=\"12\" cy=\"12\" r=\"1.8\" fill=\"currentColor\" stroke=\"none\"/></svg>",
	"hallownest/tablet": "<svg xmlns=\"http://www.w3.org/2000/svg\" viewBox=\"0 0 24 24\" fill=\"none\" stroke=\"currentColor\" stroke-width=\"1.5\" stroke-linecap=\"round\" stroke-linejoin=\"round\"><path d=\"M6 21V8.5a6 6 0 0 1 12 0V21\"/><path d=\"M4 21h16M9.5 10h5M9 13h6M9 16h4\"/></svg>",
	"pharloom/bead": "<svg xmlns=\"http://www.w3.org/2000/svg\" viewBox=\"0 0 24 24\" fill=\"none\" stroke=\"currentColor\" stroke-width=\"1.5\" stroke-linecap=\"round\" stroke-linejoin=\"round\"><path d=\"M12 2.5v4M12 17.5v4\"/><circle cx=\"12\" cy=\"12\" r=\"5.2\" fill=\"currentColor\" stroke=\"none\"/></svg>",
	"pharloom/bell": "<svg xmlns=\"http://www.w3.org/2000/svg\" viewBox=\"0 0 24 24\" fill=\"none\" stroke=\"currentColor\" stroke-width=\"1.5\" stroke-linecap=\"round\" stroke-linejoin=\"round\"><path d=\"M12 2.5V4.6M12 4.6c-3.6 0-5 3-5.2 6.4L6 16l-1.6 2.2h15.2L18 16l-.8-5c-.2-3.4-1.6-6.4-5.2-6.4z\"/><path d=\"M10 20.4a2 2 0 0 0 4 0\"/></svg>",
	"pharloom/compass": "<svg xmlns=\"http://www.w3.org/2000/svg\" viewBox=\"0 0 24 24\" fill=\"none\" stroke=\"currentColor\" stroke-width=\"1.5\" stroke-linecap=\"round\" stroke-linejoin=\"round\"><circle cx=\"12\" cy=\"12\" r=\"8.5\"/><path d=\"M12 5l2.2 7L12 19l-2.2-7z\"/><path d=\"M12 5l2.2 7H9.8z\" fill=\"currentColor\" stroke=\"none\"/><circle cx=\"12\" cy=\"12\" r=\"0.9\" fill=\"currentColor\" stroke=\"none\"/></svg>",
	"pharloom/crest": "<svg xmlns=\"http://www.w3.org/2000/svg\" viewBox=\"0 0 24 24\" fill=\"none\" stroke=\"currentColor\" stroke-width=\"1.5\" stroke-linecap=\"round\" stroke-linejoin=\"round\"><path d=\"M12 3l7 3v5c0 5-3.2 8.5-7 10-3.8-1.5-7-5-7-10V6z\"/><path d=\"M12 6.5v11M8.4 10.3h7.2\"/><path d=\"M9.5 14c1.5-1 3.5-1 5 0\"/></svg>",
	"pharloom/ember": "<svg xmlns=\"http://www.w3.org/2000/svg\" viewBox=\"0 0 24 24\" fill=\"none\" stroke=\"currentColor\" stroke-width=\"1.5\" stroke-linecap=\"round\" stroke-linejoin=\"round\"><path d=\"M12 21c-3.3 0-5.5-2.3-5.5-5.3 0-3.5 3-5.4 3.5-9.4 2.5 1.8 3 4 2.6 5.6 1-.5 1.9-1.6 2.1-2.9 1.8 1.7 2.8 3.7 2.8 5.9 0 3.4-2.2 6.1-5.5 6.1z\"/><path d=\"M18 4.5h.01M20.2 8h.01M5.6 4h.01\" stroke-width=\"2.4\"/></svg>",
	"pharloom/flame": "<svg xmlns=\"http://www.w3.org/2000/svg\" viewBox=\"0 0 24 24\" fill=\"none\" stroke=\"currentColor\" stroke-width=\"1.5\" stroke-linecap=\"round\" stroke-linejoin=\"round\"><path d=\"M12 2.5c.9 3.3 5.5 5 5.5 10.2a5.5 5.5 0 0 1-11 0c0-2.6 1.3-4.3 2.7-5.3.2 1.9 1 3 2.1 3.4-.4-3 .1-5.6.7-8.3z\"/><path d=\"M12 20.2c-1.5 0-2.6-1.1-2.6-2.6 0-1.3.9-2.3 1.5-3.2.5.9.9 1.3 1.6 1.5.4-.8.4-1.6.2-2.4 1.4.9 2.1 2.2 2.1 3.6 0 1.8-1.2 3.1-2.8 3.1z\" fill=\"currentColor\" stroke=\"none\"/></svg>",
	"pharloom/journal": "<svg xmlns=\"http://www.w3.org/2000/svg\" viewBox=\"0 0 24 24\" fill=\"none\" stroke=\"currentColor\" stroke-width=\"1.5\" stroke-linecap=\"round\" stroke-linejoin=\"round\"><path d=\"M5 19.5v-15C5 3.7 5.7 3 6.5 3H19v15H6.5C5.7 18 5 18.7 5 19.5S5.7 21 6.5 21H19v-3\"/><path d=\"M8.5 15L16 6\"/><path d=\"M15.2 6.8c.7-1 1.8-1.3 2.3-.7\" /><path d=\"M8.5 15c-1 1.3-.6 2.3.6 2.2\" /></svg>",
	"pharloom/needle": "<svg xmlns=\"http://www.w3.org/2000/svg\" viewBox=\"0 0 24 24\" fill=\"none\" stroke=\"currentColor\" stroke-width=\"1.5\" stroke-linecap=\"round\" stroke-linejoin=\"round\"><path d=\"M4 20L17 7\"/><ellipse cx=\"18.4\" cy=\"5.6\" rx=\"2.2\" ry=\"1\" transform=\"rotate(-45 18.4 5.6)\"/><path d=\"M18 6c-4 2.5-1.5 6.5-6 8.5s-5 1-7.5 3.5\"/></svg>",
	"pharloom/pin": "<svg xmlns=\"http://www.w3.org/2000/svg\" viewBox=\"0 0 24 24\" fill=\"none\" stroke=\"currentColor\" stroke-width=\"1.5\" stroke-linecap=\"round\" stroke-linejoin=\"round\"><path d=\"M12 2.5v13\"/><path d=\"M12 15.5l-1.3 3.4L12 21.5l1.3-2.6z\" fill=\"currentColor\" stroke=\"none\"/><circle cx=\"12\" cy=\"5.2\" r=\"2.7\"/><path d=\"M12 9.5c3 0 5 1.2 6 3\"/></svg>",
	"pharloom/scroll": "<svg xmlns=\"http://www.w3.org/2000/svg\" viewBox=\"0 0 24 24\" fill=\"none\" stroke=\"currentColor\" stroke-width=\"1.5\" stroke-linecap=\"round\" stroke-linejoin=\"round\"><path d=\"M7 5.5h10.5a1.75 1.75 0 0 1 0 3.5H17v9.5a2 2 0 0 1-2 2H6.3a2 2 0 0 1 0-4H7z\"/><path d=\"M7 16.5V5.5a1.75 1.75 0 0 0-3.5 0V7H7M10 10h4M10 13h4\"/></svg>",
	"pharloom/spool": "<svg xmlns=\"http://www.w3.org/2000/svg\" viewBox=\"0 0 24 24\" fill=\"none\" stroke=\"currentColor\" stroke-width=\"1.5\" stroke-linecap=\"round\" stroke-linejoin=\"round\"><path d=\"M5.5 4h11M5.5 20h11M7.5 4v16M14.5 4v16\"/><path d=\"M7.5 8l7 1.8M7.5 11.2l7 1.8M7.5 14.4l7 1.8\"/><path d=\"M19 3.5L20.6 20\"/><circle cx=\"19\" cy=\"4.6\" r=\"0.7\"/></svg>",
	"pharloom/wish": "<svg xmlns=\"http://www.w3.org/2000/svg\" viewBox=\"0 0 24 24\" fill=\"none\" stroke=\"currentColor\" stroke-width=\"1.5\" stroke-linecap=\"round\" stroke-linejoin=\"round\"><path d=\"M6 5h12v12.5L15 20.5H6z\"/><path d=\"M15 20.5v-3h3\"/><circle cx=\"12\" cy=\"5\" r=\"1.6\" fill=\"currentColor\" stroke=\"none\"/><path d=\"M9 10h6M9 13h4\"/></svg>"
};

function icon(name) {
	return (typeof ICONS !== "undefined" && ICONS[name]) || "";
}

function kingdomKey() {
	return document.body.classList.contains("hk-kingdom-pharloom") ? "pharloom" : "hallownest";
}

function menuStyle() {
	const key = kingdomKey();
	const prefix = key === "pharloom" ? "hk-ph-menu-" : "hk-hn-menu-";
	for (const style of MENU_STYLES[key]) {
		if (document.body.classList.contains(prefix + style)) {
			return style;
		}
	}
	return MENU_STYLES[key][0];
}

const DEFAULT_SETTINGS = {
	actions: {
		continue: { show: true, label: "", icon: "", lore: "", type: "continue", target: "" },
		journal: { show: true, label: "", icon: "", lore: "", type: "command", target: "daily-notes:goto-today" },
		map: { show: true, label: "", icon: "", lore: "", type: "command", target: "graph:open" },
		charms: { show: true, label: "", icon: "", lore: "", type: "command", target: "command-palette:open" },
		inventory: { show: true, label: "", icon: "", lore: "", type: "command", target: "switcher:open" },
		pilgrim: { show: true, label: "", icon: "", lore: "", type: "note", target: "" },
	},
	titleText: null,
	wallpaper: "",
	wallpaperOpacity: 0.35,
	wordGoal: 500,
	maxMasks: 5,
	cardCooldown: 0,
	history: {},
	settingsVersion: 3,
};

const TYPE_NAMES = {
	continue: "Last note",
	note: "Note",
	folder: "Folder",
	command: "Command",
};

const IMAGE_FILE = /\.(png|jpe?g|webp|gif|avif)$/i;
const SUGGEST_CAP = 50;

/* -------------------------------------------------------------------------
   Ornaments (original artwork, drawn for this plugin)
   ------------------------------------------------------------------------- */

const SVG = {
	fleur:
		'<svg viewBox="0 0 52 20" aria-hidden="true"><g fill="none" stroke="currentColor" stroke-width="1.3" stroke-linecap="round"><path d="M15 10 C 9 9.6 4.5 7.6 3.4 4.6 C 2.6 2.4 4.4 1 6.1 1.9 C 7.6 2.7 7.1 4.8 5.4 4.7"/><path d="M15 10 C 9 10.4 4.5 12.4 3.4 15.4 C 2.6 17.6 4.4 19 6.1 18.1 C 7.6 17.3 7.1 15.2 5.4 15.3"/><path d="M21 10 C 18 7.4 14.2 6.6 11.6 7.6"/><path d="M21 10 C 18 12.6 14.2 13.4 11.6 12.4"/></g><path d="M12 9.3 L42 9.55 L51 10 L42 10.45 L12 10.7 Z" fill="currentColor"/><path d="M30 10 L33.5 6.8 L37 10 L33.5 13.2 Z" fill="currentColor"/><circle cx="9" cy="10" r="1.6" fill="currentColor"/></svg>',
	needle:
		'<svg viewBox="0 0 52 20" aria-hidden="true"><path fill-rule="evenodd" d="M10 9.4 L44 9.7 L51 10 L44 10.3 L10 10.6 C 7.5 10.6 6 10.4 6 10 C 6 9.6 7.5 9.4 10 9.4 Z M8.2 9.78 L11.6 9.78 L11.6 10.22 L8.2 10.22 Z" fill="currentColor"/><g fill="none" stroke="currentColor" stroke-width="1.1" stroke-linecap="round"><path d="M9.5 10 C 6 4 13 0.8 18 3 C 23 5.2 21 11 16.5 10.4 C 13 9.9 13.6 5.6 17.5 5.6 C 21 5.6 24 8 27 9.2"/><path d="M9.5 10 C 6.5 14 4 16.5 1.5 17"/></g></svg>',
	divider:
		'<svg viewBox="0 0 320 24" aria-hidden="true" preserveAspectRatio="xMidYMid meet"><path d="M0 12 L120 11.2 L138 12 L120 12.8 Z" fill="currentColor"/><path d="M320 12 L200 11.2 L182 12 L200 12.8 Z" fill="currentColor"/><g fill="none" stroke="currentColor" stroke-width="1.2" stroke-linecap="round"><path d="M151 12 C 145 12 142 7 137.5 8.2 C 134.5 9 135.3 12.6 138 12"/><path d="M169 12 C 175 12 178 7 182.5 8.2 C 185.5 9 184.7 12.6 182 12"/><path d="M151 12 C 146 13.5 144 17 141 16.4"/><path d="M169 12 C 174 13.5 176 17 179 16.4"/></g><path fill-rule="evenodd" d="M160 2 L166 12 L160 22 L154 12 Z M160 7.5 L157.4 12 L160 16.5 L162.6 12 Z" fill="currentColor"/><circle cx="160" cy="12" r="1.2" fill="currentColor"/></svg>',
	bell:
		'<svg viewBox="0 0 320 28" aria-hidden="true" preserveAspectRatio="xMidYMid meet"><g fill="none" stroke="currentColor" stroke-linecap="round"><path stroke-width="1.3" d="M0 15 C 30 12, 60 18, 90 15 S 130 13, 147 15"/><path stroke-width="0.7" d="M12 16 C 42 19, 72 12, 102 16 S 136 17, 147 16"/><path stroke-width="1.3" d="M320 15 C 290 12, 260 18, 230 15 S 190 13, 173 15"/><path stroke-width="0.7" d="M308 16 C 278 19, 248 12, 218 16 S 184 17, 173 16"/><path stroke-width="1.2" d="M160 6 L160 2.2"/></g><circle cx="160" cy="2" r="1.3" fill="currentColor"/><path d="M160 6 C 154.5 6 153.6 11.5 152.8 18 L150.5 21 L169.5 21 L167.2 18 C 166.4 11.5 165.5 6 160 6 Z" fill="currentColor"/><circle cx="160" cy="24.2" r="2" fill="currentColor"/></svg>',
	mask:
		'<svg viewBox="0 0 20 24" aria-hidden="true"><path fill-rule="evenodd" d="M4.2 1 C 3.4 4.6 4.2 7.4 6.2 8.8 C 4.4 10.6 3.6 13.4 4 16.6 C 4.6 20.8 7.2 23 10 23 C 12.8 23 15.4 20.8 16 16.6 C 16.4 13.4 15.6 10.6 13.8 8.8 C 15.8 7.4 16.6 4.6 15.8 1 C 14.6 4.2 12.8 6.6 10 6.9 C 7.2 6.6 5.4 4.2 4.2 1 Z M7.4 12.6 C 6.2 12.6 5.8 14.4 6 15.8 C 6.2 17.4 7 18 7.6 18 C 8.4 18 8.8 16.8 8.8 15.4 C 8.8 13.8 8.4 12.6 7.4 12.6 Z M12.6 12.6 C 13.8 12.6 14.2 14.4 14 15.8 C 13.8 17.4 13 18 12.4 18 C 11.6 18 11.2 16.8 11.2 15.4 C 11.2 13.8 11.6 12.6 12.6 12.6 Z"/></svg>',
	geo:
		'<svg viewBox="0 0 16 16" aria-hidden="true"><path d="M8 1.2 L13.6 4.2 L14.4 10.2 L9.6 14.8 L3.6 13.6 L1.6 7.6 L4.4 2.6 Z" fill="currentColor"/><path d="M8 1.2 L8.6 7.4 L14.4 10.2 M8.6 7.4 L3.6 13.6 M8.6 7.4 L1.6 7.6" fill="none" stroke="rgba(0,0,0,0.45)" stroke-width="0.8"/></svg>',
	rosary:
		'<svg viewBox="0 0 16 16" aria-hidden="true"><path d="M2 3 C 5 9, 11 9, 14 3" fill="none" stroke="currentColor" stroke-width="0.8"/><circle cx="3.6" cy="5.4" r="1.9" fill="currentColor"/><circle cx="8" cy="7.6" r="2.2" fill="currentColor"/><circle cx="12.4" cy="5.4" r="1.9" fill="currentColor"/><path d="M8 9.8 L8 14" stroke="currentColor" stroke-width="1"/><circle cx="8" cy="14.2" r="1.2" fill="currentColor"/></svg>',
	crest:
		'<svg viewBox="0 0 12 12" aria-hidden="true"><path fill-rule="evenodd" d="M6 0.5 L10 6 L6 11.5 L2 6 Z M6 3.6 L4.3 6 L6 8.4 L7.7 6 Z" fill="currentColor"/></svg>',
};

/* -------------------------------------------------------------------------
   Helpers
   ------------------------------------------------------------------------- */

function isPharloom() {
	return document.body.classList.contains("hk-kingdom-pharloom");
}

function bodyHas(cls) {
	return document.body.classList.contains(cls);
}

function cssNumber(name, fallback) {
	const raw = getComputedStyle(document.body).getPropertyValue(name);
	const value = parseFloat(raw);
	return Number.isFinite(value) ? value : fallback;
}

function reducedMotion() {
	return (
		bodyHas("hk-still") ||
		(window.matchMedia && window.matchMedia("(prefers-reduced-motion: reduce)").matches)
	);
}

function dayKey(date) {
	const d = date || new Date();
	const m = String(d.getMonth() + 1).padStart(2, "0");
	const day = String(d.getDate()).padStart(2, "0");
	return `${d.getFullYear()}-${m}-${day}`;
}

const WORD = /[\p{L}\p{N}][\p{L}\p{N}'’-]*/gu;

function countWords(text) {
	if (!text) {
		return 0;
	}
	const body = text.replace(/^---\r?\n[\s\S]*?\r?\n---\r?\n?/, "");
	const found = body.match(WORD);
	return found ? found.length : 0;
}

/* Parse a trusted, static SVG string into a node with DOMParser. */
const SVG_PARSER = new DOMParser();
function svgNode(markup) {
	if (!markup) {
		return null;
	}
	const source = markup.includes("xmlns=") ? markup : markup.replace("<svg", '<svg xmlns="http://www.w3.org/2000/svg"');
	const doc = SVG_PARSER.parseFromString(source, "image/svg+xml");
	const root = doc.documentElement;
	if (!root || root.nodeName === "parsererror" || root.querySelector("parsererror")) {
		return null;
	}
	return document.importNode(root, true);
}

function svgEl(parent, cls, markup) {
	const holder = parent.createSpan({ cls });
	const node = svgNode(markup);
	if (node) {
		holder.appendChild(node);
	}
	return holder;
}

function svgInto(el, markup) {
	el.empty();
	const node = svgNode(markup);
	if (node) {
		el.appendChild(node);
	}
}

function cleanPath(value) {
	const text = String(value || "").trim();
	return text ? normalizePath(text) : "";
}

function narrow(items, query, text) {
	const q = String(query || "").toLowerCase();
	return items.filter((item) => text(item).toLowerCase().includes(q)).slice(0, SUGGEST_CAP);
}

/* Autocomplete for the target and wallpaper fields. */
const PathSuggest = AbstractInputSuggest
	? class extends AbstractInputSuggest {
			constructor(app, inputEl, source, onPick) {
				super(app, inputEl);
				this.inputEl = inputEl;
				this.source = source;
				this.onPick = onPick;
			}

			getSuggestions(query) {
				return narrow(this.source(), query, (item) =>
					typeof item === "string" ? item : `${item.name} ${item.id}`
				);
			}

			renderSuggestion(item, el) {
				if (typeof item === "string") {
					el.setText(item);
					return;
				}
				el.createDiv({ text: item.name });
				el.createDiv({ text: item.id, cls: "hk-suggest-id" });
			}

			selectSuggestion(item) {
				const value = typeof item === "string" ? item : item.id;
				this.inputEl.value = value;
				this.inputEl.dispatchEvent(new Event("input", { bubbles: true }));
				this.onPick(value);
				this.close();
			}
		}
	: null;

/* -------------------------------------------------------------------------
   Particles: soul motes in Hallownest, silk and embers in Pharloom
   ------------------------------------------------------------------------- */

class Particles {
	constructor(canvas) {
		this.canvas = canvas;
		this.ctx = canvas.getContext("2d");
		this.items = [];
		this.frame = 0;
		this.last = 0;
		this.lastDraw = 0;
		this.running = false;
		this.paused = false;
		this.visible = true;
		this.speed = 1;
		this.glow = "159, 211, 255";
		this.sprites = {};
		this.resize = this.resize.bind(this);
		this.step = this.step.bind(this);
		this.observer = new ResizeObserver(this.resize);
		this.observer.observe(canvas);
		this.visObserver = null;
		if (typeof IntersectionObserver !== "undefined") {
			this.visObserver = new IntersectionObserver((entries) => {
				const entry = entries[entries.length - 1];
				this.visible = !!entry && entry.isIntersecting;
				if (this.visible) {
					this.resume();
				}
			});
			this.visObserver.observe(canvas);
		}
	}

	start() {
		this.running = true;
		this.paused = false;
		this.resize();
		this.seed();
		this.last = performance.now();
		this.lastDraw = 0;
		if (reducedMotion()) {
			this.draw();
			return;
		}
		this.frame = window.requestAnimationFrame(this.step);
	}

	stop() {
		this.running = false;
		window.cancelAnimationFrame(this.frame);
		this.observer.disconnect();
		if (this.visObserver) {
			this.visObserver.disconnect();
			this.visObserver = null;
		}
	}

	resume() {
		if (this.running && this.paused) {
			this.paused = false;
			this.last = performance.now();
			this.frame = window.requestAnimationFrame(this.step);
		}
	}

	resize() {
		const ratio = Math.min(window.devicePixelRatio || 1, 1.5);
		const w = this.canvas.clientWidth;
		const h = this.canvas.clientHeight;
		if (!w || !h) {
			return;
		}
		this.w = w;
		this.h = h;
		this.canvas.width = Math.round(w * ratio);
		this.canvas.height = Math.round(h * ratio);
		this.ctx.setTransform(ratio, 0, 0, ratio, 0, 0);
		if (this.running && this.items.length === 0) {
			this.seed();
		}
	}

	/* Soft round sprite, drawn once and reused with drawImage. */
	makeSprite(size, color, core, alpha) {
		const c = document.createElement("canvas");
		const px = Math.max(2, Math.ceil(size * 2));
		c.width = px;
		c.height = px;
		const g = c.getContext("2d");
		const r = px / 2;
		const grad = g.createRadialGradient(r, r, 0, r, r, r);
		grad.addColorStop(0, `rgba(${core}, ${alpha})`);
		grad.addColorStop(1, `rgba(${color}, 0)`);
		g.fillStyle = grad;
		g.fillRect(0, 0, px, px);
		return c;
	}

	seed() {
		this.pharloom = isPharloom();
		const lowPower = document.body.classList.contains("hk-low-power");
		const density = Math.max(0, cssNumber("--hk-particles", 1));
		this.speed = Math.max(0.05, cssNumber("--hk-particle-speed", 1));
		const style = getComputedStyle(document.body);
		this.glow = style.getPropertyValue("--hk-soul-rgb").trim() || (this.pharloom ? "224, 74, 82" : "159, 211, 255");
		const pale = this.pharloom ? "243, 233, 214" : "232, 238, 245";
		this.sprites = {
			mote: this.makeSprite(16, this.glow, pale, 1),
			dust: this.makeSprite(32, this.glow, this.glow, 0.08),
			emberRed: this.makeSprite(14, "255, 140, 90", "255, 140, 90", 1),
			emberGold: this.makeSprite(14, "216, 178, 90", "216, 178, 90", 1),
		};
		const area = ((this.w || 800) * (this.h || 600)) / 14000;
		let count = Math.round(Math.min(160, area) * density * 0.6);
		if (lowPower) {
			count = Math.round(count * 0.5);
		}
		this.items = [];
		for (let i = 0; i < count; i += 1) {
			this.items.push(this.make(true));
		}
	}

	make(anywhere) {
		const w = this.w || 800;
		const h = this.h || 600;
		if (this.pharloom) {
			const thread = Math.random() < 0.45;
			return {
				kind: thread ? "thread" : "ember",
				x: Math.random() * w,
				y: anywhere ? Math.random() * h : -20,
				vx: 6 + Math.random() * 14,
				vy: 10 + Math.random() * 18,
				len: 14 + Math.random() * 34,
				angle: Math.random() * Math.PI * 2,
				spin: (Math.random() - 0.5) * 0.8,
				size: thread ? 0.8 + Math.random() * 0.7 : 0.8 + Math.random() * 1.6,
				phase: Math.random() * Math.PI * 2,
				gold: Math.random() < 0.3,
			};
		}
		const big = Math.random() < 0.12;
		return {
			kind: big ? "dust" : "mote",
			x: Math.random() * w,
			y: anywhere ? Math.random() * h : h + 10,
			vx: (Math.random() - 0.5) * 6,
			vy: -(4 + Math.random() * (big ? 6 : 14)),
			size: big ? 10 + Math.random() * 22 : 0.6 + Math.random() * 1.8,
			phase: Math.random() * Math.PI * 2,
			sway: 6 + Math.random() * 16,
		};
	}

	step(now) {
		if (!this.running) {
			return;
		}
		const body = document.body;
		const hidden = !this.canvas.isConnected || this.canvas.offsetParent === null || !this.visible;
		if (document.hidden || body.classList.contains("hk-idle") || hidden) {
			this.paused = true;
			return;
		}
		const dt = Math.min(0.05, (now - this.last) / 1000) * this.speed;
		this.last = now;
		const w = this.w;
		const h = this.h;
		for (let i = 0; i < this.items.length; i += 1) {
			const p = this.items[i];
			p.phase += dt * 1.4;
			if (p.kind === "thread" || p.kind === "ember") {
				p.x += (p.vx + Math.sin(p.phase) * 8) * dt;
				p.y += p.vy * dt;
				p.angle += p.spin * dt;
				if (p.y > h + 40 || p.x > w + 40) {
					this.items[i] = this.make(false);
					this.items[i].x = Math.random() * w * 1.1 - w * 0.1;
				}
			} else {
				p.x += (p.vx + Math.cos(p.phase) * p.sway * 0.3) * dt;
				p.y += p.vy * dt;
				if (p.y < -40) {
					this.items[i] = this.make(false);
				}
			}
		}
		const interval = body.classList.contains("hk-low-power") ? 1000 / 15 : 1000 / 30;
		if (now - this.lastDraw >= interval) {
			this.lastDraw = now;
			this.draw();
		}
		this.frame = window.requestAnimationFrame(this.step);
	}

	draw() {
		const ctx = this.ctx;
		if (!this.w) {
			return;
		}
		ctx.clearRect(0, 0, this.w, this.h);
		const sprites = this.sprites;
		for (const p of this.items) {
			if (p.kind === "mote") {
				const a = 0.35 + 0.45 * (0.5 + 0.5 * Math.sin(p.phase * 2.2));
				const d = (p.size + 8) * 2;
				ctx.globalAlpha = a;
				ctx.drawImage(sprites.mote, p.x - d / 2, p.y - d / 2, d, d);
			} else if (p.kind === "dust") {
				const d = p.size * 2;
				ctx.globalAlpha = 1;
				ctx.drawImage(sprites.dust, p.x - p.size, p.y - p.size, d, d);
			} else if (p.kind === "thread") {
				const color = p.gold ? "216, 178, 90" : this.glow;
				ctx.globalAlpha = 1;
				ctx.strokeStyle = `rgba(${color}, 0.55)`;
				ctx.lineWidth = p.size;
				ctx.lineCap = "round";
				const dx = Math.cos(p.angle) * p.len * 0.5;
				const dy = Math.sin(p.angle) * p.len * 0.5;
				const bend = Math.sin(p.phase * 1.7) * p.len * 0.35;
				ctx.beginPath();
				ctx.moveTo(p.x - dx, p.y - dy);
				ctx.quadraticCurveTo(p.x + bend * Math.sin(p.angle), p.y - bend * Math.cos(p.angle), p.x + dx, p.y + dy);
				ctx.stroke();
			} else {
				const a = 0.4 + 0.5 * (0.5 + 0.5 * Math.sin(p.phase * 3));
				const d = (p.size + 6) * 2;
				ctx.globalAlpha = a;
				ctx.drawImage(p.gold ? sprites.emberGold : sprites.emberRed, p.x - d / 2, p.y - d / 2, d, d);
			}
		}
		ctx.globalAlpha = 1;
	}
}

/* -------------------------------------------------------------------------
   Title screen
   ------------------------------------------------------------------------- */

class TitleView extends ItemView {
	constructor(leaf, plugin) {
		super(leaf);
		this.plugin = plugin;
		this.particles = null;
		this.clock = 0;
	}

	getViewType() {
		return VIEW_TYPE;
	}

	getDisplayText() {
		return isPharloom() ? "Pharloom" : "Hallownest";
	}

	getIcon() {
		return "crown";
	}

	async onOpen() {
		this.render();
	}

	async onClose() {
		this.teardown();
		this.contentEl.empty();
	}

	teardown() {
		if (this.particles) {
			this.particles.stop();
			this.particles = null;
		}
		if (this.clock) {
			window.clearInterval(this.clock);
			this.clock = 0;
		}
	}

	render() {
		this.teardown();
		const plugin = this.plugin;
		const pharloom = isPharloom();
		const root = this.contentEl;
		root.empty();
		root.addClass("hk-title-root");
		root.toggleClass("is-pharloom", pharloom);
		if (typeof this.leaf.updateHeader === "function") {
			this.leaf.updateHeader();
		}

		const wall = root.createDiv({ cls: "hk-title-wall" });
		const picture = plugin.wallpaperUrl();
		if (picture) {
			wall.style.setProperty("--hk-wall-image", `url("${picture}")`);
			wall.style.setProperty("--hk-wall-opacity", String(plugin.settings.wallpaperOpacity));
		}
		root.createDiv({ cls: "hk-title-shade" });
		const canvas = root.createEl("canvas", { cls: "hk-title-particles", attr: { "aria-hidden": "true" } });

		const frame = root.createDiv({ cls: "hk-title-frame" });
		const ornament = pharloom ? SVG.bell : SVG.divider;
		svgEl(frame, "hk-title-crown", ornament);
		const name = plugin.titleName();
		const heading = frame.createEl("h1", { cls: "hk-title-name", text: name });
		const longest = Math.max(...name.split(/\s+/).map((word) => word.length), 6);
		heading.style.setProperty("--hk-chars", String(longest));
		svgEl(frame, "hk-title-rule", ornament);

		const sub = frame.createDiv({ cls: "hk-title-sub" });
		const when = sub.createSpan({ cls: "hk-title-date" });
		svgEl(sub, "hk-title-dot", SVG.crest);
		const time = sub.createSpan({ cls: "hk-title-clock" });
		const tick = () => {
			const now = new Date();
			when.setText(now.toLocaleDateString(undefined, { day: "numeric", month: "long", year: "numeric" }));
			time.setText(now.toLocaleTimeString(undefined, { hour: "numeric", minute: "2-digit" }));
		};
		tick();
		this.clock = window.setInterval(tick, 15000);

		const buttons = this.renderMenu(frame, pharloom);

		const lower = frame.createDiv({ cls: "hk-title-lower" });
		this.listColumn(lower, "Recent", plugin.recentNotes(), (file) => file.basename, (file) => {
			void this.leaf.openFile(file);
		});
		this.listColumn(lower, "Bookmarks", plugin.bookmarks(), (item) => plugin.bookmarkLabel(item), (item) => {
			void plugin.openBookmark(item, this.leaf);
		});

		this.particles = new Particles(canvas);
		if (cssNumber("--hk-particles", 1) > 0) {
			window.requestAnimationFrame(() => {
				if (this.particles) {
					this.particles.start();
				}
			});
		}
		// Focus the first entry only when nothing else is being used. Taking focus while the
		// user types in the settings window would close its autocomplete popups.
		window.setTimeout(() => {
			const doc = root.ownerDocument;
			const active = doc.activeElement;
			const idle = !active || active === doc.body || root.contains(active);
			if (buttons[0] && root.isConnected && idle && doc.hasFocus() &&
				this.app.workspace.getActiveViewOfType(TitleView) === this) {
				buttons[0].focus({ preventScroll: true });
			}
		}, 60);
	}

	/* ----- Menu styles ----- */

	renderMenu(frame, pharloom) {
		const plugin = this.plugin;
		const key = pharloom ? "pharloom" : "hallownest";
		const style = menuStyle();
		const entries = MENU.filter((entry) => plugin.entryShown(entry.id));
		const menu = frame.createEl("nav", {
			cls: `hk-title-menu hk-menu-${style}`,
			attr: { role: "navigation", "data-style": style },
		});
		this.buttons = [];
		this.entries = entries;
		this.key = key;
		this.cols = 0;
		this.thread = null;

		if (style === "classic") {
			this.renderClassic(menu, entries, pharloom);
		} else if (style === "inventory") {
			const grid = menu.createDiv({ cls: "hk-inv-grid" });
			for (const entry of entries) {
				this.slot(grid, entry, "hk-medallion");
			}
			this.cols = 3;
			this.descPane(menu, "hk-inv-desc", pharloom);
		} else if (style === "arc") {
			const row = menu.createDiv({ cls: "hk-arc-row" });
			const n = entries.length;
			entries.forEach((entry, i) => {
				const button = this.slot(row, entry, "hk-medallion");
				const offset = i - (n - 1) / 2;
				button.style.setProperty("--hk-arc", String(offset * offset));
			});
			this.descPane(menu, "hk-arc-desc", pharloom, true);
		} else if (style === "ring") {
			const ring = menu.createDiv({ cls: "hk-ring" });
			const ns = "http://www.w3.org/2000/svg";
			const svg = document.createElementNS(ns, "svg");
			svg.setAttribute("viewBox", "0 0 100 100");
			svg.setAttribute("class", "hk-ring-thread");
			svg.setAttribute("aria-hidden", "true");
			const orbit = document.createElementNS(ns, "circle");
			orbit.setAttribute("cx", "50");
			orbit.setAttribute("cy", "50");
			orbit.setAttribute("r", "38");
			orbit.setAttribute("class", "hk-ring-orbit");
			const path = document.createElementNS(ns, "path");
			path.setAttribute("pathLength", "1");
			path.setAttribute("class", "hk-ring-silk");
			svg.append(orbit, path);
			ring.appendChild(svg);
			this.thread = path;
			const core = ring.createDiv({ cls: "hk-ring-core" });
			svgEl(core, "hk-ring-core-icon", icon("pharloom/needle"));
			const n = entries.length;
			entries.forEach((entry, i) => {
				const button = this.slot(ring, entry, "hk-frame");
				const angle = ((-90 + (i * 360) / n) * Math.PI) / 180;
				const x = 50 + 38 * Math.cos(angle);
				const y = 50 + 38 * Math.sin(angle);
				button.style.setProperty("--hk-x", String(x));
				button.style.setProperty("--hk-y", String(y));
				button.dataset.x = String(x);
				button.dataset.y = String(y);
			});
			this.descPane(menu, "hk-ring-desc", pharloom);
		} else {
			const line = menu.createDiv({ cls: "hk-bells-line", attr: { "aria-hidden": "true" } });
			svgInto(
				line,
				'<svg viewBox="0 0 600 24" preserveAspectRatio="none"><path d="M0 6 C 100 20, 200 20, 300 12 S 500 2, 600 8" /></svg>'
			);
			const row = menu.createDiv({ cls: "hk-bells-row" });
			entries.forEach((entry, i) => {
				const button = this.slot(row, entry, "hk-bell");
				button.style.setProperty("--hk-string", `${30 + ((i * 17) % 3) * 14}px`);
				button.style.setProperty("--hk-delay", `${(i * 0.37) % 1.2}s`);
			});
			this.descPane(menu, "hk-bells-desc", pharloom, true);
		}

		menu.addEventListener("keydown", (evt) => this.menuKey(evt));
		if (style !== "classic" && this.buttons.length > 0) {
			this.select(0);
		}
		return this.buttons;
	}

	renderClassic(menu, entries, pharloom) {
		const plugin = this.plugin;
		const pointer = pharloom ? SVG.needle : SVG.fleur;
		for (const entry of entries) {
			const button = menu.createEl("button", {
				cls: "hk-title-item",
				attr: { type: "button", "data-entry": entry.id },
			});
			svgEl(button, "hk-ptr hk-ptr-left", pointer);
			button.createSpan({ cls: "hk-title-label", text: plugin.entryLabel(entry) });
			svgEl(button, "hk-ptr hk-ptr-right", pointer);
			button.addEventListener("mouseenter", () => button.focus({ preventScroll: true }));
			button.addEventListener("click", () => this.press(button, entry));
			this.buttons.push(button);
		}
	}

	slot(parent, entry, cls) {
		const label = this.plugin.entryLabel(entry);
		const index = this.buttons.length;
		// No aria-label: Obsidian turns it into a tooltip box. The label span names the button.
		const button = parent.createEl("button", {
			cls: `hk-slot ${cls}`,
			attr: { type: "button", "data-entry": entry.id },
		});
		const glyph = icon(this.plugin.entryIcon(entry, this.key));
		if (cls === "hk-bell") {
			button.createSpan({ cls: "hk-bell-string" });
			const body = button.createSpan({ cls: "hk-bell-body" });
			body.createSpan({ cls: "hk-bell-glow" });
			svgEl(body, "hk-slot-icon", glyph);
		} else {
			const face = button.createSpan({ cls: "hk-slot-face" });
			face.createSpan({ cls: "hk-slot-ring" });
			svgEl(face, "hk-slot-icon", glyph);
			const corners = button.createSpan({ cls: "hk-corners", attr: { "aria-hidden": "true" } });
			for (let i = 0; i < 4; i += 1) {
				corners.createSpan();
			}
		}
		button.createSpan({ cls: "hk-slot-label", text: label });
		button.addEventListener("mouseenter", () => button.focus({ preventScroll: true }));
		button.addEventListener("focus", () => this.select(index));
		button.addEventListener("click", () => this.press(button, entry));
		this.buttons.push(button);
		return button;
	}

	descPane(menu, cls, pharloom, caption) {
		const pane = menu.createDiv({ cls: `hk-desc ${cls}` });
		const ornament = pharloom ? SVG.bell : SVG.divider;
		if (!caption) {
			svgEl(pane, "hk-desc-rule hk-desc-rule-top", ornament);
		}
		const head = pane.createDiv({ cls: "hk-desc-head" });
		if (caption) {
			svgEl(head, "hk-ptr hk-ptr-left", pharloom ? SVG.needle : SVG.fleur);
		}
		this.descName = head.createSpan({ cls: "hk-desc-name" });
		if (caption) {
			svgEl(head, "hk-ptr hk-ptr-right", pharloom ? SVG.needle : SVG.fleur);
		}
		if (!caption) {
			svgEl(pane, "hk-desc-rule", ornament);
		}
		this.descLore = pane.createDiv({ cls: "hk-desc-lore" });
		this.descOpens = pane.createDiv({ cls: "hk-desc-opens" });
		if (!caption) {
			svgEl(pane, "hk-desc-rule hk-desc-rule-bottom", ornament);
		}
		this.desc = pane;
	}

	select(index) {
		const button = this.buttons[index];
		const entry = this.entries && this.entries[index];
		if (!button || !entry) {
			return;
		}
		this.selected = index;
		this.buttons.forEach((item, i) => item.toggleClass("is-selected", i === index));
		if (this.descName) {
			this.descName.setText(this.plugin.entryLabel(entry));
			this.descLore.setText(this.plugin.entryLore(entry, this.key));
			this.descOpens.setText(this.plugin.entryOpens(entry.id));
			if (this.desc && !reducedMotion()) {
				this.desc.removeClass("is-turning");
				void this.desc.offsetWidth;
				this.desc.addClass("is-turning");
			}
		}
		if (this.thread) {
			const x = parseFloat(button.dataset.x);
			const y = parseFloat(button.dataset.y);
			const mx = (50 + x) / 2;
			const my = (50 + y) / 2;
			const dx = x - 50;
			const dy = y - 50;
			const cx = mx - dy * 0.28;
			const cy = my + dx * 0.28;
			this.thread.setAttribute("d", `M50 50 Q ${cx.toFixed(2)} ${cy.toFixed(2)} ${x.toFixed(2)} ${y.toFixed(2)}`);
			this.thread.classList.remove("is-drawing");
			void this.thread.getBoundingClientRect();
			this.thread.classList.add("is-drawing");
		}
	}

	menuKey(evt) {
		const keys = ["ArrowUp", "ArrowDown", "ArrowLeft", "ArrowRight"];
		if (!keys.includes(evt.key) || this.buttons.length === 0) {
			return;
		}
		evt.preventDefault();
		const count = this.buttons.length;
		const current = Math.max(0, this.buttons.indexOf(document.activeElement));
		let next = current;
		if (this.cols > 0) {
			const step = { ArrowLeft: -1, ArrowRight: 1, ArrowUp: -this.cols, ArrowDown: this.cols }[evt.key];
			next = (current + step + count * this.cols) % count;
		} else {
			const step = evt.key === "ArrowDown" || evt.key === "ArrowRight" ? 1 : -1;
			next = (current + step + count) % count;
		}
		this.buttons[next].focus();
	}

	press(button, entry) {
		button.addClass("is-press");
		window.setTimeout(() => {
			button.removeClass("is-press");
			void this.plugin.runEntry(entry.id, this.leaf);
		}, 180);
	}

	listColumn(parent, label, items, text, open) {
		const column = parent.createDiv({ cls: "hk-title-column" });
		const head = column.createDiv({ cls: "hk-title-column-head" });
		head.createSpan({ text: label });
		svgEl(column, "hk-title-column-rule", isPharloom() ? SVG.bell : SVG.divider);
		// The heading names the list; no aria-label, which Obsidian would show as a tooltip.
		const list = column.createEl("ul");
		if (items.length === 0) {
			list.createEl("li", {
				cls: "hk-title-empty",
				text: label === "Recent" ? "No notes yet" : "No bookmarks yet",
			});
			return;
		}
		const glyph = icon(`${kingdomKey()}/${label === "Recent" ? "scroll" : "pin"}`);
		for (const item of items) {
			const li = list.createEl("li");
			const link = li.createEl("button", { cls: "hk-title-link", attr: { type: "button" } });
			svgEl(link, "hk-title-link-crest", glyph);
			link.createSpan({ text: text(item) });
			link.addEventListener("click", () => open(item));
		}
	}
}

/* -------------------------------------------------------------------------
   Settings tab
   ------------------------------------------------------------------------- */

class HallownestSettingTab extends PluginSettingTab {
	constructor(app, plugin) {
		super(app, plugin);
		this.plugin = plugin;
	}

	display() {
		const { containerEl } = this;
		const plugin = this.plugin;
		containerEl.empty();
		containerEl.addClass("hk-settings");

		containerEl.createEl("p", {
			cls: "setting-item-description",
			text: "The kingdom, the title menu style, colors, fog, particles, icons, and the on and off switches for cards, HUD and bench live in Style Settings under Hollow Knight and Silksong.",
		});

		new Setting(containerEl).setName("Title screen").setHeading();

		let titleInput = null;
		new Setting(containerEl)
			.setName("Title")
			.setDesc("The large name on the title screen. It starts as the vault name. Type anything else to use that, or clear the box to show the kingdom name.")
			.addText((text) => {
				titleInput = text;
				text
					.setPlaceholder(isPharloom() ? "Pharloom" : "Hallownest")
					.setValue(plugin.settings.titleText === null ? this.app.vault.getName() : plugin.settings.titleText)
					.onChange(async (value) => {
						plugin.settings.titleText = value;
						await plugin.saveSettings();
						plugin.refreshTitles();
					});
			})
			.addButton((button) =>
				button.setButtonText("Use vault name").onClick(async () => {
					plugin.settings.titleText = null;
					if (titleInput) {
						titleInput.setValue(this.app.vault.getName());
					}
					await plugin.saveSettings();
					plugin.refreshTitles();
				})
			);

		new Setting(containerEl)
			.setName("Wallpaper")
			.setDesc("Path of an image in your vault, shown behind the title screen. Leave blank for the plain dark.")
			.addText((text) => {
				text
					.setPlaceholder("Wallpapers/hallownest.jpg")
					.setValue(plugin.settings.wallpaper)
					.onChange(async (value) => {
						plugin.settings.wallpaper = cleanPath(value);
						await plugin.saveSettings();
						plugin.refreshTitles();
					});
				if (PathSuggest) {
					new PathSuggest(this.app, text.inputEl, () => plugin.imagePaths(), async (value) => {
						plugin.settings.wallpaper = value;
						await plugin.saveSettings();
						plugin.refreshTitles();
					});
				}
			});

		new Setting(containerEl)
			.setName("Wallpaper strength")
			.addSlider((slider) =>
				slider
					.setLimits(0.05, 1, 0.05)
					.setValue(plugin.settings.wallpaperOpacity)
					.setDynamicTooltip()
					.onChange(async (value) => {
						plugin.settings.wallpaperOpacity = value;
						await plugin.saveSettings();
						plugin.refreshTitles();
					})
			);

		new Setting(containerEl).setName("Menu").setHeading();
		for (const entry of MENU) {
			this.entrySettings(containerEl, entry);
		}

		new Setting(containerEl).setName("HUD").setHeading();

		new Setting(containerEl)
			.setName("Daily word goal")
			.setDesc("The soul vessel is full when you write this many words in a day.")
			.addText((text) =>
				text.setValue(String(plugin.settings.wordGoal)).onChange(async (value) => {
					const goal = parseInt(value, 10);
					if (Number.isFinite(goal) && goal > 0) {
						plugin.settings.wordGoal = goal;
						await plugin.saveSettings();
						plugin.updateHud();
					}
				})
			);

		new Setting(containerEl)
			.setName("Masks")
			.setDesc("How many masks the streak can fill. Each day in a row with writing fills one.")
			.addSlider((slider) =>
				slider
					.setLimits(3, 9, 1)
					.setValue(plugin.settings.maxMasks)
					.setDynamicTooltip()
					.onChange(async (value) => {
						plugin.settings.maxMasks = value;
						await plugin.saveSettings();
						plugin.updateHud();
					})
			);

		new Setting(containerEl)
			.setName("Reset today")
			.setDesc("Empties the soul vessel for today.")
			.addButton((button) =>
				button.setButtonText("Empty the vessel").onClick(async () => {
					plugin.settings.history[dayKey()] = 0;
					await plugin.saveSettings();
					plugin.updateHud();
				})
			);

		new Setting(containerEl).setName("Area title cards").setHeading();

		new Setting(containerEl)
			.setName("Quiet time (minutes)")
			.setDesc("A note shows its card again only after this long.")
			.addSlider((slider) =>
				slider
					.setLimits(0, 60, 1)
					.setValue(plugin.settings.cardCooldown)
					.setDynamicTooltip()
					.onChange(async (value) => {
						plugin.settings.cardCooldown = value;
						await plugin.saveSettings();
					})
			);
	}

	entrySettings(containerEl, entry) {
		const plugin = this.plugin;
		const action = plugin.settings.actions[entry.id];
		const title = `${entry.hallownest}${entry.pharloom !== entry.hallownest ? " / " + entry.pharloom : ""}`;
		const group = containerEl.createDiv({ cls: "hk-settings-entry" });
		group.createDiv({ cls: "hk-settings-entry-title", text: title });

		new Setting(group)
			.setName("Show and label")
			.setDesc(`${entry.role} Leave the label blank for the kingdom's word.`)
			.addToggle((toggle) =>
				toggle.setValue(action.show).onChange(async (value) => {
					action.show = value;
					await plugin.saveSettings();
					plugin.refreshTitles();
				})
			)
			.addText((text) =>
				text
					.setPlaceholder("Label")
					.setValue(action.label)
					.onChange(async (value) => {
						action.label = value;
						await plugin.saveSettings();
						plugin.refreshTitles();
					})
			);

		let targetInput = null;
		const opens = new Setting(group).setName("Opens").addDropdown((dropdown) => {
			const types = entry.id === "continue" ? ["continue", "note", "folder", "command"] : ["note", "folder", "command"];
			for (const type of types) {
				dropdown.addOption(type, TYPE_NAMES[type]);
			}
			dropdown.setValue(action.type).onChange(async (value) => {
				action.type = value;
				action.target = value === "continue" ? "" : action.target;
				if (targetInput) {
					targetInput.value = action.target;
					targetInput.disabled = value === "continue";
				}
				await plugin.saveSettings();
				plugin.refreshTitles();
			});
		});
		opens.addText((text) => {
			targetInput = text.inputEl;
			text
				.setPlaceholder("Target")
				.setValue(action.target)
				.onChange(async (value) => {
					action.target = value.trim();
					await plugin.saveSettings();
					plugin.refreshTitles();
				});
			text.inputEl.disabled = action.type === "continue";
			text.inputEl.addClass("hk-settings-target");
			if (PathSuggest) {
				new PathSuggest(this.app, text.inputEl, () => plugin.targetsFor(action.type), async (value) => {
					action.target = value;
					await plugin.saveSettings();
					plugin.refreshTitles();
				});
			}
		});

		new Setting(group)
			.setName("Icon")
			.setDesc("Shown on the inventory, arc, ring and bell menus.")
			.addDropdown((dropdown) => {
				dropdown.addOption("", "Kingdom default");
				for (const name of Object.keys(ICONS).sort()) {
					const [kingdom, glyph] = name.split("/");
					dropdown.addOption(name, `${kingdom === "pharloom" ? "Pharloom" : "Hallownest"}: ${glyph.replace(/-/g, " ")}`);
				}
				dropdown.setValue(action.icon || "").onChange(async (value) => {
					action.icon = value;
					await plugin.saveSettings();
					plugin.refreshTitles();
				});
			});

		new Setting(group)
			.setName("Description")
			.setDesc("The line under the name in the description pane. Leave blank for the built-in lore.")
			.addText((text) =>
				text
					.setPlaceholder(entry.lore[kingdomKey()])
					.setValue(action.lore || "")
					.onChange(async (value) => {
						action.lore = value;
						await plugin.saveSettings();
						plugin.refreshTitles();
					})
			);
	}
}

/* -------------------------------------------------------------------------
   Plugin
   ------------------------------------------------------------------------- */

module.exports = class HallownestPlugin extends Plugin {
	async onload() {
		await this.loadSettings();
		this.wordCounts = new Map();
		this.liveCounts = new Map();
		this.cardSeen = new Map();
		this.vaultWords = 0;
		this.scanned = false;
		this.lastRest = 0;

		this.registerView(VIEW_TYPE, (leaf) => new TitleView(leaf, this));
		this.syncIdle();
		this.registerDomEvent(window, "blur", () => this.syncIdle());
		this.registerDomEvent(window, "focus", () => this.syncIdle());
		this.registerDomEvent(document, "visibilitychange", () => this.syncIdle());
		this.addSettingTab(new HallownestSettingTab(this.app, this));

		this.addCommand({
			id: "open-title",
			name: "Return to the title screen",
			callback: () => void this.openTitle(),
		});
		this.addCommand({
			id: "rest-at-bench",
			name: "Rest at bench (save)",
			callback: () => {
				if (!this.app.commands.executeCommandById("editor:save-file") || !this.saveWrapped) {
					this.rest();
				}
			},
		});
		this.addCommand({
			id: "show-area-card",
			name: "Show the area title card",
			callback: () => {
				const file = this.app.workspace.getActiveFile();
				if (file) {
					this.showCard(file, true);
				}
			},
		});

		this.buildHud();
		this.saveSoon = debounce(() => void this.saveSettings(), 2000, true);
		this.hudSoon = debounce(() => this.updateHud(), 250, true);

		this.registerEvent(this.app.workspace.on("layout-change", () => this.onLayout()));
		this.registerEvent(this.app.workspace.on("css-change", () => this.onKingdomMaybe()));
		this.registerEvent(this.app.workspace.on("file-open", (file) => this.onFileOpen(file)));
		this.registerEvent(this.app.workspace.on("editor-change", (editor, info) => this.onEditorChange(editor, info)));
		this.registerEvent(this.app.vault.on("modify", (file) => this.onModify(file)));
		this.registerEvent(this.app.vault.on("delete", (file) => this.onDelete(file)));
		this.registerEvent(this.app.vault.on("rename", (file, old) => this.onRename(file, old)));

		this.kingdom = isPharloom();
		this.style = menuStyle();
		this.leafFiles = new WeakMap();
		this.bodyWatch = new MutationObserver(() => this.onKingdomMaybe());
		this.bodyWatch.observe(document.body, { attributes: true, attributeFilter: ["class"] });

		this.app.workspace.onLayoutReady(() => {
			this.wrapSave();
			this.onLayout();
			this.updateHud();
			window.setTimeout(() => void this.scanVault(), 1500);
		});
	}

	/* Ctrl+S runs Obsidian's save command, which swallows the key event.
	   Wrap the command itself so every save, by key or palette, rests at the bench. */
	wrapSave() {
		const commands = this.app.commands && this.app.commands.commands;
		const save = commands && commands["editor:save-file"];
		if (!save || this.saveWrapped) {
			return;
		}
		const plugin = this;
		const original = {};
		for (const key of ["callback", "checkCallback", "editorCallback", "editorCheckCallback"]) {
			if (typeof save[key] !== "function") {
				continue;
			}
			original[key] = save[key];
			const isCheck = key === "checkCallback" || key === "editorCheckCallback";
			save[key] = function (...args) {
				const result = original[key].apply(this, args);
				const checking = isCheck && args[0] === true;
				if (!checking && (!isCheck || result !== false)) {
					plugin.rest();
				}
				return result;
			};
		}
		this.saveWrapped = { save, original };
	}

	/* Idle when the window is hidden or unfocused: particles and CSS animations pause. */
	syncIdle() {
		const idle = document.hidden || !document.hasFocus();
		document.body.classList.toggle("hk-idle", idle);
		if (!idle) {
			this.resumeParticles();
		}
	}

	resumeParticles() {
		for (const leaf of this.app.workspace.getLeavesOfType(VIEW_TYPE)) {
			leaf.view.particles?.resume();
		}
	}

	onunload() {
		document.body.classList.remove("hk-idle");
		if (this.saveWrapped) {
			Object.assign(this.saveWrapped.save, this.saveWrapped.original);
			this.saveWrapped = null;
		}
		if (this.bodyWatch) {
			this.bodyWatch.disconnect();
		}
		document.querySelectorAll(".hk-area-card, .hk-bench-glow").forEach((el) => el.remove());
	}

	async loadSettings() {
		const stored = (await this.loadData()) || {};
		const actions = {};
		for (const entry of MENU) {
			const saved = stored.actions && stored.actions[entry.id] ? stored.actions[entry.id] : {};
			actions[entry.id] = Object.assign({}, DEFAULT_SETTINGS.actions[entry.id], saved);
		}
		this.settings = Object.assign({}, DEFAULT_SETTINGS, stored, { actions });
		this.settings.history = Object.assign({}, stored.history || {});
		const version = stored.settingsVersion || 1;
		if (version < 2) {
			// v0.1 saved a 10 minute quiet time, which hid most cards. Reset it once.
			this.settings.cardCooldown = DEFAULT_SETTINGS.cardCooldown;
		}
		if (version < 3 && (stored.titleText === "" || stored.titleText === undefined)) {
			// Before v0.3 an empty title was the default. The default is now the vault name.
			this.settings.titleText = null;
		}
		if (version < DEFAULT_SETTINGS.settingsVersion) {
			this.settings.settingsVersion = DEFAULT_SETTINGS.settingsVersion;
			if (Object.keys(stored).length > 0) {
				await this.saveData(this.settings);
			}
		}
	}

	titleName() {
		const text = this.settings.titleText;
		if (text === null || text === undefined) {
			return this.app.vault.getName();
		}
		return text.trim() || (isPharloom() ? "Pharloom" : "Hallownest");
	}

	entryIcon(entry, key) {
		const chosen = (this.settings.actions[entry.id] || {}).icon;
		return chosen && ICONS[chosen] ? chosen : entry.icon[key];
	}

	entryLore(entry, key) {
		const lore = ((this.settings.actions[entry.id] || {}).lore || "").trim();
		return lore || entry.lore[key];
	}

	/* Command ids move between Obsidian versions (daily notes is "daily-notes" in 1.14). */
	findCommand(id) {
		const commands = (this.app.commands && this.app.commands.commands) || {};
		const aliases = {
			"daily-notes:goto-today": ["daily-notes"],
			"daily-notes": ["daily-notes:goto-today"],
		};
		for (const candidate of [id].concat(aliases[id] || [])) {
			if (commands[candidate]) {
				return commands[candidate];
			}
		}
		return null;
	}

	entryOpens(id) {
		const action = this.settings.actions[id];
		if (!action) {
			return "";
		}
		if (action.type === "continue") {
			const path = this.app.workspace
				.getLastOpenFiles()
				.find((p) => this.app.vault.getAbstractFileByPath(p) instanceof TFile);
			return path ? `Opens ${path.split("/").pop().replace(/\.md$/i, "")}` : "Opens your last note";
		}
		if (action.type === "command") {
			const command = this.findCommand(action.target);
			if (!command) {
				return "That command is not available";
			}
			return (command.name || command.id).split(": ").pop();
		}
		if (action.type === "folder") {
			return `Opens the folder ${action.target}`;
		}
		return `Opens ${action.target.split("/").pop().replace(/\.md$/i, "")}`;
	}

	async saveSettings() {
		const keys = Object.keys(this.settings.history).sort();
		while (keys.length > 120) {
			delete this.settings.history[keys.shift()];
		}
		await this.saveData(this.settings);
	}

	/* ----- Kingdom changes ----- */

	onKingdomMaybe() {
		const now = isPharloom();
		const style = menuStyle();
		this.updateHud();
		if (now === this.kingdom && style === this.style) {
			return;
		}
		const kingdomChanged = now !== this.kingdom;
		this.kingdom = now;
		this.style = style;
		if (kingdomChanged) {
			this.buildHud();
			this.updateHud();
		}
		this.refreshTitles();
	}

	/* Settings call this on every keystroke, so redraw once typing pauses. */
	refreshTitles() {
		if (!this.refreshSoon) {
			this.refreshSoon = debounce(() => this.refreshTitlesNow(), 300, true);
		}
		this.refreshSoon();
	}

	refreshTitlesNow() {
		for (const leaf of this.app.workspace.getLeavesOfType(VIEW_TYPE)) {
			if (leaf.view instanceof TitleView) {
				leaf.view.render();
			}
		}
	}

	/* ----- Title screen ----- */

	onLayout() {
		if (this.opening) {
			return;
		}
		const leaf = this.app.workspace.getMostRecentLeaf();
		if (!leaf || leaf.getViewState().type !== "empty") {
			return;
		}
		this.opening = true;
		leaf.setViewState({ type: VIEW_TYPE, active: true }).finally(() => {
			this.opening = false;
		});
	}

	async openTitle() {
		const leaf = this.app.workspace.getLeaf(false);
		await leaf.setViewState({ type: VIEW_TYPE, active: true });
		this.app.workspace.revealLeaf(leaf);
	}

	entryShown(id) {
		const action = this.settings.actions[id];
		if (!action || !action.show) {
			return false;
		}
		if (action.type !== "continue" && !action.target) {
			return false;
		}
		return true;
	}

	entryLabel(entry) {
		const label = (this.settings.actions[entry.id].label || "").trim();
		if (label) {
			return label;
		}
		return isPharloom() ? entry.pharloom : entry.hallownest;
	}

	async runEntry(id, leaf) {
		const action = this.settings.actions[id];
		if (!action) {
			return;
		}
		if (action.type === "continue") {
			const path = this.app.workspace
				.getLastOpenFiles()
				.find((p) => this.app.vault.getAbstractFileByPath(p) instanceof TFile);
			if (!path) {
				new Notice("There is no journey to continue yet.");
				return;
			}
			await this.openNote(path, leaf);
			return;
		}
		if (action.type === "command") {
			const command = this.findCommand(action.target);
			if (!command || !this.app.commands.executeCommandById(command.id)) {
				new Notice("That command is not available.");
			}
			return;
		}
		if (action.type === "folder") {
			this.openFolder(action.target);
			return;
		}
		await this.openNote(action.target, leaf);
	}

	async openNote(path, leaf) {
		const file = this.app.vault.getAbstractFileByPath(cleanPath(path));
		if (!(file instanceof TFile)) {
			new Notice("That note is not in the vault.");
			return;
		}
		const target = leaf || this.app.workspace.getLeaf(false);
		await target.openFile(file);
	}

	openFolder(path) {
		const folder = this.app.vault.getAbstractFileByPath(cleanPath(path));
		if (!(folder instanceof TFolder)) {
			new Notice("That folder is not in the vault.");
			return;
		}
		const left = this.app.workspace.leftSplit;
		if (left && left.collapsed && typeof left.expand === "function") {
			left.expand();
		}
		const explorer = this.app.workspace.getLeavesOfType("file-explorer")[0];
		if (explorer && explorer.view && typeof explorer.view.revealInFolder === "function") {
			explorer.view.revealInFolder(folder);
			return;
		}
		new Notice("The file list is closed.");
	}

	recentNotes() {
		const found = [];
		for (const path of this.app.workspace.getLastOpenFiles()) {
			const file = this.app.vault.getAbstractFileByPath(path);
			if (file instanceof TFile && file.extension === "md") {
				found.push(file);
			}
			if (found.length >= 5) {
				break;
			}
		}
		if (found.length < 5) {
			const extra = this.app.vault
				.getMarkdownFiles()
				.filter((file) => !found.includes(file) && !file.path.startsWith("."))
				.sort((a, b) => b.stat.mtime - a.stat.mtime)
				.slice(0, 5 - found.length);
			found.push(...extra);
		}
		return found;
	}

	bookmarks() {
		const internal = this.app.internalPlugins;
		const entry =
			(internal && typeof internal.getPluginById === "function" && internal.getPluginById("bookmarks")) ||
			(internal && internal.plugins && internal.plugins.bookmarks);
		if (!entry || !entry.enabled || !entry.instance || !Array.isArray(entry.instance.items)) {
			return [];
		}
		const found = [];
		const walk = (items) => {
			for (const item of items) {
				if (found.length >= 5) {
					return;
				}
				if (item && item.type === "group" && Array.isArray(item.items)) {
					walk(item.items);
					continue;
				}
				if (!item || !item.path) {
					continue;
				}
				const file = this.app.vault.getAbstractFileByPath(item.path);
				if ((item.type === "file" && file instanceof TFile) || (item.type === "folder" && file instanceof TFolder)) {
					found.push(item);
				}
			}
		};
		walk(entry.instance.items);
		return found;
	}

	bookmarkLabel(item) {
		if (typeof item.title === "string" && item.title.trim()) {
			return item.title.trim();
		}
		const name = ((item.path || "").split("/").pop() || item.path).replace(/\.md$/i, "");
		// Heading and block bookmarks carry a subpath such as "#Tasks" or "#^abc123".
		return item.subpath ? `${name} ${item.subpath.replace(/^#\^?/, "› ")}` : name;
	}

	async openBookmark(item, leaf) {
		if (item.type === "folder") {
			this.openFolder(item.path);
			return;
		}
		const file = this.app.vault.getAbstractFileByPath(item.path);
		if (!(file instanceof TFile)) {
			new Notice("That note is not in the vault.");
			return;
		}
		const target = leaf || this.app.workspace.getLeaf(false);
		await target.openFile(file, item.subpath ? { eState: { subpath: item.subpath } } : undefined);
	}

	wallpaperUrl() {
		const path = cleanPath(this.settings.wallpaper);
		if (!path) {
			return "";
		}
		const file = this.app.vault.getAbstractFileByPath(path);
		if (!(file instanceof TFile)) {
			return "";
		}
		return this.app.vault.getResourcePath(file);
	}

	imagePaths() {
		return this.app.vault
			.getFiles()
			.filter((file) => IMAGE_FILE.test(file.path))
			.map((file) => file.path);
	}

	targetsFor(type) {
		if (type === "note") {
			return this.app.vault.getMarkdownFiles().map((file) => file.path);
		}
		if (type === "folder") {
			return this.app.vault
				.getAllLoadedFiles()
				.filter((file) => file instanceof TFolder && file.path && file.path !== "/")
				.map((file) => file.path);
		}
		if (type === "command") {
			const commands = (this.app.commands && this.app.commands.commands) || {};
			return Object.values(commands).map((command) => ({ id: command.id, name: command.name || command.id }));
		}
		return [];
	}

	/* ----- Area title cards ----- */

	onFileOpen(file) {
		if (!(file instanceof TFile) || file.extension !== "md") {
			return;
		}
		if (!this.liveCounts.has(file.path) && this.wordCounts.has(file.path)) {
			this.liveCounts.set(file.path, this.wordCounts.get(file.path));
		}
		this.cardWhenReady(file, 0);
	}

	/* The card belongs to the pane the note opened in. Switching focus between panes that
	   already show their notes is not entering a new area, so it shows no card. */
	cardWhenReady(file, tries) {
		const view = this.app.workspace.getActiveViewOfType(MarkdownView);
		if (!view || view.file !== file) {
			if (tries < 6) {
				window.requestAnimationFrame(() => this.cardWhenReady(file, tries + 1));
			}
			return;
		}
		if (this.leafFiles.get(view.leaf) === file.path) {
			return;
		}
		this.leafFiles.set(view.leaf, file.path);
		this.showCard(file, false, view);
	}

	showCard(file, force, knownView) {
		if (bodyHas("hk-no-cards")) {
			return;
		}
		const now = Date.now();
		const seen = this.cardSeen.get(file.path) || 0;
		if (!force && now - seen < this.settings.cardCooldown * 60000) {
			return;
		}
		const view = knownView || this.app.workspace.getActiveViewOfType(MarkdownView);
		if (!view || view.file !== file) {
			return;
		}
		this.cardSeen.set(file.path, now);
		const host = view.containerEl;
		host.querySelectorAll(".hk-area-card").forEach((el) => el.remove());
		const pharloom = isPharloom();
		const still = reducedMotion();
		const hold = Math.min(10, Math.max(0.2, cssNumber("--hk-card-hold", 0.8)));
		const fadeIn = still ? 0.15 : 0.45;
		const fadeOut = still ? 0.2 : 0.6;
		const total = fadeIn + hold + fadeOut;

		const card = host.createDiv({ cls: "hk-area-card", attr: { "aria-hidden": "true" } });
		card.toggleClass("is-pharloom", pharloom);
		card.dataset.hold = String(hold);
		const parent = file.parent && file.parent.path !== "/" ? file.parent.name : this.app.vault.getName();
		card.createDiv({ cls: "hk-area-sub", text: parent });
		const name = card.createDiv({ cls: "hk-area-name", text: file.basename });
		svgEl(card, "hk-area-rule", pharloom ? SVG.bell : SVG.divider);

		const remove = () => card.remove();
		if (typeof card.animate !== "function") {
			card.addClass("is-shown");
			window.setTimeout(remove, total * 1000);
			return;
		}
		// Exact timing: fade in, hold for exactly the set seconds at full strength, fade out.
		const animation = card.animate(
			[
				{ opacity: 0, offset: 0 },
				{ opacity: 1, offset: fadeIn / total },
				{ opacity: 1, offset: (fadeIn + hold) / total },
				{ opacity: 0, offset: 1 },
			],
			{ duration: total * 1000, easing: "linear", fill: "forwards" }
		);
		if (!still) {
			name.animate([{ letterSpacing: "0.26em" }, { letterSpacing: "0.12em" }], {
				duration: (fadeIn + hold * 0.6) * 1000,
				easing: "cubic-bezier(0.2, 0.7, 0.2, 1)",
				fill: "forwards",
			});
		}
		animation.onfinish = remove;
		animation.oncancel = remove;
		window.setTimeout(remove, total * 1000 + 500);
	}

	/* ----- HUD ----- */

	buildHud() {
		if (!this.hud) {
			this.hud = this.addStatusBarItem();
			this.hud.addClass("hk-hud");
			this.hud.setAttribute("data-tooltip-position", "top");
			this.registerDomEvent(this.hud, "click", () => this.showStats());
		}
		const hud = this.hud;
		hud.empty();
		const pharloom = isPharloom();
		hud.toggleClass("is-pharloom", pharloom);

		const vessel = hud.createSpan({ cls: "hk-vessel" });
		const clipId = `hk-vessel-clip-${Math.random().toString(36).slice(2, 8)}`;
		let inner;
		if (pharloom) {
			inner =
				`<defs><clipPath id="${clipId}"><rect x="6" y="4" width="10" height="14" rx="1"/></clipPath></defs>` +
				`<rect class="hk-vessel-back" x="6" y="4" width="10" height="14" rx="1"/>` +
				`<g clip-path="url(#${clipId})"><rect class="hk-vessel-fill" x="0" y="22" width="22" height="22"/>` +
				`<path class="hk-vessel-threads" d="M6 7 L16 7 M6 10 L16 10 M6 13 L16 13 M6 16 L16 16"/></g>` +
				`<rect class="hk-vessel-cap" x="3.5" y="1.5" width="15" height="3" rx="1"/>` +
				`<rect class="hk-vessel-cap" x="3.5" y="17.5" width="15" height="3" rx="1"/>`;
		} else {
			inner =
				`<defs><clipPath id="${clipId}"><circle cx="11" cy="11" r="8.6"/></clipPath></defs>` +
				`<circle class="hk-vessel-back" cx="11" cy="11" r="8.6"/>` +
				`<g clip-path="url(#${clipId})"><rect class="hk-vessel-fill" x="0" y="22" width="22" height="22"/></g>` +
				`<circle class="hk-vessel-ring" cx="11" cy="11" r="9.6"/>` +
				`<path class="hk-vessel-shine" d="M6.5 8 C 7.5 5.6 9.4 4.6 11.4 4.5"/>`;
		}
		const svg = svgNode(`<svg viewBox="0 0 22 22" aria-hidden="true">${inner}</svg>`);
		vessel.appendChild(svg);
		this.vesselFill = svg.querySelector(".hk-vessel-fill");
		this.vessel = vessel;

		this.maskRow = hud.createSpan({ cls: "hk-masks" });
		const purse = hud.createSpan({ cls: "hk-purse" });
		svgEl(purse, "hk-purse-icon", pharloom ? SVG.rosary : SVG.geo);
		this.purseText = purse.createSpan({ cls: "hk-purse-count", text: "…" });
	}

	todayWords() {
		return this.settings.history[dayKey()] || 0;
	}

	streak() {
		const history = this.settings.history;
		const day = new Date();
		if (!(history[dayKey(day)] > 0)) {
			day.setDate(day.getDate() - 1);
		}
		let count = 0;
		while (history[dayKey(day)] > 0 && count < 3650) {
			count += 1;
			day.setDate(day.getDate() - 1);
		}
		return count;
	}

	updateHud() {
		if (!this.hud) {
			return;
		}
		const hidden = bodyHas("hk-no-hud");
		this.hud.toggleClass("is-hidden", hidden);
		if (hidden) {
			return;
		}
		const goal = Math.max(1, this.settings.wordGoal);
		const today = this.todayWords();
		const ratio = Math.min(1, today / goal);
		if (this.vesselFill) {
			this.vesselFill.setAttribute("y", String(22 - 22 * ratio));
		}
		this.vessel.toggleClass("is-full", ratio >= 1);

		const max = this.settings.maxMasks;
		const streak = this.streak();
		const filled = Math.min(max, streak);
		this.maskRow.empty();
		for (let i = 0; i < max; i += 1) {
			const mask = svgEl(this.maskRow, "hk-mask", SVG.mask);
			mask.toggleClass("is-filled", i < filled);
		}

		const pharloom = isPharloom();
		this.purseText.setText(this.scanned ? this.vaultWords.toLocaleString() : "…");
		const currency = pharloom ? "Rosaries" : "Geo";
		this.hud.setAttribute(
			"aria-label",
			`Soul: ${today.toLocaleString()} of ${goal.toLocaleString()} words today\n` +
				`Masks: ${streak} day${streak === 1 ? "" : "s"} in a row\n` +
				`${currency}: ${this.scanned ? this.vaultWords.toLocaleString() : "counting"} words in the vault`
		);
	}

	pulseVessel() {
		if (!this.vessel || reducedMotion()) {
			return;
		}
		this.vessel.removeClass("is-gain");
		void this.vessel.offsetWidth;
		this.vessel.addClass("is-gain");
	}

	showStats() {
		const goal = this.settings.wordGoal;
		const today = this.todayWords();
		const currency = isPharloom() ? "Rosaries" : "Geo";
		const fragment = createFragment((frag) => {
			frag.createDiv({ cls: "hk-notice-title", text: isPharloom() ? "Pilgrim's tally" : "Hunter's tally" });
			frag.createDiv({ text: `Soul: ${today.toLocaleString()} of ${goal.toLocaleString()} words today` });
			frag.createDiv({ text: `Masks: ${this.streak()} days in a row` });
			frag.createDiv({ text: `${currency}: ${this.scanned ? this.vaultWords.toLocaleString() : "still counting"}` });
		});
		const notice = new Notice(fragment, 5000);
		const el = notice.noticeEl || notice.containerEl;
		if (el) {
			el.addClass("hk-dialog-notice");
		}
	}

	onEditorChange(editor, info) {
		const file = info && info.file;
		if (!(file instanceof TFile) || file.extension !== "md") {
			return;
		}
		if (!this.pending) {
			this.pending = new Map();
		}
		window.clearTimeout(this.pending.get(file.path));
		this.pending.set(
			file.path,
			window.setTimeout(() => {
				this.pending.delete(file.path);
				const count = countWords(editor.getValue());
				const before = this.liveCounts.has(file.path)
					? this.liveCounts.get(file.path)
					: this.wordCounts.has(file.path)
					? this.wordCounts.get(file.path)
					: count;
				this.liveCounts.set(file.path, count);
				const gain = count - before;
				if (gain > 0) {
					const key = dayKey();
					this.settings.history[key] = (this.settings.history[key] || 0) + gain;
					this.saveSoon();
					this.pulseVessel();
				}
				this.hudSoon();
			}, 500)
		);
	}

	async scanVault() {
		const files = this.app.vault.getMarkdownFiles();
		let total = 0;
		for (let i = 0; i < files.length; i += 1) {
			const file = files[i];
			try {
				const count = countWords(await this.app.vault.cachedRead(file));
				this.wordCounts.set(file.path, count);
				total += count;
			} catch (error) {
				// Unreadable file: skip it.
			}
			if (i % 40 === 39) {
				await new Promise((resolve) => window.setTimeout(resolve, 0));
			}
		}
		this.vaultWords = total;
		this.scanned = true;
		this.updateHud();
	}

	onModify(file) {
		if (!(file instanceof TFile) || file.extension !== "md" || !this.scanned) {
			return;
		}
		if (!this.modifyTimers) {
			this.modifyTimers = new Map();
		}
		window.clearTimeout(this.modifyTimers.get(file.path));
		this.modifyTimers.set(
			file.path,
			window.setTimeout(async () => {
				this.modifyTimers.delete(file.path);
				const count = countWords(await this.app.vault.cachedRead(file));
				const before = this.wordCounts.get(file.path) || 0;
				this.wordCounts.set(file.path, count);
				this.vaultWords += count - before;
				this.hudSoon();
			}, 1500)
		);
	}

	onDelete(file) {
		if (!(file instanceof TFile) || !this.wordCounts.has(file.path)) {
			return;
		}
		this.vaultWords -= this.wordCounts.get(file.path);
		this.wordCounts.delete(file.path);
		this.liveCounts.delete(file.path);
		this.hudSoon();
	}

	onRename(file, old) {
		if (!(file instanceof TFile)) {
			return;
		}
		if (this.wordCounts.has(old)) {
			this.wordCounts.set(file.path, this.wordCounts.get(old));
			this.wordCounts.delete(old);
		}
		if (this.liveCounts.has(old)) {
			this.liveCounts.set(file.path, this.liveCounts.get(old));
			this.liveCounts.delete(old);
		}
	}

	/* ----- Bench ----- */

	rest() {
		if (bodyHas("hk-no-bench")) {
			return;
		}
		const now = Date.now();
		if (now - this.lastRest < 1500) {
			return;
		}
		this.lastRest = now;
		const view = this.app.workspace.getActiveViewOfType(MarkdownView);
		if (view && !reducedMotion()) {
			const host = view.containerEl;
			host.querySelectorAll(".hk-bench-glow").forEach((el) => el.remove());
			const glow = host.createDiv({ cls: "hk-bench-glow", attr: { "aria-hidden": "true" } });
			glow.toggleClass("is-pharloom", isPharloom());
			for (let i = 0; i < 14; i += 1) {
				const spark = glow.createSpan({ cls: "hk-bench-spark" });
				spark.style.setProperty("--hk-spark-x", String(8 + Math.random() * 84));
				spark.style.setProperty("--hk-spark-delay", `${(Math.random() * 0.5).toFixed(2)}s`);
				spark.style.setProperty("--hk-drift", `${Math.round((Math.random() - 0.5) * 40)}px`);
			}
			window.setTimeout(() => glow.remove(), 2200);
		}
		const fragment = createFragment((frag) => {
			const crest = frag.createSpan({ cls: "hk-notice-crest" });
			svgInto(crest, SVG.crest);
			frag.createSpan({ cls: "hk-notice-title", text: "Rested" });
		});
		const notice = new Notice(fragment, 1800);
		const el = notice.noticeEl || notice.containerEl;
		if (el) {
			el.addClass("hk-dialog-notice", "hk-bench-notice");
		}
	}
};
