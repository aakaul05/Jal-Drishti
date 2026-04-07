export type Locale = "en" | "hi" | "mr";

/** Flat message map shared across locales */
export type Messages = {
  // Language UI
  languageLabel: string;
  langEnglish: string;
  langHindi: string;
  langMarathi: string;

  // Region sidebar
  regionalSelection: string;
  timePeriod: string;
  district: string;
  subDistrict: string;
  village: string;
  selectDistrict: string;
  selectSubDistrict: string;
  selectVillage: string;
  month: string;
  year: string;
  selectMonth: string;
  selectYear: string;
  yearCurrent: string;
  yearPrediction: string;
  summaryPredicted: string;

  // Months (full) 1–12
  month_1: string;
  month_2: string;
  month_3: string;
  month_4: string;
  month_5: string;
  month_6: string;
  month_7: string;
  month_8: string;
  month_9: string;
  month_10: string;
  month_11: string;
  month_12: string;

  // Months (short, charts)
  mon_1: string;
  mon_2: string;
  mon_3: string;
  mon_4: string;
  mon_5: string;
  mon_6: string;
  mon_7: string;
  mon_8: string;
  mon_9: string;
  mon_10: string;
  mon_11: string;
  mon_12: string;

  // Water chart
  selectRegionToBegin: string;
  chooseFromSidebar: string;
  groundwaterDepthAnalysis: string;
  legendHistoricalYearly: string;
  legendCurrentMonthly: string;
  legendPredictedMonthly: string;
  depthFt: string;
  yearLabel: string;
  predicted: string;
  currentYear: string;
  confidenceInterval: string;
  currentYearAxis: string;

  // Risk
  selectRegionRiskAnalysis: string;
  riskEngine: string;
  riskLow: string;
  riskModerate: string;
  riskHigh: string;
  riskSevere: string;
  r2Score: string;
  currentDepth: string;
  annualChange: string;
  predictionHorizon: string;
  eightYears: string;
  modelAccuracy: string;

  // Advisory
  advisoryUpdatesAfterSelect: string;

  // Map
  mapLocation: string;
  mapImageAlt: string;
  loadingMap: string;
  mapImageNotFound: string;
  mapPlaceHint: string;

  // Monthly insight
  monthlyInsights: string;
  selectMonthYearInsight: string;
  noDataForPeriod: string;
  expectedDepth: string;
  monthlyChange: string;
  analysisRecommendations: string;

  // Multilingual card / glossary
  glossaryMaharashtra: string;
  glossaryWaterLevel: string;
  glossaryGroundwater: string;
  glossaryDepth: string;
  glossaryPrediction: string;
  riskShortLow: string;
  riskShortModerate: string;
  riskShortHigh: string;
  riskShortSevere: string;

  analysis: string;
  location: string;
  current_year: string;
  next_year: string;
  commonTerms: string;
  riskLevelLabel: string;
  farmerSupportBlurb: string;

  // Farmer analysis
  farmerAnalysis: string;
  pleaseSelectRegion: string;
  expandLess: string;
  expandMore: string;
  waterLevelStatus: string;
  trendStatus: string;
  periodLabel: string;
  wlGood: string;
  wlModerate: string;
  wlCritical: string;
  trImproving: string;
  trStable: string;
  trDeclining: string;
  actionItemsHeading: string;
  speaking: string;
  listenAnalysis: string;

  // Farmer recommendations (template)
  fa_rec_good: string;
  fa_rec_moderate: string;
  fa_rec_critical: string;
  fa_act_good_1: string;
  fa_act_good_2: string;
  fa_act_good_3: string;
  fa_act_mod_1: string;
  fa_act_mod_2: string;
  fa_act_mod_3: string;
  fa_act_crit_1: string;
  fa_act_crit_2: string;
  fa_act_crit_3: string;
  fa_act_crit_4: string;

  // Chat
  chatTitle: string;
  chatWelcome: string;
  chatPlaceholder: string;
  chatSelectRegionFirst: string;
  chatHelpBody: string;
  chatDefaultReply: string;
  chatRiskLow: string;
  chatRiskModerate: string;
  chatRiskHigh: string;
  chatRiskSevere: string;
  chatDepthReply: string;
  chatPredictReply: string;

  // Not found
  notFoundTitle: string;
  notFoundBody: string;
  returnHome: string;
};

