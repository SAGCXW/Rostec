import express from "express";
import path from "path";
import dns from "dns";
import { createServer as createViteServer } from "vite";
import { GoogleGenAI } from "@google/genai";
import dotenv from "dotenv";

dotenv.config();

const app = express();
const PORT = 3000;

app.use(express.json());

// In-Memory Data Store for Defense Contractor Portal
let hotspots = [
  {
    id: "theater-alpha",
    name: "Levant Security Block (Arid Corridor)",
    region: "Eastern Mediterranean / Middle East",
    latitude: 31.5,
    longitude: 34.5,
    severity: "Critical",
    status: "Active Incursion / Supply Line Compromised",
    description: "Ongoing asymmetric activities disrupt maritime and ground logistics. Hostile forces are employing low-cost tactical counter-drone systems and irregular roadblocks. Aegis forces are tasked with secure transit, target convoy defense, and passive perimeter electronic counter-measures.",
    troopCount: 450,
    coordinatesLabel: "31°30'N, 34°30'E"
  },
  {
    id: "theater-beta",
    name: "Taiwan Strait Maritime Transit (Zone-9)",
    region: "East Asia / South China Sea",
    latitude: 23.5,
    longitude: 119.5,
    severity: "High",
    status: "Electronic warfare active, GPS spoofing",
    description: "Heavy maritime GPS jamming detected across coordinates. Local logistics networks report coordinate shifting. Aegis special cyber defense and naval recon assets are deployed to operate and maintain secure self-healing microwave tactical comm links and anti-interference navigation nodes.",
    troopCount: 220,
    coordinatesLabel: "23°30'N, 119°30'E"
  },
  {
    id: "theater-gamma",
    name: "Suwalki Gap Border Buffer (Sector Echo)",
    region: "Eastern Polish / Lithuanian Border",
    latitude: 54.1,
    longitude: 23.2,
    severity: "High",
    status: "Military mobilization build-up in border limits",
    description: "Heavy troop movements monitored on opposing borders. Joint response exercises are underway. Aegis units have been contracted to reinforce heavy infantry training, drone border sweep surveillance, and construct automated warning sensor boundaries.",
    troopCount: 680,
    coordinatesLabel: "54°06'N, 23°12'E"
  },
  {
    id: "theater-delta",
    name: "Andean Range Lithium Facility Area",
    region: "Northern Chile / Andean Plateau",
    latitude: -23.0,
    longitude: -67.5,
    severity: "Medium",
    status: "Civil unrest and threat of raw mining sabotage",
    description: "Anti-extraction units have threatened to seize lithium chemical mining sites. Aegis perimeter contractors are handling static base security, local thermal camera network patrols, and dynamic fast-response helicopter escort groups for engineers.",
    troopCount: 180,
    coordinatesLabel: "23°00'S, 67°30'W"
  },
  {
    id: "theater-epsilon",
    name: "Svalbard Arctic Energy Station Range",
    region: "Arctic Circle / Spitsbergen Border",
    latitude: 78.0,
    longitude: 16.0,
    severity: "Medium",
    status: "Sub-sea undersea cable signal degradation",
    description: "Energy telemetry cables show deliberate anchor scraping. Unknown research drone vessels sighted. Arctic cold weather operational squads are monitoring offshore sub-sea grid loops and managing unmanned arctic drone patrols in high winds.",
    troopCount: 140,
    coordinatesLabel: "78°00'N, 16°00'E"
  },
  {
    id: "theater-redsea",
    name: "Red Sea Maritime Choke Point (Bab el-Mandeb)",
    region: "Yemen Coast / Gulf of Aden Corridor",
    latitude: 12.6,
    longitude: 43.3,
    severity: "Critical",
    status: "Asymmetric Maritime Anti-Ship Drone Threats",
    description: "Strategic maritime corridor facing persistent remote-piloted aerial vehicle (UAV) and unmanned surface vessel (USV) harassment. Heavy commercial trade flows demand Aegis shipboard kinetic interceptors, wide-spectrum electronic jamming bubbles, and automated close-in defense operations.",
    troopCount: 310,
    coordinatesLabel: "12°36'N, 43°18'E"
  },
  {
    id: "theater-korean-dmz",
    name: "Korean Demilitarized Zone (Grid Zone Zero)",
    region: "East Asia / Korean Peninsula Border",
    latitude: 37.9,
    longitude: 126.7,
    severity: "High",
    status: "High-density artillery standby and GPS jamming",
    description: "Persistent geopolitical frontier suffering localized electronic signaling noise and active satellite spoofing plots. Opposing artillery batteries remain on standby. Aegis cybersecurity teams perform frequency analysis and reinforce secure microwave data linking.",
    troopCount: 890,
    coordinatesLabel: "37°54'N, 126°42'E"
  },
  {
    id: "theater-guyana-essequibo",
    name: "Essequibo Jungle Frontier Border Block",
    region: "Northern South America / Border Highlands",
    latitude: 6.8,
    longitude: -60.5,
    severity: "Medium",
    status: "Jungle frontier skirmishing and carbon asset claims",
    description: "Disputed claims over offshore oil reserves and mineral-rich highland forests. Jungle skirmish indicators remain elevated. Aegis deployment involves acoustic and passive infrared micro-sensors tracking across mountain trails, backed by light infantry scouting.",
    troopCount: 150,
    coordinatesLabel: "6°48'N, 60°30'W"
  },
  {
    id: "theater-malacca",
    name: "Straits of Malacca Transit Corridor",
    region: "Southeast Asia / Maritime Gateways",
    latitude: 1.4,
    longitude: 103.0,
    severity: "Low",
    status: "Asymmetric piracy and naval choke-point tracking",
    description: "Primary maritime trade pipeline prone to pirate boarding actions and small vessel stealth incursions. Aegis monitors high-speed skiff tracking matrices using remote drone imagery, while coordinating fast naval reaction escorts for high-value container cargo.",
    troopCount: 110,
    coordinatesLabel: "1°24'N, 103°00'E"
  },
  {
    id: "theater-sahel",
    name: "Sahel Desert Securitization Belt",
    region: "Sub-Saharan Africa / Mali-Niger border",
    latitude: 15.0,
    longitude: 1.5,
    severity: "High",
    status: "Active counter-insurgency and convoy ambushes",
    description: "Extremely sparse dry-desert territory with volatile movement of irregular insurgent groups. Logistical supply runs under risk of explosive ambushes. Aegis secures remote unpaved forward support bases and maintains active satellite tracking links for patrol units.",
    troopCount: 420,
    coordinatesLabel: "15°00'N, 1°30'E"
  }
];

