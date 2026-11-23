export type ChatLanguage = "en" | "mr" | "hi";

export interface ChatMessage {
  id: string;
  sender: "bot" | "user";
  text: string;
  timestamp: Date;
  action?: {
    label: string;
    url: string;
  };
}

export interface SuggestionItem {
  id: string;
  label: string;
  query: string;
}

export const CHAT_SUGGESTIONS: Record<ChatLanguage, SuggestionItem[]> = {
  en: [
    {
      id: "farmer_sell",
      label: "🌾 How do farmers sell crop stubble?",
      query: "How do farmers sell crop stubble and get paid?",
    },
    {
      id: "crops_accepted",
      label: "🌿 What crops are accepted in Goa?",
      query: "What types of crop residue and biomass are accepted in Goa?",
    },
    {
      id: "escrow_pay",
      label: "🔒 How does Escrow payment work?",
      query: "How does the GreenRoots escrow payment guarantee work?",
    },
    {
      id: "hubs_goa",
      label: "📍 Where are the collection hubs in Goa?",
      query: "Where are the village collection hubs located in Goa?",
    },
    {
      id: "buyer_pool",
      label: "🏭 How can industries buy in bulk?",
      query: "How can industrial buyers aggregate biomass through pools?",
    },
  ],
  mr: [
    {
      id: "farmer_sell_mr",
      label: "🌾 शेतकरी पिकांचे अवशेष कसे विकू शकतात?",
      query: "शेतकरी पिकांचे अवशेष (पेंढा/कचरा) कसे विकू शकतात आणि पैसे कसे मिळतात?",
    },
    {
      id: "crops_accepted_mr",
      label: "🌿 गोव्यात कोणत्या पिकांना मागणी आहे?",
      query: "गोव्यात कोणत्या प्रकारच्या कृषी अवशेषांना आणि बायोमासला मागणी आहे?",
    },
    {
      id: "escrow_pay_mr",
      label: "🔒 एस्क्रो पेमेंट सुरक्षा कशी काम करते?",
      query: "ग्रीनरूट्स एस्क्रो पेमेंट हमी कशी काम करते?",
    },
    {
      id: "hubs_goa_mr",
      label: "📍 गोव्यातील संकलन केंद्रे कुठे आहेत?",
      query: "गोव्यात शेतमालाची संकलन केंद्रे (Collection Hubs) कुठे आहेत?",
    },
    {
      id: "buyer_pool_mr",
      label: "🏭 कारखाने व उद्योग खरेदी कशी करतात?",
      query: "उद्योग व कारखाने एकत्र येऊन मोठ्या प्रमाणावर बायोमास कसे खरेदी करू शकतात?",
    },
  ],
  hi: [
    {
      id: "farmer_sell_hi",
      label: "🌾 किसान फसल अवशेष कैसे बेच सकते हैं?",
      query: "किसान पराली और फसल अवशेष कैसे बेच सकते हैं और भुगतान कैसे मिलता है?",
    },
    {
      id: "crops_accepted_hi",
      label: "🌿 गोवा में कौन-कौन सी फसलों की मांग है?",
      query: "गोवा में किस प्रकार के फसल अवशेष और बायोमास खरीदे जाते हैं?",
    },
    {
      id: "escrow_pay_hi",
      label: "🔒 एस्क्रो पेमेंट कैसे काम करता है?",
      query: "ग्रीनरूट्स एस्क्रो पेमेंट गारंटी कैसे काम करती है?",
    },
    {
      id: "hubs_goa_hi",
      label: "📍 गोवा में कलेक्शन सेंटर कहाँ हैं?",
      query: "गोवा में गाँव के कलेक्शन हब और तौल केंद्र कहाँ स्थित हैं?",
    },
    {
      id: "buyer_pool_hi",
      label: "🏭 उद्योग भारी मात्रा में कैसे खरीद सकते हैं?",
      query: "औद्योगिक खरीदार एग्रीगेशन पूल के जरिए बायोमास कैसे खरीद सकते हैं?",
    },
  ],
};

