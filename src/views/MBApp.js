import { Item_Data } from "../Data.js";

let marketData = Object.keys(Item_Data).filter(i=>Item_Data[i].name.includes("Ceremonial") && !Item_Data[i].name.includes("Ornate") && Item_Data[i].iLvl >= 740)
marketData = marketData.map(m=>Item_Data[m])
console.log(marketData,marketData.length)
const blacklisted_items = new Set([46071,46057])

async function getMBData(item_ids, data_center="light", update=true) {
	//Region = NA/EU/JP/OC
	//DC = Data Center (Elemental/Light/Chaos)
	//World = Lich/Odin/etc
	let cachedData = localStorage.getItem("mbData");
	
	if(cachedData != undefined && !update) return JSON.parse(cachedData);

	let json = {};
	console.log("Fetching mb data live!")
	const url = `https://universalis.app/api/v2/aggregated/${data_center}/${item_ids.join(",")}`;
	try {
		const response = await fetch(url);
		if (!response.ok) {
			throw new Error(`Response status: ${response.status}`);
		}

		json = await response.json();
		json = json.results
	} catch (error) {
		console.error(error.message);
	}

	localStorage.setItem("mbData", JSON.stringify(json));
	return json;
}

async function getMatsMBData(item_ids, data_center="light", update=true){
	//https://universalis.app/api/v2/light/46062
	let cachedData = localStorage.getItem("matsMBData");
	
	if(cachedData != undefined && !update) return JSON.parse(cachedData);
	let json = {};
	console.log("Fetching mats data live!")
	const url = `https://universalis.app/api/v2/${data_center}/${item_ids.join(",")}`;
	try {
		const response = await fetch(url);
		if (!response.ok) {
			throw new Error(`Response status: ${response.status}`);
		}

		json = await response.json();
		json = json.items
	} catch (error) {
		console.error(error.message);
	}

	localStorage.setItem("matsMBData", JSON.stringify(json));
	return json;
}

const lvl100_3starmats = [45974,45975,45976,45978,45977];//TODO REMOVE AND REFACTOR
const lvl100_3startomemats = [45984,45985,45986,45988,45987];//TODO REMOVE AND REFACTOR

const PriceTextComponent = (price) => m("td",{class:"inline",style:"text-align:right;"},[
	m("div",price.toLocaleString('en')),
	m("div",{class:"xivAppIcon",style:"padding-right:5px;"},String.fromCharCode(parseInt("F203",16))),
]);

var mbTableComponent = {
	view: ()=>{
		return m("table", 
		[
			m("tr",
				["ID","Item Name","Velocity","Min MB Price","Avg MB Price","V%","Min Precraft Cost","Min Mats Cost","Craft Profit","Market Cap"]
				.map(header => m("th", header))),
			...MB_Table.map(row => m("tr",[
				m("td",row.id),
				m("td",row.name),
				m("td",row.velocity.toFixed(2)),
				PriceTextComponent(row.minPrice),
				PriceTextComponent(row.avgPrice),
				m("td",row.variance),
				PriceTextComponent(row.inputPrecraftCost),
				PriceTextComponent(row.inputMatsCost),
				PriceTextComponent(row.craftProfit),
				PriceTextComponent(row.marketCap),
			]))
		]);
	}
}

var matsTableComponent = {
	view: ()=>{
		return m("table",[
			m("tr", lvl100_3startomemats.map(mat=>m("th",Item_Data[mat].name))),
			...Array.from(Array(10).keys()).map(index => m("tr",

				lvl100_3startomemats.map(nat=>m("td", `${mbdata2[nat].listings[index].pricePerUnit} ${mbdata2[nat].listings[index].worldName}`))
			))
		]);
	}
}

let mbdata = await getMBData([...marketData.map(m=>m.id),...lvl100_3starmats,...lvl100_3startomemats], "lich", false);
mbdata = mbdata.reduce((acc,cur)=>{
	acc[cur.itemId] = cur;
	return acc;
},{})

let MB_Table = updateMBTable();
console.log(getSellItems(MB_Table))


let mbdata2 = await getMatsMBData(lvl100_3startomemats,"light",false);
console.log(mbdata2)

function updateMBTable(){
	return marketData.map(row => {
		let inputs = row.recipes[0].inputItems.filter(ii => lvl100_3starmats.includes(ii.id));
		let minPrice = mbdata[row.id].hq.minListing.world.price;
		let avgPrice = mbdata[row.id].hq.averageSalePrice.world.price;
		let inputPrecraftCost =inputs.reduce((sum,cur)=>{
				return sum + cur.qty * mbdata[cur.id].hq.minListing.world.price
			},0);
		let inputMatsCost = inputs.reduce((sum,cur)=>{
				return sum + (cur.qty * mbdata[cur.id+10].nq.minListing.world.price * 2)
			},0)
		let craftProfit = Math.min(minPrice,avgPrice) - inputMatsCost;
		let velocity = mbdata[row.id].hq.dailySaleVelocity.world.quantity;
		let marketCap = velocity*craftProfit;

		return {
			id: row.id,
			name: row.name,
			minPrice,
			avgPrice,
			variance:Math.abs(avgPrice-minPrice)/avgPrice,
			inputPrecraftCost,
			inputMatsCost,
			craftProfit,
			velocity,
			marketCap
		}
	}).sort((a,b)=>b.marketCap - a.marketCap)
}

async function onRefreshTable(){
	let data = await getMBData([...marketData.map(m=>m.id),...lvl100_3starmats,...lvl100_3startomemats], "lich", true);
	mbdata = data.reduce((acc,cur)=>{
		acc[cur.itemId] = cur;
		return acc;
	},{})
	MB_Table = updateMBTable();
	console.log(getSellItems(MB_Table))

	mbdata2 = await getMatsMBData(lvl100_3startomemats,"light",true)

	m.redraw();
}

function getSellItems(table, marketRatio = 0.2, maxItems = 40, minVelocity = 10, maxPerItem = 4){
	let items_to_sell = [];
	let total = {
		profit: 0,
		cost: 0,
		qty: 0,
		sell: 0
	}
	for(let item of table){

		if(total.qty >= maxItems) break;

		if(blacklisted_items.has(item.id)) continue;

		if(item.velocity < minVelocity) continue;

		let qty_to_sell = Math.min(Math.ceil(item.velocity * marketRatio), maxItems-total.qty, maxPerItem);

		items_to_sell.push({
			id:item.id,
			qty:qty_to_sell
		})

		total.profit += item.craftProfit * qty_to_sell;
		total.cost += item.inputMatsCost * qty_to_sell;
		total.sell += Math.min(item.avgPrice, item.minPrice) * qty_to_sell;
		total.qty += qty_to_sell;
	}

	console.log(items_to_sell.map(r=>`${r.id},${r.qty}`).join(";"));

	return {
		items: items_to_sell,
		...total,
		profitPrecent: total.profit / total.sell,
	}
}

export let MBApp = {
	view: ()=>{
		return m("div", {id: "mbapp"},
		[
			m("div",{class:"inline"},[
				m("div","Marketboard Data"),
				m("button",{onclick:async ()=>{
					await onRefreshTable();
				},style:"margin-left: 35px;"},"Refresh"),
				]),
			m(matsTableComponent),
			m(mbTableComponent),
		]);
	}
}