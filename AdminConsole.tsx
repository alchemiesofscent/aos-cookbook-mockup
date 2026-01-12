import React, { useState, useEffect, useMemo } from "react";
import { DatabaseState, MasterEntity, Recipe, RecipeItem } from "./types";
import { StorageAdapter, generateSlug, generateURN } from "./storage";

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
    
    .item-row { background: #f9f9f9; padding: 1rem; border-radius: 6px; margin-bottom: 0.5rem; display: grid; grid-template-columns: 2fr 2fr 1fr 1fr auto; gap: 1rem; align-items: center; }
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

const RecipeEditor = ({ recipe, masters, onSave, onCancel }) => {
  const [formData, setFormData] = useState<Recipe>(recipe || {
    id: crypto.randomUUID(),
    slug: '',
    urn: '',
    metadata: { title: '', sourceWorkId: '', author: '', language: 'Greek', date: '' },
    text: { original: '', translation: '', notes: '' },
    items: []
  });

  const [activeTab, setActiveTab] = useState('meta');
  const [jsonInput, setJsonInput] = useState('');

  // Auto-generate slug/urn if title changes and slug is empty
  useEffect(() => {
    if (recipe) return; // Don't auto-update on edit existing
    if (formData.metadata.title && !formData.slug) {
      const slug = generateSlug(formData.metadata.title);
      setFormData(prev => ({
        ...prev,
        slug,
        urn: generateURN('recipe', slug)
      }));
    }
  }, [formData.metadata.title]);

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
    const prompt = `Analyze the following ancient recipe text. Extract ingredients, tools, and processes into a JSON structure. 
    Output format: { "items": [ { "type": "ingredient|tool|process", "originalTerm": "string", "displayTerm": "string", "amount": "string", "role": "string" } ] }.
    
    TEXT:
    ${formData.text.translation || formData.text.original}
    `;
    navigator.clipboard.writeText(prompt);
    alert("Prompt copied to clipboard!");
  };

  const applyJson = () => {
    try {
      const parsed = JSON.parse(jsonInput);
      if (parsed.items && Array.isArray(parsed.items)) {
        const newItems = parsed.items.map(i => ({
           id: crypto.randomUUID(),
           masterId: null, // Logic to auto-match could go here
           ...i
        }));
        setFormData(prev => ({ ...prev, items: [...prev.items, ...newItems] }));
        setJsonInput('');
        alert(`Imported ${newItems.length} items.`);
      }
    } catch (e) {
      alert("Invalid JSON");
    }
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
             <label>Slug (ID)</label>
             <input value={formData.slug} onChange={e => setFormData({...formData, slug: e.target.value})} />
          </div>
          <div className="form-group">
             <label>URN</label>
             <input value={formData.urn} readOnly style={{background: '#f9f9f9'}} />
          </div>
          <div className="form-group">
             <label>Source Work</label>
             <select value={formData.metadata.sourceWorkId} onChange={e => updateMeta('sourceWorkId', e.target.value)}>
               <option value="">Select Work...</option>
               {masters.works.map(w => <option key={w.id} value={w.id}>{w.name}</option>)}
             </select>
          </div>
          <div className="form-group">
             <label>Author</label>
             <input value={formData.metadata.author} onChange={e => updateMeta('author', e.target.value)} />
          </div>
          <div className="form-group">
             <label>Date</label>
             <input value={formData.metadata.date} onChange={e => updateMeta('date', e.target.value)} />
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
                   <label style={{fontSize: '0.7rem'}}>Amount</label>
                   <input value={item.amount} onChange={e => updateItem(item.id, 'amount', e.target.value)} style={{width: '100%'}} />
                </div>
                 <div>
                   <label style={{fontSize: '0.7rem'}}>Role</label>
                   <input value={item.role} onChange={e => updateItem(item.id, 'role', e.target.value)} style={{width: '100%'}} />
                </div>
                <button style={{background:'none', border:'none', cursor:'pointer', color:'#aaa'}} onClick={() => removeItem(item.id)}>✕</button>
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
  const [db, setDb] = useState<DatabaseState>({ recipes: [], masterIngredients: [], masterTools: [], masterProcesses: [], masterWorks: [] });
  const [view, setView] = useState('dashboard'); // dashboard, recipes, ingredients, tools, works, editor
  const [editingItem, setEditingItem] = useState(null); // For Master Entity modal
  const [editingRecipe, setEditingRecipe] = useState<Recipe | null>(null);

  useEffect(() => {
    setDb(StorageAdapter.load());
  }, []);

  const saveDb = (newDb: DatabaseState) => {
    setDb(newDb);
    StorageAdapter.save(newDb);
  };

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
     
     const handleSave = () => {
         // Auto-generate slug
         const slug = data.slug || generateSlug(data.name);
         const urn = data.urn || generateURN(type, slug);
         saveMaster(collection, { ...data, slug, urn });
     };

     return (
         <div className="modal-overlay">
             <div className="modal-content">
                 <h3>{data.id ? 'Edit' : 'Create'} {type}</h3>
                 <div className="form-group">
                     <label>Name</label>
                     <input value={data.name} onChange={e => setEditingItem({...editingItem, data: {...data, name: e.target.value}})} />
                 </div>
                 <div className="form-group">
                     <label>Description</label>
                     <textarea rows={3} value={data.description} onChange={e => setEditingItem({...editingItem, data: {...data, description: e.target.value}})} />
                 </div>
                 <div style={{display: 'flex', justifyContent: 'flex-end', gap: '1rem', marginTop: '1rem'}}>
                     <button className="btn-outline" onClick={() => setEditingItem(null)}>Cancel</button>
                     <button className="btn-action" onClick={handleSave}>Save</button>
                 </div>
             </div>
         </div>
     );
  };

  return (
    <div className="admin-layout">
      <AdminStyles />
      {renderMasterModal()}
      
      <div className="admin-sidebar">
         <div className="admin-brand" onClick={() => navigate('home')}>← Back to Lab</div>
         
         <div className={`admin-nav-item ${view === 'dashboard' ? 'active' : ''}`} onClick={() => setView('dashboard')}>Dashboard</div>
         
         <div className="admin-nav-section">Library</div>
         <div className={`admin-nav-item ${view === 'recipes' ? 'active' : ''}`} onClick={() => setView('recipes')}>Recipes</div>
         <div className={`admin-nav-item ${view === 'works' ? 'active' : ''}`} onClick={() => setView('works')}>Works</div>
         
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
                              <td>{db.masterWorks.find(w => w.id === r.metadata.sourceWorkId)?.name || r.metadata.sourceWorkId}</td>
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
                onSave={saveRecipe}
                onCancel={() => { setEditingRecipe(null); setView('recipes'); }}
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
                onCreate={() => setEditingItem({ type: 'Work', collection: 'masterWorks', data: { id: crypto.randomUUID(), name: '', slug: '', urn: '', description: '' } })}
            />
        )}

      </div>
      
      <div className="status-bar">
         <span>Local Storage Database Active</span>
         <span>Total Records: {db.recipes.length + db.masterIngredients.length + db.masterTools.length + db.masterProcesses.length}</span>
      </div>
    </div>
  );
};