export const INITIAL_GREETING: Record<ChatLanguage, string> = {
  en: "Hello! 👋 I'm **EcoBot**, your GreenRoots AI assistant.\n\nI can help you explore how to monetize agricultural stubble, buy industrial biomass in bulk, find Goa collection hubs, or understand our secure escrow clearing. How can I help you today?",
  mr: "नमस्कार! 👋 मी **इकोबॉट**, तुमचा ग्रीनरूट्स एआय मार्गदर्शक.\n\nशेतकऱ्यांसाठी पिकांचे अवशेष विकणे, उद्योगांसाठी बायोमास खरेदी, गोव्यातील संकलन केंद्रे आणि सुरक्षित एस्क्रो पेमेंटबद्दल मी माहिती देऊ शकतो. मी तुम्हाला कशी मदत करू?",
  hi: "नमस्ते! 👋 मैं **इकोबॉट**, आपका ग्रीनरूट्स एआई गाइड हूँ।\n\nकिसानों के लिए फसल अवशेष (पराली) बेचने, उद्योगों के लिए बायोमास खरीदने, गोवा के कलेक्शन सेंटर्स और सुरक्षित एस्क्रो भुगतान के बारे में मैं आपकी मदद कर सकता हूँ। आप क्या जानना चाहते हैं?",
};

// System prompt for Gemini API
function getSystemPrompt(lang: ChatLanguage): string {
  const langName = lang === "mr" ? "Marathi (मराठी)" : lang === "hi" ? "Hindi (हिन्दी)" : "English";
  return `You are EcoBot, the knowledgeable, helpful, and friendly AI Assistant for GreenRoots (https://greenroots.org).
GreenRoots is India's premier B2B marketplace and escrow clearinghouse connecting agricultural biomass farmers with industrial bio-energy, pellet, and packaging buyers in Goa and Western India.

CORE FACTS & CONTEXT:
1. PROBLEM SOLVED:
   - Eliminates stubble burning (pollution & respiratory hazards) by converting crop residue into cash income for rural farmers.
   - Supplies industries with standardized, moisture-tested biomass fuel to replace coal.

2. FOR FARMERS:
   - Voice-to-Listing AI: Farmers can simply speak in their mother tongue (English, Hindi, Marathi) to list their crop residue in 10 seconds.
   - Financial Split: 95% paid directly to the farmer, 5% platform escrow commission fee.
   - Guaranteed Escrow: Buyers deposit funds in escrow upfront before pickup; money is released to the farmer upon weighbridge certification.

3. FOR INDUSTRIAL BUYERS:
   - Reverse Pools: Buyers publish required tonnage (e.g., 100 tonnes) with deadlines; farmers aggregate supplies until filled.
   - TSP Optimization: Dijkstra algorithm routing maps optimal pickup paths between farms and hubs.
   - Official Tax Invoices & Demo QR / PayPal payments with escrow protection.

4. CROP TYPES & RESIDUE:
   - Paddy Straw (भात पेंढा / धान की पराली)
   - Mustard Stubble (मोहरी / सरसों)
   - Cashew Shells (काजू टरफले / काजू छिलके) - high calorific value, popular in Goa
   - Sugarcane Trash (उसाचे पाचट / गन्ने की पत्ती)
   - Rice Husk (भाताचा भुसा / धान की भूसी)
   - Cotton Stalks & Groundnut Shells

5. HUBS IN GOA:
   - Margao APMC Central Hub (South Goa)
   - Vasco Port Agro Depot (Mormugao)
   - Panjim Central Market Yard (North Goa)
   - Mapusa Sub-Yard Co-op (Bardez)
   - Verna Industrial Biomass Yard (Salcete Industrial Estate)
   - Ponda Farm Residue Hub (Central Goa)
   - Bicholim & Canacona Regional Depots

RESPONSE GUIDELINES:
- You MUST answer in ${langName}. If the user speaks Marathi, reply in natural Marathi. If Hindi, reply in natural Hindi. If English, reply in natural English.
- Keep answers concise, factual, polite, and well-structured using markdown bullet points.
- Highlight GreenRoots' verified escrow and environmental sustainability.`;
}

