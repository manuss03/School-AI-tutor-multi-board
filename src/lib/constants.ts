export const BOARDS = [
  "CBSE",
  "ICSE",
  "ISC",
  "IB",
  "NIOS",
  "State Board",
] as const;

export const REGIONS: Record<string, string[]> = {
  "North India": ["Delhi", "Punjab", "Haryana", "Uttar Pradesh", "Uttarakhand", "Himachal Pradesh", "Jammu & Kashmir", "Chandigarh", "Rajasthan"],
  "South India": ["Tamil Nadu", "Karnataka", "Kerala", "Andhra Pradesh", "Telangana", "Puducherry"],
  "East India": ["West Bengal", "Bihar", "Jharkhand", "Odisha", "Sikkim", "Assam"],
  "West India": ["Maharashtra", "Gujarat", "Goa", "Madhya Pradesh", "Chhattisgarh"],
  "Central India": ["Madhya Pradesh", "Chhattisgarh"],
};

export const ALL_REGIONS = Object.keys(REGIONS);

export const CITIES: Record<string, string[]> = {
  "Delhi": ["New Delhi", "Dwarka", "Rohini", "Saket", "Pitampura"],
  "Punjab": ["Ludhiana", "Amritsar", "Jalandhar", "Patiala", "Mohali"],
  "Haryana": ["Gurugram", "Faridabad", "Panipat", "Ambala", "Karnal"],
  "Uttar Pradesh": ["Lucknow", "Kanpur", "Noida", "Ghaziabad", "Varanasi", "Agra", "Meerut"],
  "Uttarakhand": ["Dehradun", "Haridwar", "Roorkee", "Nainital", "Haldwani"],
  "Himachal Pradesh": ["Shimla", "Manali", "Dharamshala", "Solan", "Mandi"],
  "Jammu & Kashmir": ["Srinagar", "Jammu", "Anantnag", "Baramulla", "Udhampur"],
  "Chandigarh": ["Chandigarh"],
  "Rajasthan": ["Jaipur", "Jodhpur", "Udaipur", "Kota", "Ajmer", "Bikaner"],
  "Tamil Nadu": ["Chennai", "Coimbatore", "Madurai", "Tiruchirappalli", "Salem"],
  "Karnataka": ["Bengaluru", "Mysuru", "Mangaluru", "Hubli", "Belagavi"],
  "Kerala": ["Kochi", "Thiruvananthapuram", "Kozhikode", "Thrissur", "Kollam"],
  "Andhra Pradesh": ["Visakhapatnam", "Vijayawada", "Guntur", "Tirupati", "Kakinada"],
  "Telangana": ["Hyderabad", "Warangal", "Nizamabad", "Karimnagar", "Khammam"],
  "Puducherry": ["Puducherry", "Karaikal", "Mahe", "Yanam"],
  "West Bengal": ["Kolkata", "Howrah", "Durgapur", "Asansol", "Siliguri"],
  "Bihar": ["Patna", "Gaya", "Bhagalpur", "Muzaffarpur", "Darbhanga"],
  "Jharkhand": ["Ranchi", "Jamshedpur", "Dhanbad", "Bokaro", "Hazaribagh"],
  "Odisha": ["Bhubaneswar", "Cuttack", "Rourkela", "Berhampur", "Sambalpur"],
  "Sikkim": ["Gangtok", "Namchi", "Mangan", "Gyalshing"],
  "Assam": ["Guwahati", "Dibrugarh", "Silchar", "Jorhat", "Tezpur"],
  "Maharashtra": ["Mumbai", "Pune", "Nagpur", "Nashik", "Aurangabad", "Navi Mumbai"],
  "Gujarat": ["Ahmedabad", "Surat", "Vadodara", "Rajkot", "Bhavnagar"],
  "Goa": ["Panaji", "Margao", "Vasco da Gama", "Mapusa"],
  "Madhya Pradesh": ["Bhopal", "Indore", "Jabalpur", "Gwalior", "Ujjain"],
  "Chhattisgarh": ["Raipur", "Bhilai", "Bilaspur", "Korba", "Durg"],
};

export const CLASS_LEVELS = [
  "Class 6", "Class 7", "Class 8", "Class 9", "Class 10", "Class 11", "Class 12",
] as const;

export const SUBJECTS_BY_CLASS: Record<string, string[]> = {
  "Class 6": ["Mathematics", "Science", "Social Science", "English", "Hindi", "Computer Science", "Sanskrit"],
  "Class 7": ["Mathematics", "Science", "Social Science", "English", "Hindi", "Computer Science", "Sanskrit"],
  "Class 8": ["Mathematics", "Science", "Social Science", "English", "Hindi", "Computer Science", "Sanskrit"],
  "Class 9": ["Mathematics", "Science", "Social Science", "English", "Hindi", "Computer Science", "Sanskrit", "Economics"],
  "Class 10": ["Mathematics", "Science", "Social Science", "English", "Hindi", "Computer Science", "Sanskrit", "Economics"],
  "Class 11": ["Physics", "Chemistry", "Biology", "Mathematics", "Accountancy", "Business Studies", "Economics", "English", "Computer Science", "History", "Political Science", "Geography", "Psychology"],
  "Class 12": ["Physics", "Chemistry", "Biology", "Mathematics", "Accountancy", "Business Studies", "Economics", "English", "Computer Science", "History", "Political Science", "Geography", "Psychology"],
};

