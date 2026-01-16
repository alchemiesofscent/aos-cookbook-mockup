import React from "react";

export const MaterialsSubNav = ({ navigate, active }) => (
  <div className="materials-nav">
     <button className={active === 'dashboard' ? 'active' : ''} onClick={() => navigate('materials')}>Overview</button>
     <button className={active === 'terms' ? 'active' : ''} onClick={() => navigate('terms')}>Ancient Terms</button>
     <button className={active === 'ingredients' ? 'active' : ''} onClick={() => navigate('ingredients')}>Ingredients</button>
     <button className={active === 'sources' ? 'active' : ''} onClick={() => navigate('sources')}>Material Sources</button>
  </div>
);

