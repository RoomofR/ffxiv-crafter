//===========================================================================
export const FFXIV_VERSION = "2025.03.18.0000.0000_1";
console.log(`FFXIV Crafter for FFXIV Data version ${FFXIV_VERSION}`, "meow");
//===========================================================================

let FFXIV_Data = await getFFXIVItemData(FFXIV_VERSION);

//Data of all items in the game with recipes and other misc data
export const Item_Data = FFXIV_Data.items;
export const Item_IDs = Object.keys(Item_Data);

//SortedJobSets
export const Job_Sets = FFXIV_Data.sortedJobSets;

//classJobCategory
export const Class_Job_Category = FFXIV_Data.classJobCategory;

//Free Data
FFXIV_Data = null;

export const Craft_Job_Type = {
	0:"CPR",
	1:"BSM",
	2:"ARM",
	3:"GSM",
	4:"LTW",
	5:"WVR",
	6:"ALC",
	7:"CUL",
};

export const Job_Unicodes = {
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

//===========================================================================
export async function getFFXIVItemData(ffxivVersion){
	return new Promise((resolve, reject) => {
		protobuf.load("./data/data.proto", (err,root)=>{
			if(err) throw err;
			var ItemDataMessege = root.lookupType("ItemData");
			let start = performance.now();
			let protoStart = performance.now();
			let fetchTime = null;
			fetch(`./data/ItemData_${ffxivVersion}.protobuf`, { cache: "force-cache" })
				.then(response => {
					fetchTime = performance.now() - start;
					start = performance.now();
					return response.arrayBuffer();
				})
				.then(buffer => {
					let decodedObject = ItemDataMessege.decode(new Uint8Array(buffer));
					console.log([
						"FFXIV DATA",
						`Fetch Time: ${fetchTime} ms`,
						`Decode time: ${performance.now() - start} ms`,
						`Total protobuf time: ${performance.now() - protoStart} ms`,
						].join("\n"))
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

export function pipe(value){//From ian grubb pipe operator
	return { 
		value,
		to: (cb, ...args) => pipe(cb(value, ...args))
	}
}