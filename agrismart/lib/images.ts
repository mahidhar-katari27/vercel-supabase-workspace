/**
 * Centralised item-image registry (spec §51).
 *
 * ONE source of truth mapping every displayable item to its photograph so a
 * wrong image can be fixed in a single line. Every path below is a local,
 * licence-clean asset in /public — verified to match the item it depicts:
 *
 *   crops      → /crops/<key>.jpg            (8 crops, field-verified)
 *   equipment  → /equipment/machines/<id>.jpg (one unique machine photo per listing)
 *   listings   → /market/<id>.jpg             (marketplace products)
 *   aqua/poultry/dairy → /sectors/<sector>/<key>.jpg
 *
 * UI components must never hardcode image URLs — import { IMG } and resolve.
 */

export const IMG = {
  crops: {
    paddy: '/crops/paddy.jpg',
    chilli: '/crops/chilli.jpg',
    cotton: '/crops/cotton.jpg',
    maize: '/crops/maize.jpg',
    groundnut: '/crops/groundnut.jpg',
    tomato: '/crops/tomato.jpg',
    mango: '/crops/mango.jpg',
    pulses: '/crops/pulses.jpg',
  },
  equipment: {
    v1: '/equipment/machines/tractor-mahindra.jpg',
    v2: '/equipment/machines/tractor-sonalika.jpg',
    v6: '/equipment/machines/tractor-swaraj.jpg',
    v7: '/equipment/machines/mini-tractor.jpg',
    v8: '/equipment/machines/power-tiller.jpg',
    v9: '/equipment/machines/combine-harvester.jpg',
    v10: '/equipment/machines/paddy-harvester.jpg',
    v11: '/equipment/machines/reaper.jpg',
    v12: '/equipment/machines/baler.jpg',
    v13: '/equipment/machines/thresher.jpg',
    v14: '/equipment/machines/sugarcane-harvester.jpg',
    v15: '/equipment/machines/rotavator.jpg',
    v16: '/equipment/machines/cultivator.jpg',
    v17: '/equipment/machines/plough.jpg',
    v18: '/equipment/machines/disc-harrow.jpg',
    v19: '/equipment/machines/seed-drill.jpg',
    v20: '/equipment/machines/water-tanker.jpg',
    v21: '/equipment/machines/sprayer-boom.jpg',
    v22: '/equipment/machines/drone-sprayer.jpg',
    v23: '/equipment/machines/irrigation-pump.jpg',
    v3: '/equipment/machines/mini-truck.jpg',
    v4: '/equipment/machines/tractor-trolley.jpg',
    v24: '/equipment/machines/trailer.jpg',
    v5: '/equipment/machines/farm-utility-vehicle.jpg',
    v25: '/equipment/machines/paddy-transplanter.jpg',
    v26: '/equipment/machines/coconut-climber.jpg',
    v27: '/equipment/machines/mini-excavator.jpg',
    v28: '/equipment/machines/chaff-cutter.jpg',
    v29: '/equipment/machines/cono-weeder.jpg',
  },
  listings: {
    l1: '/market/paddy-grain.jpg',
    l2: '/market/tomato-crates.jpg',
    l3: '/market/mango-crates.jpg',
    l4: '/market/seed-packets.jpg',
    l5: '/market/urea-bags.jpg',
    l6: '/market/neem-pesticide.jpg',
    l7: '/market/prawn-harvest.jpg',
    l8: '/market/rohu-fish.jpg',
    l9: '/market/buffalo-milk.jpg',
    l10: '/market/country-eggs.jpg',
    l11: '/market/dry-chilli.jpg',
    l12: '/market/aqua-feed.jpg',
  },
  aqua: {
    fishPond: '/sectors/aqua/fish-pond.jpg',
    prawnPond: '/sectors/aqua/prawn-pond.jpg',
    fishFeed: '/sectors/aqua/fish-feed.jpg',
    prawnFeed: '/sectors/aqua/prawn-feed.jpg',
    fishMarket: '/sectors/aqua/fish-market.jpg',
    prawnMarket: '/sectors/aqua/prawn-market.jpg',
    aerator: '/sectors/aqua/aerator.jpg',
    nets: '/sectors/aqua/nets.jpg',
  },
  poultry: {
    broiler: '/sectors/poultry/broiler.jpg',
    layer: '/sectors/poultry/layer.jpg',
    shed: '/sectors/poultry/shed.jpg',
    feed: '/sectors/poultry/feed.jpg',
    eggs: '/sectors/poultry/eggs.jpg',
    equipment: '/sectors/poultry/equipment.jpg',
  },
  dairy: {
    cow: '/sectors/dairy/cow.jpg',
    buffalo: '/sectors/dairy/buffalo.jpg',
    milk: '/sectors/dairy/milk.jpg',
    farm: '/sectors/dairy/farm.jpg',
    feed: '/sectors/dairy/feed.jpg',
    milking: '/sectors/dairy/milking.jpg',
  },
} as const

export type CropImageKey = keyof typeof IMG.crops
export type EquipmentImageKey = keyof typeof IMG.equipment
