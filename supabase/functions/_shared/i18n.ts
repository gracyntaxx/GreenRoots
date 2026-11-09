export type Language = "en" | "hi" | "mr" | "pa" | "ta" | "te";

export interface NotificationContent {
  title: string;
  body: string;
}

export type NotificationTemplate =
  | "pool_open"
  | "pool_full"
  | "pool_pickup"
  | "payment_captured"
  | "payout_sent"
  | "seasonal_alert";

const TEMPLATES: Record<
  NotificationTemplate,
  Record<Language, (params: Record<string, string | number>) => NotificationContent>
> = {
  pool_open: {
    en: (p) => ({
      title: "New Pool in Your Area",
      body: `A new pool for ${p.wasteType} is accepting commitments in ${p.village}. Rate: ₹${p.rate}/kg.`,
    }),
    hi: (p) => ({
      title: "आपके क्षेत्र में नया पूल",
      body: `${p.village} में ${p.wasteType} के लिए एक नया पूल खुला है। दर: ₹${p.rate}/किलो।`,
    }),
    mr: (p) => ({
      title: "तुमच्या भागात नवीन पूल",
      body: `${p.village} येथे ${p.wasteType} साठी नवीन पूल खुला आहे. दर: ₹${p.rate}/किलो.`,
    }),
    pa: (p) => ({
      title: "ਤੁਹਾਡੇ ਖੇਤਰ ਵਿੱਚ ਨਵਾਂ ਪੂਲ",
      body: `${p.village} ਵਿਖੇ ${p.wasteType} ਲਈ ਨਵਾਂ ਪੂਲ ਖੁੱਲ੍ਹਿਆ ਹੈ। ਰੇਟ: ₹${p.rate}/ਕਿਲੋ।`,
    }),
    ta: (p) => ({
      title: "உங்கள் பகுதியில் புதிய பூல்",
      body: `${p.village} பகுதியில் ${p.wasteType}க்கான புதிய பூல் திறக்கப்பட்டுள்ளது. விலை: ₹${p.rate}/கிலோ.`,
    }),
    te: (p) => ({
      title: "మీ ప్రాంతంలో కొత్త పూల్",
      body: `${p.village} వద్ద ${p.wasteType} కోసం కొత్త పూల్ ప్రారంభమైంది. ధర: ₹${p.rate}/కిలో.`,
    }),
  },
  pool_full: {
    en: (p) => ({
      title: "Pool Target Achieved",
      body: `Pool for ${p.wasteType} in ${p.village} has reached 100% target!`,
    }),
    hi: (p) => ({
      title: "पूल का लक्ष्य पूरा हुआ",
      body: `${p.village} में ${p.wasteType} का पूल 100% लक्ष्य तक पहुँच गया है!`,
    }),
    mr: (p) => ({
      title: "पूलचे उद्दिष्ट पूर्ण झाले",
      body: `${p.village} मधील ${p.wasteType} चा पूल 100% पूर्ण झाला आहे!`,
    }),
    pa: (p) => ({
      title: "ਪੂਲ ਟੀਚਾ ਪੂਰਾ ਹੋਇਆ",
      body: `${p.village} ਵਿੱਚ ${p.wasteType} ਦਾ ਪੂਲ 100% ਟੀਚੇ 'ਤੇ ਪਹੁੰਚ ਗਿਆ ਹੈ!`,
    }),
    ta: (p) => ({
      title: "பூல் இலக்கு எட்டப்பட்டது",
      body: `${p.village} பகுதியில் ${p.wasteType} பூல் 100% இலக்கை எட்டியது!`,
    }),
    te: (p) => ({
      title: "పూల్ లక్ష్యం పూర్తయింది",
      body: `${p.village} లో ${p.wasteType} పూల్ 100% లక్ష్యాన్ని చేరుకుంది!`,
    }),
  },
  pool_pickup: {
    en: (p) => ({
      title: "Ready for Drop-off / Pickup",
      body: `Drop off your committed ${p.wasteType} at ${p.collectionPoint} before ${p.deadline}.`,
    }),
    hi: (p) => ({
      title: "कलेक्शन पॉइंट पर ले जाएं",
      body: `अपनी प्रतिबद्ध ${p.wasteType} ${p.deadline} से पहले ${p.collectionPoint} पर जमा करें।`,
    }),
    mr: (p) => ({
      title: "कलेक्शन पॉईंटवर जमा करा",
      body: `आपला ${p.wasteType} ${p.deadline} पूर्वी ${p.collectionPoint} येथे जमा करा.`,
    }),
    pa: (p) => ({
      title: "ਕਲੈਕਸ਼ਨ ਪੁਆਇੰਟ 'ਤੇ ਲੈ ਜਾਓ",
      body: `ਆਪਣੀ ${p.wasteType} ${p.deadline} ਤੋਂ ਪਹਿਲਾਂ ${p.collectionPoint} 'ਤੇ ਜਮ੍ਹਾਂ ਕਰੋ।`,
    }),
    ta: (p) => ({
      title: "கலெக்ஷன் பாயிண்ட்டில் சமர்ப்பிக்கவும்",
      body: `உங்கள் ${p.wasteType} பயிர் கழிவை ${p.deadline} க்குள் ${p.collectionPoint} இல் சேர்க்கவும்.`,
    }),
    te: (p) => ({
      title: "కలెక్షన్ పాయింట్‌కు తీసుకెళ్లండి",
      body: `మీ ${p.wasteType} ను ${p.deadline} లోపు ${p.collectionPoint} వద్ద అందజేయండి.`,
    }),
  },
  payment_captured: {
    en: (p) => ({
      title: "Payment Received and Verified",
      body: `Payment of ₹${p.amount} has been verified directly with PayPal.`,
    }),
    hi: (p) => ({
      title: "भुगतान सत्यापित हुआ",
      body: `₹${p.amount} का भुगतान PayPal से सफलतापूर्वक सत्यापित कर लिया गया है।`,
    }),
    mr: (p) => ({
      title: "पेमेंट प्राप्त व पडताळणी पूर्ण",
      body: `₹${p.amount} चे पेमेंट PayPal कडून यशस्वीरित्या पडताळले गेले आहे.`,
    }),
    pa: (p) => ({
      title: "ਭੁਗਤਾਨ ਪ੍ਰਾਪਤ ਅਤੇ ਪ੍ਰਮਾਣਿਤ",
      body: `₹${p.amount} ਦਾ ਭੁਗਤਾਨ PayPal ਨਾਲ ਸਫਲਤਾਪੂਰਵਕ ਪ੍ਰਮਾਣਿਤ ਹੋ ਗਿਆ ਹੈ।`,
    }),
    ta: (p) => ({
      title: "பணம் பெறப்பட்டு சரிபார்க்கப்பட்டது",
      body: `₹${p.amount} தொகை PayPal மூலம் வெற்றிகரமாக சரிபார்க்கப்பட்டது.`,
    }),
    te: (p) => ({
      title: "చెల్లింపు అందుకుంది మరియు ధృవీకరించబడింది",
      body: `₹${p.amount} చెల్లింపు PayPal ద్వారా విజయవంతంగా ధృవీకరించబడింది.`,
    }),
  },
  payout_sent: {
    en: (p) => ({
      title: "Payout Dispatched",
      body: `Your net payout of ₹${p.amount} for ${p.wasteType} has been dispatched.`,
    }),
    hi: (p) => ({
      title: "भुगतान भेज दिया गया",
      body: `${p.wasteType} के लिए ₹${p.amount} का भुगतान आपके खाते में भेजा गया है।`,
    }),
    mr: (p) => ({
      title: "पेआउट पाठवले गेले आहे",
      body: `${p.wasteType} साठीचे ₹${p.amount} चे पेआउट पाठवण्यात आले आहे.`,
    }),
    pa: (p) => ({
      title: "ਭੁਗਤਾਨ ਭੇਜ ਦਿੱਤਾ ਗਿਆ",
      body: `${p.wasteType} ਲਈ ₹${p.amount} ਦਾ ਭੁਗਤਾਨ ਭੇਜ ਦਿੱਤਾ ਗਿਆ ਹੈ।`,
    }),
    ta: (p) => ({
      title: "தொகை அனுப்பப்பட்டது",
      body: `${p.wasteType} க்கான ₹${p.amount} தொகை அனுப்பப்பட்டுள்ளது.`,
    }),
    te: (p) => ({
      title: "చెల్లింపు పంపబడింది",
      body: `${p.wasteType} కోసం మీ నికర చెల్లింపు ₹${p.amount} పంపబడింది.`,
    }),
  },
  seasonal_alert: {
    en: (p) => ({
      title: "Seasonal Harvest Alert",
      body: `${p.crop} season peak is approaching in ${p.region}. Sell your crop residue to earn without burning.`,
    }),
    hi: (p) => ({
      title: "मौसमी फसल चेतावनी",
      body: `${p.region} में ${p.crop} की कटाई का समय आ रहा है। पराली न जलाएं, ग्रीनरूट्स पर बेचकर कमाएं।`,
    }),
    mr: (p) => ({
      title: "हंगामी कापणी सूचना",
      body: `${p.region} मध्ये ${p.crop} चा हंगाम सुरू होत आहे. शेतातील काडीकचरा न जाळता ग्रीनरूट्सवर विका.`,
    }),
    pa: (p) => ({
      title: "ਮੌਸਮੀ ਵਾਢੀ ਚੇਤਾਵਨੀ",
      body: `${p.region} ਵਿੱਚ ${p.crop} ਦੀ ਵਾਢੀ ਆ ਰਹੀ ਹੈ। ਪਰਾਲੀ ਨਾ ਸਾੜੋ, ਗ੍ਰੀਨਰੂਟਸ 'ਤੇ ਵੇਚ ਕੇ ਕਮਾਈ ਕਰੋ।`,
    }),
    ta: (p) => ({
      title: "பருவகால அறுவடை எச்சரிக்கை",
      body: `${p.region} பகுதியில் ${p.crop} அறுவடை சமயம். பயிர் கழிவுகளை எரிக்காமல் விற்று வருமானம் ஈட்டுங்கள்.`,
    }),
    te: (p) => ({
      title: "సీజనల్ పంట హెచ్చరిక",
      body: `${p.region} లో ${p.crop} కోత సమయం మొదలవుతుంది. పంట వ్యర్థాలను కాల్చకుండా విక్రయించి ఆదాయం పొందండి.`,
    }),
  },
};

export function renderNotification(
  template: NotificationTemplate,
  lang: Language = "en",
  params: Record<string, string | number> = {}
): NotificationContent {
  const langKey = TEMPLATES[template][lang] ? lang : "en";
  return TEMPLATES[template][langKey](params);
}

