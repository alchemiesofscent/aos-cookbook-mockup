import React from "react";
import { Icons } from "../../components/Icons";

export const ProjectPage = ({ navigate }) => (
  <div className="page-container">
    <div className="back-link" onClick={() => navigate('about')}>
      <Icons.ArrowLeft /> Back to About
    </div>
    <h1>About the Project</h1>
    <div className="section-block">
      <p style={{fontSize: '1.25rem', marginBottom: '2rem'}}>Alchemies of Scent reconstructs the sensory past of antiquity through the interdisciplinary study of perfumery.</p>
      <p>Combining historical analysis, linguistic studies, and experimental archaeology, we aim to understand how ancient civilizations created, used, and understood scent.</p>
    </div>
  </div>
);

