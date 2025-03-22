//===========================================================================
const FFXIV_VERSION = "2025.02.27.0000.0000_3";
console.log(`FFXIV Crafter for FFXIV Data version ${FFXIV_VERSION}`, "meow");
//===========================================================================

const ItemData = await getFFXIVItemData(FFXIV_VERSION);
const Items_Keys = Object.keys(ItemData.items)

//== View Variables =========================================================
let SearchString = "";
let SearchResults = [];
let ItemList = JSON.parse(localStorage.getItem("ItemList")) || {};
let ItemListCode = updateItemListCode() || "";
let CraftList = [];

const lvl99crafted = [44022,44023,44000,44001,44011,44012,44061,44062,44033];
const lvl100_2starmats = [44149,44147,44148,44151,44150];
const lvl100_2_5starmats = [44847,44846];
let calcList = calculateHQItems(ItemList, [...lvl99crafted, ...lvl100_2starmats, ...lvl100_2_5starmats], 6004);
console.log(calcList);
CraftList = calcList.itemsToHQ;

/*const manualCodeImport = "44411,1;44412,NaN;44413,1;44414,1;44415,1;44416,1;44417,1;44418,1;44419,1;44420,1;44421,1;44422,1;44423,1;44424,1;44425,1;44426,1;44427,1;44428,1;44429,1;44430,1;44431,1;44432,1;44434,1;44435,1;44436,1;44437,1;44438,1;44439,1;44440,1;44441,1;";
ItemList = parseListCode(manualCodeImport);
console.log(ItemList)
updateItemList();*/

/*ItemList = parseAllaganList();
updateItemList();*/

//== View ===================================================================
var Root = document.body;

//Search Bar
var SearchBarComponent = {
	view: ()=>{
		return m("div", {id: "searchBox"},
		[
			m("label", {for: "search_text_box"},`Search (${SearchResults.length})`),
			m("input", {id: "search_text_box", type: "text", onkeyup: onSearchKey}),
			m("table", SearchResults.map(item => {
				if(item.event == "no results found") return m("tr",m("td",`No Results Found! Took ${item.time}ms.`));

				if(item.event == "loading") return m("tr", m("td", {class:"inline"}, [
						m("div",{class:"loader"},""),
						m("div",{style: "margin-left: 5px;"}, `Searching for items using "${SearchString}" terms.`)
					]))

				return m("tr",[
					m("td", item.id),
					m("td", item.classJobCategory),
					m("td", item.name),
					m("td", {class: "addBtn", onclick: ()=>{addItem(item.id)}} ,"[+]")
				])
			}
				
			)),
		]);
	}
}

//Item List
var ItemListComponent = {
	view: ()=>{
		return m("div", {id: "itemList"},
		[
			m("h6","Item List:"),
			m("div", Object.keys(ItemList).flatMap(item_id => {
				let item = ItemData.items[item_id];

				let itemNameComponent = m("div",{class:"inline"}, [
						m("div",`[${item_id}] ${ItemData.items[item_id].name} = ${ItemList[item_id]}`),
						m("div",{class:"removeBtn", onclick: ()=>{removeItem(item_id)}},`[-]`),
					]);
				//Item without recipe
				if(item.recipes.length == 0){
					return [
						itemNameComponent
					]
				}

				//Item with recipe
				return [
					itemNameComponent,
					m("div", {style: "margin-left: 15px;"},`↪ ${ItemData.items[item_id].recipes[0].progress}ℙ ${ItemData.items[item_id].recipes[0].quality}𝑸 ${ItemData.items[item_id].recipes[0].durability}ᴰ`),
					

					m("div", {style: "margin-left: 35px;"}, ItemData.items[item_id].recipes[0].inputItems.filter(input_item => input_item.bonusQuality > 0).map(input_item => 
						m("div", `${ItemData.items[input_item.id].name} x ${input_item.qty} ${input_item.bonusQuality || ""}𝑸`)
					))
				]
			}
				
			)),
			m("h6","List Code:"),
			m("code", ItemListCode),
		]);
	}
}

