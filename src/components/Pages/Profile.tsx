import React from 'react';
import { Settings } from './Settings';

export function Profile({ onNavigate }: { onNavigate?: (path: string) => void }) {
  return <Settings onNavigate={onNavigate} />;
}