const en: Messages = {
  languageLabel: "Language",
  langEnglish: "English",
  langHindi: "हिंदी",
  langMarathi: "मराठी",

  regionalSelection: "Regional Selection",
  timePeriod: "Time Period",
  district: "District",
  subDistrict: "Sub-district",
  village: "Village",
  selectDistrict: "Select district",
  selectSubDistrict: "Select sub-district",
  selectVillage: "Select village",
  month: "Month",
  year: "Year",
  selectMonth: "Select month",
  selectYear: "Select year",
  yearCurrent: "(Current)",
  yearPrediction: "(Prediction)",
  summaryPredicted: "Predicted",

  month_1: "January",
  month_2: "February",
  month_3: "March",
  month_4: "April",
  month_5: "May",
  month_6: "June",
  month_7: "July",
  month_8: "August",
  month_9: "September",
  month_10: "October",
  month_11: "November",
  month_12: "December",

  mon_1: "Jan",
  mon_2: "Feb",
  mon_3: "Mar",
  mon_4: "Apr",
  mon_5: "May",
  mon_6: "Jun",
  mon_7: "Jul",
  mon_8: "Aug",
  mon_9: "Sep",
  mon_10: "Oct",
  mon_11: "Nov",
  mon_12: "Dec",

  selectRegionToBegin: "Select a region to begin analysis",
  chooseFromSidebar: "Choose from the sidebar to view water level data",
  groundwaterDepthAnalysis: "Groundwater Depth Analysis",
  legendHistoricalYearly: "Historical (Yearly)",
  legendCurrentMonthly: "Current Year (Monthly)",
  legendPredictedMonthly: "Predicted (Monthly)",
  depthFt: "Depth",
  yearLabel: "Year",
  predicted: "Predicted",
  currentYear: "Current Year",
  confidenceInterval: "95% CI",
  currentYearAxis: "Current Year",

  selectRegionRiskAnalysis: "Select a region to view risk analysis",
  riskEngine: "Risk Engine",
  riskLow: "Low Risk",
  riskModerate: "Moderate Risk",
  riskHigh: "High Risk",
  riskSevere: "Severe Risk",
  r2Score: "R² Score",
  currentDepth: "Current Depth",
  annualChange: "Annual Change",
  predictionHorizon: "Prediction Horizon",
  eightYears: "8 Years",
  modelAccuracy: "Model Accuracy",

  advisoryUpdatesAfterSelect: "Advisory updates will appear here after selecting a region.",

  mapLocation: "LOCATION",
  mapImageAlt: "Maharashtra map",
  loadingMap: "Loading map...",
  mapImageNotFound: "Map image not found",
  mapPlaceHint: "Place your image as:",

  monthlyInsights: "Monthly Insights",
  selectMonthYearInsight: "Select a month and year to view detailed insights",
  noDataForPeriod: "No data available for selected period",
  expectedDepth: "Expected Depth",
  monthlyChange: "Monthly Change",
  analysisRecommendations: "Analysis & Recommendations",

  glossaryMaharashtra: "Maharashtra",
  glossaryWaterLevel: "Water level",
  glossaryGroundwater: "Groundwater",
  glossaryDepth: "Depth",
  glossaryPrediction: "Prediction",
  riskShortLow: "Low",
  riskShortModerate: "Moderate",
  riskShortHigh: "High",
  riskShortSevere: "Severe",

  analysis: "Analysis",
  location: "Location",
  current_year: "Current year",
  next_year: "Next year",
  commonTerms: "Common terms",
  riskLevelLabel: "Risk levels",
  farmerSupportBlurb:
    "🌾 Maharashtra farmer support — switch language anytime using the buttons above.",

  farmerAnalysis: "Farmer Analysis",
  pleaseSelectRegion: "Please select a region from the sidebar.",
  expandLess: "Less",
  expandMore: "More",
  waterLevelStatus: "Water level",
  trendStatus: "Trend",
  periodLabel: "Period",
  wlGood: "Good",
  wlModerate: "Moderate",
  wlCritical: "Critical",
  trImproving: "Improving",
  trStable: "Stable",
  trDeclining: "Declining",
  actionItemsHeading: "Suggested actions",
  speaking: "Speaking…",
  listenAnalysis: "Listen to analysis",

  fa_rec_good: "Water level is good. Continue sustainable use.",
  fa_rec_moderate: "Water level is moderate. Reduce pumping and conserve.",
  fa_rec_critical: "Water level is critical. Seek urgent advisory and water-saving measures.",
  fa_act_good_1: "Maintain current practices",
  fa_act_good_2: "Use water efficiently",
  fa_act_good_3: "Monitor wells regularly",
  fa_act_mod_1: "Reduce peak-hour pumping",
  fa_act_mod_2: "Harvest rainwater",
  fa_act_mod_3: "Check for leaks",
  fa_act_crit_1: "Contact local agriculture office",
  fa_act_crit_2: "Avoid over-extraction",
  fa_act_crit_3: "Use drip irrigation if possible",
  fa_act_crit_4: "Plan crop water use",

  chatTitle: "Jal-Drishti AI",
  chatWelcome:
    "Welcome to **Jal-Drishti AI Assistant**. Select a region and ask about groundwater risks, predictions, or recommendations.",
  chatPlaceholder: "Ask about water levels…",
  chatSelectRegionFirst:
    "Please select a region from the sidebar first — then I can share detailed groundwater analysis.",
  chatHelpBody:
    "I can help with:\n\n- **Risk** — Ask about risk levels\n- **Depth** — Current groundwater depth\n- **Predictions** — Future water level forecasts\n- **Advisory** — Recommended actions\n\nTry: *“What is my risk?”* or *“What is the predicted depth?”*",
  chatDefaultReply:
    "For **{region}**: Current depth is {depth} ft with **{risk}** risk. Annual change is **{rate}** ft/year. Ask about risk, predictions, or recommendations.",
  chatRiskLow: "low risk — groundwater levels are stable",
  chatRiskModerate: "moderate risk — some decline observed; monitoring recommended",
  chatRiskHigh: "high risk — significant decline detected; intervention needed",
  chatRiskSevere: "severe risk — critical depletion rate; urgent action required",
  chatDepthReply:
    "Current groundwater depth at **{region}** is **{depth}** feet. Historical data spans 10 years; predictions extend 8 years forward.",
  chatPredictReply:
    "Using our model (R² = {r2}), projected depth at **{region}** by **{year}** is about **{depth}** ft (95% CI: {lo}–{hi} ft).",

  notFoundTitle: "Oops! Page not found",
  notFoundBody: "The page you are looking for does not exist.",
  returnHome: "Return to Home",
};

