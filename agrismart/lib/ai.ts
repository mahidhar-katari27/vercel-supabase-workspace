/**
 * AgriSmart assistant + crop-doctor logic.
 *
 * IMPORTANT — this is a deterministic, rule-based DEMO responder. There is no
 * model running behind it and it makes no real agricultural judgement. Every
 * answer is hedged with "estimated / approximate / sample assumptions" and the
 * UI states plainly that AI output is assistance only, never a diagnosis.
 *
 * It understands three registers, because that is how farmers in Andhra
 * Pradesh actually type:
 *   English   "what is the paddy price in Vijayawada"
 *   Telugu    "పంట ధర ఎంత"
 *   Tenglish  "naaku 3 acres undi paddy ki entha investment avtundi"
 */

import {
  cropPlans, diagnoses, farmer, lands, machines, marketRows, schemes, weather,
  type Diagnosis,
} from './data'
import { inr, seeded } from './utils'
import { cropKeyForName } from './crops'
import { cropInfo, cropVisual } from './cropDb'
import {
  budgetPerAcre, economics, loadPlan, rankCrops, stageAt, totalAcres,
} from './farmPlan'

export type Reply = {
  text: string
  /** Suggested follow-ups rendered as tappable chips. */
  chips?: string[]
  /** Route the assistant can offer to open. */
  navigate?: { href: string; label: string }
  tone?: 'normal' | 'caution'
}

