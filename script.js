//===========================================================================
const FFXIV_VERSION = "2025.02.27.0000.0000_2";
console.log(`FFXIV Crafter for FFXIV Data version ${FFXIV_VERSION}`, "meow");
//===========================================================================

const ItemData = await getFFXIVItemData(FFXIV_VERSION);
const Items_Keys = Object.keys(ItemData.items)
console.log(ItemData.classJobCategory)

//== View Variables =========================================================
let searchString = "";
let searchResults = [];
let itemList = {};
let itemListCode = "";

//== View ===================================================================
var root = document.body;

//Search Bar
var SearchBarComponent = {
	view: ()=>{
		return m("div", {id: "searchBox"},
		[
			m("label", {for: "search_text_box"},`Search (${searchResults.length})`),
			m("input", {id: "search_text_box", type: "text", onkeyup: onSearchKey}),
			m("table", searchResults.map(item =>
				m("tr",[
					m("td", item.id),
					m("td", item.classJobCategory),
					m("td", item.name),
					m("td", {class: "addBtn", onclick: ()=>{addItem(item.id)}} ,"[+]")
				])
			)),
		]);
	}
}

//Item List
var ItemListComponent = {
	view: ()=>{
		return m("div", {id: "itemList"},
		[
			m("h6","Item List"),
			m("div", Object.keys(itemList).flatMap(item_id => {
				let item = ItemData.items[item_id];
				//Item without recipe
				if(item.recipes.length == 0){
					return [
						m("div", `[${item_id}] ${ItemData.items[item_id].name} = ${itemList[item_id]}`)
					]
				}

				//Item with recipe
				return [
					m("div", `[${item_id}] ${ItemData.items[item_id].name} = ${itemList[item_id]}`),
					m("div", {style: "margin-left: 15px;"},`↪ ${ItemData.items[item_id].recipes[0].progress}ℙ ${ItemData.items[item_id].recipes[0].quality}𝑸 ${ItemData.items[item_id].recipes[0].durability}ᴰ`),
					

					m("div", {style: "margin-left: 25px;"}, ItemData.items[item_id].recipes[0].inputItems.filter(input_item => input_item.bonusQuality > 0).map(input_item => 
						m("div", `${input_item.id} ${input_item.qty} ${input_item.bonusQuality || ""}`)
					))
				]
			}
				
			)),
			m("code", itemListCode),
		]);
	}
}

//App
m.mount(root,{
	view: ()=>{
		return m("div", {id: "app"},
		[
			m(SearchBarComponent),
			m(ItemListComponent),
		]);
	}
});

//== Event Functions ========================================================

let searchBarTimout = null;
function onSearchKey(event){
	searchString = event.target.value;
	clearTimeout(searchBarTimout);
	searchBarTimout = setTimeout(searchItems, 1000);
}

const MAX_SEARCH_RESULTS = 50;
function searchItems(){
	searchResults = [];

	//Don't search if blank
	if(searchString.trim() == "") return;

	const itemNameRegex = new RegExp(searchString,"i");

	let result_count = 0;
	for(let item_id of Items_Keys){
		if(result_count >= MAX_SEARCH_RESULTS) break;

		let item = ItemData.items[item_id];
		let item_name = item.name;

		if(itemNameRegex.test(item_name)){
			searchResults.push(item)
			result_count++;
		}
	}
	m.redraw();
}

function addItem(item_id){
	console.log("adding",item_id)

	if(item_id in itemList){
		itemList[item_id]++;
	}else{
		itemList[item_id] = 1;
	}

	itemListCode = Object.keys(itemList).map(id=>`${id},${itemList[id]};`).join("")
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