const hi: Messages = {
  languageLabel: "भाषा",
  langEnglish: "English",
  langHindi: "हिंदी",
  langMarathi: "मराठी",

  regionalSelection: "क्षेत्र चयन",
  timePeriod: "समय अवधि",
  district: "ज़िला",
  subDistrict: "उप-ज़िला",
  village: "गाँव",
  selectDistrict: "ज़िला चुनें",
  selectSubDistrict: "उप-ज़िला चुनें",
  selectVillage: "गाँव चुनें",
  month: "माह",
  year: "वर्ष",
  selectMonth: "माह चुनें",
  selectYear: "वर्ष चुनें",
  yearCurrent: "(वर्तमान)",
  yearPrediction: "(पूर्वानुमान)",
  summaryPredicted: "पूर्वानुमानित",

  month_1: "जनवरी",
  month_2: "फरवरी",
  month_3: "मार्च",
  month_4: "अप्रैल",
  month_5: "मई",
  month_6: "जून",
  month_7: "जुलाई",
  month_8: "अगस्त",
  month_9: "सितंबर",
  month_10: "अक्टूबर",
  month_11: "नवंबर",
  month_12: "दिसंबर",

  mon_1: "जन",
  mon_2: "फर",
  mon_3: "मार्च",
  mon_4: "अप्रै",
  mon_5: "मई",
  mon_6: "जून",
  mon_7: "जुल",
  mon_8: "अग",
  mon_9: "सित",
  mon_10: "अक्टू",
  mon_11: "नव",
  mon_12: "दिस",

  selectRegionToBegin: "विश्लेषण शुरू करने के लिए क्षेत्र चुनें",
  chooseFromSidebar: "जल स्तर डेटा देखने के लिए बाईं पट्टी से चुनें",
  groundwaterDepthAnalysis: "भूजल गहराई विश्लेषण",
  legendHistoricalYearly: "ऐतिहासिक (वार्षिक)",
  legendCurrentMonthly: "वर्तमान वर्ष (मासिक)",
  legendPredictedMonthly: "पूर्वानुमानित (मासिक)",
  depthFt: "गहराई",
  yearLabel: "वर्ष",
  predicted: "पूर्वानुमानित",
  currentYear: "वर्तमान वर्ष",
  confidenceInterval: "95% विश्वास अंतराल",
  currentYearAxis: "वर्तमान वर्ष",

  selectRegionRiskAnalysis: "जोखिम विश्लेषण के लिए क्षेत्र चुनें",
  riskEngine: "जोखिम इंजन",
  riskLow: "कम जोखिम",
  riskModerate: "मध्यम जोखिम",
  riskHigh: "उच्च जोखिम",
  riskSevere: "गंभीर जोखिम",
  r2Score: "R² स्कोर",
  currentDepth: "वर्तमान गहराई",
  annualChange: "वार्षिक परिवर्तन",
  predictionHorizon: "पूर्वानुमान सीमा",
  eightYears: "8 वर्ष",
  modelAccuracy: "मॉडल सटीकता",

  advisoryUpdatesAfterSelect: "क्षेत्र चुनने के बाद सलाह यहाँ दिखेगी।",

  mapLocation: "स्थान",
  mapImageAlt: "महाराष्ट्र का मानचित्र",
  loadingMap: "मानचित्र लोड हो रहा है…",
  mapImageNotFound: "मानचित्र छवि नहीं मिली",
  mapPlaceHint: "छवि यहाँ रखें:",

  monthlyInsights: "मासिक अंतर्दृष्टि",
  selectMonthYearInsight: "विस्तृत जानकारी के लिए माह और वर्ष चुनें",
  noDataForPeriod: "चयनित अवधि के लिए डेटा उपलब्ध नहीं",
  expectedDepth: "अपेक्षित गहराई",
  monthlyChange: "मासिक परिवर्तन",
  analysisRecommendations: "विश्लेषण और सुझाव",

  glossaryMaharashtra: "महाराष्ट्र",
  glossaryWaterLevel: "जल स्तर",
  glossaryGroundwater: "भूजल",
  glossaryDepth: "गहराई",
  glossaryPrediction: "पूर्वानुमान",
  riskShortLow: "कम",
  riskShortModerate: "मध्यम",
  riskShortHigh: "उच्च",
  riskShortSevere: "गंभीर",

  analysis: "विश्लेषण",
  location: "स्थान",
  current_year: "वर्तमान वर्ष",
  next_year: "अगला वर्ष",
  commonTerms: "सामान्य शब्द",
  riskLevelLabel: "जोखिम स्तर",
  farmerSupportBlurb:
    "🌾 महाराष्ट्र किसान सहायता — ऊपर के बटन से कभी भी भाषा बदलें।",

  farmerAnalysis: "किसान विश्लेषण",
  pleaseSelectRegion: "कृपया बाईं पट्टी से क्षेत्र चुनें।",
  expandLess: "कम",
  expandMore: "अधिक",
  waterLevelStatus: "जल स्तर",
  trendStatus: "रुझान",
  periodLabel: "अवधि",
  wlGood: "अच्छा",
  wlModerate: "मध्यम",
  wlCritical: "गंभीर",
  trImproving: "सुधर रहा",
  trStable: "स्थिर",
  trDeclining: "गिर रहा",
  actionItemsHeading: "सुझाए गए कदम",
  speaking: "बोल रहा है…",
  listenAnalysis: "विश्लेषण सुनें",

  fa_rec_good: "जल स्तर अच्छा है। स्थायी उपयोग जारी रखें।",
  fa_rec_moderate: "जल स्तर मध्यम है। पंपिंग कम करें और संरक्षण करें।",
  fa_rec_critical: "जल स्तर गंभीर है। तुरंत सलाह और जल बचत लें।",
  fa_act_good_1: "वर्तमान अभ्यास बनाए रखें",
  fa_act_good_2: "पानी का कुशल उपयोग करें",
  fa_act_good_3: "कुओं की नियमित जाँच करें",
  fa_act_mod_1: "चरम समय के पंपिंग कम करें",
  fa_act_mod_2: "वर्षा जल संचयन करें",
  fa_act_mod_3: "रिसाव की जाँच करें",
  fa_act_crit_1: "स्थानीय कृषि कार्यालय से संपर्क करें",
  fa_act_crit_2: "अधिक दोहन से बचें",
  fa_act_crit_3: "संभव हो तो ड्रिप सिंचाई",
  fa_act_crit_4: "फसल की जल योजना बनाएं",

  chatTitle: "जल-दृष्टि AI",
  chatWelcome:
    "**जल-दृष्टि AI सहायक** में आपका स्वागत है। क्षेत्र चुनें और भूजल जोखिम, पूर्वानुमान या सलाह पूछें।",
  chatPlaceholder: "जल स्तर के बारे में पूछें…",
  chatSelectRegionFirst:
    "पहले बाईं पट्टी से क्षेत्र चुनें — तभी मैं विस्तृत भूजल विश्लेषण दे सकता हूँ।",
  chatHelpBody:
    "मैं मदद कर सकता हूँ:\n\n- **जोखिम** — स्तर पूछें\n- **गहराई** — वर्तमान भूजल गहराई\n- **पूर्वानुमान** — भविष्य का अनुमान\n- **सलाह** — सुझाव\n\nप्रयास करें: *“मेरा जोखिम क्या है?”*",
  chatDefaultReply:
    "**{region}** के लिए: वर्तमान गहराई **{depth}** ft, जोखिम **{risk}**। वार्षिक परिवर्तन **{rate}** ft/वर्ष।",
  chatRiskLow: "कम जोखिम — स्थिर स्तर",
  chatRiskModerate: "मध्यम जोखिम — निगरानी ज़रूरी",
  chatRiskHigh: "उच्च जोखिम — हस्तक्षेप ज़रूरी",
  chatRiskSevere: "गंभीर जोखिम — तुरंत कार्रवाई",
  chatDepthReply:
    "**{region}** पर वर्तमान गहराई **{depth}** फीट। 10 वर्ष का इतिहास; 8 वर्ष आगे पूर्वानुमान।",
  chatPredictReply:
    "मॉडल (R² = {r2}) के अनुसार **{region}** में **{year}** तक अनुमानित गहराई **{depth}** ft (95% CI: {lo}–{hi} ft).",

  notFoundTitle: "पृष्ठ नहीं मिला",
  notFoundBody: "जो पृष्ठ आप ढूँढ रहे हैं वह मौजूद नहीं है।",
  returnHome: "मुखपृष्ठ पर जाएँ",
};

