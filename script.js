//===========================================================================
const FFXIV_VERSION = "2025.03.18.0000.0000_1";
console.log(`FFXIV Crafter for FFXIV Data version ${FFXIV_VERSION}`, "meow");
//===========================================================================

const ItemData = await getFFXIVItemData(FFXIV_VERSION);
const Items_Keys = Object.keys(ItemData.items)
const CraftJobType = {
	0:"CPR",
	1:"BSM",
	2:"ARM",
	3:"GSM",
	4:"LTW",
	5:"WVR",
	6:"ALC",
	7:"CUL",
};
const Job_Unicodes = {
	"GLA":"F001",
	"PGL":"F002",
	"PGL":"F002",
	"MRD":"F003",
	"LNC":"F004",
	"ARC":"F005",
	"CNJ":"F006",
	"THM":"F007",
	//DoH
	"CPR":"F008",
	"BSM":"F009",
	"ARM":"F010",
	"GSM":"F011",
	"LTW":"F012",
	"WVR":"F013",
	"ALC":"F014",
	"CUL":"F015",
	//DoL
	"MIN":"F016",
	"BTN":"F017",
	"FSH":"F018",

	"PLD":"F019",
	"MNK":"F020",
	"WAR":"F021",
	"DRG":"F022",
	"BRD":"F023",
	"WHM":"F024",
	"BLM":"F025",
	"ACN":"F026",
	"SMN":"F027",
	"SCH":"F028",
	"ROG":"F029",
	"NIN":"F030",
	"MCH":"F031",
	"DRK":"F032",
	"AST":"F033",
	"SAM":"F034",
	"RDM":"F035",
	"BLU":"F036",
	"GNB":"F037",
	"DNC":"F038",
	"RPR":"F039",
	"SGE":"F040",
	"VPR":"F041",
	"PCT":"F042",
}


//== View Variables =========================================================
let SearchString = "";
let SearchResults = [];
let ItemList = JSON.parse(localStorage.getItem("ItemList")) || {};
let ItemListCode = updateItemListCode() || "";
let CraftList = [];

const lvl99crafted = [44022,44023,44000,44001,44011,44012,44061,44062,44033];
const lvl100_2starmats = [44149,44147,44148,44151,44150];
const lvl100_2_5starmats = [44847,44846];
const grade3_gemsap = [45979,45980,45981,45982,45983];
const lvl100_3starmats = [45974,45975,45976,45978,45977];

//let calcList = calculateHQItems(ItemList, [...lvl99crafted, ...lvl100_2starmats, ...lvl100_2_5starmats], 6004);
CraftList = pipe(ItemList)
	//.to(calculateHQItems, [...lvl99crafted, ...lvl100_2starmats, ...lvl100_2_5starmats], 6004)
	.to(calculateHQItems, [...grade3_gemsap, ...lvl99crafted, ...lvl100_3starmats], 5807)
	.to(calculateItemList)
	.value

console.log(CraftList);

