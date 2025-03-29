import { FFXIV_VERSION, getFFXIVItemData, Craft_Job_Type as CraftJobType, Job_Unicodes } from "./src/Data.js"
import { CraftApp } from "./src/views/CraftApp.js";
import { MBApp } from "./src/views/MBApp.js";

var Root = document.body;
m.route.prefix = "#";

m.route(Root,"/",{
	"/": CraftApp,
	"/mb": MBApp,
});