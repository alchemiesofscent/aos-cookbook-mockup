import React from "react";

export const LibraryPage = ({ navigate }) => {
  return (
    <div className="page-container">
      <div className="library-hero">
        <h1>The Library</h1>
        <p className="intro-text">
            The central repository for the Alchemies of Scent project, containing primary sources, translations, and prosopographical data.
        </p>
      </div>

      <div className="library-grid">
         {/* Card 1: Recipes */}
         <div className="library-section-card" onClick={() => navigate('archive')}>
            <span className="library-count">47 Items</span>
            <h2>Recipes</h2>
            <p>A curated collection of perfume recipes from Greco-Egyptian antiquity, annotated with linguistic and chemical data.</p>
            <button className="text-btn">Browse Recipes &rarr;</button>
         </div>
         {/* Card 2: Works */}
         <div className="library-section-card" onClick={() => navigate('works')}>
            <span className="library-count">12 Items</span>
            <h2>Works</h2>
            <p>Full texts and treatises on botany, medicine, and pharmacology from the classical period.</p>
            <button className="text-btn">Browse Works &rarr;</button>
         </div>
         {/* Card 3: People */}
         <div className="library-section-card" onClick={() => navigate('people')}>
             <span className="library-count">28 Items</span>
            <h2>People</h2>
            <p>Biographies of ancient authors, perfumers, and historical figures related to the trade.</p>
            <button className="text-btn">Browse People &rarr;</button>
         </div>
      </div>
    </div>
  );
};

