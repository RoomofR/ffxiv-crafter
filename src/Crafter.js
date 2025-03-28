import { Item_IDs, Job_Sets, Item_Data, Class_Job_Category, Job_Unicodes } from "./Data.js";

const MAX_SEARCH_RESULTS = 50;
const itemIDRegex = new RegExp(/id:(\d+)/,"i");
const itemJobRegex = new RegExp(/job:(\w{3})/,"i");
export function searchItems(search_string){
	let start = performance.now();
	let search_results = [];

	//Don't search if blank
	if(search_string.trim() == "") return;

	//Item id search tag
	const item_index_search = search_string.match(itemIDRegex);
	if(item_index_search != null) search_string = search_string.replace(item_index_search[0], "").trim();

	//Job seatch tag
	const item_job_search = search_string.match(itemJobRegex);
	if(item_job_search != null) search_string = search_string.replace(item_job_search[0], "").trim();
	let job_set = null;
	if(item_job_search != null) job_set = Job_Sets[item_job_search[1].toUpperCase()];

	const itemNameRegex = new RegExp(search_string,"i");

	let result_count = 0;
	for(let item_id of Item_IDs){
		if(result_count >= MAX_SEARCH_RESULTS) break;

		let item = Item_Data[item_id];
		let item_name = item.name;

		if(itemNameRegex.test(item_name)){

			if(item_index_search != null && Number(item_index_search[1]) != item_id) continue;

			if(job_set != null && !job_set.has(item.classJobCategory)) continue;

			//get item job icons
			let jobString = Class_Job_Category[item.classJobCategory];
			let jobSplitted = jobString.split(" ");
			let isJobsList = jobSplitted.reduce((sum,cur)=>sum + cur.length,0) / jobSplitted.length == 3;

			if(isJobsList){
				item.icons = jobSplitted.map(j=>Job_Unicodes[j] || j);
			}

			search_results.push(item)
			result_count++;
		}
	}

	let queryTime = performance.now() - start;
	console.log(`Item query time: ${queryTime} ms`);

	if(result_count == 0){
		search_results.push({
			event: "no results found",
			time: queryTime
		})
	}

	return search_results;
}

export function updateItemListCode(item_list){
	return Object.keys(item_list).map(id=>`${id},${item_list[id]};`).join("");
}

export function calculateItemList(itemListData){
	let itemsToCraft = itemListData.itemList;

	let recipe_cost = {};
	for(let item_id of Object.keys(itemsToCraft)){
		let item  = itemsToCraft[item_id];
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
	//Add items to hq in crafts
	for(let precraftItemIndex in precraft_list[0]){
		let precraftItem = precraft_list[0][precraftItemIndex];

		if(precraftItem.id in itemListData.itemList){
			precraftItem.hqItems = itemListData.itemList[precraftItem.id].hqItems
			precraft_list[0][precraftItemIndex] = precraftItem;
		}
	}

	return {
		itemsToHQ: itemListData.itemsToHQ,
		crystals: crystal_list,
		gathers: gather_list,
		precrafts: precraft_list,
	}
}

export function calculateRecipeCost(item_id, qty, craft_depth = 0, recipe_cost = {}){
	let item  = Item_Data[item_id];
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
		calculateRecipeCost(input_item.id, input_item.qty * num_of_crafts, craft_depth + 1, recipe_cost);
	}

	return recipe_cost
}

export function calculateHQItems(itemList, hqItemList, targetStartingQuality){
	let itemsToHQ = {}
	let totalHQCrafts = 0;

	itemList = structuredClone(itemList);	

	for(let item_id of Object.keys(itemList)){
		let startingQuality = targetStartingQuality;
		let item = Item_Data[item_id];
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

/*const manualCodeImport = "46057,2;46058,2;46060,2;46061,2;46075,2;46080,2;46085,3;";
ItemList = parseListCode(manualCodeImport);
console.log(ItemList)
updateItemList();*/

/*ItemList = parseAllaganList();
updateItemList();*/