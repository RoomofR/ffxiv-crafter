//===========================================================================
const FFXIV_VERSION = "2025.02.27.0000.0000";
console.log(`FFXIV Crafter for FFXIV Data version ${FFXIV_VERSION}`, "meow");
//===========================================================================

const ItemData = await getFFXIVItemData(FFXIV_VERSION);



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