const unitTypes = [
  {
    id: "aegis-drone-recon",
    name: "ATI-9 ShadowHawk Spy Drone",
    category: "Drone",
    baseWeeklyCost: 15400,
    description: "Unmanned stealth atmospheric intelligence gatherer. Features hybrid optical-infrared and terrain radar imaging with synthetic aperture technology.",
    stats: { armor: 15, mobility: 95, cyberRange: 70, reconRange: 100 }
  },
  {
    id: "aegis-drone-heavy",
    name: "ATI-14 Titan Strike Intereceptor",
    category: "Drone",
    baseWeeklyCost: 28500,
    description: "Low-altitude heavy kinetic response UAS, armed with state-of-the-art countermeasures to intercept rogue attack UAS in host territory.",
    stats: { armor: 48, mobility: 88, cyberRange: 40, reconRange: 75 }
  },
  {
    id: "aegis-infantry-spec",
    name: "Aegis Advanced Tactical Close Protection Force",
    category: "Infantry",
    baseWeeklyCost: 32000,
    description: "Highly elite special operations unit trained in high-threat VIP escort, counter-terrorism, hostage resolution, and rapid deployment urban logistics.",
    stats: { armor: 65, mobility: 78, cyberRange: 55, reconRange: 60 }
  },
  {
    id: "aegis-armor-mastodon",
    name: "ATI-M20 Mastodon Mobile Base Shield",
    category: "Armor",
    baseWeeklyCost: 74200,
    description: "Fully-armored tactical control transporter designed for mobile electronic countermeasure bubbles. Blocks GPS and radio detonation triggers up to 5km.",
    stats: { armor: 100, mobility: 30, cyberRange: 85, reconRange: 45 }
  },
  {
    id: "aegis-cyber-intercept",
    name: "Aegis Cryptographic Warfare Module",
    category: "Cyber",
    baseWeeklyCost: 45000,
    description: "Transportable signal capture shelter with satellite communications suite. Monitors local airwaves, intercepts telemetry and performs real-time decryption protocols.",
    stats: { armor: 20, mobility: 40, cyberRange: 100, reconRange: 80 }
  },
  {
    id: "aegis-logistic-heavy",
    name: "Aegis Armored Cargo Lifter Group",
    category: "Logistics",
    baseWeeklyCost: 21000,
    description: "Multi-trailer land transit platforms with secondary air extraction modules, designed for safe tactical weapons and dry supply delivery.",
    stats: { armor: 80, mobility: 55, cyberRange: 20, reconRange: 30 }
  }
];