// Resilient Multilingual Fallback Knowledge Base
function getFallbackResponse(
  query: string,
  lang: ChatLanguage
): { text: string; action?: { label: string; url: string } } {
  const q = query.toLowerCase().trim();

  // 1. Farmer selling / stubble monetization
  if (
    /sell|stubble|parali|farmer|pendha|kachra|crop waste| अवशेष|पेंढा|कचरा|शेतकरी|विकणे|पराली|बेचना|किसान/i.test(
      q
    )
  ) {
    if (lang === "mr") {
      return {
        text: `🌾 **शेतकऱ्यांसाठी पिकांचे अवशेष विकण्याची सोपी पद्धत:**\n\n1. **व्हॉइस लिस्टिंग:** तुम्ही फक्त बोलून (मराठीत) तुमच्या पिकाचा प्रकार आणि अंदाजे वजन सांगून नोंदणी करू शकता.\n2. **स्थानिक संकलन केंद्र:** माल मडगाव, वास्को किंवा पणजी येथील संकलन केंद्रावर जमा करा.\n3. **काटा व तपासणी:** वजनकाट्यावर प्रत्यक्ष वजनाची पावती मिळते.\n4. **९५% हमी पेमेंट:** खरेदीदाराचे पैसे आधीच एस्क्रो खात्यात जमा असतात; तपासणी होताच थेट तुमच्या खात्यावर जमा होतात (५% प्लॅटफॉर्म फी).\n\nआता शेतात कचरा जाळण्याची गरज नाही, उलट चांगले उत्पन्न मिळते!`,
        action: { label: "शेतकरी म्हणून साइन अप करा", url: "/signup" },
      };
    }
    if (lang === "hi") {
      return {
        text: `🌾 **किसानों के लिए फसल अवशेष बेचने की सरल प्रक्रिया:**\n\n1. **आवाज़ से लिस्टिंग:** आप बोलकर (हिंदी में) अपनी फसल और मात्रा बताकर 10 सेकंड में लिस्टिंग बना सकते हैं।\n2. **नजदीकी केंद्र:** मडगांव, वास्को, पणजी आदि तौल केंद्रों पर फसल अवशेष पहुँचाएं।\n3. **सटीक तौल:** धर्मकांटे पर डिजिटल वजन और नमी की जांच होती है।\n4. **सुरक्षित 95% भुगतान:** खरीदार का पैसा पहले से एस्क्रो में सुरक्षित रहता है; तौल होते ही सीधे आपके बैंक में पहुंचता है।\n\nपराली जलाने की बजाय अब किसान हर टन पर सीधी कमाई कर रहे हैं!`,
        action: { label: "किसान के रूप में जुड़ें", url: "/signup" },
      };
    }
    return {
      text: `🌾 **How Farmers Sell & Monetize Crop Residue on GreenRoots:**\n\n1. **AI Voice-to-Listing:** Speak naturally in your own language (English, Marathi, Hindi) to create a verified listing in seconds.\n2. **Drop-off at Local Hubs:** Transport crop stubble to your designated Goa hub (Margao, Vasco, Panjim, Mapusa, etc.).\n3. **Certified Weighbridge:** Accepted tonnage & moisture are digitally certified on the spot.\n4. **Guaranteed Escrow Payout:** 95% of proceeds are disbursed directly to your bank account with zero default risk (5% platform fee).\n\nNo more burning residue—turn stubble into guaranteed seasonal income!`,
      action: { label: "Join as Farmer", url: "/signup" },
    };
  }

  // 2. Crop types & biomass accepted
  if (
    /crop|waste|residue|mustard|paddy|cashew|kaju|straw|husk|sugarcane| प्रकार|काजू|पेंढा|भात|ऊस|फसल|सरसों|धान|गन्ना/i.test(
      q
    )
  ) {
    if (lang === "mr") {
      return {
        text: `🌿 **गोव्यात स्वीकारले जाणारे प्रमुख कृषी अवशेष (बायोमास):**\n\n• **काजूची टरफले (Cashew Shells):** उच्च कॅलरी मूल्य, बायो-इंधनासाठी प्रचंड मागणी.\n• **भाताचा पेंढा व भुसा (Paddy Straw & Rice Husk):** पॅकेजिंग आणि बॉयलरसाठी उपयुक्त.\n• **मोहरीचे अवशेष (Mustard Stubble):** बायोमास ब्रिकेट्ससाठी सर्वोत्तम.\n• **उसाचे पाचट व बगास (Sugarcane Trash):** साखर व ऊर्जा उद्योगांसाठी.\n• **भुईमूग टरफले आणि कापूस काड्या (Groundnut & Cotton Stalks).**\n\nसर्व पिकांना पारदर्शक बाजारभाव मिळतो!`,
        action: { label: "मार्केटप्लेस एक्सप्लोर करा", url: "/welcome" },
      };
    }
    if (lang === "hi") {
      return {
        text: `🌿 **गोवा में स्वीकार किए जाने वाले प्रमुख फसल अवशेष:**\n\n• **काजू के छिलके (Cashew Shells):** उच्च ऊर्जा क्षमता, बायो-फ्यूल के लिए सबसे अधिक मांग।\n• **धान की पराली और भूसी (Paddy Straw & Rice Husk):** बॉयलर और बायो-पैक के लिए।\n• **सरसों के डंठल (Mustard Stubble):** ब्रिकेट और पेलेट निर्माण हेतु।\n• **गन्ने की पत्तियां और बगास (Sugarcane Trash):** ऊर्जा संयत्रों के लिए।\n• **मूंगफली के छिलके और कपास के डंठल।**\n\nसभी अवशेषों पर किसानों को निष्पक्ष और तय दरें मिलती हैं!`,
        action: { label: "मार्केटप्लेस देखें", url: "/welcome" },
      };
    }
    return {
      text: `🌿 **Types of Agricultural Biomass Traded on GreenRoots:**\n\n• **Cashew Shells (काजू):** High calorific energy value, heavily demanded by Goa industries.\n• **Paddy Straw & Rice Husk (भात/धान):** Ideal for industrial boilers, composting, and eco-packaging.\n• **Mustard Stubble (मोहरी/सरसों):** High-density biomass for clean fuel pellets.\n• **Sugarcane Trash & Bagasse (ऊस/गन्ना):** Excellent for co-generation plants.\n• **Groundnut Shells & Cotton Stalks.**\n\nAll crop varieties have live standardized pricing across all Goa hubs!`,
      action: { label: "Explore Marketplace", url: "/welcome" },
    };
  }

  // 3. Payment & Escrow Guarantee
  if (
    /pay|escrow|money|rate|price|commission|fee|safe|trust| पैसे|पेमेंट|एस्क्रो|दर|भाव|रुपये|भुगतान|कीमत|सुरक्षा/i.test(
      q
    )
  ) {
    if (lang === "mr") {
      return {
        text: `🔒 **ग्रीनरूट्स एस्क्रो पेमेंट सुरक्षा हमी:**\n\n• **१००% सुरक्षित व्यवहार:** खरेदीदार ऑर्डर देताच संपूर्ण रक्कम शासकीय बँकेच्या एस्क्रो खात्यात जमा करतो.\n• **शेतकऱ्यांना ९५% थेट रक्कम:** मध्यस्थांची दलाली नाही. शेतकऱ्यांना ९५% थेट रक्कम मिळते.\n• **डिजिटल जीएसटी पावती:** प्रत्येक ऑर्डरनंतर अधिकृत टॅक्स इनव्हॉईस व क्युआर कोड (QR Code) लगेच उपलब्ध होतो.\n• **तपासणीनंतर वितरण:** वजनकाट्यावर माल प्रमाणित झाल्यानंतरच रक्कम सुरक्षितपणे अदा केली जाते.`,
        action: { label: "एस्क्रो प्रणाली पहा", url: "/welcome" },
      };
    }
    if (lang === "hi") {
      return {
        text: `🔒 **ग्रीनरूट्स सुरक्षित एस्क्रो पेमेंट प्रणाली:**\n\n• **100% सुरक्षित निधि:** खरीदार ऑर्डर करते समय पूरी राशि एस्क्रो बैंक खाते में सुरक्षित जमा करता है।\n• **किसानों को 95% सीधा भुगतान:** बिचौलियों का कोई खेल नहीं। 95% राशि सीधे किसान के बैंक खाते में जाती है।\n• **डिजिटल टैक्स इनवॉइस:** भुगतान होते ही तुरंत आधिकारिक इनवॉइस और QR कोड जनरेट होता है।\n• **सत्यापन पर निकासी:** धर्मकांटे पर वजन प्रमाणित होते ही भुगतान तुरंत क्लियर हो जाता है।`,
        action: { label: "भुगतान सुरक्षा जानें", url: "/welcome" },
      };
    }
    return {
      text: `🔒 **GreenRoots Secure Escrow Clearing System:**\n\n• **100% Protected Funds:** Buyers deposit full purchase funds into the ICICI Escrow Account upfront before collection.\n• **95% Direct to Farmer:** Farmers receive 95% net settlement upon physical weighbridge certification (5% transparent platform fee).\n• **Instant Official Invoices:** Every order generates a compliant Tax Invoice and scan-to-verify QR code.\n• **Zero Payment Defaults:** Neither party risks unfulfilled orders or delayed payments.`,
      action: { label: "Learn About Escrow", url: "/welcome" },
    };
  }

  // 4. Collection Hubs in Goa
  if (
    /hub|center|location|goa|mandi|margao|vasco|panjim|mapusa|ponda|verna| केंद्र|गोवा|मडगाव|वास्को|पणजी|मापुसा|फोंडा|सेंटर/i.test(
      q
    )
  ) {
    if (lang === "mr") {
      return {
        text: `📍 **गोव्यातील प्रमुख संकलन केंद्रे (Collection Hubs):**\n\n1. **मडगाव एपीएमसी सेंट्रल हब (Margao Central Hub):** दक्षिण गोव्यातील मुख्य संकलन केंद्र.\n2. **वास्को पोर्ट ॲग्रो डेपो (Vasco Port Depot):** औद्योगिक मालाची वाहतूक व सागरी मार्ग केंद्र.\n3. **पणजी सेंट्रल मार्केट यार्ड (Panjim Yard):** उत्तर गोव्यातील मध्यवर्ती केंद्र.\n4. **मापुसा सब-यार्ड को-ऑप (Mapusa Co-op):** बार्देश व उत्तर गोवा शेतकरी केंद्र.\n5. **वेर्णा इंडस्ट्रियल बायोमास यार्ड (Verna Yard):** औद्योगिक कंपन्यांसाठी थेट पुरवठा केंद्र.\n6. **फोंडा फार्म रेसिड्यू हब (Ponda Hub):** मध्य गोव्यातील प्रक्रिया केंद्र.\n\nसर्व केंद्रांवर डिजिटल धर्मकाटा आणि मॉइश्चर टेस्टिंग उपलब्ध आहे!`,
        action: { label: "हब नकाशे पहा", url: "/welcome" },
      };
    }
    if (lang === "hi") {
      return {
        text: `📍 **गोवा में स्थित प्रमुख कलेक्शन हब (Collection Hubs):**\n\n1. **मडगांव एपीएमसी सेंट्रल हब (Margao Central Hub):** दक्षिण गोवा का मुख्य मंडी केंद्र।\n2. **वास्को पोर्ट एग्रो डिपो (Vasco Port Depot):** बंदरगाह और औद्योगिक परिवहन केंद्र।\n3. **पणजी सेंट्रल मार्केट यार्ड (Panjim Yard):** उत्तर गोवा का प्रमुख संकलन केंद्र।\n4. **मापुसा सब-यार्ड को-ऑप (Mapusa Co-op):** बारदेश और ग्रामीण किसानों का केंद्र।\n5. **वेर्णा इंडस्ट्रियल बायोमास यार्ड (Verna Yard):** औद्योगिक संपदा के लिए मुख्य डिलीवरी हब।\n6. **फोंडा फार्म रेसिड्यू हब (Ponda Hub):** मध्य गोवा का संग्रहण केंद्र।\n\nसभी हब पर कंप्यूटराइज्ड वजन और गुणवत्ता प्रमाणन की सुविधा है!`,
        action: { label: "कलेक्शन सेंटर देखें", url: "/welcome" },
      };
    }
    return {
      text: `📍 **Designated Village Collection Hubs in Goa:**\n\n1. **Margao APMC Central Hub:** Main South Goa agricultural clearing point.\n2. **Vasco Port Agro Depot:** Mormugao transit and port delivery hub.\n3. **Panjim Central Market Yard:** Capital city central biomass receiving yard.\n4. **Mapusa Sub-Yard Co-op:** Bardez & North Goa regional hub.\n5. **Verna Industrial Biomass Yard:** Direct supply link to Verna Industrial Estate.\n6. **Ponda Farm Residue Hub:** Central Goa inland collection center.\n\nEvery hub features computerized weighbridges, digital inspection slips, and Dijkstra-optimized route planning!`,
      action: { label: "View Collection Hubs", url: "/welcome" },
    };
  }

  // 5. Industrial Buyers / Pooling
  if (
    /buyer|industry|factory|pool|aggregate|bulk|order| खरेदी|उद्योग|कारखाने|पूल|बल्क|उद्योग|खरीद|कंपनी/i.test(
      q
    )
  ) {
    if (lang === "mr") {
      return {
        text: `🏭 **उद्योग आणि कारखान्यांसाठी ग्रीनरूट्स रिव्हर्स पूलिंग:**\n\n• **मोठी मागणी एकत्र करा:** कारखान्यांना ५०-५०० टन बायोमास हवा असल्यास ते एका क्लिकवर 'पूल' (Pool) सुरू करू शकतात.\n• **शेतकऱ्यांचा एकत्रित पुरवठा:** अनेक लहान शेतकरी एकत्र येऊन ही मागणी पूर्ण करतात.\n• **डिज्क्स्ट्रा रूट ॲनिमेशन:** पिकांच्या वाहतुकीसाठी कमीत कमी इंधन व खर्च लागावा म्हणून स्मार्ट रूटिंग उपलब्ध आहे.\n• **कोळशाऐवजी हरित ऊर्जा:** कारखान्यांचा कार्बन टॅक्स वाचतो आणि पर्यावरणपूरक ऊर्जा मिळते.`,
        action: { label: "बायोमास खरेदी सुरू करा", url: "/signup" },
      };
    }
    if (lang === "hi") {
      return {
        text: `🏭 **औद्योगिक खरीदारों के लिए रिवर्स पूलिंग सुविधा:**\n\n• **थोक में मांग दर्ज करें:** अगर आपको 100 से 500 टन बायोमास चाहिए, तो आप एक कस्टम पूल बना सकते हैं।\n• **किसानों का साझा योगदान:** कई किसान मिलकर आपके पूल में योगदान देकर आपूर्ति पूरी करते हैं।\n• **स्मार्ट लॉजिस्टिक्स रूटिंग:** डिज्क्स्ट्रा एल्गोरिदम से न्यूनतम दूरी और डीजल की बचत वाले रूट तैयार होते हैं।\n• **सस्ता और पर्यावरण अनुकूल:** महंगे कोयले की जगह प्रमाणित बायोमास से उद्योगों का कार्बन फुटप्रिंट घटता है।`,
        action: { label: "खरीदार के रूप में जुड़ें", url: "/signup" },
      };
    }
    return {
      text: `🏭 **How Industrial Biomass Pooling Works for Buyers:**\n\n• **Create Custom Aggregation Pools:** Industrial plants publish their biomass requirements (e.g. 100 MT paddy straw by Dec 15).\n• **Multi-Farmer Contributions:** Multiple local farmers contribute batches (e.g., 5 MT, 15 MT, 25 MT) until the quota is filled.\n• **Dijkstra TSP Optimization:** AI plans the shortest pickup route from farms to the central collection hub, cutting diesel emissions by up to 28%.\n• **Clean Energy Replacement:** Replace expensive fossil coal with verified, sustainable agricultural residue!`,
      action: { label: "Join as Industrial Buyer", url: "/signup" },
    };
  }

  // 6. Environmental impact / stubble burning
  if (
    /environment|pollution|smoke|burn|stubble burning|air quality|co2|carbon| पर्यावरण|प्रदूषण|धूर|हवा|पराली दहन|धुआं/i.test(
      q
    )
  ) {
    if (lang === "mr") {
      return {
        text: `🌍 **पर्यावरणीय प्रभाव आणि शून्य प्रदूषण ध्येय:**\n\n• **शून्य पराली दहन:** शेतातील काडीकचरा जाळण्याऐवजी तो विकल्यामुळे हवेतील धूर आणि कार्बन प्रदूषण थांबते.\n• **जमिनीचा कस कायम:** शेतात आग न लावल्यामुळे जमिनीतील उपयुक्त सूक्ष्मजीव व सेंद्रिय घटक सुरक्षित राहतात.\n• **स्वच्छ हवा, निरोगी समाज:** गोव्यातील व ग्रामीण भागातील हवेची गुणवत्ता सुधारून श्वसनाचे आजार टळतात.`,
      };
    }
    if (lang === "hi") {
      return {
        text: `🌍 **पर्यावरणीय प्रभाव और शून्य पराली दहन:**\n\n• **धुएँ से मुक्ति:** फसल अवशेष जलने की जगह उद्योगों में ऊर्जा के काम आते हैं, जिससे जहरीला धुआं और प्रदूषण रुकता है।\n• **मिट्टी की उर्वरता:** खेत में आग न लगने से जमीन की नमी और आवश्यक पोषक तत्व नष्ट नहीं होते।\n• **स्वच्छ हवा व स्वास्थ्य:** हर टन पराली को रीसायकल करने से ग्रामीण व शहरी क्षेत्रों में स्वच्छ वायु सुनिश्चित होती है।`,
      };
    }
    return {
      text: `🌍 **Environmental Impact & Zero Stubble Burning:**\n\n• **Ending Agricultural Smog:** Diverts crop residue away from open-field burning into green industrial fuel, eliminating toxic PM2.5 emissions.\n• **Soil Microbiome Preservation:** Keeping fields unburned preserves topsoil moisture, earthworms, and organic nitrogen.\n• **Fossil Fuel Decarbonization:** Replaces coal in boilers, preventing thousands of tonnes of net carbon dioxide emissions each harvest cycle.`,
    };
  }

  // 7. General / default fallback
  if (lang === "mr") {
    return {
      text: `मी **ग्रीनरूट्स (GreenRoots)** बद्दल खालील विषयांवर माहिती देऊ शकतो:\n\n• **शेतकऱ्यांसाठी:** पिकांचे अवशेष विकणे, भाव आणि ९५% एस्क्रो पेमेंट.\n• **उद्योगांसाठी:** बायोमास खरेदी आणि पूलिंग (Pooling).\n• **संकलन केंद्रे:** गोव्यातील मडगाव, वास्को, पणजी, मापुसा, वेर्णा केंद्रे.\n• **पिके:** काजू टरफले, भाताचा पेंढा, मोहरी, उसाचे पाचट.\n\nतुम्हाला नेमकी कशाबद्दल माहिती हवी आहे? खालीलपैकी एकावर क्लिक करा किंवा प्रश्न विचारा!`,
    };
  }
  if (lang === "hi") {
    return {
      text: `मैं **ग्रीनरूट्स (GreenRoots)** के बारे में निम्नलिखित विषयों पर आपकी सहायता कर सकता हूँ:\n\n• **किसानों के लिए:** फसल अवशेष बेचना, दरें और 95% एस्क्रो भुगतान।\n• **उद्योगों के लिए:** बायोमास की थोक खरीद और रिवर्स पूलिंग।\n• **कलेक्शन सेंटर:** गोवा के मडगांव, वास्को, पणजी, मापुसा, वेर्णा हब।\n• **फसलें:** काजू के छिलके, धान की पराली, सरसों, गन्ने की पत्तियां।\n\nआप किस विषय में जानकारी चाहते हैं? नीचे दिए गए सुझावों में से चुनें या अपना प्रश्न टाइप करें!`,
    };
  }
  return {
    text: `I'm happy to help you with anything regarding **GreenRoots**:\n\n• **For Farmers:** Voice listing, guaranteed 95% escrow payouts, and weighbridge drop-offs.\n• **For Buyers:** Bulk purchasing, reverse pools, and TSP Dijkstra route optimization.\n• **Goa Hubs:** Locations in Margao, Vasco, Panjim, Mapusa, Verna, and Ponda.\n• **Crop Varieties:** Cashew shells, paddy straw, mustard stubble, sugarcane trash, etc.\n\nFeel free to choose a prompt below or type your question!`,
  };
}

