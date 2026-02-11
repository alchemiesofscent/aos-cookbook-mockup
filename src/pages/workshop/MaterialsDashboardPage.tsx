import React from "react";
import { MaterialsSubNav } from "../../components/MaterialsSubNav";

export const MaterialsDashboardPage = ({ navigate }) => {
  return (
    <div className="page-container">
      <div className="workshop-header">
        <h1>MATERIALS</h1>
        <MaterialsSubNav navigate={navigate} active="dashboard" />
        <p className="intro-text">
          Ancient perfumery materials are complex. Explore our Dictionary of Ancient Terms, browse modern Ingredient Profiles, or study the biological Material Sources.
        </p>
      </div>

      <div className="workshop-grid" style={{gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))'}}>
        <div className="workshop-card" onClick={() => navigate('terms')} style={{display: 'flex', flexDirection: 'column', height: '100%', minHeight: '250px'}}>
           <div className="card-top">
            <h3>Ancient Terms</h3>
            <span className="lang-tag">Dictionary</span>
          </div>
          <p className="def" style={{fontSize: '1rem', lineHeight: '1.6', margin: '1rem 0', flex: 1}}>
            A philological dictionary of botanical, chemical, and technical terminology found in ancient Greek and Latin texts.
          </p>
          <span className="link-text">Browse Dictionary &rarr;</span>
        </div>
        
        <div className="workshop-card" onClick={() => navigate('ingredients')} style={{display: 'flex', flexDirection: 'column', height: '100%', minHeight: '250px'}}>
          <div className="card-top">
            <h3>Ingredients</h3>
            <span className="type-tag">Profiles</span>
          </div>
          <p className="def" style={{fontSize: '1rem', lineHeight: '1.6', margin: '1rem 0', flex: 1}}>
            Modern chemical and sensory profiles of the ingredients used in our reconstructions, indexed A-Z.
          </p>
          <span className="link-text">Browse Ingredients &rarr;</span>
        </div>
        
        <div className="workshop-card" onClick={() => navigate('sources')} style={{display: 'flex', flexDirection: 'column', height: '100%', minHeight: '250px'}}>
           <div className="card-top">
            <h3>Material Sources</h3>
            <span className="type-tag">Biology</span>
          </div>
          <p className="def" style={{fontSize: '1rem', lineHeight: '1.6', margin: '1rem 0', flex: 1}}>
            The biological taxonomy of the plants, animals, and minerals that yield the raw materials of perfumery.
          </p>
          <span className="link-text">Browse Sources &rarr;</span>
        </div>
      </div>
    </div>
  );
};