// Initial group allocations
let deploymentGroups = [
  {
    id: "group-101",
    unitId: "aegis-drone-recon",
    unitName: "ATI-9 ShadowHawk Spy Drone",
    quantity: 4,
    weeklyCostSubtotal: 61600,
    theaterId: "theater-alpha",
    status: "Deployed"
  },
  {
    id: "group-102",
    unitId: "aegis-infantry-spec",
    unitName: "Aegis Advanced Tactical Close Protection Force",
    quantity: 2,
    weeklyCostSubtotal: 64000,
    theaterId: "theater-alpha",
    status: "Deployed"
  },
  {
    id: "group-103",
    unitId: "aegis-cyber-intercept",
    unitName: "Aegis Cryptographic Warfare Module",
    quantity: 1,
    weeklyCostSubtotal: 45000,
    theaterId: "theater-beta",
    status: "Standby"
  },
  {
    id: "group-104",
    unitId: "aegis-drone-heavy",
    unitName: "ATI-14 Titan Strike Intereceptor",
    quantity: 3,
    weeklyCostSubtotal: 85500,
    theaterId: "theater-gamma",
    status: "In-Transit"
  }
];

// Live Progress and Position Tracker
let liveTrackerDeployments = [
  {
    id: "track-corridor-alpha",
    name: "Convoy Delta Shield Patrol",
    theater: "Levant Security Block (Arid Corridor)",
    coordinates: "31.32N, 34.35E",
    phase: "Phase 4 - Active Escort En Route",
    percentageComplete: 74,
    status: "Operational",
    riskRating: "Extreme",
    personnelCount: 42,
    supportingDroneUnits: 3,
    eta: "04:15 HRS UTC",
    logEntries: [
      { timestamp: "02:30 UTC", message: "Convoy entered secondary arid highway sector. Signal interference level normal.", level: "INFO" },
      { timestamp: "03:15 UTC", message: "UAS warning radar alert. Non-hostile commercial drone spotted at 500m.", level: "WARNING" },
      { timestamp: "04:02 UTC", message: "Primary signal spoofing block initialized around Mastodon vehicle.", level: "INFO" }
    ]
  },
  {
    id: "track-strait-radar",
    name: "Taiwan Strait Passive Anti-Spoof Grid Setup",
    theater: "Taiwan Strait Maritime Transit (Zone-9)",
    coordinates: "23.48N, 119.32E",
    phase: "Phase 2 - Relay Point Hardening",
    percentageComplete: 38,
    status: "Deploying",
    riskRating: "High",
    personnelCount: 15,
    supportingDroneUnits: 12,
    eta: "11:45 HRS UTC (Estimated)",
    logEntries: [
      { timestamp: "05:10 UTC", message: "Hydrographic scan completed at marine buoy node 4B.", level: "INFO" },
      { timestamp: "05:22 UTC", message: "GPS telemetry loop lost on drone SD-4. Commencing automatic visual inertia hold.", level: "WARNING" },
      { timestamp: "05:25 UTC", message: "Vessel signal tracking compromised. Jamming source localized to western maritime sector.", level: "CRITICAL" }
    ]
  },
  {
    id: "track-redsea-transit",
    name: "Bab el-Mandeb Safe Shipping escort Alpha",
    theater: "Red Sea Maritime Choke Point (Bab el-Mandeb)",
    coordinates: "12.55N, 43.28E",
    phase: "Phase 3 - Tactical Air Umbrella Sweep",
    percentageComplete: 52,
    status: "Operational",
    riskRating: "Extreme",
    personnelCount: 88,
    supportingDroneUnits: 16,
    eta: "08:30 HRS UTC",
    logEntries: [
      { timestamp: "06:12 UTC", message: "Fleet entered littoral warning margins. High concentration of commercial radio chatter.", level: "INFO" },
      { timestamp: "07:05 UTC", message: "Unidentified high-speed surface craft tracked moving parallel. Launching warning flare vectors.", level: "WARNING" },
      { timestamp: "07:44 UTC", message: "Localized jamming loop detected from coastal signals node. Activating Mastodon filtering protocols.", level: "CRITICAL" }
    ]
  },
  {
    id: "track-dmz-sensor",
    name: "DMZ Frequency Sweep and Microwaves Hardening",
    theater: "Korean Demilitarized Zone (Grid Zone Zero)",
    coordinates: "37.89N, 126.68E",
    phase: "Phase 1 - Handshake Sync with Allied Relays",
    percentageComplete: 15,
    status: "Deploying",
    riskRating: "High",
    personnelCount: 20,
    supportingDroneUnits: 8,
    eta: "18:00 HRS UTC",
    logEntries: [
      { timestamp: "08:10 UTC", message: "Deployed base station transceiver array Echo-2.", level: "INFO" },
      { timestamp: "08:45 UTC", message: "High-magnitude signal noise detected on frequency bands. Triggering diagnostic filter sweep.", level: "WARNING" }
    ]
  },
  {
    id: "track-arctic-patrol",
    name: "Arctic energy cable offshore acoustic monitor array",
    theater: "Svalbard Arctic Energy Station Range",
    coordinates: "78.02N, 15.98E",
    phase: "Phase 5 - Autonomous Calibration Patrol",
    percentageComplete: 95,
    status: "Securing",
    riskRating: "Medium",
    personnelCount: 6,
    supportingDroneUnits: 5,
    eta: "01:30 HRS UTC",
    logEntries: [
      { timestamp: "01:00 UTC", message: "Undersea hydrophone signal integrated into regional hub.", level: "INFO" },
      { timestamp: "01:15 UTC", message: "Subzero mechanical testing successfully validated.", level: "INFO" }
    ]
  }
];

