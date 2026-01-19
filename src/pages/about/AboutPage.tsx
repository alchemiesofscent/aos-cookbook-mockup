import React from "react";

export const AboutPage = ({ navigate }) => {
  return (
    <div className="page-container">
      <div className="library-hero">
        <h1 className="hero-title">About Alchemies of Scent</h1>
        <p className="intro-text reading">
            Unlocking the olfactory heritage of the ancient world through history, science, and experimental reconstruction.
        </p>
      </div>

      <div className="library-grid">
         {/* Card 1: Project */}
         <div className="library-section-card" onClick={() => navigate('project')}>
            <span className="library-count">Mission & Methods</span>
            <h2>The Project</h2>
            <p>Our methodology combines text-based historical research with chemical analysis to recreate ancient perfumes.</p>
            <button className="text-btn">Read Mission &rarr;</button>
         </div>
         {/* Card 2: Team */}
         <div className="library-section-card" onClick={() => navigate('team')}>
            <span className="library-count">Researchers</span>
            <h2>The Team</h2>
            <p>An international collaboration of historians of science, classicists, and organic chemists.</p>
            <button className="text-btn">Meet the Team &rarr;</button>
         </div>
         {/* Card 3: News */}
         <div className="library-section-card" onClick={() => navigate('news')}>
             <span className="library-count">Updates</span>
            <h2>News & Events</h2>
            <p>Recent publications, media coverage, and conference presentations from the research group.</p>
            <button className="text-btn">View Updates &rarr;</button>
         </div>
      </div>
    </div>
  );
};
