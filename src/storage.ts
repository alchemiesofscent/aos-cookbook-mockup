import { DatabaseState, MasterEntity, Recipe } from "./types";

const STORAGE_KEYS = {
  RECIPES: 'AOS_RECIPES',
  INGREDIENTS: 'AOS_MASTER_INGREDIENTS',
  TOOLS: 'AOS_MASTER_TOOLS',
  PROCESSES: 'AOS_MASTER_PROCESSES',
  WORKS: 'AOS_MASTER_WORKS',
  PEOPLE: 'AOS_MASTER_PEOPLE',
  DB_VERSION: 'AOS_DB_VERSION',
  DB_INITIALIZED: 'AOS_DB_INITIALIZED'
};

const CURRENT_DB_VERSION = "1";

const SEED_DATA: DatabaseState = {
  masterPeople: [
    {
      id: "p-dioscorides",
      name: "Pedanius Dioscorides",
      slug: "pedanius-dioscorides",
      urn: "urn:aos:person:pedanius-dioscorides",
      description: "Greek physician, pharmacologist, and botanist, employed in the Roman army. Author of De materia medica.",
      role: "Physician",
      place: "Anazarbus",
      date: "1st Century CE"
    },
    {
      id: "p-theophrastus",
      name: "Theophrastus",
      slug: "theophrastus",
      urn: "urn:aos:person:theophrastus",
      description: "Successor to Aristotle, author of On Odors.",
      role: "Philosopher",
      place: "Athens",
      date: "c. 371 – c. 287 BCE"
    }
  ],
  masterWorks: [
    {
      id: "w-materia-medica",
      name: "De materia medica",
      slug: "de-materia-medica",
      urn: "urn:aos:work:de-materia-medica",
      description: "Encyclopedic pharmacological treatise.",
      authorId: "p-dioscorides",
      author: "Pedanius Dioscorides",
      date: "c. 50-70 CE",
      language: "Ancient Greek",
      place: "Roman Empire"
    },
    {
      id: "w-on-odors",
      name: "De odoribus",
      slug: "de-odoribus",
      urn: "urn:aos:work:de-odoribus",
      description: "Treatise on perfumes and smells.",
      authorId: "p-theophrastus",
      author: "Theophrastus",
      date: "c. 300 BCE",
      language: "Ancient Greek",
      place: "Athens"
    }
  ],
  masterIngredients: [
    { id: "i-rose", name: "Rose", originalName: "ῥόδα", transliteratedName: "rhoda", slug: "rhoda", urn: "urn:aos:ingredient:rhoda", description: "Rosa gallica or Rosa centifolia petals." },
    { id: "i-honey", name: "Honey", originalName: "μέλι", transliteratedName: "meli", slug: "meli", urn: "urn:aos:ingredient:meli", description: "Sweet viscous fluid produced by bees." },
    { id: "i-oil", name: "Olive Oil", originalName: "ἔλαιον", transliteratedName: "elaion", slug: "elaion", urn: "urn:aos:ingredient:elaion", description: "Base oil, preferably omphacium (unripe)." },
    { id: "i-lemongrass", name: "Lemongrass", originalName: "σχοῖνος", transliteratedName: "skhoinos", slug: "skhoinos", urn: "urn:aos:ingredient:skhoinos", description: "Aromatic rush or reed, likely Cymbopogon schoenanthus." },
    { id: "i-myrrh", name: "Myrrh", originalName: "σμύρνα", transliteratedName: "smyrna", slug: "smyrna", urn: "urn:aos:ingredient:smyrna", description: "Gum resin from Commiphora myrrha." },
    { id: "i-wine", name: "Old Wine", originalName: "οἶνος παλαιός", transliteratedName: "oinos-palaios", slug: "oinos-palaios", urn: "urn:aos:ingredient:oinos-palaios", description: "Aged wine used for maceration." },
    { id: "i-kalamos", name: "Kalamos", originalName: "κάλαμος", transliteratedName: "kalamos", slug: "kalamos", urn: "urn:aos:ingredient:kalamos", description: "Sweet Flag or similar aromatic reed used for stypsis." },
    { id: "i-aspalathos", name: "Aspalathos", originalName: "ἀσπάλαθος", transliteratedName: "aspalathos", slug: "aspalathos", urn: "urn:aos:ingredient:aspalathos", description: "Aromatic thorny shrub, used for stypsis." },
    { id: "i-anchusa", name: "Alkanet", originalName: "ἄγχουσα", transliteratedName: "anchusa", slug: "anchusa", urn: "urn:aos:ingredient:anchusa", description: "Root used as a red dye." },
    { id: "i-salt", name: "Salt", originalName: "ἅλς", transliteratedName: "hals", slug: "salt", urn: "urn:aos:ingredient:salt", description: "Used as a preservative." }
  ],
  masterTools: [
    { id: "t-mortar", name: "Mortar", originalName: "θυεία", transliteratedName: "thyeia", slug: "thyeia", urn: "urn:aos:tool:thyeia", description: "Vessel for crushing ingredients." },
    { id: "t-strainer", name: "Strainer", originalName: "ἠθμός", transliteratedName: "ethmos", slug: "ethmos", urn: "urn:aos:tool:ethmos", description: "Linen cloth or metal sieve for filtering." }
  ],
  masterProcesses: [
    { id: "pr-boiling", name: "Boiling", originalName: "ἕψειν", transliteratedName: "hepsein", slug: "hepsein", urn: "urn:aos:process:hepsein", description: "Heating ingredients in liquid." },
    { id: "pr-pressing", name: "Pressing", originalName: "ἐκθλίβειν", transliteratedName: "ekthlibein", slug: "ekthlibein", urn: "urn:aos:process:ekthlibein", description: "Squeezing out liquid or oil." }
  ],
  recipes: [
    {
        id: "r-rose-perfume",
        slug: "rose-perfume-dioscorides",
        urn: "urn:aos:recipe:rose-perfume-dioscorides",
        metadata: {
            title: "Rose Perfume",
            sourceWorkId: "w-materia-medica",
            author: "Dioscorides",
            attribution: "",
            place: "Roman Empire",
            date: "1st c. CE",
            language: "Ancient Greek"
        },
        text: {
            original: "1 ῥοδίνου σκευασία· σχοίνου λίτρας πέντε οὐγγίας ὀκτώ ἐλαίου λίτρας εἴκοσι οὐγγίας πέντε κόψας καὶ φυράσας ἐν ὕδατι ἕψε ἀνακινῶν, εἶτα ἀπηθήσας εἰς τὰς εἴκοσι λίτρας καὶ οὐγγίας πέντε τοῦ ἐλαίου βάλε ῥόδων ἀβρόχων ἀριθμῷ χιλίων τὰ πέταλα, καὶ τὰς χεῖρας μέλιτι χρίσας εὐώδει ἀνακίνει πλεονάκις ὑποθλίβων ἠρέμα, ἔπειτα ἐάσας τὴν νύκτα ἔκθλιβε. ὅταν δὲ τὸ τρυγῶδες ὑποστῇ, ἄλλαξον τὸ ὑποδεχόμενον ἀγγεῖον, ἀποτίθεσο δὲ εἰς κρατῆρα μέλιτι κατακεχρισμένον. βαλὼν δὲ εἰς λουτηρίδιον τὰ ἐξιπωθέντα ῥόδα ἐπίχει λίτρας ὀκτὼ οὐγγίας τρεῖς τοῦ ἐστυμμένου ἐλαίου καὶ πάλιν ἐξίπου.\n\n2 ἔσται δέ σοι τοῦτο δεύτερον, κἂν βουληθῇς, ἄχρι τρίτης καὶ τετάρτης βροχῆς ἐπιχέων ἐξίπου· γίνεται γὰρ τὸ μὲν πρῶτον, τὸ δὲ δεύτερον, τὸ δὲ τρίτον, τὸ δὲ τέταρτον τὸ μύρον. ὁσάκις δ᾿  ἂν ποιῇς, τοὺς κρατῆρας προκατάχριε μέλιτι. εἰ δὲ θέλεις δευτέραν ἐμβολὴν ποιήσασθαι, εἰς τὸ πρῶτον ἐξιπωθὲν ἔλαιον τὸν ἴσον ἀριθμὸν προσφάτων ῥόδων ἀβρόχων ἔμβαλε, καὶ ἀνακινήσας ταῖς χερσὶ προδεδευμέναις μέλιτι ἐκπίεζε καὶ ποίει τὸ δεύτερον καὶ τρίτον καὶ τέταρτον ὁμοίως ἐκθλίβων. καὶ ὁσάκις δ᾿  ἂν ποιῇς τοῦτο, νεαρὰ πρόσβαλε ῥόδα· δυναμικώτερον γὰρ γίνεται.\n\n3 ἄχρι δὲ ἑβδόμης ἐμβροχῆς ἐπιδέχεται τὸ ἔλαιον τὴν ἐμβολὴν τῶν ῥόδων, ἔπειτα δὲ οὐκέτι· κεχρίσθω δὲ καὶ ἡ ληνὸς μέλιτι. δεῖ δὲ ἐπιμελῶς τὸ ἔλαιον τοῦ χυλοῦ χωρίζειν. συναπολειφθὲν γὰρ κἂν τοὐλάχιστον φθείρει τὸ μύρον. ἔνιοι δὲ αὐτὰ μόνα τὰ ῥόδα θλάσαντες ἐναποβρέχουσι τῷ ἐλαίῳ καὶ ἀλλάσσοντες παῤ ἡμέρας ἑπτὰ ἄχρι τρίτης βροχῆς οὕτως ἀποτίθενται. ἔνιοι δὲ προστύφουσι τὸ ἔλαιον, κάλαμον καὶ ἀσπάλαθον παρεμβάλλοντες, οἱ δὲ καὶ ἄγχουσαν ἕνεκα εὐχροίας καὶ ἅλας πρὸς τὸ μὴ φθείρεσθαι.",
            translation: "Preparation of rose oil: Take five litras, eight ounces of skhoinos, twenty litras and five ounces of oil. Cut and soften [the skhoinos] in water, then boil [in the oil] while stirring. Afterward, strain the mixture and place the unmoistened petals of one thousand roses into the twenty litras and five ounces of oil. Rub your hands with fragrant honey and stir repeatedly, pressing gently. Then, let it sit overnight and strain the oil. When the sediment has settled, transfer the oil into a different container and store it in a jar that has been smeared with honey. Put the strained roses into a small basin, pour in eight litras and three ounces of the pressed oil, and strain again.\n\nThis will be your second batch, and if you wish, you may continue up to the third and fourth infusion by pouring and straining. The first, second, third, and fourth infusions produce the oil. Whenever you prepare this, coat the jars with honey beforehand. If you want to make a second infusion, add the same number of fresh dry roses to the previously strained oil, stir them with hands that have been coated in honey, press, and repeat the straining for the second, third, and fourth infusions. Whenever you do this, add fresh roses, as this increases the potency.\n\nThe oil can undergo up to seven infusions of roses, but no more after that. The tub should also be smeared with honey. You must carefully separate the oil from the juice, as even the smallest amount left behind spoils the oil. Some people crush only the roses and soak them in oil, changing the oil every seven days up to the third infusion. Others pre-treat the oil, adding in addition kalamos and aspalathos, and some also add anchusa for its color and salt to prevent spoilage.",
            notes: "A standard recipe for Rhodion from Dioscorides Book 1. Note the specific emphasis on 'skhoinos' (lemongrass) for stypsis and the repeated enfleurage process."
        },
        items: [
            { id: "ri-1", type: "ingredient", masterId: "i-lemongrass", originalTerm: "σχοῖνος", transliteration: "skhoinos", displayTerm: "Lemongrass", amount: "5 lbs 8 oz", originalAmount: "λίτρας πέντε οὐγγίας ὀκτώ", quantities: [], role: "aromatic" },
            { id: "ri-2", type: "ingredient", masterId: "i-oil", originalTerm: "ἔλαιον", transliteration: "elaion", displayTerm: "Olive Oil", amount: "20 lbs 5 oz", originalAmount: "λίτρας εἴκοσι οὐγγίας πέντε", quantities: [], role: "base" },
            { id: "ri-3", type: "ingredient", masterId: "i-rose", originalTerm: "ῥόδα", transliteration: "rhoda", displayTerm: "Rose petals (dry)", amount: "1000", originalAmount: "ἀριθμῷ χιλίων", quantities: [], role: "aromatic" },
            { id: "ri-4", type: "ingredient", masterId: "i-honey", originalTerm: "μέλι", transliteration: "meli", displayTerm: "Honey", amount: "QS", originalAmount: "χρίσας", quantities: [], role: "adjuvant" },
            { id: "ri-5", type: "ingredient", masterId: "i-kalamos", originalTerm: "κάλαμος", transliteration: "kalamos", displayTerm: "Kalamos", amount: "QS", originalAmount: "παρεμβάλλοντες", quantities: [], role: "adjuvant" },
            { id: "ri-6", type: "ingredient", masterId: "i-aspalathos", originalTerm: "ἀσπάλαθος", transliteration: "aspalathos", displayTerm: "Aspalathos", amount: "QS", originalAmount: "παρεμβάλλοντες", quantities: [], role: "adjuvant" },
            { id: "ri-7", type: "ingredient", masterId: "i-anchusa", originalTerm: "ἄγχουσα", transliteration: "anchusa", displayTerm: "Alkanet", amount: "QS", originalAmount: "ἕνεκα εὐχροίας", quantities: [], role: "other" },
            { id: "ri-8", type: "ingredient", masterId: "i-salt", originalTerm: "ἅλας", transliteration: "hals", displayTerm: "Salt", amount: "QS", originalAmount: "πρὸς τὸ μὴ φθείρεσθαι", quantities: [], role: "other" }
        ]
    }
  ]
};