// Mock database for secure client messages & auditing logs
const clientQueryLogs: any[] = [];
let clientProfiles: Array<{
  clearanceLevel: string;
  orgName: string;
  clientId: string;
  apiKeyHash: string;
  connected: boolean;
  notes: string;
}> = [
  {
    clearanceLevel: "COSMIC-TS",
    orgName: "Ministry of Defense (Directorate Alpha)",
    clientId: "CL-8109-COSMIC",
    apiKeyHash: "5f89c09aa",
    connected: false,
    notes: "Requires real-time decrypt stream and highest priority satellite tasking."
  },
  {
    clearanceLevel: "LEVEL-3",
    orgName: "Aero Logistics Global",
    clientId: "CL-4091-GLOBAL",
    apiKeyHash: "2a9e22fb",
    connected: false,
    notes: "Coordinating strategic lithium route patrols for security team."
  }
];

// Lazy-initialized Gemini API client
let aiClient: GoogleGenAI | null = null;
function getGeminiClient(): GoogleGenAI | null {
  if (!aiClient) {
    const key = process.env.GEMINI_API_KEY;
    if (key && key !== "MY_GEMINI_API_KEY") {
      aiClient = new GoogleGenAI({
        apiKey: key,
        httpOptions: {
          headers: {
            "User-Agent": "aistudio-build",
          },
        },
      });
      console.log("Rostec Security Gateway: Gemini Intelligence Client loaded successfully.");
    } else {
      console.warn("Rostec Security Gateway: GEMINI_API_KEY is unset or default. Running with simulated localized threat synthesis fallback.");
    }
  }
  return aiClient;
}

// REST APIs
app.get("/api/hotspots", (req, res) => {
  res.json(hotspots);
});

app.get("/api/units", (req, res) => {
  res.json(unitTypes);
});

app.get("/api/procurement", (req, res) => {
  res.json(deploymentGroups);
});

