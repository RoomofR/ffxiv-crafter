import { searchItems, generateItemListCode, calculateItemList, calculateHQItems, parseListCode } from "../Crafter.js";
import { Item_Data, Class_Job_Category, Craft_Job_Type, Job_Unicodes, pipe} from "../Data.js";

//TODO Refactor into user interface and data
const lvl99crafted = [44022,44023,44000,44001,44011,44012,44061,44062,44033];
const lvl100_2starmats = [44149,44147,44148,44151,44150];
const lvl100_2_5starmats = [44847,44846];
const grade3_gemsap = [45979,45980,45981,45982,45983];
const lvl100_3starmats = [45974,45975,45976,45978,45977];

//== View Variables =========================================================
let Search_Results = [];
let Search_String = "";

let Item_List = JSON.parse(localStorage.getItem("ItemList")) || {};
let Item_List_Code = generateItemListCode(Item_List) || "";

let Craft_List = [];
updateCraftList();

//== Event Functions ========================================================
let searchBarTimeout = null;
function onSearchKey(event){
	Search_String = event.target.value;
	clearTimeout(searchBarTimeout);

	Search_Results = (Search_String == "") ? [] : [{
			event: "loading"
		}];

	searchBarTimeout = setTimeout(()=>{
		Search_Results = searchItems(Search_String);
		m.redraw();
	}, 200);
}

function addItem(item_id){
	console.log("adding",item_id)

	if(item_id in Item_List){
		Item_List[item_id]++;
	}else{
		Item_List[item_id] = 1;
	}

	updateItemList();
}

function removeItem(item_id){
	console.log("removing",item_id);

	if(item_id in Item_List){
		Item_List[item_id]--;

		if(Item_List[item_id] <= 0){
			delete Item_List[item_id];
		}

		updateItemList();
	}
}

function updateItemList(){
	localStorage.setItem("ItemList", JSON.stringify(Item_List));

	Item_List_Code = generateItemListCode(Item_List);
	updateCraftList();
}

function updateCraftList(){
	Craft_List = pipe(Item_List)
	.to(calculateHQItems, [...grade3_gemsap, ...lvl99crafted, ...lvl100_3starmats], 4577)
	.to(calculateItemList)
	.value;
}

const manualCodeImport = "46033,4;46076,4;46040,4;46038,4;46020,4;46034,4;46067,4;46078,4;46031,4;46068,4";
Item_List = parseListCode(manualCodeImport);
console.log(Item_List)
updateItemList();

//== View ===================================================================
const ItemNameComponent = (item_name) => m("div",{class:"itemNameComponent",onclick:()=>{navigator.clipboard.writeText(item_name)}},item_name);

//Search Bar
let SearchBarComponent = {
	view: ()=>{
		return m("div", {id: "searchBox"},
		[
			//m("span",{class:"xivAppIcon"},String.fromCharCode(parseInt("F001",16))),
			m("label", {for: "search_text_box"},`Search (${Search_Results.length})`),
			m("input", {id: "search_text_box", type: "text", onkeyup: onSearchKey}),
			m("table", Search_Results.map(item => {
				if(item.event == "no results found") return m("tr",m("td",`No Results Found! Took ${item.time}ms.`));

				if(item.event == "loading") return m("tr", m("td", {class:"inline"}, [
						m("div",{class:"loader"},""),
						m("div",{style: "margin-left: 5px;"}, `Searching for items using "${Search_String}" terms.`)
					]))

				return m("tr",[
					m("td", item.id),
					m("td", item.icons!=undefined ? item.icons.map(icon_unicode => m("span",{class:"xivAppIcon"},String.fromCharCode(parseInt(icon_unicode,16)))) : Class_Job_Category[item.classJobCategory]),

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
			m("div", Object.keys(Item_List).flatMap(item_id => {
				let item = Item_Data[item_id];

				let itemNameComponent = m("div",{class:"inline"}, [
						m("div",`[${item_id}] ${Item_Data[item_id].name} =`),
						m("input", {
							class:"inputItemCounter",
							type: "number",
							min: 0,
							step: 1,
							value: Item_List[item_id],
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
					m("div", {style: "margin-left: 15px;"},`↪ ${Item_Data[item_id].recipes[0].progress}ℙ ${Item_Data[item_id].recipes[0].quality}𝑸 ${Item_Data[item_id].recipes[0].durability}ᴰ`),
					

					m("div", {style: "margin-left: 35px;"}, Item_Data[item_id].recipes[0].inputItems.filter(input_item => input_item.bonusQuality > 0).map(input_item => 
						m("div", `${Item_Data[input_item.id].name} x ${input_item.qty} ${input_item.bonusQuality || ""}𝑸`)
					))
				]
			}
				
			)),
			m("h6","List Code:"),
			m("pre",[
				m("code", Item_List_Code),
				//m("button", "Copy")
			])
		]);
	}
}

//Craft List
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
			... Craft_List.crystals.map(crystal => m("div",`${Item_Data[crystal.id].name} x ${crystal.qty}`)),

			makeDividerRow("Gather"),
			... Craft_List.gathers.map(gatherItem => m("div",`${Item_Data[gatherItem.id].name} x ${gatherItem.qty}`)),

			//makeDividerRow("Crafts"),
			... Object.keys(Craft_List.precrafts)
				.reverse()
				.flatMap(c_index => 
				[	
					makeDividerRow(`Crafts ${c_index}`),
					Craft_List.precrafts[c_index]
					.flatMap(precrafts => [
							m("div",{class:"inline"},[
								m("div",{class:"xivAppIcon",style:"padding-right:5px;"},String.fromCharCode(parseInt(Job_Unicodes[Craft_Job_Type[precrafts.job]],16))),
								ItemNameComponent(Item_Data[precrafts.id].name),
								m("div",{style: "padding-left: 5px;"},`x ${precrafts.qty} ${precrafts.id in Craft_List.itemsToHQ ? `(${Craft_List.itemsToHQ[precrafts.id]})` : ""}`),								
							]),
							(precrafts.hqItems != undefined)?[precrafts.hqItems.map(hq_item=>m("div",{style: "margin-left: 35px;"},`${Item_Data[hq_item[0]].name} x ${hq_item[1]}`))]:[],
						]
						
					),
				]
			),
		]);
	}
}

export let CraftApp = {
	view: ()=>{
		return m("div", {id: "app"},
		[
			m(SearchBarComponent),
			m(ItemListComponent),
			m(CraftListComponent),
		]);
	}
}