/*const manualCodeImport = "44411,1;44412,NaN;44413,1;44414,1;44415,1;44416,1;44417,1;44418,1;44419,1;44420,1;44421,1;44422,1;44423,1;44424,1;44425,1;44426,1;44427,1;44428,1;44429,1;44430,1;44431,1;44432,1;44434,1;44435,1;44436,1;44437,1;44438,1;44439,1;44440,1;44441,1;";
*/
/*const manualCodeImport = "44411,1;";
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
			//m("span",{class:"xivAppIcon"},String.fromCharCode(parseInt("F001",16))),
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
					m("td", item.icons!=undefined ? item.icons.map(icon_unicode => m("span",{class:"xivAppIcon"},String.fromCharCode(parseInt(icon_unicode,16)))) : ItemData.classJobCategory[item.classJobCategory]),

					m("td", item.name),
					m("td", {class: "addBtn", onclick: ()=>{addItem(item.id)}} ,"[+]")
				])
			})),
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
						m("div",`[${item_id}] ${ItemData.items[item_id].name} =`), //${ItemList[item_id]}
						m("input", {
							class:"inputItemCounter",
							type: "number",
							min: 0,
							step: 1,
							value: ItemList[item_id],
						}),
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
			m("pre",[
				m("code", ItemListCode),
				//m("button", "Copy")
			])
		]);
	}
}

var CraftListComponent = {
	view: ()=>{
		let craft_category = "";
		const makeDividerRow = (title) => m("div",{class:"inline"},[
				m("div", `═ ${title} `.padEnd(25,"═")),
				m("div",{class:"removeBtn", onclick: ()=>{}},`[-]`),
			]);
		return m("div", {id: "craftList"},
		[
			makeDividerRow("Crystals"),
			... CraftList.crystals.map(crystal => m("div",`${ItemData.items[crystal.id].name} x ${crystal.qty}`)),

			makeDividerRow("Gather"),
			... CraftList.gathers.map(gatherItem => m("div",`${ItemData.items[gatherItem.id].name} x ${gatherItem.qty}`)),

			//makeDividerRow("Crafts"),
			... Object.keys(CraftList.precrafts)
				.reverse()
				.flatMap(c_index => 
				[	
					makeDividerRow(`Crafts ${c_index}`),
					CraftList.precrafts[c_index]
					.map(precrafts => 
						m("div",{class:"inline"},[
							m("div",{class:"xivAppIcon",style:"padding-right:5px;"},String.fromCharCode(parseInt(Job_Unicodes[CraftJobType[precrafts.job]],16))),
							m("div",`${ItemData.items[precrafts.id].name} x ${precrafts.qty} ${precrafts.id in CraftList.itemsToHQ ? `(${CraftList.itemsToHQ[precrafts.id]})` : ""}`)
						])
					),
				]
			),
		]);
	}
}
//46057,2;46058,2;46060,2;46061,2;46075,2;46080,2;46085,3;

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
const itemJobRegex = new RegExp(/job:(\w{3})/,"i");
function searchItems(){
	let start = performance.now();
	SearchResults = [];

	//Don't search if blank
	if(SearchString.trim() == "") return;

	//Item id search tag
	const item_index_search = SearchString.match(itemIDRegex);
	if(item_index_search != null) SearchString = SearchString.replace(item_index_search[0], "").trim();

	//Job seatch tag
	const item_job_search = SearchString.match(itemJobRegex);
	if(item_job_search != null) SearchString = SearchString.replace(item_job_search[0], "").trim();
	let job_set = null;
	if(item_job_search != null) job_set = ItemData.sortedJobSets[item_job_search[1].toUpperCase()];

	const itemNameRegex = new RegExp(SearchString,"i");

	let result_count = 0;
	for(let item_id of Items_Keys){
		if(result_count >= MAX_SEARCH_RESULTS) break;

		let item = ItemData.items[item_id];
		let item_name = item.name;

		if(itemNameRegex.test(item_name)){

			if(item_index_search != null && Number(item_index_search[1]) != item_id) continue;

			if(job_set != null && !job_set.has(item.classJobCategory)) continue;

			//get item job icons
			let jobString = ItemData.classJobCategory[item.classJobCategory];
			let jobSplitted = jobString.split(" ");
			let isJobsList = jobSplitted.reduce((sum,cur)=>sum + cur.length,0) / jobSplitted.length == 3;

			if(isJobsList){
				item.icons = jobSplitted.map(j=>Job_Unicodes[j] || j);
			}
			


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
	updateCraftList();
}

function updateItemListCode(){
	return Object.keys(ItemList).map(id=>`${id},${ItemList[id]};`).join("");
}

function updateCraftList(){
	CraftList = pipe(ItemList)
	.to(calculateHQItems, [...lvl99crafted, ...lvl100_2starmats, ...lvl100_2_5starmats], 6004)
	.to(calculateItemList)
	.value
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

					return resolve(cleanUpJobs(decodedObject))
				})
		});
	})
}

function cleanUpJobs(data){
	let sortedJobSets = Object.keys(data.classJobCategory).reduce((acc,cur)=>{
		cur = Number(cur);
		let jobText = data.classJobCategory[cur];
		if(cur == 0 || jobText == "")return acc;

		let splitted = jobText.split(" ");
		let isJobList = splitted.reduce((sum, word)=>{
			sum+=word.length;
			return sum;
		},0) / splitted.length == 3;

		if(isJobList){
			for(let j of splitted){
				if(j in acc){
					acc[j].add(cur);
				}else{
					acc[j] = new Set([cur])
				}
			}
		}else{
			if(jobText in acc){
				acc[jobText].add(cur);
			}else{
				acc[jobText] = new Set([cur])
			}
		}


		return acc;

	},{});

	data.sortedJobSets = sortedJobSets;
	return data;
}

function pipe(value){//From ian grubb pipe operator
	return { 
		value,
		to: (cb, ...args) => pipe(cb(value, ...args))
	}
}

function calculateHQItems(itemList, hqItemList, targetStartingQuality){
	let itemsToHQ = {}
	let totalHQCrafts = 0;
	console.log(hqItemList)
	itemList = structuredClone(itemList);
	

	for(let item_id of Object.keys(itemList)){
		let startingQuality = targetStartingQuality;
		let item = ItemData.items[item_id];
		let itemQtyToCraft = Number(itemList[item_id]);

		if(!item.canBeHq){//Ignore not hq/non-craftable items//TODO Fix for rarefield
			itemList[item_id] = {
				qty: itemQtyToCraft,
				recipe:item.recipes[0], //TODO make recipe selector,
			}
			continue;
		} 

		let recipe = item.recipes[0]; //TODO make recipe selector

		let inputItems = recipe.inputItems
			.filter(item => hqItemList.includes(item.id) || hqItemList.length == 0)
			.sort((item_a, item_b) => hqItemList.indexOf(item_a.id) - hqItemList.indexOf(item_b.id))
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
		itemsToHQ, //Object.keys(itemsToHQ).map(item_id=>[Number(item_id),itemsToHQ[item_id]]).sort((a,b)=>a[0]-b[0]).sort((a,b)=>b[1]-a[1]),
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
	return code.trim().split(";").reduce((acc,cur)=>{
		if(cur=="") return acc;

		cur = cur.split(",");
		acc[Number(cur[0])] = cur[1];
		return acc;
	},{})
}

function calculateItemList(itemListData){
	let itemsToCraft = itemListData.itemList;

	let recipe_cost = {};
	for(let item_id of Object.keys(itemsToCraft)){
		let item  = itemsToCraft[item_id];

		console.log(item)
		calculateRecipeCost(item_id, item.qty, 0, recipe_cost);
	}

	//convert recipe cost in an sorted array
	recipe_cost = Object.keys(recipe_cost).map(r=>({id:Number(r),...recipe_cost[r]}))
		.sort((a, b) => a.id - b.id) //sort by item id in acending order
		//.sort((a, b) => (a.job == undefined || b.job == undefined) ? -1 : a.job - b.job)
		//.sort((a, b) => b.index - a.index) //sort by craft level in ascending order
		//.sort((a, b) => a.isCraft - b.isCraft) //sort by craftable or not

	let crystal_list = [];
	let gather_list = [];
	let precraft_list = {};

	for(let input_item of recipe_cost){

		if(input_item.id <= 19){//Crystal
			crystal_list.push(input_item);
			continue;
		}

		if(!input_item.isCraft){//Gatherable TODO Vendor
			gather_list.push(input_item);
			continue;
		}

		let c_index = input_item.index;
		if(c_index in precraft_list){//Precrafts
			precraft_list[c_index].push(input_item);
		}else{
			precraft_list[c_index] = [input_item]
		}
		
	}

	for(let sub_list_index of Object.keys(precraft_list)){
		precraft_list[sub_list_index].sort((a, b) => (a.job == undefined || b.job == undefined) ? -1 : a.job - b.job)
	}
	
	//return [...gather_list,...precraft_list];
	//return recipe_cost;

	return {
		itemsToHQ: itemListData.itemsToHQ,
		crystals: crystal_list,
		gathers: gather_list,
		precrafts: precraft_list,
	}
}

function calculateRecipeCost(item_id, qty, craft_depth = 0, recipe_cost = {}){
	let item  = ItemData.items[item_id];
	let recipe = item.recipes[0]; //TODO make recipe selector

	//console.log("Calculating recipe cost for", qty, "x", item.id, item.name);

	//add items to recipe cost
	!(item_id in recipe_cost) && (recipe_cost[item_id] = {
		index: craft_depth,
		qty: 0,
		isCraft: false,
	})

	recipe_cost[item_id].qty += qty;
	recipe_cost[item_id].index = Math.max(craft_depth, recipe_cost[item_id].index);

	//check if craftable
	if(recipe == undefined) return recipe_cost;

	recipe_cost[item_id].outputQty = recipe.outputItem.qty;
	recipe_cost[item_id].isCraft = true;
	recipe_cost[item_id].job = recipe.job;
	let num_of_crafts = qty / recipe.outputItem.qty;

	recipe_cost[item_id].qty += num_of_crafts - qty;

	for(let input_item of recipe.inputItems){
		//console.log(input_item);

		calculateRecipeCost(input_item.id, input_item.qty * num_of_crafts, craft_depth + 1, recipe_cost);
	}

	return recipe_cost
}