app.post("/api/procurement", (req, res) => {
  const { unitId, quantity, theaterId } = req.body;
  if (!unitId || !quantity || !theaterId) {
    return res.status(400).json({ error: "Required fields missing: unitId, quantity, theaterId" });
  }

  const unit = unitTypes.find(u => u.id === unitId);
  const theater = hotspots.find(h => h.id === theaterId);

  if (!unit || !theater) {
    return res.status(404).json({ error: "Associated Unit type or Theater zone not found." });
  }

  const qty = parseInt(quantity, 10);
  if (isNaN(qty) || qty <= 0) {
    return res.status(400).json({ error: "Quantity must be a positive integer" });
  }

  const newGroup = {
    id: `group-${Date.now().toString().slice(-4)}`,
    unitId: unit.id,
    unitName: unit.name,
    quantity: qty,
    weeklyCostSubtotal: unit.baseWeeklyCost * qty,
    theaterId: theater.id,
    status: "Standby" as const
  };

  deploymentGroups.push(newGroup);

  // Update troop count in theater estimate
  if (unit.category === "Infantry") {
    theater.troopCount += qty * 30; // 30 soldiers per tactical group
  }

  res.status(201).json(newGroup);
});

app.post("/api/procurement/package", (req, res) => {
  const { packageId, theaterId } = req.body;
  if (!packageId || !theaterId) {
    return res.status(400).json({ error: "Required fields missing: packageId, theaterId" });
  }

  const theater = hotspots.find(h => h.id === theaterId);
  if (!theater) {
    return res.status(404).json({ error: "Associated Theater zone not found." });
  }

  // Pre-configured Rostec Formation Packages configurations
  const packagesConfig: Record<string, Array<{ unitId: string; quantity: number }>> = {
    "pack-sof": [
      { unitId: "aegis-infantry-spec", quantity: 2 }
    ],
    "pack-isr": [
      { unitId: "aegis-drone-recon", quantity: 3 },
      { unitId: "aegis-drone-heavy", quantity: 1 }
    ],
    "pack-cyber": [
      { unitId: "aegis-cyber-intercept", quantity: 1 },
      { unitId: "aegis-armor-mastodon", quantity: 1 }
    ],
    "pack-rapid": [
      { unitId: "aegis-armor-mastodon", quantity: 1 },
      { unitId: "aegis-infantry-spec", quantity: 1 },
      { unitId: "aegis-logistic-heavy", quantity: 2 }
    ]
  };

  const packUnits = packagesConfig[packageId];
  if (!packUnits) {
    return res.status(404).json({ error: "Formation package configuration not found." });
  }

  const addedGroups = [];
  const baseTimeStr = Date.now().toString().slice(-4);
  
  for (let idx = 0; idx < packUnits.length; idx++) {
    const item = packUnits[idx];
    const unit = unitTypes.find(u => u.id === item.unitId);
    if (unit) {
      const newGroup = {
        id: `fbnd-${baseTimeStr}-${idx + 1}`,
        unitId: unit.id,
        unitName: unit.name,
        quantity: item.quantity,
        weeklyCostSubtotal: unit.baseWeeklyCost * item.quantity,
        theaterId: theater.id,
        status: "Deployed" as const
      };
      deploymentGroups.push(newGroup);
      
      if (unit.category === "Infantry") {
        theater.troopCount += item.quantity * 30; // 30 per group element
      }
      addedGroups.push(newGroup);
    }
  }

  res.status(201).json({
    message: "Rostec Tactical Formation Package deployed successfully.",
    deployedGroups: addedGroups
  });
});

app.delete("/api/procurement/:id", (req, res) => {
  const { id } = req.params;
  const index = deploymentGroups.findIndex(g => g.id === id);
  if (index === -1) {
    return res.status(404).json({ error: "Specified group not found." });
  }
  const deleted = deploymentGroups.splice(index, 1)[0];
  res.json({ message: "Procurement record de-allocated successfully.", deleted });
});

app.get("/api/tracker", (req, res) => {
  res.json(liveTrackerDeployments);
});

app.post("/api/tracker/update", (req, res) => {
  const { trackerId, percentage, status, logMessage, logType } = req.body;
  const tracker = liveTrackerDeployments.find(t => t.id === trackerId);

  if (!tracker) {
    return res.status(404).json({ error: "Active mission deployment tracker not found." });
  }

  if (percentage !== undefined) {
    const pct = parseInt(percentage, 10);
    if (!isNaN(pct)) {
      tracker.percentageComplete = Math.min(100, Math.max(0, pct));
    }
  }

  if (status) {
    tracker.status = status;
  }

  if (logMessage) {
    tracker.logEntries.unshift({
      timestamp: new Date().toISOString().substring(11, 16) + " UTC",
      message: logMessage,
      level: logType || "INFO"
    });
    // Keep logs trimmed
    if (tracker.logEntries.length > 7) {
      tracker.logEntries.pop();
    }
  }

  res.json(tracker);
});

