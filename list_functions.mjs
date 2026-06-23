import { Client, Functions, Query } from 'node-appwrite';

const client = new Client()
  .setEndpoint('https://fra.cloud.appwrite.io/v1')
  .setProject('69c58725000ef2b43f18')
  .setKey('standard_de2628e1d388cc087d06c18709188fbba1f70ad9fb89ebb5a629d99a50b5d982c0039ecee34d13c38cf6d9376cc2076c7f38f501b5c235c9ca459dfbbe38a1a715c8fb85bf86405c1e6c322e4f6b8ceb70055f3bf146cf8cb4c8cc6d66e5747d5a8b6c6a28c070f658cd50e0a4caeddf59e59f10889149c0d32ad79457d46998');

const functions = new Functions(client);

async function listAllFunctions() {
  try {
    const allFunctions = [];
    let offset = 0;
    while (true) {
      const response = await functions.list([Query.limit(100), Query.offset(offset)]);
      allFunctions.push(...response.functions);
      if (allFunctions.length >= response.total) break;
      offset += 100;
    }
    
    const mapping = {};
    allFunctions.forEach(fn => {
      mapping[fn.name] = fn.$id;
    });
    
    console.log(JSON.stringify(mapping, null, 2));
  } catch (error) {
    console.error('Error fetching functions:', error);
  }
}

listAllFunctions();