export const SUBJECTS_DEFAULT = ["Mathematics", "Science", "Social Science", "English", "Hindi", "Computer Science"];

export const QUIZ_TYPES = [
  { value: "quiz", label: "Quick Quiz", description: "5-10 questions for quick practice" },
  { value: "mock_exam", label: "Mock Exam", description: "Comprehensive exam-style test" },
] as const;

export const DIFFICULTY_LEVELS = ["easy", "medium", "hard"] as const;

export const QUESTION_TYPES = [
  { value: "mcq", label: "Multiple Choice" },
  { value: "short_answer", label: "Short Answer" },
] as const;

export const LLM_PROVIDERS = [
  {
    value: "openai" as const,
    label: "ChatGPT (OpenAI)",
    description: "Power the tutor with GPT-4o, GPT-4 Turbo, and more",
    models: [
      { value: "gpt-4o-mini", label: "GPT-4o Mini (Fast & Affordable)" },
      { value: "gpt-4o", label: "GPT-4o (Most Capable)" },
      { value: "gpt-4-turbo", label: "GPT-4 Turbo" },
      { value: "gpt-3.5-turbo", label: "GPT-3.5 Turbo (Budget)" },
    ],
    helpUrl: "https://platform.openai.com/api-keys",
    helpText: "Get your API key from platform.openai.com/api-keys",
  },
  {
    value: "anthropic" as const,
    label: "Claude (Anthropic)",
    description: "Power the tutor with Claude 3.5 Sonnet, Haiku, and Opus",
    models: [
      { value: "claude-3-5-sonnet-20241022", label: "Claude 3.5 Sonnet (Recommended)" },
      { value: "claude-3-5-haiku-20241022", label: "Claude 3.5 Haiku (Fast)" },
      { value: "claude-3-opus-20240229", label: "Claude 3 Opus (Most Capable)" },
    ],
    helpUrl: "https://console.anthropic.com/settings/keys",
    helpText: "Get your API key from console.anthropic.com/settings/keys",
  },
  {
    value: "perplexity" as const,
    label: "Perplexity AI",
    description: "Use Perplexity's online models with built-in web search",
    models: [
      { value: "sonar-pro", label: "Sonar Pro (Recommended)" },
      { value: "sonar", label: "Sonar (Fast)" },
      { value: "sonar-reasoning", label: "Sonar Reasoning (Most Capable)" },
    ],
    helpUrl: "https://www.perplexity.ai/settings/api",
    helpText: "Get your API key from perplexity.ai/settings/api",
  },
  {
    value: "groq" as const,
    label: "Groq",
    description: "Ultra-fast inference with Llama and Mixtral models",
    models: [
      { value: "openai/gpt-oss-120b", label: "GPT-OSS 120B (Recommended)" },
      { value: "openai/gpt-oss-20b", label: "GPT-OSS 20B (Fast)" },
      { value: "llama-3.3-70b-versatile", label: "Llama 3.3 70B" },
    ],
    helpUrl: "https://console.groq.com/keys",
    helpText: "Get your API key from console.groq.com/keys",
  },
  {
    value: "gemini" as const,
    label: "Google Gemini",
    description: "Power the tutor with Google's Gemini models",
    models: [
      { value: "gemini-3.6-flash", label: "Gemini 3.6 Flash (Recommended)" },
      { value: "gemini-3.5-flash", label: "Gemini 3.5 Flash (Capable)" },
      { value: "gemini-3.5-flash-lite", label: "Gemini 3.5 Flash Lite (Fast & Affordable)" },
    ],
    helpUrl: "https://aistudio.google.com/apikey",
    helpText: "Get your API key from aistudio.google.com/apikey",
  },
  {
    value: "mistral" as const,
    label: "Mistral AI",
    description: "Use Mistral's efficient open-weight and proprietary models",
    models: [
      { value: "mistral-large-latest", label: "Mistral Large 3 (Most Capable)" },
      { value: "mistral-small-latest", label: "Mistral Small 3.2 (Fast & Affordable)" },
      { value: "mistral-medium-latest", label: "Mistral Medium 3.5 (Balanced)" },
    ],
    helpUrl: "https://console.mistral.ai/api-keys/",
    helpText: "Get your API key from console.mistral.ai/api-keys",
  },
  {
    value: "openrouter" as const,
    label: "OpenRouter",
    description: "Access 100+ models (GPT, Claude, Llama, Gemini) through one API",
    models: [
      { value: "openai/gpt-4o-mini", label: "GPT-4o Mini (via OpenRouter)" },
      { value: "anthropic/claude-3.5-sonnet", label: "Claude 3.5 Sonnet (via OpenRouter)" },
      { value: "google/gemini-3.6-flash", label: "Gemini 3.6 Flash (via OpenRouter)" },
      { value: "meta-llama/llama-3.3-70b-instruct", label: "Llama 3.3 70B (via OpenRouter)" },
    ],
    helpUrl: "https://openrouter.ai/keys",
    helpText: "Get your API key from openrouter.ai/keys",
  },
];

export const GRADE_COLORS: Record<string, string> = {
  "A+": "text-emerald-600",
  "A": "text-emerald-600",
  "B+": "text-blue-600",
  "B": "text-blue-600",
  "C+": "text-amber-600",
  "C": "text-amber-600",
  "D": "text-orange-600",
  "F": "text-red-600",
};