const writeDatabaseToStorage = (data: DatabaseState) => {
  localStorage.setItem(STORAGE_KEYS.RECIPES, JSON.stringify(data.recipes));
  localStorage.setItem(STORAGE_KEYS.INGREDIENTS, JSON.stringify(data.masterIngredients));
  localStorage.setItem(STORAGE_KEYS.TOOLS, JSON.stringify(data.masterTools));
  localStorage.setItem(STORAGE_KEYS.PROCESSES, JSON.stringify(data.masterProcesses));
  localStorage.setItem(STORAGE_KEYS.WORKS, JSON.stringify(data.masterWorks));
  localStorage.setItem(STORAGE_KEYS.PEOPLE, JSON.stringify(data.masterPeople));
  localStorage.setItem(STORAGE_KEYS.DB_VERSION, CURRENT_DB_VERSION);
  localStorage.setItem(STORAGE_KEYS.DB_INITIALIZED, "true");
};

export const StorageAdapter = {
  load: (): DatabaseState => {
    const hasData = localStorage.getItem(STORAGE_KEYS.RECIPES);
    
    // Seed data if database is empty
    if (!hasData) {
        writeDatabaseToStorage(SEED_DATA);
        return JSON.parse(JSON.stringify(SEED_DATA));
    }

    return {
      recipes: JSON.parse(localStorage.getItem(STORAGE_KEYS.RECIPES) || '[]'),
      masterIngredients: JSON.parse(localStorage.getItem(STORAGE_KEYS.INGREDIENTS) || '[]'),
      masterTools: JSON.parse(localStorage.getItem(STORAGE_KEYS.TOOLS) || '[]'),
      masterProcesses: JSON.parse(localStorage.getItem(STORAGE_KEYS.PROCESSES) || '[]'),
      masterWorks: JSON.parse(localStorage.getItem(STORAGE_KEYS.WORKS) || '[]'),
      masterPeople: JSON.parse(localStorage.getItem(STORAGE_KEYS.PEOPLE) || '[]'),
    };
  },

  save: (data: DatabaseState) => {
    writeDatabaseToStorage(data);
  },
  
  export: () => {
      const data = StorageAdapter.load();
      const blob = new Blob([JSON.stringify(data, null, 2)], {type : 'application/json'});
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `aos_backup_${new Date().toISOString().slice(0,10)}.json`;
      a.click();
  },

  import: async (file: File): Promise<DatabaseState> => {
      return new Promise((resolve, reject) => {
          const reader = new FileReader();
          reader.onload = (e) => {
              try {
                  const data = JSON.parse(e.target?.result as string);
                  // Ensure masterPeople exists for older backups
                  if (!data.masterPeople) data.masterPeople = [];
                  resolve(data);
              } catch (err) {
                  reject(err);
              }
          };
          reader.readAsText(file);
      });
  }
};

