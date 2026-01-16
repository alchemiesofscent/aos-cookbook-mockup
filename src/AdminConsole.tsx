import React, { useState, useEffect, useMemo } from "react";
import { DatabaseState, MasterEntity, Recipe, RecipeItem, Quantity } from "./types";
import { StorageAdapter, generateSlug, generateURN } from "./storage";
import { VALID_UNITS, FLATTENED_UNITS } from "./units";

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

const EXTERNAL_RESOURCE_TYPES = [
  "Wikipedia",
  "VIAF",
  "WorldCat",
  "Orcid",
  "OpenAlex",
  "Website"
];

const ITEM_ROLES = [
  "base",
  "aromatic",
  "carrier",
  "adjuvant",
  "other"
];

// --- Styles for the Admin Console ---
const AdminStyles = () => (
  <style>{`
    .admin-layout { display: flex; min-height: 100vh; background: #f0f0f0; color: #2D2A26; font-family: 'Noto Sans', sans-serif; }
    .admin-sidebar { width: 250px; background: #2D2A26; color: #FAF7F0; display: flex; flex-direction: column; padding: 1rem; flex-shrink: 0; }
    .admin-content { flex: 1; padding: 2rem; overflow-y: auto; color: #2D2A26; }
    
    .admin-brand { font-family: 'Gentium Plus', serif; font-size: 1.2rem; margin-bottom: 2rem; letter-spacing: 0.05em; color: #C9A227; cursor: pointer; }
    .admin-nav-item { padding: 0.75rem 1rem; cursor: pointer; border-radius: 4px; margin-bottom: 0.25rem; color: #9A9487; }
    .admin-nav-item:hover { background: rgba(255,255,255,0.05); color: white; }
    .admin-nav-item.active { background: #C9A227; color: #2D2A26; font-weight: 600; }
    .admin-nav-section { text-transform: uppercase; font-size: 0.75rem; color: rgba(250,247,240,0.6); margin: 1.5rem 0 0.5rem 0.5rem; letter-spacing: 0.1em; }

    .console-card { background: white; color: #2D2A26; border-radius: 8px; box-shadow: 0 2px 8px rgba(0,0,0,0.05); padding: 2rem; margin-bottom: 2rem; }
    .console-header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 1.5rem; border-bottom: 1px solid #eee; padding-bottom: 1rem; }
    .console-header h2 { margin: 0; font-size: 1.5rem; color: #2D2A26; }

    .form-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 1.5rem; margin-bottom: 1.5rem; }
    .form-group { margin-bottom: 1rem; }
    .form-group label { display: block; font-size: 0.85rem; font-weight: 600; color: #5C4A3D; margin-bottom: 0.4rem; }
    
    /* Global Input Styling for Admin to prevent Dark Mode issues */
    .admin-layout input, .admin-layout textarea, .admin-layout select {
        background-color: #ffffff !important;
        color: #333333 !important;
        border: 1px solid #cccccc;
    }

    .form-group input, .form-group textarea, .form-group select { width: 100%; padding: 0.6rem; border-radius: 4px; font-family: 'Noto Sans', sans-serif; }
    .form-group input:focus, .form-group textarea:focus { border-color: #C9A227; outline: none; }
    .form-group .hint { font-size: 0.75rem; color: #888; margin-top: 0.25rem; }
    
    .tab-nav { display: flex; border-bottom: 1px solid #ddd; margin-bottom: 1.5rem; }
    .tab-btn { padding: 0.75rem 1.5rem; cursor: pointer; border-bottom: 3px solid transparent; font-weight: 500; color: #666; }
    .tab-btn.active { border-bottom-color: #C9A227; color: #2D2A26; }
    
    .data-table { width: 100%; border-collapse: collapse; font-size: 0.9rem; }
    .data-table th { text-align: left; padding: 0.75rem; background: #f9f9f9; border-bottom: 2px solid #eee; color: #555; }
    .data-table td { padding: 0.75rem; border-bottom: 1px solid #eee; color: #2D2A26; }
    .data-table tr:hover { background: #fcfcfc; }
    
    .btn-action { background: #C9A227; color: white; border: none; padding: 0.5rem 1rem; border-radius: 4px; cursor: pointer; font-weight: 500; }
    .btn-action:hover { background: #8B6914; }
    .btn-outline { background: transparent; border: 1px solid #ccc; color: #555; padding: 0.5rem 1rem; border-radius: 4px; cursor: pointer; }
    .btn-danger { background: #dc3545; color: white; border: none; padding: 0.5rem 1rem; border-radius: 4px; cursor: pointer; }
    
    .item-row { background: #f9f9f9; padding: 1rem; border-radius: 6px; margin-bottom: 0.5rem; display: grid; grid-template-columns: 2fr 2fr 1.5fr 1.5fr 1fr auto; gap: 1rem; align-items: start; }
    .item-row input, .item-row select, .item-row textarea { width: 100%; padding: 0.4rem; border-radius: 4px; font-size: 0.9rem; }

    .qty-tag { display: inline-block; background: #e0e0e0; font-size: 0.7rem; padding: 0.1rem 0.4rem; border-radius: 4px; margin-right: 0.3rem; margin-top: 0.2rem; border: 1px solid #ccc; color: #333; }

    .status-bar { position: fixed; bottom: 0; left: 250px; right: 0; background: #2D2A26; color: #9A9487; padding: 0.5rem 2rem; font-size: 0.8rem; display: flex; justify-content: space-between; }
    
    .modal-overlay { position: fixed; top: 0; left: 0; right: 0; bottom: 0; background: rgba(0,0,0,0.5); display: flex; justify-content: center; align-items: center; z-index: 1000; }
    .modal-content { background: white; padding: 2rem; border-radius: 8px; width: 500px; max-width: 90%; max-height: 90vh; overflow-y: auto; }

    /* Mobile: turn sidebar into a top tab bar */
    @media (max-width: 900px) {
      .admin-layout { flex-direction: column; }
      .admin-sidebar {
        width: 100%;
        flex-direction: row;
        align-items: center;
        gap: 0.5rem;
        padding: 0.75rem;
        overflow-x: auto;
        -webkit-overflow-scrolling: touch;
        position: sticky;
        top: 0;
        z-index: 100;
      }
      .admin-content { padding: 1rem; }

      .admin-brand { margin-bottom: 0; font-size: 1rem; white-space: nowrap; }
      .admin-nav-section { display: none; }
      .admin-nav-item { margin-bottom: 0; white-space: nowrap; border: 1px solid rgba(255,255,255,0.08); }
      .admin-nav-item.active { border-color: rgba(0,0,0,0.15); }

      .status-bar { left: 0; padding: 0.6rem 1rem; font-size: 0.75rem; flex-direction: column; align-items: flex-start; gap: 0.25rem; }
      .form-grid { grid-template-columns: 1fr; }
      .item-row { grid-template-columns: 1fr; }
    }
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
            <th>Original</th>
            <th>Transliteration</th>
            <th>Slug</th>
            <th>Actions</th>
          </tr>
        </thead>
        <tbody>
          {filtered.map(item => (
            <tr key={item.id}>
              <td style={{fontWeight: 600}}>{item.name}</td>
              <td style={{fontFamily: 'Gentium Plus, serif'}}>{item.originalName || '-'}</td>
              <td style={{fontStyle: 'italic'}}>{item.transliteratedName || '-'}</td>
              <td>{item.slug}</td>
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

const QuantityEditor = ({ quantities, onChange }: { quantities: Quantity[], onChange: (q: Quantity[]) => void }) => {
  const [val, setVal] = useState<string>('');
  const [unit, setUnit] = useState<string>('g');

  const add = () => {
    const num = parseFloat(val);
    if (!val || isNaN(num)) return;
    onChange([...quantities, { value: num, unit, isEstimate: false }]);
    setVal('');
  };

  const remove = (idx: number) => {
    const next = [...quantities];
    next.splice(idx, 1);
    onChange(next);
  };

  return (
    <div style={{marginTop: '0.5rem', border: '1px solid #eee', padding: '0.5rem', borderRadius: '4px', background: '#fafafa'}}>
      <div style={{display:'flex', flexWrap:'wrap', gap:'0.5rem', marginBottom: quantities.length ? '0.5rem' : '0'}}>
        {quantities.map((q, i) => (
          <span key={i} className="qty-tag" style={{display:'flex', alignItems:'center', gap:'0.3rem', padding: '0.2rem 0.5rem', fontSize:'0.85rem'}}>
            <strong>{q.value}</strong> {q.unit}
            <span onClick={() => remove(i)} style={{cursor:'pointer', color:'#dc3545', marginLeft:'0.2rem', fontWeight:'bold'}}>×</span>
          </span>
        ))}
      </div>
      <div style={{display: 'flex', gap: '0.5rem'}}>
         <input 
           type="number" 
           step="any" 
           value={val} 
           onChange={e => setVal(e.target.value)} 
           placeholder="Qty" 
           style={{width: '80px', padding: '0.3rem', borderRadius: '3px', border:'1px solid #ccc'}}
         />
         <select 
            value={unit} 
            onChange={e => setUnit(e.target.value)}
            style={{padding: '0.3rem', borderRadius: '3px', border:'1px solid #ccc', flex: 1}}
         >
           {Object.entries(VALID_UNITS).map(([cat, units]) => (
             <optgroup key={cat} label={cat}>
               {units.map(u => <option key={u} value={u}>{u}</option>)}
             </optgroup>
           ))}
         </select>
         <button 
           className="btn-action" 
           onClick={add}
           disabled={!val}
           style={{padding: '0.3rem 0.8rem', fontSize:'0.9rem'}}
         >
           +
         </button>
      </div>
    </div>
  );
};

const RecipeEditor = ({ recipe, masters, onSave, onCancel, onCreateWork, onCreateMaster, onBatchCreateMasters, existingPlaces }) => {
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
  const [autoCreateMasters, setAutoCreateMasters] = useState(true);

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
        transliteration: '',
        displayTerm: '',
        amount: '',
        originalAmount: '',
        quantities: [],
        role: 'base'
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
    const prompt = `You are a specialized extraction assistant for the Alchemies of Scent project. Your task is to extract structured data from ancient Greek recipe texts.

Input:
1. The original recipe text in Greek
2. A scholarly English translation

Output:
Return a single JSON object with three keys: "ingredients", "tools", and "processes".

CORE PRINCIPLES:
- Philological Precision: Normalize Greek terms.
- No Inference: Do not guess quantities not explicit in text.
- Use controlled vocabulary for roles.

METROLOGY & UNITS:
1. Extract the quantity phrase into "quantity_raw". IMPORTANT: Normalize the measurement unit to the Nominative Singular (main term). Do not use the accusative case found in the text. (e.g., write "λίτρα πέντε" instead of "λίτρας πέντε").
2. Translate to short-form English units in "quantity_translation" (e.g., use 'lb' for litra/mna, 'oz' for ouggia, 'pt' for xestes). 
   Example: "5 lbs", "4 oz".
3. QUANTITY ARRAY:
   Populate "quantities" with numeric value and unit.
   ALLOWED UNITS: ${FLATTENED_UNITS.join(', ')}.
   Example: { "value": 5, "unit": "litra" }

MODERN IDENTIFICATION:
- For ingredients, tools, and processes, provide a "modern_name" (e.g., "Myrrh", "Mortar", "Boiling") to help link to our master database.

ROLES:
- For ingredients, choose one: 'base', 'aromatic', 'carrier', 'adjuvant', 'other'.

JSON SCHEMA:
{
  "ingredients": [
    {
      "ancient_term": "Greek term (Nominative Singular)",
      "transliteration": "Latin script",
      "modern_name": "English name of ingredient (e.g. Myrrh)",
      "quantity_raw": "Greek quantity phrase (Normalized to Nominative Singular unit)",
      "quantity_translation": "Short form English (e.g. 5 lbs)",
      "quantities": [ { "value": number, "unit": "string" } ],
      "role": "base|aromatic|carrier|adjuvant|other"
    }
  ],
  "tools": [
    {
      "ancient_term": "Greek term",
      "transliteration": "Latin script",
      "modern_name": "English translation"
    }
  ],
  "processes": [
    {
      "ancient_term": "Greek verb (Infinitive)",
      "transliteration": "Latin script",
      "modern_name": "English translation",
      "sequence_order": number
    }
  ]
}

TEXT TO ANALYZE:
Greek:
${formData.text.original}

Translation:
${formData.text.translation}
    `;
    navigator.clipboard.writeText(prompt);
    alert("Structured Prompt copied to clipboard!");
  };

  const applyJson = () => {
    try {
      let cleanJson = jsonInput.trim();
      if (cleanJson.startsWith('```')) {
          cleanJson = cleanJson.replace(/^```(json)?/, '').replace(/```$/, '');
      }
      cleanJson = cleanJson.trim();
      
      const parsed = JSON.parse(cleanJson);
      const newItems: RecipeItem[] = [];

      // Temporary storage for new masters created during this import
      const newMastersBuffer = {
          ingredients: [] as MasterEntity[],
          tools: [] as MasterEntity[],
          processes: [] as MasterEntity[]
      };

      // Helper to find master link or create new one
      const resolveMasterId = (type: 'ingredient' | 'tool' | 'process', term: string, original?: string, translit?: string): string | null => {
          if (!term) return null;
          const search = term.toLowerCase().trim();
          
          let existingList: MasterEntity[] = [];
          let newBufferList: MasterEntity[] = [];

          if (type === 'ingredient') {
              existingList = masters.ingredients;
              newBufferList = newMastersBuffer.ingredients;
          } else if (type === 'tool') {
              existingList = masters.tools;
              newBufferList = newMastersBuffer.tools;
          } else if (type === 'process') {
              existingList = masters.processes;
              newBufferList = newMastersBuffer.processes;
          }
          
          // 1. Check existing DB
          const found = existingList.find(m => m.name.toLowerCase() === search || m.slug === search);
          if (found) return found.id;

          // 2. Check locally created buffer (duplicates within the same JSON)
          const foundInBuffer = newBufferList.find(m => m.name.toLowerCase() === search || m.slug === search);
          if (foundInBuffer) return foundInBuffer.id;

          // 3. Auto-create if enabled
          if (autoCreateMasters) {
              // Prefer transliteration for slug if available, else name
              const slugBase = translit || term;
              const slug = generateSlug(slugBase);
              
              const newEntity: MasterEntity = {
                  id: crypto.randomUUID(),
                  name: term, // Use the proper casing from the term
                  originalName: original,
                  transliteratedName: translit,
                  slug: slug,
                  urn: generateURN(type, slug),
                  description: 'Imported from recipe extraction.'
              };
              
              if (type === 'ingredient') newMastersBuffer.ingredients.push(newEntity);
              else if (type === 'tool') newMastersBuffer.tools.push(newEntity);
              else if (type === 'process') newMastersBuffer.processes.push(newEntity);
              
              return newEntity.id;
          }

          return null;
      };

      // Process Ingredients
      if (parsed.ingredients && Array.isArray(parsed.ingredients)) {
        parsed.ingredients.forEach((i: any) => {
          const modernName = i.modern_name || '';
          newItems.push({
            id: crypto.randomUUID(),
            masterId: resolveMasterId('ingredient', modernName, i.ancient_term, i.transliteration),
            type: 'ingredient',
            originalTerm: i.ancient_term || '',
            transliteration: i.transliteration || '',
            displayTerm: modernName, 
            originalAmount: i.quantity_raw || '',
            amount: i.quantity_translation || '',
            quantities: i.quantities || [],
            role: i.role || 'other',
            annotation: ''
          });
        });
      }

      // Process Tools
      if (parsed.tools && Array.isArray(parsed.tools)) {
        parsed.tools.forEach((t: any) => {
          const modernName = t.modern_name || '';
          newItems.push({
            id: crypto.randomUUID(),
            masterId: resolveMasterId('tool', modernName, t.ancient_term, t.transliteration),
            type: 'tool',
            originalTerm: t.ancient_term || '',
            transliteration: t.transliteration || '',
            displayTerm: modernName,
            amount: '',
            originalAmount: '',
            quantities: [],
            role: '',
            annotation: ''
          });
        });
      }

      // Process Processes
      if (parsed.processes && Array.isArray(parsed.processes)) {
        parsed.processes.forEach((p: any) => {
          const modernName = p.modern_name || '';
          newItems.push({
            id: crypto.randomUUID(),
            masterId: resolveMasterId('process', modernName, p.ancient_term, p.transliteration),
            type: 'process',
            originalTerm: p.ancient_term || '',
            transliteration: p.transliteration || '',
            displayTerm: modernName,
            amount: '',
            originalAmount: '',
            quantities: [],
            role: '',
            annotation: '',
            sequenceOrder: p.sequence_order
          });
        });
      }

      if (newItems.length > 0) {
        // Save newly created masters to parent state
        if (onBatchCreateMasters && (newMastersBuffer.ingredients.length > 0 || newMastersBuffer.tools.length > 0 || newMastersBuffer.processes.length > 0)) {
            onBatchCreateMasters(newMastersBuffer);
        }

        setFormData(prev => ({ ...prev, items: [...prev.items, ...newItems] }));
        setJsonInput('');
        
        const totalNewMasters = newMastersBuffer.ingredients.length + newMastersBuffer.tools.length + newMastersBuffer.processes.length;
        alert(`Imported ${newItems.length} items.\nCreated ${totalNewMasters} new Master Records.`);
      } else {
        alert("No items found in JSON.");
      }
    } catch (e) {
      console.error(e);
      alert("Invalid JSON format.");
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
             <input value={formData.slug} onChange={e => setFormData({...formData, slug: e.target.value})} style={{background: '#f9f9f9', color: '#555'}} />
          </div>
          <div className="form-group">
             <label>URN</label>
             <input value={formData.urn} readOnly style={{background: '#f9f9f9', color: '#555'}} />
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
           
           {/* Header for Items */}
           {formData.items.length > 0 && (
               <div style={{display: 'grid', gridTemplateColumns: '2fr 2fr 1.5fr 1.5fr 1fr auto', gap: '1rem', padding: '0.5rem 1rem', fontSize: '0.75rem', fontWeight: 'bold', color: '#666'}}>
                  <div>MASTER LINK</div>
                  <div>TERM / TRANSLIT</div>
                  <div>ORIGINAL (Weight)</div>
                  <div>MODERN (Weight/Name)</div>
                  <div>ROLE</div>
                  <div></div>
               </div>
           )}

           {formData.items.map((item, idx) => (
             <div key={item.id} className="item-row">
                {/* 1. Master Link */}
                <div>
                  <select 
                    value={item.masterId || ''} 
                    onChange={e => {
                        if (e.target.value === 'CREATE_NEW') {
                            onCreateMaster(item.type, { name: item.displayTerm || item.originalTerm, originalName: item.originalTerm, transliteratedName: item.transliteration }, (newId) => {
                                updateItem(item.id, 'masterId', newId);
                            });
                        } else {
                            updateItem(item.id, 'masterId', e.target.value);
                        }
                    }}
                    style={{
                        borderColor: item.masterId ? '#28a745' : '#ccc',
                        backgroundColor: item.masterId ? '#f0fff4' : 'white'
                    }}
                  >
                    <option value="">(Unlinked)</option>
                    <option value="CREATE_NEW" style={{fontWeight: 'bold', color: '#C9A227'}}>+ Create New {item.type}</option>
                    <optgroup label="Existing Records">
                        {item.type === 'ingredient' && masters.ingredients.map(m => <option key={m.id} value={m.id}>{m.name}</option>)}
                        {item.type === 'tool' && masters.tools.map(m => <option key={m.id} value={m.id}>{m.name}</option>)}
                        {item.type === 'process' && masters.processes.map(m => <option key={m.id} value={m.id}>{m.name}</option>)}
                    </optgroup>
                  </select>
                  <div style={{fontSize: '0.7rem', color: '#999', marginTop: '0.2rem', textTransform: 'uppercase'}}>{item.type}</div>
                </div>

                {/* 2. Ancient Term */}
                <div>
                   <input value={item.originalTerm} onChange={e => updateItem(item.id, 'originalTerm', e.target.value)} placeholder="Ancient Term" />
                   <input 
                       value={item.transliteration || ''} 
                       onChange={e => updateItem(item.id, 'transliteration', e.target.value)} 
                       placeholder="Transliteration" 
                       style={{marginTop: '0.3rem', fontStyle: 'italic'}}
                   />
                </div>
                
                {/* 3. Original Amount / Weight */}
                <div>
                   {item.type === 'ingredient' ? (
                       <input value={item.originalAmount || ''} onChange={e => updateItem(item.id, 'originalAmount', e.target.value)} placeholder="Original amount..." />
                   ) : (
                       <span style={{fontSize: '0.8rem', color: '#ccc'}}>—</span>
                   )}
                </div>

                {/* 4. Modern Amount / Display Name */}
                <div>
                   {item.type === 'ingredient' ? (
                       <input value={item.amount} onChange={e => updateItem(item.id, 'amount', e.target.value)} placeholder="e.g. 5 lbs" />
                   ) : (
                       <input value={item.displayTerm} onChange={e => updateItem(item.id, 'displayTerm', e.target.value)} placeholder="Modern Name" />
                   )}
                   
                   {/* Normalized Quantities Editor */}
                   <QuantityEditor 
                      quantities={item.quantities || []} 
                      onChange={(newQuantities) => updateItem(item.id, 'quantities', newQuantities)} 
                   />
                </div>

                 {/* 5. Role */}
                 <div>
                   {item.type === 'ingredient' ? (
                       <select value={item.role} onChange={e => updateItem(item.id, 'role', e.target.value)}>
                           {ITEM_ROLES.map(r => <option key={r} value={r}>{r}</option>)}
                       </select>
                   ) : (
                       <input value={item.role} onChange={e => updateItem(item.id, 'role', e.target.value)} placeholder="Role" />
                   )}
                </div>

                <button style={{background:'none', border:'none', cursor:'pointer', color:'#aaa', marginTop: '0.5rem'}} onClick={() => removeItem(item.id)}>✕</button>
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
            <div style={{marginBottom: '0.5rem'}}>
                <label style={{cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '0.5rem', fontWeight: 600}}>
                    <input type="checkbox" checked={autoCreateMasters} onChange={e => setAutoCreateMasters(e.target.checked)} />
                    Auto-create missing Master Records (Ingredients, Tools, Processes)
                </label>
            </div>
            <textarea 
              rows={6} 
              value={jsonInput} 
              onChange={e => setJsonInput(e.target.value)} 
              placeholder='{ "ingredients": [...], "tools": [...], "processes": [...] }'
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
  const [db, setDb] = useState<DatabaseState>({
    recipes: [],
    masterIngredients: [],
    masterTools: [],
    masterProcesses: [],
    masterWorks: [],
    masterPeople: [],
    ancientIngredients: [],
    ingredientProducts: [],
    materialSources: [],
    identifications: [],
  });
  const [view, setView] = useState('dashboard'); // dashboard, recipes, ingredients, tools, works, people, editor
  const [editingItem, setEditingItem] = useState<{type: string, collection: keyof DatabaseState, data: MasterEntity, callback?: (id:string)=>void} | null>(null); 
  const [pendingParent, setPendingParent] = useState<{ collection: keyof DatabaseState, data: MasterEntity } | null>(null);
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
      db.masterPeople.forEach(p => { if(p.place) places.add(p.place); });
      return Array.from(places).sort();
  }, [db.recipes, db.masterWorks, db.masterPeople]);

  // Calculate unique roles for controlled vocabulary (incremental)
  const allRoles = useMemo(() => {
      const roles = new Set<string>();
      db.masterPeople.forEach(p => { if(p.role) roles.add(p.role); });
      return Array.from(roles).sort();
  }, [db.masterPeople]);

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
  const saveRecipe = (recipeData: Recipe) => {
    // Clone state to modify for potential auto-creation of masters
    const nextDb = { ...db };
    const nextRecipe = { ...recipeData };
    
    // Auto-harvest missing master records from recipe items
    nextRecipe.items = nextRecipe.items.map(item => {
        // If already linked, do nothing
        if (item.masterId) return item;
        
        // If no name to link, do nothing
        const name = item.displayTerm || item.originalTerm;
        if (!name) return item;
        
        // Slug generation preference: Transliteration > Name
        const slugBase = item.transliteration || name;
        const slug = generateSlug(slugBase);
        
        // Determine collection
        let collectionKey: keyof DatabaseState = 'masterIngredients';
        let urnType = 'ingredient';
        
        if (item.type === 'tool') {
            collectionKey = 'masterTools';
            urnType = 'tool';
        } else if (item.type === 'process') {
            collectionKey = 'masterProcesses';
            urnType = 'process';
        }

        const list = nextDb[collectionKey] as MasterEntity[];
        
        // Try to find existing
        let master = list.find(m => m.slug === slug || m.name.toLowerCase() === name.toLowerCase());
        
        if (!master) {
            // Create new
            master = {
                id: crypto.randomUUID(),
                name: name,
                originalName: item.originalTerm,
                transliteratedName: item.transliteration,
                slug: slug,
                urn: generateURN(urnType, slug),
                description: 'Auto-generated from recipe.'
            };
            // Append to DB state immediately so subsequent items in this loop can find it
            (nextDb[collectionKey] as MasterEntity[]).push(master);
        }
        
        // Link item
        return { ...item, masterId: master.id };
    });

    // Save Updated Recipe
    const isNew = !nextDb.recipes.find(r => r.id === nextRecipe.id);
    if (isNew) {
      nextDb.recipes = [...nextDb.recipes, nextRecipe];
    } else {
      nextDb.recipes = nextDb.recipes.map(r => r.id === nextRecipe.id ? nextRecipe : r);
    }
    
    saveDb(nextDb);
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
    const newDb = { ...db, [collection]: newList };
    
    saveDb(newDb);
    
    // Logic to handle returning to parent modal (Work) after creating child (Person/Author)
    if (pendingParent && collection === 'masterPeople') {
        const updatedParent = {
            ...pendingParent.data,
            authorId: item.id,
            author: item.name
        };
        setEditingItem({
            type: 'Work',
            collection: pendingParent.collection,
            data: updatedParent
        });
        setPendingParent(null);
    } 
    // Handle inline creation callback
    else if (editingItem && editingItem.callback) {
        editingItem.callback(item.id);
        setEditingItem(null);
    }
    else {
        setEditingItem(null);
    }
  };

  const handleBatchUpdateMasters = (newMasters: { ingredients: MasterEntity[], tools: MasterEntity[], processes: MasterEntity[] }) => {
      const newDb = { ...db };
      
      if (newMasters.ingredients.length > 0) {
          newDb.masterIngredients = [...newDb.masterIngredients, ...newMasters.ingredients];
      }
      if (newMasters.tools.length > 0) {
          newDb.masterTools = [...newDb.masterTools, ...newMasters.tools];
      }
      if (newMasters.processes.length > 0) {
          newDb.masterProcesses = [...newDb.masterProcesses, ...newMasters.processes];
      }
      
      saveDb(newDb);
  };
  
  const deleteMaster = (collection: keyof DatabaseState, id: string) => {
     if (confirm("Are you sure?")) {
         saveDb({ ...db, [collection]: (db[collection] as MasterEntity[]).filter(i => i.id !== id) });
     }
  };

  const handleCreateMaster = (type: string, initialData: Partial<MasterEntity>, callback?: (id: string) => void) => {
      // Map simplified type 'ingredient' to collection 'masterIngredients' etc
      let collection: keyof DatabaseState = 'masterIngredients';
      let uiType = 'Ingredient';
      
      if (type === 'ingredient') { collection = 'masterIngredients'; uiType = 'Ingredient'; }
      if (type === 'tool') { collection = 'masterTools'; uiType = 'Tool'; }
      if (type === 'process') { collection = 'masterProcesses'; uiType = 'Process'; }
      
      setEditingItem({
          type: uiType,
          collection: collection,
          data: { id: crypto.randomUUID(), name: '', slug: '', urn: '', description: '', ...initialData } as MasterEntity,
          callback
      });
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
       const isClean = !data.slug || data.slug === generateSlug(data.transliteratedName || data.name);
       const newData = { ...data, name: newName };
       if (isClean && !data.transliteratedName) {
         newData.slug = generateSlug(newName);
       }
       setEditingItem({ ...editingItem, data: newData });
     };

     const handleTranslitChange = (newTranslit) => {
        const newData = { ...data, transliteratedName: newTranslit };
        // If transliteration exists, it drives the slug
        if (newTranslit) {
            newData.slug = generateSlug(newTranslit);
        } else if (data.name) {
            newData.slug = generateSlug(data.name);
        }
        setEditingItem({ ...editingItem, data: newData });
     };
     
     const handleSave = () => {
         const slugBase = data.transliteratedName || data.name;
         const slug = data.slug || generateSlug(slugBase);
         const urn = data.urn || generateURN(type, slug);
         saveMaster(collection, { ...data, slug, urn });
     };
     
     // Handle Work Author Change
     const handleWorkAuthorChange = (e) => {
         const val = e.target.value;
         if (val === 'NEW_PERSON') {
             // Save current work state as pending, switch to Person creation
             setPendingParent({ collection: 'masterWorks', data: data });
             setEditingItem({ type: 'Person', collection: 'masterPeople', data: { id: crypto.randomUUID(), name: '', slug: '', urn: '', description: '', role: '' } });
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
                     <label>Modern Name</label>
                     <input value={data.name} onChange={e => handleNameChange(e.target.value)} placeholder="e.g. Myrrh" />
                     {collection === 'masterWorks' && data.parentId && <div className="hint">Edition/Translation Name (e.g. "Wellmann 1907")</div>}
                 </div>

                 {/* Fields for Ingredients, Tools, Processes */}
                 {(collection === 'masterIngredients' || collection === 'masterTools' || collection === 'masterProcesses') && (
                     <div className="form-grid" style={{marginBottom: '1rem'}}>
                        <div className="form-group">
                            <label>Ancient Name (Greek)</label>
                            <input value={data.originalName || ''} onChange={e => setEditingItem({...editingItem, data: {...data, originalName: e.target.value}})} placeholder="e.g. σμύρνα" />
                        </div>
                        <div className="form-group">
                            <label>Transliteration</label>
                            <input value={data.transliteratedName || ''} onChange={e => handleTranslitChange(e.target.value)} placeholder="e.g. smyrna" />
                            <div className="hint">Generates the Slug/URN</div>
                        </div>
                     </div>
                 )}
                 
                 <div className="form-group">
                     <label>Slug (Auto-generated)</label>
                     <input value={data.slug} readOnly style={{background: '#f9f9f9', color: '#666'}} />
                 </div>
                 
                 {collection === 'masterPeople' && (
                    <>
                        <div className="form-group">
                            <label>Role</label>
                            <input 
                                list="roles-list"
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
                            <label>Active In (Place)</label>
                            <input 
                               list="places-list"
                               value={data.place || ''} 
                               onChange={e => setEditingItem({...editingItem, data: {...data, place: e.target.value}})} 
                               placeholder="e.g. Anatolia"
                            />
                        </div>
                         <div className="form-group">
                             <label>Bio / Description</label>
                             <textarea rows={3} value={data.description} onChange={e => setEditingItem({...editingItem, data: {...data, description: e.target.value}})} />
                         </div>

                         <div className="form-group">
                             <label>External Resources</label>
                             <div style={{background: '#f9f9f9', padding: '0.5rem', borderRadius: '4px'}}>
                                 {(data.externalLinks || []).map((link, idx) => (
                                     <div key={idx} style={{display: 'flex', gap: '0.5rem', marginBottom: '0.5rem'}}>
                                         <select 
                                             value={link.label}
                                             onChange={e => {
                                                 const newLinks = [...(data.externalLinks || [])];
                                                 newLinks[idx].label = e.target.value;
                                                 setEditingItem({...editingItem, data: {...data, externalLinks: newLinks}});
                                             }}
                                             style={{width: '120px'}}
                                         >
                                            {EXTERNAL_RESOURCE_TYPES.map(t => <option key={t} value={t}>{t}</option>)}
                                            {!EXTERNAL_RESOURCE_TYPES.includes(link.label) && <option value={link.label}>{link.label}</option>}
                                         </select>
                                         <input 
                                             value={link.url}
                                             onChange={e => {
                                                 const newLinks = [...(data.externalLinks || [])];
                                                 newLinks[idx].url = e.target.value;
                                                 setEditingItem({...editingItem, data: {...data, externalLinks: newLinks}});
                                             }}
                                             placeholder="https://..."
                                             style={{flex: 1}}
                                         />
                                         <button className="btn-danger" onClick={() => {
                                             const newLinks = data.externalLinks.filter((_, i) => i !== idx);
                                             setEditingItem({...editingItem, data: {...data, externalLinks: newLinks}});
                                         }}>×</button>
                                     </div>
                                 ))}
                                 <button className="btn-outline" style={{fontSize: '0.8rem'}} onClick={() => {
                                     const newLinks = [...(data.externalLinks || []), { label: 'Wikipedia', url: '' }];
                                     setEditingItem({...editingItem, data: {...data, externalLinks: newLinks}});
                                 }}>+ Add Resource</button>
                             </div>
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
                        <div style={{display:'flex', gap: '0.5rem', flexDirection: 'column'}}>
                            <select 
                               value={data.authorId || ''} 
                               onChange={handleWorkAuthorChange}
                            >
                                <option value="">Select Author from People...</option>
                                {db.masterPeople.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
                                <option value="NEW_PERSON" style={{fontWeight: 'bold', color: '#C9A227'}}>+ Add New Author</option>
                            </select>
                            
                            <input 
                               value={data.author || ''} 
                               onChange={e => setEditingItem({...editingItem, data: {...data, author: e.target.value}})} 
                               placeholder="Or type Author Name (Override/Fallback)"
                            />
                        </div>
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
                     <button className="btn-outline" onClick={() => { setEditingItem(null); setPendingParent(null); }}>Cancel</button>
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

      {/* Hidden Datalist for Roles (Shared) */}
      <datalist id="roles-list">
         {allRoles.map((r, i) => <option key={i} value={r} />)}
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
                onCreateMaster={handleCreateMaster}
                onBatchCreateMasters={handleBatchUpdateMasters}
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
