import React from 'react';
import { withAuthenticator } from "aws-amplify-react";
import './App.css';
import MediaList from './components/MediaList';
import { MusicPlayerProvider } from './context/MusicPlayerContext';
import PlayerControls from './components/AudioPlayer';

function App() {
  return (
    <MusicPlayerProvider>
      <div className="App">
        <PlayerControls />
        <MediaList />
      </div>
    </MusicPlayerProvider>
  );
}

const AuthenticatedApp = withAuthenticator(App, false);

export default AuthenticatedApp;