export const generateSlug = (text: string): string => {
  if (!text) return '';
  return text
    .normalize('NFD')                   // Decompose combined graphemes (e.g. ē -> e + ̄ )
    .replace(/[\u0300-\u036f]/g, "")    // Remove diacritical marks (accents, macrons, etc.)
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')        // Replace non-alphanumeric with dashes
    .replace(/(^-|-$)+/g, '');          // Trim leading/trailing dashes
};

export const generateURN = (type: string, slug: string): string => {
  return `urn:aos:${type}:${slug}`;
};

const shouldInitializeFromSeed = (): boolean => {
  const version = localStorage.getItem(STORAGE_KEYS.DB_VERSION);
  const initialized = localStorage.getItem(STORAGE_KEYS.DB_INITIALIZED);
  const hasRecipes = localStorage.getItem(STORAGE_KEYS.RECIPES);
  return version !== CURRENT_DB_VERSION || initialized !== "true" || !hasRecipes;
};

export const loadState = async (): Promise<DatabaseState> => {
  if (!shouldInitializeFromSeed()) return StorageAdapter.load();

  try {
    const base = import.meta.env.BASE_URL || "/";
    const normalizedBase = base.endsWith("/") ? base : `${base}/`;
    const seedUrl = `${normalizedBase}data/seed.json`;
    const response = await fetch(seedUrl, { cache: "no-cache" });
    if (!response.ok) {
      throw new Error(`Failed to fetch seed.json: ${response.status} ${response.statusText}`);
    }
    const seed = (await response.json()) as DatabaseState;
    writeDatabaseToStorage(seed);
    return StorageAdapter.load();
  } catch (error) {
    console.warn("Seed overlay failed; falling back to in-code SEED_DATA.", error);
    writeDatabaseToStorage(SEED_DATA);
    return StorageAdapter.load();
  }
};

export const saveState = (data: DatabaseState) => StorageAdapter.save(data);