var CraftListComponent = {
	view: ()=>{
		console.log(CraftList);
		return m("div", {id: "craftList"},
		[
			m("div",CraftList.map(item => m("div",`${ItemData.items[item[0]].name} x ${item[1]}`)))
		]);
	}
}

//App
m.mount(Root,{
	view: ()=>{
		return m("div", {id: "app"},
		[
			m(SearchBarComponent),
			m(ItemListComponent),
			m(CraftListComponent),
		]);
	}
});

//== Event Functions ========================================================

let searchBarTimeout = null;
function onSearchKey(event){
	SearchString = event.target.value;
	clearTimeout(searchBarTimeout);

	SearchResults = (SearchString == "") ? [] : [{
			event: "loading"
		}];

	searchBarTimeout = setTimeout(searchItems, 200);
}

const MAX_SEARCH_RESULTS = 50;
const itemIDRegex = new RegExp(/id:(\d+)/,"i");
function searchItems(){
	let start = performance.now();
	SearchResults = [];

	//Don't search if blank
	if(SearchString.trim() == "") return;

	//Item id search tag
	const index_index_search = SearchString.match(itemIDRegex);
	if(index_index_search != null) SearchString = SearchString.replace(index_index_search[0], "").trim();

	const itemNameRegex = new RegExp(SearchString,"i");

	let result_count = 0;
	for(let item_id of Items_Keys){
		if(result_count >= MAX_SEARCH_RESULTS) break;

		let item = ItemData.items[item_id];
		let item_name = item.name;

		if(itemNameRegex.test(item_name)){

			if(index_index_search != null && Number(index_index_search[1]) != item_id) continue;

			SearchResults.push(item)
			result_count++;
		}
	}

	let queryTime = performance.now() - start;
	console.log(`Item query time: ${queryTime} ms`);

	if(result_count == 0){
		SearchResults.push({
			event: "no results found",
			time: queryTime
		})
	}
	m.redraw();
}

function addItem(item_id){
	console.log("adding",item_id)

	if(item_id in ItemList){
		ItemList[item_id]++;
	}else{
		ItemList[item_id] = 1;
	}

	updateItemList();
}

function removeItem(item_id){
	console.log("removing",item_id);

	if(item_id in ItemList){
		ItemList[item_id]--;

		if(ItemList[item_id] <= 0){
			delete ItemList[item_id];
		}

		updateItemList();
	}
}

function updateItemList(){
	localStorage.setItem("ItemList", JSON.stringify(ItemList));

	ItemListCode = updateItemListCode();
}

function updateItemListCode(){
	return Object.keys(ItemList).map(id=>`${id},${ItemList[id]};`).join("");
}

//== Functions ==============================================================
async function getFFXIVItemData(ffxivVersion){
	return new Promise((resolve, reject) => {
		protobuf.load("./data/data.proto", (err,root)=>{
			if(err) throw err;
			var ItemDataMessege = root.lookupType("ItemData");
			let start = performance.now();
			let protoStart = performance.now();
			fetch(`./data/ItemData_${ffxivVersion}.protobuf`, { cache: "force-cache" })
				.then(response => {
					console.log(`Fetch time: ${performance.now() - start} ms`)
					start = performance.now();
					return response.arrayBuffer();
				})
				.then(buffer => {
					let decodedObject = ItemDataMessege.decode(new Uint8Array(buffer));
					console.log(`Decode time: ${performance.now() - start} ms`);
					console.log(`Total protobuf time: ${performance.now() - protoStart} ms`);
					return resolve(decodedObject)
				})
		});
	})
}

