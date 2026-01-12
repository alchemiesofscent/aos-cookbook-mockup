import React, { useState, useEffect, useMemo } from "react";
import { DatabaseState, MasterEntity, Recipe, RecipeItem, Quantity } from "./types";
import { StorageAdapter, generateSlug, generateURN } from "./storage";

// --- Controlled Vocabularies ---
const LANGUAGES = [
  "Ancient Greek",
  "Latin",
  "Arabic",
  "Akkadian",
  "Sumerian",
  "Egyptian",
  "English",
  "French",
  "German",
  "Italian"
];

// --- Styles for the Admin Console ---
const AdminStyles = () => (
  <style>{`
    .admin-layout { display: flex; min-height: 100vh; background: #f0f0f0; font-family: 'Noto Sans', sans-serif; }
    .admin-sidebar { width: 250px; background: #2D2A26; color: #FAF7F0; display: flex; flex-direction: column; padding: 1rem; flex-shrink: 0; }
    .admin-content { flex: 1; padding: 2rem; overflow-y: auto; }
    
    .admin-brand { font-family: 'Gentium Plus', serif; font-size: 1.2rem; margin-bottom: 2rem; letter-spacing: 0.05em; color: #C9A227; cursor: pointer; }
    .admin-nav-item { padding: 0.75rem 1rem; cursor: pointer; border-radius: 4px; margin-bottom: 0.25rem; color: #9A9487; }
    .admin-nav-item:hover { background: rgba(255,255,255,0.05); color: white; }
    .admin-nav-item.active { background: #C9A227; color: #2D2A26; font-weight: 600; }
    .admin-nav-section { text-transform: uppercase; font-size: 0.75rem; color: #666; margin: 1.5rem 0 0.5rem 0.5rem; letter-spacing: 0.1em; }

    .console-card { background: white; border-radius: 8px; box-shadow: 0 2px 8px rgba(0,0,0,0.05); padding: 2rem; margin-bottom: 2rem; }
    .console-header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 1.5rem; border-bottom: 1px solid #eee; padding-bottom: 1rem; }
    .console-header h2 { margin: 0; font-size: 1.5rem; color: #2D2A26; }

    .form-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 1.5rem; margin-bottom: 1.5rem; }
    .form-group { margin-bottom: 1rem; }
    .form-group label { display: block; font-size: 0.85rem; font-weight: 600; color: #5C4A3D; margin-bottom: 0.4rem; }
    .form-group input, .form-group textarea, .form-group select { width: 100%; padding: 0.6rem; border: 1px solid #ccc; border-radius: 4px; font-family: 'Noto Sans', sans-serif; }
    .form-group input:focus, .form-group textarea:focus { border-color: #C9A227; outline: none; }
    .form-group .hint { font-size: 0.75rem; color: #888; margin-top: 0.25rem; }
    
    .tab-nav { display: flex; border-bottom: 1px solid #ddd; margin-bottom: 1.5rem; }
    .tab-btn { padding: 0.75rem 1.5rem; cursor: pointer; border-bottom: 3px solid transparent; font-weight: 500; color: #666; }
    .tab-btn.active { border-bottom-color: #C9A227; color: #2D2A26; }
    
    .data-table { width: 100%; border-collapse: collapse; font-size: 0.9rem; }
    .data-table th { text-align: left; padding: 0.75rem; background: #f9f9f9; border-bottom: 2px solid #eee; color: #555; }
    .data-table td { padding: 0.75rem; border-bottom: 1px solid #eee; }
    .data-table tr:hover { background: #fcfcfc; }
    
    .btn-action { background: #C9A227; color: white; border: none; padding: 0.5rem 1rem; border-radius: 4px; cursor: pointer; font-weight: 500; }
    .btn-action:hover { background: #8B6914; }
    .btn-outline { background: transparent; border: 1px solid #ccc; color: #555; padding: 0.5rem 1rem; border-radius: 4px; cursor: pointer; }
    .btn-danger { background: #dc3545; color: white; border: none; padding: 0.5rem 1rem; border-radius: 4px; }
    
    .item-row { background: #f9f9f9; padding: 1rem; border-radius: 6px; margin-bottom: 0.5rem; display: grid; grid-template-columns: 2fr 2fr 1fr 1fr auto; gap: 1rem; align-items: start; }
    .qty-tag { display: inline-block; background: #e0e0e0; font-size: 0.7rem; padding: 0.1rem 0.4rem; border-radius: 4px; margin-right: 0.3rem; margin-top: 0.2rem; border: 1px solid #ccc; }

    .status-bar { position: fixed; bottom: 0; left: 250px; right: 0; background: #2D2A26; color: #9A9487; padding: 0.5rem 2rem; font-size: 0.8rem; display: flex; justify-content: space-between; }
    
    .modal-overlay { position: fixed; top: 0; left: 0; right: 0; bottom: 0; background: rgba(0,0,0,0.5); display: flex; justify-content: center; align-items: center; z-index: 1000; }
    .modal-content { background: white; padding: 2rem; border-radius: 8px; width: 500px; max-width: 90%; }
  `}</style>
);