const mr: Messages = {
  languageLabel: "भाषा",
  langEnglish: "English",
  langHindi: "हिंदी",
  langMarathi: "मराठी",

  regionalSelection: "प्रादेशिक निवड",
  timePeriod: "कालावधी",
  district: "जिल्हा",
  subDistrict: "उपजिल्हा",
  village: "गाव",
  selectDistrict: "जिल्हा निवडा",
  selectSubDistrict: "उपजिल्हा निवडा",
  selectVillage: "गाव निवडा",
  month: "महिना",
  year: "वर्ष",
  selectMonth: "महिना निवडा",
  selectYear: "वर्ष निवडा",
  yearCurrent: "(चालू)",
  yearPrediction: "(अंदाज)",
  summaryPredicted: "अंदाज",

  month_1: "जानेवारी",
  month_2: "फेब्रुवारी",
  month_3: "मार्च",
  month_4: "एप्रिल",
  month_5: "मे",
  month_6: "जून",
  month_7: "जुलै",
  month_8: "ऑगस्ट",
  month_9: "सप्टेंबर",
  month_10: "ऑक्टोबर",
  month_11: "नोव्हेंबर",
  month_12: "डिसेंबर",

  mon_1: "जाने",
  mon_2: "फेब्रु",
  mon_3: "मार्च",
  mon_4: "एप्रि",
  mon_5: "मे",
  mon_6: "जून",
  mon_7: "जुलै",
  mon_8: "ऑग",
  mon_9: "सप्टें",
  mon_10: "ऑक्टो",
  mon_11: "नोव्हें",
  mon_12: "डिसें",

  selectRegionToBegin: "विश्लेषण सुरू करण्यासाठी क्षेत्र निवडा",
  chooseFromSidebar: "पाणी पातळी डेटा पाहण्यासाठी डावे पॅनल वापरा",
  groundwaterDepthAnalysis: "भूजल खोल विश्लेषण",
  legendHistoricalYearly: "ऐतिहासिक (वार्षिक)",
  legendCurrentMonthly: "चालू वर्ष (मासिक)",
  legendPredictedMonthly: "अंदाज (मासिक)",
  depthFt: "खोल",
  yearLabel: "वर्ष",
  predicted: "अंदाज",
  currentYear: "चालू वर्ष",
  confidenceInterval: "९५% विश्वास अंतराल",
  currentYearAxis: "चालू वर्ष",

  selectRegionRiskAnalysis: "जोखिम विश्लेषणासाठी क्षेत्र निवडा",
  riskEngine: "जोखिम इंजिन",
  riskLow: "कमी जोखिम",
  riskModerate: "मध्यम जोखिम",
  riskHigh: "जास्त जोखिम",
  riskSevere: "गंभीर जोखिम",
  r2Score: "R² गुण",
  currentDepth: "सध्याची खोल",
  annualChange: "वार्षिक बदल",
  predictionHorizon: "अंदाज कालावधी",
  eightYears: "८ वर्षे",
  modelAccuracy: "मॉडेल अचूकता",

  advisoryUpdatesAfterSelect: "क्षेत्र निवडल्यानंतर सल्ला येथे दिसेल.",

  mapLocation: "स्थान",
  mapImageAlt: "महाराष्ट्र नकाशा",
  loadingMap: "नकाशा लोड होत आहे…",
  mapImageNotFound: "नकाशा प्रतिमा सापडली नाही",
  mapPlaceHint: "प्रतिमा येथे ठेवा:",

  monthlyInsights: "मासिक अंतर्दृष्टी",
  selectMonthYearInsight: "तपशीलासाठी महिना व वर्ष निवडा",
  noDataForPeriod: "निवडलेल्या कालावधीसाठी डेटा नाही",
  expectedDepth: "अपेक्षित खोल",
  monthlyChange: "मासिक बदल",
  analysisRecommendations: "विश्लेषण व शिफारसी",

  glossaryMaharashtra: "महाराष्ट्र",
  glossaryWaterLevel: "पाणी पातळी",
  glossaryGroundwater: "भूजल पाणी",
  glossaryDepth: "खोल",
  glossaryPrediction: "अंदाज",
  riskShortLow: "कमी",
  riskShortModerate: "मध्यम",
  riskShortHigh: "जास्त",
  riskShortSevere: "अत्यंत",

  analysis: "विश्लेषण",
  location: "ठिकाण",
  current_year: "चालू वर्ष",
  next_year: "पुढील वर्ष",
  commonTerms: "सामान्य शब्द",
  riskLevelLabel: "जोखिम स्तर",
  farmerSupportBlurb:
    "🌾 महाराष्ट्रातील शेतकऱ्यांसाठी — वरच्या बटणांनी भाषा बदला.",

  farmerAnalysis: "शेतकरी विश्लेषण",
  pleaseSelectRegion: "कृपया डाव्या बाजूला क्षेत्र निवडा.",
  expandLess: "कमी",
  expandMore: "अधिक",
  waterLevelStatus: "पाणी पातळी",
  trendStatus: "कल",
  periodLabel: "कालावधी",
  wlGood: "चांगले",
  wlModerate: "मध्यम",
  wlCritical: "गंभीर",
  trImproving: "सुधारत",
  trStable: "स्थिर",
  trDeclining: "घटत",
  actionItemsHeading: "शिफारसी कृती",
  speaking: "बोलत आहे…",
  listenAnalysis: "विश्लेषण ऐका",

  fa_rec_good: "पाणी पातळी चांगली आहे. शाश्वत वापर सुरू ठेवा.",
  fa_rec_moderate: "पाणी पातळी मध्यम आहे. पंपिंग कमी करा व जतन करा.",
  fa_rec_critical: "पाणी पातळी गंभीर आहे. तातडीचा सल्ला व पाणी बचत करा.",
  fa_act_good_1: "सध्याचे चांगले सराव सुरू ठेवा",
  fa_act_good_2: "पाणी कार्यक्षम वापरा",
  fa_act_good_3: "विहिरींची तपासणी करा",
  fa_act_mod_1: "जास्त पंपिंग कमी करा",
  fa_act_mod_2: "पावस पाणी साठवा",
  fa_act_mod_3: "गळती तपासा",
  fa_act_crit_1: "कृषी कार्यालयाशी संपर्क करा",
  fa_act_crit_2: "अधिक दोहन टाळा",
  fa_act_crit_3: "शक्य असल्यास ठिबक सिंचन",
  fa_act_crit_4: "पिकांचे पाणी नियोजन करा",

  chatTitle: "जल-दृष्टि AI",
  chatWelcome:
    "**जल-दृष्टि AI सहाय्यक** मध्ये आपले स्वागत. क्षेत्र निवडा आणि भूजल जोखिम, अंदाज किंवा शिफारसी विचारा.",
  chatPlaceholder: "पाणी पातळीबद्दल विचारा…",
  chatSelectRegionFirst:
    "प्रथम डाव्या बाजूला क्षेत्र निवडा — मग तपशीलवार भूजल विश्लेषण देऊ शकतो.",
  chatHelpBody:
    "मी मदत करू शकतो:\n\n- **जोखिम** — स्तर विचारा\n- **खोल** — सध्याची भूजल खोल\n- **अंदाज** — भविष्यातील पातळी\n- **सल्ला** — शिफारसी\n\nप्रयत्न करा: *“माझा जोखिम काय?”*",
  chatDefaultReply:
    "**{region}** साठी: सध्याची खोल **{depth}** ft, जोखिम **{risk}**. वार्षिक बदल **{rate}** ft/वर्ष.",
  chatRiskLow: "कमी जोखिम — स्थिर पातळी",
  chatRiskModerate: "मध्यम जोखिम — निरीक्षण आवश्यक",
  chatRiskHigh: "जास्त जोखिम — हस्तक्षेप आवश्यक",
  chatRiskSevere: "गंभीर जोखिम — तातडीची कारवाई",
  chatDepthReply:
    "**{region}** येथे सध्याची खोल **{depth}** फूट. १० वर्षांचा इतिहास; ८ वर्ष पुढे अंदाज.",
  chatPredictReply:
    "मॉडेल (R² = {r2}) नुसार **{region}** येथे **{year}** पर्यंत अंदाजित खोल **{depth}** ft (९५% CI: {lo}–{hi} ft).",

  notFoundTitle: "पृष्ठ सापडले नाही",
  notFoundBody: "आपण शोधत असलेले पृष्ठ अस्तित्वात नाही.",
  returnHome: "मुख्य पृष्ठावर जा",
};

export const messages: Record<Locale, Messages> = {
  en,
  hi,
  mr,
};

export type MessageKey = keyof Messages;

/** Replace {name} placeholders in a string */
export function formatMessage(template: string, vars: Record<string, string | number>): string {
  return template.replace(/\{(\w+)\}/g, (_, k) => String(vars[k] ?? `{${k}}`));
}