// Secure Client Portal Authentication
app.post("/api/client/auth", (req, res) => {
  const { clientId, secretKey } = req.body;
  if (!clientId || !secretKey) {
    return res.status(400).json({ authenticated: false, error: "Missing identity credentials" });
  }

  // Simple look up
  const client = clientProfiles.find(c => c.clientId === clientId && secretKey === "AEGIS_SECURE_KEY");
  
  if (client) {
    client.connected = true;
    res.json({
      authenticated: true,
      profile: {
        clientId: client.clientId,
        orgName: client.orgName,
        clearanceLevel: client.clearanceLevel,
        notes: client.notes
      }
    });
  } else {
    // Check if they want to provision a new profile on-the-fly for demo
    if (clientId.startsWith("CL-") && secretKey === "demo") {
      const demoProfile = {
        clientId,
        orgName: "Global Coalition Liaison (" + clientId.substring(3) + ")",
        clearanceLevel: "LEVEL-2",
        apiKeyHash: "demo_hash",
        connected: true,
        notes: "On-demand credential validation bypass active."
      };
      clientProfiles.push(demoProfile);
      return res.json({
        authenticated: true,
        profile: demoProfile
      });
    }

    res.status(403).json({
      authenticated: false,
      error: "Access Denied. Secret cryptographic authentication payload mismatch."
    });
  }
});

app.post("/api/client/logout", (req, res) => {
  const { clientId } = req.body;
  const client = clientProfiles.find(c => c.clientId === clientId);
  if (client) {
    client.connected = false;
  }
  res.json({ success: true });
});