// --- Sub-Components ---

const MasterList = ({ title, data, onEdit, onDelete, onCreate }) => {
  const [search, setSearch] = useState('');
  
  const filtered = data.filter(d => d.name.toLowerCase().includes(search.toLowerCase()) || d.slug.includes(search.toLowerCase()));

  return (
    <div className="console-card">
      <div className="console-header">
        <h2>{title} Management</h2>
        <button className="btn-action" onClick={onCreate}>+ Create New</button>
      </div>
      <div className="form-group">
        <input placeholder="Search..." value={search} onChange={e => setSearch(e.target.value)} />
      </div>
      <table className="data-table">
        <thead>
          <tr>
            <th>Name</th>
            <th>Slug</th>
            <th>URN</th>
            <th>Actions</th>
          </tr>
        </thead>
        <tbody>
          {filtered.map(item => (
            <tr key={item.id}>
              <td style={{fontWeight: 600}}>{item.name}</td>
              <td>{item.slug}</td>
              <td style={{fontSize: '0.8rem', color: '#888'}}>{item.urn}</td>
              <td>
                <button className="text-btn" onClick={() => onEdit(item)}>Edit</button>
                <span style={{margin: '0 0.5rem'}}>|</span>
                <button className="text-btn" style={{color: '#dc3545'}} onClick={() => onDelete(item.id)}>Delete</button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};

const RecipeEditor = ({ recipe, masters, onSave, onCancel, onCreateWork, existingPlaces }) => {
  const [formData, setFormData] = useState<Recipe>(recipe || {
    id: crypto.randomUUID(),
    slug: '',
    urn: '',
    metadata: { title: '', sourceWorkId: '', author: '', attribution: '', language: '', date: '', place: '' },
    text: { original: '', translation: '', notes: '' },
    items: []
  });

  const [activeTab, setActiveTab] = useState('meta');
  const [jsonInput, setJsonInput] = useState('');

  // Helper to determine inherited metadata
  const inherited = useMemo(() => {
    const work = masters.works.find(w => w.id === formData.metadata.sourceWorkId);
    if (!work) return { author: '', date: '', language: '', place: '' };
    
    // Default to work properties
    let author = work.author || '';
    let date = work.date || '';
    let language = work.language || '';
    let place = work.place || '';
    
    // If work has parent, fall back to parent for missing fields
    if (work.parentId) {
      const parent = masters.works.find(p => p.id === work.parentId);
      if (parent) {
         if (!author) author = parent.author || '';
         if (!date) date = parent.date || '';
         if (!language) language = parent.language || '';
         if (!place) place = parent.place || '';
      }
    }
    return { author, date, language, place };
  }, [formData.metadata.sourceWorkId, masters.works]);

  // Auto-generate slug/urn if title changes and slug is empty
  useEffect(() => {
    if (recipe) return; // Don't auto-update on edit existing
    if (formData.metadata.title) {
      // Logic: [title-slug]-[author-slug]
      // Author priority: Attribution > Override Author > Inherited Author > 'Unknown'
      const titleSlug = generateSlug(formData.metadata.title);
      
      let authorStr = 'unknown';
      if (formData.metadata.attribution) authorStr = formData.metadata.attribution;
      else if (formData.metadata.author) authorStr = formData.metadata.author;
      else if (inherited.author) authorStr = inherited.author;
      
      const authorSlug = generateSlug(authorStr);
      const slug = `${titleSlug}-${authorSlug}`;

      setFormData(prev => ({
        ...prev,
        slug,
        urn: generateURN('recipe', slug)
      }));
    }
  }, [formData.metadata.title, formData.metadata.attribution, formData.metadata.author, inherited.author]);

  const updateMeta = (field, value) => {
    setFormData(prev => ({ ...prev, metadata: { ...prev.metadata, [field]: value } }));
  };

  const addItem = (type: 'ingredient' | 'tool' | 'process') => {
    setFormData(prev => ({
      ...prev,
      items: [...prev.items, {
        id: crypto.randomUUID(),
        type,
        masterId: null,
        originalTerm: '',
        displayTerm: '',
        amount: '',
        quantities: [],
        role: ''
      }]
    }));
  };

  const updateItem = (id, field, value) => {
    setFormData(prev => ({
      ...prev,
      items: prev.items.map(item => item.id === id ? { ...item, [field]: value } : item)
    }));
  };

  const removeItem = (id) => {
    setFormData(prev => ({ ...prev, items: prev.items.filter(i => i.id !== id) }));
  };

  // LLM Helper Functions
  const generatePrompt = () => {
    const prompt = `You are a specialized assistant for the "Alchemies of Scent" project. Your task is to extract ingredients, tools, and processes from ancient Greek recipe texts.

    CRITICAL TASK: Metrology and Unit Parsing.
    You must extract measurements and parse them into a controlled vocabulary.
    
    1. Identify the 'originalTerm' (the full Greek phrase, e.g., "σχοίνου λίτρας πέντε οὐγγίας ὀκτώ").
    2. Create a 'displayTerm' (English translation, e.g., "5 litras 8 ounces of skhoinos").
    3. Create an 'amount' string (e.g., "5 litras 8 ounces").
    4. PARSE 'quantities': Create an array of objects for numerical normalization.
       - Supported Units: litra, ouggia, drachma, gramma, mna, xestes, kotyle.
       - Format: { "value": number, "unit": "string" }
       - Example: "λίτρας πέντε οὐγγίας ὀκτώ" becomes [{"value": 5, "unit": "litra"}, {"value": 8, "unit": "ouggia"}]

    Output Format (JSON):
    { 
      "items": [ 
        { 
          "type": "ingredient|tool|process", 
          "originalTerm": "string", 
          "displayTerm": "string", 
          "amount": "string",
          "quantities": [ { "value": 0, "unit": "string" } ],
          "role": "string" 
        } 
      ] 
    }
    
    TEXT TO ANALYZE (Greek & Translation):
    ${formData.text.original}
    
    ${formData.text.translation}
    `;
    navigator.clipboard.writeText(prompt);
    alert("Metrology Prompt copied to clipboard!");
  };

  const applyJson = () => {
    try {
      const parsed = JSON.parse(jsonInput);
      if (parsed.items && Array.isArray(parsed.items)) {
        const newItems = parsed.items.map(i => ({
           id: crypto.randomUUID(),
           masterId: null, // Logic to auto-match could go here
           quantities: i.quantities || [], // Ensure array exists
           ...i
        }));
        setFormData(prev => ({ ...prev, items: [...prev.items, ...newItems] }));
        setJsonInput('');
        alert(`Imported ${newItems.length} items with structured units.`);
      }
    } catch (e) {
      alert("Invalid JSON");
    }
  };

  // Helper to format work names in dropdown
  const formatWorkOption = (w) => {
    if (w.parentId) {
      const parent = masters.works.find(p => p.id === w.parentId);
      return `${parent?.name || 'Unknown'} (${w.name})`;
    }
    return w.name;
  };

  return (
    <div className="console-card">
      <div className="console-header">
        <h2>{recipe ? 'Edit Recipe' : 'New Recipe'}</h2>
        <div>
          <button className="btn-outline" style={{marginRight: '1rem'}} onClick={onCancel}>Cancel</button>
          <button className="btn-action" onClick={() => onSave(formData)}>Save Recipe</button>
        </div>
      </div>

      <div className="tab-nav">
        <div className={`tab-btn ${activeTab === 'meta' ? 'active' : ''}`} onClick={() => setActiveTab('meta')}>Metadata</div>
        <div className={`tab-btn ${activeTab === 'text' ? 'active' : ''}`} onClick={() => setActiveTab('text')}>Text</div>
        <div className={`tab-btn ${activeTab === 'extraction' ? 'active' : ''}`} onClick={() => setActiveTab('extraction')}>Extraction</div>
        <div className={`tab-btn ${activeTab === 'llm' ? 'active' : ''}`} onClick={() => setActiveTab('llm')}>LLM Assistant</div>
      </div>

      {activeTab === 'meta' && (
        <div className="form-grid">
          <div className="form-group">
            <label>Title</label>
            <input value={formData.metadata.title} onChange={e => updateMeta('title', e.target.value)} />
          </div>
          <div className="form-group">
             <label>Slug (ID) - Auto-generated from Title & Author</label>
             <input value={formData.slug} onChange={e => setFormData({...formData, slug: e.target.value})} style={{background: '#f9f9f9'}} />
          </div>
          <div className="form-group">
             <label>URN</label>
             <input value={formData.urn} readOnly style={{background: '#f9f9f9'}} />
          </div>
          <div className="form-group">
             <label>Source Work</label>
             <select 
                value={formData.metadata.sourceWorkId} 
                onChange={e => {
                    if (e.target.value === 'NEW_WORK') {
                        onCreateWork();
                    } else {
                        updateMeta('sourceWorkId', e.target.value);
                    }
                }}
             >
               <option value="">Select Work...</option>
               {masters.works.map(w => <option key={w.id} value={w.id}>{formatWorkOption(w)}</option>)}
               <option value="NEW_WORK" style={{fontWeight: 'bold', color: '#C9A227'}}>+ Add New Work</option>
             </select>
          </div>
          <div className="form-group">
             <label>Attribution (Specific)</label>
             <input value={formData.metadata.attribution || ''} onChange={e => updateMeta('attribution', e.target.value)} placeholder="e.g. Attributed to Cleopatra" />
             <div className="hint">Overrides author in ID generation</div>
          </div>
          <div className="form-group">
             <label>Author</label>
             <input value={formData.metadata.author} onChange={e => updateMeta('author', e.target.value)} placeholder={inherited.author ? `Inherited: ${inherited.author}` : "Override inherited author..."} />
          </div>
          <div className="form-group">
             <label>Date</label>
             <input value={formData.metadata.date} onChange={e => updateMeta('date', e.target.value)} placeholder={inherited.date ? `Inherited: ${inherited.date}` : "Override inherited date..."} />
          </div>
          <div className="form-group">
             <label>Language</label>
             <select 
               value={formData.metadata.language} 
               onChange={e => updateMeta('language', e.target.value)}
             >
                <option value="">Select Language...</option>
                {LANGUAGES.map(l => <option key={l} value={l}>{l}</option>)}
                {/* Fallback for preserving existing values not in list */}
                {formData.metadata.language && !LANGUAGES.includes(formData.metadata.language) && (
                   <option value={formData.metadata.language}>{formData.metadata.language}</option>
                )}
             </select>
             {inherited.language && <div className="hint">Inherited: {inherited.language}</div>}
          </div>
           <div className="form-group">
             <label>Place</label>
             <input 
               list="places-list"
               value={formData.metadata.place} 
               onChange={e => updateMeta('place', e.target.value)} 
               placeholder={inherited.place ? `Inherited: ${inherited.place}` : "Select or type new place..."} 
             />
             <datalist id="places-list">
                {existingPlaces.map((p, i) => <option key={i} value={p} />)}
             </datalist>
          </div>
        </div>
      )}

      {activeTab === 'text' && (
        <div>
          <div className="form-group">
            <label>Original Text</label>
            <textarea rows={6} value={formData.text.original} onChange={e => setFormData({...formData, text: {...formData.text, original: e.target.value}})} />
          </div>
          <div className="form-group">
            <label>Translation</label>
            <textarea rows={6} value={formData.text.translation} onChange={e => setFormData({...formData, text: {...formData.text, translation: e.target.value}})} />
          </div>
           <div className="form-group">
            <label>Notes</label>
            <textarea rows={4} value={formData.text.notes} onChange={e => setFormData({...formData, text: {...formData.text, notes: e.target.value}})} />
          </div>
        </div>
      )}

      {activeTab === 'extraction' && (
        <div>
           <div style={{marginBottom: '1rem'}}>
             <button className="btn-outline" style={{marginRight:'0.5rem'}} onClick={() => addItem('ingredient')}>+ Add Ingredient</button>
             <button className="btn-outline" style={{marginRight:'0.5rem'}} onClick={() => addItem('tool')}>+ Add Tool</button>
             <button className="btn-outline" onClick={() => addItem('process')}>+ Add Process</button>
           </div>
           {formData.items.map((item, idx) => (
             <div key={item.id} className="item-row">
                <div>
                  <label style={{fontSize: '0.7rem'}}>Master Record</label>
                  <select 
                    value={item.masterId || ''} 
                    onChange={e => updateItem(item.id, 'masterId', e.target.value)}
                    style={{width: '100%', padding: '0.4rem'}}
                  >
                    <option value="">(Unlinked)</option>
                    {item.type === 'ingredient' && masters.ingredients.map(m => <option key={m.id} value={m.id}>{m.name}</option>)}
                    {item.type === 'tool' && masters.tools.map(m => <option key={m.id} value={m.id}>{m.name}</option>)}
                    {item.type === 'process' && masters.processes.map(m => <option key={m.id} value={m.id}>{m.name}</option>)}
                  </select>
                </div>
                <div>
                   <label style={{fontSize: '0.7rem'}}>Original Term</label>
                   <input value={item.originalTerm} onChange={e => updateItem(item.id, 'originalTerm', e.target.value)} placeholder="e.g. σμύρνα" style={{width: '100%'}} />
                </div>
                 <div>
                   <label style={{fontSize: '0.7rem'}}>Amount (Display)</label>
                   <input value={item.amount} onChange={e => updateItem(item.id, 'amount', e.target.value)} style={{width: '100%'}} />
                   <div style={{marginTop: '0.25rem'}}>
                     {item.quantities && item.quantities.map((q, qIdx) => (
                       <span key={qIdx} className="qty-tag">
                         {q.value} {q.unit}
                       </span>
                     ))}
                   </div>
                </div>
                 <div>
                   <label style={{fontSize: '0.7rem'}}>Role</label>
                   <input value={item.role} onChange={e => updateItem(item.id, 'role', e.target.value)} style={{width: '100%'}} />
                </div>
                <button style={{background:'none', border:'none', cursor:'pointer', color:'#aaa', marginTop: '1.5rem'}} onClick={() => removeItem(item.id)}>✕</button>
             </div>
           ))}
        </div>
      )}

      {activeTab === 'llm' && (
        <div>
          <div style={{background: '#eef', padding: '1rem', borderRadius: '4px', marginBottom: '1rem'}}>
            <h3>1. Generate Prompt</h3>
            <p>This will copy a structured prompt to your clipboard based on the text you entered in the "Text" tab.</p>
            <button className="btn-action" onClick={generatePrompt}>Copy Prompt to Clipboard</button>
          </div>
           <div style={{background: '#efe', padding: '1rem', borderRadius: '4px'}}>
            <h3>2. Apply JSON</h3>
            <p>Paste the JSON response from the LLM here to auto-populate the Extraction tab.</p>
            <textarea 
              rows={6} 
              value={jsonInput} 
              onChange={e => setJsonInput(e.target.value)} 
              placeholder='{ "items": [...] }'
              style={{width: '100%', marginBottom: '1rem', fontFamily: 'monospace'}}
            />
            <button className="btn-action" onClick={applyJson}>Apply JSON</button>
          </div>
        </div>
      )}
    </div>
  );
};

export const AdminConsole = ({ navigate }) => {
  const [db, setDb] = useState<DatabaseState>({ recipes: [], masterIngredients: [], masterTools: [], masterProcesses: [], masterWorks: [], masterPeople: [] });
  const [view, setView] = useState('dashboard'); // dashboard, recipes, ingredients, tools, works, people, editor
  const [editingItem, setEditingItem] = useState(null); // For Master Entity modal
  const [editingRecipe, setEditingRecipe] = useState<Recipe | null>(null);

  useEffect(() => {
    setDb(StorageAdapter.load());
  }, []);

  const saveDb = (newDb: DatabaseState) => {
    setDb(newDb);
    StorageAdapter.save(newDb);
  };
  
  // Calculate unique places for controlled vocabulary (incremental)
  const allPlaces = useMemo(() => {
      const places = new Set<string>();
      db.recipes.forEach(r => { if(r.metadata.place) places.add(r.metadata.place); });
      db.masterWorks.forEach(w => { if(w.place) places.add(w.place); });
      return Array.from(places).sort();
  }, [db.recipes, db.masterWorks]);

  const handleExport = () => StorageAdapter.export();
  const handleImport = async (e) => {
      const file = e.target.files[0];
      if (file) {
          try {
            const data = await StorageAdapter.import(file);
            saveDb(data);
            alert("Database imported successfully!");
          } catch(err) {
              alert("Error importing file");
          }
      }
  };

  // --- CRUD Handlers ---
  const saveRecipe = (recipe: Recipe) => {
    const isNew = !db.recipes.find(r => r.id === recipe.id);
    const newRecipes = isNew 
      ? [...db.recipes, recipe] 
      : db.recipes.map(r => r.id === recipe.id ? recipe : r);
    
    saveDb({ ...db, recipes: newRecipes });
    setView('recipes');
    setEditingRecipe(null);
  };

  const deleteRecipe = (id) => {
    if (confirm("Are you sure?")) {
       saveDb({ ...db, recipes: db.recipes.filter(r => r.id !== id) });
    }
  };

  const saveMaster = (collection: keyof DatabaseState, item: MasterEntity) => {
    const list = db[collection] as MasterEntity[];
    const isNew = !list.find(i => i.id === item.id);
    const newList = isNew ? [...list, item] : list.map(i => i.id === item.id ? item : i);
    saveDb({ ...db, [collection]: newList });
    setEditingItem(null);
  };
  
  const deleteMaster = (collection: keyof DatabaseState, id: string) => {
     if (confirm("Are you sure?")) {
         saveDb({ ...db, [collection]: (db[collection] as MasterEntity[]).filter(i => i.id !== id) });
     }
  };

  // --- Renderers ---
  
  const resolveWorkCitation = (workId: string) => {
    const work = db.masterWorks.find(w => w.id === workId);
    if (!work) return workId;
    
    // Check for Parent (e.g. "De materia medica" is parent of "Wellmann 1907")
    if (work.parentId) {
      const parent = db.masterWorks.find(p => p.id === work.parentId);
      if (parent) {
        // Format: "Dioscorides De materia medica (Wellmann 1907)"
        const author = parent.author || 'Unknown Author';
        return `${author} ${parent.name} (${work.name})`;
      }
    }
    // Fallback or Top Level Work
    return `${work.author || ''} ${work.name}`;
  };

  const renderDashboard = () => (
    <div className="console-card">
      <h2>Welcome to the Scriptorium</h2>
      <p>Select a module from the sidebar to begin editing.</p>
      <div className="form-grid">
         <div style={{background: '#f9f9f9', padding: '1rem', borderRadius: '4px'}}>
            <h3>Recipes</h3>
            <div style={{fontSize: '2rem', fontWeight: 'bold'}}>{db.recipes.length}</div>
         </div>
         <div style={{background: '#f9f9f9', padding: '1rem', borderRadius: '4px'}}>
            <h3>Ingredients</h3>
            <div style={{fontSize: '2rem', fontWeight: 'bold'}}>{db.masterIngredients.length}</div>
         </div>
      </div>
      <div style={{marginTop: '2rem'}}>
         <h3>Data Management</h3>
         <button className="btn-outline" onClick={handleExport} style={{marginRight: '1rem'}}>Export JSON</button>
         <label className="btn-outline" style={{display: 'inline-block', cursor:'pointer'}}>
             Import JSON <input type="file" hidden onChange={handleImport} />
         </label>
      </div>
    </div>
  );

  const renderMasterModal = () => {
     if (!editingItem) return null;
     const { type, data, collection } = editingItem;
     
     const handleNameChange = (newName) => {
       const isClean = !data.slug || data.slug === generateSlug(data.name);
       const newData = { ...data, name: newName };
       if (isClean) {
         newData.slug = generateSlug(newName);
       }
       setEditingItem({ ...editingItem, data: newData });
     };
     
     const handleSave = () => {
         const slug = data.slug || generateSlug(data.name);
         const urn = data.urn || generateURN(type, slug);
         saveMaster(collection, { ...data, slug, urn });
     };
     
     // Handle Work Author Change
     const handleWorkAuthorChange = (e) => {
         const val = e.target.value;
         if (val === 'NEW_PERSON') {
             // We can't easily nest modals here without more complex state.
             // For now, we'll just alert or could switch context, but keeping it simple:
             // Let's assume user must create person first, OR we allow simple string override.
             // Actually, let's implement the shortcut in the dropdown logic below.
         } else {
             const person = db.masterPeople.find(p => p.id === val);
             if (person) {
                 setEditingItem({
                     ...editingItem, 
                     data: { ...data, authorId: person.id, author: person.name } 
                 });
             } else {
                 // Clear link if empty
                 setEditingItem({
                     ...editingItem, 
                     data: { ...data, authorId: '', author: '' } 
                 });
             }
         }
     };

     return (
         <div className="modal-overlay">
             <div className="modal-content">
                 <h3>{data.id ? 'Edit' : 'Create'} {type}</h3>
                 
                 <div className="form-group">
                     <label>Name</label>
                     <input value={data.name} onChange={e => handleNameChange(e.target.value)} />
                     {collection === 'masterWorks' && data.parentId && <div className="hint">Edition/Translation Name (e.g. "Wellmann 1907")</div>}
                 </div>
                 
                 <div className="form-group">
                     <label>Slug (Auto-generated)</label>
                     <input value={data.slug} readOnly style={{background: '#f9f9f9', color: '#666'}} />
                 </div>
                 
                 {collection === 'masterPeople' && (
                    <>
                        <div className="form-group">
                            <label>Role</label>
                            <input 
                                value={data.role || ''} 
                                onChange={e => setEditingItem({...editingItem, data: {...data, role: e.target.value}})}
                                placeholder="e.g. Physician, Perfumer"
                            />
                        </div>
                        <div className="form-group">
                            <label>Period / Date</label>
                            <input 
                                value={data.date || ''} 
                                onChange={e => setEditingItem({...editingItem, data: {...data, date: e.target.value}})}
                                placeholder="e.g. 1st Century CE"
                            />
                        </div>
                         <div className="form-group">
                             <label>Bio / Description</label>
                             <textarea rows={3} value={data.description} onChange={e => setEditingItem({...editingItem, data: {...data, description: e.target.value}})} />
                         </div>
                    </>
                 )}

                 {collection === 'masterWorks' && (
                   <>
                     <div className="form-group">
                        <label>Parent Work (if this is an edition/translation)</label>
                        <select 
                          value={data.parentId || ''} 
                          onChange={e => setEditingItem({...editingItem, data: {...data, parentId: e.target.value}})}
                        >
                          <option value="">No Parent (Top Level Work)</option>
                          {db.masterWorks
                            .filter(w => w.id !== data.id && !w.parentId) // Prevent circular and deep nesting
                            .map(w => <option key={w.id} value={w.id}>{w.name}</option>)
                          }
                        </select>
                     </div>
                     <div className="form-group">
                        <label>Author</label>
                        <div style={{display:'flex', gap: '0.5rem'}}>
                            <select 
                               value={data.authorId || ''} 
                               onChange={handleWorkAuthorChange}
                               disabled={!!data.parentId}
                               style={{flex: 1}}
                            >
                                <option value="">Select Author from People...</option>
                                {db.masterPeople.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
                            </select>
                            {/* Shortcut to create person could be added here if needed, but keeping UI clean */}
                        </div>
                        <input 
                           style={{marginTop: '0.5rem'}}
                           value={data.author || ''} 
                           onChange={e => setEditingItem({...editingItem, data: {...data, author: e.target.value}})} 
                           disabled={!!data.parentId}
                           placeholder={data.parentId ? "(Inherited from Parent)" : "Or type Author Name (Override/Fallback)"}
                        />
                     </div>
                     <div className="form-group">
                        <label>Date</label>
                        <input 
                           value={data.date || ''} 
                           onChange={e => setEditingItem({...editingItem, data: {...data, date: e.target.value}})} 
                           placeholder="e.g. 1st Century CE"
                        />
                     </div>
                     <div className="form-group">
                        <label>Language</label>
                        <select 
                           value={data.language || ''} 
                           onChange={e => setEditingItem({...editingItem, data: {...data, language: e.target.value}})} 
                        >
                            <option value="">Select Language...</option>
                            {LANGUAGES.map(l => <option key={l} value={l}>{l}</option>)}
                            {data.language && !LANGUAGES.includes(data.language) && <option value={data.language}>{data.language}</option>}
                        </select>
                     </div>
                     <div className="form-group">
                        <label>Place</label>
                        <input 
                           list="places-list"
                           value={data.place || ''} 
                           onChange={e => setEditingItem({...editingItem, data: {...data, place: e.target.value}})} 
                           placeholder="e.g. Anatolia"
                        />
                     </div>
                     <div className="form-group">
                        <label>Description</label>
                        <textarea rows={3} value={data.description} onChange={e => setEditingItem({...editingItem, data: {...data, description: e.target.value}})} />
                     </div>
                   </>
                 )}

                 {/* Non-Work/Person specific description (Ingredients/Tools/Processes) */}
                 {collection !== 'masterWorks' && collection !== 'masterPeople' && (
                     <div className="form-group">
                         <label>Description</label>
                         <textarea rows={3} value={data.description} onChange={e => setEditingItem({...editingItem, data: {...data, description: e.target.value}})} />
                     </div>
                 )}

                 <div style={{display: 'flex', justifyContent: 'flex-end', gap: '1rem', marginTop: '1rem'}}>
                     <button className="btn-outline" onClick={() => setEditingItem(null)}>Cancel</button>
                     <button className="btn-action" onClick={handleSave}>Save</button>
                 </div>
             </div>
         </div>
     );
  };
  
  // Shortcut to create new person from Work Editor if needed (can be passed down)
  const createPerson = () => setEditingItem({ type: 'Person', collection: 'masterPeople', data: { id: crypto.randomUUID(), name: '', slug: '', urn: '', description: '', role: '' } });

  return (
    <div className="admin-layout">
      <AdminStyles />
      {renderMasterModal()}
      
      {/* Hidden Datalist for Places (Shared) */}
      <datalist id="places-list">
         {allPlaces.map((p, i) => <option key={i} value={p} />)}
      </datalist>

      <div className="admin-sidebar">
         <div className="admin-brand" onClick={() => navigate('home')}>← Back to Lab</div>
         
         <div className={`admin-nav-item ${view === 'dashboard' ? 'active' : ''}`} onClick={() => setView('dashboard')}>Dashboard</div>
         
         <div className="admin-nav-section">Library</div>
         <div className={`admin-nav-item ${view === 'recipes' ? 'active' : ''}`} onClick={() => setView('recipes')}>Recipes</div>
         <div className={`admin-nav-item ${view === 'works' ? 'active' : ''}`} onClick={() => setView('works')}>Works</div>
         <div className={`admin-nav-item ${view === 'people' ? 'active' : ''}`} onClick={() => setView('people')}>People</div>
         
         <div className="admin-nav-section">Workshop</div>
         <div className={`admin-nav-item ${view === 'ingredients' ? 'active' : ''}`} onClick={() => setView('ingredients')}>Ingredients</div>
         <div className={`admin-nav-item ${view === 'tools' ? 'active' : ''}`} onClick={() => setView('tools')}>Tools</div>
         <div className={`admin-nav-item ${view === 'processes' ? 'active' : ''}`} onClick={() => setView('processes')}>Processes</div>
      </div>

      <div className="admin-content">
        {view === 'dashboard' && renderDashboard()}
        
        {view === 'recipes' && !editingRecipe && (
            <div className="console-card">
              <div className="console-header">
                  <h2>Recipe Archive</h2>
                  <button className="btn-action" onClick={() => { setEditingRecipe(null); setView('editor'); }}>+ New Recipe</button>
              </div>
              <table className="data-table">
                  <thead><tr><th>Title</th><th>Source</th><th>Date</th><th>Actions</th></tr></thead>
                  <tbody>
                      {db.recipes.map(r => (
                          <tr key={r.id}>
                              <td>{r.metadata.title}</td>
                              <td>{resolveWorkCitation(r.metadata.sourceWorkId)}</td>
                              <td>{r.metadata.date}</td>
                              <td>
                                  <button className="text-btn" onClick={() => { setEditingRecipe(r); setView('editor'); }}>Edit</button>
                                  <span style={{margin:'0 0.5rem'}}>|</span>
                                  <button className="text-btn" style={{color:'#dc3545'}} onClick={() => deleteRecipe(r.id)}>Delete</button>
                              </td>
                          </tr>
                      ))}
                  </tbody>
              </table>
            </div>
        )}

        {view === 'editor' && (
            <RecipeEditor 
                recipe={editingRecipe} 
                masters={{ ingredients: db.masterIngredients, tools: db.masterTools, processes: db.masterProcesses, works: db.masterWorks }}
                existingPlaces={allPlaces}
                onSave={saveRecipe}
                onCancel={() => { setEditingRecipe(null); setView('recipes'); }}
                onCreateWork={() => setEditingItem({ type: 'Work', collection: 'masterWorks', data: { id: crypto.randomUUID(), name: '', slug: '', urn: '', description: '' } })}
            />
        )}

        {view === 'ingredients' && (
            <MasterList 
                title="Ingredients" 
                data={db.masterIngredients} 
                onDelete={id => deleteMaster('masterIngredients', id)}
                onEdit={item => setEditingItem({ type: 'Ingredient', collection: 'masterIngredients', data: item })}
                onCreate={() => setEditingItem({ type: 'Ingredient', collection: 'masterIngredients', data: { id: crypto.randomUUID(), name: '', slug: '', urn: '', description: '' } })}
            />
        )}
        
        {view === 'tools' && (
            <MasterList 
                title="Tools" 
                data={db.masterTools} 
                onDelete={id => deleteMaster('masterTools', id)}
                onEdit={item => setEditingItem({ type: 'Tool', collection: 'masterTools', data: item })}
                onCreate={() => setEditingItem({ type: 'Tool', collection: 'masterTools', data: { id: crypto.randomUUID(), name: '', slug: '', urn: '', description: '' } })}
            />
        )}
        
        {view === 'processes' && (
            <MasterList 
                title="Processes" 
                data={db.masterProcesses} 
                onDelete={id => deleteMaster('masterProcesses', id)}
                onEdit={item => setEditingItem({ type: 'Process', collection: 'masterProcesses', data: item })}
                onCreate={() => setEditingItem({ type: 'Process', collection: 'masterProcesses', data: { id: crypto.randomUUID(), name: '', slug: '', urn: '', description: '' } })}
            />
        )}
        
        {view === 'works' && (
            <MasterList 
                title="Works" 
                data={db.masterWorks} 
                onDelete={id => deleteMaster('masterWorks', id)}
                onEdit={item => setEditingItem({ type: 'Work', collection: 'masterWorks', data: item })}
                onCreate={() => {
                    // Pre-fill with existing fields but allow simple override in modal
                    setEditingItem({ type: 'Work', collection: 'masterWorks', data: { id: crypto.randomUUID(), name: '', slug: '', urn: '', description: '' } })
                }}
            />
        )}

        {view === 'people' && (
            <MasterList 
                title="People" 
                data={db.masterPeople} 
                onDelete={id => deleteMaster('masterPeople', id)}
                onEdit={item => setEditingItem({ type: 'Person', collection: 'masterPeople', data: item })}
                onCreate={() => setEditingItem({ type: 'Person', collection: 'masterPeople', data: { id: crypto.randomUUID(), name: '', slug: '', urn: '', description: '', role: '' } })}
            />
        )}

      </div>
      
      <div className="status-bar">
         <span>Local Storage Database Active</span>
         <span>Total Records: {db.recipes.length + db.masterIngredients.length + db.masterTools.length + db.masterProcesses.length + db.masterWorks.length + db.masterPeople.length}</span>
      </div>
    </div>
  );
};
