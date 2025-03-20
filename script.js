console.log("meow");

protobuf.load("./data/data.proto", (err,root)=>{
	if(err) throw err;
	var ItemDataMessege = root.lookupType("ItemData");
	let start = performance.now();
	let protoStart = performance.now();
	fetch("./data/Items.protobuf")
		.then(response => {
			console.log(`Fetch time: ${performance.now() - start} ms`)
			start = performance.now();
			return response.arrayBuffer();
		})
		.then(buffer => {
			let decodedObject = ItemDataMessege.decode(new Uint8Array(buffer));
			console.log(`Decode time: ${performance.now() - start} ms`);
			console.log(`Total protobuf time: ${performance.now() - protoStart} ms`);
			return decodedObject
		})
});