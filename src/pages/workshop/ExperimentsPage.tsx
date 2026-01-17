import React from "react";
import { Icons } from "../../components/Icons";

export const ExperimentsPage = ({ navigate }) => (
    <div className="page-container">
        <div className="back-link" onClick={() => navigate('workshop')}>
            <Icons.ArrowLeft /> Back to Workshop
        </div>
        <div className="archive-intro">
            <h1>EXPERIMENTS</h1>
            <p>Replication stories and chemical analysis.</p>
        </div>
        <div className="section-block">
            <p style={{fontStyle: 'italic', color: 'var(--color-stone)'}}>Coming soon...</p>
        </div>
    </div>
);

