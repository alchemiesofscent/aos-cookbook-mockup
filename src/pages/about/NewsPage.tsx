import React from "react";
import { Icons } from "../../components/Icons";

export const NewsPage = ({ navigate }) => (
  <div className="page-container">
    <div className="back-link" onClick={() => navigate('about')}>
      <Icons.ArrowLeft /> Back to About
    </div>
    <h1 className="hero-title">News & Updates</h1>
    <div className="section-block">
      <div className="metadata-box" style={{width: '100%', marginBottom: '1.5rem'}}>
        <div className="meta-row">
          <span style={{fontWeight: 600}}>Publication Release</span>
          <span style={{color: 'var(--color-stone)'}}>October 2023</span>
        </div>
        <p className="reading">Our latest paper on the reconstruction of the Mendesian perfume has been published in the American Journal of Archaeology.</p>
      </div>
      <div className="metadata-box" style={{width: '100%', marginBottom: '1.5rem'}}>
        <div className="meta-row">
          <span style={{fontWeight: 600}}>Conference Presentation</span>
          <span style={{color: 'var(--color-stone)'}}>September 2023</span>
        </div>
        <p className="reading">The team presented findings on resin distillation at the International Conference on History of Chemistry.</p>
      </div>
    </div>
  </div>
);