/** Lowercase + strip punctuation so Telugu and Tenglish both match cleanly. */
function norm(s: string): string {
  return s.toLowerCase().replace(/[?.!,;:'"()]/g, ' ').replace(/\s+/g, ' ').trim()
}

const has = (t: string, words: string[]) => words.some((w) => t.includes(w))

/* Numbers written the way people actually type them in Tenglish. */
const WORD_NUMS: Record<string, number> = {
  one: 1, two: 2, three: 3, four: 4, five: 5, six: 6, seven: 7, eight: 8, nine: 9, ten: 10,
  okati: 1, rendu: 2, moodu: 3, muudu: 3, nalugu: 4, nalug: 4, aidu: 5, ayidu: 5,
  aaru: 6, aidu_: 5, yedu: 7, enimidi: 8, tommidi: 9, padi: 10,
  '1': 1, '2': 2, '3': 3, '4': 4, '5': 5, '6': 6, '7': 7, '8': 8, '9': 9, '10': 10, '12': 12, '15': 15, '20': 20,
}

function extractAcres(t: string): number | null {
  const m = t.match(/(\d+(?:\.\d+)?)\s*(?:acre|acres|ac|ఎకర|ఎకరా|ekara|ekaram)/)
  if (m) return parseFloat(m[1]!)
  const words = t.split(' ')
  for (let i = 0; i < words.length - 1; i++) {
    const n = WORD_NUMS[words[i]!]
    const next = words[i + 1]!
    if (n && /acre|ac$|ekara|ekaram|ఎకర/.test(next)) return n
  }
  return null
}

function extractCrop(t: string): string | null {
  const map: Array<[string[], string]> = [
    [['paddy', 'rice', 'వరి', 'dhanya'], 'Paddy'],
    [['chilli', 'mirchi', 'మిరప', 'chili'], 'Chilli'],
    [['cotton', 'patti', 'పత్తి'], 'Cotton'],
    [['maize', 'mokka', 'జొన్న', 'corn'], 'Maize'],
    [['turmeric', 'pasupu', 'పసుపు'], 'Turmeric'],
    [['groundnut', 'verusanaga', 'పాలీ'], 'Groundnut'],
    [['tomato', 'ఓట'], 'Tomato'],
    [['prawn', 'vannamei', 'rohu', 'fish', 'చేప', 'aqua'], 'Aqua'],
  ]
  for (const [keys, name] of map) if (has(t, keys)) return name
  return null
}

const HEDGE =
  ' This is an estimate from sample demo assumptions — actual cost changes with local input prices, labour rates and your farming practice.'

export function assistantReply(raw: string): Reply {
  const t = norm(raw)

  /* ------------------------------------------- start farming / plan context */
  const PLAN_WORDS = ['start farming', 'farm plan', 'my plan', 'which crop', 'what crop', 'what to grow',
    'which to grow', 'crop choose', 'choose crop', 'new farmer', 'beginner', 'first time', 'emi veyali',
    'emi pantaru', 'emi cheyali', 'plan cheppu', 'start cheyali', 'kothaga', 'not know what']
  const cropMentioned = extractCrop(t)
  const acresMentioned = extractAcres(t)
  if (has(t, PLAN_WORDS) || (cropMentioned && loadPlan())) {
    const r = planReply(t, cropMentioned, acresMentioned)
    if (r) return r
  }

  /* ------------------------------------------------------- navigation verbs */
  if (has(t, ['crop doctor', 'cropdoctor', 'doctor open', 'open doctor', 'upload image', 'image check', 'cheyyi', 'open cheyyi'])) {
    return {
      text: 'Opening the AI Crop Doctor. Upload a clear photo of the affected leaf in daylight for the best assessment.',
      navigate: { href: '/crop-doctor', label: 'Open AI Crop Doctor' },
      chips: ['What can the Crop Doctor detect?', 'Talk to an expert instead'],
    }
  }
  if (has(t, ['nearby tractor', 'tractor kavali', 'tractor chupinchu', 'rent tractor', 'machinery', 'harvester', 'rotavator'])) {
    const near = [...machines].filter((m) => m.available).sort((a, b) => a.distanceKm - b.distanceKm).slice(0, 3)
    return {
      text: `Here are the closest available machines near ${farmer.location}:\n\n` +
        near.map((m, i) => `${i + 1}. ${m.name} — ${inr(m.hourly)}/hour, ${m.distanceKm} km, ${m.owner}${m.driverOption ? ' (driver available)' : ''}`).join('\n') +
        '\n\nDemo listings — prices are illustrative, not live quotes.',
      navigate: { href: '/agrirent', label: 'Open AgriRent' },
      chips: ['Book the nearest tractor', 'I need a driver too'],
    }
  }
  if (has(t, ['scheme', 'schemes', 'subsidy', 'eligible', 'eligibility', 'pm kisan', 'kisan', 'ప్రభుత్వ', 'bima'])) {
    return {
      text: `Based on your demo profile (${farmer.location}, ${farmer.totalAcres} acres, Kharif season) these look potentially relevant:\n\n` +
        ['PM-KISAN Samman Nidhi — ₹6,000 per year in three instalments',
         'PM Fasal Bima Yojana — premium subsidy on crop insurance',
         'Per Drop More Crop — up to 55% subsidy on drip / sprinkler',
         'Soil Health Card Scheme — free soil testing']
          .map((s, i) => `${i + 1}. ${s}`).join('\n') +
        '\n\nEligibility is indicative only. Confirm criteria and deadlines on the official government portal before applying.',
      navigate: { href: '/schemes', label: 'Check my eligibility' },
      chips: ['What documents do I need?', 'Show application status'],
      tone: 'caution',
    }
  }
  if (has(t, ['market price', 'price cheppu', 'price', 'rate', 'mandi', 'ధర', 'bhav'])) {
    const crop = extractCrop(t)
    const rows = crop
      ? marketRows.filter((r) => r.crop.toLowerCase().includes(crop.toLowerCase()))
      : marketRows.slice(0, 4)
    const list = (rows.length ? rows : marketRows.slice(0, 4))
    return {
      text: (crop ? `${crop} prices` : 'Today\'s sample prices') + ' (demo data):\n\n' +
        list.slice(0, 4).map((r) =>
          `• ${r.crop} — ${inr(r.price)}/${r.unit} at ${r.market} (${r.price >= r.prev ? '↑' : '↓'} ${Math.abs(((r.price - r.prev) / r.prev) * 100).toFixed(1)}%)`).join('\n') +
        '\n\nThese are illustrative sample prices, not a live mandi feed. Verify at your local market yard before selling.',
      navigate: { href: '/market', label: 'Open Market Intelligence' },
      chips: ['Compare markets', 'Show price history'],
      tone: 'caution',
    }
  }
  if (has(t, ['weather', 'rain', 'varsham', 'temperature', 'weather ela', 'వాతావరణం'])) {
    return {
      text: `Right now near ${farmer.location}: ${weather.now.temp}°C, ${weather.now.condition.toLowerCase()}, humidity ${weather.now.humidity}%, wind ${weather.now.wind} km/h.\n\n` +
        `${weather.advice}\n\nHeads up — Thursday to Friday shows 65–80% rain probability. Sample forecast for the demo, not a live meteorological feed.`,
      navigate: { href: '/weather', label: 'Open Weather & Alerts' },
      chips: ['Should I irrigate today?', '7-day forecast'],
    }
  }
  if (has(t, ['problem', 'disease', 'leaf', 'curling', 'yellow', 'spot', 'pest', 'cheyyi enti', 'enta problem', 'crop ki problem'])) {
    const d = diagnoses[0]!
    return {
      text: `From what you describe, the most common causes are:\n\n` +
        `• Leaf spot — brown lesions with darker margins, often starting on lower leaves\n` +
        `• Leaf curl — margins curling with thickened leaves, usually whitefly-vectored\n` +
        `• Nitrogen deficiency — uniform pale yellowing, older leaves first\n\n` +
        `For a proper look, upload a photo to the Crop Doctor. I can only offer general possibilities — this is assistance, not a diagnosis.`,
      navigate: { href: '/crop-doctor', label: 'Upload a photo' },
      chips: ['Open Crop Doctor', 'Talk to an expert'],
      tone: 'caution',
    }
  }

  /* --------------------------------------------------- investment question */
  if (has(t, ['investment', 'cost', 'kharchu', 'entha', 'how much', 'budget', 'avtundi', 'avvachu', 'avuthundi'])) {
    const acres = extractAcres(t) ?? farmer.totalAcres
    const crop = extractCrop(t) ?? 'Paddy'
    const plan =
      cropPlans.find((p) => p.crop.toLowerCase().includes(crop.toLowerCase())) ?? cropPlans[0]!
    const perAcre = plan.investment
    const lo = Math.round((perAcre * acres * 0.9) / 1000) * 1000
    const hi = Math.round((perAcre * acres * 1.15) / 1000) * 1000
    const rev = Math.round(plan.revenue * acres)
    return {
      text: `${acres} acre ${crop.toLowerCase()} farming ki sample assumptions prakaram estimated investment roughly ${inr(lo)} – ${inr(hi)} range lo undochu.` +
        `\n\nApproximate per-acre basis: ${inr(perAcre)} (seeds, fertilizer, labour, machinery, irrigation).` +
        `\nEstimated revenue if the crop does well: about ${inr(rev)}, so an indicative margin near ${plan.margin}%.` +
        `\n\nActual cost local input prices, labour and farming practices batti marutundi.${HEDGE.replace(' This is an estimate from sample demo assumptions — actual cost changes with local input prices, labour rates and your farming practice.', '')}` +
        `\nNothing here is a guaranteed profit.`,
      navigate: { href: '/planner', label: 'Open Smart Crop Planner' },
      chips: ['Compare with another crop', 'Show full finance breakdown'],
      tone: 'caution',
    }
  }

  /* ------------------------------------------------------------- finance */
  if (has(t, ['profit', 'finance', 'revenue', 'income', 'labham', 'earnings'])) {
    return {
      text: `Your demo farm summary across ${farmer.totalAcres} acres:\n\n` +
        `• Total investment: ${inr(169100)}\n` +
        `• Expected revenue: ${inr(285000)}\n` +
        `• Estimated profit: ${inr(115900)} (about ${inr(25756)} per acre)\n\n` +
        `These are illustrative figures for the prototype, not your real accounts.`,
      navigate: { href: '/finance', label: 'Open Farm Finance' },
      chips: ['Where is my money going?', 'Which crop earns most?'],
      tone: 'caution',
    }
  }

  /* -------------------------------------------------------------- greeting */
  if (has(t, ['hello', 'hi', 'namaste', 'namaskaram', 'hey', 'హలో', 'evaru', 'who are you'])) {
    return {
      text: `Namaskaram ${farmer.name.split(' ')[0]} 🌾 I am the AgriSmart assistant. Ask me in English, Telugu or Tenglish.\n\n` +
        `I can help with crop investment estimates, market prices, nearby machinery, scheme eligibility, weather and crop problems.\n\n` +
        `Just so you know: my answers are general assistance from sample data, not professional agricultural advice.`,
      chips: ['3 acres paddy investment entha?', 'Nearby tractor kavali', 'Naaku available schemes enti?', 'Paddy market price cheppu'],
    }
  }

  /* --------------------------------------------------------------- fallback */
  return {
    text: `I did not quite catch that. Try asking me something like:\n\n` +
      `• "3 acres paddy ki entha investment?"\n` +
      `• "Nearby tractor kavali"\n` +
      `• "Paddy market price cheppu"\n` +
      `• "Naaku available schemes enti?"\n` +
      `• "Ee crop ki problem enti?"\n\n` +
      `You can also tap the microphone and speak in Telugu.`,
    chips: ['Nearby tractor kavali', 'Available schemes enti?', 'Paddy price cheppu'],
  }
}

/* ------------------------------------------------------------- crop doctor */

/**
 * Returns one of the illustrative assessments. The pick is derived from the
 * file name and size so the same upload gives a stable, reproducible result
 * during a demo — it is NOT an image analysis. There is no model here.
 */
export function analyseCrop(fileName: string, sizeBytes: number): Diagnosis {
  const seedStr = `${fileName}:${sizeBytes}`
  let h = 0
  for (let i = 0; i < seedStr.length; i++) h = (h * 31 + seedStr.charCodeAt(i)) % 100000
  const rnd = seeded(h || 1)
  const idx = Math.floor(rnd() * diagnoses.length) % diagnoses.length
  const base = diagnoses[idx]!
  // Nudge confidence slightly per-file so repeat demos vary a little.
  const confidence = Math.min(89, Math.max(58, base.confidence + Math.round((rnd() - 0.5) * 8)))
  return { ...base, confidence }
}

/** Quick canned questions shown as chips on the Crop Doctor screen. */
export const doctorSuggestions = [
  'Is this fungal or nutritional?',
  'Should I spray now?',
  'Will it spread to other plants?',
  'Talk to an expert',
]

export const doctorDisclaimer =
  'AI-assisted information only. AgriSmart does not provide a definitive agricultural or medical diagnosis. Decisions about any treatment should be confirmed with a qualified agricultural expert or your local extension officer.'

export const assistantDisclaimer =
  'Answers are general assistance generated from sample demo data. They are not professional agricultural, financial or legal advice.'

/* ---------------------------------------------------------- plan responder */

/**
 * Answers with the saved Start Farming plan as context (single source of
 * truth). Explains the 1-acre → total-land maths transparently, asks for
 * missing information when there is no plan, and switches register between
 * English, Telugu and Tenglish based on how the farmer typed.
 * All figures are labelled estimates — never guarantees.
 */
function planReply(t: string, cropMentioned: string | null, acresMentioned: number | null): Reply | null {
  const plan = loadPlan()
  const te = /[\u0C00-\u0C7F]/.test(t)
  const tg = !te && /(naaku|naku|enti|cheppu|kavali|undi|emi|veyali|pantaru|avtundi|chesey|cheyyali)/.test(t)

  if (!plan) {
    if (!cropMentioned) {
      return {
        text:
          (te ? 'నేను మీకు పూర్తి ఫార్మ్ ప్లాన్ తయారు చేయగలను 🌱 ' : tg ? 'Nenu mee kosam full farm plan tayaru cheyagalanu 🌱 ' : 'I can build you a complete farm plan 🌱 ') +
          'I just need 7 things: (1) your village & district, (2) land size in acres/cents, (3) soil type — "don\'t know" is fine, (4) water source, (5) your budget, (6) your goal (income, family food, low water…), (7) when you want to start. ' +
          'The Start Farming wizard asks these one by one in about 2 minutes — or tell me here and I\'ll guide you.',
        navigate: { href: '/start', label: '🌱 Open Start Farming wizard' },
        chips: ['Naaku 2 acres undi, emi veyali?', 'I have ₹1 lakh budget', 'Which crop needs less water?'],
      }
    }
    return null // no plan + specific crop question → existing rules answer it
  }

  const acresPlan = totalAcres(plan)
  const acres = acresMentioned ?? acresPlan
  const key = cropMentioned ? cropKeyForName(cropMentioned) : plan.chosenCrop || rankCrops(plan)[0]!.crop
  const crop = cropInfo(key)
  const vis = cropVisual(key)
  const eco = economics({ ...plan, plots: [{ acres, cents: 0 }] }, key)
  const where = `${plan.location.village || plan.location.district || 'your area'}`
  const stage = plan.chosenCrop === key ? stageAt(plan, key) : null

  if (cropMentioned || plan.chosenCrop === key) {
    return {
      text:
        (te ? `మీ ఫార్మ్ ప్లాన్ ప్రకారం (${where}): ` : tg ? `Mee farm plan prakaram (${where}): ` : `From your farm plan (${where}): `) +
        `${vis.icon} ${vis.label} on ${Math.round(acres * 100) / 100} acres — ` +
        `1 acre costs ≈ ${inr(eco.cost)} (seeds ${inr(eco.costRows[0]!.value)}, fertilizer ${inr(eco.costRows[1]!.value)}, labour ${inr(eco.costRows[3]!.value)}, machinery ${inr(eco.costRows[4]!.value)}, irrigation ${inr(eco.costRows[5]!.value)} + pest/transport/other). ` +
        `So ${Math.round(acres * 100) / 100} acres ≈ ${inr(eco.total.cost)} total investment. ` +
        `Expected yield ≈ ${eco.yieldQ} q/acre at ≈ ${inr(eco.pricePerQ)}/qtl${eco.priceRef ? ` (${eco.priceRef.market}, ${eco.priceRef.date})` : ''} → revenue ≈ ${inr(eco.total.revenue)}, profit ≈ ${inr(eco.total.profit)}.` +
        (stage ? ` Right now your crop is in the ${stage.stage.name} stage (day ${stage.day} of ~${stage.total}).` : '') +
        ` Your budget: ${inr(budgetPerAcre(plan))}/acre. All figures are estimates — not guaranteed.`,
      navigate: { href: '/start', label: '📋 Open my Farm Plan' },
      chips: [`Why ${vis.label}?`, 'Compare with another crop', 'Today\'s farm tasks cheppu'],
      tone: 'normal',
    }
  }

  const ranked = rankCrops(plan).slice(0, 3).map((r) => {
    const c = cropVisual(r.crop)
    return `${c.icon} ${c.label} (${r.score}% fit)`
  })
  return {
    text:
      (te ? `మీ ప్లాన్ వివరాలు: ${where}, ${Math.round(acresPlan * 100) / 100} ఎకరాలు, ` : tg ? `Mee plan: ${where}, ${Math.round(acresPlan * 100) / 100} acres, ` : `Your farm plan: ${where}, ${Math.round(acresPlan * 100) / 100} acres, `) +
      `${plan.soil === 'unknown' ? 'soil test pending' : plan.soil + ' soil'}, ${plan.waterSource} water, budget ${inr(budgetPerAcre(plan))}/acre. ` +
      `Top matches for you: ${ranked.join(', ')} — fit % is indicative, not a guarantee. ` +
      `Open the plan for full economics, live weather and your crop calendar.`,
    navigate: { href: '/start', label: '📋 Open my Farm Plan' },
    chips: [cropMentioned ? `Why ${cropMentioned}?` : 'Why this ranking?', 'Today\'s farm tasks cheppu', 'Machinery kavali'],
  }
}
