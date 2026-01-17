import React from "react";
import { Icons } from "../../components/Icons";
import { PRODUCT_DATA } from "../../legacy/legacyFixtures";

export const ProductPage = ({ navigate }) => {
  return (
    <div className="page-container">
      <div className="back-link" onClick={() => navigate('ingredients')}>
        <Icons.ArrowLeft /> Back to Ingredients
      </div>

      <div className="product-section" style={{paddingBottom: '3rem', borderBottom: '1px solid var(--color-border-strong)'}}>
        <div style={{display: 'flex', gap: '3rem'}}>
           <div style={{flex: 2}}>
              <h1 style={{fontSize: '2.5rem', marginBottom: '0.25rem', marginTop: 0}}>{PRODUCT_DATA.name}</h1>
              <div style={{fontSize: '1.25rem', color: 'var(--color-stone)', fontStyle: 'italic', marginBottom: '1.5rem'}}>{PRODUCT_DATA.family}</div>
              <p style={{fontSize: '1.1rem', lineHeight: '1.7'}}>{PRODUCT_DATA.description}</p>
              
               <div className="urn" style={{display: 'inline-block', marginTop: '1rem'}}>URN: {PRODUCT_DATA.urn}</div>
           </div>
           <div style={{flex: 1}}>
              <div className="product-image-placeholder" style={{background: '#F0F0F0', border: '1px solid #ccc', height: '200px', display: 'flex', alignItems: 'center', justifyContent: 'center', fontFamily: 'var(--font-sans)', color: '#666', marginBottom: '0.5rem'}}>
                 {PRODUCT_DATA.image}
              </div>
              <div style={{fontSize: '0.75rem', color: 'var(--color-stone)', fontFamily: 'var(--font-sans)'}}>{PRODUCT_DATA.imageCaption}</div>
           </div>
        </div>
      </div>

      <div className="product-section">
         <h2>SENSORY PROFILE</h2>
         <div className="profile-grid">
            <div className="profile-col">
               <h3>PRIMARY NOTES</h3>
               <ul>
                 {PRODUCT_DATA.profile.primary.map((note, i) => <li key={i}>{note}</li>)}
               </ul>
            </div>
            <div className="profile-col">
               <h3>SECONDARY NOTES</h3>
               <ul>
                 {PRODUCT_DATA.profile.secondary.map((note, i) => <li key={i}>{note}</li>)}
               </ul>
            </div>
         </div>
         <div style={{marginTop: '2rem'}}>
            <h3 style={{fontSize: '0.875rem', color: 'var(--color-stone)', marginBottom: '0.5rem'}}>OLFACTORY EVOLUTION</h3>
            <p>{PRODUCT_DATA.profile.evolution}</p>
         </div>
         <div style={{marginTop: '1.5rem'}}>
            <h3 style={{fontSize: '0.875rem', color: 'var(--color-stone)', marginBottom: '0.5rem'}}>COMPARABLE MATERIALS</h3>
            <p>{PRODUCT_DATA.profile.comparable}</p>
         </div>
      </div>

      <div className="product-section">
         <h2>MATERIAL SOURCE</h2>
         <div className="term-row" style={{border: 'none', padding: '0.25rem 0'}}>
             <div style={{fontWeight: 600}}>Botanical Source:</div>
             <div><span className="text-btn" onClick={() => navigate('source_commiphora')}>{PRODUCT_DATA.source.name} →</span></div>
         </div>
         <div className="term-row" style={{border: 'none', padding: '0.25rem 0'}}>
             <div style={{fontWeight: 600}}>Family:</div>
             <div>{PRODUCT_DATA.source.family}</div>
         </div>
         <div className="term-row" style={{border: 'none', padding: '0.25rem 0'}}>
             <div style={{fontWeight: 600}}>Part Used:</div>
             <div>{PRODUCT_DATA.source.part}</div>
         </div>
      </div>

      <div className="product-section">
         <h2>ANCIENT TERMINOLOGY</h2>
         <div className="workshop-grid" style={{gridTemplateColumns: 'repeat(auto-fill, minmax(250px, 1fr))'}}>
            {PRODUCT_DATA.ancientTerms.map((term, i) => (
               <div className="workshop-card" key={i} onClick={() => term.term === 'σμύρνα' ? navigate('ingredient_smyrna') : null}>
                 <div className="card-top">
                   <h3>{term.term}</h3>
                   <span className="lang-tag">{term.language}</span>
                 </div>
                 <div className="def" style={{marginTop: '0.5rem', fontSize: '0.8rem'}}>
                    Confidence: <span className={`confidence-badge ${term.confidence}`} style={{fontSize: '0.65rem'}}>{term.confidence}</span>
                 </div>
               </div>
            ))}
         </div>
      </div>

      <div className="product-section" style={{borderBottom: 'none'}}>
         <h2>MODERN AVAILABILITY</h2>
         <p><strong>{PRODUCT_DATA.availability.status}</strong></p>
         <p>{PRODUCT_DATA.availability.details}</p>
      </div>
    </div>
  );
};