export const chatbotService = {
  async sendMessage(
    message: string,
    history: ChatMessage[],
    language: ChatLanguage = "en"
  ): Promise<{ text: string; action?: { label: string; url: string } }> {
    const apiKey = import.meta.env.VITE_GEMINI_API_KEY || (typeof window !== "undefined" && (window as any).__GEMINI_API_KEY);

    // If a Gemini API key is configured, use the live Gemini 1.5 Flash API
    if (apiKey && apiKey !== "not_set") {
      try {
        const contents = [];

        // Add system instruction context
        contents.push({
          role: "user",
          parts: [{ text: `${getSystemPrompt(language)}\n\nPlease acknowledge your role as EcoBot.` }],
        });
        contents.push({
          role: "model",
          parts: [{ text: INITIAL_GREETING[language] }],
        });

        // Add recent message history (up to last 6 messages)
        const recent = history.slice(-6);
        for (const msg of recent) {
          contents.push({
            role: msg.sender === "user" ? "user" : "model",
            parts: [{ text: msg.text }],
          });
        }

        // Add current user prompt
        contents.push({
          role: "user",
          parts: [{ text: message }],
        });

        const res = await fetch(
          `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${apiKey}`,
          {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ contents }),
          }
        );

        if (res.ok) {
          const data = await res.json();
          const reply = data?.candidates?.[0]?.content?.parts?.[0]?.text;
          if (reply && typeof reply === "string" && reply.trim()) {
            return { text: reply.trim() };
          }
        }
      } catch (err) {
        console.warn("Gemini API call failed, using intelligent domain engine fallback:", err);
      }
    }

    // Seamless fallback to domain engine with authentic multilingual answers
    return getFallbackResponse(message, language);
  },
};