function calculateHQItems(itemList, hqItemList, targetStartingQuality){
	let itemsToHQ = {}
	let totalHQCrafts = 0;

	itemList = structuredClone(itemList);

	for(let item_id of Object.keys(itemList)){
		let startingQuality = targetStartingQuality;
		let item = ItemData.items[item_id];
		let itemQtyToCraft = itemList[item_id];

		if(!item.canBeHq) continue; //Ignore not hq/non-craftable items

		let recipe = item.recipes[0]; //TODO make recipe selector

		let inputItems = recipe.inputItems
			.filter(item => hqItemList.includes(item.id) || hqItemList.length == 0)
			.sort((item_a, item_b) =>  (itemsToHQ[item_b.id] || 0) - (itemsToHQ[item_a.id] || 0));

		let subItemsToHQ = [];
		for(let inputItem of inputItems){
			if(startingQuality <= 0) break; //Reached target quality

			let max_qty = inputItem.qty;
			let needed_qty = Math.ceil(startingQuality / inputItem.bonusQuality);
			let calculated_qty = Math.min(max_qty, needed_qty);

			if(itemsToHQ[inputItem.id] == undefined)
				itemsToHQ[inputItem.id] = 0;

			itemsToHQ[inputItem.id] += calculated_qty * itemQtyToCraft;
			totalHQCrafts += calculated_qty * itemQtyToCraft;

			subItemsToHQ.push([inputItem.id,calculated_qty])

			startingQuality -= calculated_qty * inputItem.bonusQuality;
		}

		let canBeHq = true;
		if(startingQuality > 0){//Failed to reach target quality
			console.warn(`[HQ Item Calculator] FAILED to calculate for item [${item.id}:${item.name}] to reach target quality due to not enough items!`);
			canBeHq = false;
		}

		itemList[item_id] = {
			qty: itemQtyToCraft,
			hqItems: subItemsToHQ.sort((a,b)=>a[0]-b[0]).sort((a,b)=>b[1]-a[1]),
			canBeHq,
			recipe,
		}
	}

	return {
		itemList,
		itemsToHQ: Object.keys(itemsToHQ).map(item_id=>[Number(item_id),itemsToHQ[item_id]]).sort((a,b)=>a[0]-b[0]).sort((a,b)=>b[1]-a[1]),
		totalHQCrafts
	}
}

function parseAllaganList(){
	let allaganList = `Items :
	1x Everseeker's Saw 
	1x Everseeker's Cross-pein Hammer 
	1x Everseeker's Raising Hammer 
	1x Everseeker's Lapidary Hammer 
	1x Everseeker's Creasing Knife 
	1x Everseeker's Needle 
	1x Everseeker's Alembic 
	1x Everseeker's Bomb Frypan 
	1x Everseeker's Pickaxe 
	1x Everseeker's Hatchet 
	1x Everseeker's Fishing Rod 
	1x Everseeker's Claw Hammer 
	1x Everseeker's File 
	1x Everseeker's Pliers 
	1x Everseeker's Grinding Wheel 
	1x Everseeker's Awl 
	1x Everseeker's Spinning Wheel 
	1x Everseeker's Mortar 
	1x Everseeker's Culinary Knife 
	1x Everseeker's Sledgehammer 
	1x Everseeker's Garden Scythe 
	1x Everseeker's Headgear of Crafting 
	1x Everseeker's Armguards of Crafting 
	1x Everseeker's Slops of Crafting 
	1x Everseeker's Workboots of Crafting 
	1x Everseeker's Goggles of Gathering 
	1x Everseeker's Coat of Gathering 
	1x Everseeker's Gloves of Gathering 
	1x Everseeker's Kecks of Gathering 
	1x Everseeker's Shoes of Gathering `;

	allaganList = allaganList.split("\n");

	allaganList.shift();

	let listAsArr = allaganList.map(i=>{
		i = i.trim().split("x ");
		let id = ""
		for(let item_id in ItemData.items){
			if(ItemData.items[item_id].name == i[1]){
				id = item_id;
				break;
			}
		}
		return [Number(id),Number(i[0])];
	});

	return listAsArr.reduce((acc,cur)=>{
		acc[cur[0]] = cur[1];
		return acc;
	},{})
}

function parseListCode(code){
	return code.split(";").reduce((acc,cur)=>{
		cur = cur.split(",");
		acc[Number(cur[0])] = cur[1];
		return acc;
	},{})
}