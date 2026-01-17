import React from "react";
import { Icons } from "../../components/Icons";
import { COMMIPHORA_DATA } from "../../legacy/legacyFixtures";

export const SourceDetailPage = ({ navigate }) => {
  return (
    <div className="page-container">
      <div className="back-link" onClick={() => navigate('sources')}>
        <Icons.ArrowLeft /> Back to Sources
      </div>

      <div className="product-section" style={{paddingBottom: '3rem', borderBottom: '1px solid var(--color-border-strong)'}}>
        <div style={{display: 'flex', gap: '3rem'}}>
           <div style={{flex: 2}}>
              <h1 style={{fontSize: '2.5rem', marginBottom: '0.25rem', marginTop: 0, fontStyle: 'italic', fontFamily: 'var(--font-serif)'}}>{COMMIPHORA_DATA.name}</h1>
              <div style={{fontSize: '1.25rem', color: 'var(--color-stone)', marginBottom: '1.5rem'}}>{COMMIPHORA_DATA.commonName} • {COMMIPHORA_DATA.family}</div>
              <p style={{fontSize: '1.1rem', lineHeight: '1.7'}}>{COMMIPHORA_DATA.description}</p>
              
               <div className="urn" style={{display: 'inline-block', marginTop: '1rem'}}>URN: {COMMIPHORA_DATA.urn}</div>
           </div>
           <div style={{flex: 1}}>
              <div className="product-image-placeholder" style={{background: '#F0F0F0', border: '1px solid #ccc', height: '200px', display: 'flex', alignItems: 'center', justifyContent: 'center', fontFamily: 'var(--font-sans)', color: '#666', marginBottom: '0.5rem'}}>
                 {COMMIPHORA_DATA.image}
              </div>
              <div style={{fontSize: '0.75rem', color: 'var(--color-stone)', fontFamily: 'var(--font-sans)'}}>{COMMIPHORA_DATA.imageCaption}</div>
           </div>
        </div>
      </div>

      <div className="product-section">
         <h2>NATIVE RANGE & ECOLOGY</h2>
         <p>{COMMIPHORA_DATA.nativeRange}</p>
      </div>

      <div className="product-section">
         <h2>PRODUCTS DERIVED</h2>
          <ul style={{listStyle: 'none', padding: 0}}>
           {COMMIPHORA_DATA.products.map((p, i) => (
             <li key={i} style={{marginBottom: '0.5rem', fontSize: '1.1rem'}}>
               <span style={{color: 'var(--color-amber)', marginRight: '0.5rem'}}>•</span>
               {p.route ? (
                 <span style={{cursor: 'pointer', textDecoration: 'underline'}} onClick={() => navigate(p.route)}>{p.name} →</span>
               ) : (
                 <span style={{color: 'var(--color-earth)'}}>{p.name}</span>
               )}
             </li>
           ))}
        </ul>
      </div>

      <div className="product-section" style={{borderBottom: 'none'}}>
         <h2>EXTERNAL RESOURCES</h2>
         <ul style={{listStyle: 'none', padding: 0}}>
           {COMMIPHORA_DATA.externalResources.map((r, i) => (
             <li key={i} style={{marginBottom: '0.5rem', fontSize: '1.1rem'}}>
               <span style={{color: 'var(--color-amber)', marginRight: '0.5rem'}}>•</span>
               <a href={r.url} target="_blank" rel="noopener noreferrer" style={{color: 'var(--color-earth)', textDecoration: 'underline'}}>{r.name} ↗</a>
             </li>
           ))}
        </ul>
      </div>
    </div>
  );
};

