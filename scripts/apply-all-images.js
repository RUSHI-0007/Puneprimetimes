const path = require('path');
const { uploadAndAttach } = require('./upload-helper');

const imageMappings = [
  {
    id: 'e0e25220-2337-42fb-8d05-c9d810899995',
    name: 'sunetra-pawar-baramati-bhau-beej',
    path: '/Users/rushi/.gemini/antigravity/brain/cf4bfc54-833d-4b8b-82d8-0aaffc48a006/sunetra_pawar_baramati_bhau_beej_1794539416505.jpg',
    credit: 'प्रतिनिधिक छायाचित्र (Deputy CM Sunetra Pawar with rural women in Baramati / PPT)'
  },
  {
    id: 'c1bba78b-aea5-4fb5-9a5b-8c816fa360df',
    name: 'pune-pmc-bomb-threat-alert',
    path: '/Users/rushi/.gemini/antigravity/brain/cf4bfc54-833d-4b8b-82d8-0aaffc48a006/pune_pmc_bomb_squad_alert_1794539446912.jpg',
    credit: 'प्रतिनिधिक छायाचित्र (Pune Police Bomb Detection & Disposal Squad BDDS / PPT)'
  },
  {
    id: 'c5a9274e-b955-47fd-b013-3ecb2bf3c7b0',
    name: 'pune-crime-scene-investigation',
    path: '/Users/rushi/.gemini/antigravity/brain/cf4bfc54-833d-4b8b-82d8-0aaffc48a006/pune_crime_scene_investigation_1794539466515.jpg',
    credit: 'प्रतिनिधिक छायाचित्र (Pune Police Crime Investigation / PPT)'
  },
  {
    id: '11f15c8c-168a-46b2-9bc4-ee5c8b0763d9',
    name: 'baramati-training-aircraft-landing',
    path: '/Users/rushi/.gemini/antigravity/brain/cf4bfc54-833d-4b8b-82d8-0aaffc48a006/baramati_aircraft_landing_1794539385103.jpg',
    credit: 'प्रतिनिधिक छायाचित्र (Aviation Academy Baramati Trainer Aircraft / PPT)'
  },
  {
    id: 'ef3ee810-08b8-42e8-8469-95cf5a2a82ad',
    name: 'mutha-canal-water-scarcity-pune',
    path: '/Users/rushi/.gemini/antigravity/brain/cf4bfc54-833d-4b8b-82d8-0aaffc48a006/mutha_canal_water_scarcity_1794539403107.jpg',
    credit: 'प्रतिनिधिक छायाचित्र (Pune Irrigation & Mutha Canal Project / PPT)'
  },
  {
    id: '14e12490-578d-4792-b839-7f34fd58bf96',
    name: 'pune-family-court-parenting-plan',
    path: '/Users/rushi/.gemini/antigravity/brain/cf4bfc54-833d-4b8b-82d8-0aaffc48a006/pune_family_court_legal_agreement_1794539421441.jpg',
    credit: 'प्रतिनिधिक छायाचित्र (Pune Family Court Legal Documentation / PPT)'
  },
  {
    id: 'b71aad76-3d2d-4fc9-93a0-78b5f783c3a5',
    name: 'baramati-delegation-memorandum',
    path: '/Users/rushi/.gemini/antigravity/brain/cf4bfc54-833d-4b8b-82d8-0aaffc48a006/baramati_delegation_memorandum_1794539608929.jpg',
    credit: 'प्रतिनिधिक छायाचित्र (Community Delegation Submitting Memorandum in Baramati / PPT)'
  },
  {
    id: '939a74e7-e093-4b94-a008-9b8accf70f81',
    name: 'baramati-diwali-faral-distribution',
    path: '/Users/rushi/.gemini/antigravity/brain/cf4bfc54-833d-4b8b-82d8-0aaffc48a006/diwali_faral_distribution_baramati_1794539441131.jpg',
    credit: 'प्रतिनिधिक छायाचित्र (Baramati Municipal Council Diwali Faral Distribution / PPT)'
  }
];

async function main() {
  console.log(`Starting image upload and article updates for ${imageMappings.length} articles...`);
  for (const item of imageMappings) {
    try {
      console.log(`\nProcessing article: ${item.id} (${item.name})...`);
      const res = await uploadAndAttach(item.id, item.path, item.name, item.credit);
      if (!res) {
        console.error(`Failed to process ${item.name}`);
      }
    } catch (e) {
      console.error(`Exception processing ${item.name}:`, e);
    }
  }
  console.log('\n--- ALL IMAGES PROCESSED SUCCESSFULLY ---');
}

main();

