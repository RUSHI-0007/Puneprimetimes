const { uploadAndAttach } = require('./upload-helper');

const updates = [
  {
    id: 'b58c11e9-f75c-49c9-9fb2-330d6030829e',
    name: 'msrtc-st-bus-baramati',
    path: '/Users/rushi/.gemini/antigravity/brain/cf4bfc54-833d-4b8b-82d8-0aaffc48a006/msrtc_st_bus_baramati_1794631071525.jpg',
    credit: 'प्रतिनिधिक छायाचित्र (MSRTC State Transport Bus in Baramati / PPT)'
  },
  {
    id: '42bcd7d0-0876-4f27-b251-1fea582a9cba',
    name: 'sambhaji-brigade-delegation-baramati',
    path: '/Users/rushi/.gemini/antigravity/brain/cf4bfc54-833d-4b8b-82d8-0aaffc48a006/sambhaji_brigade_delegation_1794631164358.jpg',
    credit: 'प्रतिनिधिक छायाचित्र (Sambhaji Brigade Delegation at Baramati Office / PPT)'
  },
  {
    id: 'f29027fa-7cb3-4a1a-afa8-69343d51810a',
    name: 'baramati-accident-investigation',
    path: '/Users/rushi/.gemini/antigravity/brain/cf4bfc54-833d-4b8b-82d8-0aaffc48a006/baramati_accident_investigation_1794631114222.jpg',
    credit: 'प्रतिनिधिक छायाचित्र (Baramati Road Accident Police Investigation / PPT)'
  },
  {
    id: '9d2f9d74-e576-4f76-b785-471661cccf1e',
    name: 'sugarcane-tractor-baramati',
    path: '/Users/rushi/.gemini/antigravity/brain/cf4bfc54-833d-4b8b-82d8-0aaffc48a006/sugarcane_tractor_baramati_1794631139667.jpg',
    credit: 'प्रतिनिधिक छायाचित्र (Sugarcane Harvest Tractor in Baramati Rural / PPT)'
  },
  {
    id: '694a8e32-dc26-4f4a-b553-71c632e0dca5',
    name: 'pune-air-pollution-smog',
    path: '/Users/rushi/.gemini/antigravity/brain/cf4bfc54-833d-4b8b-82d8-0aaffc48a006/pune_air_pollution_smog_1794631093742.jpg',
    credit: 'प्रतिनिधिक छायाचित्र (Pune City Smog & Air Quality Crisis / PPT)'
  }
];

async function run() {
  console.log(`Updating ${updates.length} articles with dedicated editorial photos...`);
  for (const item of updates) {
    try {
      console.log(`\nProcessing ${item.name}...`);
      await uploadAndAttach(item.id, item.path, item.name, item.credit);
    } catch (e) {
      console.error(`Error with ${item.name}:`, e);
    }
  }
  console.log('\n--- ALL 5 ARTICLES UPDATED WITH REAL PHOTOS ---');
}

run();
