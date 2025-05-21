import React from 'react';
import { IonCard, IonCardHeader, IonCardTitle, IonCardContent, IonLabel, IonProgressBar } from '@ionic/react';

interface ScoreCardProps {
  title: string;
  score: number; // 0 - 100
  color?: string; // ionic color name
}

const ScoreCard: React.FC<ScoreCardProps> = ({ title, score, color = 'primary' }) => {
  return (
    <IonCard>
      <IonCardHeader>
        <IonCardTitle className="ion-text-center">{title}</IonCardTitle>
      </IonCardHeader>
      <IonCardContent>
        <div className="ion-text-center ion-padding-bottom">
          <IonLabel color="light" className="ion-text-center" style={{ fontSize: '1.5rem' }}>
            {score}%
          </IonLabel>
        </div>
        <IonProgressBar color={color} value={score / 100} />
      </IonCardContent>
    </IonCard>
  );
};

export default ScoreCard; 