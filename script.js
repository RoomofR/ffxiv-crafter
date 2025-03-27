import { FFXIV_VERSION, getFFXIVItemData, Craft_Job_Type as CraftJobType, Job_Unicodes } from "./src/Data.js"
import { CraftApp } from "./src/views/CraftApp.js";

/*const manualCodeImport = "46057,2;46058,2;46060,2;46061,2;46075,2;46080,2;46085,3;";
ItemList = parseListCode(manualCodeImport);
console.log(ItemList)
updateItemList();*/

/*ItemList = parseAllaganList();
updateItemList();*/

//Temp market data
/*let marketData = Object.keys(ItemData.items).filter(i=>ItemData.items[i].name.includes("Ceremonial") && !ItemData.items[i].name.includes("Ornate") && ItemData.items[i].iLvl >= 740)
marketData = marketData.map(m=>ItemData.items[m])
console.log(marketData,marketData.length)*/

//== View ===================================================================
var Root = document.body;
//46057,2;46058,2;46060,2;46061,2;46075,2;46080,2;46085,3;
//46032,1;46034,1;46035,1;46036,1;46062,1;46063,1;46065,1;46066,1;46067,1;46071,1;46072,1;46077,1;46081,1;46082,2;46086,2;
//App
async function getMBData(item_ids) {
	console.log(item_ids);
	const data_center = "lich";
	const url = `https://universalis.app/api/v2/aggregated/${data_center}/${item_ids.join(",")}`;
	try {
		const response = await fetch(url);
		if (!response.ok) {
			throw new Error(`Response status: ${response.status}`);
		}

		const json = await response.json();
		console.log(json);
	} catch (error) {
		console.error(error.message);
	}
}

//const mbdata = await getMBData([...marketData.map(m=>m.id),...lvl100_3starmats]);
//console.log(mbdata)

var TestApp = {
	view: ()=>{
		return m("table", marketData.flatMap(row => m("tr",[
				m("td",row.id),
				m("td",row.name),
				row.recipes[0].inputItems.filter(ii => lvl100_3starmats.includes(ii.id)).flatMap(r=>[m("td",r.id),m("td",r.qty)])
			])))
	}
}

m.route.prefix = "";
m.route(Root,"/",{
	"/": CraftApp,
	"/test": TestApp,
});