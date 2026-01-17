import React from "react";
import { Icons } from "../../components/Icons";
import { IDENTIFICATION_DATA } from "../../legacy/legacyFixtures";

export const IdentificationPage = ({ navigate }) => {
  return (
    <div className="page-container">
      <div className="back-link" onClick={() => navigate(IDENTIFICATION_DATA.ancientTerm.route)}>
        <Icons.ArrowLeft /> Back to {IDENTIFICATION_DATA.ancientTerm.name.split(' ')[0]}
      </div>

      <div className="product-section" style={{paddingBottom: '2rem'}}>
        <h1 style={{textTransform: 'uppercase', fontSize: '2rem'}}>IDENTIFICATION</h1>
        <div style={{fontSize: '1.25rem', marginBottom: '1.5rem'}}>
           {IDENTIFICATION_DATA.ancientTerm.name.split(' ')[0]} <span style={{color: 'var(--color-stone)'}}>→</span> {IDENTIFICATION_DATA.identifiedAs.name}
        </div>
        <div className="urn">URN: {IDENTIFICATION_DATA.urn}</div>
      </div>

      <div className="product-section">
        <h2>THE CLAIM</h2>
        <div className="term-row" style={{border: 'none', padding: '0.25rem 0'}}>
           <div style={{fontWeight: 600}}>Ancient term:</div>
           <div><span className="text-btn" onClick={() => navigate(IDENTIFICATION_DATA.ancientTerm.route)}>{IDENTIFICATION_DATA.ancientTerm.name} →</span></div>
        </div>
        <div className="term-row" style={{border: 'none', padding: '0.25rem 0'}}>
           <div style={{fontWeight: 600}}>Identified as:</div>
           <div><span className="text-btn" onClick={() => navigate(IDENTIFICATION_DATA.identifiedAs.route)}>{IDENTIFICATION_DATA.identifiedAs.name} →</span></div>
        </div>
        <div className="term-row" style={{border: 'none', padding: '0.25rem 0'}}>
           <div style={{fontWeight: 600}}>Material source:</div>
           <div><span className="text-btn" onClick={() => navigate(IDENTIFICATION_DATA.materialSource.route)}>{IDENTIFICATION_DATA.materialSource.name} →</span></div>
        </div>
         <div className="term-row" style={{border: 'none', padding: '0.25rem 0', marginTop: '1rem'}}>
           <div style={{fontWeight: 600}}>Confidence:</div>
           <div><span className={`confidence-badge ${IDENTIFICATION_DATA.confidence}`}>{IDENTIFICATION_DATA.confidence}</span></div>
        </div>
      </div>

      <div className="product-section">
        <h2>SOURCE</h2>
        <p style={{marginBottom: '0.5rem'}}><strong>{IDENTIFICATION_DATA.source.citation}</strong></p>
        <p style={{marginTop: 0}}>Pages: {IDENTIFICATION_DATA.source.pages}</p>
        <button className="text-btn">[View work →]</button>
      </div>

      <div className="product-section" style={{borderBottom: 'none'}}>
        <h2>NOTES</h2>
        <p style={{maxWidth: '800px'}}>{IDENTIFICATION_DATA.notes}</p>
      </div>
    </div>
  );
};

