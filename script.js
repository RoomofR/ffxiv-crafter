//===========================================================================
const FFXIV_VERSION = "2025.02.27.0000.0000";
console.log(`FFXIV Crafter for FFXIV Data version ${FFXIV_VERSION}`, "meow");
//===========================================================================

const ItemData = await getFFXIVItemData(FFXIV_VERSION);
const Items_Keys = Object.keys(ItemData.items)

//== View Variables =========================================================
let searchString = "";
let searchResults = [];

//== View ===================================================================
var root = document.getElementById("app");
m.mount(root,{
	view: ()=>{
		return m("div", {id: "searchBox"},
		[
			m("label", {for: "search_text_box"},`Search (${searchResults.length})`),
			m("input", {id: "search_text_box", type: "text", onkeyup: onSearchKey}),
			m("table", searchResults.map(item =>
				m("tr",[
					m("td", item.id),
					m("td", item.name),
					m("td", {class: "addBtn", onclick: ()=>{addItem(item.id)}} ,"[+]")
				])
			)),
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

function addItem(item){
	console.log("adding",item)
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