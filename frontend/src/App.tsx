import React from 'react';
import { AmplifyAuthenticator } from '@aws-amplify/ui-react';
import { makeStyles } from "@material-ui/core/styles";
import './App.css';
import MediaList from './components/MediaList';
import { MusicPlayerProvider } from './context/MusicPlayerContext';
import PlayerControls from './components/AudioPlayer';

const useStyles = makeStyles(theme => ({
  authenticator: {
    'text-align': 'center'
  }
}));

function App() {
  const classes = useStyles();
  return (
    <AmplifyAuthenticator usernameAlias="username" className={classes.authenticator}>
      <MusicPlayerProvider>
        <div className="App">
          <PlayerControls />
          <MediaList />
        </div>
      </MusicPlayerProvider>
    </AmplifyAuthenticator>
  );
}

export default App;