// Secure Threat Briefing Generation using Gemini API (with deterministic offline fallback)
app.post("/api/threat-briefing", async (req, res) => {
  const { theaterId, clearanceLevel, customizationOptions } = req.body;
  const theater = hotspots.find(h => h.id === theaterId);

  if (!theater) {
    return res.status(404).json({ error: "Strategic Theater not recognized" });
  }

  const clearance = clearanceLevel || "LEVEL-1";
  const focus = customizationOptions || "Strategic Overview";

  // Build a query record
  const logId = `LOG-${Date.now().toString().slice(-6)}`;
  const timestamp = new Date().toISOString();

  let briefContent = "";
  let isAiGenerated = false;

  try {
    const ai = getGeminiClient();

    if (ai) {
      const prompt = `You are the Rostec Core Security Analysis AI (Model ATI-X).
      Generate a highly realistic tactical military battleground or threat brief dossier for Rostec defense contractors.
      
      DATA POINT BRIEFING:
      - Theater Name: "${theater.name}"
      - Geographical Region: "${theater.region}"
      - Stated Conflict Coordinates: "${theater.coordinatesLabel}"
      - Threat Level Assessment: "${theater.severity}" (Core Alert: ${theater.status})
      - Background Intelligence: "${theater.description}"
      - Current Mobilized Troops count: ${theater.troopCount} contractors
      - Clearance Authorization Level: "${clearance}"
      - Analysis Focus requested: "${focus}"
      
      Requirements for document layout:
      1. Display simulated military cryptographic security markers at the top: encrypted hashes, classified distribution bans.
      2. Present a "Section I: THREAT MATRIX ANALYSIS" evaluating why coordinates are unstable, assessing topography, local active armed groups, and logistical blockades.
      3. Present a "Section II: RECONNAISSANCE TELEMETRY SURVEY" recommending exact drone surveillance models and jamming counters.
      4. Present a "Section III: COST-SENSITIVE UNIT TASKING SUGGESTION" recommending dynamic group sizing based on contractor unit costs (such as drones at $15k/wk, special units at $32k/wk) to mitigate theater risk optimally under the "${clearance}" clearance guidelines.
      5. Sound highly authoritative, disciplined, precise, realistic, and factual. Do not use generic placeholders.
      6. Output clean markdown. Crucial: Do not output any markdown code blocks enclosing the overall response (e.g. \`\`\`markdown or \`\`\`), just start with the text directly.`;

      const response = await ai.models.generateContent({
        model: "gemini-3.5-flash",
        contents: prompt,
        config: {
          temperature: 0.25,
        }
      });

      if (response && response.text) {
        briefContent = response.text;
        isAiGenerated = true;
      }
    }
  } catch (err: any) {
    console.error("Aegis Security Gateway: Gemini call encountered error, engaging localized cryptosynthetic fallbacks.", err.message);
  }

  // Fallback engine if Gemini fails or API Key was default/not configured
  if (!briefContent) {
    // Rich simulated response
    briefContent = `
# AEGIS TACTICAL CORE — SEGREGATED INTEL ARCHIVE
## CLASSIFIED DOSSIER - SECURITY CLEARANCE: [${clearance.toUpperCase()}]
### COGNIZANT SECURITY OFFICE: ATI COMMAND WEAPONS LABS
### TACTICAL LOG ENTRY ID: ${logId} // DATESEC: ${timestamp}

---

## 🔒 SECURITY NOTICE
**NATIONAL SECURITY INFORMATION BYPASS PROHIBITED.** UNAUTHORIZED DISCLOSURE IS SUBJECT TO CIVIL AND TACTICAL DEFENSIVE RECONSTITUTIVE MEASURES.

---

## SECTION I: SITUATION REPORT & THREAT ASSESSMENT
Intel analysis has successfully evaluated the strategic context of **${theater.name}** within the critical operational quadrant of **${theater.region}** (Sector Position coordinates: \`${theater.coordinatesLabel}\`).

*   **Tactical Warning Alert**: \`${theater.status}\`
*   **Adversary Force Profile**: Irregular hybrid mobile skirmish units paired with local electronic warfare emitters. Intermittent radar disruptions are active at ground levels.
*   **Infrastructure Risk**: Extreme. Supply lines currently bypass localized chokepoints where road mines and electronic signal spoofing are localized. 
*   **Troop Complement Status**: ${theater.troopCount} Rostec personnel active in theater perimeter defense.

## SECTION II: OPERATIONAL DIRECTIVE — FOCUS [${focus.toUpperCase()}]
Based on authorization level **${clearance}** requirements, current Rostec intelligence recommends immediate action items:

1.  **Deploy Airborne Eyes**: Establish continuous passive flight loops using the **ATI-9 ShadowHawk Spy Drone** outside jamming frequency limits (6.8GHz band) to maintain dynamic visual line-of-sight tracking.
2.  **Activate Cyber Protective Bubble**: Bring one mobile **ATI-M20 Mastodon Base Shield** unit online to filter incoming communication protocols and shield team radio nodes.
3.  **Deploy High-Density Perimeter Groups**: Reposition infantry units around vulnerable extraction points in Arid corridor sections.

## SECTION III: OPTIMIZED LEDGER ESTIMATES
*   **Tactical Phase Forecast**: Escalated risk indicators demand active radar sweeps.
*   **Recommended Contractor Matrix**:
    *   *Airborne Tier*: ATI-9 ShadowHawk (Estimated cost: $15,400 per unit weekly) — Optimal count: 3 units.
    *   *Heavy Logistic Tier*: Aegis Armored Cargo Transporters ($21,000 per unit weekly) to prevent critical cargo sabotage.
*   **Operations Warning**: Coordinate defensive tracking loops directly with Rostec High Command before deploying.

---
*ATICORE-SIGNATURE: [SHA256: 0D15AE31FC4E88B991A5E12E0921BCAE42A9BDCA9B9F0E17A88FA71B78D8D]*
`;
  }

  const queryLog = {
    id: logId,
    timestamp,
    theaterId: theater.id,
    queryType: focus,
    threatBriefingText: briefContent,
    clearanceAsserted: clearance
  };

  clientQueryLogs.unshift(queryLog);

  res.json({
    logId: queryLog.id,
    isAiGenerated,
    assessment: queryLog.threatBriefingText,
    timestamp: queryLog.timestamp
  });
});

app.get("/api/client/logs", (req, res) => {
  res.json(clientQueryLogs);
});

async function startServer() {
  // Vite middleware pipeline in development
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), "dist");
    app.use(express.static(distPath));
    app.get("*", (req, res) => {
      res.sendFile(path.join(distPath, "index.html"));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`[ROSTEC SECURITY PORTAL] Server online and binding at port ${PORT}`);
  });
}

startServer();
