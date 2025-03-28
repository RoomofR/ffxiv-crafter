import { Item_Data } from "../Data.js";

let marketData = Object.keys(Item_Data).filter(i=>Item_Data[i].name.includes("Ceremonial") && !Item_Data[i].name.includes("Ornate") && Item_Data[i].iLvl >= 740)
marketData = marketData.map(m=>Item_Data[m])
console.log(marketData,marketData.length)

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

const lvl100_3starmats = [45974,45975,45976,45978,45977];//TODO REMOVE AND REFACTOR
var mbTable = {
	view: ()=>{
		return m("table", marketData.flatMap(row => m("tr",[
				m("td",row.id),
				m("td",row.name),
				row.recipes[0].inputItems.filter(ii => lvl100_3starmats.includes(ii.id)).flatMap(r=>[m("td",r.id),m("td",r.qty)])
			])))
	}
}

//const mbdata = await getMBData([...marketData.map(m=>m.id),...lvl100_3starmats]);
//console.log(mbdata)

export let MBApp = {
	view: ()=>{
		return m("div", {id: "mbapp"},
		[
			m("div","Marketboard Data"),
			m(mbTable),
		]);
	}
}